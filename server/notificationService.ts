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

    if (notificationType === 'breaking') {
      // Breaking news: send to all users with breaking enabled
      template = templates.breaking_news(article, categoryName);
      notifType = "BreakingNews";
      
      eligibleUsers = await db
        .select({ userId: userNotificationPrefs.userId })
        .from(userNotificationPrefs)
        .where(eq(userNotificationPrefs.breaking, true));

    } else if (notificationType === 'featured') {
      // Featured article: send to users interested in this category
      template = templates.featured_article(article);
      notifType = "FeaturedArticle";
      
      if (article.categoryId) {
        eligibleUsers = await db
          .select({ userId: userInterests.userId })
          .from(userInterests)
          .innerJoin(
            userNotificationPrefs,
            eq(userInterests.userId, userNotificationPrefs.userId)
          )
          .where(
            and(
              eq(userInterests.categoryId, article.categoryId),
              eq(userNotificationPrefs.interest, true)
            )
          );
      }

    } else {
      // Published article: send to users interested in this category
      template = templates.article_published(article, categoryName);
      notifType = "ArticlePublished";
      
      if (article.categoryId) {
        eligibleUsers = await db
          .select({ userId: userInterests.userId })
          .from(userInterests)
          .innerJoin(
            userNotificationPrefs,
            eq(userInterests.userId, userNotificationPrefs.userId)
          )
          .where(
            and(
              eq(userInterests.categoryId, article.categoryId),
              eq(userNotificationPrefs.interest, true)
            )
          );
      }
    }

    console.log(`📢 [NOTIFICATION] Found ${eligibleUsers.length} eligible users for ${notificationType} notification`);

    // Send notification to each eligible user
    let sentCount = 0;
    for (const { userId } of eligibleUsers) {
      try {
        // Check deduplication (60 minutes)
        const isDupe = await isDuplicate(userId, article.id, notifType);
        if (isDupe) {
          console.log(`🔁 Duplicate notification prevented for user ${userId}`);
          continue;
        }

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
        console.log(`✅ Notification sent to user ${userId}`);

      } catch (error) {
        console.error(`❌ Failed to send notification to user ${userId}:`, error);
      }
    }

    console.log(`📢 Successfully sent ${sentCount} notifications for article: ${article.title}`);

  } catch (error) {
    console.error("Error in sendArticleNotification:", error);
    throw error;
  }
}
