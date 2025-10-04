// Reference: javascript_database blueprint + javascript_log_in_with_replit blueprint
import { db } from "./db";
import { eq, desc, sql, and, inArray, ne } from "drizzle-orm";
import {
  users,
  categories,
  articles,
  rssFeeds,
  comments,
  reactions,
  bookmarks,
  readingHistory,
  userPreferences,
  interests,
  userInterests,
  behaviorLogs,
  sentimentScores,
  type User,
  type InsertUser,
  type UpdateUser,
  type Category,
  type InsertCategory,
  type Article,
  type InsertArticle,
  type RssFeed,
  type InsertRssFeed,
  type Comment,
  type InsertComment,
  type Reaction,
  type InsertReaction,
  type Bookmark,
  type InsertBookmark,
  type Interest,
  type InsertInterest,
  type UserInterest,
  type InsertUserInterest,
  type BehaviorLog,
  type InsertBehaviorLog,
  type SentimentScore,
  type InsertSentimentScore,
  type ArticleWithDetails,
  type CommentWithUser,
  type InterestWithWeight,
} from "@shared/schema";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }): Promise<User>;
  updateUser(id: string, userData: UpdateUser): Promise<User>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Article operations
  getArticles(filters?: {
    categoryId?: string;
    status?: string;
    authorId?: string;
    searchQuery?: string;
  }): Promise<ArticleWithDetails[]>;
  getArticleBySlug(slug: string, userId?: string): Promise<ArticleWithDetails | undefined>;
  getArticleById(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  incrementArticleViews(id: string): Promise<void>;
  getFeaturedArticle(userId?: string): Promise<ArticleWithDetails | undefined>;
  getRelatedArticles(articleId: string, categoryId?: string): Promise<ArticleWithDetails[]>;
  
  // RSS Feed operations
  getAllRssFeeds(): Promise<RssFeed[]>;
  createRssFeed(feed: InsertRssFeed): Promise<RssFeed>;
  updateRssFeedLastFetch(id: string): Promise<void>;
  
  // Comment operations
  getCommentsByArticle(articleId: string): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Reaction operations
  toggleReaction(articleId: string, userId: string): Promise<{ hasReacted: boolean }>;
  getReactionsByArticle(articleId: string): Promise<number>;
  
  // Bookmark operations
  toggleBookmark(articleId: string, userId: string): Promise<{ isBookmarked: boolean }>;
  getUserBookmarks(userId: string): Promise<ArticleWithDetails[]>;
  
  // Reading history operations
  recordArticleRead(userId: string, articleId: string, duration?: number): Promise<void>;
  getUserReadingHistory(userId: string, limit?: number): Promise<ArticleWithDetails[]>;
  
  // Recommendation operations
  getUserPreferences(userId: string): Promise<string[]>;
  getRecommendations(userId: string): Promise<ArticleWithDetails[]>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
  }>;
  
  // Interest operations
  getAllInterests(): Promise<Interest[]>;
  getUserInterests(userId: string): Promise<InterestWithWeight[]>;
  setUserInterests(userId: string, interestIds: string[]): Promise<void>;
  updateInterestWeight(userId: string, interestId: string, weight: number): Promise<void>;
  
  // Behavior tracking operations
  logBehavior(log: InsertBehaviorLog): Promise<void>;
  getUserBehaviorSummary(userId: string, days?: number): Promise<any>;
  
  // Sentiment analysis operations
  saveSentimentScore(score: InsertSentimentScore): Promise<void>;
  getUserSentimentProfile(userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email || "",
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email || "",
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User> {
    const updateData: any = {};
    
    if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
    if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
    if (userData.bio !== undefined) updateData.bio = userData.bio;
    if (userData.phoneNumber !== undefined) updateData.phoneNumber = userData.phoneNumber;
    if (userData.profileImageUrl !== undefined) updateData.profileImageUrl = userData.profileImageUrl;
    
    // Check if profile is complete
    if (userData.firstName && userData.lastName) {
      updateData.isProfileComplete = true;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    return user;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.nameAr);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // Article operations
  async getArticles(filters?: {
    categoryId?: string;
    status?: string;
    authorId?: string;
    searchQuery?: string;
  }): Promise<ArticleWithDetails[]> {
    const conditions = [];

    if (filters?.categoryId) {
      conditions.push(eq(articles.categoryId, filters.categoryId));
    }

    if (filters?.status) {
      conditions.push(eq(articles.status, filters.status));
    } else {
      conditions.push(eq(articles.status, "published"));
    }

    if (filters?.authorId) {
      conditions.push(eq(articles.authorId, filters.authorId));
    }

    if (filters?.searchQuery) {
      conditions.push(
        sql`${articles.title} ILIKE ${`%${filters.searchQuery}%`} OR ${articles.content} ILIKE ${`%${filters.searchQuery}%`}`
      );
    }

    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  async getArticleBySlug(slug: string, userId?: string): Promise<ArticleWithDetails | undefined> {
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.slug, slug));

    if (results.length === 0) return undefined;

    const result = results[0];
    const article = result.article;

    let isBookmarked = false;
    let hasReacted = false;

    if (userId) {
      const [bookmark] = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.articleId, article.id), eq(bookmarks.userId, userId)));
      isBookmarked = !!bookmark;

      const [reaction] = await db
        .select()
        .from(reactions)
        .where(and(eq(reactions.articleId, article.id), eq(reactions.userId, userId)));
      hasReacted = !!reaction;
    }

    const [{ count: reactionsCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reactions)
      .where(eq(reactions.articleId, article.id));

    const [{ count: commentsCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.articleId, article.id));

    return {
      ...article,
      category: result.category || undefined,
      author: result.author || undefined,
      isBookmarked,
      hasReacted,
      reactionsCount: Number(reactionsCount),
      commentsCount: Number(commentsCount),
    };
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [created] = await db.insert(articles).values(article).returning();
    return created;
  }

  async updateArticle(id: string, articleData: Partial<InsertArticle>): Promise<Article> {
    const [updated] = await db
      .update(articles)
      .set({ ...articleData, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return updated;
  }

  async deleteArticle(id: string): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  async incrementArticleViews(id: string): Promise<void> {
    await db
      .update(articles)
      .set({ views: sql`${articles.views} + 1` })
      .where(eq(articles.id, id));
  }

  async getFeaturedArticle(userId?: string): Promise<ArticleWithDetails | undefined> {
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.views), desc(articles.publishedAt))
      .limit(1);

    if (results.length === 0) return undefined;

    const result = results[0];
    return {
      ...result.article,
      category: result.category || undefined,
      author: result.author || undefined,
    };
  }

  async getRelatedArticles(articleId: string, categoryId?: string): Promise<ArticleWithDetails[]> {
    const conditions = [
      eq(articles.status, "published"),
      ne(articles.id, articleId),
    ];

    if (categoryId) {
      conditions.push(eq(articles.categoryId, categoryId));
    }

    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(5);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  // RSS Feed operations
  async getAllRssFeeds(): Promise<RssFeed[]> {
    return await db.select().from(rssFeeds).orderBy(rssFeeds.name);
  }

  async createRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    const [created] = await db.insert(rssFeeds).values(feed).returning();
    return created;
  }

  async updateRssFeedLastFetch(id: string): Promise<void> {
    await db
      .update(rssFeeds)
      .set({ lastFetchedAt: new Date() })
      .where(eq(rssFeeds.id, id));
  }

  // Comment operations
  async getCommentsByArticle(articleId: string): Promise<CommentWithUser[]> {
    const results = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.articleId, articleId))
      .orderBy(comments.createdAt);

    return results.map((r) => ({
      ...r.comment,
      user: r.user!,
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  // Reaction operations
  async toggleReaction(articleId: string, userId: string): Promise<{ hasReacted: boolean }> {
    const [existing] = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.articleId, articleId), eq(reactions.userId, userId)));

    if (existing) {
      await db.delete(reactions).where(eq(reactions.id, existing.id));
      return { hasReacted: false };
    } else {
      await db.insert(reactions).values({ articleId, userId });
      return { hasReacted: true };
    }
  }

  async getReactionsByArticle(articleId: string): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reactions)
      .where(eq(reactions.articleId, articleId));
    return Number(count);
  }

  // Bookmark operations
  async toggleBookmark(articleId: string, userId: string): Promise<{ isBookmarked: boolean }> {
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.userId, userId)));

    if (existing) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      return { isBookmarked: false };
    } else {
      await db.insert(bookmarks).values({ articleId, userId });
      return { isBookmarked: true };
    }
  }

  async getUserBookmarks(userId: string): Promise<ArticleWithDetails[]> {
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(bookmarks)
      .innerJoin(articles, eq(bookmarks.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
      isBookmarked: true,
    }));
  }

  // Reading history operations
  async recordArticleRead(userId: string, articleId: string, duration?: number): Promise<void> {
    await db.insert(readingHistory).values({
      userId,
      articleId,
      readDuration: duration,
    });
  }

  async getUserReadingHistory(userId: string, limit: number = 20): Promise<ArticleWithDetails[]> {
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(readingHistory)
      .innerJoin(articles, eq(readingHistory.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.readAt))
      .limit(limit);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  // Recommendation operations
  async getUserPreferences(userId: string): Promise<string[]> {
    const [pref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    return (pref?.preferredCategories as string[]) || [];
  }

  async getRecommendations(userId: string): Promise<ArticleWithDetails[]> {
    const history = await db
      .select({ categoryId: articles.categoryId })
      .from(readingHistory)
      .innerJoin(articles, eq(readingHistory.articleId, articles.id))
      .where(and(eq(readingHistory.userId, userId), sql`${articles.categoryId} IS NOT NULL`))
      .limit(10);

    const categoryIds = Array.from(new Set(history.map(h => h.categoryId).filter(Boolean))) as string[];

    if (categoryIds.length === 0) {
      return await this.getArticles({ status: "published" });
    }

    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(eq(articles.status, "published"), inArray(articles.categoryId, categoryIds)))
      .orderBy(desc(articles.publishedAt))
      .limit(6);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
  }> {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.authorId, userId));

    const [publishedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(eq(articles.authorId, userId), eq(articles.status, "published")));

    const [draftResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(eq(articles.authorId, userId), eq(articles.status, "draft")));

    const [viewsResult] = await db
      .select({ total: sql<number>`sum(${articles.views})` })
      .from(articles)
      .where(eq(articles.authorId, userId));

    return {
      totalArticles: Number(totalResult.count),
      publishedArticles: Number(publishedResult.count),
      draftArticles: Number(draftResult.count),
      totalViews: Number(viewsResult.total || 0),
    };
  }

  // Interest operations
  async getAllInterests(): Promise<Interest[]> {
    return await db.select().from(interests).orderBy(interests.nameAr);
  }

  async getUserInterests(userId: string): Promise<InterestWithWeight[]> {
    const results = await db
      .select({
        interest: interests,
        weight: userInterests.weight,
      })
      .from(userInterests)
      .innerJoin(interests, eq(userInterests.interestId, interests.id))
      .where(eq(userInterests.userId, userId));

    return results.map((r) => ({
      ...r.interest,
      weight: r.weight,
    }));
  }

  async setUserInterests(userId: string, interestIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(userInterests).where(eq(userInterests.userId, userId));

      if (interestIds.length > 0) {
        await tx.insert(userInterests).values(
          interestIds.map((interestId) => ({
            userId,
            interestId,
            weight: 1.0,
          }))
        );
        
        await tx.update(users)
          .set({ isProfileComplete: true })
          .where(eq(users.id, userId));
      }
    });
  }

  async updateInterestWeight(userId: string, interestId: string, weight: number): Promise<void> {
    await db
      .update(userInterests)
      .set({ weight, updatedAt: new Date() })
      .where(and(eq(userInterests.userId, userId), eq(userInterests.interestId, interestId)));
  }

  // Behavior tracking operations
  async logBehavior(log: InsertBehaviorLog): Promise<void> {
    await db.insert(behaviorLogs).values([log as any]);
  }

  async getUserBehaviorSummary(userId: string, days: number = 7): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = await db
      .select()
      .from(behaviorLogs)
      .where(and(
        eq(behaviorLogs.userId, userId),
        sql`${behaviorLogs.createdAt} >= ${cutoffDate.toISOString()}`
      ));

    const clicks: Record<string, number> = {};
    const avgReadTime: Record<string, number> = {};
    const readTimeCounts: Record<string, number> = {};
    const searches: string[] = [];
    const interactions = { shares: 0, comments: 0, likes: 0 };

    for (const log of logs) {
      const metadata = log.metadata as any;

      if (log.eventType === 'click' && metadata?.categoryId) {
        clicks[metadata.categoryId] = (clicks[metadata.categoryId] || 0) + 1;
      }

      if (log.eventType === 'read' && metadata?.categoryId && metadata?.duration) {
        avgReadTime[metadata.categoryId] = (avgReadTime[metadata.categoryId] || 0) + metadata.duration;
        readTimeCounts[metadata.categoryId] = (readTimeCounts[metadata.categoryId] || 0) + 1;
      }

      if (log.eventType === 'search' && metadata?.query) {
        searches.push(metadata.query);
      }

      if (log.eventType === 'interaction') {
        if (metadata?.action === 'share') interactions.shares++;
        if (metadata?.action === 'comment') interactions.comments++;
        if (metadata?.action === 'like') interactions.likes++;
      }
    }

    for (const category in avgReadTime) {
      avgReadTime[category] = Math.round(avgReadTime[category] / readTimeCounts[category]);
    }

    return {
      clicks,
      avgReadTime,
      searches: searches.slice(-10),
      interactions,
    };
  }

  // Sentiment analysis operations
  async saveSentimentScore(score: InsertSentimentScore): Promise<void> {
    await db.insert(sentimentScores).values([score as any]);
  }

  async getUserSentimentProfile(userId: string): Promise<any> {
    const recentScores = await db
      .select()
      .from(sentimentScores)
      .where(eq(sentimentScores.userId, userId))
      .orderBy(desc(sentimentScores.createdAt))
      .limit(20);

    if (recentScores.length === 0) {
      return {
        overallScore: 0,
        emotionalBreakdown: {
          enthusiasm: 0,
          satisfaction: 0,
          anger: 0,
          sadness: 0,
          neutral: 0,
        },
        trendingSentiments: ['neutral'],
      };
    }

    const avgScore = recentScores.reduce((sum, s) => sum + s.overallScore, 0) / recentScores.length;

    const emotionTotals = {
      enthusiasm: 0,
      satisfaction: 0,
      anger: 0,
      sadness: 0,
      neutral: 0,
    };

    for (const score of recentScores) {
      const breakdown = score.emotionalBreakdown as any;
      if (breakdown) {
        emotionTotals.enthusiasm += breakdown.enthusiasm || 0;
        emotionTotals.satisfaction += breakdown.satisfaction || 0;
        emotionTotals.anger += breakdown.anger || 0;
        emotionTotals.sadness += breakdown.sadness || 0;
        emotionTotals.neutral += breakdown.neutral || 0;
      }
    }

    const count = recentScores.length;
    const emotionalBreakdown = {
      enthusiasm: emotionTotals.enthusiasm / count,
      satisfaction: emotionTotals.satisfaction / count,
      anger: emotionTotals.anger / count,
      sadness: emotionTotals.sadness / count,
      neutral: emotionTotals.neutral / count,
    };

    const sorted = Object.entries(emotionalBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([emotion]) => emotion);

    return {
      overallScore: avgScore,
      emotionalBreakdown,
      trendingSentiments: sorted,
    };
  }
}

export const storage = new DatabaseStorage();
