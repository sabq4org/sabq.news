import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index, real, primaryKey } from "drizzle-orm/pg-core";
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
  status: text("status").default("active").notNull(), // active, pending, suspended, banned, locked, deleted
  isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
  
  // Verification fields
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  verificationBadge: text("verification_badge").default("none").notNull(), // none, silver, gold
  
  // Activity tracking
  lastActivityAt: timestamp("last_activity_at"),
  
  // Suspension fields
  suspendedUntil: timestamp("suspended_until"),
  suspensionReason: text("suspension_reason"),
  
  // Ban fields
  bannedUntil: timestamp("banned_until"),
  banReason: text("ban_reason"),
  
  // Security lock fields
  accountLocked: boolean("account_locked").default(false).notNull(),
  lockedUntil: timestamp("locked_until"),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  
  // Soft delete
  deletedAt: timestamp("deleted_at"),
  
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
  reporterId: varchar("reporter_id").references(() => users.id),
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
  credibilityScore: integer("credibility_score"),
  credibilityAnalysis: text("credibility_analysis"),
  credibilityLastUpdated: timestamp("credibility_last_updated"),
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

// System settings for configurable application settings
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  category: text("category").default("system").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  slug: text("slug").notNull().unique(),
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
  isVerified: boolean("is_verified").default(false).notNull(),
  publishedCount: integer("published_count").default(0).notNull(),
  totalViews: integer("total_views").default(0).notNull(),
  totalLikes: integer("total_likes").default(0).notNull(),
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
    articleSlug?: string;
    imageUrl?: string;
    categorySlug?: string;
    articleIds?: string[];
    recommendationType?: string;
    similarToArticleId?: string;
    [key: string]: any; // Allow additional metadata fields
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

// User Loyalty Events (points earning log)
export const userLoyaltyEvents = pgTable("user_loyalty_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // READ, LIKE, SHARE, COMMENT, NOTIFICATION_OPEN, etc.
  points: integer("points").notNull(),
  source: text("source"), // article_id, comment_id, etc.
  campaignId: varchar("campaign_id").references(() => loyaltyCampaigns.id), // للربط بالحملة
  metadata: jsonb("metadata").$type<{
    articleId?: string;
    commentId?: string;
    duration?: number;
    extraInfo?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_loyalty_events_user_created").on(table.userId, table.createdAt),
  index("idx_loyalty_events_action").on(table.action),
]);

// User Points Total (aggregated points and rank)
export const userPointsTotal = pgTable("user_points_total", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  totalPoints: integer("total_points").default(0).notNull(),
  currentRank: text("current_rank").default("القارئ الجديد").notNull(), // القارئ الجديد, المتفاعل, العضو الذهبي, سفير سبق
  lifetimePoints: integer("lifetime_points").default(0).notNull(), // لا ينقص أبداً
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Rewards (available rewards)
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  pointsCost: integer("points_cost").notNull(),
  rewardType: text("reward_type").notNull(), // COUPON, BADGE, CONTENT_ACCESS, PARTNER_REWARD
  partnerName: text("partner_name"), // STC, Jarir, Noon, etc.
  rewardData: jsonb("reward_data").$type<{
    couponCode?: string;
    badgeIcon?: string;
    partnerApiData?: Record<string, any>;
  }>(),
  stock: integer("stock"), // null = unlimited
  remainingStock: integer("remaining_stock"), // يتناقص مع كل استبدال
  maxRedemptionsPerUser: integer("max_redemptions_per_user"), // null = unlimited
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Rewards History (reward redemption log)
export const userRewardsHistory = pgTable("user_rewards_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: varchar("reward_id").references(() => loyaltyRewards.id).notNull(),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status").default("pending").notNull(), // pending, delivered, expired, cancelled
  rewardSnapshot: jsonb("reward_snapshot").$type<{
    nameAr: string;
    nameEn: string;
    pointsCost: number;
    rewardType: string;
  }>(), // لحفظ تفاصيل الجائزة وقت الاستبدال
  deliveryData: jsonb("delivery_data").$type<{
    couponCode?: string;
    trackingInfo?: string;
  }>(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
}, (table) => [
  index("idx_rewards_history_user").on(table.userId),
  index("idx_rewards_history_status").on(table.status),
]);

// Loyalty Campaigns (promotional campaigns)
export const loyaltyCampaigns = pgTable("loyalty_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  campaignType: text("campaign_type").notNull(), // BONUS_POINTS, MULTIPLIER, SPECIAL_EVENT
  targetAction: text("target_action"), // READ, SHARE, etc. (null = all actions)
  multiplier: real("multiplier").default(1.0), // 2.0 = نقاط مضاعفة
  bonusPoints: integer("bonus_points").default(0),
  targetCategory: varchar("target_category").references(() => categories.id), // null = all categories
  isActive: boolean("is_active").default(true).notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_campaigns_active_dates").on(table.isActive, table.startAt, table.endAt),
]);

// Sections table (for organizing angles)
export const sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Angles table (زوايا - thematic perspectives)
export const angles = pgTable("angles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").references(() => sections.id).notNull(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  slug: text("slug").notNull().unique(),
  colorHex: text("color_hex").notNull(), // #RRGGBB format
  iconKey: text("icon_key").notNull(), // Lucide icon name
  coverImageUrl: text("cover_image_url"),
  shortDesc: text("short_desc"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_angles_active").on(table.isActive),
  index("idx_angles_sort").on(table.sortOrder),
]);

// Junction table for article-angle many-to-many
export const articleAngles = pgTable("article_angles", {
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  angleId: varchar("angle_id").references(() => angles.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.articleId, table.angleId] }),
  articleIdx: index("idx_article_angles_article").on(table.articleId),
  angleIdx: index("idx_article_angles_angle").on(table.angleId),
}));

// Image assets table for managing uploads
export const imageAssets = pgTable("image_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  mimeType: text("mime_type"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags table (الوسوم)
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  usageCount: integer("usage_count").default(0).notNull(),
  color: text("color"),
  status: text("status").default("active").notNull(), // active, inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tags_slug").on(table.slug),
  index("idx_tags_status").on(table.status),
]);

// Junction table for article-tag many-to-many
export const articleTags = pgTable("article_tags", {
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  tagId: varchar("tag_id").references(() => tags.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.articleId, table.tagId] }),
  articleIdx: index("idx_article_tags_article").on(table.articleId),
  tagIdx: index("idx_article_tags_tag").on(table.tagId),
}));

// User followed terms (for keyword following feature)
export const userFollowedTerms = pgTable("user_followed_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tagId: varchar("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
  notify: boolean("notify").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniq: index("user_followed_terms_user_tag_idx").on(table.userId, table.tagId),
}));

// ============================================
// Smart Recommendations & Personalization Tables
// ============================================

// User events tracking (unified interaction tracking)
export const userEvents = pgTable("user_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(), // 'like', 'save', 'read', 'share', 'comment'
  eventValue: integer("event_value").default(1).notNull(), // weight for scoring (like=3, save=2, read=1, share=4)
  metadata: jsonb("metadata").$type<{
    readDuration?: number; // seconds
    scrollDepth?: number; // percentage 0-100
    referrer?: string;
    deviceType?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_events_user").on(table.userId),
  index("idx_user_events_article").on(table.articleId),
  index("idx_user_events_type").on(table.eventType),
  index("idx_user_events_created").on(table.createdAt),
]);

// User affinities (derived preferences - updated periodically)
export const userAffinities = pgTable("user_affinities", {
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tag: text("tag").notNull(), // tag name, category slug, entity name
  tagType: text("tag_type").notNull(), // 'tag', 'category', 'entity', 'topic'
  score: real("score").notNull(), // 0.0 - 1.0
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.tag] }),
  userIdx: index("idx_user_affinities_user").on(table.userId),
  scoreIdx: index("idx_user_affinities_score").on(table.score),
}));

// Content vectors (embeddings for similarity matching)
export const contentVectors = pgTable("content_vectors", {
  articleId: varchar("article_id").primaryKey().references(() => articles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(), // tag slugs
  entities: text("entities").array().default(sql`ARRAY[]::text[]`).notNull(), // extracted entities (people, places, organizations)
  embedding: jsonb("embedding").$type<number[]>(), // 1024-dim embedding vector (from OpenAI text-embedding-3-large)
  embeddingModel: text("embedding_model").default("text-embedding-3-large"), // track which model was used
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_content_vectors_published").on(table.publishedAt),
]);

// Recommendation log (track sent recommendations to prevent spam/duplicates)
export const recommendationLog = pgTable("recommendation_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(), // 'because_you_liked', 'similar_to_saved', 'within_reads', 'trending_for_you'
  score: real("score").notNull(), // similarity score that triggered the recommendation
  channel: text("channel").notNull(), // 'notification', 'feed', 'email', 'digest'
  metadata: jsonb("metadata").$type<{
    similarToArticleId?: string; // reference article that triggered this recommendation
    triggerEvent?: string; // what event triggered this (e.g., 'article_published')
    abTestVariant?: string; // for A/B testing
  }>(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => [
  index("idx_recommendation_log_user").on(table.userId),
  index("idx_recommendation_log_article").on(table.articleId),
  index("idx_recommendation_log_sent").on(table.sentAt),
  index("idx_recommendation_log_reason").on(table.reason),
]);

// User recommendation preferences (enhanced notification preferences for recommendations)
export const userRecommendationPrefs = pgTable("user_recommendation_prefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  // Notification types
  becauseYouLiked: boolean("because_you_liked").default(true).notNull(),
  similarToSaved: boolean("similar_to_saved").default(true).notNull(),
  withinReads: boolean("within_reads").default(true).notNull(),
  trendingForYou: boolean("trending_for_you").default(true).notNull(),
  // Digest preferences
  dailyDigest: boolean("daily_digest").default(false).notNull(),
  digestTime: text("digest_time").default("20:30"), // 8:30 PM
  // Frequency limits
  maxDailyPersonal: integer("max_daily_personal").default(3).notNull(), // max personal recommendations per day
  cooldownHours: integer("cooldown_hours").default(6).notNull(), // hours between similar notifications
  // A/B testing
  abTestGroup: text("ab_test_group").default("control"), // for experiments
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recommendation metrics (for analytics and A/B testing)
export const recommendationMetrics = pgTable("recommendation_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recommendationId: varchar("recommendation_id").references(() => recommendationLog.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  // Engagement tracking
  viewed: boolean("viewed").default(false).notNull(),
  clicked: boolean("clicked").default(false).notNull(),
  read: boolean("read").default(false).notNull(), // stayed >30s or >40% scroll
  liked: boolean("liked").default(false).notNull(),
  saved: boolean("saved").default(false).notNull(),
  shared: boolean("shared").default(false).notNull(),
  muted: boolean("muted").default(false).notNull(), // user muted this type of recommendation
  // Timing
  viewedAt: timestamp("viewed_at"),
  clickedAt: timestamp("clicked_at"),
  readAt: timestamp("read_at"),
  timeToClick: integer("time_to_click"), // seconds from notification to click
  readDuration: integer("read_duration"), // seconds spent reading
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_recommendation_metrics_user").on(table.userId),
  index("idx_recommendation_metrics_article").on(table.articleId),
  index("idx_recommendation_metrics_clicked").on(table.clicked),
  index("idx_recommendation_metrics_muted").on(table.muted),
]);

// ============================================
// Story Following/Tracking Tables
// ============================================

// Stories (news clusters)
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  rootArticleId: varchar("root_article_id").references(() => articles.id).notNull(),
  entities: jsonb("entities").$type<Record<string, any>>(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Story links (linking articles to stories)
export const storyLinks = pgTable("story_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id).notNull(),
  articleId: varchar("article_id").references(() => articles.id).notNull(),
  relation: text("relation").notNull(), // 'root' or 'followup'
  confidence: real("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_story_links_story").on(table.storyId),
  index("idx_story_links_article").on(table.articleId),
]);

// Story follows (user subscriptions)
export const storyFollows = pgTable("story_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  storyId: varchar("story_id").references(() => stories.id).notNull(),
  level: text("level").default("all").notNull(), // 'all', 'breaking', 'analysis', 'official'
  channels: text("channels").array().default(sql`ARRAY['inapp']::text[]`).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_story_follows_user").on(table.userId),
  index("idx_story_follows_story").on(table.storyId),
]);

// Story notifications (notification log)
export const storyNotifications = pgTable("story_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id).notNull(),
  articleId: varchar("article_id").references(() => articles.id),
  deliveredTo: text("delivered_to").array().default(sql`ARRAY[]::text[]`).notNull(),
  channel: text("channel").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_story_notifications_story").on(table.storyId),
  index("idx_story_notifications_article").on(table.articleId),
]);

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  isProfileComplete: true,
  lastActivityAt: true,
  emailVerified: true,
  phoneVerified: true,
  verificationBadge: true,
  suspendedUntil: true,
  suspensionReason: true,
  bannedUntil: true,
  banReason: true,
  accountLocked: true,
  lockedUntil: true,
  failedLoginAttempts: true,
  deletedAt: true,
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
  status: z.enum(["active", "pending", "suspended", "banned", "locked", "deleted"], {
    errorMap: () => ({ message: "الحالة يجب أن تكون: نشط، معلق، محظور، أو مقفل" })
  }).optional(),
  roleId: z.string().uuid("معرف الدور غير صحيح").optional(),
  verificationBadge: z.enum(["none", "silver", "gold"]).optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
});

// Admin schema for creating new users with roles
export const adminCreateUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  roleIds: z.array(z.string().uuid("معرف الدور غير صحيح")).min(1, "يجب اختيار دور واحد على الأقل"),
  status: z.enum(["active", "pending", "suspended", "banned", "locked"]).default("active"),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
});

// Admin schema for updating user roles (bulk update)
export const adminUpdateUserRolesSchema = z.object({
  roleIds: z.array(z.string().uuid("معرف الدور غير صحيح")).min(1, "يجب اختيار دور واحد على الأقل"),
  reason: z.string().min(5, "يجب إدخال سبب التغيير (5 أحرف على الأقل)").optional(),
});

export const suspendUserSchema = z.object({
  reason: z.string().min(5, "يجب إدخال سبب التعليق (5 أحرف على الأقل)"),
  duration: z.number().int().positive().optional(), // in days
});

export const banUserSchema = z.object({
  reason: z.string().min(5, "يجب إدخال سبب الحظر (5 أحرف على الأقل)"),
  isPermanent: z.boolean().default(false),
  duration: z.number().int().positive().optional(), // in days, only if not permanent
});
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  views: true,
  aiGenerated: true,
  credibilityScore: true,
  credibilityAnalysis: true,
  credibilityLastUpdated: true,
  authorId: true, // Backend adds this from req.user.id
}).extend({
  slug: z.string().max(150, "الرابط (slug) يجب أن لا يتجاوز 150 حرف"),
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
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertThemeSchema = createInsertSchema(themes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  version: true,
}).extend({
  // Override dates to accept null, empty strings, undefined, or valid datetime
  startAt: z.union([z.null(), z.literal(''), z.undefined(), z.string().datetime()]).optional(),
  endAt: z.union([z.null(), z.literal(''), z.undefined(), z.string().datetime()]).optional(),
  // Override assets to accept null, empty strings, undefined, or valid URLs
  assets: z.object({
    logoLight: z.union([z.null(), z.literal(''), z.undefined(), z.string().url()]).optional(),
    logoDark: z.union([z.null(), z.literal(''), z.undefined(), z.string().url()]).optional(),
    favicon: z.union([z.null(), z.literal(''), z.undefined(), z.string().url()]).optional(),
    banner: z.union([z.null(), z.literal(''), z.undefined(), z.string().url()]).optional(),
    ogImage: z.union([z.null(), z.literal(''), z.undefined(), z.string().url()]).optional(),
  }).optional().nullable(),
});
export const updateThemeSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  isDefault: z.boolean().optional(),
  priority: z.number().int().min(0).max(9999).optional(),
  status: z.enum(["draft", "review", "scheduled", "active", "expired", "disabled"]).optional(),
  startAt: z.union([z.literal(''), z.null(), z.undefined(), z.string().datetime()]).optional(),
  endAt: z.union([z.literal(''), z.null(), z.undefined(), z.string().datetime()]).optional(),
  assets: z.object({
    logoLight: z.union([z.literal(''), z.null(), z.undefined(), z.string().url()]).optional(),
    logoDark: z.union([z.literal(''), z.null(), z.undefined(), z.string().url()]).optional(),
    favicon: z.union([z.literal(''), z.null(), z.undefined(), z.string().url()]).optional(),
    banner: z.union([z.literal(''), z.null(), z.undefined(), z.string().url()]).optional(),
    ogImage: z.union([z.literal(''), z.null(), z.undefined(), z.string().url()]).optional(),
  }).optional().nullable(),
  tokens: z.object({
    colors: z.record(z.string()).optional(),
    fonts: z.record(z.string()).optional(),
    spacing: z.record(z.string()).optional(),
    borderRadius: z.record(z.string()).optional(),
  }).optional(),
  applyTo: z.array(z.string()).optional(),
  approvedBy: z.union([z.string(), z.null()]).optional(),
  publishedBy: z.union([z.string(), z.null()]).optional(),
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

export const insertUserLoyaltyEventSchema = createInsertSchema(userLoyaltyEvents).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserPointsTotalSchema = createInsertSchema(userPointsTotal).omit({ 
  createdAt: true, 
  updatedAt: true 
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserRewardsHistorySchema = createInsertSchema(userRewardsHistory).omit({ 
  id: true, 
  redeemedAt: true,
  deliveredAt: true,
});

export const insertLoyaltyCampaignSchema = createInsertSchema(loyaltyCampaigns).omit({ 
  id: true, 
  createdAt: true 
});

export const insertSectionSchema = createInsertSchema(sections).omit({ 
  id: true, 
  createdAt: true 
});

export const insertAngleSchema = createInsertSchema(angles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertArticleAngleSchema = createInsertSchema(articleAngles).omit({ 
  createdAt: true 
});

export const insertImageAssetSchema = createInsertSchema(imageAssets).omit({ 
  id: true, 
  createdAt: true 
});

export const insertTagSchema = createInsertSchema(tags).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  usageCount: true,
});

export const updateTagSchema = z.object({
  nameAr: z.string().min(2, "الاسم بالعربية يجب أن يكون حرفين على الأقل").optional(),
  nameEn: z.string().min(2, "الاسم بالإنجليزية يجب أن يكون حرفين على الأقل").optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});

export const insertArticleTagSchema = createInsertSchema(articleTags).omit({ 
  createdAt: true 
});

export const insertUserFollowedTermSchema = createInsertSchema(userFollowedTerms).omit({
  id: true,
  createdAt: true,
});

// Recommendation system schemas
export const insertUserEventSchema = createInsertSchema(userEvents).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserAffinitySchema = createInsertSchema(userAffinities).omit({ 
  updatedAt: true 
});

export const insertContentVectorSchema = createInsertSchema(contentVectors).omit({ 
  createdAt: true, 
  updatedAt: true 
});

export const insertRecommendationLogSchema = createInsertSchema(recommendationLog).omit({ 
  id: true, 
  sentAt: true 
});

export const insertUserRecommendationPrefsSchema = createInsertSchema(userRecommendationPrefs).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateUserRecommendationPrefsSchema = z.object({
  becauseYouLiked: z.boolean().optional(),
  similarToSaved: z.boolean().optional(),
  withinReads: z.boolean().optional(),
  trendingForYou: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  digestTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "صيغة الوقت غير صحيحة").optional(),
  maxDailyPersonal: z.number().int().min(0).max(10).optional(),
  cooldownHours: z.number().int().min(1).max(24).optional(),
  abTestGroup: z.string().optional(),
});

export const insertRecommendationMetricsSchema = createInsertSchema(recommendationMetrics).omit({ 
  id: true, 
  createdAt: true,
  viewedAt: true,
  clickedAt: true,
  readAt: true,
});

// Story tracking schemas
export const insertStorySchema = createInsertSchema(stories).omit({ 
  id: true, 
  createdAt: true 
});

export const insertStoryLinkSchema = createInsertSchema(storyLinks).omit({ 
  id: true, 
  createdAt: true 
});

export const insertStoryFollowSchema = createInsertSchema(storyFollows).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertStoryNotificationSchema = createInsertSchema(storyNotifications).omit({ 
  id: true, 
  createdAt: true 
});

export const updateArticleSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").optional(),
  subtitle: z.string().max(120, "العنوان الفرعي يجب ألا يتجاوز 120 حرف").optional(),
  slug: z.string().min(3).max(150, "الرابط (slug) يجب أن لا يتجاوز 150 حرف").optional(),
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

// Activity type for unified timeline
export const ActivitySchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "article_published","article_updated","breaking_news",
    "comment_added","reaction_added","bookmark_added",
    "category_created","tag_created",
    "user_registered","role_changed"
  ]),
  occurredAt: z.string().datetime(),
  actor: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    avatarUrl: z.string().url().optional()
  }).optional(),
  target: z.object({
    id: z.string().optional(),
    kind: z.enum(["article","category","tag","user"]).optional(),
    title: z.string().optional(),
    slug: z.string().optional(),
    url: z.string().url().optional(),
    imageUrl: z.string().url().optional()
  }).optional(),
  importance: z.enum(["low","normal","high","urgent"]).default("normal"),
  summary: z.string().optional()
});

export type Activity = z.infer<typeof ActivitySchema>;

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type AdminCreateUser = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUser = z.infer<typeof adminUpdateUserSchema>;
export type AdminUpdateUserRoles = z.infer<typeof adminUpdateUserRolesSchema>;

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

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

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

// Recommendation system types
export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;

export type UserAffinity = typeof userAffinities.$inferSelect;
export type InsertUserAffinity = z.infer<typeof insertUserAffinitySchema>;

export type ContentVector = typeof contentVectors.$inferSelect;
export type InsertContentVector = z.infer<typeof insertContentVectorSchema>;

export type RecommendationLog = typeof recommendationLog.$inferSelect;
export type InsertRecommendationLog = z.infer<typeof insertRecommendationLogSchema>;

export type UserRecommendationPrefs = typeof userRecommendationPrefs.$inferSelect;
export type InsertUserRecommendationPrefs = z.infer<typeof insertUserRecommendationPrefsSchema>;
export type UpdateUserRecommendationPrefs = z.infer<typeof updateUserRecommendationPrefsSchema>;

export type RecommendationMetrics = typeof recommendationMetrics.$inferSelect;
export type InsertRecommendationMetrics = z.infer<typeof insertRecommendationMetricsSchema>;

export type UpdateCommentStatus = z.infer<typeof updateCommentStatusSchema>;
export type UpdateRolePermissions = z.infer<typeof updateRolePermissionsSchema>;

// Extended types with joins for frontend
export type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  staff?: {
    id: string;
    nameAr: string;
    slug: string;
    profileImage: string | null;
    isVerified: boolean;
  };
  commentsCount?: number;
  reactionsCount?: number;
  isBookmarked?: boolean;
  hasReacted?: boolean;
  storyId?: string;
  storyTitle?: string;
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

export type ReporterArticle = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  category: {
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
  } | null;
  isBreaking: boolean;
  views: number;
  likes: number;
  comments: number;
  readingTime: number;
};

export type ReporterTopCategory = {
  name: string;
  slug: string;
  color: string | null;
  articles: number;
  views: number;
  sharePct: number;
};

export type ReporterTimeseries = {
  date: string;
  views: number;
  likes: number;
};

export type ReporterProfile = {
  id: string;
  slug: string;
  fullName: string;
  title: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  tags: string[];
  kpis: {
    totalArticles: number;
    totalViews: number;
    totalLikes: number;
    avgReadTimeMin: number;
    avgCompletionRate: number;
  };
  lastArticles: ReporterArticle[];
  topCategories: ReporterTopCategory[];
  timeseries: {
    windowDays: number;
    daily: ReporterTimeseries[];
  };
  badges: Array<{
    key: string;
    label: string;
  }>;
};

export type InterestWithWeight = Interest & {
  weight: number;
};

export type StoryWithDetails = Story & {
  rootArticle?: Article;
  articlesCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
};

export type StoryLinkWithArticle = StoryLink & {
  article?: ArticleWithDetails;
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

export type UserLoyaltyEvent = typeof userLoyaltyEvents.$inferSelect;
export type InsertUserLoyaltyEvent = z.infer<typeof insertUserLoyaltyEventSchema>;

export type UserPointsTotal = typeof userPointsTotal.$inferSelect;
export type InsertUserPointsTotal = z.infer<typeof insertUserPointsTotalSchema>;

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;

export type UserRewardsHistory = typeof userRewardsHistory.$inferSelect;
export type InsertUserRewardsHistory = z.infer<typeof insertUserRewardsHistorySchema>;

export type LoyaltyCampaign = typeof loyaltyCampaigns.$inferSelect;
export type InsertLoyaltyCampaign = z.infer<typeof insertLoyaltyCampaignSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type Angle = typeof angles.$inferSelect;
export type InsertAngle = z.infer<typeof insertAngleSchema>;

export type ArticleAngle = typeof articleAngles.$inferSelect;
export type InsertArticleAngle = z.infer<typeof insertArticleAngleSchema>;

export type ImageAsset = typeof imageAssets.$inferSelect;
export type InsertImageAsset = z.infer<typeof insertImageAssetSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;

export type ArticleTag = typeof articleTags.$inferSelect;
export type InsertArticleTag = z.infer<typeof insertArticleTagSchema>;

export type UserFollowedTerm = typeof userFollowedTerms.$inferSelect;
export type InsertUserFollowedTerm = z.infer<typeof insertUserFollowedTermSchema>;

// Story tracking types
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type StoryLink = typeof storyLinks.$inferSelect;
export type InsertStoryLink = z.infer<typeof insertStoryLinkSchema>;

export type StoryFollow = typeof storyFollows.$inferSelect;
export type InsertStoryFollow = z.infer<typeof insertStoryFollowSchema>;

export type StoryNotification = typeof storyNotifications.$inferSelect;
export type InsertStoryNotification = z.infer<typeof insertStoryNotificationSchema>;

// Drizzle Relations
export const sectionsRelations = relations(sections, ({ many }) => ({
  angles: many(angles),
}));

export const anglesRelations = relations(angles, ({ one, many }) => ({
  section: one(sections, {
    fields: [angles.sectionId],
    references: [sections.id],
  }),
  articleAngles: many(articleAngles),
}));

export const articlesRelations = relations(articles, ({ many }) => ({
  articleAngles: many(articleAngles),
  articleTags: many(articleTags),
}));

export const articleAnglesRelations = relations(articleAngles, ({ one }) => ({
  article: one(articles, {
    fields: [articleAngles.articleId],
    references: [articles.id],
  }),
  angle: one(angles, {
    fields: [articleAngles.angleId],
    references: [angles.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
  userFollowedTerms: many(userFollowedTerms),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

export const userFollowedTermsRelations = relations(userFollowedTerms, ({ one }) => ({
  user: one(users, {
    fields: [userFollowedTerms.userId],
    references: [users.id],
  }),
  tag: one(tags, {
    fields: [userFollowedTerms.tagId],
    references: [tags.id],
  }),
}));

// ============================================================
// User Status Helper Functions
// ============================================================

export type UserStatus = "active" | "pending" | "suspended" | "banned" | "locked" | "deleted";

export function getUserEffectiveStatus(user: User): UserStatus {
  const now = new Date();
  
  // Priority 1: Deleted (soft delete)
  if (user.deletedAt) {
    return "deleted";
  }
  
  // Priority 2: Banned (permanent or temporary)
  if (user.status === "banned") {
    if (user.bannedUntil && user.bannedUntil > now) {
      return "banned";
    } else if (!user.bannedUntil) {
      // Permanent ban
      return "banned";
    }
    // Temporary ban expired - continue checking other statuses
  }
  
  // Priority 3: Suspended (temporary)
  if (user.status === "suspended") {
    if (user.suspendedUntil && user.suspendedUntil > now) {
      return "suspended";
    }
    // Suspension expired - continue checking other statuses
  }
  
  // Priority 4: Account locked (security)
  if (user.accountLocked) {
    if (user.lockedUntil && user.lockedUntil > now) {
      return "locked";
    }
    // Lock expired - continue checking other statuses
  }
  
  // Priority 5: Pending (email not verified)
  if (!user.emailVerified) {
    return "pending";
  }
  
  // Default: Active
  return "active";
}

export function canUserInteract(user: User): boolean {
  const status = getUserEffectiveStatus(user);
  return status === "active";
}

export function canUserLogin(user: User): boolean {
  const status = getUserEffectiveStatus(user);
  return status !== "banned" && status !== "deleted";
}

export function getUserStatusMessage(user: User): string | null {
  const status = getUserEffectiveStatus(user);
  
  switch (status) {
    case "banned":
      if (user.bannedUntil) {
        return `حسابك محظور حتى ${user.bannedUntil.toLocaleDateString('ar-SA')}. السبب: ${user.banReason || 'غير محدد'}`;
      }
      return `حسابك محظور بشكل دائم. السبب: ${user.banReason || 'غير محدد'}`;
    
    case "suspended":
      if (user.suspendedUntil) {
        return `حسابك معلق حتى ${user.suspendedUntil.toLocaleDateString('ar-SA')}. السبب: ${user.suspensionReason || 'غير محدد'}`;
      }
      return `حسابك معلق. السبب: ${user.suspensionReason || 'غير محدد'}`;
    
    case "locked":
      if (user.lockedUntil) {
        return `حسابك مقفل مؤقتاً حتى ${user.lockedUntil.toLocaleDateString('ar-SA')} بسبب محاولات دخول فاشلة متعددة.`;
      }
      return `حسابك مقفل بسبب محاولات دخول فاشلة متعددة. يرجى التواصل مع الإدارة.`;
    
    case "pending":
      return `يرجى تفعيل حسابك عبر البريد الإلكتروني للوصول الكامل للميزات.`;
    
    case "deleted":
      return `هذا الحساب محذوف.`;
    
    default:
      return null;
  }
}

// ============================================================================
// A/B Testing System
// ============================================================================

// Experiments - تجارب A/B
export const experiments = pgTable("experiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  
  // نوع التجربة: headline, image, layout, cta
  testType: text("test_type").notNull(), // headline, image, layout, cta, mixed
  
  // اختياري - إذا كانت التجربة مرتبطة بخبر معين
  articleId: varchar("article_id").references(() => articles.id),
  
  // الحالة: draft, running, paused, completed, archived
  status: text("status").default("draft").notNull(),
  
  // معايير النجاح
  successMetric: text("success_metric").notNull(), // ctr, read_time, engagement, conversions
  
  // الفائز (يتم تحديده تلقائياً أو يدوياً)
  winnerVariantId: varchar("winner_variant_id"),
  
  // التوقيتات
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  
  // الإحصائيات السريعة (cached)
  totalExposures: integer("total_exposures").default(0).notNull(),
  totalConversions: integer("total_conversions").default(0).notNull(),
  
  // من أنشأ التجربة
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Experiment Variants - الخيارات المختلفة (A, B, C...)
export const experimentVariants = pgTable("experiment_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  experimentId: varchar("experiment_id").references(() => experiments.id).notNull(),
  
  // اسم الـ variant (A, B, C, Control...)
  name: text("name").notNull(),
  
  // هل هذا الـ control variant (الأصلي)
  isControl: boolean("is_control").default(false).notNull(),
  
  // نسبة الزيارات الموجهة لهذا الـ variant (%)
  trafficAllocation: integer("traffic_allocation").default(50).notNull(),
  
  // البيانات المتغيرة (headline, imageUrl, etc.)
  variantData: jsonb("variant_data").$type<{
    headline?: string;
    imageUrl?: string;
    excerpt?: string;
    ctaText?: string;
    layout?: string;
  }>().notNull(),
  
  // إحصائيات سريعة (cached)
  exposures: integer("exposures").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  conversionRate: real("conversion_rate").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Experiment Exposures - تتبع من شاف أي variant
export const experimentExposures = pgTable("experiment_exposures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  experimentId: varchar("experiment_id").references(() => experiments.id).notNull(),
  variantId: varchar("variant_id").references(() => experimentVariants.id).notNull(),
  
  // المستخدم (nullable للزوار الغير مسجلين)
  userId: varchar("user_id").references(() => users.id),
  
  // Session ID للتتبع
  sessionId: text("session_id").notNull(),
  
  // معلومات إضافية
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  exposedAt: timestamp("exposed_at").defaultNow().notNull(),
}, (table) => [
  index("idx_exposures_experiment").on(table.experimentId),
  index("idx_exposures_variant").on(table.variantId),
  index("idx_exposures_user").on(table.userId),
  index("idx_exposures_session").on(table.sessionId),
]);

// Experiment Conversions - تتبع التحويلات (clicks, reads, likes, etc.)
export const experimentConversions = pgTable("experiment_conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  experimentId: varchar("experiment_id").references(() => experiments.id).notNull(),
  variantId: varchar("variant_id").references(() => experimentVariants.id).notNull(),
  exposureId: varchar("exposure_id").references(() => experimentExposures.id).notNull(),
  
  // نوع التحويل: click, read, like, share, comment, bookmark
  conversionType: text("conversion_type").notNull(),
  
  // القيمة (مثلاً: وقت القراءة بالثواني)
  value: real("value"),
  
  // معلومات إضافية
  metadata: jsonb("metadata").$type<{
    readDuration?: number;
    scrollDepth?: number;
    shareDestination?: string;
  }>(),
  
  convertedAt: timestamp("converted_at").defaultNow().notNull(),
}, (table) => [
  index("idx_conversions_experiment").on(table.experimentId),
  index("idx_conversions_variant").on(table.variantId),
  index("idx_conversions_exposure").on(table.exposureId),
  index("idx_conversions_type").on(table.conversionType),
]);

// Relations for A/B Testing
export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  article: one(articles, {
    fields: [experiments.articleId],
    references: [articles.id],
  }),
  creator: one(users, {
    fields: [experiments.createdBy],
    references: [users.id],
  }),
  variants: many(experimentVariants),
  exposures: many(experimentExposures),
  conversions: many(experimentConversions),
}));

export const experimentVariantsRelations = relations(experimentVariants, ({ one, many }) => ({
  experiment: one(experiments, {
    fields: [experimentVariants.experimentId],
    references: [experiments.id],
  }),
  exposures: many(experimentExposures),
  conversions: many(experimentConversions),
}));

export const experimentExposuresRelations = relations(experimentExposures, ({ one, many }) => ({
  experiment: one(experiments, {
    fields: [experimentExposures.experimentId],
    references: [experiments.id],
  }),
  variant: one(experimentVariants, {
    fields: [experimentExposures.variantId],
    references: [experimentVariants.id],
  }),
  user: one(users, {
    fields: [experimentExposures.userId],
    references: [users.id],
  }),
  conversions: many(experimentConversions),
}));

export const experimentConversionsRelations = relations(experimentConversions, ({ one }) => ({
  experiment: one(experiments, {
    fields: [experimentConversions.experimentId],
    references: [experiments.id],
  }),
  variant: one(experimentVariants, {
    fields: [experimentConversions.variantId],
    references: [experimentVariants.id],
  }),
  exposure: one(experimentExposures, {
    fields: [experimentConversions.exposureId],
    references: [experimentExposures.id],
  }),
}));

// Types for A/B Testing
export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type ExperimentVariant = typeof experimentVariants.$inferSelect;
export type InsertExperimentVariant = z.infer<typeof insertExperimentVariantSchema>;
export type ExperimentExposure = typeof experimentExposures.$inferSelect;
export type InsertExperimentExposure = z.infer<typeof insertExperimentExposureSchema>;
export type ExperimentConversion = typeof experimentConversions.$inferSelect;
export type InsertExperimentConversion = z.infer<typeof insertExperimentConversionSchema>;

// Zod Schemas for A/B Testing
export const insertExperimentSchema = createInsertSchema(experiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalExposures: true,
  totalConversions: true,
});

export const insertExperimentVariantSchema = createInsertSchema(experimentVariants).omit({
  id: true,
  createdAt: true,
  exposures: true,
  conversions: true,
  conversionRate: true,
});

export const insertExperimentExposureSchema = createInsertSchema(experimentExposures).omit({
  id: true,
  exposedAt: true,
});

export const insertExperimentConversionSchema = createInsertSchema(experimentConversions).omit({
  id: true,
  convertedAt: true,
});
