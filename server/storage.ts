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
  themes,
  themeAuditLog,
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
  type Theme,
  type InsertTheme,
  type UpdateTheme,
  type ThemeAuditLog,
  type InsertThemeAuditLog,
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
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
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
  
  // Homepage operations
  getHeroArticles(): Promise<ArticleWithDetails[]>;
  getBreakingNews(limit?: number): Promise<ArticleWithDetails[]>;
  getEditorPicks(limit?: number): Promise<ArticleWithDetails[]>;
  getDeepDiveArticles(limit?: number): Promise<ArticleWithDetails[]>;
  getTrendingTopics(): Promise<Array<{ topic: string; count: number }>>;
  
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
  
  // Theme management operations
  getActiveTheme(scope?: string): Promise<Theme | undefined>;
  getAllThemes(filters?: { status?: string; createdBy?: string }): Promise<Theme[]>;
  getThemeById(id: string): Promise<Theme | undefined>;
  getThemeBySlug(slug: string): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  updateTheme(id: string, theme: UpdateTheme, userId: string): Promise<Theme>;
  deleteTheme(id: string): Promise<void>;
  publishTheme(id: string, userId: string): Promise<Theme>;
  expireTheme(id: string, userId: string): Promise<Theme>;
  rollbackTheme(id: string, userId: string): Promise<Theme>;
  createThemeAuditLog(log: InsertThemeAuditLog): Promise<void>;
  getThemeAuditLogs(themeId: string): Promise<ThemeAuditLog[]>;
  initializeDefaultTheme(userId: string): Promise<Theme>;
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

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
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

  async getHeroArticles(): Promise<ArticleWithDetails[]> {
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
      .orderBy(desc(articles.publishedAt), desc(articles.views))
      .limit(3);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  async getBreakingNews(limit: number = 5): Promise<ArticleWithDetails[]> {
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
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  async getEditorPicks(limit: number = 6): Promise<ArticleWithDetails[]> {
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
      .limit(limit);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  async getDeepDiveArticles(limit: number = 6): Promise<ArticleWithDetails[]> {
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(
        eq(articles.status, "published"),
        sql`${articles.aiSummary} IS NOT NULL AND LENGTH(${articles.content}) > 200`
      ))
      .orderBy(desc(articles.createdAt))
      .limit(limit);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));
  }

  async getTrendingTopics(): Promise<Array<{ topic: string; count: number }>> {
    const results = await db.execute(sql`
      WITH keyword_stats AS (
        SELECT 
          UNNEST(COALESCE((seo->>'keywords')::text[], ARRAY[]::text[])) as keyword,
          a.id as article_id,
          COALESCE(a.views, 0) as views,
          (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id) as comment_count
        FROM articles a
        WHERE a.status = 'published'
          AND a.seo IS NOT NULL
          AND a.seo->>'keywords' IS NOT NULL
          AND jsonb_array_length(a.seo->'keywords') > 0
      )
      SELECT 
        keyword as topic,
        (SUM(views) + (SUM(comment_count) * 10))::int as count
      FROM keyword_stats
      GROUP BY keyword
      HAVING SUM(views) + (SUM(comment_count) * 10) > 0
      ORDER BY count DESC
      LIMIT 8
    `);

    return (results.rows as Array<{ topic: string; count: number }>)
      .filter(r => r.topic && r.topic.trim().length > 0);
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

  // Theme management operations
  async getActiveTheme(scope: string = 'site_full'): Promise<Theme | undefined> {
    const now = new Date();
    
    const activeThemes = await db
      .select()
      .from(themes)
      .where(
        and(
          sql`${themes.status} IN ('active', 'scheduled')`,
          sql`${themes.startAt} IS NULL OR ${themes.startAt} <= ${now.toISOString()}`,
          sql`${themes.endAt} IS NULL OR ${themes.endAt} >= ${now.toISOString()}`,
          sql`${scope} = ANY(${themes.applyTo}) OR array_length(${themes.applyTo}, 1) IS NULL`
        )
      )
      .orderBy(desc(themes.priority), desc(themes.version), desc(themes.updatedAt));

    if (activeThemes.length > 0) {
      return activeThemes[0];
    }

    const defaultTheme = await db
      .select()
      .from(themes)
      .where(eq(themes.isDefault, true))
      .limit(1);

    return defaultTheme[0];
  }

  async getAllThemes(filters?: { status?: string; createdBy?: string }): Promise<Theme[]> {
    let query = db.select().from(themes);

    if (filters?.status && filters?.createdBy) {
      query = query.where(
        and(
          eq(themes.status, filters.status),
          eq(themes.createdBy, filters.createdBy)
        )
      ) as any;
    } else if (filters?.status) {
      query = query.where(eq(themes.status, filters.status)) as any;
    } else if (filters?.createdBy) {
      query = query.where(eq(themes.createdBy, filters.createdBy)) as any;
    }

    return await query.orderBy(desc(themes.updatedAt));
  }

  async getThemeById(id: string): Promise<Theme | undefined> {
    const result = await db.select().from(themes).where(eq(themes.id, id)).limit(1);
    return result[0];
  }

  async getThemeBySlug(slug: string): Promise<Theme | undefined> {
    const result = await db.select().from(themes).where(eq(themes.slug, slug)).limit(1);
    return result[0];
  }

  async createTheme(theme: InsertTheme): Promise<Theme> {
    const result = await db.insert(themes).values([theme as any]).returning();
    await this.createThemeAuditLog({
      themeId: result[0].id,
      userId: theme.createdBy,
      action: 'created',
      changes: theme as any,
      metadata: { newStatus: 'draft' },
    });
    return result[0];
  }

  async updateTheme(id: string, themeData: UpdateTheme, userId: string): Promise<Theme> {
    const existing = await this.getThemeById(id);
    if (!existing) {
      throw new Error('Theme not found');
    }

    const updated = await db
      .update(themes)
      .set({
        ...themeData,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    await this.createThemeAuditLog({
      themeId: id,
      userId,
      action: 'updated',
      changes: themeData as any,
      metadata: {
        previousStatus: existing.status,
        newStatus: themeData.status || existing.status,
      },
    });

    return updated[0];
  }

  async deleteTheme(id: string): Promise<void> {
    await db.delete(themes).where(eq(themes.id, id));
  }

  async publishTheme(id: string, userId: string): Promise<Theme> {
    const existing = await this.getThemeById(id);
    if (!existing) {
      throw new Error('Theme not found');
    }

    const updated = await db
      .update(themes)
      .set({
        status: 'active',
        publishedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    await this.createThemeAuditLog({
      themeId: id,
      userId,
      action: 'published',
      changes: {},
      metadata: {
        previousStatus: existing.status,
        newStatus: 'active',
      },
    });

    return updated[0];
  }

  async expireTheme(id: string, userId: string): Promise<Theme> {
    const existing = await this.getThemeById(id);
    if (!existing) {
      throw new Error('Theme not found');
    }

    const updated = await db
      .update(themes)
      .set({
        status: 'expired',
        endAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    await this.createThemeAuditLog({
      themeId: id,
      userId,
      action: 'expired',
      changes: {},
      metadata: {
        previousStatus: existing.status,
        newStatus: 'expired',
      },
    });

    return updated[0];
  }

  async rollbackTheme(id: string, userId: string): Promise<Theme> {
    const existing = await this.getThemeById(id);
    if (!existing) {
      throw new Error('Theme not found');
    }

    if (existing.version <= 1) {
      throw new Error('Cannot rollback - no previous version available');
    }

    const updated = await db
      .update(themes)
      .set({
        version: existing.version + 1,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    await this.createThemeAuditLog({
      themeId: id,
      userId,
      action: 'rolled_back',
      changes: { fromVersion: existing.version, toVersion: existing.version + 1 },
      metadata: {
        previousStatus: existing.status,
        newStatus: 'active',
        reason: 'Rollback to previous version',
      },
    });

    return updated[0];
  }

  async createThemeAuditLog(log: InsertThemeAuditLog): Promise<void> {
    await db.insert(themeAuditLog).values([log as any]);
  }

  async getThemeAuditLogs(themeId: string): Promise<ThemeAuditLog[]> {
    return await db
      .select()
      .from(themeAuditLog)
      .where(eq(themeAuditLog.themeId, themeId))
      .orderBy(desc(themeAuditLog.createdAt));
  }

  async initializeDefaultTheme(userId: string): Promise<Theme> {
    const existing = await db
      .select()
      .from(themes)
      .where(eq(themes.isDefault, true))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const defaultTheme = await db.insert(themes).values([{
      name: 'سبق الافتراضية',
      slug: 'sabq-default',
      isDefault: true,
      priority: 0,
      status: 'active',
      applyTo: ['site_full'],
      assets: {
        logoLight: '/assets/logo-light.svg',
        logoDark: '/assets/logo-dark.svg',
        favicon: '/assets/favicon.ico',
      },
      tokens: {
        colors: {
          'bg-primary': '#f8f8f7',
          'bg-surface': '#ffffff',
          'border-default': '#f0f0ef',
          'text-primary': '#1a1a1a',
          'text-secondary': '#6b7280',
          'text-muted': '#9ca3af',
          'brand-primary': '#0066cc',
          'success': '#059669',
          'warning': '#d97706',
          'error': '#dc2626',
        },
        fonts: {
          'family': 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
          'size-h1': '28px',
          'size-h2': '20px',
          'size-h3': '16px',
          'size-body': '14px',
          'size-caption': '12px',
        },
        spacing: {
          'xs': '4px',
          'sm': '8px',
          'md': '16px',
          'lg': '24px',
          'xl': '32px',
        },
        borderRadius: {
          'default': '8px',
        },
      },
      createdBy: userId,
      version: 1,
      changelog: [{
        version: 1,
        changes: 'Initial default theme created',
        timestamp: new Date().toISOString(),
        userId,
      }],
    } as any]).returning();

    return defaultTheme[0];
  }
}

export const storage = new DatabaseStorage();
