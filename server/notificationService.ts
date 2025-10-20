import { db } from "./db";
import { 
  notificationsInbox,
  userNotificationPrefs,
  userInterests,
  categories,
  articles,
} from "@shared/schema";
import { eq, and, or, desc, sql, gt } from "drizzle-orm";
import { notificationBus } from "./notificationBus";

// Arabic notification templates
const templates = {
  article_published: (article: any, categoryName: string) => ({
    title: "خبر جديد",
    body: `نُشر قبل قليل في ${categoryName}: ${article.title}`,
    type: "ArticlePublished"
  }),
  breaking_news: (article: any, categoryName: string) => ({
    title: "خبر عاجل",
    body: `عاجل في ${categoryName}: ${article.title}`,
    type: "BreakingNews"
  }),
  featured_article: (article: any) => ({
    title: "خبر مميّز",
    body: `مختار لك: ${article.title}`,
    type: "FeaturedArticle"
  })
};

/**
 * Check if notification is duplicate (within 60 minutes)
 */
async function isDuplicate(userId: string, articleId: string, type: string): Promise<boolean> {
  const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const [existing] = await db
    .select()
    .from(notificationsInbox)
    .where(
      and(
        eq(notificationsInbox.userId, userId),
        eq(sql`${notificationsInbox.metadata}->>'articleId'`, articleId),
        eq(notificationsInbox.type, type),
        gt(notificationsInbox.createdAt, sixtyMinutesAgo)
      )
    )
    .limit(1);

  return !!existing;
}

// Throttle removed - User controls notification volume via preferences
// If user wants notifications, they get them all
// If user doesn't want them, they turn them off in settings
// Deduplication (60 minutes) provides basic protection against spam

/**
 * Send article notification to interested users
 * 
 * @param article - The article object with all details
 * @param notificationType - Type: 'published' | 'breaking' | 'featured'
 */
export async function sendArticleNotification(
  article: any,
  notificationType: 'published' | 'breaking' | 'featured'
): Promise<void> {
  try {
    console.log(`📢 [NOTIFICATION] Sending ${notificationType} notification for article: ${article.title}`);
    console.log(`📢 [NOTIFICATION] Article ID: ${article.id}, Category: ${article.categoryId}`);

    // Get category name
    let categoryName = "سبق";
    if (article.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, article.categoryId))
        .limit(1);
      
      if (category) {
        categoryName = category.nameAr;
        console.log(`📢 [NOTIFICATION] Category found: ${categoryName}`);
      }
    }

    // Determine template and type
    let template;
    let notifType: string;
    let eligibleUsers: Array<{ userId: string }> = [];

    // DIAGNOSTIC MODE: Remove ALL restrictions - send to ALL users
    console.log(`📢 [NOTIFICATION] DIAGNOSTIC MODE: Fetching ALL users (no restrictions)`);
    
    const allUsers = await db
      .select({ userId: userNotificationPrefs.userId })
      .from(userNotificationPrefs);
    
    console.log(`📢 [NOTIFICATION] Total users with notification prefs: ${allUsers.length}`);

    if (notificationType === 'breaking') {
      template = templates.breaking_news(article, categoryName);
      notifType = "BreakingNews";
      eligibleUsers = allUsers; // ALL USERS

    } else if (notificationType === 'featured') {
      template = templates.featured_article(article);
      notifType = "FeaturedArticle";
      eligibleUsers = allUsers; // ALL USERS

    } else {
      template = templates.article_published(article, categoryName);
      notifType = "ArticlePublished";
      eligibleUsers = allUsers; // ALL USERS
    }

    console.log(`📢 [NOTIFICATION] Sending to ${eligibleUsers.length} users (ALL users - no filtering)`);

    // Send notification to each eligible user
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log(`📢 [NOTIFICATION] Starting to send notifications...`);
    
    for (const { userId } of eligibleUsers) {
      try {
        console.log(`📢 [NOTIFICATION] Processing user: ${userId}`);
        
        // DIAGNOSTIC: Skip deduplication check temporarily
        // const isDupe = await isDuplicate(userId, article.id, notifType);
        // if (isDupe) {
        //   console.log(`🔁 [NOTIFICATION] Duplicate notification prevented for user ${userId}`);
        //   skippedCount++;
        //   continue;
        // }
        
        console.log(`📢 [NOTIFICATION] Creating notification for user ${userId}`);

        // Create notification in inbox
        const [notification] = await db
          .insert(notificationsInbox)
          .values({
            userId,
            type: notifType,
            title: template.title,
            body: template.body,
            deeplink: `/article/${article.slug}`,
            read: false,
            metadata: {
              articleId: article.id,
              imageUrl: article.imageUrl || undefined,
              categorySlug: article.categoryId,
            },
          })
          .returning();

        console.log(`📢 [NOTIFICATION] Notification created in DB for user ${userId}, ID: ${notification.id}`);

        // Broadcast via SSE if user is connected
        notificationBus.emit(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          deeplink: notification.deeplink,
          read: false,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        });

        sentCount++;
        console.log(`✅ [NOTIFICATION] Notification sent to user ${userId} via inbox + SSE`);

      } catch (error) {
        errorCount++;
        console.error(`❌ [NOTIFICATION] Failed to send notification to user ${userId}:`, error);
      }
    }

    console.log(`📢 [NOTIFICATION] SUMMARY: Total=${eligibleUsers.length}, Sent=${sentCount}, Skipped=${skippedCount}, Errors=${errorCount}`);
    console.log(`📢 [NOTIFICATION] Successfully completed for article: ${article.title}`);

  } catch (error) {
    console.error("Error in sendArticleNotification:", error);
    throw error;
  }
}
