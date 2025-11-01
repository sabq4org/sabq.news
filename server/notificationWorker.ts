import cron from "node-cron";
import { db } from "./db";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import { notificationQueue, notificationsInbox, notificationMetrics, articles } from "@shared/schema";
import { storage } from "./storage";

let isProcessingQueue = false;
let isPublishing = false;
let isProcessingAnnouncements = false;
let isProcessingDigests = false;
let isProcessingRecommendations = false;

async function processNotificationQueue() {
  if (isProcessingQueue) {
    console.log("[NotificationWorker] ⏭️ Skipping - already processing");
    return;
  }
  
  isProcessingQueue = true;
  try {
    console.log("[NotificationWorker] Starting queue processing...");

    // Fetch pending notifications ready to be delivered
    const pendingNotifications = await db
      .select()
      .from(notificationQueue)
      .where(
        and(
          eq(notificationQueue.status, "queued"),
          isNull(notificationQueue.sentAt),
          lte(
            sql`COALESCE(${notificationQueue.scheduledAt}, ${notificationQueue.createdAt})`,
            new Date()
          )
        )
      )
      .orderBy(notificationQueue.priority, notificationQueue.createdAt)
      .limit(100); // Process in batches

    console.log(`[NotificationWorker] Found ${pendingNotifications.length} notifications to process`);

    for (const queueItem of pendingNotifications) {
      try {
        // Extract notification data from payload
        const payload = queueItem.payload as any;
        
        // Determine title and body based on notification type
        let title = "";
        let body = "";
        let deeplink = payload.deeplink || null;
        
        if (queueItem.type === "BreakingNews") {
          title = "⚡ عاجل";
          body = payload.articleTitle || "خبر عاجل جديد";
          deeplink = `/article/${payload.articleSlug || payload.articleId}`;
        } else if (queueItem.type === "InterestMatch") {
          title = "📰 مقال جديد";
          body = payload.articleTitle || "مقال جديد في اهتماماتك";
          deeplink = `/article/${payload.articleSlug || payload.articleId}`;
        } else if (queueItem.type === "LikedStoryUpdate") {
          title = "🔔 تحديث";
          body = payload.articleTitle || "تحديث على مقال أعجبك";
          deeplink = `/article/${payload.articleSlug || payload.articleId}`;
        } else if (queueItem.type === "MostReadTodayForYou") {
          title = "🔥 الأكثر قراءة";
          body = payload.articleTitle || "الأكثر قراءة اليوم في اهتماماتك";
          deeplink = `/article/${payload.articleSlug || payload.articleId}`;
        } else {
          // Fallback for unrecognized types
          title = "📬 إشعار جديد";
          body = payload.articleTitle || "لديك إشعار جديد";
          deeplink = payload.deeplink || "/";
          console.warn(`[NotificationWorker] Unknown notification type: ${queueItem.type}`);
        }

        // Create inbox notification
        const [inboxNotification] = await db
          .insert(notificationsInbox)
          .values({
            userId: queueItem.userId,
            type: queueItem.type,
            title,
            body,
            deeplink,
            read: false,
            metadata: {
              articleId: payload.articleId,
              imageUrl: payload.imageUrl,
              categorySlug: payload.categorySlug,
            },
          })
          .returning();

        // Mark queue item as sent
        await db
          .update(notificationQueue)
          .set({
            sentAt: new Date(),
            status: "sent",
          })
          .where(eq(notificationQueue.id, queueItem.id));

        // Create metrics entry for tracking
        await db.insert(notificationMetrics).values({
          notificationId: inboxNotification.id,
          userId: queueItem.userId,
          type: queueItem.type,
          opened: false,
          clicked: false,
          dismissed: false,
        });

        console.log(`[NotificationWorker] Delivered notification ${queueItem.id} to user ${queueItem.userId}`);
      } catch (error) {
        console.error(`[NotificationWorker] Error processing notification ${queueItem.id}:`, error);

        // Mark as error
        await db
          .update(notificationQueue)
          .set({
            sentAt: new Date(),
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(notificationQueue.id, queueItem.id));
      }
    }

    console.log("[NotificationWorker] Queue processing completed");
  } catch (error) {
    console.error("[NotificationWorker] Error in queue processing:", error);
  } finally {
    isProcessingQueue = false;
  }
}

async function cleanupOldNotifications() {
  try {
    console.log("[NotificationWorker] Starting cleanup of old notifications...");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old sent queue items
    const deletedQueue = await db
      .delete(notificationQueue)
      .where(
        and(
          lte(notificationQueue.createdAt, thirtyDaysAgo),
          eq(notificationQueue.status, "sent")
        )
      );

    // Delete old read notifications from inbox
    const deletedInbox = await db
      .delete(notificationsInbox)
      .where(
        and(
          lte(notificationsInbox.createdAt, thirtyDaysAgo),
          eq(notificationsInbox.read, true)
        )
      );

    console.log(`[NotificationWorker] Cleanup completed. Deleted ${deletedQueue.rowCount || 0} queue items and ${deletedInbox.rowCount || 0} inbox items`);
  } catch (error) {
    console.error("[NotificationWorker] Error in cleanup:", error);
    // Don't throw - just log and continue
  }
}

async function publishScheduledArticles() {
  if (isPublishing) {
    console.log("[ScheduledPublisher] ⏭️ Skipping - already publishing");
    return;
  }
  
  isPublishing = true;
  try {
    console.log("[ScheduledPublisher] Checking for scheduled articles...");

    const now = new Date();

    // Find articles that are scheduled and ready to be published
    const scheduledArticles = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, "scheduled"),
          lte(articles.scheduledAt, now)
        )
      );

    console.log(`[ScheduledPublisher] Found ${scheduledArticles.length} articles ready to publish`);

    for (const article of scheduledArticles) {
      try {
        const publishTime = new Date();
        
        // Update article status and publishedAt
        await db
          .update(articles)
          .set({
            status: "published",
            publishedAt: publishTime,
            updatedAt: publishTime,
          })
          .where(eq(articles.id, article.id));

        console.log(`[ScheduledPublisher] ✅ Published article: ${article.id} - ${article.title}`);

        // Link article to story
        try {
          const { matchAndLinkArticle } = await import("./storyMatcher");
          await matchAndLinkArticle(article.id);
          console.log(`[ScheduledPublisher] ✅ Linked article to story: ${article.id}`);
        } catch (error) {
          console.error(`[ScheduledPublisher] ⚠️ Error linking article to story ${article.id}:`, error);
        }

        // Send notifications based on news type
        try {
          const { sendArticleNotification } = await import("./notificationService");
          const notificationType = article.newsType === 'breaking' ? 'breaking' : 
                                   article.isFeatured ? 'featured' : 'published';
          await sendArticleNotification(article, notificationType);
          console.log(`[ScheduledPublisher] ✅ Sent ${notificationType} notifications for article: ${article.id}`);
        } catch (error) {
          console.error(`[ScheduledPublisher] ⚠️ Error sending notifications for article ${article.id}:`, error);
        }

        // Log activity
        try {
          const { logActivity } = await import("./rbac");
          await logActivity({
            userId: article.authorId,
            action: 'ArticlePublished',
            entityType: 'Article',
            entityId: article.id,
          });
        } catch (error) {
          console.error(`[ScheduledPublisher] ⚠️ Error logging activity for article ${article.id}:`, error);
        }

      } catch (error) {
        console.error(`[ScheduledPublisher] ❌ Error publishing article ${article.id}:`, error);
      }
    }

    if (scheduledArticles.length > 0) {
      console.log(`[ScheduledPublisher] ✅ Successfully published ${scheduledArticles.length} scheduled articles`);
    }
  } catch (error) {
    console.error("[ScheduledPublisher] ❌ Error in scheduled publishing:", error);
  } finally {
    isPublishing = false;
  }
}

// Daily digest processor
async function processDailyDigestsWorker() {
  if (isProcessingDigests) {
    console.log("[DigestWorker] ⏭️ Skipping - already processing");
    return;
  }
  
  isProcessingDigests = true;
  try {
    const { processDailyDigests } = await import('./digestService');
    await processDailyDigests();
  } catch (error) {
    console.error("[DigestWorker] Error processing daily digests:", error);
  } finally {
    isProcessingDigests = false;
  }
}

// Smart recommendation processor
async function processRecommendationsWorker() {
  if (isProcessingRecommendations) {
    console.log("🤖 [REC WORKER] ⏭️ Skipping - already processing");
    return;
  }
  
  isProcessingRecommendations = true;
  try {
    console.log("🤖 [REC WORKER] Starting recommendation processing...");
    
    const { userEvents } = await import('@shared/schema');
    const { processUserRecommendations } = await import('./recommendationNotificationService');
    
    // Get active users (those who had activity in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const activeUsers = await db
      .selectDistinct({ userId: userEvents.userId })
      .from(userEvents)
      .where(sql`${userEvents.createdAt} > ${oneDayAgo}`)
      .limit(50); // Process 50 users per run
    
    console.log(`🤖 [REC WORKER] Found ${activeUsers.length} active users`);
    
    let processed = 0;
    let successful = 0;
    
    for (const { userId } of activeUsers) {
      try {
        await processUserRecommendations(userId);
        successful++;
      } catch (error) {
        console.error(`❌ [REC WORKER] Error for user ${userId}:`, error);
      }
      processed++;
    }
    
    console.log(`✅ [REC WORKER] Processed ${processed} users, ${successful} successful`);
  } catch (error) {
    console.error("[REC WORKER] Error in recommendation processing:", error);
  } finally {
    isProcessingRecommendations = false;
  }
}

export function startNotificationWorker() {
  try {
    console.log("[NotificationWorker] Starting notification worker...");

    // Process queue every minute
    cron.schedule("*/1 * * * *", () => {
      processNotificationQueue().catch(error => {
        console.error("[NotificationWorker] Cron job error:", error);
      });
    });

    // Publish scheduled articles every minute
    cron.schedule("*/1 * * * *", () => {
      publishScheduledArticles().catch(error => {
        console.error("[ScheduledPublisher] Cron job error:", error);
      });
    });

    // Cleanup old notifications daily at 3 AM
    cron.schedule("0 3 * * *", () => {
      cleanupOldNotifications().catch(error => {
        console.error("[NotificationWorker] Cleanup cron job error:", error);
      });
    });

    // Process daily digests every hour (users have 30-minute delivery windows)
    cron.schedule("0 * * * *", () => {
      processDailyDigestsWorker().catch(error => {
        console.error("[DigestWorker] Cron job error:", error);
      });
    });

    // Process smart recommendations every 2 hours
    cron.schedule("0 */2 * * *", () => {
      processRecommendationsWorker().catch(error => {
        console.error("[REC WORKER] Cron job error:", error);
      });
    });

    // Process scheduled announcements every minute (auto-publish/expire)
    cron.schedule("*/1 * * * *", () => {
      processScheduledAnnouncements().catch(error => {
        console.error("[AnnouncementScheduler] Cron job error:", error);
      });
    });

    console.log("[NotificationWorker] Notification worker started successfully");
    console.log("[ScheduledPublisher] Scheduled article publisher started successfully");
    console.log("[DigestWorker] Daily digest worker started successfully");
    console.log("[REC WORKER] Smart recommendation worker started successfully");
    console.log("[AnnouncementScheduler] Announcement scheduler started successfully");
    
    // Run initial processing in a non-blocking way
    processNotificationQueue().catch(error => {
      console.error("[NotificationWorker] Initial processing error:", error);
    });

    // Run initial scheduled publishing check
    publishScheduledArticles().catch(error => {
      console.error("[ScheduledPublisher] Initial publishing check error:", error);
    });

    // Run initial announcement scheduling check
    processScheduledAnnouncements().catch(error => {
      console.error("[AnnouncementScheduler] Initial scheduling check error:", error);
    });
  } catch (error) {
    console.error("[NotificationWorker] Failed to start notification worker:", error);
    throw error; // Re-throw so the main server can handle it
  }
}

// Process scheduled announcements (auto-publish and auto-expire)
async function processScheduledAnnouncements() {
  if (isProcessingAnnouncements) {
    console.log("[AnnouncementScheduler] ⏭️ Skipping - already processing");
    return;
  }
  
  isProcessingAnnouncements = true;
  try {
    await storage.processScheduledAnnouncements();
  } catch (error) {
    console.error("[AnnouncementScheduler] Error processing scheduled announcements:", error);
  } finally {
    isProcessingAnnouncements = false;
  }
}
