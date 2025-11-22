import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index, real, primaryKey, uniqueIndex, serial, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// ZOD SCHEMAS FOR JSONB COLUMNS
// ============================================

// Category jsonb schemas
export const seasonalRulesSchema = z.object({
  hijriMonth: z.string().optional(),
  hijriYear: z.union([z.string(), z.literal("auto")]).optional(),
  gregorianMonth: z.number().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  activateDaysBefore: z.number().optional(),
  deactivateDaysAfter: z.number().optional(),
}).optional();

export const categoryFeaturesSchema = z.object({
  realtime: z.boolean().optional(),
  ai_powered: z.boolean().optional(),
  trending: z.boolean().optional(),
  breaking_news: z.boolean().optional(),
  personalized: z.boolean().optional(),
  recommendation_engine: z.boolean().optional(),
  learning: z.boolean().optional(),
  data_visualization: z.boolean().optional(),
  ai_analysis: z.boolean().optional(),
  interactive: z.boolean().optional(),
  charts: z.boolean().optional(),
  long_form: z.boolean().optional(),
  expert_analysis: z.boolean().optional(),
  ai_summary: z.boolean().optional(),
  audio_version: z.boolean().optional(),
  opinion: z.boolean().optional(),
  authors: z.boolean().optional(),
  audio_newsletter: z.boolean().optional(),
}).catchall(z.boolean()).optional();

export const aiConfigSchema = z.object({
  promptTemplate: z.string().optional(),
  modelVersion: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3", "gemini-pro"]).optional(),
  maxArticles: z.number().int().min(1).max(100).optional(),
  refreshStrategy: z.enum(["realtime", "hourly", "daily", "manual"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(4000).optional(),
}).optional();

// Article jsonb schemas
export const imageFocalPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
}).optional();

export const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  socialTitle: z.string().optional(),
  socialDescription: z.string().optional(),
  imageAltText: z.string().optional(),
  ogImageUrl: z.string().optional(),
}).optional();

export const seoMetadataSchema = z.object({
  status: z.enum(["draft", "generated", "approved", "rejected"]).optional(),
  version: z.number().optional(),
  generatedAt: z.string().optional(),
  generatedBy: z.string().optional(),
  provider: z.enum(["anthropic", "openai", "gemini", "qwen"]).optional(),
  model: z.string().optional(),
  manualOverride: z.boolean().optional(),
  overrideBy: z.string().optional(),
  overrideReason: z.string().optional(),
  rawResponse: z.any().optional(),
}).optional();

export const sourceMetadataSchema = z.object({
  type: z.enum(["email", "whatsapp", "manual"]),
  from: z.string().optional(),
  token: z.string().optional(),
  originalMessage: z.string().optional(),
  webhookLogId: z.string().optional(),
}).optional();

// Behavior logs
export const behaviorMetadataSchema = z.object({
  articleId: z.string().optional(),
  categoryId: z.string().optional(),
  duration: z.number().optional(),
  query: z.string().optional(),
  action: z.string().optional(),
}).optional();

// Sentiment scores
export const emotionalBreakdownSchema = z.object({
  enthusiasm: z.number().optional(),
  satisfaction: z.number().optional(),
  anger: z.number().optional(),
  sadness: z.number().optional(),
  neutral: z.number().optional(),
}).optional();

// Theme assets
export const themeAssetsSchema = z.object({
  logoLight: z.string().optional(),
  logoDark: z.string().optional(),
  favicon: z.string().optional(),
  banner: z.string().optional(),
  ogImage: z.string().optional(),
}).optional();

export const themeTokensSchema = z.object({
  colors: z.record(z.string()).optional(),
  fonts: z.record(z.string()).optional(),
  spacing: z.record(z.string()).optional(),
  borderRadius: z.record(z.string()).optional(),
}).optional();

export const themeChangelogSchema = z.array(z.object({
  version: z.number(),
  changes: z.string(),
  timestamp: z.string(),
  userId: z.string(),
})).optional();

// Theme audit
export const themeAuditChangesSchema = z.record(z.any()).optional();

export const themeAuditMetadataSchema = z.object({
  previousStatus: z.string().optional(),
  newStatus: z.string().optional(),
  reason: z.string().optional(),
}).optional();

// Activity logs
export const activityLogMetadataSchema = z.object({
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  reason: z.string().optional(),
}).optional();

// Loyalty system
export const loyaltyPayloadSchema = z.object({
  articleId: z.string().optional(),
  categoryId: z.string().optional(),
  duration: z.number().optional(),
  commentId: z.string().optional(),
  reactionId: z.string().optional(),
}).optional();

export const loyaltyMetadataSchema = z.object({
  prevRank: z.string().optional(),
  newRank: z.string().optional(),
  pointsRequired: z.number().optional(),
  source: z.string().optional(),
}).optional();

export const rewardDataSchema = z.object({
  digitalCode: z.string().optional(),
  qrCode: z.string().optional(),
  expiryDate: z.string().optional(),
  instructions: z.string().optional(),
  customFields: z.record(z.any()).optional(),
}).optional();

export const rewardSnapshotSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  pointsCost: z.number().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
}).optional();

export const deliveryDataSchema = z.object({
  method: z.string().optional(),
  status: z.string().optional(),
  trackingInfo: z.string().optional(),
  estimatedDelivery: z.string().optional(),
}).optional();

// Smart blocks
export const smartBlockFiltersSchema = z.object({
  categories: z.array(z.string()).optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }).optional(),
}).optional();

// Additional jsonb schemas for remaining fields
export const rawMetadataSchema = z.record(z.any()).optional();

// User preferences arrays
export const preferredCategoriesSchema = z.array(z.string()).optional();
export const preferredAuthorsSchema = z.array(z.string()).optional();
export const blockedCategoriesSchema = z.array(z.string()).optional();

// Experiment schemas
export const experimentVariantDataSchema = z.object({
  headline: z.string().optional(),
  image: z.string().url().optional(),
  cta: z.string().optional(),
  layout: z.enum(["standard", "grid", "list", "featured"]).optional(),
  buttonText: z.string().optional(),
  buttonColor: z.string().optional(),
}).optional();

export const experimentMetadataSchema = z.object({
  notes: z.string().optional(),
  hypothesis: z.string().optional(),
  expectedImpact: z.string().optional(),
  startReason: z.string().optional(),
  endReason: z.string().optional(),
}).optional();

// Mirqab schemas
export const mirqabEntitySchema = z.object({
  topics: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  organizations: z.array(z.string()).optional(),
  people: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
}).optional();

export const mirqabMetadataSchema = z.object({
  source: z.string().optional(),
  reliability: z.number().min(0).max(10).optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
  category: z.string().optional(),
}).optional();

// SEO history schemas
export const seoContentSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  socialTitle: z.string().optional(),
  socialDescription: z.string().optional(),
  imageAltText: z.string().optional(),
  ogImageUrl: z.string().optional(),
}).optional();

// Data story schemas
export const chartDataSchema = z.array(z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  category: z.string().optional(),
})).optional();

export const alertsSchema = z.array(z.object({
  type: z.enum(["threshold", "trend", "anomaly", "prediction"]),
  message: z.string(),
  threshold: z.number().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  triggeredAt: z.string().datetime().optional(),
})).optional();

// Audio newsletter schemas
export const voiceSettingsSchema = z.object({
  voice: z.string().optional(),
  speed: z.number().optional(),
  pitch: z.number().optional(),
}).optional();

// Internal announcements schemas
export const channelsSchema = z.array(z.string()).optional();
export const audienceRolesSchema = z.array(z.string()).optional();
export const audienceUserIdsSchema = z.array(z.string()).optional();
export const tagsSchema = z.array(z.string()).optional();
export const attachmentsSchema = z.array(z.object({
  url: z.string(),
  name: z.string(),
  type: z.string(),
})).optional();

export const internalAnnouncementMetaSchema = z.object({
  version: z.number().optional(),
  changes: z.string().optional(),
}).optional();

// Journalist tasks schemas
export const taskConfigSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  priorityLevel: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).max(100).optional(),
  requiresReview: z.boolean().optional(),
}).optional();

// Calendar schemas
export const calendarAttachmentsSchema = z.array(z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
})).optional();

export const aiDraftIdeasSchema = z.object({
  main: z.string().optional(),
  alternatives: z.array(z.string()).optional(),
}).optional();

export const aiDraftHeadlinesSchema = z.object({
  primary: z.string().optional(),
  alternatives: z.array(z.string()).optional(),
}).optional();

export const aiDraftInfographicSchema = z.object({
  title: z.string().optional(),
  dataPoints: z.array(z.string()).optional(),
}).optional();

export const aiDraftSocialSchema = z.object({
  twitter: z.string().optional(),
  facebook: z.string().optional(),
}).optional();

export const aiDraftSeoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
}).optional();

// Smart entities schemas
export const smartEntitiesSchema = z.object({
  entities: z.array(z.string()).optional(),
  confidence: z.number().optional(),
}).optional();

export const modelInsightsSchema = z.object({
  model: z.string().optional(),
  confidence: z.number().optional(),
  suggestions: z.array(z.string()).optional(),
}).optional();

export const metadataSchema = z.object({
  source: z.string().optional(),
  version: z.number().optional(),
  timestamp: z.string().datetime().optional(),
  userId: z.string().optional(),
  notes: z.string().optional(),
}).optional();

// AI suggestions schemas
export const aiSuggestionsSchema = z.object({
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  relatedTopics: z.array(z.string()).optional(),
}).optional();

// Task changes schemas
export const taskChangesSchema = z.object({
  field: z.string(),
  oldValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  newValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  changedAt: z.string().datetime().optional(),
  changedBy: z.string().optional(),
}).optional();

// Deep analysis schemas
export const deepAnalysisResultsSchema = z.object({
  findings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  score: z.number().min(0).max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
  methodology: z.string().optional(),
}).optional();

// Data story source schemas
export const columnsSchema = z.record(z.object({
  name: z.string(),
  type: z.string(),
  sampleValues: z.array(z.any()).optional(),
  uniqueCount: z.number().optional(),
  nullCount: z.number().optional(),
})).optional();

export const statisticsSchema = z.object({
  rowCount: z.number().int().min(0).optional(),
  columnCount: z.number().int().min(0).optional(),
  nullPercentage: z.number().min(0).max(100).optional(),
  uniqueValues: z.number().int().min(0).optional(),
  completeness: z.number().min(0).max(100).optional(),
}).optional();

export const aiInsightsSchema = z.object({
  summary: z.string().optional(),
  keyFindings: z.array(z.string()).optional(),
  trends: z.array(z.string()).optional(),
  anomalies: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
}).optional();

export const chartConfigsSchema = z.array(z.object({
  type: z.string(),
  title: z.string(),
  data: z.any(),
})).optional();

// Data story draft schemas
export const outlineSchema = z.object({
  introduction: z.string().optional(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).optional(),
}).optional();

// Wallet device metadata
export const deviceMetadataSchema = z.object({
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  osVersion: z.string().optional(),
}).optional();

// Ad account billing
export const billingAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
}).optional();

// Creative recommendation
export const creativeRecommendationSchema = z.object({
  suggestions: z.array(z.string()).optional(),
  score: z.number().optional(),
}).optional();

// System settings value schema (highly variable, but validate common types)
export const systemSettingsValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.any()),
  z.record(z.any()),
]);

// Notification template content schema
export const notificationTemplateContentSchema = z.object({
  subject: z.string().optional(),
  body: z.string(),
  template: z.string().optional(),
  variables: z.array(z.string()).optional(),
}).optional();

// AI workflow config schema
export const aiWorkflowConfigSchema = z.object({
  model: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3", "gemini-pro"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(4000).optional(),
  prompt: z.string().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
}).optional();

// Journalist task config schema (more specific)
export const journalistTaskConfigSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  priorityLevel: z.number().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().optional(),
}).optional();

// Session data schema
export const sessionDataSchema = z.object({
  cookie: z.object({
    originalMaxAge: z.number().optional(),
    expires: z.union([z.string(), z.date()]).optional(),
    secure: z.boolean().optional(),
    httpOnly: z.boolean().optional(),
    path: z.string().optional(),
  }).optional(),
  passport: z.object({
    user: z.any().optional(),
  }).optional(),
}).catchall(z.any());

// Activity log old/new value schemas
export const activityLogValueSchema = z.record(z.any()).optional();

// Internal announcement revision schemas
export const revisionDiffSchema = z.any().optional();
export const revisionMetaSchema = z.object({
  editor: z.string().optional(),
  reason: z.string().optional(),
}).optional();

// Preview data schema
export const previewDataSchema = z.array(z.record(z.any())).optional();

// AI analysis schemas
export const aiAnalysisSchema = z.object({
  summary: z.string().optional(),
  topics: z.array(z.string()).optional(),
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"]).optional(),
  entities: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  language: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
}).optional();

// Attachments data schema
export const attachmentsDataSchema = z.array(z.object({
  url: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number().optional(),
})).optional();

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
  passwordHash: text("password_hash"), // bcrypt hashed password (optional for OAuth users)
  firstName: text("first_name"),
  lastName: text("last_name"),
  firstNameEn: text("first_name_en"), // English first name (optional)
  lastNameEn: text("last_name_en"), // English last name (optional)
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("reader"),
  status: text("status").default("active").notNull(), // active, pending, suspended, banned, locked, deleted
  isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
  
  // OAuth fields
  authProvider: text("auth_provider").default("local").notNull(), // local, google, apple
  googleId: text("google_id").unique(), // Google OAuth ID
  appleId: text("apple_id").unique(), // Apple OAuth ID
  
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
  
  // Two-Factor Authentication fields
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorBackupCodes: text("two_factor_backup_codes").array(),
  twoFactorMethod: text("two_factor_method").default("authenticator").notNull(), // authenticator, sms, both
  
  // Soft delete
  deletedAt: timestamp("deleted_at"),
  
  // Language permissions (ar, en, or both)
  allowedLanguages: text("allowed_languages").array().default(sql`ARRAY['ar']::text[]`).notNull(),
  
  // Press Card fields (Apple Wallet Digital Press Card)
  hasPressCard: boolean("has_press_card").default(false).notNull(),
  jobTitle: text("job_title"),
  department: text("department"),
  pressIdNumber: text("press_id_number"),
  cardValidUntil: timestamp("card_valid_until"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Unique index on pressIdNumber (only for non-null values)
  uniqueIndex("users_press_id_number_idx").on(table.pressIdNumber).where(sql`press_id_number IS NOT NULL`),
]);

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// News categories (with Smart Categories support)
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
  
  // Smart Categories fields
  type: text("type").default("core").notNull(), // core, dynamic, smart, seasonal
  autoActivate: boolean("auto_activate").default(false).notNull(),
  updateInterval: integer("update_interval"), // in seconds, for dynamic categories
  seasonalRules: jsonb("seasonal_rules").$type<{
    hijriMonth?: string;
    hijriYear?: string | "auto";
    gregorianMonth?: number;
    dateRange?: {
      start: string;
      end: string;
    };
    activateDaysBefore?: number;
    deactivateDaysAfter?: number;
  }>(),
  features: jsonb("features").$type<{
    realtime?: boolean;
    ai_powered?: boolean;
    trending?: boolean;
    breaking_news?: boolean;
    personalized?: boolean;
    recommendation_engine?: boolean;
    learning?: boolean;
    data_visualization?: boolean;
    ai_analysis?: boolean;
    interactive?: boolean;
    charts?: boolean;
    long_form?: boolean;
    expert_analysis?: boolean;
    ai_summary?: boolean;
    audio_version?: boolean;
    opinion?: boolean;
    authors?: boolean;
    audio_newsletter?: boolean;
    [key: string]: boolean | undefined;
  }>(),
  aiConfig: jsonb("ai_config").$type<{
    promptTemplate?: string;
    modelVersion?: string;
    maxArticles?: number;
    refreshStrategy?: string;
    [key: string]: any;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes
  index("idx_categories_type_status").on(table.type, table.status),
  index("idx_categories_status").on(table.status),
]);

// Articles (supports both news and opinion pieces)
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  imageFocalPoint: jsonb("image_focal_point").$type<{
    x: number; // percentage 0-100 from left
    y: number; // percentage 0-100 from top
  }>(),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: 'set null' }),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  reporterId: varchar("reporter_id").references(() => users.id),
  articleType: text("article_type").default("news").notNull(), // news, opinion, analysis, column
  newsType: text("news_type").default("regular").notNull(), // breaking, featured, regular
  publishType: text("publish_type").default("instant").notNull(), // instant, scheduled
  scheduledAt: timestamp("scheduled_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, published, archived
  reviewStatus: text("review_status"), // null, pending_review, approved, rejected, needs_changes (for opinion articles)
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  hideFromHomepage: boolean("hide_from_homepage").default(false).notNull(), // Hide article from homepage but keep accessible via direct link
  aiSummary: text("ai_summary"),
  aiGenerated: boolean("ai_generated").default(false),
  isFeatured: boolean("is_featured").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  seo: jsonb("seo").$type<{
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    socialTitle?: string;
    socialDescription?: string;
    imageAltText?: string;
    ogImageUrl?: string;
  }>(),
  seoMetadata: jsonb("seo_metadata").$type<{
    status?: "draft" | "generated" | "approved" | "rejected";
    version?: number;
    generatedAt?: string;
    generatedBy?: string;
    provider?: "anthropic" | "openai" | "gemini" | "qwen";
    model?: string;
    manualOverride?: boolean;
    overrideBy?: string;
    overrideReason?: string;
    rawResponse?: any;
  }>(),
  credibilityScore: integer("credibility_score"),
  credibilityAnalysis: text("credibility_analysis"),
  credibilityLastUpdated: timestamp("credibility_last_updated"),
  source: text("source").default("manual").notNull(), // 'email' | 'whatsapp' | 'manual'
  sourceMetadata: jsonb("source_metadata").$type<{
    type: 'email' | 'whatsapp' | 'manual';
    from?: string;
    token?: string;
    originalMessage?: string;
    webhookLogId?: string;
  }>(),
  sourceUrl: text("source_url"), // URL of the original source
  
  // Verification fields
  verifiedBy: varchar("verified_by").references(() => users.id), // Staff/admin who verified the article
  verifiedAt: timestamp("verified_at"), // When the article was verified
  
  // Publisher/Agency content sales fields
  isPublisherNews: boolean("is_publisher_news").default(false).notNull(),
  publisherId: varchar("publisher_id").references(() => publishers.id, { onDelete: "set null" }),
  publisherCreditDeducted: boolean("publisher_credit_deducted").default(false).notNull(), // Track if credit was already deducted
  publisherSubmittedAt: timestamp("publisher_submitted_at"), // When publisher created the draft
  publisherApprovedAt: timestamp("publisher_approved_at"), // When admin approved it
  publisherApprovedBy: varchar("publisher_approved_by").references(() => users.id), // Admin who approved
  
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for most common queries
  index("idx_articles_status_published").on(table.status, table.publishedAt.desc()),
  index("idx_articles_category_status").on(table.categoryId, table.status),
  index("idx_articles_author_status").on(table.authorId, table.status),
  index("idx_articles_type").on(table.articleType),
  index("idx_articles_published_at").on(table.publishedAt.desc()),
]);

// RSS feeds for import
export const rssFeeds = pgTable("rss_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").default(true).notNull(),
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User reading history for recommendations (ENHANCED for advanced analytics)
export const readingHistory = pgTable("reading_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
  readDuration: integer("read_duration"), // in seconds
  
  // NEW ADDITIVE FIELDS for advanced tracking
  scrollDepth: integer("scroll_depth"), // percentage 0-100
  completionRate: integer("completion_rate"), // percentage 0-100 (estimated based on scroll + duration)
  engagementScore: real("engagement_score"), // calculated score 0-1 based on multiple factors
  deviceType: text("device_type"), // mobile, tablet, desktop
  platform: text("platform"), // ios, android, web
  referrer: text("referrer"), // where user came from
}, (table) => [
  index("idx_reading_history_user").on(table.userId, table.readAt.desc()),
  index("idx_reading_history_article").on(table.articleId),
  index("idx_reading_history_engagement").on(table.userId, table.engagementScore),
]);

// Comments with status management
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, flagged
  parentId: varchar("parent_id"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationReason: text("moderation_reason"),
  // Sentiment analysis fields
  currentSentiment: text("current_sentiment"), // positive, neutral, negative (denormalized for performance)
  currentSentimentConfidence: real("current_sentiment_confidence"), // 0-1
  sentimentAnalyzedAt: timestamp("sentiment_analyzed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_comments_article_status").on(table.articleId, table.status),
  index("idx_comments_user").on(table.userId),
  index("idx_comments_status").on(table.status),
]);

// Comment sentiment analysis (tracks sentiment history)
export const commentSentiments = pgTable("comment_sentiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  sentiment: text("sentiment").notNull(), // positive, neutral, negative
  confidence: real("confidence").notNull(), // 0-1 scale
  provider: text("provider").notNull(), // openai, anthropic, gemini
  model: text("model").notNull(), // specific model used
  language: text("language").notNull(), // ar, en, ur
  rawMetadata: jsonb("raw_metadata"), // full AI response for debugging
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
}, (table) => [
  index("idx_sentiment_comment").on(table.commentId),
  index("idx_sentiment_sentiment").on(table.sentiment),
  index("idx_sentiment_analyzed").on(table.analyzedAt),
]);

// Article SEO generation history (unified for all languages)
export const articleSeoHistory = pgTable("article_seo_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull(), // Article ID from any language table
  language: text("language").notNull(), // ar, en, ur
  seoContent: jsonb("seo_content").$type<{
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    socialTitle?: string;
    socialDescription?: string;
    imageAltText?: string;
    ogImageUrl?: string;
  }>().notNull(),
  seoMetadata: jsonb("seo_metadata").$type<{
    status?: "draft" | "generated" | "approved" | "rejected";
    version?: number;
    generatedAt?: string;
    generatedBy?: string;
    provider?: "anthropic" | "openai" | "gemini" | "qwen";
    model?: string;
    manualOverride?: boolean;
    overrideBy?: string;
    overrideReason?: string;
    rawResponse?: any;
  }>().notNull(),
  version: integer("version").notNull(),
  provider: text("provider").notNull(), // anthropic, openai, gemini, qwen
  model: text("model").notNull(),
  generatedBy: varchar("generated_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seo_history_article_lang").on(table.articleId, table.language),
  index("idx_seo_history_version").on(table.articleId, table.language, table.version.desc()),
  index("idx_seo_history_created").on(table.createdAt.desc()),
  uniqueIndex("idx_seo_history_unique_version").on(table.articleId, table.language, table.version),
]);

// Likes/reactions
export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull().default("like"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reactions_article").on(table.articleId),
  index("idx_reactions_user_article").on(table.userId, table.articleId),
]);

// Bookmarks/saved articles
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_bookmarks_user").on(table.userId, table.createdAt.desc()),
  index("idx_bookmarks_article").on(table.articleId),
]);

// Smart/Dynamic category assignments (auto-populated by AI)
export const articleSmartCategories = pgTable("article_smart_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  score: real("score").default(1.0).notNull(), // Relevance score (0.0-1.0) for ranking
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_article_smart_category_unique").on(table.articleId, table.categoryId),
  index("idx_article_smart_category_id").on(table.categoryId),
  index("idx_article_smart_article_id").on(table.articleId),
]);

// User preferences for recommendations (ENHANCED with granular controls)
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  preferredCategories: jsonb("preferred_categories").$type<string[]>(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  
  // NEW ADDITIVE FIELDS for granular notification control
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(false),
  followingNotifications: boolean("following_notifications").default(true), // notifications from followed users
  
  // NEW ADDITIVE FIELDS for content preferences
  preferredAuthors: jsonb("preferred_authors").$type<string[]>(), // array of user IDs
  blockedCategories: jsonb("blocked_categories").$type<string[]>(), // array of category IDs to hide
  recommendationFrequency: text("recommendation_frequency").default("daily"), // daily, weekly, never
  
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
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  weight: real("weight").default(1.0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// SOCIAL FOLLOWING SYSTEM (NEW)
// ============================================

// Social follows - user-to-user following relationships
export const socialFollows = pgTable("social_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id, { onDelete: 'cascade' }).notNull(), // who is following
  followingId: varchar("following_id").references(() => users.id, { onDelete: 'cascade' }).notNull(), // who is being followed
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(), // receive notifications for this user's activity
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Ensure a user can't follow the same person twice
  uniqueIndex("idx_social_follows_unique").on(table.followerId, table.followingId),
  // Quick lookups for followers/following lists
  index("idx_social_follows_follower").on(table.followerId, table.createdAt.desc()),
  index("idx_social_follows_following").on(table.followingId, table.createdAt.desc()),
]);

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
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "set null" }),
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
}, (table) => ({
  // Prevent duplicate role assignments
  uniqueUserRole: uniqueIndex("unique_user_role_idx").on(table.userId, table.roleId),
}));

// Staff (reporters, writers, supervisors)
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  slug: text("slug").notNull().unique(),
  
  // Bilingual fields (English and Arabic only - Urdu version uses English names)
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  title: text("title"),
  titleAr: text("title_ar"),
  bio: text("bio"),
  bioAr: text("bio_ar"),
  specializations: text("specializations").array().default(sql`ARRAY[]::text[]`).notNull(),
  
  profileImage: text("profile_image"),
  staffType: text("staff_type").notNull(), // reporter, writer, supervisor
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
}, (table) => [
  index("idx_activity_logs_user").on(table.userId, table.createdAt.desc()),
  index("idx_activity_logs_entity").on(table.entityType, table.entityId),
  index("idx_activity_logs_created").on(table.createdAt.desc()),
]);

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
  rankLevel: integer("rank_level").default(1).notNull(), // 1=القارئ الجديد, 2=المتفاعل, 3=العضو الذهبي, 4=سفير سبق
  lifetimePoints: integer("lifetime_points").default(0).notNull(), // لا ينقص أبداً
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Check constraint for rank level (1-4)
  sql`CONSTRAINT rank_level_check CHECK (rank_level BETWEEN 1 AND 4)`,
]);

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
  targetCategory: varchar("target_category").references(() => categories.id, { onDelete: 'set null' }), // null = all categories
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
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
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
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
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
  rootArticleId: varchar("root_article_id").references(() => articles.id, { onDelete: "set null" }),
  entities: jsonb("entities").$type<Record<string, any>>(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Story links (linking articles to stories)
export const storyLinks = pgTable("story_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id).notNull(),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
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
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "set null" }),
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
  firstNameEn: z.union([z.string().min(2, "English first name must be at least 2 characters"), z.literal("")]).optional(),
  lastNameEn: z.union([z.string().min(2, "English last name must be at least 2 characters"), z.literal("")]).optional(),
  bio: z.string().max(500, "النبذة يجب أن لا تزيد عن 500 حرف").optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  profileImageUrl: z.string().optional().or(z.literal("")),
  isProfileComplete: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل").optional(),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل").optional(),
  firstNameEn: z.union([z.string().min(2, "English first name must be at least 2 characters"), z.literal("")]).optional(),
  lastNameEn: z.union([z.string().min(2, "English last name must be at least 2 characters"), z.literal("")]).optional(),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  profileImageUrl: z.string().nullable().optional(),
  status: z.enum(["active", "pending", "suspended", "banned", "locked", "deleted"], {
    errorMap: () => ({ message: "الحالة يجب أن تكون: نشط، معلق، محظور، أو مقفل" })
  }).optional(),
  roleId: z.string().uuid("معرف الدور غير صحيح").optional(),
  verificationBadge: z.enum(["none", "silver", "gold"]).optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  
  // Press Card fields (Apple Wallet Digital Press Card)
  hasPressCard: z.boolean().optional(),
  jobTitle: z.union([z.string(), z.literal(""), z.null()]).optional(),
  department: z.union([z.string(), z.literal(""), z.null()]).optional(),
  pressIdNumber: z.union([z.string(), z.literal(""), z.null()]).optional(),
  cardValidUntil: z.union([z.string(), z.literal(""), z.null()]).optional(), // ISO date string
});

// Admin schema for creating new users with roles
export const adminCreateUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
  firstNameEn: z.union([z.string().min(2, "English first name must be at least 2 characters"), z.literal("")]).optional(),
  lastNameEn: z.union([z.string().min(2, "English last name must be at least 2 characters"), z.literal("")]).optional(),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  profileImageUrl: z.string().nullable().optional(),
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
export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
}).extend({
  type: z.enum(["core", "dynamic", "smart", "seasonal"]).default("core"),
  status: z.enum(["active", "inactive"]).default("active"),
  seasonalRules: seasonalRulesSchema,
  features: categoryFeaturesSchema,
  aiConfig: aiConfigSchema,
});
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
  imageFocalPoint: imageFocalPointSchema.nullable().optional(),
  seo: seoSchema,
  seoMetadata: seoMetadataSchema,
  sourceMetadata: sourceMetadataSchema,
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
// Comment sentiments schemas
export const insertCommentSentimentSchema = createInsertSchema(commentSentiments).omit({
  id: true,
  analyzedAt: true,
}).extend({
  rawMetadata: rawMetadataSchema,
});
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true, createdAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true });

// NEW: Reading history insert schema (with enhanced tracking fields)
export const insertReadingHistorySchema = createInsertSchema(readingHistory).omit({
  id: true,
  readAt: true,
}).extend({
  scrollDepth: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional(),
  engagementScore: z.number().min(0).max(1).optional(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
  referrer: z.string().optional(),
});

// NEW: User preferences insert/update schema (with enhanced notification controls)
export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
}).extend({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  followingNotifications: z.boolean().optional(),
  preferredCategories: preferredCategoriesSchema,
  preferredAuthors: preferredAuthorsSchema,
  blockedCategories: blockedCategoriesSchema,
  recommendationFrequency: z.enum(["daily", "weekly", "never"]).default("daily"),
});
export const updateUserPreferenceSchema = insertUserPreferenceSchema.partial();

// NEW: Social follows insert schema
export const insertSocialFollowSchema = createInsertSchema(socialFollows).omit({
  id: true,
  createdAt: true,
}).extend({
  // Ensure user can't follow themselves
  followerId: z.string(),
  followingId: z.string(),
}).refine((data) => data.followerId !== data.followingId, {
  message: "لا يمكنك متابعة نفسك",
  path: ["followingId"],
});

export const insertInterestSchema = createInsertSchema(interests).omit({ id: true, createdAt: true });
export const insertUserInterestSchema = createInsertSchema(userInterests).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertBehaviorLogSchema = createInsertSchema(behaviorLogs).omit({ id: true, createdAt: true }).extend({
  metadata: behaviorMetadataSchema,
});
export const insertSentimentScoreSchema = createInsertSchema(sentimentScores).omit({ id: true, createdAt: true }).extend({
  emotionalBreakdown: emotionalBreakdownSchema,
});
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  value: systemSettingsValueSchema,
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
export const insertThemeAuditLogSchema = createInsertSchema(themeAuditLog).omit({ id: true, createdAt: true }).extend({
  changes: themeAuditChangesSchema,
  metadata: themeAuditMetadataSchema,
});

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

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true }).extend({
  oldValue: activityLogValueSchema,
  newValue: activityLogValueSchema,
  metadata: activityLogMetadataSchema,
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  config: notificationTemplateContentSchema,
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
}).extend({
  payload: loyaltyPayloadSchema,
  metadata: loyaltyMetadataSchema,
});

export const insertUserPointsTotalSchema = createInsertSchema(userPointsTotal).omit({ 
  createdAt: true, 
  updatedAt: true 
}).extend({
  rankLevel: z.number().int().min(1).max(4).optional(), // Validate rankLevel is between 1-4
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  rewardData: rewardDataSchema,
});

export const insertUserRewardsHistorySchema = createInsertSchema(userRewardsHistory).omit({ 
  id: true, 
  redeemedAt: true,
  deliveredAt: true,
}).extend({
  rewardSnapshot: rewardSnapshotSchema,
  deliveryData: deliveryDataSchema,
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
  imageUrl: z.union([
    z.string().url("رابط الصورة غير صحيح"),
    z.string().startsWith("/", "رابط الصورة غير صحيح"),
    z.literal("")
  ]).optional(),
  imageFocalPoint: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }).nullable().optional(),
  categoryId: z.union([
    z.string().uuid("معرف التصنيف غير صحيح"),
    z.literal(""),
    z.null()
  ]).optional(),
  reporterId: z.union([
    z.string().min(1, "معرف المراسل غير صحيح"),
    z.null()
  ]).optional(),
  articleType: z.enum(["news", "opinion", "analysis", "column"]).optional(),
  newsType: z.enum(["breaking", "featured", "regular"]).optional(),
  publishType: z.enum(["instant", "scheduled"]).optional(),
  scheduledAt: z.union([
    z.string().datetime(),
    z.null()
  ]).optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  aiSummary: z.union([
    z.string(),
    z.null()
  ]).optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.union([
    z.string().datetime(),
    z.null()
  ]).optional(),
  seo: z.object({
    metaTitle: z.union([
      z.string().max(70, "عنوان SEO يجب ألا يتجاوز 70 حرف"),
      z.literal("")
    ]).optional(),
    metaDescription: z.union([
      z.string().max(160, "وصف SEO يجب ألا يتجاوز 160 حرف"),
      z.literal("")
    ]).optional(),
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

export type InsertCommentSentiment = z.infer<typeof insertCommentSentimentSchema>;
export type CommentSentiment = typeof commentSentiments.$inferSelect;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type ReadingHistory = typeof readingHistory.$inferSelect;
export type InsertReadingHistory = z.infer<typeof insertReadingHistorySchema>;

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type UpdateUserPreference = z.infer<typeof updateUserPreferenceSchema>;

export type SocialFollow = typeof socialFollows.$inferSelect;
export type InsertSocialFollow = z.infer<typeof insertSocialFollowSchema>;

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

export type NotificationInbox = typeof notificationsInbox.$inferSelect;
export type InsertNotificationInbox = z.infer<typeof insertNotificationsInboxSchema>;

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
  opinionAuthor?: User;
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
    followers: number;
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

export const socialFollowsRelations = relations(socialFollows, ({ one }) => ({
  follower: one(users, {
    fields: [socialFollows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [socialFollows.followingId],
    references: [users.id],
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
      return `يرجى تفعيل حسابك عبر البريد الإلكتروني أولاً`;
    
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
}).extend({
  variantData: experimentVariantDataSchema,
});

export const insertExperimentExposureSchema = createInsertSchema(experimentExposures).omit({
  id: true,
  exposedAt: true,
});

export const insertExperimentConversionSchema = createInsertSchema(experimentConversions).omit({
  id: true,
  convertedAt: true,
});

export const updateExperimentVariantSchema = insertExperimentVariantSchema.partial();

// ============================================================
// MIRQAB SYSTEM - المرقاب (Observatory/Future Forecasting)
// ============================================================

// Main Mirqab Entries table - الجدول الرئيسي
export const mirqabEntries = pgTable("mirqab_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryType: text("entry_type").notNull(), // sabq_index, next_story, radar, algorithm_article
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, scheduled, published, archived
  visibility: text("visibility").notNull().default("public"), // public, private
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  editorId: varchar("editor_id").references(() => users.id),
  seo: jsonb("seo").$type<{
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  }>(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
  views: integer("views").default(0).notNull(),
  featuredImageUrl: text("featured_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_mirqab_entries_type").on(table.entryType),
  index("idx_mirqab_entries_status").on(table.status),
  index("idx_mirqab_entries_author").on(table.authorId),
  index("idx_mirqab_entries_status_published").on(table.status, table.publishedAt.desc()),
  index("idx_mirqab_entries_type_status").on(table.entryType, table.status),
]);

// SABQ Index - مؤشر سبق
export const mirqabSabqIndex = pgTable("mirqab_sabq_index", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").references(() => mirqabEntries.id, { onDelete: "cascade" }).notNull().unique(),
  indexValue: real("index_value").notNull(), // القيمة الرقمية
  maxValue: real("max_value").notNull().default(100), // القيمة القصوى
  trend: text("trend").notNull(), // up, down, stable
  indexCategory: text("index_category").notNull(), // economic, political, social, technology
  analysis: text("analysis").notNull(), // التحليل الكامل
  period: text("period").notNull(), // الفترة الزمنية، مثل "أسبوع"
  chartData: jsonb("chart_data").$type<Array<{
    date: string;
    value: number;
    label?: string;
  }>>(),
  methodology: text("methodology"), // المنهجية المستخدمة
  dataSources: text("data_sources").array().default(sql`ARRAY[]::text[]`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_sabq_index_entry").on(table.entryId),
  index("idx_sabq_index_category").on(table.indexCategory),
]);

// Next Story - قصة قادمة
export const mirqabNextStory = pgTable("mirqab_next_story", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").references(() => mirqabEntries.id, { onDelete: "cascade" }).notNull().unique(),
  executiveSummary: text("executive_summary").notNull(),
  content: text("content").notNull(), // المحتوى الكامل - rich text
  confidenceLevel: integer("confidence_level").notNull(), // 0-100
  expectedTiming: text("expected_timing").notNull(), // week, month, quarter, year
  expectedDate: timestamp("expected_date"),
  dataSources: text("data_sources").array().default(sql`ARRAY[]::text[]`).notNull(),
  keywords: text("keywords").array().default(sql`ARRAY[]::text[]`).notNull(),
  relatedArticleIds: varchar("related_article_ids").array().default(sql`ARRAY[]::varchar[]`).notNull(),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_next_story_entry").on(table.entryId),
  index("idx_next_story_timing").on(table.expectedTiming),
  index("idx_next_story_date").on(table.expectedDate),
]);

// Radar Alerts - الرادار
export const mirqabRadarAlerts = pgTable("mirqab_radar_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").references(() => mirqabEntries.id, { onDelete: "cascade" }).notNull().unique(),
  reportDate: timestamp("report_date").notNull(), // تاريخ التقرير
  alerts: jsonb("alerts").$type<Array<{
    title: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
    category: string;
    data?: Record<string, any>;
  }>>().notNull(),
  summary: text("summary").notNull(), // ملخص اليوم
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_radar_entry").on(table.entryId),
  index("idx_radar_date").on(table.reportDate),
]);

// Algorithm Articles - الخوارزمي يكتب
export const mirqabAlgorithmArticles = pgTable("mirqab_algorithm_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").references(() => mirqabEntries.id, { onDelete: "cascade" }).notNull().unique(),
  content: text("content").notNull(), // المحتوى الكامل
  analysisType: text("analysis_type").notNull(), // opinion, analysis, forecast
  aiModel: text("ai_model").notNull(), // النموذج المستخدم، مثل "GPT-5"
  aiPercentage: integer("ai_percentage").notNull().default(100), // نسبة المحتوى المكتوب بواسطة AI
  humanReviewed: boolean("human_reviewed").default(false).notNull(),
  reviewerNotes: text("reviewer_notes"),
  prompt: text("prompt"), // الـ prompt المستخدم
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_algorithm_entry").on(table.entryId),
  index("idx_algorithm_type").on(table.analysisType),
]);

// Relations for Mirqab
export const mirqabEntriesRelations = relations(mirqabEntries, ({ one }) => ({
  author: one(users, {
    fields: [mirqabEntries.authorId],
    references: [users.id],
  }),
  editor: one(users, {
    fields: [mirqabEntries.editorId],
    references: [users.id],
  }),
  sabqIndex: one(mirqabSabqIndex),
  nextStory: one(mirqabNextStory),
  radarAlert: one(mirqabRadarAlerts),
  algorithmArticle: one(mirqabAlgorithmArticles),
}));

export const mirqabSabqIndexRelations = relations(mirqabSabqIndex, ({ one }) => ({
  entry: one(mirqabEntries, {
    fields: [mirqabSabqIndex.entryId],
    references: [mirqabEntries.id],
  }),
}));

export const mirqabNextStoryRelations = relations(mirqabNextStory, ({ one }) => ({
  entry: one(mirqabEntries, {
    fields: [mirqabNextStory.entryId],
    references: [mirqabEntries.id],
  }),
}));

export const mirqabRadarAlertsRelations = relations(mirqabRadarAlerts, ({ one }) => ({
  entry: one(mirqabEntries, {
    fields: [mirqabRadarAlerts.entryId],
    references: [mirqabEntries.id],
  }),
}));

export const mirqabAlgorithmArticlesRelations = relations(mirqabAlgorithmArticles, ({ one }) => ({
  entry: one(mirqabEntries, {
    fields: [mirqabAlgorithmArticles.entryId],
    references: [mirqabEntries.id],
  }),
}));

// Types for Mirqab
export type MirqabEntry = typeof mirqabEntries.$inferSelect;
export type InsertMirqabEntry = z.infer<typeof insertMirqabEntrySchema>;
export type UpdateMirqabEntry = Partial<InsertMirqabEntry>;

export type MirqabSabqIndex = typeof mirqabSabqIndex.$inferSelect;
export type InsertMirqabSabqIndex = z.infer<typeof insertMirqabSabqIndexSchema>;
export type UpdateMirqabSabqIndex = Partial<InsertMirqabSabqIndex>;

export type MirqabNextStory = typeof mirqabNextStory.$inferSelect;
export type InsertMirqabNextStory = z.infer<typeof insertMirqabNextStorySchema>;
export type UpdateMirqabNextStory = Partial<InsertMirqabNextStory>;

export type MirqabRadarAlert = typeof mirqabRadarAlerts.$inferSelect;
export type InsertMirqabRadarAlert = z.infer<typeof insertMirqabRadarAlertSchema>;
export type UpdateMirqabRadarAlert = Partial<InsertMirqabRadarAlert>;

export type MirqabAlgorithmArticle = typeof mirqabAlgorithmArticles.$inferSelect;
export type InsertMirqabAlgorithmArticle = z.infer<typeof insertMirqabAlgorithmArticleSchema>;
export type UpdateMirqabAlgorithmArticle = Partial<InsertMirqabAlgorithmArticle>;

// Combined type with details
export type MirqabEntryWithDetails = MirqabEntry & {
  author?: User;
  editor?: User;
  sabqIndex?: MirqabSabqIndex;
  nextStory?: MirqabNextStory;
  radarAlert?: MirqabRadarAlert;
  algorithmArticle?: MirqabAlgorithmArticle;
};

// Zod Schemas for Mirqab
export const insertMirqabEntrySchema = createInsertSchema(mirqabEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

export const insertMirqabSabqIndexSchema = createInsertSchema(mirqabSabqIndex).omit({
  id: true,
  createdAt: true,
});

export const insertMirqabNextStorySchema = createInsertSchema(mirqabNextStory).omit({
  id: true,
  createdAt: true,
});

export const insertMirqabRadarAlertSchema = createInsertSchema(mirqabRadarAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertMirqabAlgorithmArticleSchema = createInsertSchema(mirqabAlgorithmArticles).omit({
  id: true,
  createdAt: true,
});

// Update schemas for Mirqab (partial updates)
export const updateMirqabEntrySchema = insertMirqabEntrySchema.partial();
export const updateMirqabSabqIndexSchema = insertMirqabSabqIndexSchema.partial();
export const updateMirqabNextStorySchema = insertMirqabNextStorySchema.partial();
export const updateMirqabRadarAlertSchema = insertMirqabRadarAlertSchema.partial();
export const updateMirqabAlgorithmArticleSchema = insertMirqabAlgorithmArticleSchema.partial();

// Smart Blocks (البلوكات الذكية)
export const smartBlocks = pgTable("smart_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 60 }).notNull(),
  keyword: varchar("keyword", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  placement: varchar("placement", { length: 30 }).notNull(), // below_featured, above_all_news, between_all_and_murqap, above_footer
  layoutStyle: varchar("layout_style", { length: 20 }).notNull().default('grid'), // grid, list, featured
  limitCount: integer("limit_count").notNull().default(6),
  filters: jsonb("filters").$type<{
    categories?: string[];
    dateRange?: { from: string; to: string };
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_smart_blocks_keyword").on(table.keyword),
  index("idx_smart_blocks_placement").on(table.placement),
  index("idx_smart_blocks_active").on(table.isActive),
]);

// Smart Blocks Relations
export const smartBlocksRelations = relations(smartBlocks, ({ one }) => ({
  creator: one(users, {
    fields: [smartBlocks.createdBy],
    references: [users.id],
  }),
}));

// Smart Blocks Types
export type SmartBlock = typeof smartBlocks.$inferSelect;
export const insertSmartBlockSchema = createInsertSchema(smartBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSmartBlock = z.infer<typeof insertSmartBlockSchema>;
export type UpdateSmartBlock = Partial<InsertSmartBlock>;

// ============================================
// ENGLISH SMART BLOCKS
// ============================================

export const enSmartBlocks = pgTable("en_smart_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 60 }).notNull(),
  keyword: varchar("keyword", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  placement: varchar("placement", { length: 30 }).notNull(),
  layoutStyle: varchar("layout_style", { length: 20 }).notNull().default('grid'),
  limitCount: integer("limit_count").notNull().default(6),
  filters: jsonb("filters").$type<{
    categories?: string[];
    dateRange?: { from: string; to: string };
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_en_smart_blocks_keyword").on(table.keyword),
  index("idx_en_smart_blocks_placement").on(table.placement),
  index("idx_en_smart_blocks_active").on(table.isActive),
]);

export const enSmartBlocksRelations = relations(enSmartBlocks, ({ one }) => ({
  creator: one(users, {
    fields: [enSmartBlocks.createdBy],
    references: [users.id],
  }),
}));

export type EnSmartBlock = typeof enSmartBlocks.$inferSelect;
export const insertEnSmartBlockSchema = createInsertSchema(enSmartBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEnSmartBlock = z.infer<typeof insertEnSmartBlockSchema>;

// ============================================
// AUDIO NEWS BRIEFS (الأخبار الصوتية السريعة)
// ============================================

// Audio News Briefs - أخبار صوتية قصيرة
export const audioNewsBriefs = pgTable("audio_news_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  voiceId: varchar("voice_id", { length: 100 }), // ElevenLabs voice ID
  voiceSettings: jsonb("voice_settings").$type<{
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  }>(),
  duration: integer("duration"), // in seconds
  generationStatus: varchar("generation_status", { length: 20 })
    .notNull()
    .default("pending"), // pending, processing, completed, failed
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published
  publishedAt: timestamp("published_at"),
  createdBy: varchar("created_by", { length: 21 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_audio_briefs_status").on(table.status),
  index("idx_audio_briefs_published").on(table.publishedAt),
  index("idx_audio_briefs_created_by").on(table.createdBy),
]);

// Relations
export const audioNewsBriefsRelations = relations(audioNewsBriefs, ({ one }) => ({
  creator: one(users, {
    fields: [audioNewsBriefs.createdBy],
    references: [users.id],
  }),
}));

// Types
export type AudioNewsBrief = typeof audioNewsBriefs.$inferSelect;
export const insertAudioNewsBriefSchema = createInsertSchema(audioNewsBriefs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAudioNewsBrief = z.infer<typeof insertAudioNewsBriefSchema>;

// ============================================
// AUDIO NEWSLETTERS (النشرات الصوتية)
// ============================================

// Audio Newsletters - النشرات الصوتية الأسبوعية
export const audioNewsletters = pgTable("audio_newsletters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // عنوان النشرة
  description: text("description"), // وصف النشرة
  slug: text("slug").notNull().unique(),
  
  // Audio file information
  audioUrl: text("audio_url"), // رابط الملف الصوتي على Object Storage
  duration: integer("duration"), // مدة التشغيل بالثواني
  fileSize: integer("file_size"), // حجم الملف بالبايت
  
  // Generation metadata
  generatedBy: varchar("generated_by").references(() => users.id).notNull(),
  generationStatus: text("generation_status").default("pending").notNull(), // pending, processing, completed, failed
  generationError: text("generation_error"),
  
  // TTS settings
  voiceId: text("voice_id"), // ElevenLabs voice ID
  voiceModel: text("voice_model").default("eleven_multilingual_v2"), // ElevenLabs model
  voiceSettings: jsonb("voice_settings").$type<{
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  }>(),
  
  // Publishing
  status: text("status").default("draft").notNull(), // draft, published, archived
  publishedAt: timestamp("published_at"),
  
  // Analytics
  totalListens: integer("total_listens").default(0).notNull(),
  uniqueListeners: integer("unique_listeners").default(0).notNull(),
  averageCompletionRate: real("average_completion_rate").default(0).notNull(), // 0-100%
  
  // Metadata for RSS/Podcast
  coverImageUrl: text("cover_image_url"),
  author: text("author").default("سبق الذكية"),
  category: text("category").default("أخبار"),
  keywords: text("keywords").array(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audio_newsletters_status").on(table.status),
  index("idx_audio_newsletters_published").on(table.publishedAt),
  index("idx_audio_newsletters_generated_by").on(table.generatedBy),
]);

// Junction table: أي مقالات تم تضمينها في النشرة
export const audioNewsletterArticles = pgTable("audio_newsletter_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  newsletterId: varchar("newsletter_id").references(() => audioNewsletters.id, { onDelete: "cascade" }).notNull(),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(), // ترتيب المقال في النشرة
  includeFullContent: boolean("include_full_content").default(false).notNull(), // تضمين المحتوى كامل أو ملخص فقط
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audio_newsletter_articles_newsletter").on(table.newsletterId),
  index("idx_audio_newsletter_articles_article").on(table.articleId),
  uniqueIndex("idx_audio_newsletter_articles_unique").on(table.newsletterId, table.articleId),
]);

// Listening history & analytics
export const audioNewsletterListens = pgTable("audio_newsletter_listens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  newsletterId: varchar("newsletter_id").references(() => audioNewsletters.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Session info (for anonymous users)
  sessionId: text("session_id"), // للمستخدمين غير المسجلين
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Listening metrics
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastPosition: integer("last_position").default(0).notNull(), // آخر موضع استماع بالثواني
  duration: integer("duration").notNull(), // المدة التي استمع لها
  completionPercentage: real("completion_percentage").default(0).notNull(), // نسبة الإكمال
  
  // Platform info
  platform: text("platform"), // web, ios, android
  deviceType: text("device_type"), // mobile, tablet, desktop
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audio_listens_newsletter").on(table.newsletterId),
  index("idx_audio_listens_user").on(table.userId),
  index("idx_audio_listens_session").on(table.sessionId),
  index("idx_audio_listens_started").on(table.startedAt),
  // New indexes for analytics performance
  index("idx_audio_listens_completion").on(table.newsletterId, table.completionPercentage),
  index("idx_audio_listens_analytics").on(table.newsletterId, table.userId, table.sessionId),
]);

// Relations
export const audioNewslettersRelations = relations(audioNewsletters, ({ one, many }) => ({
  generator: one(users, {
    fields: [audioNewsletters.generatedBy],
    references: [users.id],
  }),
  articles: many(audioNewsletterArticles),
  listens: many(audioNewsletterListens),
}));

export const audioNewsletterArticlesRelations = relations(audioNewsletterArticles, ({ one }) => ({
  newsletter: one(audioNewsletters, {
    fields: [audioNewsletterArticles.newsletterId],
    references: [audioNewsletters.id],
  }),
  article: one(articles, {
    fields: [audioNewsletterArticles.articleId],
    references: [articles.id],
  }),
}));

export const audioNewsletterListensRelations = relations(audioNewsletterListens, ({ one }) => ({
  newsletter: one(audioNewsletters, {
    fields: [audioNewsletterListens.newsletterId],
    references: [audioNewsletters.id],
  }),
  user: one(users, {
    fields: [audioNewsletterListens.userId],
    references: [users.id],
  }),
}));

// Types
export type AudioNewsletter = typeof audioNewsletters.$inferSelect;
export type InsertAudioNewsletter = z.infer<typeof insertAudioNewsletterSchema>;
export type UpdateAudioNewsletter = Partial<InsertAudioNewsletter>;

export type AudioNewsletterArticle = typeof audioNewsletterArticles.$inferSelect;
export type InsertAudioNewsletterArticle = z.infer<typeof insertAudioNewsletterArticleSchema>;

export type AudioNewsletterListen = typeof audioNewsletterListens.$inferSelect;
export type InsertAudioNewsletterListen = z.infer<typeof insertAudioNewsletterListenSchema>;

// Combined type with details
export type AudioNewsletterWithDetails = AudioNewsletter & {
  generator?: User;
  articles?: (AudioNewsletterArticle & { article?: Article })[];
  listens?: AudioNewsletterListen[];
  _count?: {
    articles: number;
    listens: number;
  };
};

// Zod Schemas
export const insertAudioNewsletterSchema = createInsertSchema(audioNewsletters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalListens: true,
  uniqueListeners: true,
  averageCompletionRate: true,
});

export const insertAudioNewsletterArticleSchema = createInsertSchema(audioNewsletterArticles).omit({
  id: true,
  createdAt: true,
});

export const insertAudioNewsletterListenSchema = createInsertSchema(audioNewsletterListens).omit({
  id: true,
  createdAt: true,
});

export const updateAudioNewsletterSchema = insertAudioNewsletterSchema.partial();

// ============================================================
// INTERNAL ANNOUNCEMENTS SYSTEM - نظام الإعلانات الداخلية المتقدم
// ============================================================

// Internal Announcements (multiple announcements with advanced features)
export const internalAnnouncements = pgTable("internal_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(), // Rich text HTML or JSON
  priority: text("priority").default("normal").notNull(), // low, normal, high
  status: text("status").default("draft").notNull(), // draft, scheduled, published, expired, archived
  
  // Channels where announcement will appear
  channels: jsonb("channels").default([]).notNull().$type<string[]>(), // ["dashboardBanner", "inbox", "toast"]
  
  // Targeting & Audience
  audienceRoles: jsonb("audience_roles").$type<string[]>(), // ["admin", "editor", "reporter"] or null for all
  audienceUserIds: jsonb("audience_user_ids").$type<string[]>(), // Specific user IDs or null
  
  // Metadata
  tags: jsonb("tags").$type<string[]>(), // Keywords for filtering/search
  attachments: jsonb("attachments").$type<{url: string; name: string; type: string}[]>(), // Files/links
  
  // Display settings
  dismissible: boolean("dismissible").default(true).notNull(),
  maxViewsPerUser: integer("max_views_per_user"), // null = unlimited
  
  // Scheduling
  startAt: timestamp("start_at"), // When to auto-publish (null = manual publish)
  endAt: timestamp("end_at"), // When to auto-expire (null = never)
  
  // Tracking
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  publishedBy: varchar("published_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_announcements_status").on(table.status),
  index("idx_announcements_priority").on(table.priority),
  index("idx_announcements_published").on(table.publishedAt),
  index("idx_announcements_schedule").on(table.startAt, table.endAt),
  index("idx_announcements_created").on(table.createdBy),
]);

// Announcement Versions (for history/archiving)
export const internalAnnouncementVersions = pgTable("internal_announcement_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar("announcement_id").references(() => internalAnnouncements.id, { onDelete: "cascade" }).notNull(),
  
  // Snapshot of data at this version
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  channels: jsonb("channels").notNull().$type<string[]>(),
  audienceRoles: jsonb("audience_roles").$type<string[]>(),
  audienceUserIds: jsonb("audience_user_ids").$type<string[]>(),
  tags: jsonb("tags").$type<string[]>(),
  
  // Version metadata
  changedBy: varchar("changed_by").references(() => users.id).notNull(),
  changeReason: text("change_reason"), // Optional description of change
  diff: jsonb("diff"), // JSON diff of what changed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_versions_announcement").on(table.announcementId),
  index("idx_versions_created").on(table.createdAt),
]);

// Announcement Metrics (for analytics)
export const internalAnnouncementMetrics = pgTable("internal_announcement_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar("announcement_id").references(() => internalAnnouncements.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id), // null for anonymous
  
  event: text("event").notNull(), // impression, unique_view, dismiss, click
  channel: text("channel"), // Which channel it was seen on
  
  // Event metadata
  meta: jsonb("meta").$type<{
    deviceType?: string;
    userAgent?: string;
    location?: string;
    [key: string]: any;
  }>(),
  
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
}, (table) => [
  index("idx_metrics_announcement").on(table.announcementId),
  index("idx_metrics_event").on(table.event),
  index("idx_metrics_user").on(table.userId),
  index("idx_metrics_occurred").on(table.occurredAt),
  index("idx_metrics_analytics").on(table.announcementId, table.event, table.occurredAt),
]);

// Relations
export const internalAnnouncementsRelations = relations(internalAnnouncements, ({ one, many }) => ({
  creator: one(users, {
    fields: [internalAnnouncements.createdBy],
    references: [users.id],
    relationName: "announcement_creator",
  }),
  updater: one(users, {
    fields: [internalAnnouncements.updatedBy],
    references: [users.id],
    relationName: "announcement_updater",
  }),
  publisher: one(users, {
    fields: [internalAnnouncements.publishedBy],
    references: [users.id],
    relationName: "announcement_publisher",
  }),
  versions: many(internalAnnouncementVersions),
  metrics: many(internalAnnouncementMetrics),
}));

export const internalAnnouncementVersionsRelations = relations(internalAnnouncementVersions, ({ one }) => ({
  announcement: one(internalAnnouncements, {
    fields: [internalAnnouncementVersions.announcementId],
    references: [internalAnnouncements.id],
  }),
  changer: one(users, {
    fields: [internalAnnouncementVersions.changedBy],
    references: [users.id],
  }),
}));

export const internalAnnouncementMetricsRelations = relations(internalAnnouncementMetrics, ({ one }) => ({
  announcement: one(internalAnnouncements, {
    fields: [internalAnnouncementMetrics.announcementId],
    references: [internalAnnouncements.id],
  }),
  user: one(users, {
    fields: [internalAnnouncementMetrics.userId],
    references: [users.id],
  }),
}));

// Types
export type InternalAnnouncement = typeof internalAnnouncements.$inferSelect;
export type InternalAnnouncementVersion = typeof internalAnnouncementVersions.$inferSelect;
export type InternalAnnouncementMetric = typeof internalAnnouncementMetrics.$inferSelect;

// Combined type with details
export type InternalAnnouncementWithDetails = InternalAnnouncement & {
  creator?: User;
  updater?: User;
  publisher?: User;
  versions?: InternalAnnouncementVersion[];
  metrics?: InternalAnnouncementMetric[];
  _count?: {
    versions: number;
    metrics: number;
    impressions: number;
    uniqueViews: number;
    dismissals: number;
    clicks: number;
  };
};

// Zod Schemas
export const insertInternalAnnouncementSchema = createInsertSchema(internalAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  createdBy: true, // Will be added by backend from req.user
  updatedBy: true,
  publishedBy: true,
}).extend({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").max(200, "العنوان يجب ألا يتجاوز 200 حرف"),
  message: z.string().min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  status: z.enum(["draft", "scheduled", "published", "expired", "archived"]).default("draft"),
  channels: z.array(z.enum(["dashboardBanner", "inbox", "toast"])).min(1, "يجب اختيار قناة واحدة على الأقل"),
});

export const updateInternalAnnouncementSchema = insertInternalAnnouncementSchema.partial();

export const insertInternalAnnouncementVersionSchema = createInsertSchema(internalAnnouncementVersions).omit({
  id: true,
  createdAt: true,
});

export const insertInternalAnnouncementMetricSchema = createInsertSchema(internalAnnouncementMetrics).omit({
  id: true,
  occurredAt: true,
}).extend({
  event: z.enum(["impression", "unique_view", "dismiss", "click"]),
});

export type InsertInternalAnnouncement = z.infer<typeof insertInternalAnnouncementSchema>;
export type UpdateInternalAnnouncement = z.infer<typeof updateInternalAnnouncementSchema>;
export type InsertInternalAnnouncementVersion = z.infer<typeof insertInternalAnnouncementVersionSchema>;
export type InsertInternalAnnouncementMetric = z.infer<typeof insertInternalAnnouncementMetricSchema>;

// ————————————————————————————————————————————————————————————————————
// Sabq Shorts (Reels) - Short-form video news content
// ————————————————————————————————————————————————————————————————————

export const shorts = pgTable("shorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  
  // Video files
  coverImage: text("cover_image").notNull(), // poster/placeholder
  hlsUrl: text("hls_url"), // m3u8 for ABR streaming
  mp4Url: text("mp4_url"), // fallback for browsers without HLS support
  
  // Metadata
  duration: integer("duration"), // in seconds
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: 'set null' }),
  reporterId: varchar("reporter_id").references(() => users.id),
  
  // Publishing
  status: text("status").default("draft").notNull(), // draft, scheduled, published, archived
  publishType: text("publish_type").default("instant").notNull(), // instant, scheduled
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  
  // Stats (cached for performance)
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  shares: integer("shares").default(0).notNull(),
  comments: integer("comments").default(0).notNull(),
  avgWatchTime: real("avg_watch_time").default(0), // in seconds
  completionRate: real("completion_rate").default(0), // percentage
  
  // Ordering & visibility
  displayOrder: integer("display_order").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("shorts_status_idx").on(table.status),
  index("shorts_published_at_idx").on(table.publishedAt),
  index("shorts_display_order_idx").on(table.displayOrder),
  index("shorts_reporter_idx").on(table.reporterId),
  index("shorts_category_idx").on(table.categoryId),
]);

// Analytics tracking for shorts
export const shortAnalytics = pgTable("short_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortId: varchar("short_id").references(() => shorts.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  sessionId: text("session_id"), // for anonymous users
  
  // Event type
  eventType: text("event_type").notNull(), // view, like, unlike, share, comment, watch_time
  
  // Watch time tracking
  watchTime: integer("watch_time"), // seconds watched
  watchPercentage: real("watch_percentage"), // percentage of video watched
  
  // Metadata
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
}, (table) => [
  index("short_analytics_short_idx").on(table.shortId),
  index("short_analytics_user_idx").on(table.userId),
  index("short_analytics_event_idx").on(table.eventType),
  index("short_analytics_occurred_at_idx").on(table.occurredAt),
]);

// Relations
export const shortsRelations = relations(shorts, ({ one, many }) => ({
  category: one(categories, {
    fields: [shorts.categoryId],
    references: [categories.id],
  }),
  reporter: one(users, {
    fields: [shorts.reporterId],
    references: [users.id],
  }),
  analytics: many(shortAnalytics),
}));

export const shortAnalyticsRelations = relations(shortAnalytics, ({ one }) => ({
  short: one(shorts, {
    fields: [shortAnalytics.shortId],
    references: [shorts.id],
  }),
  user: one(users, {
    fields: [shortAnalytics.userId],
    references: [users.id],
  }),
}));

// Types
export type Short = typeof shorts.$inferSelect;
export type ShortAnalytic = typeof shortAnalytics.$inferSelect;

export type ShortWithDetails = Short & {
  category?: Category;
  reporter?: User;
  analytics?: ShortAnalytic[];
};

// Zod Schemas
export const insertShortSchema = createInsertSchema(shorts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  views: true,
  likes: true,
  shares: true,
  comments: true,
  avgWatchTime: true,
  completionRate: true,
}).extend({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").max(200, "العنوان يجب ألا يتجاوز 200 حرف"),
  coverImage: z.string().url("رابط صورة الغلاف يجب أن يكون صحيح"),
  status: z.enum(["draft", "scheduled", "published", "archived"]).default("draft"),
  publishType: z.enum(["instant", "scheduled"]).default("instant"),
});

export const updateShortSchema = insertShortSchema.partial();

export const insertShortAnalyticSchema = createInsertSchema(shortAnalytics).omit({
  id: true,
  occurredAt: true,
}).extend({
  eventType: z.enum(["view", "like", "unlike", "share", "comment", "watch_time"]),
});

export type InsertShort = z.infer<typeof insertShortSchema>;
export type UpdateShort = z.infer<typeof updateShortSchema>;
export type InsertShortAnalytic = z.infer<typeof insertShortAnalyticSchema>;

// Quad Categories Block Settings
export const quadCategoriesSettings = pgTable("quad_categories_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Configuration JSON
  config: jsonb("config").$type<{
    sections: Array<{
      categorySlug: string;
      headlineMode: "latest" | "mostViewed" | "editorsPick";
      statType: "dailyCount" | "weeklyCount" | "totalViews" | "engagementRate";
      teaser?: string;
      listSize: number;
    }>;
    mobileCarousel: boolean;
    freshHours: number;
    badges: {
      exclusive: boolean;
      breaking: boolean;
      analysis: boolean;
    };
    backgroundColor?: string;
  }>().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type QuadCategoriesSettings = typeof quadCategoriesSettings.$inferSelect;

export const insertQuadCategoriesSettingsSchema = createInsertSchema(quadCategoriesSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  config: z.object({
    sections: z.array(z.object({
      categorySlug: z.string(),
      headlineMode: z.enum(["latest", "mostViewed", "editorsPick"]),
      statType: z.enum(["dailyCount", "weeklyCount", "totalViews", "engagementRate"]),
      teaser: z.string().optional(),
      listSize: z.number().min(3).max(8),
    })).length(4, "يجب اختيار 4 تصنيفات بالضبط"),
    mobileCarousel: z.boolean(),
    freshHours: z.number().min(1).max(72),
    badges: z.object({
      exclusive: z.boolean(),
      breaking: z.boolean(),
      analysis: z.boolean(),
    }),
    backgroundColor: z.string().optional(),
  }),
});

export type InsertQuadCategoriesSettings = z.infer<typeof insertQuadCategoriesSettingsSchema>;

// English Quad Categories Block Settings
export const enQuadCategoriesSettings = pgTable("en_quad_categories_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Configuration JSON
  config: jsonb("config").$type<{
    sections: Array<{
      categorySlug: string;
      headlineMode: "latest" | "mostViewed" | "editorsPick";
      statType: "dailyCount" | "weeklyCount" | "totalViews" | "engagementRate";
      teaser?: string;
      listSize: number;
    }>;
    mobileCarousel: boolean;
    freshHours: number;
    badges: {
      exclusive: boolean;
      breaking: boolean;
      analysis: boolean;
    };
    backgroundColor?: string;
  }>().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EnQuadCategoriesSettings = typeof enQuadCategoriesSettings.$inferSelect;

export const insertEnQuadCategoriesSettingsSchema = createInsertSchema(enQuadCategoriesSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  config: z.object({
    sections: z.array(z.object({
      categorySlug: z.string(),
      headlineMode: z.enum(["latest", "mostViewed", "editorsPick"]),
      statType: z.enum(["dailyCount", "weeklyCount", "totalViews", "engagementRate"]),
      teaser: z.string().optional(),
      listSize: z.number().min(3).max(8),
    })).length(4, "Must select exactly 4 categories"),
    mobileCarousel: z.boolean(),
    freshHours: z.number().min(1).max(72),
    badges: z.object({
      exclusive: z.boolean(),
      breaking: z.boolean(),
      analysis: z.boolean(),
    }),
    backgroundColor: z.string().optional(),
  }),
});

export type InsertEnQuadCategoriesSettings = z.infer<typeof insertEnQuadCategoriesSettingsSchema>;

// ============================================
// URDU QUAD CATEGORIES SETTINGS
// ============================================

export const urQuadCategoriesSettings = pgTable("ur_quad_categories_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Configuration JSON
  config: jsonb("config").$type<{
    sections: Array<{
      categorySlug: string;
      headlineMode: "latest" | "mostViewed" | "editorsPick";
      statType: "dailyCount" | "weeklyCount" | "totalViews" | "engagementRate";
      teaser?: string;
      listSize: number;
    }>;
    mobileCarousel: boolean;
    freshHours: number;
    badges: {
      exclusive: boolean;
      breaking: boolean;
      analysis: boolean;
    };
    backgroundColor?: string;
  }>().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UrQuadCategoriesSettings = typeof urQuadCategoriesSettings.$inferSelect;

export const insertUrQuadCategoriesSettingsSchema = createInsertSchema(urQuadCategoriesSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  config: z.object({
    sections: z.array(z.object({
      categorySlug: z.string(),
      headlineMode: z.enum(["latest", "mostViewed", "editorsPick"]),
      statType: z.enum(["dailyCount", "weeklyCount", "totalViews", "engagementRate"]),
      teaser: z.string().optional(),
      listSize: z.number().min(3).max(8),
    })).length(4, "بالکل 4 زمرے منتخب کریں"),
    mobileCarousel: z.boolean(),
    freshHours: z.number().min(1).max(72),
    badges: z.object({
      exclusive: z.boolean(),
      breaking: z.boolean(),
      analysis: z.boolean(),
    }),
    backgroundColor: z.string().optional(),
  }),
});

export type InsertUrQuadCategoriesSettings = z.infer<typeof insertUrQuadCategoriesSettingsSchema>;

// ============================================
// Calendar System (Sabq Calendar / تقويم سبق)
// ============================================

// Calendar Events - Global/National/Internal occasions
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  dateStart: timestamp("date_start", { withTimezone: true }).notNull(),
  dateEnd: timestamp("date_end", { withTimezone: true }),
  timezone: text("timezone").default("Asia/Riyadh").notNull(),
  type: text("type").notNull(), // GLOBAL, NATIONAL, INTERNAL
  localeScope: text("locale_scope"), // WORLD, SA, GCC, CUSTOM
  importance: integer("importance").default(3).notNull(), // 1-5 scale
  categoryId: varchar("category_id").references(() => categories.id),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  source: text("source"), // UN, WHO, Manual, ICS import
  description: text("description"),
  attachments: jsonb("attachments").$type<{
    url?: string;
    type?: string;
    name?: string;
    [key: string]: any;
  }[]>(),
  
  // Metadata
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_calendar_events_date_start").on(table.dateStart),
  index("idx_calendar_events_type").on(table.type),
  index("idx_calendar_events_importance").on(table.importance),
  index("idx_calendar_events_category").on(table.categoryId),
]);

// Reminders - Notification schedule for events
export const calendarReminders = pgTable("calendar_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => calendarEvents.id, { onDelete: "cascade" }).notNull(),
  fireWhen: integer("fire_when").notNull(), // days before event (e.g., 30, 14, 7, 5, 3, 1)
  channel: text("channel").notNull(), // IN_APP, EMAIL, WHATSAPP, SLACK
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_calendar_reminders_event").on(table.eventId),
  index("idx_calendar_reminders_enabled").on(table.enabled),
]);

// AI Drafts - Cached AI-generated content for events
export const calendarAiDrafts = pgTable("calendar_ai_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => calendarEvents.id, { onDelete: "cascade" }).notNull().unique(),
  ideas: jsonb("ideas").$type<{
    id?: string;
    type?: string; // report, feature, explainer, opinion
    title?: string;
    alternateTitle?: string;
    angle?: string;
    keyPoints?: string[];
    openingParagraph?: string;
    sources?: string[];
    [key: string]: any;
  }[]>(),
  headlines: jsonb("headlines").$type<{
    primary?: string;
    secondary?: string;
    alternates?: string[];
    [key: string]: any;
  }>(),
  infographic: jsonb("infographic").$type<{
    title?: string;
    subtitle?: string;
    dataPoints?: Array<{
      label?: string;
      value?: string | number;
      icon?: string;
    }>;
    cta?: string;
    [key: string]: any;
  }>(),
  social: jsonb("social").$type<{
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    hashtags?: string[];
    [key: string]: any;
  }>(),
  seo: jsonb("seo").$type<{
    keywords?: string[];
    metaTitle?: string;
    metaDescription?: string;
    internalLinks?: string[];
    [key: string]: any;
  }>(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_calendar_ai_drafts_event").on(table.eventId),
]);

// Assignments - Task assignments for event coverage
export const calendarAssignments = pgTable("calendar_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => calendarEvents.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // editor, reporter, designer, social
  status: text("status").default("planned").notNull(), // planned, in_progress, done, cancelled
  notes: text("notes"),
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_calendar_assignments_event").on(table.eventId),
  index("idx_calendar_assignments_user").on(table.userId),
  index("idx_calendar_assignments_status").on(table.status),
]);

// ============================================
// Calendar System Relations
// ============================================

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  category: one(categories, {
    fields: [calendarEvents.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [calendarEvents.createdById],
    references: [users.id],
  }),
  reminders: many(calendarReminders),
  aiDraft: one(calendarAiDrafts),
  assignments: many(calendarAssignments),
}));

export const calendarRemindersRelations = relations(calendarReminders, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [calendarReminders.eventId],
    references: [calendarEvents.id],
  }),
}));

export const calendarAiDraftsRelations = relations(calendarAiDrafts, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [calendarAiDrafts.eventId],
    references: [calendarEvents.id],
  }),
}));

export const calendarAssignmentsRelations = relations(calendarAssignments, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [calendarAssignments.eventId],
    references: [calendarEvents.id],
  }),
  user: one(users, {
    fields: [calendarAssignments.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [calendarAssignments.assignedBy],
    references: [users.id],
  }),
}));

// ============================================
// Calendar System Types
// ============================================

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type CalendarReminder = typeof calendarReminders.$inferSelect;
export type CalendarAiDraft = typeof calendarAiDrafts.$inferSelect;
export type CalendarAssignment = typeof calendarAssignments.$inferSelect;

// ============================================
// Calendar System Zod Schemas
// ============================================

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "عنوان المناسبة مطلوب").max(500, "العنوان طويل جداً"),
  slug: z.string().min(1, "الرابط المختصر مطلوب"),
  dateStart: z.string().or(z.date()),
  dateEnd: z.string().or(z.date()).optional(),
  type: z.enum(["GLOBAL", "NATIONAL", "INTERNAL"]),
  importance: z.number().min(1).max(5).default(3),
  tags: z.array(z.string()).default([]),
});

export const updateCalendarEventSchema = insertCalendarEventSchema.partial();

export const insertCalendarReminderSchema = createInsertSchema(calendarReminders).omit({
  id: true,
  createdAt: true,
}).extend({
  fireWhen: z.number().min(0, "الأيام قبل الحدث يجب أن تكون 0 أو أكثر"),
  channel: z.enum(["IN_APP", "EMAIL", "WHATSAPP", "SLACK"]),
});

export const insertCalendarAiDraftSchema = createInsertSchema(calendarAiDrafts).omit({
  id: true,
  generatedAt: true,
  updatedAt: true,
});

export const insertCalendarAssignmentSchema = createInsertSchema(calendarAssignments).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
}).extend({
  role: z.enum(["editor", "reporter", "designer", "social"]),
  status: z.enum(["planned", "in_progress", "done", "cancelled"]).default("planned"),
});

export const updateCalendarAssignmentSchema = insertCalendarAssignmentSchema.partial().omit({
  eventId: true,
  userId: true,
  assignedBy: true,
});

// ============================================
// Calendar System Insert Types
// ============================================

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type UpdateCalendarEvent = z.infer<typeof updateCalendarEventSchema>;
export type InsertCalendarReminder = z.infer<typeof insertCalendarReminderSchema>;
export type InsertCalendarAiDraft = z.infer<typeof insertCalendarAiDraftSchema>;
export type InsertCalendarAssignment = z.infer<typeof insertCalendarAssignmentSchema>;
export type UpdateCalendarAssignment = z.infer<typeof updateCalendarAssignmentSchema>;

// ============================================
// Smart Links System - Entity Types
// ============================================

export const entityTypes = pgTable("entity_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nameAr: text("name_ar").notNull().unique(),
  nameEn: text("name_en").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  displayOrder: integer("display_order").default(0).notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Smart Links System - Entities (كيانات)
// ============================================

export const smartEntities = pgTable("smart_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  aliases: text("aliases").array().default([]).notNull(),
  typeId: integer("type_id").references(() => entityTypes.id).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  slug: text("slug").notNull().unique(),
  importanceScore: real("importance_score").default(0.5).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  metadata: jsonb("metadata").$type<{
    birthDate?: string;
    position?: string;
    organization?: string;
    location?: string;
    website?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
    [key: string]: any;
  }>(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_smart_entities_type").on(table.typeId),
  index("idx_smart_entities_importance").on(table.importanceScore),
]);

// ============================================
// Smart Links System - Terms (مصطلحات)
// ============================================

export const smartTerms = pgTable("smart_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  term: text("term").notNull().unique(),
  aliases: text("aliases").array().default([]).notNull(),
  description: text("description"),
  category: text("category"),
  usageCount: integer("usage_count").default(0).notNull(),
  metadata: jsonb("metadata").$type<{
    definition?: string;
    relatedTerms?: string[];
    [key: string]: any;
  }>(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_smart_terms_category").on(table.category),
]);

// ============================================
// Smart Links System - Article Links Junction
// ============================================

export const articleSmartLinks = pgTable("article_smart_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  entityId: varchar("entity_id").references(() => smartEntities.id, { onDelete: "cascade" }),
  termId: varchar("term_id").references(() => smartTerms.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  context: text("context"),
  autoLinked: boolean("auto_linked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_article_smart_links_article").on(table.articleId),
  index("idx_article_smart_links_entity").on(table.entityId),
  index("idx_article_smart_links_term").on(table.termId),
]);

// ============================================
// Smart Links System - Relations
// ============================================

export const entityTypesRelations = relations(entityTypes, ({ many }) => ({
  entities: many(smartEntities),
}));

export const smartEntitiesRelations = relations(smartEntities, ({ one, many }) => ({
  type: one(entityTypes, {
    fields: [smartEntities.typeId],
    references: [entityTypes.id],
  }),
  links: many(articleSmartLinks),
}));

export const smartTermsRelations = relations(smartTerms, ({ many }) => ({
  links: many(articleSmartLinks),
}));

export const articleSmartLinksRelations = relations(articleSmartLinks, ({ one }) => ({
  article: one(articles, {
    fields: [articleSmartLinks.articleId],
    references: [articles.id],
  }),
  entity: one(smartEntities, {
    fields: [articleSmartLinks.entityId],
    references: [smartEntities.id],
  }),
  term: one(smartTerms, {
    fields: [articleSmartLinks.termId],
    references: [smartTerms.id],
  }),
}));

// ============================================
// Smart Links System - Types
// ============================================

export type EntityType = typeof entityTypes.$inferSelect;
export type InsertEntityTypeDb = typeof entityTypes.$inferInsert;
export type SmartEntity = typeof smartEntities.$inferSelect;
export type InsertSmartEntityDb = typeof smartEntities.$inferInsert;
export type SmartTerm = typeof smartTerms.$inferSelect;
export type InsertSmartTermDb = typeof smartTerms.$inferInsert;
export type ArticleSmartLink = typeof articleSmartLinks.$inferSelect;
export type InsertArticleSmartLinkDb = typeof articleSmartLinks.$inferInsert;

// ============================================
// Smart Links System - Zod Schemas
// ============================================

export const insertEntityTypeSchema = z.object({
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب"),
  nameEn: z.string().min(1, "الاسم بالإنجليزية مطلوب"),
  slug: z.string().min(1, "الرابط المختصر مطلوب"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().default(0),
  status: z.string().default("active"),
});

export const insertSmartEntitySchema = createInsertSchema(smartEntities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "اسم الكيان مطلوب"),
  slug: z.string().min(1, "الرابط المختصر مطلوب"),
  typeId: z.number().min(1, "نوع الكيان مطلوب"),
  aliases: z.array(z.string()).default([]),
  importanceScore: z.number().min(0).max(1).default(0.5),
});

export const insertSmartTermSchema = createInsertSchema(smartTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  term: z.string().min(1, "المصطلح مطلوب"),
  aliases: z.array(z.string()).default([]),
});

export const insertArticleSmartLinkSchema = createInsertSchema(articleSmartLinks).omit({
  id: true,
  createdAt: true,
}).extend({
  articleId: z.string().min(1, "معرف المقال مطلوب"),
  position: z.number().min(0, "الموقع يجب أن يكون 0 أو أكثر"),
});

// ============================================
// Smart Links System - Insert Types
// ============================================

export type InsertEntityType = z.infer<typeof insertEntityTypeSchema>;
export type InsertSmartEntity = z.infer<typeof insertSmartEntitySchema>;
export type InsertSmartTerm = z.infer<typeof insertSmartTermSchema>;
export type InsertArticleSmartLink = z.infer<typeof insertArticleSmartLinkSchema>;

// ============================================
// ENGLISH VERSION TABLES
// ============================================

// English Categories
export const enCategories = pgTable("en_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  heroImageUrl: text("hero_image_url"),
  displayOrder: integer("display_order").default(0),
  status: text("status").default("active").notNull(),
  type: text("type").default("core").notNull(), // core, dynamic, smart, seasonal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_en_categories_status").on(table.status),
  index("idx_en_categories_type_status").on(table.type, table.status),
]);

// English Articles
export const enArticles = pgTable("en_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  imageFocalPoint: jsonb("image_focal_point").$type<{
    x: number;
    y: number;
  }>(),
  categoryId: varchar("category_id").references(() => enCategories.id, { onDelete: 'set null' }),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  reporterId: varchar("reporter_id").references(() => users.id),
  articleType: text("article_type").default("news").notNull(), // news, opinion, analysis, column
  newsType: text("news_type").default("regular").notNull(), // breaking, featured, regular
  publishType: text("publish_type").default("instant").notNull(), // instant, scheduled
  scheduledAt: timestamp("scheduled_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, published, archived
  reviewStatus: text("review_status"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  hideFromHomepage: boolean("hide_from_homepage").default(false).notNull(),
  aiSummary: text("ai_summary"),
  smartSummary: text("smart_summary"),
  aiGenerated: boolean("ai_generated").default(false),
  isFeatured: boolean("is_featured").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  seo: jsonb("seo").$type<{
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    socialTitle?: string;
    socialDescription?: string;
    imageAltText?: string;
    ogImageUrl?: string;
  }>(),
  seoMetadata: jsonb("seo_metadata").$type<{
    status?: "draft" | "generated" | "approved" | "rejected";
    version?: number;
    generatedAt?: string;
    generatedBy?: string;
    provider?: "anthropic" | "openai" | "gemini" | "qwen";
    model?: string;
    manualOverride?: boolean;
    overrideBy?: string;
    overrideReason?: string;
    rawResponse?: any;
  }>(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_en_articles_status_published").on(table.status, table.publishedAt.desc()),
  index("idx_en_articles_category_status").on(table.categoryId, table.status),
  index("idx_en_articles_author_status").on(table.authorId, table.status),
  index("idx_en_articles_type").on(table.articleType),
  index("idx_en_articles_published_at").on(table.publishedAt.desc()),
]);

// English Comments
export const enComments = pgTable("en_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => enArticles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, flagged
  parentId: varchar("parent_id"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationReason: text("moderation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_en_comments_article_status").on(table.articleId, table.status),
  index("idx_en_comments_user").on(table.userId),
  index("idx_en_comments_status").on(table.status),
]);

// English Reactions
export const enReactions = pgTable("en_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => enArticles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull().default("like"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_en_reactions_article").on(table.articleId),
  index("idx_en_reactions_user_article").on(table.userId, table.articleId),
]);

// English Bookmarks
export const enBookmarks = pgTable("en_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => enArticles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_en_bookmarks_user").on(table.userId, table.createdAt.desc()),
  index("idx_en_bookmarks_article").on(table.articleId),
]);

// English Reading History
export const enReadingHistory = pgTable("en_reading_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  articleId: varchar("article_id").references(() => enArticles.id, { onDelete: "cascade" }).notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
  readDuration: integer("read_duration"),
}, (table) => [
  index("idx_en_reading_history_user").on(table.userId, table.readAt.desc()),
  index("idx_en_reading_history_article").on(table.articleId),
]);

// ============================================
// ENGLISH VERSION - INSERT SCHEMAS
// ============================================

export const insertEnCategorySchema = createInsertSchema(enCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
});

export const insertEnArticleSchema = createInsertSchema(enArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  views: true,
  authorId: true, // Backend adds this from req.user.id
}).extend({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  slug: z.string().min(1, "Slug is required"),
});

export const insertEnCommentSchema = createInsertSchema(enComments).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string().min(1, "Comment content is required"),
});

// ============================================
// ENGLISH VERSION - SELECT TYPES
// ============================================

export type EnCategory = typeof enCategories.$inferSelect;
export type InsertEnCategory = z.infer<typeof insertEnCategorySchema>;

export type EnArticle = typeof enArticles.$inferSelect;
export type InsertEnArticle = z.infer<typeof insertEnArticleSchema>;

export type EnComment = typeof enComments.$inferSelect;
export type InsertEnComment = z.infer<typeof insertEnCommentSchema>;

export type EnReaction = typeof enReactions.$inferSelect;
export type EnBookmark = typeof enBookmarks.$inferSelect;
export type EnReadingHistory = typeof enReadingHistory.$inferSelect;

// English Article with full details (similar to ArticleWithDetails for Arabic)
export type EnArticleWithDetails = EnArticle & {
  category?: EnCategory;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
  isBookmarked?: boolean;
  hasReacted?: boolean;
};

export type EnCommentWithUser = EnComment & {
  user: User;
  replies?: EnCommentWithUser[];
};

// ============================================
// URDU VERSION - DATABASE TABLES
// ============================================

// Urdu Categories
export const urCategories = pgTable("ur_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  heroImageUrl: text("hero_image_url"),
  displayOrder: integer("display_order").default(0),
  status: text("status").default("active").notNull(),
  type: text("type").default("core").notNull(), // core, dynamic, smart, seasonal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ur_categories_status").on(table.status),
  index("idx_ur_categories_type_status").on(table.type, table.status),
]);

// Urdu Articles
export const urArticles = pgTable("ur_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  imageFocalPoint: jsonb("image_focal_point").$type<{
    x: number;
    y: number;
  }>(),
  categoryId: varchar("category_id").references(() => urCategories.id, { onDelete: 'set null' }),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  reporterId: varchar("reporter_id").references(() => users.id),
  articleType: text("article_type").default("news").notNull(), // news, opinion, analysis, column
  newsType: text("news_type").default("regular").notNull(), // breaking, featured, regular
  publishType: text("publish_type").default("instant").notNull(), // instant, scheduled
  scheduledAt: timestamp("scheduled_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, published, archived
  reviewStatus: text("review_status"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  hideFromHomepage: boolean("hide_from_homepage").default(false).notNull(),
  aiSummary: text("ai_summary"),
  smartSummary: text("smart_summary"),
  aiGenerated: boolean("ai_generated").default(false),
  isFeatured: boolean("is_featured").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  seo: jsonb("seo").$type<{
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    socialTitle?: string;
    socialDescription?: string;
    imageAltText?: string;
    ogImageUrl?: string;
  }>(),
  seoMetadata: jsonb("seo_metadata").$type<{
    status?: "draft" | "generated" | "approved" | "rejected";
    version?: number;
    generatedAt?: string;
    generatedBy?: string;
    provider?: "anthropic" | "openai" | "gemini" | "qwen";
    model?: string;
    manualOverride?: boolean;
    overrideBy?: string;
    overrideReason?: string;
    rawResponse?: any;
  }>(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ur_articles_status_published").on(table.status, table.publishedAt.desc()),
  index("idx_ur_articles_category_status").on(table.categoryId, table.status),
  index("idx_ur_articles_author_status").on(table.authorId, table.status),
  index("idx_ur_articles_type").on(table.articleType),
  index("idx_ur_articles_published_at").on(table.publishedAt.desc()),
]);

// Urdu Comments
export const urComments = pgTable("ur_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => urArticles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, flagged
  parentId: varchar("parent_id"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationReason: text("moderation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ur_comments_article_status").on(table.articleId, table.status),
  index("idx_ur_comments_user").on(table.userId),
]);

// Urdu Reactions
export const urReactions = pgTable("ur_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => urArticles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull().default("like"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ur_reactions_article").on(table.articleId),
  index("idx_ur_reactions_user_article").on(table.userId, table.articleId),
]);

// Urdu Bookmarks
export const urBookmarks = pgTable("ur_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => urArticles.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ur_bookmarks_user").on(table.userId, table.createdAt.desc()),
  index("idx_ur_bookmarks_article").on(table.articleId),
]);

// Urdu Reading History
export const urReadingHistory = pgTable("ur_reading_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  articleId: varchar("article_id").references(() => urArticles.id, { onDelete: "cascade" }).notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
  readDuration: integer("read_duration"),
}, (table) => [
  index("idx_ur_reading_history_user").on(table.userId, table.readAt.desc()),
  index("idx_ur_reading_history_article").on(table.articleId),
]);

// ============================================
// URDU VERSION - INSERT SCHEMAS
// ============================================

export const insertUrCategorySchema = createInsertSchema(urCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
});

export const insertUrArticleSchema = createInsertSchema(urArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  views: true,
  authorId: true, // Backend adds this from req.user.id
}).extend({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  slug: z.string().min(1, "Slug is required"),
});

export const insertUrCommentSchema = createInsertSchema(urComments).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string().min(1, "Comment content is required"),
});

export const insertUrReactionSchema = createInsertSchema(urReactions).omit({
  id: true,
  createdAt: true,
});

export const insertUrBookmarkSchema = createInsertSchema(urBookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertUrReadingHistorySchema = createInsertSchema(urReadingHistory).omit({
  id: true,
  readAt: true,
});

// ============================================
// URDU VERSION - SELECT TYPES
// ============================================

export type UrCategory = typeof urCategories.$inferSelect;
export type InsertUrCategory = z.infer<typeof insertUrCategorySchema>;

export type UrArticle = typeof urArticles.$inferSelect;
export type InsertUrArticle = z.infer<typeof insertUrArticleSchema>;

export type UrComment = typeof urComments.$inferSelect;
export type InsertUrComment = z.infer<typeof insertUrCommentSchema>;

export type UrReaction = typeof urReactions.$inferSelect;
export type InsertUrReaction = z.infer<typeof insertUrReactionSchema>;

export type UrBookmark = typeof urBookmarks.$inferSelect;
export type InsertUrBookmark = z.infer<typeof insertUrBookmarkSchema>;

export type UrReadingHistory = typeof urReadingHistory.$inferSelect;
export type InsertUrReadingHistory = z.infer<typeof insertUrReadingHistorySchema>;

// Urdu Article with full details (similar to ArticleWithDetails for Arabic/English)
export type UrArticleWithDetails = UrArticle & {
  category?: UrCategory;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
  isBookmarked?: boolean;
  hasReacted?: boolean;
};

export type UrCommentWithUser = UrComment & {
  user: User;
  replies?: UrCommentWithUser[];
};

// Urdu Smart Blocks
export const urSmartBlocks = pgTable("ur_smart_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 60 }).notNull(),
  keyword: varchar("keyword", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  placement: varchar("placement", { length: 30 }).notNull(),
  layoutStyle: varchar("layout_style", { length: 20 }).notNull().default('grid'),
  limitCount: integer("limit_count").notNull().default(6),
  filters: jsonb("filters").$type<{
    categories?: string[];
    dateRange?: { from: string; to: string };
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ur_smart_blocks_keyword").on(table.keyword),
  index("idx_ur_smart_blocks_placement").on(table.placement),
  index("idx_ur_smart_blocks_active").on(table.isActive),
]);

export const urSmartBlocksRelations = relations(urSmartBlocks, ({ one }) => ({
  creator: one(users, {
    fields: [urSmartBlocks.createdBy],
    references: [users.id],
  }),
}));

export type UrSmartBlock = typeof urSmartBlocks.$inferSelect;
export const insertUrSmartBlockSchema = createInsertSchema(urSmartBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUrSmartBlock = z.infer<typeof insertUrSmartBlockSchema>;

// ============================================
// MEDIA LIBRARY (Arabic Version Only)
// ============================================

// Media Folders for organizing media files
export const mediaFolders = pgTable("media_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentId: varchar("parent_id").references((): any => mediaFolders.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_media_folders_parent").on(table.parentId),
]);

// Media Files - main media library table
export const mediaFiles = pgTable("media_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  folderId: varchar("folder_id").references(() => mediaFolders.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: text("type").notNull(), // image, video, document
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  width: integer("width"),
  height: integer("height"),
  
  // Metadata
  title: text("title"),
  description: text("description"),
  altText: text("alt_text"),
  caption: text("caption"),
  keywords: text("keywords").array().default(sql`ARRAY[]::text[]`),
  
  // Organization
  isFavorite: boolean("is_favorite").default(false).notNull(),
  category: text("category"), // articles, logos, reporters, banners, general
  
  // Usage tracking
  usedIn: text("used_in").array().default(sql`ARRAY[]::text[]`), // Array of article IDs or entity IDs
  usageCount: integer("usage_count").default(0).notNull(),
  
  // Ownership
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_media_files_folder").on(table.folderId),
  index("idx_media_files_uploaded_by").on(table.uploadedBy),
  index("idx_media_files_created_at").on(table.createdAt.desc()),
  index("idx_media_files_is_favorite").on(table.isFavorite),
  index("idx_media_files_category").on(table.category),
]);

// Media Usage Log - track where and when media is used
export const mediaUsageLog = pgTable("media_usage_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").references(() => mediaFiles.id, { onDelete: "cascade" }).notNull(),
  entityType: text("entity_type").notNull(), // article, user_profile, banner, etc.
  entityId: varchar("entity_id").notNull(),
  usedBy: varchar("used_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_media_usage_log_media").on(table.mediaId),
  index("idx_media_usage_log_entity").on(table.entityType, table.entityId),
]);

// ============================================
// MEDIA LIBRARY - INSERT SCHEMAS
// ============================================

export const insertMediaFolderSchema = createInsertSchema(mediaFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Folder name is required"),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
}).extend({
  fileName: z.string().min(1, "File name is required"),
  url: z.string().url("Invalid URL"),
  type: z.enum(["image", "video", "document"]),
  size: z.number().positive("Size must be positive"),
});

export const insertMediaUsageLogSchema = createInsertSchema(mediaUsageLog).omit({
  id: true,
  createdAt: true,
}).extend({
  mediaId: z.string().min(1, "Media ID is required"),
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().min(1, "Entity ID is required"),
});

export const updateMediaFileSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  altText: z.string().optional(),
  caption: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  category: z.string().optional(),
  isFavorite: z.boolean().optional(),
  folderId: z.string().nullable().optional(),
});

export const updateMediaFolderSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

// ============================================
// MEDIA LIBRARY - SELECT TYPES
// ============================================

export type MediaFolder = typeof mediaFolders.$inferSelect;
export type InsertMediaFolder = z.infer<typeof insertMediaFolderSchema>;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

export type MediaUsageLog = typeof mediaUsageLog.$inferSelect;
export type InsertMediaUsageLog = z.infer<typeof insertMediaUsageLogSchema>;

// Media File with additional details
export type MediaFileWithDetails = MediaFile & {
  folder?: MediaFolder;
  uploader?: User;
  usageHistory?: MediaUsageLog[];
};

// ============================================
// ADVERTISING SYSTEM - SMART AD PLATFORM
// ============================================

// Ad Accounts - حسابات المعلنين
export const adAccounts = pgTable("ad_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  companyName: text("company_name").notNull(),
  companyNameEn: text("company_name_en"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  taxId: text("tax_id"), // الرقم الضريبي
  billingAddress: jsonb("billing_address").$type<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }>(),
  status: text("status").default("active").notNull(), // active, suspended, closed
  accountType: text("account_type").default("standard").notNull(), // standard, premium, enterprise
  totalSpent: integer("total_spent").default(0).notNull().$type<number>(), // بالسنتات - using integer for compatibility
  totalBudget: integer("total_budget").$type<number>(), // حد الإنفاق الإجمالي (اختياري)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ad_accounts_user").on(table.userId),
  index("idx_ad_accounts_status").on(table.status),
]);

// Campaigns - الحملات الإعلانية
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => adAccounts.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  objective: text("objective").notNull(), // CPM, CPC, CPA
  status: text("status").default("draft").notNull(), // draft, pending_review, active, paused, completed, rejected
  dailyBudget: integer("daily_budget").notNull(), // عدد الظهورات اليومية المسموحة
  totalBudget: integer("total_budget").notNull(), // إجمالي الظهورات المسموحة
  spentBudget: integer("spent_budget").default(0).notNull(), // عدد الظهورات المستخدمة
  spentToday: integer("spent_today").default(0).notNull(), // عدد الظهورات المستخدمة اليوم
  lastResetDate: timestamp("last_reset_date").defaultNow(), // لإعادة تعيين عداد الظهورات اليومية
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  bidAmount: integer("bid_amount").notNull(), // للاحتفاظ بالتوافقية (غير مستخدم حالياً)
  
  // معلومات الموافقة
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_campaigns_account").on(table.accountId),
  index("idx_campaigns_status").on(table.status),
  index("idx_campaigns_objective").on(table.objective),
  index("idx_campaigns_dates").on(table.startDate, table.endDate),
]);

// Ad Groups - المجموعات الإعلانية
export const adGroups = pgTable("ad_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  
  // الاستهداف
  targetCountries: text("target_countries").array().default(sql`ARRAY['SA']::text[]`),
  targetDevices: text("target_devices").array().default(sql`ARRAY['desktop', 'mobile', 'tablet']::text[]`),
  targetCategories: text("target_categories").array().default(sql`ARRAY[]::text[]`), // IDs من جدول categories
  targetKeywords: text("target_keywords").array().default(sql`ARRAY[]::text[]`),
  
  status: text("status").default("active").notNull(), // active, paused
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ad_groups_campaign").on(table.campaignId),
  index("idx_ad_groups_status").on(table.status),
]);

// Creatives - الإعلانات (المحتوى الإعلاني)
export const creatives = pgTable("creatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adGroupId: varchar("ad_group_id").references(() => adGroups.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // image, video, html, text
  content: text("content").notNull(), // URL للصورة/فيديو أو HTML code
  destinationUrl: text("destination_url").notNull(),
  size: text("size").notNull(), // "728x90", "300x250", etc.
  
  // معلومات إضافية
  title: text("title"), // للإعلانات النصية
  description: text("description"), // للإعلانات النصية
  callToAction: text("call_to_action"), // "اشتري الآن"، "سجل الآن"
  
  // الأداء المتوقع بواسطة AI
  predictedCTR: integer("predicted_ctr").default(0), // نسبة مئوية × 10000
  
  status: text("status").default("active").notNull(), // active, paused, rejected
  rejectionReason: text("rejection_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_creatives_ad_group").on(table.adGroupId),
  index("idx_creatives_status").on(table.status),
  index("idx_creatives_type").on(table.type),
  index("idx_creatives_size").on(table.size),
]);

// Inventory Slots - أماكن العرض في الموقع
export const inventorySlots = pgTable("inventory_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(), // header, sidebar, footer, inline, between_articles
  size: text("size").notNull(), // "728x90", "300x250", etc.
  pageType: text("page_type").default("all").notNull(), // all, home, article, category
  deviceType: text("device_type").default("all").notNull(), // desktop, mobile, tablet, all
  isActive: boolean("is_active").default(true).notNull(),
  floorPrice: integer("floor_price").default(0), // الحد الأدنى للسعر بالسنتات
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_inventory_slots_location").on(table.location),
  index("idx_inventory_slots_size").on(table.size),
  index("idx_inventory_slots_active").on(table.isActive),
  index("idx_inventory_slots_device_type").on(table.deviceType),
]);

// Ad Creative Placements - ربط البنرات بأماكن العرض
export const adCreativePlacements = pgTable("ad_creative_placements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  adGroupId: varchar("ad_group_id").references(() => adGroups.id, { onDelete: "cascade" }), // اختياري للاستهداف المتقدم
  creativeId: varchar("creative_id").references(() => creatives.id, { onDelete: "cascade" }).notNull(),
  inventorySlotId: varchar("inventory_slot_id").references(() => inventorySlots.id, { onDelete: "cascade" }).notNull(),
  
  // الجدولة والأولوية
  priority: integer("priority").default(5).notNull(), // 1-10 (أعلى رقم = أولوية أعلى)
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").default("scheduled").notNull(), // scheduled, active, paused, expired
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_placements_campaign").on(table.campaignId),
  index("idx_placements_creative").on(table.creativeId),
  index("idx_placements_slot").on(table.inventorySlotId),
  index("idx_placements_status").on(table.status),
  index("idx_placements_dates").on(table.startDate, table.endDate),
]);

// Impressions - المشاهدات
export const impressions = pgTable("impressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creativeId: varchar("creative_id").references(() => creatives.id, { onDelete: "cascade" }).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  slotId: varchar("slot_id").references(() => inventorySlots.id),
  
  // معلومات المستخدم
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  country: text("country").default("SA"),
  device: text("device"), // desktop, mobile, tablet
  
  // معلومات الصفحة
  pageUrl: text("page_url"),
  referrer: text("referrer"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_impressions_creative").on(table.creativeId),
  index("idx_impressions_campaign").on(table.campaignId),
  index("idx_impressions_slot").on(table.slotId),
  index("idx_impressions_timestamp").on(table.timestamp.desc()),
  index("idx_impressions_country").on(table.country),
  index("idx_impressions_device").on(table.device),
]);

// Clicks - النقرات
export const clicks = pgTable("clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  impressionId: varchar("impression_id").references(() => impressions.id),
  creativeId: varchar("creative_id").references(() => creatives.id, { onDelete: "cascade" }).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  slotId: varchar("slot_id").references(() => inventorySlots.id),
  
  // معلومات المستخدم
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  country: text("country").default("SA"),
  device: text("device"),
  
  // معلومات الصفحة
  pageUrl: text("page_url"),
  referrer: text("referrer"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_clicks_impression").on(table.impressionId),
  index("idx_clicks_creative").on(table.creativeId),
  index("idx_clicks_campaign").on(table.campaignId),
  index("idx_clicks_slot").on(table.slotId),
  index("idx_clicks_timestamp").on(table.timestamp.desc()),
  index("idx_clicks_country").on(table.country),
  index("idx_clicks_device").on(table.device),
]);

// Conversions - التحويلات
export const conversions = pgTable("conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clickId: varchar("click_id").references(() => clicks.id),
  creativeId: varchar("creative_id").references(() => creatives.id, { onDelete: "cascade" }).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  
  conversionType: text("conversion_type").notNull(), // purchase, signup, download, form_submit
  conversionValue: integer("conversion_value"), // قيمة التحويل بالسنتات (اختياري)
  
  // معلومات إضافية
  metadata: jsonb("metadata").$type<{
    orderId?: string;
    productId?: string;
    quantity?: number;
    [key: string]: any;
  }>(),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_ad_conversions_click").on(table.clickId),
  index("idx_ad_conversions_creative").on(table.creativeId),
  index("idx_ad_conversions_campaign").on(table.campaignId),
  index("idx_ad_conversions_timestamp").on(table.timestamp.desc()),
  index("idx_ad_conversions_type").on(table.conversionType),
]);

// Daily Stats - الإحصائيات اليومية المحسوبة
export const dailyStats = pgTable("daily_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  creativeId: varchar("creative_id").references(() => creatives.id, { onDelete: "cascade" }),
  slotId: varchar("slot_id").references(() => inventorySlots.id),
  
  date: timestamp("date").notNull(),
  
  // المقاييس
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  spent: integer("spent").default(0).notNull(), // بالسنتات
  revenue: integer("revenue").default(0).notNull(), // بالسنتات (للناشر)
  
  // المقاييس المحسوبة (نسب مئوية × 10000)
  ctr: integer("ctr").default(0), // Click-Through Rate
  conversionRate: integer("conversion_rate").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_daily_stats_campaign").on(table.campaignId),
  index("idx_daily_stats_creative").on(table.creativeId),
  index("idx_daily_stats_slot").on(table.slotId),
  index("idx_daily_stats_date").on(table.date.desc()),
  // فهرس مركب لتحسين الاستعلامات
  index("idx_daily_stats_campaign_date").on(table.campaignId, table.date.desc()),
]);

// Budget History - سجل الميزانية
export const budgetHistory = pgTable("budget_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // بالسنتات
  type: text("type").notNull(), // charge, refund, adjustment
  reason: text("reason"),
  performedBy: varchar("performed_by").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_budget_history_campaign").on(table.campaignId),
  index("idx_budget_history_timestamp").on(table.timestamp.desc()),
  index("idx_budget_history_type").on(table.type),
]);

// AI Recommendations - التوصيات الذكية
export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  creativeId: varchar("creative_id").references(() => creatives.id, { onDelete: "cascade" }),
  
  type: text("type").notNull(), // budget_increase, budget_decrease, pause_ad, target_adjustment, bid_adjustment
  priority: text("priority").default("medium").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  
  // التوصية المفصلة
  recommendation: jsonb("recommendation").$type<{
    action?: string;
    currentValue?: any;
    suggestedValue?: any;
    reason?: string;
    expectedImpact?: string;
    [key: string]: any;
  }>(),
  
  confidence: integer("confidence").default(5000), // نسبة الثقة (0-10000)
  
  isRead: boolean("is_read").default(false).notNull(),
  isApplied: boolean("is_applied").default(false).notNull(),
  appliedAt: timestamp("applied_at"),
  appliedBy: varchar("applied_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_recommendations_campaign").on(table.campaignId),
  index("idx_ai_recommendations_creative").on(table.creativeId),
  index("idx_ai_recommendations_type").on(table.type),
  index("idx_ai_recommendations_priority").on(table.priority),
  index("idx_ai_recommendations_is_read").on(table.isRead),
  index("idx_ai_recommendations_created_at").on(table.createdAt.desc()),
]);

// Audit Logs - سجل التدقيق
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // campaign, creative, ad_group, etc.
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete, approve, reject, pause, resume
  
  // التغييرات
  changes: jsonb("changes").$type<{
    before?: any;
    after?: any;
    [key: string]: any;
  }>(),
  
  // معلومات الطلب
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_entity").on(table.entityType, table.entityId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_timestamp").on(table.timestamp.desc()),
]);

// ============================================
// DATA-STORY GENERATOR SYSTEM
// ============================================

// Data story source files (uploaded datasets)
export const dataStorySources = pgTable("data_story_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(), // uploader
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // csv, excel, json
  fileSize: integer("file_size").notNull(), // bytes
  storageKey: text("storage_key").notNull(), // object storage path
  storageUrl: text("storage_url"), // public URL if needed
  
  // Parsing status
  parseStatus: text("parse_status").default("pending").notNull(), // pending, parsing, completed, failed
  parseError: text("parse_error"),
  parsedAt: timestamp("parsed_at"),
  
  // Dataset metadata (populated after parsing)
  rowCount: integer("row_count"),
  columnCount: integer("column_count"),
  columns: jsonb("columns").$type<{
    name: string;
    type: "number" | "string" | "date" | "boolean";
    sampleValues?: any[];
    uniqueCount?: number;
    nullCount?: number;
  }[]>(),
  
  // Preview data (first 10 rows)
  previewData: jsonb("preview_data"),
  
  status: text("status").default("active").notNull(), // active, archived, deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Data story analyses (AI-generated insights)
export const dataStoryAnalyses = pgTable("data_story_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").references(() => dataStorySources.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Analysis status
  status: text("status").default("pending").notNull(), // pending, analyzing, completed, failed
  error: text("error"),
  
  // Statistical insights (computed locally)
  statistics: jsonb("statistics").$type<{
    summary?: {
      totalRows: number;
      totalColumns: number;
      numericColumns: number;
      categoricalColumns: number;
    };
    columnStats?: Record<string, {
      mean?: number;
      median?: number;
      min?: number;
      max?: number;
      stdDev?: number;
      topValues?: Array<{ value: any; count: number; percentage: number }>;
    }>;
  }>(),
  
  // AI-generated insights
  aiInsights: jsonb("ai_insights").$type<{
    keyFindings?: string[];
    trends?: string[];
    anomalies?: string[];
    recommendations?: string[];
    narrative?: string; // Arabic narrative summary
  }>(),
  
  // Chart configurations (for Recharts)
  chartConfigs: jsonb("chart_configs").$type<Array<{
    id: string;
    type: "bar" | "line" | "pie" | "area" | "scatter";
    title: string;
    description?: string;
    dataKey: string;
    xAxis?: string;
    yAxis?: string;
    data?: any[];
    config?: any;
  }>>(),
  
  // AI metadata
  aiProvider: text("ai_provider"), // openai, anthropic, gemini
  aiModel: text("ai_model"),
  tokensUsed: integer("tokens_used"),
  processingTime: integer("processing_time"), // milliseconds
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Data story drafts (AI-generated Arabic news stories)
export const dataStoryDrafts = pgTable("data_story_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => dataStoryAnalyses.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Draft content
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: text("content").notNull(), // Main article content in Arabic
  excerpt: text("excerpt"),
  
  // Story structure
  outline: jsonb("outline").$type<{
    sections?: Array<{
      heading: string;
      content: string;
      dataReferences?: string[]; // references to charts/stats
    }>;
  }>(),
  
  // Status
  status: text("status").default("draft").notNull(), // draft, review, approved, published, converted_to_article
  
  // Link to published article (if converted)
  articleId: varchar("article_id").references(() => articles.id),
  convertedAt: timestamp("converted_at"),
  
  // AI metadata
  aiProvider: text("ai_provider"), // anthropic (Claude for Arabic)
  aiModel: text("ai_model"),
  tokensUsed: integer("tokens_used"),
  generationTime: integer("generation_time"), // milliseconds
  
  // Editor metadata
  editedBy: varchar("edited_by").references(() => users.id),
  editedAt: timestamp("edited_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// APPLE WALLET PASSES MANAGEMENT
// ============================================

// Apple Wallet Passes - Digital press card and loyalty card for users
export const walletPasses = pgTable("wallet_passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  passType: text("pass_type").notNull().default('press'), // 'press' | 'loyalty'
  passTypeIdentifier: text("pass_type_identifier").notNull(), // e.g., pass.life.sabq.presscard
  serialNumber: text("serial_number").notNull().unique(),
  authenticationToken: text("authentication_token").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wallet_passes_user_id_idx").on(table.userId),
  index("wallet_passes_type_idx").on(table.passType),
  uniqueIndex("wallet_passes_user_type_idx").on(table.userId, table.passType),
]);

// Apple Wallet Devices - Devices that have the pass installed
export const walletDevices = pgTable("wallet_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  passId: varchar("pass_id").notNull().references(() => walletPasses.id, { onDelete: 'cascade' }),
  deviceLibraryIdentifier: text("device_library_identifier").notNull(),
  pushToken: text("push_token").notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
}, (table) => [
  index("wallet_devices_pass_id_idx").on(table.passId),
  uniqueIndex("wallet_devices_unique_idx").on(table.passId, table.deviceLibraryIdentifier),
]);

// Apple Wallet Relations
export const walletPassesRelations = relations(walletPasses, ({ one, many }) => ({
  user: one(users, {
    fields: [walletPasses.userId],
    references: [users.id],
  }),
  devices: many(walletDevices),
}));

export const walletDevicesRelations = relations(walletDevices, ({ one }) => ({
  pass: one(walletPasses, {
    fields: [walletDevices.passId],
    references: [walletPasses.id],
  }),
}));

// Apple Wallet Types
export type WalletPass = typeof walletPasses.$inferSelect;
export type WalletDevice = typeof walletDevices.$inferSelect;

// Apple Wallet Zod Schemas
export const insertWalletPassSchema = createInsertSchema(walletPasses).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
}).extend({
  passType: z.enum(['press', 'loyalty']).optional(), // Validate passType is 'press' or 'loyalty'
});
export type InsertWalletPass = z.infer<typeof insertWalletPassSchema>;

export const insertWalletDeviceSchema = createInsertSchema(walletDevices).omit({
  id: true,
  registeredAt: true,
});
export type InsertWalletDevice = z.infer<typeof insertWalletDeviceSchema>;

// Data story relations
export const dataStorySourcesRelations = relations(dataStorySources, ({ one, many }) => ({
  user: one(users, {
    fields: [dataStorySources.userId],
    references: [users.id],
  }),
  analyses: many(dataStoryAnalyses),
}));

export const dataStoryAnalysesRelations = relations(dataStoryAnalyses, ({ one, many }) => ({
  source: one(dataStorySources, {
    fields: [dataStoryAnalyses.sourceId],
    references: [dataStorySources.id],
  }),
  user: one(users, {
    fields: [dataStoryAnalyses.userId],
    references: [users.id],
  }),
  drafts: many(dataStoryDrafts),
}));

export const dataStoryDraftsRelations = relations(dataStoryDrafts, ({ one }) => ({
  analysis: one(dataStoryAnalyses, {
    fields: [dataStoryDrafts.analysisId],
    references: [dataStoryAnalyses.id],
  }),
  user: one(users, {
    fields: [dataStoryDrafts.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [dataStoryDrafts.articleId],
    references: [articles.id],
  }),
  editedByUser: one(users, {
    fields: [dataStoryDrafts.editedBy],
    references: [users.id],
  }),
}));

// ============================================
// ADVERTISING SYSTEM - INSERT SCHEMAS
// ============================================

export const insertAdAccountSchema = createInsertSchema(adAccounts).omit({
  id: true,
  totalSpent: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  contactEmail: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  spentBudget: true,
  spentToday: true,
  lastResetDate: true,
  reviewedBy: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "اسم الحملة مطلوب"),
  objective: z.enum(["CPM", "CPC", "CPA", "CPE"], { message: "نوع الحملة غير صحيح" }),
  dailyBudget: z.number().int().positive("عدد الظهورات اليومية يجب أن يكون موجباً"),
  totalBudget: z.number().int().positive("إجمالي الظهورات يجب أن يكون موجباً"),
  bidAmount: z.number().int().positive("القيمة يجب أن تكون موجبة").default(1),
  startDate: z.coerce.date(), // Accept ISO string and convert to date
  endDate: z.coerce.date().nullable().optional(), // Accept ISO string, optional, can be null
});

export const insertAdGroupSchema = createInsertSchema(adGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "اسم المجموعة مطلوب"),
});

export const insertCreativeSchema = createInsertSchema(creatives).omit({
  id: true,
  predictedCTR: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "اسم الإعلان مطلوب"),
  type: z.enum(["image", "video", "html", "text"], { message: "نوع الإعلان غير صحيح" }),
  content: z.string().min(1, "محتوى الإعلان مطلوب"),
  destinationUrl: z.string().url("الرابط غير صحيح"),
  size: z.string().min(1, "حجم الإعلان مطلوب"),
});

export const insertInventorySlotSchema = createInsertSchema(inventorySlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "اسم المكان مطلوب"),
  location: z.enum(["header", "sidebar", "footer", "inline", "between_articles"]),
  size: z.string().min(1, "الحجم مطلوب"),
  deviceType: z.enum(["desktop", "mobile", "tablet", "all"]).default("all"),
});

export const insertAdCreativePlacementSchema = createInsertSchema(adCreativePlacements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  campaignId: z.string().uuid("معرف الحملة غير صحيح"),
  creativeId: z.string().uuid("معرف البنر غير صحيح"),
  inventorySlotId: z.string().uuid("معرف مكان العرض غير صحيح"),
  priority: z.coerce.number().int().min(1, "الأولوية يجب أن تكون 1 على الأقل").max(10, "الأولوية لا يمكن أن تزيد عن 10").default(5),
  startDate: z.coerce.date({ message: "تاريخ البداية مطلوب" }),
  endDate: z.coerce.date({ message: "تاريخ النهاية غير صحيح" }).optional().nullable(),
  status: z.enum(["scheduled", "active", "paused", "expired"], { message: "الحالة غير صحيحة" }).default("scheduled"),
}).refine((data) => !data.endDate || data.endDate > data.startDate, {
  message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  path: ["endDate"],
});

// ============================================
// ADVERTISING SYSTEM - SELECT TYPES
// ============================================

export type AdAccount = typeof adAccounts.$inferSelect;
export type InsertAdAccount = z.infer<typeof insertAdAccountSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type AdGroup = typeof adGroups.$inferSelect;
export type InsertAdGroup = z.infer<typeof insertAdGroupSchema>;

export type Creative = typeof creatives.$inferSelect;
export type InsertCreative = z.infer<typeof insertCreativeSchema>;

export type InventorySlot = typeof inventorySlots.$inferSelect;
export type InsertInventorySlot = z.infer<typeof insertInventorySlotSchema>;

export type AdCreativePlacement = typeof adCreativePlacements.$inferSelect;
export type InsertAdCreativePlacement = z.infer<typeof insertAdCreativePlacementSchema>;

export type Impression = typeof impressions.$inferSelect;
export type Click = typeof clicks.$inferSelect;
export type Conversion = typeof conversions.$inferSelect;
export type DailyStat = typeof dailyStats.$inferSelect;
export type BudgetHistory = typeof budgetHistory.$inferSelect;
export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

// Campaign with additional details
export type CampaignWithDetails = Campaign & {
  account?: AdAccount;
  adGroups?: AdGroup[];
  stats?: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    ctr: number;
    conversionRate: number;
  };
  recommendations?: AIRecommendation[];
};

// ============================================
// DATA-STORY GENERATOR - INSERT SCHEMAS
// ============================================

export const insertDataStorySourceSchema = createInsertSchema(dataStorySources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  columns: columnsSchema,
  previewData: previewDataSchema,
});

export const insertDataStoryAnalysisSchema = createInsertSchema(dataStoryAnalyses).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  statistics: statisticsSchema,
  aiInsights: aiInsightsSchema,
  chartConfigs: chartConfigsSchema,
});

export const insertDataStoryDraftSchema = createInsertSchema(dataStoryDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "عنوان القصة مطلوب"),
  content: z.string().min(10, "محتوى القصة مطلوب"),
  outline: outlineSchema,
});

// ============================================
// DATA-STORY GENERATOR - SELECT TYPES
// ============================================

export type DataStorySource = typeof dataStorySources.$inferSelect;
export type InsertDataStorySource = z.infer<typeof insertDataStorySourceSchema>;

export type DataStoryAnalysis = typeof dataStoryAnalyses.$inferSelect;
export type InsertDataStoryAnalysis = z.infer<typeof insertDataStoryAnalysisSchema>;

export type DataStoryDraft = typeof dataStoryDrafts.$inferSelect;
export type InsertDataStoryDraft = z.infer<typeof insertDataStoryDraftSchema>;

// Combined type with relations
export type DataStoryWithDetails = DataStorySource & {
  analyses?: (DataStoryAnalysis & {
    drafts?: DataStoryDraft[];
  })[];
};

// ============================================
// SMART JOURNALIST AGENT - TABLES
// ============================================

export const journalistTasks = pgTable("journalist_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  prompt: text("prompt").notNull(), // The journalist's request
  
  // Status tracking
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed
  progress: text("progress"), // Current step description
  progressStep: integer("progress_step").default(0).notNull(), // 0-5 (research, analysis, writing, media, headlines)
  
  // Results
  results: jsonb("results").$type<{
    research?: {
      sources: Array<{
        title: string;
        url: string;
        snippet: string;
      }>;
      summary: string;
    };
    analysis?: {
      keyPoints: string[];
      mainTheme: string;
      suggestedAngle: string;
    };
    draft?: {
      title: string;
      content: string;
      wordCount: number;
    };
    images?: Array<{
      url: string;
      description: string;
      source: string;
      license: string;
    }>;
    headlines?: Array<{
      text: string;
      style: string; // formal, casual, clickbait, seo
      aiModel: string;
    }>;
  }>(),
  
  // AI metadata
  aiProviders: text("ai_providers").array(), // List of AI providers used
  totalTokens: integer("total_tokens").default(0),
  processingTime: integer("processing_time"), // Total processing time in milliseconds
  
  // Error handling
  errorMessage: text("error_message"),
  errorStep: text("error_step"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journalist tasks relations
export const journalistTasksRelations = relations(journalistTasks, ({ one }) => ({
  user: one(users, {
    fields: [journalistTasks.userId],
    references: [users.id],
  }),
}));

// ============================================
// SMART JOURNALIST AGENT - INSERT SCHEMAS
// ============================================

export const insertJournalistTaskSchema = createInsertSchema(journalistTasks).omit({
  id: true,
  status: true,
  progress: true,
  progressStep: true,
  results: true,
  aiProviders: true,
  totalTokens: true,
  processingTime: true,
  errorMessage: true,
  errorStep: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  updatedAt: true,
}).extend({
  prompt: z.string().min(10, "الطلب يجب أن يكون 10 أحرف على الأقل").max(2000, "الطلب يجب ألا يتجاوز 2000 حرف"),
});

// ============================================
// SMART JOURNALIST AGENT - SELECT TYPES
// ============================================

export type JournalistTask = typeof journalistTasks.$inferSelect;
export type InsertJournalistTask = z.infer<typeof insertJournalistTaskSchema>;

// ============================================
// SOCIAL SHARING - SHORT LINKS TABLE
// ============================================

export const shortLinks = pgTable("short_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code", { length: 12 }).notNull().unique(), // e.g., "a1b2c3"
  originalUrl: text("original_url").notNull(),
  
  // UTM parameters for tracking
  utmSource: text("utm_source"), // e.g., "twitter", "whatsapp", "facebook"
  utmMedium: text("utm_medium"), // e.g., "social" - set in service logic
  utmCampaign: text("utm_campaign"), // e.g., "breaking_news"
  utmContent: text("utm_content"), // optional additional tracking
  
  // Metadata
  articleId: varchar("article_id").references(() => articles.id, { onDelete: 'set null' }),
  createdBy: varchar("created_by").references(() => users.id),
  
  // Analytics
  clickCount: integer("click_count").default(0).notNull(),
  lastClickedAt: timestamp("last_clicked_at"),
  
  // Lifecycle
  expiresAt: timestamp("expires_at"), // optional expiration
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_short_links_code").on(table.shortCode),
  index("idx_short_links_article_active").on(table.articleId, table.isActive),
  index("idx_short_links_created").on(table.createdAt.desc()),
]);

// Short links relations
export const shortLinksRelations = relations(shortLinks, ({ one }) => ({
  article: one(articles, {
    fields: [shortLinks.articleId],
    references: [articles.id],
  }),
  creator: one(users, {
    fields: [shortLinks.createdBy],
    references: [users.id],
  }),
}));

// ============================================
// SOCIAL SHARING - CLICK TRACKING TABLE
// ============================================

export const shortLinkClicks = pgTable("short_link_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortLinkId: varchar("short_link_id").references(() => shortLinks.id, { onDelete: 'cascade' }).notNull(),
  
  // Click details
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referer: text("referer"),
  
  // Geolocation (optional)
  country: text("country"),
  city: text("city"),
  
  // User tracking (if logged in)
  userId: varchar("user_id").references(() => users.id),
}, (table) => [
  index("idx_short_link_clicks_link").on(table.shortLinkId),
  index("idx_short_link_clicks_date").on(table.clickedAt.desc()),
]);

// Short link clicks relations
export const shortLinkClicksRelations = relations(shortLinkClicks, ({ one }) => ({
  shortLink: one(shortLinks, {
    fields: [shortLinkClicks.shortLinkId],
    references: [shortLinks.id],
  }),
  user: one(users, {
    fields: [shortLinkClicks.userId],
    references: [users.id],
  }),
}));

// ============================================
// SOCIAL SHARING - INSERT SCHEMAS
// ============================================

export const insertShortLinkSchema = createInsertSchema(shortLinks).omit({
  id: true,
  shortCode: true, // auto-generated
  clickCount: true,
  lastClickedAt: true,
  createdAt: true,
}).extend({
  originalUrl: z.string().url("يجب أن يكون رابط صالح"),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  articleId: z.string().optional(),
});

export const insertShortLinkClickSchema = createInsertSchema(shortLinkClicks).omit({
  id: true,
  clickedAt: true,
});

// ============================================
// SOCIAL SHARING - SELECT TYPES
// ============================================

export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = z.infer<typeof insertShortLinkSchema>;
export type ShortLinkClick = typeof shortLinkClicks.$inferSelect;
export type InsertShortLinkClick = z.infer<typeof insertShortLinkClickSchema>;

// ============================================
// DEEP ANALYSIS SYSTEM
// ============================================

export const deepAnalyses = pgTable("deep_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Core fields
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  description: text("description"),
  
  // Context & Configuration
  categoryId: varchar("category_id").references(() => categories.id),
  reporterId: varchar("reporter_id").references(() => users.id),
  keywords: text("keywords").array().default(sql`ARRAY[]::text[]`).notNull(),
  analysisDepth: text("analysis_depth").default("deep").notNull(), // short, deep, expert
  analysisType: text("analysis_type").default("comprehensive").notNull(), // economic, political, technical, social, comprehensive
  
  // AI Configuration
  useMultiModel: boolean("use_multi_model").default(true).notNull(),
  modelsUsed: text("models_used").array().default(sql`ARRAY['openai', 'gemini']::text[]`).notNull(), // openai, anthropic, gemini
  
  // Analysis Outputs
  gptAnalysis: text("gpt_analysis"),
  geminiAnalysis: text("gemini_analysis"),
  claudeAnalysis: text("claude_analysis"),
  mergedAnalysis: text("merged_analysis"),
  executiveSummary: text("executive_summary"),
  recommendations: text("recommendations"),
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  status: text("status").default("draft").notNull(), // draft, completed, published, archived
  generationTime: integer("generation_time"), // milliseconds
  
  // SEO & Keywords (AI-generated)
  aiKeywords: text("ai_keywords").array().default(sql`ARRAY[]::text[]`).notNull(),
  smartEntities: jsonb("smart_entities").$type<{
    persons?: string[];
    organizations?: string[];
    locations?: string[];
  }>(),
  
  // Model comparison insights
  modelInsights: jsonb("model_insights").$type<{
    gptScore?: number;
    geminiScore?: number;
    claudeScore?: number;
    comparisonNotes?: string;
  }>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_deep_analyses_created_by").on(table.createdBy),
  index("idx_deep_analyses_status").on(table.status),
  index("idx_deep_analyses_category").on(table.categoryId),
  index("idx_deep_analyses_created_at").on(table.createdAt.desc()),
]);

// Deep analysis metrics (one-to-one with deep_analyses)
export const deepAnalysisMetrics = pgTable("deep_analysis_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => deepAnalyses.id, { onDelete: "cascade" }).notNull().unique(),
  views: integer("views").default(0).notNull(),
  shares: integer("shares").default(0).notNull(),
  downloads: integer("downloads").default(0).notNull(),
  exportsPdf: integer("exports_pdf").default(0).notNull(),
  exportsDocx: integer("exports_docx").default(0).notNull(),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_deep_analysis_metrics_analysis_id").on(table.analysisId),
]);

// Deep analysis events (append-only log)
export const deepAnalysisEvents = pgTable("deep_analysis_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => deepAnalyses.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id), // nullable for anonymous visitors
  eventType: text("event_type").notNull(), // 'view', 'share', 'download', 'export_pdf', 'export_docx'
  metadata: jsonb("metadata").$type<{
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    shareTarget?: string; // twitter, facebook, whatsapp, etc.
    downloadFormat?: string;
    [key: string]: any;
  }>(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
}, (table) => [
  index("idx_deep_analysis_events_analysis_id").on(table.analysisId),
  index("idx_deep_analysis_events_user_id").on(table.userId),
  index("idx_deep_analysis_events_event_type").on(table.eventType),
  index("idx_deep_analysis_events_occurred_at").on(table.occurredAt.desc()),
]);

// Deep analyses relations
export const deepAnalysesRelations = relations(deepAnalyses, ({ one, many }) => ({
  category: one(categories, {
    fields: [deepAnalyses.categoryId],
    references: [categories.id],
  }),
  reporter: one(users, {
    fields: [deepAnalyses.reporterId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [deepAnalyses.createdBy],
    references: [users.id],
  }),
  metrics: one(deepAnalysisMetrics, {
    fields: [deepAnalyses.id],
    references: [deepAnalysisMetrics.analysisId],
  }),
  events: many(deepAnalysisEvents),
}));

// Deep analysis metrics relations
export const deepAnalysisMetricsRelations = relations(deepAnalysisMetrics, ({ one }) => ({
  analysis: one(deepAnalyses, {
    fields: [deepAnalysisMetrics.analysisId],
    references: [deepAnalyses.id],
  }),
}));

// Deep analysis events relations
export const deepAnalysisEventsRelations = relations(deepAnalysisEvents, ({ one }) => ({
  analysis: one(deepAnalyses, {
    fields: [deepAnalysisEvents.analysisId],
    references: [deepAnalyses.id],
  }),
  user: one(users, {
    fields: [deepAnalysisEvents.userId],
    references: [users.id],
  }),
}));

// Deep analyses insert schema
export const insertDeepAnalysisSchema = createInsertSchema(deepAnalyses).omit({
  id: true,
  gptAnalysis: true,
  geminiAnalysis: true,
  claudeAnalysis: true,
  mergedAnalysis: true,
  executiveSummary: true,
  recommendations: true,
  aiKeywords: true,
  generationTime: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(3, "يجب أن يكون العنوان 3 أحرف على الأقل"),
  topic: z.string().min(10, "يجب أن يكون الموضوع 10 أحرف على الأقل"),
  analysisDepth: z.enum(["short", "deep", "expert"]).default("deep"),
  analysisType: z.enum(["economic", "political", "technical", "social", "comprehensive"]).default("comprehensive"),
});

// Deep analyses select types
export type DeepAnalysis = typeof deepAnalyses.$inferSelect;
export type InsertDeepAnalysis = z.infer<typeof insertDeepAnalysisSchema>;

// Deep analysis metrics insert schema
export const insertDeepAnalysisMetricsSchema = createInsertSchema(deepAnalysisMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  analysisId: z.string().uuid("يجب أن يكون معرف التحليل صالح"),
});

// Deep analysis metrics select types
export type DeepAnalysisMetrics = typeof deepAnalysisMetrics.$inferSelect;
export type InsertDeepAnalysisMetrics = z.infer<typeof insertDeepAnalysisMetricsSchema>;

// Deep analysis events insert schema
export const insertDeepAnalysisEventSchema = createInsertSchema(deepAnalysisEvents).omit({
  id: true,
  occurredAt: true,
}).extend({
  analysisId: z.string().uuid("يجب أن يكون معرف التحليل صالح"),
  userId: z.string().uuid("يجب أن يكون معرف المستخدم صالح").optional(),
  eventType: z.enum(["view", "share", "download", "export_pdf", "export_docx"], {
    errorMap: () => ({ message: "نوع الحدث غير صالح" }),
  }),
});

// Deep analysis events select types
export type DeepAnalysisEvent = typeof deepAnalysisEvents.$inferSelect;
export type InsertDeepAnalysisEvent = z.infer<typeof insertDeepAnalysisEventSchema>;

// ============================================
// TASK MANAGEMENT SYSTEM
// ============================================

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo").notNull(), // todo, in_progress, review, completed, archived
  priority: text("priority").default("medium").notNull(), // low, medium, high, critical
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  
  // Assignment
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  parentTaskId: varchar("parent_task_id"),
  
  // Categorization
  department: text("department"), // تحرير، تقنية، سوشيال، فيديو
  category: text("category"), // Custom tags/categories
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  
  // AI-powered fields
  aiSuggestions: jsonb("ai_suggestions").$type<{
    suggestedAssignee?: string;
    suggestedDuration?: number; // in minutes
    suggestedSubtasks?: string[];
    confidenceScore?: number;
  }>(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  
  // Progress tracking
  progress: integer("progress").default(0).notNull(), // 0-100
  
  // Metadata
  attachmentsCount: integer("attachments_count").default(0).notNull(),
  subtasksCount: integer("subtasks_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("tasks_status_idx").on(table.status),
  index("tasks_priority_idx").on(table.priority),
  index("tasks_assigned_to_idx").on(table.assignedToId),
  index("tasks_created_by_idx").on(table.createdById),
  index("tasks_due_date_idx").on(table.dueDate),
  index("tasks_parent_task_idx").on(table.parentTaskId),
]);

// Subtasks table
export const subtasks = pgTable("subtasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  completedById: varchar("completed_by_id").references(() => users.id),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("subtasks_task_idx").on(table.taskId),
]);

// Task comments table
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("task_comments_task_idx").on(table.taskId),
  index("task_comments_user_idx").on(table.userId),
]);

// Task attachments table
export const taskAttachments = pgTable("task_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // in bytes
  fileType: text("file_type"), // image, document, video, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("task_attachments_task_idx").on(table.taskId),
]);

// Task activity log table
export const taskActivityLog = pgTable("task_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // created, updated, status_changed, assigned, commented, etc.
  changes: jsonb("changes").$type<{
    field?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("task_activity_task_idx").on(table.taskId),
  index("task_activity_user_idx").on(table.userId),
]);

// Task relations
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "tasksCreated",
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "tasksAssigned",
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "taskHierarchy",
  }),
  childTasks: many(tasks, {
    relationName: "taskHierarchy",
  }),
  subtasks: many(subtasks),
  comments: many(taskComments),
  attachments: many(taskAttachments),
  activityLog: many(taskActivityLog),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
  completedBy: one(users, {
    fields: [subtasks.completedById],
    references: [users.id],
  }),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAttachments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAttachments.userId],
    references: [users.id],
  }),
}));

export const taskActivityLogRelations = relations(taskActivityLog, ({ one }) => ({
  task: one(tasks, {
    fields: [taskActivityLog.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskActivityLog.userId],
    references: [users.id],
  }),
}));

// Task insert schemas
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  attachmentsCount: true,
  subtasksCount: true,
  commentsCount: true,
  completedAt: true,
  actualDuration: true,
  progress: true,
}).extend({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "completed", "archived"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  createdById: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
  parentTaskId: z.string().optional(),
  department: z.string().optional(),
  category: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  estimatedDuration: z.number().int().positive().optional(),
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  completedById: true,
  displayOrder: true,
}).extend({
  taskId: z.string().uuid("معرف المهمة غير صالح"),
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  taskId: z.string().uuid("معرف المهمة غير صالح"),
  userId: z.string().uuid("معرف المستخدم غير صالح"),
  content: z.string().min(1, "التعليق مطلوب"),
});

export const insertTaskAttachmentSchema = createInsertSchema(taskAttachments).omit({
  id: true,
  createdAt: true,
}).extend({
  taskId: z.string().uuid("معرف المهمة غير صالح"),
  userId: z.string().uuid("معرف المستخدم غير صالح"),
  fileName: z.string().min(1, "اسم الملف مطلوب"),
  fileUrl: z.string().url("رابط الملف غير صالح"),
  fileSize: z.number().int().positive().optional(),
  fileType: z.string().optional(),
});

// Task select types
export type Task = typeof tasks.$inferSelect & {
  subtasksCount?: number;
};
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = z.infer<typeof insertTaskAttachmentSchema>;
export type TaskActivityLogEntry = typeof taskActivityLog.$inferSelect;

// ============================================
// EMAIL AGENT SYSTEM
// ============================================

// Trusted senders for email-to-publish automation
export const trustedEmailSenders = pgTable("trusted_email_senders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  
  // Reporter assignment - link to actual reporter user in database
  reporterUserId: varchar("reporter_user_id").references(() => users.id),
  
  token: text("token").notNull().unique(), // Secret token for additional verification
  status: text("status").default("active").notNull(), // active, suspended, revoked
  
  // Auto-publish settings
  autoPublish: boolean("auto_publish").default(true).notNull(), // true = auto-publish, false = save as draft
  defaultCategory: varchar("default_category").references(() => categories.id),
  
  // Language support
  language: text("language").default("ar").notNull(), // ar, en, ur
  
  // Security settings
  requireTokenInSubject: boolean("require_token_in_subject").default(true).notNull(),
  requireTokenInBody: boolean("require_token_in_body").default(false).notNull(),
  ipWhitelist: text("ip_whitelist").array(), // Optional IP restrictions
  
  // Stats
  totalEmailsReceived: integer("total_emails_received").default(0).notNull(),
  totalArticlesPublished: integer("total_articles_published").default(0).notNull(),
  totalArticlesDrafted: integer("total_articles_drafted").default(0).notNull(),
  totalEmailsRejected: integer("total_emails_rejected").default(0).notNull(),
  lastEmailAt: timestamp("last_email_at"),
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email webhook logs (all incoming emails)
export const emailWebhookLogs = pgTable("email_webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Email details
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  subject: text("subject").notNull(),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  
  // Attachments info
  attachmentsCount: integer("attachments_count").default(0).notNull(),
  attachmentsData: jsonb("attachments_data").$type<Array<{
    filename: string;
    contentType: string;
    size: number;
    url?: string; // Uploaded to storage
  }>>(),
  
  // Processing status
  status: text("status").default("received").notNull(), // received, processing, published, drafted, rejected, failed
  processingError: text("processing_error"),
  rejectionReason: text("rejection_reason"), // Why email was rejected
  
  // Security verification
  senderVerified: boolean("sender_verified").default(false).notNull(),
  tokenVerified: boolean("token_verified").default(false).notNull(),
  trustedSenderId: varchar("trusted_sender_id").references(() => trustedEmailSenders.id, { onDelete: "set null" }),
  
  // AI Analysis results
  aiAnalysis: jsonb("ai_analysis").$type<{
    contentQuality?: number; // 0-100
    languageDetected?: string;
    categoryPredicted?: string;
    isNewsWorthy?: boolean;
    suggestedTitle?: string;
    suggestedSummary?: string;
    errors?: string[];
    warnings?: string[];
  }>(),
  
  // Result
  articleId: varchar("article_id").references(() => articles.id),
  publishedAt: timestamp("published_at"),
  
  // Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// Email agent statistics and reports
export const emailAgentStats = pgTable("email_agent_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(), // Daily stats
  
  // Counts
  emailsReceived: integer("emails_received").default(0).notNull(),
  emailsPublished: integer("emails_published").default(0).notNull(),
  emailsDrafted: integer("emails_drafted").default(0).notNull(),
  emailsRejected: integer("emails_rejected").default(0).notNull(),
  emailsFailed: integer("emails_failed").default(0).notNull(),
  
  // Processing metrics
  avgProcessingTime: integer("avg_processing_time"), // milliseconds
  avgContentQuality: real("avg_content_quality"), // 0-100
  
  // By language
  arabicCount: integer("arabic_count").default(0).notNull(),
  englishCount: integer("english_count").default(0).notNull(),
  urduCount: integer("urdu_count").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("email_agent_stats_date_idx").on(table.date),
]);

// Relations
export const trustedEmailSendersRelations = relations(trustedEmailSenders, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [trustedEmailSenders.createdBy],
    references: [users.id],
  }),
  reporterUser: one(users, {
    fields: [trustedEmailSenders.reporterUserId],
    references: [users.id],
  }),
  webhookLogs: many(emailWebhookLogs),
  category: one(categories, {
    fields: [trustedEmailSenders.defaultCategory],
    references: [categories.id],
  }),
}));

export const emailWebhookLogsRelations = relations(emailWebhookLogs, ({ one }) => ({
  trustedSender: one(trustedEmailSenders, {
    fields: [emailWebhookLogs.trustedSenderId],
    references: [trustedEmailSenders.id],
  }),
  article: one(articles, {
    fields: [emailWebhookLogs.articleId],
    references: [articles.id],
  }),
}));

// Insert schemas
export const insertTrustedEmailSenderSchema = createInsertSchema(trustedEmailSenders).omit({
  id: true,
  totalEmailsReceived: true,
  totalArticlesPublished: true,
  totalArticlesDrafted: true,
  totalEmailsRejected: true,
  lastEmailAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  token: z.string().min(16, "الرمز السري يجب أن يكون 16 حرف على الأقل"),
  language: z.enum(["ar", "en", "ur"]).default("ar"),
  status: z.enum(["active", "suspended", "revoked"]).default("active"),
});

export const insertEmailWebhookLogSchema = createInsertSchema(emailWebhookLogs).omit({
  id: true,
  receivedAt: true,
  processedAt: true,
});

// Select types
export type TrustedEmailSender = typeof trustedEmailSenders.$inferSelect;
export type InsertTrustedEmailSender = z.infer<typeof insertTrustedEmailSenderSchema>;
export type EmailWebhookLog = typeof emailWebhookLogs.$inferSelect;
export type InsertEmailWebhookLog = z.infer<typeof insertEmailWebhookLogSchema>;
export type EmailAgentStats = typeof emailAgentStats.$inferSelect;

// ============================================
// WHATSAPP INTEGRATION
// ============================================

// WhatsApp Tokens - for secure WhatsApp webhook integration
export const whatsappTokens = pgTable("whatsapp_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text("token").notNull().unique(),
  label: text("label"),
  phoneNumber: text("phone_number").notNull(),
  autoPublish: boolean("auto_publish").default(false).notNull(),
  allowedLanguages: text("allowed_languages").array().default(sql`ARRAY['ar']::text[]`).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("whatsapp_tokens_user_id_idx").on(table.userId),
  index("whatsapp_tokens_phone_number_idx").on(table.phoneNumber),
]);

// WhatsApp Webhook Logs - track all incoming WhatsApp messages
export const whatsappWebhookLogs = pgTable("whatsapp_webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  from: text("from").notNull(),
  message: text("message"),
  mediaUrls: text("media_urls").array(),
  token: text("token"),
  tokenId: varchar("token_id").references(() => whatsappTokens.id),
  userId: varchar("user_id").references(() => users.id),
  articleId: varchar("article_id").references(() => articles.id),
  articleLink: text("article_link"),
  publishStatus: text("publish_status"), // 'published', 'draft', null for rejected/failed
  status: text("status").notNull(), // received, processed, rejected, error
  reason: text("reason"),
  qualityScore: integer("quality_score"),
  aiAnalysis: jsonb("ai_analysis").$type<{
    detectedLanguage?: string;
    detectedCategory?: string;
    hasNewsValue?: boolean;
    issues?: string[];
  }>(),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("whatsapp_webhook_logs_user_id_idx").on(table.userId),
  index("whatsapp_webhook_logs_token_id_idx").on(table.tokenId),
  index("whatsapp_webhook_logs_created_at_idx").on(table.createdAt),
  index("whatsapp_webhook_logs_status_idx").on(table.status),
]);

// Relations
export const whatsappTokensRelations = relations(whatsappTokens, ({ one, many }) => ({
  user: one(users, {
    fields: [whatsappTokens.userId],
    references: [users.id],
  }),
  webhookLogs: many(whatsappWebhookLogs),
}));

export const whatsappWebhookLogsRelations = relations(whatsappWebhookLogs, ({ one }) => ({
  user: one(users, {
    fields: [whatsappWebhookLogs.userId],
    references: [users.id],
  }),
  whatsappToken: one(whatsappTokens, {
    fields: [whatsappWebhookLogs.tokenId],
    references: [whatsappTokens.id],
  }),
  article: one(articles, {
    fields: [whatsappWebhookLogs.articleId],
    references: [articles.id],
  }),
}));

// Insert schemas
export const insertWhatsappTokenSchema = createInsertSchema(whatsappTokens).omit({
  id: true,
  usageCount: true,
  lastUsedAt: true,
  createdAt: true,
});

export const insertWhatsappWebhookLogSchema = createInsertSchema(whatsappWebhookLogs).omit({
  id: true,
  createdAt: true,
});

// Select types
export type WhatsappToken = typeof whatsappTokens.$inferSelect;
export type InsertWhatsappToken = z.infer<typeof insertWhatsappTokenSchema>;
export type WhatsappWebhookLog = typeof whatsappWebhookLogs.$inferSelect;
export type InsertWhatsappWebhookLog = z.infer<typeof insertWhatsappWebhookLogSchema>;

// ============================================
// ACCESSIBILITY TELEMETRY
// ============================================

export const accessibilityEvents = pgTable("accessibility_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // nullable - allow anonymous tracking
  sessionId: text("session_id").notNull(), // track anonymous sessions
  eventType: text("event_type").notNull(), // fontSize, highContrast, reduceMotion, readingMode, voiceCommand, skipLink, etc.
  eventAction: text("event_action").notNull(), // enabled, disabled, changed, clicked, activated, etc.
  eventValue: text("event_value"), // the actual value: 'large', 'true', 'home command', etc.
  language: text("language").notNull(), // ar, en, ur
  pageUrl: text("page_url"), // current page when event occurred
  metadata: jsonb("metadata"), // additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("accessibility_events_user_id_idx").on(table.userId),
  index("accessibility_events_event_type_idx").on(table.eventType),
  index("accessibility_events_created_at_idx").on(table.createdAt),
  index("accessibility_events_language_idx").on(table.language),
]);

// Relations
export const accessibilityEventsRelations = relations(accessibilityEvents, ({ one }) => ({
  user: one(users, {
    fields: [accessibilityEvents.userId],
    references: [users.id],
  }),
}));

// Insert schema
export const insertAccessibilityEventSchema = createInsertSchema(accessibilityEvents).omit({
  id: true,
  createdAt: true,
});

// Select types
export type AccessibilityEvent = typeof accessibilityEvents.$inferSelect;
export type InsertAccessibilityEvent = z.infer<typeof insertAccessibilityEventSchema>;

// ============================================
// NEWSLETTER SUBSCRIPTIONS - اشتراكات النشرة البريدية
// ============================================

export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  status: text("status").default("active").notNull(), // active, unsubscribed, bounced
  language: text("language").default("ar"), // ar, en, ur - preferred language
  userId: varchar("user_id").references(() => users.id), // optional - if user is logged in
  
  // Subscription preferences
  preferences: jsonb("preferences").$type<{
    frequency?: "daily" | "weekly" | "monthly";
    categories?: string[]; // interested categories
    articleTypes?: string[]; // news, analysis, opinion
  }>(),
  
  // Tracking
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  source: text("source"), // website-footer, popup, article-page, etc.
  
  // Verification
  verifiedAt: timestamp("verified_at"),
  verificationToken: text("verification_token"),
  
  // Unsubscribe
  unsubscribedAt: timestamp("unsubscribed_at"),
  unsubscribeReason: text("unsubscribe_reason"),
  
  // Metadata
  metadata: jsonb("metadata"), // additional data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("newsletter_subscriptions_email_idx").on(table.email),
  index("newsletter_subscriptions_status_idx").on(table.status),
  index("newsletter_subscriptions_user_id_idx").on(table.userId),
  index("newsletter_subscriptions_created_at_idx").on(table.createdAt),
]);

// Relations
export const newsletterSubscriptionsRelations = relations(newsletterSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [newsletterSubscriptions.userId],
    references: [users.id],
  }),
}));

// Insert schema
export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select types
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;

// ============================================
// ARTICLE MEDIA ASSETS - تعريفات الصور في المقالات
// ============================================

export const articleMediaAssets = pgTable("article_media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  mediaFileId: varchar("media_file_id").references(() => mediaFiles.id, { onDelete: "cascade" }).notNull(),
  
  // Language-specific content
  locale: text("locale").default("ar").notNull(), // ar, en, ur
  
  // Display order for multiple images in article
  displayOrder: integer("display_order").default(0).notNull(),
  
  // SEO-optimized alt text (concise for screen readers)
  altText: text("alt_text").notNull(),
  
  // Rich caption (can include HTML formatting)
  captionHtml: text("caption_html"),
  
  // Plain text caption (fallback)
  captionPlain: text("caption_plain"),
  
  // Keywords for SEO
  keywordTags: text("keyword_tags").array().default(sql`ARRAY[]::text[]`),
  
  // Related articles (internal linking)
  relatedArticleSlugs: text("related_article_slugs").array().default(sql`ARRAY[]::text[]`),
  
  // Source attribution
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  rightsStatement: text("rights_statement"),
  
  // AI-generated metadata
  aiGeneratedSummary: jsonb("ai_generated_summary").$type<{
    provider?: "openai" | "anthropic" | "gemini";
    model?: string;
    generatedAt?: string;
    summary?: string;
    suggestedKeywords?: string[];
  }>(),
  
  // Moderation
  moderationStatus: text("moderation_status").default("approved").notNull(), // approved, pending, rejected
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("article_media_assets_article_id_idx").on(table.articleId),
  index("article_media_assets_media_file_id_idx").on(table.mediaFileId),
  index("article_media_assets_locale_idx").on(table.locale),
  index("article_media_assets_display_order_idx").on(table.displayOrder),
  // Unique constraint: one caption per article+media+locale combination
  uniqueIndex("article_media_assets_unique_idx").on(table.articleId, table.mediaFileId, table.locale),
]);

// Relations
export const articleMediaAssetsRelations = relations(articleMediaAssets, ({ one }) => ({
  article: one(articles, {
    fields: [articleMediaAssets.articleId],
    references: [articles.id],
  }),
  mediaFile: one(mediaFiles, {
    fields: [articleMediaAssets.mediaFileId],
    references: [mediaFiles.id],
  }),
  moderator: one(users, {
    fields: [articleMediaAssets.moderatedBy],
    references: [users.id],
  }),
}));

// Insert schema
export const insertArticleMediaAssetSchema = createInsertSchema(articleMediaAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  articleId: z.string().min(1, "Article ID is required"),
  mediaFileId: z.string().min(1, "Media File ID is required"),
  locale: z.enum(["ar", "en", "ur"]),
  altText: z.string().min(1, "Alt text is required for accessibility").max(125, "Alt text should be concise (max 125 chars)"),
  captionHtml: z.string().optional(),
  captionPlain: z.string().max(500, "Caption should be concise (max 500 chars)").optional(),
  keywordTags: z.array(z.string()).optional(),
  relatedArticleSlugs: z.array(z.string()).optional(),
});

// Update schema
export const updateArticleMediaAssetSchema = z.object({
  altText: z.string().min(1).max(125).optional(),
  captionHtml: z.string().optional(),
  captionPlain: z.string().max(500).optional(),
  keywordTags: z.array(z.string()).optional(),
  relatedArticleSlugs: z.array(z.string()).optional(),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  rightsStatement: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  moderationStatus: z.enum(["approved", "pending", "rejected"]).optional(),
  moderationNotes: z.string().optional(),
});

// Select types
export type ArticleMediaAsset = typeof articleMediaAssets.$inferSelect;
export type InsertArticleMediaAsset = z.infer<typeof insertArticleMediaAssetSchema>;
export type UpdateArticleMediaAsset = z.infer<typeof updateArticleMediaAssetSchema>;

// ============================================
// PUBLISHERS / CONTENT SALES
// ============================================

export const publishers = pgTable("publishers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Agency/Publisher details
  agencyName: text("agency_name").notNull(),
  agencyNameEn: text("agency_name_en"),
  contactPerson: text("contact_person").notNull(),
  contactPersonEn: text("contact_person_en"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email").notNull(),
  logoUrl: text("logo_url"), // Publisher/Agency logo
  
  // Business info
  commercialRegistration: text("commercial_registration"),
  taxNumber: text("tax_number"),
  address: text("address"),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  suspendedUntil: timestamp("suspended_until"),
  suspensionReason: text("suspension_reason"),
  
  // Metadata
  notes: text("notes"), // Internal admin notes
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("publishers_user_id_idx").on(table.userId),
  index("publishers_is_active_idx").on(table.isActive),
]);

export const publisherCredits = pgTable("publisher_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").references(() => publishers.id, { onDelete: "cascade" }).notNull(),
  
  // Package details
  packageName: text("package_name").notNull(), // e.g., "باقة 20 خبر", "Package 50 news"
  totalCredits: integer("total_credits").notNull(), // Total number of articles in package
  usedCredits: integer("used_credits").default(0).notNull(), // Number of published articles
  remainingCredits: integer("remaining_credits").notNull(), // Remaining articles
  
  // Package period
  period: text("period").notNull(), // monthly, quarterly, yearly, one-time
  startDate: timestamp("start_date").notNull(),
  expiryDate: timestamp("expiry_date"), // null for one-time packages
  
  // Pricing (optional - for invoicing)
  price: real("price"),
  currency: text("currency").default("SAR"),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Metadata
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("publisher_credits_publisher_id_idx").on(table.publisherId),
  index("publisher_credits_is_active_idx").on(table.isActive),
  index("publisher_credits_expiry_date_idx").on(table.expiryDate),
]);

export const publisherCreditLogs = pgTable("publisher_credit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: varchar("publisher_id").references(() => publishers.id, { onDelete: "cascade" }).notNull(),
  creditPackageId: varchar("credit_package_id").references(() => publisherCredits.id, { onDelete: "cascade" }).notNull(),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "set null" }),
  
  // Action type
  actionType: text("action_type").notNull(), // credit_added, credit_used, credit_refunded, package_expired
  
  // Details
  creditsBefore: integer("credits_before").notNull(),
  creditsChanged: integer("credits_changed").notNull(), // +/- amount
  creditsAfter: integer("credits_after").notNull(),
  
  // Who performed the action
  performedBy: varchar("performed_by").references(() => users.id),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("publisher_credit_logs_publisher_id_idx").on(table.publisherId),
  index("publisher_credit_logs_article_id_idx").on(table.articleId),
  index("publisher_credit_logs_created_at_idx").on(table.createdAt.desc()),
]);

// Relations
export const publishersRelations = relations(publishers, ({ one, many }) => ({
  user: one(users, {
    fields: [publishers.userId],
    references: [users.id],
  }),
  creditPackages: many(publisherCredits),
  creditLogs: many(publisherCreditLogs),
}));

export const publisherCreditsRelations = relations(publisherCredits, ({ one, many }) => ({
  publisher: one(publishers, {
    fields: [publisherCredits.publisherId],
    references: [publishers.id],
  }),
  logs: many(publisherCreditLogs),
}));

export const publisherCreditLogsRelations = relations(publisherCreditLogs, ({ one }) => ({
  publisher: one(publishers, {
    fields: [publisherCreditLogs.publisherId],
    references: [publishers.id],
  }),
  creditPackage: one(publisherCredits, {
    fields: [publisherCreditLogs.creditPackageId],
    references: [publisherCredits.id],
  }),
  article: one(articles, {
    fields: [publisherCreditLogs.articleId],
    references: [articles.id],
  }),
  performedBy: one(users, {
    fields: [publisherCreditLogs.performedBy],
    references: [users.id],
  }),
}));

// Insert/Update Schemas
export const insertPublisherSchema = createInsertSchema(publishers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePublisherSchema = z.object({
  agencyName: z.string().min(2).optional(),
  agencyNameEn: z.string().min(2).optional(),
  contactPerson: z.string().min(2).optional(),
  contactPersonEn: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().nullable().optional(),
  commercialRegistration: z.string().optional(),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
  suspendedUntil: z.string().optional(),
  suspensionReason: z.string().optional(),
  notes: z.string().optional(),
});

export const insertPublisherCreditSchema = createInsertSchema(publisherCredits).omit({
  id: true,
  usedCredits: true,
  remainingCredits: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalCredits: z.number().int().min(1, "يجب أن يكون عدد الأخبار 1 على الأقل"),
  period: z.enum(["monthly", "quarterly", "yearly", "one-time"]),
  startDate: z.coerce.date({ message: "تاريخ البداية مطلوب" }),
  expiryDate: z.coerce.date({ message: "تاريخ النهاية غير صحيح" }).optional().nullable(),
});

export const insertPublisherCreditLogSchema = createInsertSchema(publisherCreditLogs).omit({
  id: true,
  createdAt: true,
});

// Select types
export type Publisher = typeof publishers.$inferSelect;
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type UpdatePublisher = z.infer<typeof updatePublisherSchema>;

export type PublisherCredit = typeof publisherCredits.$inferSelect;
export type InsertPublisherCredit = z.infer<typeof insertPublisherCreditSchema>;

export type PublisherCreditLog = typeof publisherCreditLogs.$inferSelect;
export type InsertPublisherCreditLog = z.infer<typeof insertPublisherCreditLogSchema>;

// ============================================
// IFOX SECTION - قسم آي فوكس
// ============================================

// إعدادات قسم آي فوكس
export const ifoxSettings = pgTable("ifox_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // مفتاح الإعداد
  value: jsonb("value").notNull(), // قيمة الإعداد (يمكن أن تكون أي نوع من البيانات)
  description: text("description"), // وصف الإعداد
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // آخر تحديث
  updatedBy: varchar("updated_by").references(() => users.id), // المستخدم الذي قام بالتحديث
});

// مكتبة الوسائط الخاصة بآي فوكس
export const ifoxMedia = pgTable("ifox_media", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // نوع الملف: image, video, audio, document
  fileName: varchar("file_name", { length: 255 }).notNull(), // اسم الملف
  fileUrl: text("file_url").notNull(), // رابط الملف
  fileSize: integer("file_size"), // حجم الملف بالبايت
  mimeType: varchar("mime_type", { length: 100 }), // نوع MIME للملف
  metadata: jsonb("metadata"), // بيانات إضافية: الأبعاد، المدة، الخ
  categorySlug: varchar("category_slug", { length: 100 }), // تصنيف الملف: ai-news, ai-voice, etc
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(), // تاريخ الرفع
  uploadedBy: varchar("uploaded_by").references(() => users.id), // المستخدم الذي رفع الملف
}, (table) => [
  // فهرس على التصنيف للبحث السريع
  index("ifox_media_category_slug_idx").on(table.categorySlug),
  index("ifox_media_type_idx").on(table.type),
  index("ifox_media_uploaded_at_idx").on(table.uploadedAt.desc()),
]);

// تحليلات قسم آي فوكس
export const ifoxAnalytics = pgTable("ifox_analytics", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // التاريخ
  categorySlug: varchar("category_slug", { length: 100 }).notNull(), // تصنيف البيانات
  metric: varchar("metric", { length: 50 }).notNull(), // نوع المقياس: views, engagement, shares, etc
  value: integer("value").notNull().default(0), // قيمة المقياس
  metadata: jsonb("metadata"), // بيانات إضافية للسياق
  createdAt: timestamp("created_at").defaultNow().notNull(), // تاريخ الإنشاء
}, (table) => [
  // فهارس للأداء
  index("ifox_analytics_date_idx").on(table.date.desc()),
  index("ifox_analytics_category_slug_idx").on(table.categorySlug),
  index("ifox_analytics_metric_idx").on(table.metric),
  // فهرس مركب للاستعلامات الشائعة
  index("ifox_analytics_date_category_metric_idx").on(table.date, table.categorySlug, table.metric),
]);

// جدولة نشر المحتوى
export const ifoxSchedule = pgTable("ifox_schedule", {
  id: serial("id").primaryKey(),
  articleId: varchar("article_id").references(() => articles.id).notNull(), // المقال المجدول
  scheduledAt: timestamp("scheduled_at").notNull(), // وقت النشر المجدول
  status: varchar("status", { length: 20 }).notNull().default("pending"), // الحالة: pending, published, failed
  publishSettings: jsonb("publish_settings"), // إعدادات النشر: social media, notifications, etc
  createdAt: timestamp("created_at").defaultNow().notNull(), // تاريخ إنشاء الجدولة
  createdBy: varchar("created_by").references(() => users.id), // المستخدم الذي أنشأ الجدولة
}, (table) => [
  // فهارس للأداء
  index("ifox_schedule_scheduled_at_idx").on(table.scheduledAt),
  index("ifox_schedule_status_idx").on(table.status),
  index("ifox_schedule_article_id_idx").on(table.articleId),
]);

// إعدادات خاصة بكل تصنيف
export const ifoxCategorySettings = pgTable("ifox_category_settings", {
  id: serial("id").primaryKey(),
  categorySlug: varchar("category_slug", { length: 100 }).notNull().unique(), // معرف التصنيف
  layoutConfig: jsonb("layout_config"), // إعدادات التخطيط المخصصة
  featureFlags: jsonb("feature_flags"), // الميزات المفعلة لكل تصنيف
  customFields: jsonb("custom_fields"), // حقول مخصصة خاصة بالتصنيف
  displayOrder: integer("display_order").notNull().default(0), // ترتيب العرض
  isActive: boolean("is_active").notNull().default(true), // هل التصنيف نشط
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // آخر تحديث
}, (table) => [
  // فهرس على التصنيف للبحث السريع
  index("ifox_category_settings_slug_idx").on(table.categorySlug),
  index("ifox_category_settings_active_idx").on(table.isActive),
  index("ifox_category_settings_display_order_idx").on(table.displayOrder),
]);

// Relations for iFox tables
export const ifoxSettingsRelations = relations(ifoxSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [ifoxSettings.updatedBy],
    references: [users.id],
  }),
}));

export const ifoxMediaRelations = relations(ifoxMedia, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [ifoxMedia.uploadedBy],
    references: [users.id],
  }),
}));

export const ifoxScheduleRelations = relations(ifoxSchedule, ({ one }) => ({
  article: one(articles, {
    fields: [ifoxSchedule.articleId],
    references: [articles.id],
  }),
  createdByUser: one(users, {
    fields: [ifoxSchedule.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas for iFox tables
export const insertIfoxSettingsSchema = createInsertSchema(ifoxSettings).omit({
  id: true,
  updatedAt: true,
}).extend({
  key: z.string().min(1, "المفتاح مطلوب").max(100, "المفتاح طويل جداً"),
  value: z.any(), // jsonb can be any valid JSON
  description: z.string().optional(),
});

export const insertIfoxMediaSchema = createInsertSchema(ifoxMedia).omit({
  id: true,
  uploadedAt: true,
}).extend({
  type: z.enum(["image", "video", "audio", "document"]),
  fileName: z.string().min(1, "اسم الملف مطلوب").max(255, "اسم الملف طويل جداً"),
  fileUrl: z.string().url("رابط الملف غير صحيح"),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
  metadata: z.any().optional(), // jsonb
  categorySlug: z.string().max(100).optional(),
});

export const insertIfoxAnalyticsSchema = createInsertSchema(ifoxAnalytics).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date({ message: "التاريخ مطلوب" }),
  categorySlug: z.string().min(1, "التصنيف مطلوب").max(100),
  metric: z.string().min(1, "المقياس مطلوب").max(50),
  value: z.number().int().min(0, "القيمة يجب أن تكون صفر أو أكثر"),
  metadata: z.any().optional(), // jsonb
});

export const insertIfoxScheduleSchema = createInsertSchema(ifoxSchedule).omit({
  id: true,
  createdAt: true,
}).extend({
  articleId: z.string().min(1, "معرف المقال مطلوب"),
  scheduledAt: z.coerce.date({ message: "وقت الجدولة مطلوب" }),
  status: z.enum(["pending", "published", "failed"]).default("pending"),
  publishSettings: z.any().optional(), // jsonb
});

export const insertIfoxCategorySettingsSchema = createInsertSchema(ifoxCategorySettings).omit({
  id: true,
  updatedAt: true,
}).extend({
  categorySlug: z.string().min(1, "معرف التصنيف مطلوب").max(100),
  layoutConfig: z.any().optional(), // jsonb
  featureFlags: z.any().optional(), // jsonb
  customFields: z.any().optional(), // jsonb
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Select types for iFox tables
export type IfoxSettings = typeof ifoxSettings.$inferSelect;
export type InsertIfoxSettings = z.infer<typeof insertIfoxSettingsSchema>;

export type IfoxMedia = typeof ifoxMedia.$inferSelect;
export type InsertIfoxMedia = z.infer<typeof insertIfoxMediaSchema>;

export type IfoxAnalytics = typeof ifoxAnalytics.$inferSelect;
export type InsertIfoxAnalytics = z.infer<typeof insertIfoxAnalyticsSchema>;

export type IfoxSchedule = typeof ifoxSchedule.$inferSelect;
export type InsertIfoxSchedule = z.infer<typeof insertIfoxScheduleSchema>;

export type IfoxCategorySettings = typeof ifoxCategorySettings.$inferSelect;
export type InsertIfoxCategorySettings = z.infer<typeof insertIfoxCategorySettingsSchema>;

// ============================================
// AI IMAGE GENERATIONS (NANO BANANA PRO)
// ============================================

export const aiImageGenerations = pgTable("ai_image_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  articleId: varchar("article_id").references(() => articles.id), // Optional: link to article
  
  // Prompt & generation details
  prompt: text("prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  model: varchar("model", { length: 100 }).notNull().default("gemini-3-pro-image-preview"), // Nano Banana Pro
  
  // Image configuration
  aspectRatio: varchar("aspect_ratio", { length: 20 }).default("16:9"), // 16:9, 1:1, 4:3, 9:16, 21:9
  imageSize: varchar("image_size", { length: 10 }).default("2K"), // 1K, 2K, 4K
  numImages: integer("num_images").default(1), // Max 4
  
  // Generation metadata
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, processing, completed, failed
  imageUrl: text("image_url"), // GCS URL of generated image
  thumbnailUrl: text("thumbnail_url"), // Smaller preview
  
  // Advanced features
  referenceImages: jsonb("reference_images"), // Array of reference image URLs (max 14)
  enableSearchGrounding: boolean("enable_search_grounding").default(false), // Use Google Search for facts
  enableThinking: boolean("enable_thinking").default(true), // Use reasoning process
  
  // Brand customization
  brandingConfig: jsonb("branding_config"), // Logo, colors, watermark settings
  
  // Result metadata
  generationTime: integer("generation_time"), // Time in seconds
  cost: real("cost"), // Cost in USD
  metadata: jsonb("metadata"), // Raw response, thinking process, etc.
  
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ai_image_gen_user_idx").on(table.userId),
  index("ai_image_gen_article_idx").on(table.articleId),
  index("ai_image_gen_status_idx").on(table.status),
  index("ai_image_gen_created_idx").on(table.createdAt),
]);

// Relations
export const aiImageGenerationsRelations = relations(aiImageGenerations, ({ one }) => ({
  user: one(users, {
    fields: [aiImageGenerations.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [aiImageGenerations.articleId],
    references: [articles.id],
  }),
}));

// Insert schema
export const insertAiImageGenerationSchema = createInsertSchema(aiImageGenerations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  prompt: z.string().min(1, "البرومبت مطلوب").max(5000, "البرومبت طويل جداً"),
  negativePrompt: z.string().max(2000).optional(),
  model: z.string().default("gemini-3-pro-image-preview"),
  aspectRatio: z.enum(["1:1", "16:9", "4:3", "9:16", "21:9", "3:4"]).default("16:9"),
  imageSize: z.enum(["1K", "2K", "4K"]).default("2K"),
  numImages: z.number().int().min(1).max(4).default(1),
  articleId: z.string().optional(),
  referenceImages: z.array(z.string().url()).max(14).optional(),
  enableSearchGrounding: z.boolean().default(false),
  enableThinking: z.boolean().default(true),
  brandingConfig: z.object({
    logoUrl: z.string().url().optional(),
    watermarkText: z.string().max(100).optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }).optional(),
});

// Select types
export type AiImageGeneration = typeof aiImageGenerations.$inferSelect;
export type InsertAiImageGeneration = z.infer<typeof insertAiImageGenerationSchema>;

// ============================================
// VISUAL AI SYSTEM (Gemini 3 Pro Image Analysis & Generation)
// ============================================

// Image Analysis: Quality checks, content detection, Alt text generation
export const imageAnalysis = pgTable("image_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  articleId: varchar("article_id").references(() => articles.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Analysis results
  qualityScore: real("quality_score"), // 0-100 quality rating
  qualityMetrics: jsonb("quality_metrics"), // resolution, sharpness, lighting, composition
  contentDescription: jsonb("content_description"), // {ar: string, en: string, ur: string}
  detectedObjects: jsonb("detected_objects"), // Array of detected objects/people/places
  dominantColors: jsonb("dominant_colors"), // Array of hex colors
  tags: jsonb("tags"), // Auto-generated tags
  
  // Multilingual Alt Text (auto-generated)
  altTextAr: text("alt_text_ar"),
  altTextEn: text("alt_text_en"),
  altTextUr: text("alt_text_ur"),
  
  // Content warnings
  hasAdultContent: boolean("has_adult_content").default(false),
  hasSensitiveContent: boolean("has_sensitive_content").default(false),
  contentWarnings: jsonb("content_warnings"), // Array of warning types
  
  // Image-to-article matching
  relevanceScore: real("relevance_score"), // How well image matches article (0-100)
  matchingSuggestions: jsonb("matching_suggestions"), // Better image suggestions
  
  // Processing metadata
  model: varchar("model", { length: 100 }).default("gemini-3-pro-image-preview"),
  processingTime: integer("processing_time"), // milliseconds
  cost: real("cost"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, completed, failed
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("image_analysis_article_idx").on(table.articleId),
  index("image_analysis_user_idx").on(table.userId),
  index("image_analysis_status_idx").on(table.status),
]);

// Social Media Cards: Auto-generated cards for Twitter/Instagram/Facebook/WhatsApp
export const socialMediaCards = pgTable("social_media_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => articles.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Platform-specific variants
  platform: varchar("platform", { length: 50 }).notNull(), // twitter, instagram, facebook, whatsapp, all
  cardType: varchar("card_type", { length: 50 }).notNull(), // standard, story, post, status
  
  // Design configuration
  template: varchar("template", { length: 100 }).notNull(), // breaking_news, analysis, sports, etc.
  language: varchar("language", { length: 5 }).notNull(), // ar, en, ur
  
  // Generated content
  imageUrl: text("image_url").notNull(), // GCS URL
  thumbnailUrl: text("thumbnail_url"),
  dimensions: jsonb("dimensions"), // {width: number, height: number}
  
  // Card content
  headline: text("headline"),
  subheadline: text("subheadline"),
  categoryBadge: varchar("category_badge", { length: 100 }),
  brandElements: jsonb("brand_elements"), // logo, watermark, colors
  
  // Performance tracking
  downloadCount: integer("download_count").default(0),
  shareCount: integer("share_count").default(0),
  engagementScore: real("engagement_score"), // Based on usage
  
  // Generation metadata
  generationPrompt: text("generation_prompt"),
  model: varchar("model", { length: 100 }).default("gemini-3-pro-image-preview"),
  generationTime: integer("generation_time"),
  cost: real("cost"),
  status: varchar("status", { length: 50 }).default("pending"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("social_cards_article_idx").on(table.articleId),
  index("social_cards_platform_idx").on(table.platform),
  index("social_cards_status_idx").on(table.status),
]);

// Visual Recommendations: Smart suggestions for visual content
export const visualRecommendations = pgTable("visual_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => articles.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Recommendation type
  recommendationType: varchar("recommendation_type", { length: 100 }).notNull(), 
  // Types: add_infographic, add_image, improve_image_quality, add_social_cards, 
  // add_story_cards, change_layout, add_comparison_chart, add_timeline
  
  // Recommendation details
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  confidence: real("confidence"), // AI confidence score 0-100
  
  // Suggestion content
  title: jsonb("title"), // {ar: string, en: string, ur: string}
  description: jsonb("description"), // Detailed explanation in 3 languages
  reasoning: jsonb("reasoning"), // Why this recommendation
  
  // Actionable items
  suggestedTemplates: jsonb("suggested_templates"), // Array of template IDs
  suggestedPrompts: jsonb("suggested_prompts"), // Ready-to-use prompts
  estimatedImpact: jsonb("estimated_impact"), // {engagement: "+20%", readability: "+15%"}
  
  // Context analysis
  currentVisualScore: real("current_visual_score"), // Before applying recommendation
  projectedVisualScore: real("projected_visual_score"), // After applying
  categoryBenchmark: real("category_benchmark"), // Category average
  
  // User interaction
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, rejected, auto_applied
  appliedAt: timestamp("applied_at"),
  rejectedReason: text("rejected_reason"),
  
  // AI metadata
  model: varchar("model", { length: 100 }).default("gemini-3-pro-image-preview"),
  analysisData: jsonb("analysis_data"), // Raw AI analysis
  
  expiresAt: timestamp("expires_at"), // Recommendations expire after time
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("visual_rec_article_idx").on(table.articleId),
  index("visual_rec_type_idx").on(table.recommendationType),
  index("visual_rec_priority_idx").on(table.priority),
  index("visual_rec_status_idx").on(table.status),
]);

// Story Cards: Multi-slide visual stories for social media
export const storyCards = pgTable("story_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => articles.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Story configuration
  title: text("title").notNull(),
  language: varchar("language", { length: 5 }).notNull(), // ar, en, ur
  slideCount: integer("slide_count").notNull().default(5), // Number of slides (3-10)
  
  // Slides data
  slides: jsonb("slides").notNull(), // Array of slide objects
  // Each slide: {order: number, imageUrl: string, headline: string, content: string, template: string}
  
  // Visual theme
  template: varchar("template", { length: 100 }).notNull(), // news_story, analysis_thread, quick_facts
  colorScheme: varchar("color_scheme", { length: 50 }).default("brand"), // brand, dark, light, custom
  brandElements: jsonb("brand_elements"), // Logo placement, watermark
  
  // Export formats
  instagramStoryUrl: text("instagram_story_url"), // 9:16 format
  facebookStoryUrl: text("facebook_story_url"),
  whatsappStatusUrl: text("whatsapp_status_url"),
  twitterThreadImages: jsonb("twitter_thread_images"), // Array of URLs
  
  // Performance tracking
  viewCount: integer("view_count").default(0),
  completionRate: real("completion_rate"), // % who viewed all slides
  shareCount: integer("share_count").default(0),
  
  // Generation metadata
  generationPrompt: text("generation_prompt"),
  model: varchar("model", { length: 100 }).default("gemini-3-pro-image-preview"),
  totalGenerationTime: integer("total_generation_time"),
  totalCost: real("total_cost"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, processing, completed, failed
  
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("story_cards_article_idx").on(table.articleId),
  index("story_cards_status_idx").on(table.status),
  index("story_cards_published_idx").on(table.isPublished),
]);

// Relations for Visual AI tables
export const imageAnalysisRelations = relations(imageAnalysis, ({ one }) => ({
  article: one(articles, {
    fields: [imageAnalysis.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [imageAnalysis.userId],
    references: [users.id],
  }),
}));

export const socialMediaCardsRelations = relations(socialMediaCards, ({ one }) => ({
  article: one(articles, {
    fields: [socialMediaCards.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [socialMediaCards.userId],
    references: [users.id],
  }),
}));

export const visualRecommendationsRelations = relations(visualRecommendations, ({ one }) => ({
  article: one(articles, {
    fields: [visualRecommendations.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [visualRecommendations.userId],
    references: [users.id],
  }),
}));

export const storyCardsRelations = relations(storyCards, ({ one }) => ({
  article: one(articles, {
    fields: [storyCards.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [storyCards.userId],
    references: [users.id],
  }),
}));

// Insert schemas for Visual AI tables
export const insertImageAnalysisSchema = createInsertSchema(imageAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialMediaCardSchema = createInsertSchema(socialMediaCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  platform: z.enum(["twitter", "instagram", "facebook", "whatsapp", "all"]),
  cardType: z.enum(["standard", "story", "post", "status"]),
  language: z.enum(["ar", "en", "ur"]),
});

export const insertVisualRecommendationSchema = createInsertSchema(visualRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  recommendationType: z.enum([
    "add_infographic", "add_image", "improve_image_quality", "add_social_cards",
    "add_story_cards", "change_layout", "add_comparison_chart", "add_timeline"
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export const insertStoryCardSchema = createInsertSchema(storyCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(200),
  language: z.enum(["ar", "en", "ur"]),
  slideCount: z.number().int().min(3).max(10),
  slides: z.array(z.object({
    order: z.number().int(),
    imageUrl: z.string().url(),
    headline: z.string(),
    content: z.string(),
    template: z.string(),
  })),
});

// Select types for Visual AI tables
export type ImageAnalysis = typeof imageAnalysis.$inferSelect;
export type InsertImageAnalysis = z.infer<typeof insertImageAnalysisSchema>;

export type SocialMediaCard = typeof socialMediaCards.$inferSelect;
export type InsertSocialMediaCard = z.infer<typeof insertSocialMediaCardSchema>;

export type VisualRecommendation = typeof visualRecommendations.$inferSelect;
export type InsertVisualRecommendation = z.infer<typeof insertVisualRecommendationSchema>;

export type StoryCard = typeof storyCards.$inferSelect;
export type InsertStoryCard = z.infer<typeof insertStoryCardSchema>;

// ============================================
// HOMEPAGE STATISTICS
// ============================================

export interface HomepageStats {
  totalArticles: number;        // Count of all published articles
  todayArticles: number;         // Articles published in last 24h
  totalViews: number;            // Sum of all article views (lifetime)
  activeUsers: number;           // Users logged in last 7 days
}
