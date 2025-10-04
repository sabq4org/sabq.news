import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with Replit Auth integration
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("reader"),
  isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// News categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// News articles
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  categoryId: varchar("category_id").references(() => categories.id),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("draft"),
  aiSummary: text("ai_summary"),
  aiGenerated: boolean("ai_generated").default(false),
  views: integer("views").default(0).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RSS feeds for import
export const rssFeeds = pgTable("rss_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  categoryId: varchar("category_id").references(() => categories.id),
  isActive: boolean("is_active").default(true).notNull(),
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User reading history for recommendations
export const readingHistory = pgTable("reading_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
  readDuration: integer("read_duration"),
});

// Comments
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Likes/reactions
export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull().default("like"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bookmarks/saved articles
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User preferences for recommendations
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  preferredCategories: jsonb("preferred_categories").$type<string[]>(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Interests for personalization system
export const interests = pgTable("interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: text("name_ar").notNull().unique(),
  nameEn: text("name_en").notNull().unique(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User interests (many-to-many) with weights
export const userInterests = pgTable("user_interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  interestId: varchar("interest_id").references(() => interests.id).notNull(),
  weight: real("weight").default(1.0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Behavior tracking logs
export const behaviorLogs = pgTable("behavior_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata").$type<{
    articleId?: string;
    categoryId?: string;
    duration?: number;
    query?: string;
    action?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sentiment analysis scores
export const sentimentScores = pgTable("sentiment_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  overallScore: real("overall_score").notNull(),
  emotionalBreakdown: jsonb("emotional_breakdown").$type<{
    enthusiasm?: number;
    satisfaction?: number;
    anger?: number;
    sadness?: number;
    neutral?: number;
  }>(),
  articleId: varchar("article_id").references(() => articles.id),
  commentId: varchar("comment_id").references(() => comments.id),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Theme management system
export const themes = pgTable("themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isDefault: boolean("is_default").default(false).notNull(),
  priority: integer("priority").default(0).notNull(),
  status: text("status").notNull().default("draft"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  assets: jsonb("assets").$type<{
    logoLight?: string;
    logoDark?: string;
    favicon?: string;
    banner?: string;
    ogImage?: string;
  }>(),
  tokens: jsonb("tokens").$type<{
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
    spacing?: Record<string, string>;
    borderRadius?: Record<string, string>;
  }>(),
  applyTo: text("apply_to").array().default(sql`ARRAY[]::text[]`).notNull(),
  version: integer("version").default(1).notNull(),
  changelog: jsonb("changelog").$type<Array<{
    version: number;
    changes: string;
    timestamp: string;
    userId: string;
  }>>(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  publishedBy: varchar("published_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Theme audit log for tracking changes
export const themeAuditLog = pgTable("theme_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  themeId: varchar("theme_id").references(() => themes.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  changes: jsonb("changes").$type<Record<string, any>>(),
  metadata: jsonb("metadata").$type<{
    previousStatus?: string;
    newStatus?: string;
    reason?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  isProfileComplete: true,
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل").optional(),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل").optional(),
  bio: z.string().max(500, "النبذة يجب أن لا تزيد عن 500 حرف").optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  profileImageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
});
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  views: true,
  aiGenerated: true,
});
export const insertRssFeedSchema = createInsertSchema(rssFeeds).omit({ 
  id: true, 
  createdAt: true,
  lastFetchedAt: true,
});
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true, createdAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true });
export const insertInterestSchema = createInsertSchema(interests).omit({ id: true, createdAt: true });
export const insertUserInterestSchema = createInsertSchema(userInterests).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertBehaviorLogSchema = createInsertSchema(behaviorLogs).omit({ id: true, createdAt: true });
export const insertSentimentScoreSchema = createInsertSchema(sentimentScores).omit({ id: true, createdAt: true });
export const insertThemeSchema = createInsertSchema(themes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  version: true,
});
export const updateThemeSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  isDefault: z.boolean().optional(),
  priority: z.number().int().min(0).max(9999).optional(),
  status: z.enum(["draft", "review", "scheduled", "active", "expired", "disabled"]).optional(),
  startAt: z.string().datetime().optional().or(z.null()),
  endAt: z.string().datetime().optional().or(z.null()),
  assets: z.object({
    logoLight: z.string().url().optional(),
    logoDark: z.string().url().optional(),
    favicon: z.string().url().optional(),
    banner: z.string().url().optional(),
    ogImage: z.string().url().optional(),
  }).optional(),
  tokens: z.object({
    colors: z.record(z.string()).optional(),
    fonts: z.record(z.string()).optional(),
    spacing: z.record(z.string()).optional(),
    borderRadius: z.record(z.string()).optional(),
  }).optional(),
  applyTo: z.array(z.string()).optional(),
  approvedBy: z.string().optional().or(z.null()),
  publishedBy: z.string().optional().or(z.null()),
});
export const insertThemeAuditLogSchema = createInsertSchema(themeAuditLog).omit({ id: true, createdAt: true });

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type RssFeed = typeof rssFeeds.$inferSelect;
export type InsertRssFeed = z.infer<typeof insertRssFeedSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type ReadingHistory = typeof readingHistory.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;

export type Interest = typeof interests.$inferSelect;
export type InsertInterest = z.infer<typeof insertInterestSchema>;

export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;

export type BehaviorLog = typeof behaviorLogs.$inferSelect;
export type InsertBehaviorLog = z.infer<typeof insertBehaviorLogSchema>;

export type SentimentScore = typeof sentimentScores.$inferSelect;
export type InsertSentimentScore = z.infer<typeof insertSentimentScoreSchema>;

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type UpdateTheme = z.infer<typeof updateThemeSchema>;

export type ThemeAuditLog = typeof themeAuditLog.$inferSelect;
export type InsertThemeAuditLog = z.infer<typeof insertThemeAuditLogSchema>;

// Extended types with joins for frontend
export type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
  isBookmarked?: boolean;
  hasReacted?: boolean;
};

export type CommentWithUser = Comment & {
  user: User;
  replies?: CommentWithUser[];
};

export type InterestWithWeight = Interest & {
  weight: number;
};

export type UserProfile = User & {
  interests?: InterestWithWeight[];
  behaviorSummary?: {
    last7Days: {
      clicks: Record<string, number>;
      avgReadTime: Record<string, number>;
      searches: string[];
      interactions: {
        shares: number;
        comments: number;
        likes: number;
      };
    };
  };
  sentimentProfile?: {
    overallScore: number;
    emotionalBreakdown: {
      enthusiasm: number;
      satisfaction: number;
      anger: number;
      sadness: number;
      neutral: number;
    };
    trendingSentiments: string[];
  };
};
