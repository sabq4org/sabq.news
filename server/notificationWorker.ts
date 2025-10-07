import cron from "node-cron";
import { db } from "./db";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import { notificationQueue, notificationsInbox, notificationMetrics } from "@shared/schema";

async function processNotificationQueue() {
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
        
        if (queueItem.type === "BREAKING_NEWS") {
          title = "⚡ عاجل";
          body = payload.articleTitle || "خبر عاجل جديد";
          deeplink = `/article/${payload.articleSlug || payload.articleId}`;
        } else if (queueItem.type === "NEW_ARTICLE") {
          title = "📰 مقال جديد";
          body = payload.articleTitle || "مقال جديد في اهتماماتك";
          deeplink = `/article/${payload.articleSlug || payload.articleId}`;
        } else if (queueItem.type === "TRENDING_TOPIC") {
          title = "🔥 موضوع رائج";
          body = payload.matchedTopic || "موضوع رائج قد يهمك";
          deeplink = payload.deeplink;
        } else if (queueItem.type === "PERSONALIZED_RECOMMENDATION") {
          title = "💡 موصى به لك";
          body = payload.articleTitle || "مقال قد يعجبك";
          deeplink = `/article/${payload.articleSlug || payload.articleId}`;
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
  }
}

export function startNotificationWorker() {
  console.log("[NotificationWorker] Starting notification worker...");

  // Process queue every minute
  cron.schedule("*/1 * * * *", () => {
    processNotificationQueue();
  });

  // Cleanup old notifications daily at 3 AM
  cron.schedule("0 3 * * *", () => {
    cleanupOldNotifications();
  });

  console.log("[NotificationWorker] Notification worker started successfully");
  
  // Run initial processing
  processNotificationQueue();
}
