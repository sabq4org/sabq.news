import { db } from "./db";
import { 
  users, 
  articles, 
  userNotificationPrefs,
  userInterests,
  interests,
  reactions,
  bookmarks,
  notificationQueue,
  notificationsInbox,
  notificationMetrics,
} from "@shared/schema";
import { eq, and, or, desc, sql, inArray, gt, lt } from "drizzle-orm";

interface NotificationPayload {
  articleId?: string;
  articleTitle?: string;
  articleSlug?: string;
  matchedTopic?: string;
  deeplink?: string;
  imageUrl?: string;
}

// Notification type definitions
export const NotificationTypes = {
  BREAKING_NEWS: "BreakingNews",
  INTEREST_MATCH: "InterestMatch",
  LIKED_STORY_UPDATE: "LikedStoryUpdate",
  MOST_READ_TODAY: "MostReadTodayForYou",
} as const;

// Throttle settings: max 3 notifications per 12 hours, 1 per 20 minutes
const THROTTLE_MAX_PER_12H = 3;
const THROTTLE_MIN_INTERVAL_MINUTES = 20;

/**
 * Check if user can receive a notification based on throttle limits
 */
async function canSendToUser(userId: string): Promise<boolean> {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

  // Check 12-hour limit
  const [count12h] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notificationsInbox)
    .where(
      and(
        eq(notificationsInbox.userId, userId),
        gt(notificationsInbox.createdAt, twelveHoursAgo)
      )
    );

  if (Number(count12h?.count || 0) >= THROTTLE_MAX_PER_12H) {
    return false;
  }

  // Check 20-minute interval
  const [recentNotif] = await db
    .select()
    .from(notificationsInbox)
    .where(
      and(
        eq(notificationsInbox.userId, userId),
        gt(notificationsInbox.createdAt, twentyMinutesAgo)
      )
    )
    .limit(1);

  return !recentNotif;
}

/**
 * Check if user is in quiet hours
 */
async function isInQuietHours(userId: string): Promise<boolean> {
  const [prefs] = await db
    .select()
    .from(userNotificationPrefs)
    .where(eq(userNotificationPrefs.userId, userId))
    .limit(1);

  if (!prefs || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMin] = prefs.quietHoursStart.split(":").map(Number);
  const [endHour, endMin] = prefs.quietHoursEnd.split(":").map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle overnight quiet hours
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
}

/**
 * Check for duplicate notification
 */
async function isDuplicate(userId: string, articleId: string, type: string): Promise<boolean> {
  const dedupeKey = `${userId}:${articleId}:${type}`;
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [existing] = await db
    .select()
    .from(notificationsInbox)
    .where(
      and(
        eq(notificationsInbox.userId, userId),
        eq(sql`${notificationsInbox.metadata}->>'articleId'`, articleId),
        eq(notificationsInbox.type, type),
        gt(notificationsInbox.createdAt, last24h)
      )
    )
    .limit(1);

  return !!existing;
}

/**
 * Send notification to inbox (respecting policies)
 */
async function sendToInbox(
  userId: string,
  type: string,
  title: string,
  body: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // Check throttle
    const canSend = await canSendToUser(userId);
    if (!canSend) {
      console.log(`⏳ Throttled notification for user ${userId}`);
      return false;
    }

    // Check quiet hours (allow inbox, just don't push)
    const inQuietHours = await isInQuietHours(userId);
    if (inQuietHours) {
      console.log(`🌙 User ${userId} in quiet hours - inbox only`);
    }

    // Check duplicate
    if (payload.articleId) {
      const isDupe = await isDuplicate(userId, payload.articleId, type);
      if (isDupe) {
        console.log(`🔁 Duplicate notification prevented for user ${userId}`);
        return false;
      }
    }

    // Create notification
    await db.insert(notificationsInbox).values({
      userId,
      type,
      title,
      body,
      deeplink: payload.deeplink || "",
      metadata: {
        articleId: payload.articleId,
        imageUrl: payload.imageUrl,
      },
    });

    console.log(`✅ Notification sent to user ${userId}: ${type}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Handle Breaking News notification
 */
export async function notifyBreakingNews(articleId: string): Promise<void> {
  try {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);

    if (!article || article.newsType !== "breaking") {
      return;
    }

    // Get all users with breaking news enabled
    const enabledUsers = await db
      .select({ userId: userNotificationPrefs.userId })
      .from(userNotificationPrefs)
      .where(eq(userNotificationPrefs.breaking, true));

    console.log(`📢 Sending breaking news to ${enabledUsers.length} users`);

    for (const { userId } of enabledUsers) {
      await sendToInbox(
        userId,
        NotificationTypes.BREAKING_NEWS,
        "عاجل الآن",
        `خبر عاجل: ${article.title}. تابع التفاصيل حالًا.`,
        {
          articleId: article.id,
          articleTitle: article.title,
          articleSlug: article.slug,
          deeplink: `/news/${article.slug}`,
          imageUrl: article.imageUrl || undefined,
        }
      );
    }
  } catch (error) {
    console.error("Error in notifyBreakingNews:", error);
  }
}

/**
 * Handle Interest Match notification
 */
export async function notifyInterestMatch(articleId: string): Promise<void> {
  try {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);

    if (!article) {
      return;
    }

    // Get article keywords from SEO
    const articleKeywords = article.seo?.keywords || [];
    if (articleKeywords.length === 0) {
      return;
    }

    // Find users with matching interests
    const matchingUsers = await db
      .select({
        userId: userInterests.userId,
        interestSlug: interests.slug,
        interestNameAr: interests.nameAr,
      })
      .from(userInterests)
      .innerJoin(interests, eq(userInterests.interestId, interests.id))
      .innerJoin(userNotificationPrefs, eq(userInterests.userId, userNotificationPrefs.userId))
      .where(
        and(
          inArray(interests.slug, articleKeywords),
          eq(userNotificationPrefs.interest, true)
        )
      );

    console.log(`🎯 Sending interest match to ${matchingUsers.length} users`);

    // Group by user to avoid duplicates
    const userMap = new Map<string, string>();
    for (const { userId, interestNameAr } of matchingUsers) {
      if (!userMap.has(userId)) {
        userMap.set(userId, interestNameAr);
      }
    }

    for (const [userId, matchedTopic] of Array.from(userMap.entries())) {
      await sendToInbox(
        userId,
        NotificationTypes.INTEREST_MATCH,
        "قد يهمّك الآن",
        `نشرنا موضوعًا جديدًا عن «${matchedTopic}»: ${article.title}.`,
        {
          articleId: article.id,
          articleTitle: article.title,
          articleSlug: article.slug,
          matchedTopic,
          deeplink: `/news/${article.slug}`,
          imageUrl: article.imageUrl || undefined,
        }
      );
    }
  } catch (error) {
    console.error("Error in notifyInterestMatch:", error);
  }
}

/**
 * Handle Liked Story Update notification
 */
export async function notifyLikedStoryUpdate(articleId: string): Promise<void> {
  try {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);

    if (!article) {
      return;
    }

    // Find users who liked or bookmarked related articles (same keywords)
    const articleKeywords = article.seo?.keywords || [];
    if (articleKeywords.length === 0) {
      return;
    }

    // Get users who have liked articles with same keywords
    const interestedUsers = await db
      .selectDistinct({ userId: reactions.userId })
      .from(reactions)
      .innerJoin(articles, eq(reactions.articleId, articles.id))
      .innerJoin(userNotificationPrefs, eq(reactions.userId, userNotificationPrefs.userId))
      .where(
        and(
          sql`${articles.seo}->>'keywords' ?| ${articleKeywords}`,
          eq(userNotificationPrefs.likedUpdates, true)
        )
      );

    console.log(`💝 Sending liked story update to ${interestedUsers.length} users`);

    for (const { userId } of interestedUsers) {
      await sendToInbox(
        userId,
        NotificationTypes.LIKED_STORY_UPDATE,
        "تحديث على مادة أعجبتك",
        `تم نشر متابعة/تحديث لـ: ${article.title}. اطّلع على الجديد.`,
        {
          articleId: article.id,
          articleTitle: article.title,
          articleSlug: article.slug,
          deeplink: `/news/${article.slug}`,
          imageUrl: article.imageUrl || undefined,
        }
      );
    }
  } catch (error) {
    console.error("Error in notifyLikedStoryUpdate:", error);
  }
}

/**
 * Daily job: Send "Most Read Today" notifications
 */
export async function notifyMostReadToday(): Promise<void> {
  try {
    // Get users with mostRead enabled
    const enabledUsers = await db
      .select({
        userId: userNotificationPrefs.userId,
      })
      .from(userNotificationPrefs)
      .where(eq(userNotificationPrefs.mostRead, true));

    for (const { userId } of enabledUsers) {
      // Get user interests
      const userInterestsList = await db
        .select({ slug: interests.slug })
        .from(userInterests)
        .innerJoin(interests, eq(userInterests.interestId, interests.id))
        .where(eq(userInterests.userId, userId));

      const userInterestSlugs = userInterestsList.map((i) => i.slug);
      if (userInterestSlugs.length === 0) {
        continue;
      }

      // Find most viewed article today matching user interests
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [topArticle] = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.status, "published"),
            gt(articles.publishedAt, today),
            sql`${articles.seo}->>'keywords' ?| ${userInterestSlugs}`
          )
        )
        .orderBy(desc(articles.views))
        .limit(1);

      if (!topArticle) {
        continue;
      }

      await sendToInbox(
        userId,
        NotificationTypes.MOST_READ_TODAY,
        "الأكثر قراءة اليوم",
        `اليوم أكثر مادة قراءة بين اهتماماتك: ${topArticle.title}. يمكن يهمّك.`,
        {
          articleId: topArticle.id,
          articleTitle: topArticle.title,
          articleSlug: topArticle.slug,
          deeplink: `/news/${topArticle.slug}`,
          imageUrl: topArticle.imageUrl || undefined,
        }
      );
    }

    console.log(`📊 Most Read Today notifications sent to ${enabledUsers.length} users`);
  } catch (error) {
    console.error("Error in notifyMostReadToday:", error);
  }
}
