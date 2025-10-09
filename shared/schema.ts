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

// Users table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Keep existing structure - no default
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // bcrypt hashed password
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("reader"),
  status: text("status").default("active").notNull(), // active, suspended, banned
  isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
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
  heroImageUrl: text("hero_image_url"),
  displayOrder: integer("display_order").default(0),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Articles (supports both news and opinion pieces)
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  categoryId: varchar("category_id").references(() => categories.id),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  articleType: text("article_type").default("news").notNull(), // news, opinion, analysis, column
  newsType: text("news_type").default("regular").notNull(), // breaking, featured, regular
  publishType: text("publish_type").default("instant").notNull(), // instant, scheduled
  scheduledAt: timestamp("scheduled_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, published, archived
  aiSummary: text("ai_summary"),
  aiGenerated: boolean("ai_generated").default(false),
  isFeatured: boolean("is_featured").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  seo: jsonb("seo").$type<{
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  }>(),
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

// Comments with status management
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, flagged
  parentId: varchar("parent_id"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationReason: text("moderation_reason"),
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

// User interests (many-to-many) with weights - links users to categories they're interested in
export const userInterests = pgTable("user_interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
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

// Roles for RBAC
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Permissions for granular access control
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // e.g., "articles.create", "users.ban"
  label: text("label").notNull(),
  labelAr: text("label_ar").notNull(),
  module: text("module").notNull(), // articles, users, categories, comments, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Role-Permission mapping (many-to-many)
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: varchar("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-Role mapping (updated to support RBAC)
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: varchar("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Staff (reporters, writers, supervisors)
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  title: text("title"),
  titleAr: text("title_ar"),
  bio: text("bio"),
  bioAr: text("bio_ar"),
  profileImage: text("profile_image"),
  staffType: text("staff_type").notNull(), // reporter, writer, supervisor
  specializations: text("specializations").array().default(sql`ARRAY[]::text[]`).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  publishedCount: integer("published_count").default(0).notNull(),
  totalViews: integer("total_views").default(0).notNull(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity logs for audit trail
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // create, update, delete, publish, etc.
  entityType: text("entity_type").notNull(), // article, user, category, etc.
  entityId: varchar("entity_id").notNull(),
  oldValue: jsonb("old_value").$type<Record<string, any>>(),
  newValue: jsonb("new_value").$type<Record<string, any>>(),
  metadata: jsonb("metadata").$type<{
    ip?: string;
    userAgent?: string;
    reason?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification Templates
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().unique(), // BreakingNews, InterestMatch, LikedStoryUpdate, MostReadTodayForYou
  channel: text("channel").notNull(), // in-app, web-push, email, daily-digest
  titleAr: text("title_ar").notNull(),
  bodyAr: text("body_ar").notNull(),
  deeplinkPattern: text("deeplink_pattern"), // e.g., "/news/{slug}"
  ctaLabelAr: text("cta_label_ar"), // e.g., "افتح الخبر"
  priority: integer("priority").default(50).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Notification Preferences
export const userNotificationPrefs = pgTable("user_notification_prefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  breaking: boolean("breaking").default(true).notNull(),
  interest: boolean("interest").default(true).notNull(),
  likedUpdates: boolean("liked_updates").default(true).notNull(),
  mostRead: boolean("most_read").default(true).notNull(),
  webPush: boolean("web_push").default(false).notNull(),
  dailyDigest: boolean("daily_digest").default(false).notNull(),
  quietHoursStart: text("quiet_hours_start").default("23:00"),
  quietHoursEnd: text("quiet_hours_end").default("08:00"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification Queue
export const notificationQueue = pgTable("notification_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // BreakingNews, InterestMatch, LikedStoryUpdate, MostReadTodayForYou
  payload: jsonb("payload").$type<{
    articleId?: string;
    articleTitle?: string;
    matchedTopic?: string;
    deeplink?: string;
  }>().notNull(),
  priority: integer("priority").default(50).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  status: text("status").default("queued").notNull(), // queued, sent, error
  dedupeKey: text("dedupe_key").notNull().unique(), // user_id:article_id:type (unique to prevent duplicates)
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notification_queue_user_status").on(table.userId, table.status),
  index("idx_notification_queue_scheduled").on(table.scheduledAt),
]);

// Notifications Inbox (user's notification feed)
export const notificationsInbox = pgTable("notifications_inbox", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  deeplink: text("deeplink"),
  read: boolean("read").default(false).notNull(),
  metadata: jsonb("metadata").$type<{
    articleId?: string;
    imageUrl?: string;
    categorySlug?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_inbox_user_created").on(table.userId, table.createdAt),
  index("idx_notifications_inbox_read").on(table.userId, table.read),
]);

// Notification metrics for analytics
export const notificationMetrics = pgTable("notification_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id").references(() => notificationsInbox.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  opened: boolean("opened").default(false).notNull(),
  clicked: boolean("clicked").default(false).notNull(),
  dismissed: boolean("dismissed").default(false).notNull(),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notification_metrics_type").on(table.type),
]);

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
  isProfileComplete: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  status: z.enum(["active", "suspended", "banned"], {
    errorMap: () => ({ message: "الحالة يجب أن تكون: نشط، معلق، أو محظور" })
  }).optional(),
  roleId: z.string().uuid("معرف الدور غير صحيح").optional(),
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
export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true, 
  createdAt: true,
  moderatedBy: true,
  moderatedAt: true,
  moderationReason: true,
});
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

export const insertRoleSchema = createInsertSchema(roles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true, createdAt: true });

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true, createdAt: true });

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ 
  id: true, 
  assignedAt: true 
});

export const insertStaffSchema = createInsertSchema(staff).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  publishedCount: true,
  totalViews: true,
  lastActiveAt: true,
});

export const updateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  nameAr: z.string().min(2).optional(),
  title: z.string().optional(),
  titleAr: z.string().optional(),
  bio: z.string().optional(),
  bioAr: z.string().optional(),
  profileImage: z.string().url().optional(),
  staffType: z.enum(["reporter", "writer", "supervisor"]).optional(),
  specializations: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserNotificationPrefsSchema = createInsertSchema(userNotificationPrefs).omit({ 
  id: true, 
  updatedAt: true 
});

export const updateUserNotificationPrefsSchema = z.object({
  breaking: z.boolean().optional(),
  interest: z.boolean().optional(),
  likedUpdates: z.boolean().optional(),
  mostRead: z.boolean().optional(),
  webPush: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "صيغة الوقت غير صحيحة").optional(),
  quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "صيغة الوقت غير صحيحة").optional(),
});

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({ 
  id: true, 
  createdAt: true,
  sentAt: true,
  errorMessage: true,
});

export const insertNotificationsInboxSchema = createInsertSchema(notificationsInbox).omit({ 
  id: true, 
  createdAt: true 
});

export const insertNotificationMetricsSchema = createInsertSchema(notificationMetrics).omit({ 
  id: true, 
  createdAt: true,
  openedAt: true,
  clickedAt: true,
  dismissedAt: true,
});

export const updateArticleSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").optional(),
  subtitle: z.string().max(120, "العنوان الفرعي يجب ألا يتجاوز 120 حرف").optional(),
  slug: z.string().min(3).optional(),
  content: z.string().min(10, "المحتوى يجب أن يكون 10 أحرف على الأقل").optional(),
  excerpt: z.string().optional(),
  imageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
  categoryId: z.union([
    z.string().uuid("معرف التصنيف غير صحيح"),
    z.literal(""),
    z.null()
  ]).optional(),
  articleType: z.enum(["news", "opinion", "analysis", "column"]).optional(),
  newsType: z.enum(["breaking", "featured", "regular"]).optional(),
  publishType: z.enum(["instant", "scheduled"]).optional(),
  scheduledAt: z.string().datetime().optional().or(z.null()),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  aiSummary: z.string().optional().or(z.null()),
  isFeatured: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().or(z.null()),
  seo: z.object({
    metaTitle: z.string().max(70, "عنوان SEO يجب ألا يتجاوز 70 حرف").optional(),
    metaDescription: z.string().max(160, "وصف SEO يجب ألا يتجاوز 160 حرف").optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export const adminArticleFiltersSchema = z.object({
  status: z.enum(["draft", "scheduled", "published", "archived", "all"]).optional(),
  articleType: z.enum(["news", "opinion", "analysis", "column", "all"]).optional(),
  categoryId: z.string().uuid().optional(),
  authorId: z.string().optional(),
  search: z.string().optional(),
  featured: z.boolean().optional(),
});

export const updateCommentStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "flagged"]),
  moderationReason: z.string().optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid("معرف الصلاحية غير صحيح")),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type UpdateArticle = z.infer<typeof updateArticleSchema>;
export type AdminArticleFilters = z.infer<typeof adminArticleFiltersSchema>;

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

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type UpdateStaff = z.infer<typeof updateStaffSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;

export type UserNotificationPrefs = typeof userNotificationPrefs.$inferSelect;
export type InsertUserNotificationPrefs = z.infer<typeof insertUserNotificationPrefsSchema>;
export type UpdateUserNotificationPrefs = z.infer<typeof updateUserNotificationPrefsSchema>;

export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;

export type NotificationsInbox = typeof notificationsInbox.$inferSelect;
export type InsertNotificationsInbox = z.infer<typeof insertNotificationsInboxSchema>;

export type NotificationMetrics = typeof notificationMetrics.$inferSelect;
export type InsertNotificationMetrics = z.infer<typeof insertNotificationMetricsSchema>;

export type UpdateCommentStatus = z.infer<typeof updateCommentStatusSchema>;
export type UpdateRolePermissions = z.infer<typeof updateRolePermissionsSchema>;

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
  moderator?: User;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
  userCount?: number;
};

export type StaffWithUser = Staff & {
  user?: User;
  role?: Role;
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
