// Reference: javascript_database blueprint + javascript_log_in_with_replit blueprint
import { db } from "./db";
import { eq, desc, asc, sql, and, or, inArray, ne, gte, lte } from "drizzle-orm";
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
  userLoyaltyEvents,
  userPointsTotal,
  loyaltyRewards,
  userRewardsHistory,
  loyaltyCampaigns,
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
  type UserLoyaltyEvent,
  type InsertUserLoyaltyEvent,
  type UserPointsTotal,
  type InsertUserPointsTotal,
  type LoyaltyReward,
  type InsertLoyaltyReward,
  type UserRewardsHistory,
  type InsertUserRewardsHistory,
  type LoyaltyCampaign,
  type InsertLoyaltyCampaign,
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
  getUserLikedArticles(userId: string): Promise<ArticleWithDetails[]>;
  
  // Reading history operations
  recordArticleRead(userId: string, articleId: string, duration?: number): Promise<void>;
  getUserReadingHistory(userId: string, limit?: number): Promise<ArticleWithDetails[]>;
  
  // Recommendation operations
  getUserPreferences(userId: string): Promise<string[]>;
  getRecommendations(userId: string): Promise<ArticleWithDetails[]>;
  getPersonalizedFeed(userId: string, limit?: number): Promise<ArticleWithDetails[]>;
  
  // Homepage operations
  getHeroArticles(): Promise<ArticleWithDetails[]>;
  getBreakingNews(limit?: number): Promise<ArticleWithDetails[]>;
  getEditorPicks(limit?: number): Promise<ArticleWithDetails[]>;
  getDeepDiveArticles(limit?: number): Promise<ArticleWithDetails[]>;
  getTrendingTopics(): Promise<Array<{ topic: string; count: number }>>;
  getAllPublishedArticles(limit?: number): Promise<ArticleWithDetails[]>;
  
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
  analyzeUserInterestsFromBehavior(userId: string, days?: number): Promise<Array<{
    categoryId: string;
    currentWeight: number;
    suggestedWeight: number;
    stats: {
      reads: number;
      likes: number;
      comments: number;
      shares: number;
      readTimeMinutes: number;
    };
  }>>;
  updateUserInterestsAutomatically(userId: string, days?: number): Promise<{
    updated: number;
    added: number;
    removed: number;
  }>;
  
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

  // Loyalty System - Points and Events
  recordLoyaltyPoints(params: {
    userId: string;
    action: string;
    points: number;
    source?: string;
    metadata?: any;
  }): Promise<{ pointsEarned: number; totalPoints: number; rankChanged: boolean; newRank?: string }>;
  getUserPoints(userId: string): Promise<UserPointsTotal | undefined>;
  getUserLoyaltyHistory(userId: string, limit?: number): Promise<UserLoyaltyEvent[]>;
  getTopUsers(limit?: number): Promise<Array<UserPointsTotal & { user: User }>>;

  // Loyalty System - Rewards
  getActiveRewards(): Promise<LoyaltyReward[]>;
  getRewardById(rewardId: string): Promise<LoyaltyReward | undefined>;
  redeemReward(params: {
    userId: string;
    rewardId: string;
  }): Promise<{ success: boolean; message: string; redemption?: UserRewardsHistory }>;
  getUserRedemptionHistory(userId: string): Promise<UserRewardsHistory[]>;

  // Loyalty System - Campaigns
  getActiveCampaigns(): Promise<LoyaltyCampaign[]>;
  getApplicableCampaign(action: string, categoryId?: string): Promise<LoyaltyCampaign | undefined>;

  // Loyalty System - Admin
  createReward(data: InsertLoyaltyReward): Promise<LoyaltyReward>;
  updateReward(id: string, data: Partial<InsertLoyaltyReward>): Promise<LoyaltyReward>;
  deleteReward(id: string): Promise<void>;
  createCampaign(data: InsertLoyaltyCampaign): Promise<LoyaltyCampaign>;
  updateCampaign(id: string, data: Partial<InsertLoyaltyCampaign>): Promise<LoyaltyCampaign>;
  adjustUserPoints(userId: string, points: number, reason: string): Promise<void>;
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

  async getUserLikedArticles(userId: string): Promise<ArticleWithDetails[]> {
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(reactions)
      .innerJoin(articles, eq(reactions.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(eq(reactions.userId, userId), eq(articles.status, "published")))
      .orderBy(desc(reactions.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
      hasReacted: true,
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

  async getPersonalizedFeed(userId: string, limit: number = 20): Promise<ArticleWithDetails[]> {
    const results = await db.execute(sql`
      WITH user_interests_weights AS (
        SELECT 
          category_id,
          weight
        FROM user_interests
        WHERE user_id = ${userId}
      ),
      recently_read_articles AS (
        SELECT article_id
        FROM reading_history
        WHERE user_id = ${userId}
          AND read_at > NOW() - INTERVAL '3 days'
      ),
      article_scores AS (
        SELECT 
          a.id,
          a.title,
          a.subtitle,
          a.slug,
          a.content,
          a.excerpt,
          a.image_url,
          a.category_id,
          a.author_id,
          a.article_type,
          a.news_type,
          a.publish_type,
          a.scheduled_at,
          a.status,
          a.ai_summary,
          a.ai_generated,
          a.is_featured,
          a.views,
          a.seo,
          a.published_at,
          a.created_at,
          a.updated_at,
          COALESCE(ui.weight, 0) as category_weight,
          COALESCE(
            CASE 
              WHEN a.published_at > NOW() - INTERVAL '7 days' 
              THEN 10 - EXTRACT(EPOCH FROM (NOW() - a.published_at)) / (86400.0 * 7) * 10
              ELSE 0
            END, 0
          ) as recency_score,
          COALESCE(a.views, 0) + COALESCE(
            (SELECT COUNT(*) FROM reactions r WHERE r.article_id = a.id), 0
          ) * 2 as popularity_score,
          (
            COALESCE(ui.weight, 0) * 10 +
            COALESCE(
              CASE 
                WHEN a.published_at > NOW() - INTERVAL '7 days' 
                THEN 10 - EXTRACT(EPOCH FROM (NOW() - a.published_at)) / (86400.0 * 7) * 10
                ELSE 0
              END, 0
            ) +
            COALESCE(a.views, 0) / 10.0 + COALESCE(
              (SELECT COUNT(*) FROM reactions r WHERE r.article_id = a.id), 0
            ) * 0.5
          ) as total_score
        FROM articles a
        LEFT JOIN user_interests_weights ui ON a.category_id = ui.category_id
        WHERE a.status = 'published'
          AND a.id NOT IN (SELECT article_id FROM recently_read_articles)
          AND (
            EXISTS (SELECT 1 FROM user_interests_weights WHERE category_id = a.category_id)
            OR NOT EXISTS (SELECT 1 FROM user_interests_weights)
          )
        ORDER BY total_score DESC, a.published_at DESC
        LIMIT ${limit}
      )
      SELECT 
        ascores.*,
        c.id as category_id,
        c.name_ar as category_name_ar,
        c.name_en as category_name_en,
        c.slug as category_slug,
        c.description as category_description,
        c.color as category_color,
        c.icon as category_icon,
        c.hero_image_url as category_hero_image_url,
        c.display_order as category_display_order,
        c.status as category_status,
        c.created_at as category_created_at,
        u.id as author_id,
        u.email as author_email,
        u.first_name as author_first_name,
        u.last_name as author_last_name,
        u.bio as author_bio,
        u.phone_number as author_phone_number,
        u.profile_image_url as author_profile_image_url,
        u.role as author_role,
        u.status as author_status,
        u.is_profile_complete as author_is_profile_complete,
        u.created_at as author_created_at
      FROM article_scores ascores
      LEFT JOIN categories c ON ascores.category_id = c.id
      LEFT JOIN users u ON ascores.author_id = u.id
      ORDER BY ascores.total_score DESC, ascores.published_at DESC
    `);

    return (results.rows as any[]).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      imageUrl: row.image_url,
      categoryId: row.category_id,
      authorId: row.author_id,
      articleType: row.article_type,
      newsType: row.news_type,
      publishType: row.publish_type,
      scheduledAt: row.scheduled_at,
      status: row.status,
      aiSummary: row.ai_summary,
      aiGenerated: row.ai_generated,
      isFeatured: row.is_featured,
      views: row.views,
      seo: row.seo,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      category: row.category_id ? {
        id: row.category_id,
        nameAr: row.category_name_ar,
        nameEn: row.category_name_en,
        slug: row.category_slug,
        description: row.category_description,
        color: row.category_color,
        icon: row.category_icon,
        heroImageUrl: row.category_hero_image_url,
        displayOrder: row.category_display_order,
        status: row.category_status,
        createdAt: row.category_created_at,
      } : undefined,
      author: row.author_id ? {
        id: row.author_id,
        email: row.author_email,
        passwordHash: null,
        firstName: row.author_first_name,
        lastName: row.author_last_name,
        bio: row.author_bio,
        phoneNumber: row.author_phone_number,
        profileImageUrl: row.author_profile_image_url,
        role: row.author_role,
        status: row.author_status,
        isProfileComplete: row.author_is_profile_complete,
        createdAt: row.author_created_at,
      } : undefined,
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
      .where(
        and(
          eq(articles.status, "published"),
          or(
            eq(articles.newsType, "breaking"),
            eq(articles.isFeatured, true)
          )
        )
      )
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

  async getAllPublishedArticles(limit: number = 16): Promise<ArticleWithDetails[]> {
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
      WITH topic_stats AS (
        SELECT 
          c.name_ar as topic,
          COALESCE(SUM(a.views), 0) as total_views,
          COUNT(DISTINCT a.id) as article_count,
          COALESCE(SUM((SELECT COUNT(*) FROM comments cm WHERE cm.article_id = a.id)), 0) as total_comments
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published'
          AND c.name_ar IS NOT NULL
        GROUP BY c.id, c.name_ar
      )
      SELECT 
        topic,
        ((total_views + (total_comments * 10) + (article_count * 5)))::int as count
      FROM topic_stats
      WHERE total_views + (total_comments * 10) + (article_count * 5) > 0
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

  async analyzeUserInterestsFromBehavior(userId: string, days: number = 7): Promise<Array<{
    categoryId: string;
    currentWeight: number;
    suggestedWeight: number;
    stats: {
      reads: number;
      likes: number;
      comments: number;
      shares: number;
      readTimeMinutes: number;
    };
  }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get current user interests
    const currentInterests = await db
      .select()
      .from(userInterests)
      .where(eq(userInterests.userId, userId));

    const currentWeightMap: Record<string, number> = {};
    for (const interest of currentInterests) {
      currentWeightMap[interest.categoryId] = interest.weight;
    }

    // Aggregate behavior data using SQL
    const behaviorData = await db.execute(sql`
      WITH category_stats AS (
        -- Reading history
        SELECT 
          a.category_id,
          COUNT(DISTINCT rh.id) as reads,
          COALESCE(SUM(rh.read_duration), 0) as total_read_time
        FROM reading_history rh
        INNER JOIN articles a ON rh.article_id = a.id
        WHERE rh.user_id = ${userId}
          AND rh.read_at >= ${cutoffDate.toISOString()}
          AND a.category_id IS NOT NULL
        GROUP BY a.category_id
      ),
      reaction_stats AS (
        -- Likes/Reactions
        SELECT 
          a.category_id,
          COUNT(*) as likes
        FROM reactions r
        INNER JOIN articles a ON r.article_id = a.id
        WHERE r.user_id = ${userId}
          AND r.created_at >= ${cutoffDate.toISOString()}
          AND a.category_id IS NOT NULL
        GROUP BY a.category_id
      ),
      comment_stats AS (
        -- Comments
        SELECT 
          a.category_id,
          COUNT(*) as comments
        FROM comments c
        INNER JOIN articles a ON c.article_id = a.id
        WHERE c.user_id = ${userId}
          AND c.created_at >= ${cutoffDate.toISOString()}
          AND a.category_id IS NOT NULL
        GROUP BY a.category_id
      ),
      share_stats AS (
        -- Shares from behavior logs
        SELECT 
          (metadata->>'categoryId')::varchar as category_id,
          COUNT(*) as shares
        FROM behavior_logs
        WHERE user_id = ${userId}
          AND event_type = 'article_share'
          AND created_at >= ${cutoffDate.toISOString()}
          AND metadata->>'categoryId' IS NOT NULL
        GROUP BY (metadata->>'categoryId')::varchar
      ),
      all_categories AS (
        SELECT DISTINCT category_id FROM category_stats
        UNION
        SELECT DISTINCT category_id FROM reaction_stats
        UNION
        SELECT DISTINCT category_id FROM comment_stats
        UNION
        SELECT DISTINCT category_id FROM share_stats
      )
      SELECT 
        ac.category_id,
        COALESCE(cs.reads, 0)::int as reads,
        COALESCE(rs.likes, 0)::int as likes,
        COALESCE(cms.comments, 0)::int as comments,
        COALESCE(ss.shares, 0)::int as shares,
        COALESCE(cs.total_read_time, 0)::int as total_read_time
      FROM all_categories ac
      LEFT JOIN category_stats cs ON ac.category_id = cs.category_id
      LEFT JOIN reaction_stats rs ON ac.category_id = rs.category_id
      LEFT JOIN comment_stats cms ON ac.category_id = cms.category_id
      LEFT JOIN share_stats ss ON ac.category_id = ss.category_id
      WHERE ac.category_id IS NOT NULL
    `);

    const results: Array<{
      categoryId: string;
      currentWeight: number;
      suggestedWeight: number;
      stats: {
        reads: number;
        likes: number;
        comments: number;
        shares: number;
        readTimeMinutes: number;
      };
    }> = [];

    for (const row of behaviorData.rows as any[]) {
      const categoryId = row.category_id;
      const reads = Number(row.reads) || 0;
      const likes = Number(row.likes) || 0;
      const comments = Number(row.comments) || 0;
      const shares = Number(row.shares) || 0;
      const totalReadTimeSeconds = Number(row.total_read_time) || 0;
      const readTimeMinutes = Math.round(totalReadTimeSeconds / 60);

      // Calculate suggested weight using the formula
      const rawWeight = 
        (reads * 1.0) + 
        (likes * 0.5) + 
        (comments * 1.0) + 
        (shares * 1.5) + 
        (readTimeMinutes * 0.1);

      // Normalize weight between 0 and 5
      const suggestedWeight = Math.min(5, Math.max(0, rawWeight));

      results.push({
        categoryId,
        currentWeight: currentWeightMap[categoryId] || 0,
        suggestedWeight: Math.round(suggestedWeight * 10) / 10, // Round to 1 decimal
        stats: {
          reads,
          likes,
          comments,
          shares,
          readTimeMinutes,
        },
      });
    }

    return results;
  }

  async updateUserInterestsAutomatically(userId: string, days: number = 7): Promise<{
    updated: number;
    added: number;
    removed: number;
  }> {
    const analysis = await this.analyzeUserInterestsFromBehavior(userId, days);

    let updated = 0;
    let added = 0;
    let removed = 0;

    await db.transaction(async (tx) => {
      for (const item of analysis) {
        const { categoryId, currentWeight, suggestedWeight } = item;

        // Check if the interest already exists
        const [existing] = await tx
          .select()
          .from(userInterests)
          .where(
            and(
              eq(userInterests.userId, userId),
              eq(userInterests.categoryId, categoryId)
            )
          );

        if (existing) {
          // Interest exists
          if (suggestedWeight < 0.5) {
            // Remove if weight is too low
            await tx
              .delete(userInterests)
              .where(eq(userInterests.id, existing.id));
            removed++;
          } else {
            // Update the weight
            await tx
              .update(userInterests)
              .set({ 
                weight: suggestedWeight,
                updatedAt: new Date()
              })
              .where(eq(userInterests.id, existing.id));
            updated++;
          }
        } else {
          // New interest
          if (suggestedWeight > 1) {
            // Add new interest if weight is significant
            await tx
              .insert(userInterests)
              .values({
                userId,
                categoryId,
                weight: suggestedWeight,
              });
            added++;
          }
        }
      }
    });

    return { updated, added, removed };
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
      .where(
        and(
          eq(themes.isDefault, true),
          sql`${themes.startAt} IS NULL OR ${themes.startAt} <= ${now.toISOString()}`,
          sql`${themes.endAt} IS NULL OR ${themes.endAt} >= ${now.toISOString()}`,
          sql`${scope} = ANY(${themes.applyTo}) OR array_length(${themes.applyTo}, 1) = 0 OR array_length(${themes.applyTo}, 1) IS NULL`
        )
      )
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

  // Loyalty System - Private Helpers
  private calculateRank(totalPoints: number): string {
    if (totalPoints >= 2001) return "سفير سبق";
    if (totalPoints >= 501) return "العضو الذهبي";
    if (totalPoints >= 101) return "المتفاعل";
    return "القارئ الجديد";
  }

  private async getApplicableCampaignInTx(tx: any, action: string, categoryId?: string): Promise<LoyaltyCampaign | undefined> {
    const now = new Date();
    const conditions = [
      eq(loyaltyCampaigns.isActive, true),
      lte(loyaltyCampaigns.startAt, now),
      gte(loyaltyCampaigns.endAt, now),
    ];

    if (action) {
      conditions.push(
        or(
          sql`${loyaltyCampaigns.targetAction} IS NULL`,
          eq(loyaltyCampaigns.targetAction, action)
        )!
      );
    }

    if (categoryId) {
      conditions.push(
        or(
          sql`${loyaltyCampaigns.targetCategory} IS NULL`,
          eq(loyaltyCampaigns.targetCategory, categoryId)
        )!
      );
    }

    const [campaign] = await tx
      .select()
      .from(loyaltyCampaigns)
      .where(and(...conditions))
      .orderBy(desc(loyaltyCampaigns.multiplier))
      .limit(1);

    return campaign;
  }

  // Loyalty System - Points and Events
  async recordLoyaltyPoints(params: {
    userId: string;
    action: string;
    points: number;
    source?: string;
    metadata?: any;
  }): Promise<{ pointsEarned: number; totalPoints: number; rankChanged: boolean; newRank?: string }> {
    return await db.transaction(async (tx) => {
      const now = new Date();
      
      // 1. Get active campaign inside transaction
      const applicableCampaign = await this.getApplicableCampaignInTx(
        tx,
        params.action, 
        params.metadata?.categoryId
      );

      // 2. Calculate points with multiplier or bonus
      let pointsToAward = params.points;
      let campaignId: string | undefined = undefined;

      if (applicableCampaign) {
        campaignId = applicableCampaign.id;
        if (applicableCampaign.multiplier && applicableCampaign.multiplier > 1) {
          pointsToAward = Math.floor(params.points * applicableCampaign.multiplier);
        }
        if (applicableCampaign.bonusPoints && applicableCampaign.bonusPoints > 0) {
          pointsToAward += applicableCampaign.bonusPoints;
        }
      }

      // 3. Create loyalty event
      await tx.insert(userLoyaltyEvents).values({
        userId: params.userId,
        action: params.action,
        points: pointsToAward,
        source: params.source,
        campaignId,
        metadata: params.metadata,
      });

      // 4. Get or create user points total
      const [existingPoints] = await tx
        .select()
        .from(userPointsTotal)
        .where(eq(userPointsTotal.userId, params.userId));

      const oldRank = existingPoints?.currentRank || "القارئ الجديد";
      const newTotalPoints = (existingPoints?.totalPoints || 0) + pointsToAward;
      const newLifetimePoints = (existingPoints?.lifetimePoints || 0) + (pointsToAward > 0 ? pointsToAward : 0);
      const newRank = this.calculateRank(newTotalPoints);

      // 5. Update or insert user points
      if (existingPoints) {
        await tx
          .update(userPointsTotal)
          .set({
            totalPoints: newTotalPoints,
            lifetimePoints: newLifetimePoints,
            currentRank: newRank,
            lastActivityAt: now,
            updatedAt: now,
          })
          .where(eq(userPointsTotal.userId, params.userId));
      } else {
        await tx.insert(userPointsTotal).values({
          userId: params.userId,
          totalPoints: newTotalPoints,
          lifetimePoints: newLifetimePoints,
          currentRank: newRank,
          lastActivityAt: now,
        });
      }

      // 6. Check for rank change
      const rankChanged = oldRank !== newRank;

      // 7. Return result
      return {
        pointsEarned: pointsToAward,
        totalPoints: newTotalPoints,
        rankChanged,
        newRank: rankChanged ? newRank : undefined,
      };
    });
  }

  async getUserPoints(userId: string): Promise<UserPointsTotal | undefined> {
    const [points] = await db
      .select()
      .from(userPointsTotal)
      .where(eq(userPointsTotal.userId, userId));
    return points;
  }

  async getUserLoyaltyHistory(userId: string, limit: number = 50): Promise<UserLoyaltyEvent[]> {
    return await db
      .select()
      .from(userLoyaltyEvents)
      .where(eq(userLoyaltyEvents.userId, userId))
      .orderBy(desc(userLoyaltyEvents.createdAt))
      .limit(limit);
  }

  async getTopUsers(limit: number = 100): Promise<Array<UserPointsTotal & { user: User }>> {
    const results = await db
      .select({
        points: userPointsTotal,
        user: users,
      })
      .from(userPointsTotal)
      .leftJoin(users, eq(userPointsTotal.userId, users.id))
      .orderBy(desc(userPointsTotal.totalPoints))
      .limit(limit);

    return results.map((r) => ({
      ...r.points,
      user: r.user!,
    }));
  }

  // Loyalty System - Rewards
  async getActiveRewards(): Promise<LoyaltyReward[]> {
    const now = new Date();
    return await db
      .select()
      .from(loyaltyRewards)
      .where(
        and(
          eq(loyaltyRewards.isActive, true),
          or(
            sql`${loyaltyRewards.expiresAt} IS NULL`,
            gte(loyaltyRewards.expiresAt, now)
          )
        )
      )
      .orderBy(loyaltyRewards.pointsCost);
  }

  async getRewardById(rewardId: string): Promise<LoyaltyReward | undefined> {
    const [reward] = await db
      .select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.id, rewardId));
    return reward;
  }

  async redeemReward(params: {
    userId: string;
    rewardId: string;
  }): Promise<{ success: boolean; message: string; redemption?: UserRewardsHistory }> {
    return await db.transaction(async (tx) => {
      // 1. Get reward details
      const [reward] = await tx
        .select()
        .from(loyaltyRewards)
        .where(eq(loyaltyRewards.id, params.rewardId));

      if (!reward) {
        return { success: false, message: "الجائزة غير موجودة" };
      }

      if (!reward.isActive) {
        return { success: false, message: "الجائزة غير متاحة حالياً" };
      }

      if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
        return { success: false, message: "انتهت صلاحية الجائزة" };
      }

      // 2. Check user points
      const [userPoints] = await tx
        .select()
        .from(userPointsTotal)
        .where(eq(userPointsTotal.userId, params.userId));

      if (!userPoints || userPoints.totalPoints < reward.pointsCost) {
        return { 
          success: false, 
          message: `النقاط غير كافية. تحتاج إلى ${reward.pointsCost} نقطة` 
        };
      }

      // 3. Check stock
      if (reward.remainingStock !== null && reward.remainingStock <= 0) {
        return { success: false, message: "نفذت كمية الجائزة" };
      }

      // 4. Check max redemptions per user
      if (reward.maxRedemptionsPerUser !== null) {
        const [{ count: userRedemptions }] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(userRewardsHistory)
          .where(
            and(
              eq(userRewardsHistory.userId, params.userId),
              eq(userRewardsHistory.rewardId, params.rewardId)
            )
          );

        if (Number(userRedemptions) >= reward.maxRedemptionsPerUser) {
          return { 
            success: false, 
            message: `لقد وصلت إلى الحد الأقصى لاستبدال هذه الجائزة (${reward.maxRedemptionsPerUser})` 
          };
        }
      }

      // 5. Deduct points
      await tx
        .update(userPointsTotal)
        .set({ 
          totalPoints: userPoints.totalPoints - reward.pointsCost,
          updatedAt: new Date(),
        })
        .where(eq(userPointsTotal.userId, params.userId));

      // 6. Create redemption record with snapshot
      const [redemption] = await tx
        .insert(userRewardsHistory)
        .values({
          userId: params.userId,
          rewardId: params.rewardId,
          pointsSpent: reward.pointsCost,
          rewardSnapshot: {
            nameAr: reward.nameAr,
            nameEn: reward.nameEn,
            pointsCost: reward.pointsCost,
            rewardType: reward.rewardType,
          },
          deliveryData: reward.rewardData?.couponCode ? {
            couponCode: reward.rewardData.couponCode,
          } : undefined,
        })
        .returning();

      // 7. Update stock if applicable
      if (reward.remainingStock !== null) {
        await tx
          .update(loyaltyRewards)
          .set({ remainingStock: reward.remainingStock - 1 })
          .where(eq(loyaltyRewards.id, params.rewardId));
      }

      return { 
        success: true, 
        message: "تم استبدال الجائزة بنجاح", 
        redemption 
      };
    });
  }

  async getUserRedemptionHistory(userId: string): Promise<UserRewardsHistory[]> {
    return await db
      .select()
      .from(userRewardsHistory)
      .where(eq(userRewardsHistory.userId, userId))
      .orderBy(desc(userRewardsHistory.redeemedAt));
  }

  // Loyalty System - Campaigns
  async getActiveCampaigns(): Promise<LoyaltyCampaign[]> {
    const now = new Date();
    return await db
      .select()
      .from(loyaltyCampaigns)
      .where(
        and(
          eq(loyaltyCampaigns.isActive, true),
          lte(loyaltyCampaigns.startAt, now),
          gte(loyaltyCampaigns.endAt, now)
        )
      )
      .orderBy(loyaltyCampaigns.createdAt);
  }

  async getApplicableCampaign(action: string, categoryId?: string): Promise<LoyaltyCampaign | undefined> {
    const now = new Date();
    const conditions = [
      eq(loyaltyCampaigns.isActive, true),
      lte(loyaltyCampaigns.startAt, now),
      gte(loyaltyCampaigns.endAt, now),
    ];

    // Check if campaign targets specific action
    if (action) {
      conditions.push(
        or(
          sql`${loyaltyCampaigns.targetAction} IS NULL`,
          eq(loyaltyCampaigns.targetAction, action)
        )!
      );
    }

    // Check if campaign targets specific category
    if (categoryId) {
      conditions.push(
        or(
          sql`${loyaltyCampaigns.targetCategory} IS NULL`,
          eq(loyaltyCampaigns.targetCategory, categoryId)
        )!
      );
    }

    const [campaign] = await db
      .select()
      .from(loyaltyCampaigns)
      .where(and(...conditions))
      .orderBy(desc(loyaltyCampaigns.multiplier))
      .limit(1);

    return campaign;
  }

  // Loyalty System - Admin
  async createReward(data: InsertLoyaltyReward): Promise<LoyaltyReward> {
    const [reward] = await db
      .insert(loyaltyRewards)
      .values(data)
      .returning();
    return reward;
  }

  async updateReward(id: string, data: Partial<InsertLoyaltyReward>): Promise<LoyaltyReward> {
    const [reward] = await db
      .update(loyaltyRewards)
      .set(data)
      .where(eq(loyaltyRewards.id, id))
      .returning();
    return reward;
  }

  async deleteReward(id: string): Promise<void> {
    await db.delete(loyaltyRewards).where(eq(loyaltyRewards.id, id));
  }

  async createCampaign(data: InsertLoyaltyCampaign): Promise<LoyaltyCampaign> {
    const [campaign] = await db
      .insert(loyaltyCampaigns)
      .values(data)
      .returning();
    return campaign;
  }

  async updateCampaign(id: string, data: Partial<InsertLoyaltyCampaign>): Promise<LoyaltyCampaign> {
    const [campaign] = await db
      .update(loyaltyCampaigns)
      .set(data)
      .where(eq(loyaltyCampaigns.id, id))
      .returning();
    return campaign;
  }

  async adjustUserPoints(userId: string, points: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      const now = new Date();
      
      // 1. Create loyalty event
      await tx.insert(userLoyaltyEvents).values({
        userId,
        action: "ADMIN_ADJUSTMENT",
        points,
        source: "admin",
        metadata: { reason },
      });

      // 2. Get existing user points
      const [existingPoints] = await tx
        .select()
        .from(userPointsTotal)
        .where(eq(userPointsTotal.userId, userId));

      // 3. Calculate new totals and rank
      const newTotalPoints = (existingPoints?.totalPoints || 0) + points;
      const newLifetimePoints = (existingPoints?.lifetimePoints || 0) + (points > 0 ? points : 0);
      const newRank = this.calculateRank(newTotalPoints);

      // 4. Update or insert user points
      if (existingPoints) {
        await tx
          .update(userPointsTotal)
          .set({
            totalPoints: newTotalPoints,
            lifetimePoints: newLifetimePoints,
            currentRank: newRank,
            lastActivityAt: now,
            updatedAt: now,
          })
          .where(eq(userPointsTotal.userId, userId));
      } else {
        await tx.insert(userPointsTotal).values({
          userId,
          totalPoints: newTotalPoints,
          lifetimePoints: newLifetimePoints,
          currentRank: newRank,
          lastActivityAt: now,
        });
      }
    });
  }
}

export const storage = new DatabaseStorage();
