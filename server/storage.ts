// Reference: javascript_database blueprint + javascript_log_in_with_replit blueprint
import { db } from "./db";
import { eq, desc, asc, sql, and, or, not, inArray, ne, gte, lt, lte, isNull, isNotNull, ilike, count, getTableColumns } from "drizzle-orm";
import { alias as aliasedTable } from "drizzle-orm/pg-core";
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { notificationBus } from "./notificationBus";
import {
  users,
  categories,
  articles,
  rssFeeds,
  reactions,
  bookmarks,
  readingHistory,
  userPreferences,
  interests,
  userInterests,
  behaviorLogs,
  sentimentScores,
  systemSettings,
  themes,
  themeAuditLog,
  userLoyaltyEvents,
  userPointsTotal,
  loyaltyRewards,
  userRewardsHistory,
  loyaltyCampaigns,
  angles,
  articleAngles,
  sections,
  stories,
  storyLinks,
  storyFollows,
  storyNotifications,
  experiments,
  experimentVariants,
  experimentExposures,
  experimentConversions,
  mirqabEntries,
  mirqabSabqIndex,
  mirqabNextStory,
  mirqabRadarAlerts,
  mirqabAlgorithmArticles,
  smartBlocks,
  audioNewsletters,
  audioNewsletterArticles,
  audioNewsletterListens,
  internalAnnouncements,
  internalAnnouncementVersions,
  internalAnnouncementMetrics,
  staff,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  activityLogs,
  userEvents,
  enArticles,
  enCategories,
  enBookmarks,
  enReactions,
  enReadingHistory,
  urArticles,
  urCategories,
  urBookmarks,
  urReactions,
  urReadingHistory,
  urSmartBlocks,
  dismissedContinueReading,
  articleSeoHistory,
  dataStorySources,
  dataStoryAnalyses,
  dataStoryDrafts,
  shortLinks,
  shortLinkClicks,
  socialFollows,
  walletPasses,
  walletDevices,
  deepAnalyses,
  deepAnalysisMetrics,
  deepAnalysisEvents,
  notificationsInbox,
  articleMediaAssets,
  mediaFiles,
  type DeepAnalysis,
  type InsertDeepAnalysis,
  type NotificationInbox,
  type InsertNotificationInbox,
  type ArticleMediaAsset,
  type InsertArticleMediaAsset,
  type UpdateArticleMediaAsset,
  type MediaFile,
  type User,
  type InsertUser,
  type UpdateUser,
  type AdminCreateUser,
  type AdminUpdateUserRoles,
  type Category,
  type InsertCategory,
  type Article,
  type InsertArticle,
  type RssFeed,
  type InsertRssFeed,
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
  type Angle,
  type InsertAngle,
  topics,
  type Topic,
  type InsertTopic,
  type UpdateTopic,
  type Experiment,
  type InsertExperiment,
  type ExperimentVariant,
  type InsertExperimentVariant,
  type ExperimentExposure,
  type InsertExperimentExposure,
  type ExperimentConversion,
  type InsertExperimentConversion,
  type ArticleAngle,
  type InsertArticleAngle,
  type Section,
  type InsertSection,
  type Story,
  type InsertStory,
  type StoryLink,
  type InsertStoryLink,
  type StoryFollow,
  type InsertStoryFollow,
  type StoryNotification,
  type InsertStoryNotification,
  type StoryWithDetails,
  type StoryLinkWithArticle,
  type Staff,
  type ReporterProfile,
  type ReporterArticle,
  type ReporterTopCategory,
  type ReporterTimeseries,
  type MirqabEntry,
  type InsertMirqabEntry,
  type UpdateMirqabEntry,
  type MirqabSabqIndex,
  type InsertMirqabSabqIndex,
  type UpdateMirqabSabqIndex,
  type MirqabNextStory,
  type InsertMirqabNextStory,
  type UpdateMirqabNextStory,
  type MirqabRadarAlert,
  type InsertMirqabRadarAlert,
  type UpdateMirqabRadarAlert,
  type MirqabAlgorithmArticle,
  type InsertMirqabAlgorithmArticle,
  type UpdateMirqabAlgorithmArticle,
  type MirqabEntryWithDetails,
  type SmartBlock,
  type InsertSmartBlock,
  type UpdateSmartBlock,
  type AudioNewsletter,
  type InsertAudioNewsletter,
  type UpdateAudioNewsletter,
  type AudioNewsletterArticle,
  type InsertAudioNewsletterArticle,
  type AudioNewsletterListen,
  type InsertAudioNewsletterListen,
  type AudioNewsletterWithDetails,
  type AudioNewsBrief,
  type InsertAudioNewsBrief,
  audioNewsBriefs,
  type InternalAnnouncement,
  type InsertInternalAnnouncement,
  type UpdateInternalAnnouncement,
  type InternalAnnouncementVersion,
  type InsertInternalAnnouncementVersion,
  type InternalAnnouncementMetric,
  type InsertInternalAnnouncementMetric,
  type InternalAnnouncementWithDetails,
  shorts,
  shortAnalytics,
  type Short,
  type ShortWithDetails,
  type InsertShort,
  type UpdateShort,
  type ShortAnalytic,
  type InsertShortAnalytic,
  calendarEvents,
  calendarReminders,
  calendarAiDrafts,
  calendarAssignments,
  type CalendarEvent,
  type CalendarReminder,
  type CalendarAiDraft,
  type CalendarAssignment,
  type InsertCalendarEvent,
  type UpdateCalendarEvent,
  type InsertCalendarReminder,
  type InsertCalendarAiDraft,
  type InsertCalendarAssignment,
  type UpdateCalendarAssignment,
  entityTypes,
  smartEntities,
  smartTerms,
  articleSmartLinks,
  type EntityType,
  type InsertEntityTypeDb,
  type SmartEntity,
  type InsertSmartEntityDb,
  type SmartTerm,
  type InsertSmartTermDb,
  type ArticleSmartLink,
  type InsertArticleSmartLinkDb,
  type InsertEntityType,
  type InsertSmartEntity,
  type InsertSmartTerm,
  type InsertArticleSmartLink,
  type EnArticleWithDetails,
  type UrCategory,
  type InsertUrCategory,
  type UrArticle,
  type InsertUrArticle,
  type UrReaction,
  type InsertUrReaction,
  type UrBookmark,
  type InsertUrBookmark,
  type UrReadingHistory,
  type InsertUrReadingHistory,
  type UrArticleWithDetails,
  type UrSmartBlock,
  type InsertUrSmartBlock,
  type DataStorySource,
  type InsertDataStorySource,
  type DataStoryAnalysis,
  type InsertDataStoryAnalysis,
  type DataStoryDraft,
  type InsertDataStoryDraft,
  type DataStoryWithDetails,
  type ShortLink,
  type InsertShortLink,
  type ShortLinkClick,
  type InsertShortLinkClick,
  type SocialFollow,
  type InsertSocialFollow,
  type WalletPass,
  type InsertWalletPass,
  type WalletDevice,
  type InsertWalletDevice,
  type HomepageStats,
  tasks,
  subtasks,
  taskAttachments,
  taskActivityLog,
  type Task,
  type InsertTask,
  type Subtask,
  type InsertSubtask,
  type TaskAttachment,
  type InsertTaskAttachment,
  type TaskActivityLogEntry,
  trustedEmailSenders,
  emailWebhookLogs,
  emailAgentStats,
  type TrustedEmailSender,
  type InsertTrustedEmailSender,
  type EmailWebhookLog,
  type InsertEmailWebhookLog,
  type EmailAgentStats,
  whatsappTokens,
  whatsappWebhookLogs,
  pendingWhatsappMessages,
  type WhatsappToken,
  type InsertWhatsappToken,
  type WhatsappWebhookLog,
  type InsertWhatsappWebhookLog,
  type PendingWhatsappMessage,
  newsletterSubscriptions,
  type NewsletterSubscription,
  type InsertNewsletterSubscription,
  publishers,
  publisherCredits,
  publisherCreditLogs,
  type Publisher,
  type InsertPublisher,
  type UpdatePublisher,
  type PublisherCredit,
  type InsertPublisherCredit,
  type PublisherCreditLog,
  type InsertPublisherCreditLog,
  // iFox imports
  ifoxSettings,
  ifoxMedia,
  ifoxAnalytics,
  ifoxSchedule,
  ifoxCategorySettings,
  type IfoxSettings,
  type InsertIfoxSettings,
  type IfoxMedia,
  type InsertIfoxMedia,
  type IfoxAnalytics,
  type InsertIfoxAnalytics,
  type IfoxSchedule,
  type InsertIfoxSchedule,
  type IfoxCategorySettings,
  type InsertIfoxCategorySettings,
  // iFox AI Management System - Phase 2
  ifoxAiPreferences,
  ifoxContentTemplates,
  ifoxWorkflowRules,
  ifoxQualityChecks,
  ifoxPerformanceMetrics,
  ifoxBudgetTracking,
  ifoxStrategyInsights,
  ifoxEditorialCalendar,
  type IfoxAiPreferences,
  type InsertIfoxAiPreferences,
  type IfoxContentTemplate,
  type InsertIfoxContentTemplate,
  type IfoxWorkflowRule,
  type InsertIfoxWorkflowRule,
  type IfoxQualityCheck,
  type InsertIfoxQualityCheck,
  type IfoxPerformanceMetric,
  type InsertIfoxPerformanceMetric,
  type IfoxBudgetTracking,
  type InsertIfoxBudgetTracking,
  type IfoxStrategyInsight,
  type InsertIfoxStrategyInsight,
  type IfoxEditorialCalendar,
  type InsertIfoxEditorialCalendar,
  // AI Scheduled Tasks imports
  aiScheduledTasks,
  type AiScheduledTask,
  type InsertAiScheduledTask,
  // AI Image Generations
  aiImageGenerations,
  readingSessions,
  sectionAnalytics,
  navigationPaths,
  trafficSources,
  hourlyEngagementRollups,
  realTimeMetrics,
  articleEngagementScores,
  readerJourneyMilestones,
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
  getOrCreateSystemUser(): Promise<User>;
  getOrCreateReporterUser(email: string, name: string): Promise<User>;
  
  // Admin user management operations
  getUsersWithStats(params: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
    verificationBadge?: string;
    emailVerified?: boolean;
    searchQuery?: string;
    hasRejectedComments?: boolean;
    activityDays?: number;
  }): Promise<{
    users: (User & {
      commentCount: number;
      articleCount: number;
      totalPoints: number;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  
  getUserKPIs(): Promise<{
    total: number;
    emailVerified: number;
    unverified: number;
    suspended: number;
    banned: number;
    newToday: number;
    newThisWeek: number;
    active24h: number;
    trends: {
      emailVerifiedTrend: number;
      unverifiedTrend: number;
      suspendedTrend: number;
      bannedTrend: number;
      newUsersTrend: number;
      activeUsersTrend: number;
    };
  }>;
  
  suspendUser(userId: string, reason: string, duration?: number): Promise<User>;
  unsuspendUser(userId: string): Promise<User>;
  banUser(userId: string, reason: string, isPermanent: boolean, duration?: number): Promise<User>;
  unbanUser(userId: string): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateVerificationBadge(userId: string, badge: string): Promise<User>;
  softDeleteUser(userId: string): Promise<User>;
  restoreUser(userId: string): Promise<User>;
  
  bulkSuspendUsers(userIds: string[], reason: string, duration?: number): Promise<{ success: number; failed: number }>;
  bulkBanUsers(userIds: string[], reason: string, isPermanent: boolean, duration?: number): Promise<{ success: number; failed: number }>;
  bulkUpdateUserRole(userIds: string[], role: string): Promise<{ success: number; failed: number }>;
  
  // RBAC operations (Role-Based Access Control)
  createUserWithRoles(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    roleIds: string[];
    status?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  }, createdBy: string): Promise<{ user: User; temporaryPassword: string }>;
  getUserRoles(userId: string): Promise<Array<{ id: string; name: string; nameAr: string }>>;
  updateUserRoles(userId: string, roleIds: string[], updatedBy: string, reason?: string): Promise<void>;
  getAllRoles(): Promise<Array<{ id: string; name: string; nameAr: string; description: string | null; isSystem: boolean }>>;
  getRolePermissions(roleId: string): Promise<Array<{ code: string; label: string; labelAr: string; module: string }>>;
  getUserPermissions(userId: string): Promise<string[]>;
  logActivity(activity: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void>;
  
  // Category operations
  getAllCategories(options?: { excludeIfox?: boolean }): Promise<Category[]>;
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
    includeAI?: boolean;
  }): Promise<ArticleWithDetails[]>;
  getArticleBySlug(slug: string, userId?: string, userRole?: string): Promise<ArticleWithDetails | undefined>;
  getArticleById(id: string, userId?: string): Promise<ArticleWithDetails | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  incrementArticleViews(id: string): Promise<void>;
  getFeaturedArticle(userId?: string): Promise<ArticleWithDetails | undefined>;
  getRelatedArticles(articleId: string, categoryId?: string): Promise<ArticleWithDetails[]>;
  getArticlesMetrics(): Promise<{ published: number; scheduled: number; draft: number; archived: number }>;
  archiveArticle(id: string, userId: string): Promise<Article>;
  restoreArticle(id: string, userId: string): Promise<Article>;
  toggleArticleBreaking(id: string, userId: string): Promise<Article>;
  getNewsStatistics(): Promise<{
    totalNews: number;
    todayNews: number;
    topViewedThisWeek: {
      article: ArticleWithDetails | null;
      views: number;
    };
    averageViews: number;
  }>;
  
  // SEO operations
  getArticleForSeo(id: string, language: "ar" | "en" | "ur"): Promise<{
    id: string;
    title: string;
    subtitle?: string | null;
    content: string;
    excerpt?: string | null;
  } | undefined>;
  saveSeoMetadata(
    articleId: string,
    language: "ar" | "en" | "ur",
    seo: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      socialTitle?: string;
      socialDescription?: string;
      imageAltText?: string;
      ogImageUrl?: string;
    },
    metadata: {
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
    }
  ): Promise<void>;
  createSeoHistoryEntry(params: {
    articleId: string;
    language: "ar" | "en" | "ur";
    seoContent: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      socialTitle?: string;
      socialDescription?: string;
      imageAltText?: string;
      ogImageUrl?: string;
    };
    seoMetadata: {
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
    };
    provider: string;
    model: string;
    generatedBy: string;
  }): Promise<void>;
  
  // RSS Feed operations
  getAllRssFeeds(): Promise<RssFeed[]>;
  createRssFeed(feed: InsertRssFeed): Promise<RssFeed>;
  updateRssFeedLastFetch(id: string): Promise<void>;
  
  getAllAngles(activeOnly?: boolean): Promise<Angle[]>;
  getAngleBySlug(slug: string): Promise<Angle | undefined>;
  getAngleById(id: string): Promise<Angle | undefined>;
  createAngle(angle: InsertAngle): Promise<Angle>;
  updateAngle(id: string, angle: Partial<InsertAngle>): Promise<Angle>;
  deleteAngle(id: string): Promise<void>;
  getArticlesByAngle(angleSlug: string, limit?: number): Promise<ArticleWithDetails[]>;
  linkArticleToAngle(articleId: string, angleId: string): Promise<void>;
  unlinkArticleFromAngle(articleId: string, angleId: string): Promise<void>;
  getArticleAngles(articleId: string): Promise<Angle[]>;
  
  // Topics CRUD
  getTopicsByAngle(angleId: string, options?: {
    status?: 'draft' | 'published' | 'archived';
    limit?: number;
    offset?: number;
  }): Promise<{ topics: Topic[]; total: number }>;
  getTopicBySlug(angleId: string, slug: string): Promise<Topic | undefined>;
  getTopicById(id: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, topic: UpdateTopic): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;
  publishTopic(id: string, userId: string): Promise<Topic>;
  unpublishTopic(id: string, userId: string): Promise<Topic>;
  getPublishedTopicsByAngle(angleSlug: string, limit?: number): Promise<Topic[]>;
  getLatestPublishedTopics(limit?: number): Promise<Array<Topic & { angle: { id: string; name: string; slug: string; icon?: string | null; colorHex?: string | null } }>>;
  
  // Homepage operations
  getHeroArticles(): Promise<ArticleWithDetails[]>;
  getBreakingNews(limit?: number): Promise<ArticleWithDetails[]>;
  getEditorPicks(limit?: number): Promise<ArticleWithDetails[]>;
  getDeepDiveArticles(limit?: number): Promise<ArticleWithDetails[]>;
  getTrendingTopics(): Promise<Array<{ topic: string; count: number; views: number; articles: number; comments: number }>>;
  getAllPublishedArticles(limit?: number, offset?: number): Promise<ArticleWithDetails[]>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
  }>;

  // Admin Dashboard stats
  getAdminDashboardStats(): Promise<{
    articles: {
      total: number;
      published: number;
      draft: number;
      archived: number;
      totalViews: number;
    };
    users: {
      total: number;
      emailVerified: number;
      active24h: number;
      newThisWeek: number;
    };
    comments: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    categories: {
      total: number;
    };
    abTests: {
      total: number;
      running: number;
    };
    reactions: {
      total: number;
    };
    audioNewsletters: {
      total: number;
      published: number;
      totalListens: number;
    };
    deepAnalyses: {
      total: number;
      published: number;
    };
    publishers: {
      total: number;
      active: number;
    };
    mediaLibrary: {
      totalFiles: number;
      totalSize: number;
    };
    aiTasks: {
      total: number;
      pending: number;
      completed: number;
    };
    aiImages: {
      total: number;
      thisWeek: number;
    };
    smartBlocks: {
      total: number;
    };
    recentArticles: ArticleWithDetails[];
    topArticles: ArticleWithDetails[];
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

  // Story operations
  createStory(story: InsertStory): Promise<Story>;
  getStoryById(id: string): Promise<Story | undefined>;
  getStoryBySlug(slug: string): Promise<StoryWithDetails | undefined>;
  getAllStories(filters?: { status?: string }): Promise<StoryWithDetails[]>;
  updateStory(id: string, data: Partial<InsertStory>): Promise<Story>;
  deleteStory(id: string): Promise<void>;

  // Story link operations
  createStoryLink(link: InsertStoryLink): Promise<StoryLink>;
  getStoryLinks(storyId: string): Promise<StoryLinkWithArticle[]>;
  deleteStoryLink(id: string): Promise<void>;

  // Story follow operations
  followStory(follow: InsertStoryFollow): Promise<StoryFollow>;
  unfollowStory(userId: string, storyId: string): Promise<void>;
  getStoryFollows(userId: string): Promise<(StoryFollow & { story: StoryWithDetails })[]>;
  getStoryFollowersByStoryId(storyId: string): Promise<StoryFollow[]>;
  isFollowingStory(userId: string, storyId: string): Promise<boolean>;
  updateStoryFollow(userId: string, storyId: string, data: Partial<InsertStoryFollow>): Promise<StoryFollow>;

  // Social Following System
  followUser(data: InsertSocialFollow): Promise<SocialFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string, limit?: number): Promise<Array<SocialFollow & { follower: User }>>;
  getFollowing(userId: string, limit?: number): Promise<Array<SocialFollow & { following: User }>>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowStats(userId: string): Promise<{ followersCount: number; followingCount: number }>;

  // Story notification operations
  createStoryNotification(notification: InsertStoryNotification): Promise<StoryNotification>;
  getStoryNotifications(storyId: string): Promise<StoryNotification[]>;

  // System settings operations
  getSystemSetting(key: string): Promise<any | undefined>;
  upsertSystemSetting(key: string, value: any, category?: string, isPublic?: boolean): Promise<void>;

  // A/B Testing operations
  createExperiment(experiment: InsertExperiment): Promise<Experiment>;
  getExperimentById(id: string): Promise<Experiment | undefined>;
  getAllExperiments(filters?: { status?: string; testType?: string }): Promise<Experiment[]>;
  updateExperiment(id: string, data: Partial<InsertExperiment>): Promise<Experiment>;
  deleteExperiment(id: string): Promise<void>;
  startExperiment(id: string): Promise<Experiment>;
  pauseExperiment(id: string): Promise<Experiment>;
  completeExperiment(id: string, winnerVariantId?: string): Promise<Experiment>;

  // Experiment variant operations
  createExperimentVariant(variant: InsertExperimentVariant): Promise<ExperimentVariant>;
  getExperimentVariants(experimentId: string): Promise<ExperimentVariant[]>;
  updateExperimentVariant(id: string, data: Partial<InsertExperimentVariant>): Promise<ExperimentVariant>;
  deleteExperimentVariant(id: string): Promise<void>;

  // Experiment exposure operations
  recordExperimentExposure(exposure: InsertExperimentExposure): Promise<ExperimentExposure>;
  getExperimentExposures(experimentId: string, variantId?: string): Promise<ExperimentExposure[]>;

  // Experiment conversion operations
  recordExperimentConversion(conversion: InsertExperimentConversion): Promise<ExperimentConversion>;
  getExperimentConversions(experimentId: string, variantId?: string): Promise<ExperimentConversion[]>;

  // A/B Testing analytics
  getExperimentAnalytics(experimentId: string): Promise<{
    experiment: Experiment;
    variants: Array<ExperimentVariant & {
      exposureCount: number;
      conversionCount: number;
      conversionRate: number;
      averageReadTime?: number;
      engagementScore: number;
    }>;
    totalExposures: number;
    totalConversions: number;
    overallConversionRate: number;
    winner?: string;
    confidenceLevel?: number;
  }>;

  // Get active experiment for article
  getActiveExperimentForArticle(articleId: string): Promise<Experiment | undefined>;

  // Assign variant to user/session
  assignExperimentVariant(experimentId: string, userId?: string, sessionId?: string): Promise<ExperimentVariant>;

  // Reporter/Staff operations
  getReporterBySlug(slug: string): Promise<Staff | undefined>;
  getReporterProfile(slug: string, windowDays?: number, language?: 'ar' | 'en'): Promise<ReporterProfile | undefined>;
  ensureReporterStaffRecord(userId: string): Promise<Staff>;
  getStaffByUserId(userId: string): Promise<Staff | null>;
  upsertStaff(userId: string, data: { bio?: string; bioAr?: string; title?: string; titleAr?: string }): Promise<Staff>;

  // Activity Logs operations
  getActivityLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchQuery?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: Array<{
      id: string;
      userId: string | null;
      action: string;
      entityType: string;
      entityId: string;
      oldValue: Record<string, any> | null;
      newValue: Record<string, any> | null;
      metadata: { ip?: string; userAgent?: string; reason?: string } | null;
      createdAt: Date;
      user?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
      } | null;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  getActivityLogById(id: string): Promise<{
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    oldValue: Record<string, any> | null;
    newValue: Record<string, any> | null;
    metadata: { ip?: string; userAgent?: string; reason?: string } | null;
    createdAt: Date;
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    } | null;
  } | undefined>;

  getActivityLogsAnalytics(): Promise<{
    topUsers: Array<{
      userId: string;
      userName: string;
      email: string;
      activityCount: number;
      profileImageUrl: string | null;
    }>;
    topActions: Array<{
      action: string;
      count: number;
    }>;
    peakHours: Array<{
      hour: number;
      count: number;
    }>;
    successFailureRate: {
      successCount: number;
      failureCount: number;
      warningCount: number;
      totalCount: number;
    };
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
  }>;

  // ============================================
  // Mirqab Operations - المرقاب
  // ============================================
  
  // General Mirqab Entry operations
  getMirqabEntries(filters: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<any>>;
  
  getMirqabEntryById(id: string): Promise<any | undefined>;
  getMirqabEntryBySlug(slug: string): Promise<any | undefined>;
  
  createMirqabEntry(entry: any): Promise<any>;
  updateMirqabEntry(id: string, updates: any): Promise<any>;
  deleteMirqabEntry(id: string): Promise<void>;
  
  // SABQ Index operations
  createSabqIndex(data: any): Promise<any>;
  updateSabqIndex(id: string, updates: any): Promise<any>;
  getSabqIndexByEntryId(entryId: string): Promise<any | undefined>;
  getLatestSabqIndexes(limit: number): Promise<Array<any>>;
  
  // Next Story operations
  createNextStory(data: any): Promise<any>;
  updateNextStory(id: string, updates: any): Promise<any>;
  getNextStoryByEntryId(entryId: string): Promise<any | undefined>;
  getUpcomingNextStories(limit: number): Promise<Array<any>>;
  
  // Radar Alert operations
  createRadarReport(data: any): Promise<any>;
  updateRadarReport(id: string, updates: any): Promise<any>;
  getRadarReportByEntryId(entryId: string): Promise<any | undefined>;
  getRadarReportByDate(date: Date): Promise<any | undefined>;
  getLatestRadarReports(limit: number): Promise<Array<any>>;
  
  // Algorithm Article operations
  createAlgorithmArticle(data: any): Promise<any>;
  updateAlgorithmArticle(id: string, updates: any): Promise<any>;
  getAlgorithmArticleByEntryId(entryId: string): Promise<any | undefined>;
  getLatestAlgorithmArticles(limit: number): Promise<Array<any>>;

  // ============================================
  // Smart Blocks Operations - البلوكات الذكية
  // ============================================
  
  createSmartBlock(data: InsertSmartBlock): Promise<SmartBlock>;
  getSmartBlocks(filters?: { isActive?: boolean; placement?: string }): Promise<SmartBlock[]>;
  getSmartBlockById(id: string): Promise<SmartBlock | undefined>;
  getSmartBlocksByPlacement(placement: string): Promise<SmartBlock[]>;
  updateSmartBlock(id: string, updates: UpdateSmartBlock): Promise<SmartBlock>;
  deleteSmartBlock(id: string): Promise<void>;
  queryArticlesByKeyword(keyword: string, limit: number, filters?: {
    categories?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Array<any>>;
  queryUrArticlesByKeyword(keyword: string, limit: number, filters?: {
    categories?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Array<any>>;

  // ============================================
  // Audio News Briefs Operations - الأخبار الصوتية السريعة
  // ============================================
  createAudioNewsBrief(data: InsertAudioNewsBrief): Promise<AudioNewsBrief>;
  getAudioNewsBriefById(id: string): Promise<AudioNewsBrief | null>;
  getAllAudioNewsBriefs(): Promise<AudioNewsBrief[]>;
  getPublishedAudioNewsBriefs(limit?: number): Promise<AudioNewsBrief[]>;
  updateAudioNewsBrief(id: string, data: Partial<InsertAudioNewsBrief>): Promise<AudioNewsBrief>;
  deleteAudioNewsBrief(id: string): Promise<void>;
  publishAudioNewsBrief(id: string): Promise<AudioNewsBrief>;

  // ============================================
  // Audio Newsletters Operations - النشرات الصوتية
  // ============================================
  
  // Audio Newsletter CRUD operations
  createAudioNewsletter(data: InsertAudioNewsletter): Promise<AudioNewsletter>;
  getAudioNewsletterById(id: string): Promise<AudioNewsletterWithDetails | null>;
  getAudioNewsletterBySlug(slug: string): Promise<AudioNewsletterWithDetails | null>;
  getAllAudioNewsletters(filters?: { status?: string; limit?: number; offset?: number }): Promise<AudioNewsletterWithDetails[]>;
  updateAudioNewsletter(id: string, data: UpdateAudioNewsletter): Promise<AudioNewsletter>;
  deleteAudioNewsletter(id: string): Promise<void>;

  // Articles in newsletter
  addArticlesToNewsletter(newsletterId: string, articleIds: string[]): Promise<void>;
  removeArticleFromNewsletter(newsletterId: string, articleId: string): Promise<void>;
  getNewsletterArticles(newsletterId: string): Promise<(AudioNewsletterArticle & { article?: Article })[]>;

  // Listen tracking
  trackListen(data: InsertAudioNewsletterListen): Promise<AudioNewsletterListen>;
  getNewsletterAnalytics(newsletterId: string): Promise<{
    totalListens: number;
    uniqueListeners: number;
    averageCompletionRate: number;
    listensByDay: { date: string; count: number }[];
  }>;

  // ============================================
  // Internal Announcements Operations - نظام الإعلانات الداخلية المتقدم
  // ============================================
  
  // Announcement CRUD operations
  createInternalAnnouncement(data: InsertInternalAnnouncement): Promise<InternalAnnouncement>;
  getInternalAnnouncementById(id: string): Promise<InternalAnnouncementWithDetails | null>;
  getAllInternalAnnouncements(filters?: {
    status?: string;
    priority?: string;
    channel?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<InternalAnnouncementWithDetails[]>;
  updateInternalAnnouncement(id: string, data: UpdateInternalAnnouncement, changedBy: string, changeReason?: string): Promise<InternalAnnouncement>;
  deleteInternalAnnouncement(id: string): Promise<void>;
  
  // Status management
  publishInternalAnnouncement(id: string, publishedBy: string): Promise<InternalAnnouncement>;
  archiveInternalAnnouncement(id: string): Promise<InternalAnnouncement>;
  scheduleInternalAnnouncement(id: string, startAt: Date, endAt?: Date): Promise<InternalAnnouncement>;
  
  // Audience targeting
  getActiveAnnouncementsForUser(userId: string, userRoles: string[], channel?: string): Promise<InternalAnnouncementWithDetails[]>;
  
  // Versioning
  createAnnouncementVersion(data: InsertInternalAnnouncementVersion): Promise<InternalAnnouncementVersion>;
  getAnnouncementVersions(announcementId: string): Promise<InternalAnnouncementVersion[]>;
  restoreAnnouncementVersion(versionId: string, restoredBy: string): Promise<InternalAnnouncement>;
  
  // Metrics tracking
  trackAnnouncementMetric(data: InsertInternalAnnouncementMetric): Promise<InternalAnnouncementMetric>;
  getAnnouncementMetrics(announcementId: string, event?: string): Promise<InternalAnnouncementMetric[]>;
  getAnnouncementAnalytics(announcementId: string): Promise<{
    totalImpressions: number;
    uniqueViews: number;
    dismissals: number;
    clicks: number;
    viewsByChannel: { channel: string; count: number }[];
    viewsByDay: { date: string; count: number }[];
  }>;
  
  // Scheduled tasks
  processScheduledAnnouncements(): Promise<void>;

  // ============================================
  // Sabq Shorts (Reels) Operations - سبق شورتس
  // ============================================
  
  // Get all shorts with filters and pagination
  getAllShorts(filters?: {
    status?: string;
    categoryId?: string;
    reporterId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    shorts: ShortWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  // Get single short by ID with relations
  getShortById(id: string): Promise<ShortWithDetails | undefined>;

  // Get single short by slug for public viewing
  getShortBySlug(slug: string): Promise<ShortWithDetails | undefined>;

  // Create new short
  createShort(short: InsertShort): Promise<Short>;

  // Update existing short
  updateShort(id: string, updates: UpdateShort): Promise<Short>;

  // Delete short (soft delete by setting status=archived)
  deleteShort(id: string): Promise<Short>;

  // Increment view count
  incrementShortViews(id: string): Promise<void>;

  // Increment like count
  likeShort(id: string): Promise<Short>;

  // Increment share count
  shareShort(id: string): Promise<Short>;

  // Record analytics event (view, watch_time, etc.)
  trackShortAnalytic(data: InsertShortAnalytic): Promise<ShortAnalytic>;

  // Get analytics for a short
  getShortAnalytics(shortId: string, filters?: {
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    uniqueViewers: number;
    averageWatchTime: number;
    completionRate: number;
    eventsByType: { eventType: string; count: number }[];
    viewsByDay: { date: string; count: number }[];
  }>;

  // Get featured shorts for homepage block
  getFeaturedShorts(limit?: number): Promise<ShortWithDetails[]>;

  // ==========================================
  // Calendar System - تقويم سبق
  // ==========================================
  
  // Calendar Events - CRUD operations
  getAllCalendarEvents(filters?: {
    type?: string;
    importance?: number;
    dateFrom?: Date;
    dateTo?: Date;
    categoryId?: string;
    tags?: string[];
    searchQuery?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    events: Array<any>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  
  getCalendarEventById(id: string): Promise<any | undefined>;
  getCalendarEventBySlug(slug: string): Promise<any | undefined>;
  createCalendarEvent(event: any, reminders?: any[]): Promise<any>;
  updateCalendarEvent(id: string, updates: any): Promise<any>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // Upcoming events (7-day lookahead)
  getUpcomingCalendarEvents(days?: number): Promise<Array<any>>;
  
  // Reminders
  getCalendarReminders(eventId: string): Promise<any[]>;
  createCalendarReminder(reminder: any): Promise<any>;
  updateCalendarReminder(id: string, updates: any): Promise<any>;
  deleteCalendarReminder(id: string): Promise<void>;
  getRemindersToFire(date: Date): Promise<Array<any>>;
  getUpcomingReminders(days?: number): Promise<Array<any>>;
  
  // AI Drafts
  getCalendarAiDraft(eventId: string): Promise<any | undefined>;
  createCalendarAiDraft(draft: any): Promise<any>;
  updateCalendarAiDraft(eventId: string, updates: any): Promise<any>;
  deleteCalendarAiDraft(eventId: string): Promise<void>;
  
  // Assignments
  getCalendarAssignments(filters?: {
    eventId?: string;
    userId?: string;
    status?: string;
    role?: string;
  }): Promise<any[]>;
  createCalendarAssignment(assignment: any): Promise<any>;
  updateCalendarAssignment(id: string, updates: any): Promise<any>;
  deleteCalendarAssignment(id: string): Promise<void>;
  completeCalendarAssignment(id: string): Promise<any>;

  // ==========================================
  // English User Data Operations - عمليات بيانات المستخدم الإنجليزية
  // ==========================================
  getEnUserBookmarks(userId: string): Promise<EnArticleWithDetails[]>;
  getEnUserLikedArticles(userId: string): Promise<EnArticleWithDetails[]>;
  getEnUserReadingHistory(userId: string, limit?: number): Promise<EnArticleWithDetails[]>;
  getEnArticleById(id: string, userId?: string): Promise<EnArticleWithDetails | undefined>;

  // ==========================================
  // Urdu Operations - عملیات اردو
  // ==========================================
  
  // Urdu Categories
  getUrCategories(filters?: { status?: string }): Promise<UrCategory[]>;
  getUrCategoryById(id: string): Promise<UrCategory | undefined>;
  getUrCategoryBySlug(slug: string): Promise<UrCategory | undefined>;
  createUrCategory(category: InsertUrCategory): Promise<UrCategory>;
  updateUrCategory(id: string, updates: Partial<InsertUrCategory>): Promise<UrCategory>;
  deleteUrCategory(id: string): Promise<void>;
  
  // Urdu Articles
  getUrArticles(filters?: {
    categoryId?: string;
    status?: string;
    authorId?: string;
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<UrArticleWithDetails[]>;
  getUrArticleBySlug(slug: string): Promise<UrArticleWithDetails | undefined>;
  getUrArticleById(id: string): Promise<UrArticleWithDetails | undefined>;
  createUrArticle(article: InsertUrArticle): Promise<UrArticle>;
  updateUrArticle(id: string, updates: Partial<InsertUrArticle>): Promise<UrArticle>;
  deleteUrArticle(id: string): Promise<void>;
  incrementUrArticleViews(id: string): Promise<void>;
  
  
  // Urdu Reactions
  getUrArticleReactions(articleId: string): Promise<UrReaction[]>;
  getUserUrReaction(articleId: string, userId: string): Promise<UrReaction | undefined>;
  createUrReaction(reaction: InsertUrReaction): Promise<UrReaction>;
  deleteUrReaction(id: string): Promise<void>;
  
  // Urdu Bookmarks
  getUrUserBookmarks(userId: string): Promise<UrArticleWithDetails[]>;
  getUserUrBookmark(articleId: string, userId: string): Promise<UrBookmark | undefined>;
  createUrBookmark(bookmark: InsertUrBookmark): Promise<UrBookmark>;
  deleteUrBookmark(id: string): Promise<void>;
  
  // Urdu Reading History
  getUrUserReadingHistory(userId: string, limit?: number): Promise<UrArticleWithDetails[]>;
  createUrReadingHistory(history: InsertUrReadingHistory): Promise<UrReadingHistory>;
  
  // Urdu Smart Blocks
  getUrSmartBlocks(filters?: { placement?: string; type?: string; isActive?: boolean }): Promise<UrSmartBlock[]>;
  getUrSmartBlockById(id: string): Promise<UrSmartBlock | undefined>;
  createUrSmartBlock(block: InsertUrSmartBlock): Promise<UrSmartBlock>;
  updateUrSmartBlock(id: string, updates: Partial<InsertUrSmartBlock>): Promise<UrSmartBlock>;
  deleteUrSmartBlock(id: string): Promise<void>;
  
  // Urdu Dashboard Statistics
  getUrDashboardStats(): Promise<{
    articles: {
      published: number;
      draft: number;
      archived: number;
      scheduled: number;
      totalViews: number;
    };
    categories: { total: number; active: number };
    recentArticles: Array<any>;
    topArticles: Array<any>;
  }>;
  
  // Data Story operations
  createDataStorySource(source: InsertDataStorySource): Promise<DataStorySource>;
  getDataStorySource(id: string): Promise<DataStorySource | undefined>;
  updateDataStorySource(id: string, data: Partial<InsertDataStorySource>): Promise<DataStorySource>;
  getUserDataStorySources(userId: string, limit?: number): Promise<DataStorySource[]>;
  
  createDataStoryAnalysis(analysis: InsertDataStoryAnalysis): Promise<DataStoryAnalysis>;
  getDataStoryAnalysis(id: string): Promise<DataStoryAnalysis | undefined>;
  updateDataStoryAnalysis(id: string, data: Partial<InsertDataStoryAnalysis>): Promise<DataStoryAnalysis>;
  getAnalysesBySourceId(sourceId: string): Promise<DataStoryAnalysis[]>;
  
  createDataStoryDraft(draft: InsertDataStoryDraft): Promise<DataStoryDraft>;
  getDataStoryDraft(id: string): Promise<DataStoryDraft | undefined>;
  updateDataStoryDraft(id: string, data: Partial<InsertDataStoryDraft>): Promise<DataStoryDraft>;
  getDraftsByAnalysisId(analysisId: string): Promise<DataStoryDraft[]>;
  getUserDataStoryDrafts(userId: string, limit?: number): Promise<DataStoryDraft[]>;
  convertDraftToArticle(draftId: string, articleId: string): Promise<DataStoryDraft>;
  
  getDataStoryWithDetails(sourceId: string): Promise<DataStoryWithDetails | undefined>;
  
  // Short Links operations
  createShortLink(data: InsertShortLink): Promise<ShortLink>;
  getShortLinkByCode(code: string): Promise<ShortLink | undefined>;
  getShortLinkByArticle(articleId: string): Promise<ShortLink | undefined>;
  incrementShortLinkClick(linkId: string, clickData: InsertShortLinkClick): Promise<void>;
  getShortLinkAnalytics(linkId: string, days?: number): Promise<{
    totalClicks: number;
    uniqueUsers: number;
    topSources: Array<{ source: string; count: number }>;
  }>;
  
  // Apple Wallet operations
  getWalletPassByUserAndType(userId: string, passType: 'press' | 'loyalty'): Promise<WalletPass | null>;
  getWalletPassBySerial(serialNumber: string): Promise<WalletPass | null>;
  createWalletPass(data: {
    userId: string;
    passType: 'press' | 'loyalty';
    passTypeIdentifier: string;
    serialNumber: string;
    authenticationToken: string;
  }): Promise<WalletPass>;
  updateWalletPassTimestamp(passId: string): Promise<void>;
  deleteWalletPass(userId: string, passType: 'press' | 'loyalty'): Promise<void>;
  getWalletPassesByUser(userId: string): Promise<WalletPass[]>;
  getDevicesForPass(passId: string): Promise<WalletDevice[]>;
  registerDevice(data: {
    passId: string;
    deviceLibraryIdentifier: string;
    pushToken: string;
  }): Promise<WalletDevice>;
  unregisterDevice(passId: string, deviceLibraryIdentifier: string): Promise<void>;
  getUpdatedPasses(deviceLibraryIdentifier: string, passTypeIdentifier: string, tag?: string): Promise<string[]>;
  
  // User Points/Loyalty for Loyalty Cards
  getUserPointsTotal(userId: string): Promise<UserPointsTotal | null>;
  createUserPointsTotal(userId: string): Promise<UserPointsTotal>;
  updateUserPointsTotal(userId: string, data: {
    totalPoints?: number;
    currentRank?: string;
    rankLevel?: number;
    lifetimePoints?: number;
  }): Promise<UserPointsTotal>;
  triggerLoyaltyPassUpdate(userId: string, reason: string): Promise<void>;
  
  // Press Card Permissions
  updateUserPressCardPermission(userId: string, data: {
    hasPressCard?: boolean;
    jobTitle?: string | null;
    department?: string | null;
    pressIdNumber?: string | null;
    cardValidUntil?: Date | null;
  }): Promise<User>;
  
  // Deep Analysis Operations
  createDeepAnalysis(data: InsertDeepAnalysis): Promise<DeepAnalysis>;
  getDeepAnalysis(id: string): Promise<DeepAnalysis | undefined>;
  updateDeepAnalysis(id: string, data: Partial<DeepAnalysis>): Promise<DeepAnalysis>;
  listDeepAnalyses(params: {
    createdBy?: string;
    status?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ analyses: DeepAnalysis[]; total: number }>;
  deleteDeepAnalysis(id: string): Promise<void>;
  
  // Deep Analysis (Omq) Methods - Phase 2
  getPublishedDeepAnalyses(filters: {
    status?: string;
    keyword?: string;
    category?: string;
    dateRange?: { from: Date; to: Date };
    page?: number;
    limit?: number;
  }): Promise<{ analyses: (DeepAnalysis & { metrics?: any })[]; total: number }>;
  
  getDeepAnalysisMetrics(analysisId: string): Promise<any | null>;
  
  recordDeepAnalysisEvent(event: {
    analysisId: string;
    userId?: string;
    eventType: 'view' | 'share' | 'download' | 'export_pdf' | 'export_docx';
    metadata?: any;
  }): Promise<void>;
  
  getDeepAnalysisStats(): Promise<{
    totalAnalyses: number;
    totalViews: number;
    totalShares: number;
    totalDownloads: number;
    recentAnalyses: any[];
  }>;
  
  // Homepage Statistics
  getHomepageStats(): Promise<HomepageStats>;
  
  // Task Management Operations
  createTask(task: InsertTask): Promise<Task>;
  getTaskById(id: string): Promise<Task | null>;
  getTasks(filters: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    createdById?: string;
    department?: string;
    parentTaskId?: string | null;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: Task[]; total: number }>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTaskWithDetails(id: string): Promise<Task & {
    createdBy: User;
    assignedTo: User | null;
    subtasks: Subtask[];
    attachments: TaskAttachment[];
  } | null>;
  
  // Subtask Operations
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  getSubtaskById(id: string): Promise<Subtask | null>;
  updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask>;
  deleteSubtask(id: string): Promise<void>;
  toggleSubtaskComplete(id: string, completedById: string): Promise<Subtask>;
  
  
  // Task Attachment Operations
  createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment>;
  getTaskAttachmentById(id: string): Promise<TaskAttachment | null>;
  deleteTaskAttachment(id: string): Promise<void>;
  getTaskAttachments(taskId: string): Promise<TaskAttachment[]>;
  
  // Task Activity Log
  logTaskActivity(entry: {
    taskId: string;
    userId: string;
    action: string;
    changes?: {
      field?: string;
      oldValue?: any;
      newValue?: any;
      description?: string;
    };
  }): Promise<void>;
  getTaskActivity(taskId: string): Promise<(TaskActivityLogEntry & { user: User })[]>;
  
  // Task Statistics
  getTaskStatistics(userId?: string): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    completed: number;
    overdue: number;
  }>;
  
  // Email Agent Operations
  createTrustedSender(sender: InsertTrustedEmailSender, createdBy: string): Promise<TrustedEmailSender>;
  getTrustedSenders(): Promise<TrustedEmailSender[]>;
  getTrustedSenderById(id: string): Promise<TrustedEmailSender | null>;
  getTrustedSenderByEmail(email: string): Promise<TrustedEmailSender | null>;
  updateTrustedSender(id: string, updates: Partial<InsertTrustedEmailSender>): Promise<TrustedEmailSender>;
  deleteTrustedSender(id: string): Promise<void>;
  
  createEmailWebhookLog(log: InsertEmailWebhookLog): Promise<EmailWebhookLog>;
  getEmailWebhookLogs(filters?: {
    status?: string;
    trustedSenderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: EmailWebhookLog[]; total: number }>;
  getEmailWebhookLogsByDateRange(startDate: Date, endDate: Date): Promise<EmailWebhookLog[]>;
  updateEmailWebhookLog(id: string, updates: Partial<EmailWebhookLog>): Promise<EmailWebhookLog>;
  deleteEmailWebhookLog(id: string): Promise<void>;
  deleteEmailWebhookLogs(ids: string[]): Promise<void>;
  
  getEmailAgentStats(date?: Date): Promise<EmailAgentStats | null>;
  updateEmailAgentStats(date: Date, updates: Partial<EmailAgentStats>): Promise<EmailAgentStats>;
  getEmailLanguageCounts(): Promise<{ ar: number; en: number; ur: number }>;
  
  // WhatsApp Tokens
  createWhatsappToken(token: InsertWhatsappToken): Promise<WhatsappToken>;
  getWhatsappToken(id: string): Promise<WhatsappToken | null>;
  getWhatsappTokenByToken(token: string): Promise<WhatsappToken | null>;
  getWhatsappTokensByUser(userId: string): Promise<WhatsappToken[]>;
  getAllWhatsappTokens(): Promise<WhatsappToken[]>;
  updateWhatsappToken(id: string, updates: Partial<InsertWhatsappToken>): Promise<WhatsappToken | null>;
  updateWhatsappTokenUsage(id: string): Promise<void>;
  deleteWhatsappToken(id: string): Promise<void>;
  
  // WhatsApp Webhook Logs
  createWhatsappWebhookLog(log: InsertWhatsappWebhookLog): Promise<WhatsappWebhookLog>;
  updateWhatsappWebhookLog(id: string, updates: Partial<InsertWhatsappWebhookLog>): Promise<WhatsappWebhookLog | null>;
  getWhatsappWebhookLogs(params: { limit?: number; offset?: number; status?: string }): Promise<{ logs: WhatsappWebhookLog[]; total: number }>;
  getWhatsappWebhookLog(id: string): Promise<WhatsappWebhookLog | null>;
  deleteWhatsappWebhookLog(id: string): Promise<void>;
  bulkDeleteWhatsappWebhookLogs(ids: string[]): Promise<void>;
  
  // Pending WhatsApp Messages (multi-part message aggregation)
  getPendingWhatsappMessage(phoneNumber: string, token: string): Promise<PendingWhatsappMessage | null>;
  createOrUpdatePendingWhatsappMessage(data: {
    phoneNumber: string;
    token: string;
    tokenId?: string;
    userId?: string;
    messagePart: string;
    mediaUrls?: string[];
    aggregationWindowSeconds?: number;
  }): Promise<PendingWhatsappMessage>;
  deletePendingWhatsappMessage(id: string): Promise<void>;
  getExpiredPendingMessages(): Promise<PendingWhatsappMessage[]>;
  markPendingMessageProcessing(id: string): Promise<PendingWhatsappMessage | null>;
  
  // Notifications Operations
  createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    deeplink?: string;
    metadata?: any;
  }): Promise<any>;
  getNotifications(userId: string, filters?: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: any[]; total: number }>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  clearAllNotifications(userId: string): Promise<void>;
  
  // Broadcast notification to all staff/admin users
  broadcastNotificationToStaff(data: {
    type: string;
    title: string;
    body: string;
    deeplink?: string;
    metadata?: any;
  }): Promise<void>;
  
  // Newsletter Subscriptions
  createNewsletterSubscription(data: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  getNewsletterSubscription(email: string): Promise<NewsletterSubscription | null>;
  getAllNewsletterSubscriptions(params?: { 
    status?: string; 
    language?: string;
    limit?: number; 
    offset?: number;
  }): Promise<{ subscriptions: NewsletterSubscription[]; total: number }>;
  updateNewsletterSubscription(id: string, updates: Partial<InsertNewsletterSubscription>): Promise<NewsletterSubscription | null>;
  deleteNewsletterSubscription(id: string): Promise<void>;
  
  // Article Media Assets operations
  createArticleMediaAsset(data: InsertArticleMediaAsset): Promise<ArticleMediaAsset>;
  getArticleMediaAssets(articleId: string, locale?: string): Promise<ArticleMediaAsset[]>;
  getArticleMediaAssetById(id: string): Promise<ArticleMediaAsset | null>;
  updateArticleMediaAsset(id: string, data: UpdateArticleMediaAsset): Promise<ArticleMediaAsset>;
  deleteArticleMediaAsset(id: string): Promise<void>;
  getArticleMediaAssetWithDetails(articleId: string, locale?: string): Promise<Array<ArticleMediaAsset & { mediaFile: MediaFile }>>;
  
  // Publisher operations
  getPublisher(id: string): Promise<Publisher | undefined>;
  getPublisherByUserId(userId: string): Promise<Publisher | undefined>;
  createPublisher(publisher: InsertPublisher): Promise<Publisher>;
  updatePublisher(id: string, publisher: UpdatePublisher): Promise<Publisher>;
  getAllPublishers(params: { page?: number; limit?: number; isActive?: boolean }): Promise<{ publishers: Publisher[]; total: number }>;
  
  // Publisher Credits operations
  getPublisherCredits(publisherId: string): Promise<PublisherCredit[]>;
  getActivePublisherCredit(publisherId: string): Promise<PublisherCredit | undefined>;
  getPublisherActiveCredits(publisherId: string): Promise<PublisherCredit[]>;
  getPublisherCreditById(creditId: string): Promise<PublisherCredit | undefined>;
  createPublisherCredit(credit: InsertPublisherCredit & { remainingCredits: number }): Promise<PublisherCredit>;
  updatePublisherCredit(creditId: string, updates: Partial<Pick<PublisherCredit, 'packageName' | 'expiryDate' | 'isActive' | 'notes'>>): Promise<PublisherCredit>;
  deductPublisherCredit(publisherId: string, articleId: string, performedBy: string): Promise<void>;
  deactivateExpiredCredits(): Promise<{ deactivated: number; creditIds: string[] }>;
  getPublisherStats(publisherId: string, period?: { start: Date; end: Date }): Promise<{
    totalArticles: number;
    publishedArticles: number;
    pendingArticles: number;
    rejectedArticles: number;
    remainingCredits: number;
    usedCredits: number;
  }>;
  
  // Publisher Credit Logs
  getPublisherCreditLogs(publisherId: string, page?: number, limit?: number): Promise<{ logs: PublisherCreditLog[]; total: number }>;
  createCreditLog(log: InsertPublisherCreditLog): Promise<PublisherCreditLog>;
  logCreditAction(params: {
    publisherId: string;
    creditPackageId?: string;
    articleId?: string;
    actionType: 'credit_added' | 'credit_used' | 'credit_refunded' | 'credit_expired' | 'credit_adjusted';
    creditsBefore: number;
    creditsChanged: number;
    creditsAfter: number;
    performedBy?: string;
    notes?: string;
  }): Promise<PublisherCreditLog>;
  
  // Publisher Article Operations (with security & transactions)
  getPublisherArticles(publisherId: string, filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ articles: ArticleWithDetails[]; total: number }>;
  approvePublisherArticle(articleId: string, publisherId: string, performedBy: string): Promise<Article>;
  updatePublisherArticle(articleId: string, publisherId: string, authorId: string, updates: Partial<InsertArticle>): Promise<Article>;
  
  // ============================================
  // iFox Operations - عمليات آي فوكس
  // ============================================
  
  // iFox Articles Management
  listIFoxArticles(params: {
    categorySlug?: string;
    status?: 'draft' | 'published' | 'scheduled' | 'archived';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ articles: Article[], total: number }>;
  
  getIFoxArticleStats(): Promise<{
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    scheduled: number;
    total: number;
  }>;
  
  getIFoxArticleMetrics(): Promise<{
    published: number;
    scheduled: number;
    draft: number;
    archived: number;
    total: number;
  }>;
  
  // iFox Settings
  getIFoxSettings(keys?: string[]): Promise<IfoxSettings[]>;
  upsertIFoxSetting(key: string, value: any, description?: string, userId?: string): Promise<IfoxSettings>;
  deleteIFoxSetting(key: string): Promise<void>;
  
  // Category Settings
  getIFoxCategorySettings(categorySlug?: string): Promise<IfoxCategorySettings[]>;
  upsertIFoxCategorySettings(data: InsertIfoxCategorySettings): Promise<IfoxCategorySettings>;
  
  // iFox Media
  createIFoxMedia(data: InsertIfoxMedia): Promise<IfoxMedia>;
  listIFoxMedia(params: {
    type?: string;
    categorySlug?: string;
    page?: number;
    limit?: number;
  }): Promise<{ media: IfoxMedia[], total: number }>;
  deleteIFoxMedia(id: number): Promise<void>;
  
  // iFox Schedule
  createIFoxSchedule(data: InsertIfoxSchedule): Promise<IfoxSchedule>;
  updateIFoxSchedule(id: number, data: Partial<InsertIfoxSchedule>): Promise<IfoxSchedule>;
  listIFoxScheduled(params: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<IfoxSchedule[]>;
  deleteIFoxSchedule(id: number): Promise<void>;
  processScheduledPublishing(): Promise<{ published: number; failed: number }>;
  
  // iFox Analytics
  recordIFoxAnalytics(data: InsertIfoxAnalytics[]): Promise<void>;
  getIFoxAnalytics(params: {
    categorySlug?: string;
    fromDate: Date;
    toDate: Date;
    metrics?: string[];
  }): Promise<IfoxAnalytics[]>;
  getIFoxAnalyticsSummary(categorySlug?: string): Promise<{
    totalViews: number;
    totalEngagement: number;
    topCategories: { slug: string; views: number }[];
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // iFox Category Mapping
  getIFoxCategoryMap(): Promise<Record<string, string>>;
  
  // ============================================
  // AI Scheduled Tasks Operations - مهام AI المجدولة
  // ============================================
  
  // Create new AI task
  createAiTask(task: InsertAiScheduledTask): Promise<AiScheduledTask>;
  
  // Get AI task by ID
  getAiTask(id: string): Promise<AiScheduledTask | undefined>;
  
  // List AI tasks with filters
  listAiTasks(params: {
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    page?: number;
    limit?: number;
    categoryId?: string;
    createdBy?: string;
  }): Promise<{ tasks: AiScheduledTask[]; total: number }>;
  
  // Update AI task
  updateAiTask(id: string, updates: Partial<InsertAiScheduledTask>): Promise<AiScheduledTask>;
  
  // Atomically mark task as processing (prevents race conditions)
  markAiTaskProcessing(id: string): Promise<AiScheduledTask | null>;
  
  // Update task status with execution results
  updateAiTaskExecution(id: string, updates: {
    status: 'processing' | 'completed' | 'failed' | 'cancelled';
    executedAt?: Date;
    generatedArticleId?: string;
    generatedImageUrl?: string;
    executionLogs?: any;
    errorMessage?: string;
    executionTimeMs?: number;
    tokensUsed?: number;
    generationCost?: number;
  }): Promise<AiScheduledTask>;
  
  // Delete AI task
  deleteAiTask(id: string): Promise<void>;
  
  // Get pending tasks for execution
  getPendingAiTasks(): Promise<AiScheduledTask[]>;
  
  // Get task statistics
  getAiTaskStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalCost: number;
    averageExecutionTime: number;
  }>;
  
  // ============================================
  // iFox AI Management System - Phase 2
  // Comprehensive AI-powered newsroom management
  // ============================================
  
  // 1. AI Preferences & Settings - Central configuration for AI behavior
  createOrUpdateIfoxAiPreferences(data: Partial<InsertIfoxAiPreferences>): Promise<IfoxAiPreferences>;
  getIfoxAiPreferences(): Promise<IfoxAiPreferences | undefined>;
  getActiveIfoxAiPreferences(): Promise<IfoxAiPreferences | undefined>;
  
  // 2. Content Templates Library - Reusable AI content templates
  createIfoxContentTemplate(data: InsertIfoxContentTemplate): Promise<IfoxContentTemplate>;
  listIfoxContentTemplates(filters?: {
    templateType?: string;
    language?: string;
    isActive?: boolean;
    createdBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ templates: IfoxContentTemplate[]; total: number }>;
  getIfoxContentTemplate(id: string): Promise<IfoxContentTemplate | undefined>;
  updateIfoxContentTemplate(id: string, data: Partial<InsertIfoxContentTemplate>): Promise<IfoxContentTemplate>;
  deleteIfoxContentTemplate(id: string): Promise<void>;
  incrementTemplateUsage(id: string): Promise<IfoxContentTemplate>;
  
  // 3. Automated Workflow Rules - Smart automation rules
  createIfoxWorkflowRule(data: InsertIfoxWorkflowRule): Promise<IfoxWorkflowRule>;
  listIfoxWorkflowRules(filters?: {
    ruleType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ rules: IfoxWorkflowRule[]; total: number }>;
  getIfoxWorkflowRule(id: string): Promise<IfoxWorkflowRule | undefined>;
  updateIfoxWorkflowRule(id: string, data: Partial<InsertIfoxWorkflowRule>): Promise<IfoxWorkflowRule>;
  deleteIfoxWorkflowRule(id: string): Promise<void>;
  updateIfoxWorkflowRuleExecution(id: string, success: boolean): Promise<IfoxWorkflowRule>;
  
  // 4. Quality Checks - AI-powered quality control logs
  createIfoxQualityCheck(data: InsertIfoxQualityCheck): Promise<IfoxQualityCheck>;
  listIfoxQualityChecks(filters?: {
    articleId?: string;
    taskId?: string;
    passed?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ checks: IfoxQualityCheck[]; total: number }>;
  getIfoxQualityCheck(id: string): Promise<IfoxQualityCheck | undefined>;
  updateIfoxQualityCheckHumanReview(id: string, data: {
    humanReviewStatus: 'pending' | 'approved' | 'rejected';
    reviewedBy: string;
    reviewNotes?: string;
  }): Promise<IfoxQualityCheck>;
  
  // 5. Performance Metrics - Track AI content performance
  createOrUpdateIfoxPerformanceMetric(articleId: string, data: Partial<InsertIfoxPerformanceMetric>): Promise<IfoxPerformanceMetric>;
  getIfoxPerformanceMetric(articleId: string): Promise<IfoxPerformanceMetric | undefined>;
  listIfoxPerformanceMetrics(filters?: {
    isAiGenerated?: boolean;
    publishedAtFrom?: Date;
    publishedAtTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ metrics: IfoxPerformanceMetric[]; total: number }>;
  getIfoxPerformanceStats(): Promise<{
    totalArticles: number;
    aiGeneratedArticles: number;
    averageViewCount: number;
    averageEngagement: number;
    totalRevenue: number;
    averageROI: number;
  }>;
  
  // Performance metrics from actual articles
  getAiGeneratedArticlesMetrics(filters: {
    publishedAtFrom?: Date;
    publishedAtTo?: Date;
  }): Promise<Array<{
    id: string;
    qualityScore: number | null;
    bookmarkCount: number | null;
    viewCount: number | null;
    shareCount: number | null;
    commentCount: number | null;
  }>>;
  
  // 6. Budget Tracking - Monitor API usage and costs
  createOrUpdateIfoxBudgetTracking(period: string, data: Partial<InsertIfoxBudgetTracking>): Promise<IfoxBudgetTracking>;
  getCurrentPeriodBudget(period: string): Promise<IfoxBudgetTracking | undefined>;
  listIfoxBudgetTracking(filters?: {
    period?: string;
    fromDate?: Date;
    toDate?: Date;
    isOverBudget?: boolean;
  }): Promise<IfoxBudgetTracking[]>;
  updateBudgetUsage(updates: {
    provider: 'openai' | 'anthropic' | 'gemini' | 'visual-ai';
    apiCalls: number;
    tokens?: number;
    cost: number;
  }): Promise<IfoxBudgetTracking>;
  
  // 7. Strategy Insights - AI-powered content strategy recommendations
  createIfoxStrategyInsight(data: InsertIfoxStrategyInsight): Promise<IfoxStrategyInsight>;
  listIfoxStrategyInsights(filters?: {
    insightType?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ insights: IfoxStrategyInsight[]; total: number }>;
  getIfoxStrategyInsight(id: string): Promise<IfoxStrategyInsight | undefined>;
  updateIfoxStrategyInsightStatus(id: string, status: string, implementedBy?: string): Promise<IfoxStrategyInsight>;
  deleteIfoxStrategyInsight(id: string): Promise<void>;
  
  // 8. Editorial Calendar - Smart content planning
  createIfoxEditorialCalendarEntry(data: InsertIfoxEditorialCalendar): Promise<IfoxEditorialCalendar>;
  listIfoxEditorialCalendar(filters?: {
    scheduledDateFrom?: Date;
    scheduledDateTo?: Date;
    status?: string;
    assignmentType?: string;
    assignedToUser?: string;
    page?: number;
    limit?: number;
  }): Promise<{ entries: IfoxEditorialCalendar[]; total: number }>;
  getIfoxEditorialCalendarEntry(id: string): Promise<IfoxEditorialCalendar | undefined>;
  updateIfoxEditorialCalendarEntry(id: string, data: Partial<InsertIfoxEditorialCalendar>): Promise<IfoxEditorialCalendar>;
  deleteIfoxEditorialCalendarEntry(id: string): Promise<void>;
  updateIfoxEditorialCalendarStatus(id: string, status: string, articleId?: string): Promise<IfoxEditorialCalendar>;
  
  // Advanced Reader Behavior Analytics
  createReadingSession(data: {
    sessionId: string;
    userId?: string;
    deviceType?: string;
    platform?: string;
    browser?: string;
    screenWidth?: number;
    screenHeight?: number;
    referrerDomain?: string;
    referrerUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    landingPage?: string;
    isNewVisitor?: boolean;
    country?: string;
    city?: string;
    language?: string;
  }): Promise<{ id: string }>;
  
  endReadingSession(sessionId: string, data: {
    exitPage?: string;
    totalDurationMs?: number;
    totalPagesViewed?: number;
    totalArticlesRead?: number;
  }): Promise<void>;
  
  recordSectionAnalytic(data: {
    sessionId?: string;
    articleId: string;
    userId?: string;
    sectionIndex: number;
    sectionType?: string;
    paragraphIndex?: number;
    dwellTimeMs?: number;
    scrollDepthStart?: number;
    scrollDepthEnd?: number;
    visibleTimeMs?: number;
    heatScore?: number;
    wasHighlighted?: boolean;
    wasShared?: boolean;
    interactionCount?: number;
  }): Promise<void>;
  
  recordBatchSectionAnalytics(events: Array<{
    sessionId?: string;
    articleId: string;
    userId?: string;
    sectionIndex: number;
    sectionType?: string;
    paragraphIndex?: number;
    dwellTimeMs?: number;
    scrollDepthStart?: number;
    scrollDepthEnd?: number;
    visibleTimeMs?: number;
    heatScore?: number;
    wasHighlighted?: boolean;
    wasShared?: boolean;
    interactionCount?: number;
  }>): Promise<void>;
  
  recordNavigationPath(data: {
    sessionId: string;
    userId?: string;
    fromPageType?: string;
    fromPageId?: string;
    fromArticleId?: string;
    fromCategoryId?: string;
    toPageType: string;
    toPageId?: string;
    toArticleId?: string;
    toCategoryId?: string;
    transitionType?: string;
    dwellTimeOnFromMs?: number;
    scrollDepthOnFrom?: number;
  }): Promise<void>;
  
  recordTrafficSource(data: {
    sessionId: string;
    sourceType: string;
    sourceMedium?: string;
    sourceChannel?: string;
    referrerDomain?: string;
    referrerPath?: string;
    searchKeyword?: string;
    socialPlatform?: string;
    campaignName?: string;
    campaignSource?: string;
    articleId?: string;
  }): Promise<void>;
  
  getAdvancedAnalyticsOverview(range: string): Promise<{
    sessions: {
      total: number;
      uniqueUsers: number;
      newVisitors: number;
      returningVisitors: number;
      avgDuration: number;
      avgPagesPerSession: number;
    };
    engagement: {
      avgScrollDepth: number;
      avgTimeOnPage: number;
      bounceRate: number;
      completionRate: number;
    };
    topArticles: Array<{
      articleId: string;
      title: string;
      views: number;
      avgTimeOnPage: number;
      engagementScore: number;
    }>;
    topCategories: Array<{
      categoryId: string;
      name: string;
      views: number;
      avgEngagement: number;
    }>;
  }>;
  
  getArticleHeatmap(articleId: string): Promise<Array<{
    sectionIndex: number;
    avgDwellTime: number;
    avgScrollDepth: number;
    heatScore: number;
    viewCount: number;
  }>>;
  
  getNavigationPaths(range: string, limit: number): Promise<Array<{
    fromPage: string;
    toPage: string;
    count: number;
    avgDwellTime: number;
  }>>;
  
  getTrafficSourcesAnalytics(range: string): Promise<{
    byType: Array<{ type: string; count: number; percentage: number }>;
    bySocial: Array<{ platform: string; count: number; percentage: number }>;
    byReferrer: Array<{ domain: string; count: number; percentage: number }>;
  }>;
  
  getPeakHoursAnalytics(range: string): Promise<{
    hourly: Array<{ hour: number; count: number; avgEngagement: number }>;
    daily: Array<{ day: string; count: number; avgEngagement: number }>;
  }>;
  
  getRealTimeMetrics(): Promise<{
    activeUsers: number;
    currentPageViews: number;
    topCurrentArticles: Array<{ articleId: string; title: string; viewers: number }>;
    recentEvents: Array<{ type: string; count: number; trend: number }>;
  }>;
  
  getTopEngagementScores(limit: number, sortBy: string): Promise<Array<{
    articleId: string;
    title: string;
    overallScore: number;
    engagementRate: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    uniqueVisitors: number;
  }>>;
  
  getCategoryAnalytics(range: string): Promise<Array<{
    categoryId: string;
    name: string;
    articleCount: number;
    totalViews: number;
    avgEngagement: number;
    topArticle: string | null;
  }>>;
  
  getDeviceAnalytics(range: string): Promise<{
    byDevice: Array<{ device: string; count: number; percentage: number }>;
    byPlatform: Array<{ platform: string; count: number; percentage: number }>;
    byBrowser: Array<{ browser: string; count: number; percentage: number }>;
  }>;
  
  getArticleEngagementDetails(articleId: string): Promise<{
    score: number | null;
    metrics: {
      avgTimeOnPage: number;
      avgScrollDepth: number;
      bounceRate: number;
      shareCount: number;
      commentCount: number;
      reactionCount: number;
      bookmarkCount: number;
      uniqueVisitors: number;
      returningVisitors: number;
    };
    peakHour: number | null;
    topReferrer: string | null;
    topDevice: string | null;
  }>;
  
  calculateArticleEngagementScore(articleId: string): Promise<void>;
  calculateAllEngagementScores(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // In-memory cache for iFox category mapping
  private ifoxCategoryMapCache: Record<string, string> | null = null;
  private ifoxCategoryMapCacheTime: number = 0;
  private readonly CATEGORY_MAP_CACHE_TTL = 1000 * 60 * 60; // 1 hour

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

  async getOrCreateSystemUser(): Promise<User> {
    const SYSTEM_EMAIL = "system@sabq.sa";
    const SYSTEM_ID = "email-agent-system";
    
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, SYSTEM_EMAIL));
    
    if (existingUser) {
      return existingUser;
    }
    
    console.log("[Storage] Creating Email Agent System User...");
    
    const [newUser] = await db
      .insert(users)
      .values({
        id: SYSTEM_ID,
        email: SYSTEM_EMAIL,
        firstName: "Email Agent",
        lastName: "System",
        role: "reporter",
        status: "active",
        emailVerified: true,
        isProfileComplete: true,
        allowedLanguages: ["ar", "en", "ur"],
        authProvider: "local",
      })
      .returning();
    
    console.log("[Storage] Email Agent System User created:", newUser.id);
    return newUser;
  }

  async getOrCreateReporterUser(email: string, name: string): Promise<User> {
    console.log("[Storage] 👤 Getting or creating reporter user:", email);
    
    // Try to find existing user by email
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (existingUser) {
      console.log("[Storage] ✅ Reporter user already exists:", existingUser.id);
      return existingUser;
    }
    
    console.log("[Storage] 📝 Creating new reporter user:", email);
    
    // Parse name into first and last name (with safe fallback)
    const safeName = (name || "Reporter").trim() || "Reporter";
    const nameParts = safeName.split(/\s+/);
    const firstName = nameParts[0] || "Reporter";
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    // Create new user as reporter
    const userId = nanoid();
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        email,
        firstName,
        lastName,
        role: "reporter",
        status: "active",
        emailVerified: true,
        isProfileComplete: true,
        allowedLanguages: ["ar", "en", "ur"],
        authProvider: "local",
      })
      .returning();
    
    console.log("[Storage] ✅ Reporter user created successfully:", newUser.id);
    return newUser;
  }

  // Admin user management operations
  async getUsersWithStats(params: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
    verificationBadge?: string;
    emailVerified?: boolean;
    searchQuery?: string;
    hasRejectedComments?: boolean;
    activityDays?: number;
  }): Promise<{
    users: (User & {
      commentCount: number;
      articleCount: number;
      totalPoints: number;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      role,
      verificationBadge,
      emailVerified,
      searchQuery,
      hasRejectedComments,
      activityDays,
    } = params;

    const conditions = [];

    // Filter by status
    if (status) {
      conditions.push(eq(users.status, status));
    }

    // Filter by role
    if (role) {
      conditions.push(eq(users.role, role));
    }

    // Filter by verification badge
    if (verificationBadge) {
      conditions.push(eq(users.verificationBadge, verificationBadge));
    }

    // Filter by email verified
    if (emailVerified !== undefined) {
      conditions.push(eq(users.emailVerified, emailVerified));
    }

    // Filter by activity
    if (activityDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - activityDays);
      conditions.push(gte(users.lastActivityAt, cutoffDate));
    }

    // Exclude soft-deleted users
    conditions.push(isNull(users.deletedAt));

    // Search query
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(users.email, searchPattern),
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern),
          ilike(users.phoneNumber, searchPattern)
        )
      );
    }

    // Count total
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult?.count || 0);
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get users with stats
    const userResults = await db
      .select({
        user: users,
        articleCount: sql<number>`count(distinct ${articles.id})`,
        totalPoints: sql<number>`coalesce(${userPointsTotal.totalPoints}, 0)`,
      })
      .from(users)
      .leftJoin(articles, eq(articles.authorId, users.id))
      .leftJoin(userPointsTotal, eq(userPointsTotal.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const usersWithStats = userResults.map((r) => ({
      ...r.user,
      articleCount: Number(r.articleCount),
      totalPoints: Number(r.totalPoints),
    }));

    return {
      users: usersWithStats,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getUserKPIs(): Promise<{
    total: number;
    emailVerified: number;
    unverified: number;
    suspended: number;
    banned: number;
    newToday: number;
    newThisWeek: number;
    active24h: number;
    trends: {
      emailVerifiedTrend: number;
      unverifiedTrend: number;
      suspendedTrend: number;
      bannedTrend: number;
      newUsersTrend: number;
      activeUsersTrend: number;
    };
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Current stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        emailVerified: sql<number>`count(*) filter (where ${users.emailVerified} = true)`,
        unverified: sql<number>`count(*) filter (where ${users.emailVerified} = false)`,
        suspended: sql<number>`count(*) filter (where ${users.status} = 'suspended')`,
        banned: sql<number>`count(*) filter (where ${users.status} = 'banned')`,
        newToday: sql<number>`count(*) filter (where ${users.createdAt} >= ${today})`,
        newThisWeek: sql<number>`count(*) filter (where ${users.createdAt} >= ${weekAgo})`,
        active24h: sql<number>`count(*) filter (where ${users.lastActivityAt} >= ${yesterday})`,
      })
      .from(users)
      .where(isNull(users.deletedAt));

    // Previous week stats for trends
    const [prevWeekStats] = await db
      .select({
        emailVerified: sql<number>`count(*) filter (where ${users.emailVerified} = true)`,
        unverified: sql<number>`count(*) filter (where ${users.emailVerified} = false)`,
        suspended: sql<number>`count(*) filter (where ${users.status} = 'suspended')`,
        banned: sql<number>`count(*) filter (where ${users.status} = 'banned')`,
        newUsers: sql<number>`count(*) filter (where ${users.createdAt} >= ${twoWeeksAgo} and ${users.createdAt} < ${weekAgo})`,
        activeUsers: sql<number>`count(*) filter (where ${users.lastActivityAt} >= ${twoWeeksAgo} and ${users.lastActivityAt} < ${weekAgo})`,
      })
      .from(users)
      .where(isNull(users.deletedAt));

    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      total: Number(stats.total),
      emailVerified: Number(stats.emailVerified),
      unverified: Number(stats.unverified),
      suspended: Number(stats.suspended),
      banned: Number(stats.banned),
      newToday: Number(stats.newToday),
      newThisWeek: Number(stats.newThisWeek),
      active24h: Number(stats.active24h),
      trends: {
        emailVerifiedTrend: calculateTrend(Number(stats.emailVerified), Number(prevWeekStats.emailVerified)),
        unverifiedTrend: calculateTrend(Number(stats.unverified), Number(prevWeekStats.unverified)),
        suspendedTrend: calculateTrend(Number(stats.suspended), Number(prevWeekStats.suspended)),
        bannedTrend: calculateTrend(Number(stats.banned), Number(prevWeekStats.banned)),
        newUsersTrend: calculateTrend(Number(stats.newThisWeek), Number(prevWeekStats.newUsers)),
        activeUsersTrend: calculateTrend(Number(stats.active24h), Number(prevWeekStats.activeUsers)),
      },
    };
  }

  async suspendUser(userId: string, reason: string, duration?: number): Promise<User> {
    const suspendedUntil = duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null;

    const [user] = await db
      .update(users)
      .set({
        status: 'suspended',
        suspendedUntil,
        suspensionReason: reason,
        bannedUntil: null,
        banReason: null,
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async unsuspendUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        status: 'active',
        suspendedUntil: null,
        suspensionReason: null,
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async banUser(userId: string, reason: string, isPermanent: boolean, duration?: number): Promise<User> {
    const bannedUntil = isPermanent || !duration
      ? null
      : new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    const [user] = await db
      .update(users)
      .set({
        status: 'banned',
        bannedUntil,
        banReason: reason,
        suspendedUntil: null,
        suspensionReason: null,
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async unbanUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        status: 'active',
        bannedUntil: null,
        banReason: null,
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async updateVerificationBadge(userId: string, badge: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ verificationBadge: badge })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async softDeleteUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        status: 'deleted',
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async restoreUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        deletedAt: null,
        status: 'active',
        suspendedUntil: null,
        suspensionReason: null,
        bannedUntil: null,
        banReason: null,
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async bulkSuspendUsers(userIds: string[], reason: string, duration?: number): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.suspendUser(userId, reason, duration);
        success++;
      } catch (error) {
        console.error(`Failed to suspend user ${userId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async bulkBanUsers(userIds: string[], reason: string, isPermanent: boolean, duration?: number): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.banUser(userId, reason, isPermanent, duration);
        success++;
      } catch (error) {
        console.error(`Failed to ban user ${userId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async bulkUpdateUserRole(userIds: string[], role: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.updateUserRole(userId, role);
        success++;
      } catch (error) {
        console.error(`Failed to update role for user ${userId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  // RBAC operations (Role-Based Access Control)
  async createUserWithRoles(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    roleIds: string[];
    status?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  }, createdBy: string): Promise<{ user: User; temporaryPassword: string }> {
    const userId = nanoid();
    // توليد كلمة مرور عشوائية فريدة لكل مستخدم
    const randomPassword = `Temp${nanoid(12)}@${new Date().getFullYear()}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const user = await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        id: userId,
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        status: userData.status || 'active',
        emailVerified: userData.emailVerified || false,
        phoneVerified: userData.phoneVerified || false,
        role: 'reader',
        isProfileComplete: true,
      }).returning();

      if (userData.roleIds && userData.roleIds.length > 0) {
        await tx.insert(userRoles).values(
          userData.roleIds.map(roleId => ({
            id: nanoid(),
            userId,
            roleId,
          }))
        );
      }

      await tx.insert(activityLogs).values({
        id: nanoid(),
        userId: createdBy,
        action: 'user_created',
        entityType: 'user',
        entityId: userId,
        newValue: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleIds: userData.roleIds,
        },
      });

      return user;
    });

    return { user, temporaryPassword: randomPassword };
  }

  async getUserRoles(userId: string): Promise<Array<{ id: string; name: string; nameAr: string }>> {
    const results = await db
      .select({
        id: roles.id,
        name: roles.name,
        nameAr: roles.nameAr,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return results;
  }

  async updateUserRoles(userId: string, roleIds: string[], updatedBy: string, reason?: string): Promise<void> {
    await db.transaction(async (tx) => {
      const oldRoles = await tx
        .select({
          id: roles.id,
          name: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      await tx.delete(userRoles).where(eq(userRoles.userId, userId));

      if (roleIds && roleIds.length > 0) {
        await tx.insert(userRoles).values(
          roleIds.map(roleId => ({
            id: nanoid(),
            userId,
            roleId,
          }))
        );
      }

      const newRoles = await tx
        .select({
          id: roles.id,
          name: roles.name,
        })
        .from(roles)
        .where(inArray(roles.id, roleIds));

      await tx.insert(activityLogs).values({
        id: nanoid(),
        userId: updatedBy,
        action: 'roles_updated',
        entityType: 'user',
        entityId: userId,
        oldValue: {
          roleIds: oldRoles.map(r => r.id),
          roleNames: oldRoles.map(r => r.name),
        },
        newValue: {
          roleIds: newRoles.map(r => r.id),
          roleNames: newRoles.map(r => r.name),
        },
        metadata: reason ? { reason } : undefined,
      });
    });
  }

  async getAllRoles(): Promise<Array<{ id: string; name: string; nameAr: string; description: string | null; isSystem: boolean }>> {
    return await db
      .select({
        id: roles.id,
        name: roles.name,
        nameAr: roles.nameAr,
        description: roles.description,
        isSystem: roles.isSystem,
      })
      .from(roles)
      .orderBy(roles.nameAr);
  }

  async getRolePermissions(roleId: string): Promise<Array<{ code: string; label: string; labelAr: string; module: string }>> {
    const results = await db
      .select({
        code: permissions.code,
        label: permissions.label,
        labelAr: permissions.labelAr,
        module: permissions.module,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return results;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const results = await db
      .select({
        code: permissions.code,
      })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId))
      .groupBy(permissions.code);

    return results.map(r => r.code);
  }

  async logActivity(activity: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await db.insert(activityLogs).values({
      id: nanoid(),
      userId: activity.userId,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      metadata: activity.metadata,
    });
  }

  // Category operations
  async getAllCategories(options?: { excludeIfox?: boolean }): Promise<Category[]> {
    if (options?.excludeIfox) {
      return await db.select().from(categories)
        .where(eq(categories.isIfoxCategory, false))
        .orderBy(categories.displayOrder);
    }
    return await db.select().from(categories).orderBy(categories.displayOrder);
  }

  async getCategoriesWithStats(): Promise<Array<Category & {
    articleCount: number;
    totalViews: number;
    totalLikes: number;
    totalBookmarks: number;
  }>> {
    const results = await db
      .select({
        category: categories,
        articleCount: sql<number>`cast(count(distinct ${articles.id}) as int)`,
        totalViews: sql<number>`cast(coalesce(sum(${articles.views}), 0) as int)`,
        totalLikes: sql<number>`cast(count(distinct ${reactions.id}) as int)`,
        totalBookmarks: sql<number>`cast(count(distinct ${bookmarks.id}) as int)`,
      })
      .from(categories)
      .leftJoin(articles, and(
        eq(articles.categoryId, categories.id),
        eq(articles.status, 'published')
      ))
      .leftJoin(reactions, eq(reactions.articleId, articles.id))
      .leftJoin(bookmarks, eq(bookmarks.articleId, articles.id))
      .groupBy(categories.id)
      .orderBy(categories.displayOrder, categories.nameAr);

    return results.map(r => ({
      ...r.category,
      articleCount: r.articleCount,
      totalViews: r.totalViews,
      totalLikes: r.totalLikes,
      totalBookmarks: r.totalBookmarks,
    }));
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values([category]).returning();
    return created;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: new Date() })
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
    userRole?: string;
    includeAI?: boolean; // New parameter to explicitly include AI articles
  }): Promise<ArticleWithDetails[]> {
    // Security: Check authorization BEFORE applying status filter
    const isAuthorized = filters?.userRole === 'system_admin' || 
                        filters?.userRole === 'admin' || 
                        filters?.userRole === 'editor';

    // CRITICAL SECURITY: Prevent unauthorized access to archived articles
    if (filters?.status === 'archived' && !isAuthorized) {
      console.warn(`[SECURITY] Unauthorized attempt to access archived articles - UserRole: ${filters.userRole || 'unauthenticated'}`);
      return []; // Early return: no results for unauthorized archived requests
    }

    const conditions = [];

    if (filters?.categoryId) {
      conditions.push(eq(articles.categoryId, filters.categoryId));
    }

    if (filters?.status) {
      conditions.push(eq(articles.status, filters.status));
    } else {
      // Default to published articles only
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

    // Exclude opinion articles from regular news feeds
    conditions.push(
      or(
        isNull(articles.articleType),
        ne(articles.articleType, 'opinion')
      )
    );

    // IMPORTANT: Exclude AI/iFox articles from regular news feed unless explicitly requested
    if (!filters?.includeAI) {
      // Exclude articles from iFox/AI categories using the isIfoxCategory flag
      const ifoxCategories = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.isIfoxCategory, true));
      
      const ifoxCategoryIds = ifoxCategories.map(c => c.id);
      
      if (ifoxCategoryIds.length > 0) {
        conditions.push(
          or(
            isNull(articles.categoryId),
            not(inArray(articles.categoryId, ifoxCategoryIds))
          )
        );
      }
    }

    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(articles.displayOrder), desc(articles.publishedAt), desc(articles.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
    }));
  }

  async getArticleBySlug(slug: string, userId?: string, userRole?: string): Promise<ArticleWithDetails | undefined> {
    const reporterAlias = aliasedTable(users, 'reporter');
    const reporterStaffAlias = aliasedTable(staff, 'reporterStaff');
    
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
        staffMember: {
          id: staff.id,
          nameAr: staff.nameAr,
          slug: staff.slug,
          profileImage: staff.profileImage,
          isVerified: staff.isVerified,
        },
        reporterStaffMember: {
          id: reporterStaffAlias.id,
          nameAr: reporterStaffAlias.nameAr,
          slug: reporterStaffAlias.slug,
          profileImage: reporterStaffAlias.profileImage,
          isVerified: reporterStaffAlias.isVerified,
        },
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .leftJoin(staff, eq(staff.userId, users.id))
      .leftJoin(reporterStaffAlias, eq(reporterStaffAlias.userId, reporterAlias.id))
      .where(eq(articles.slug, slug));

    if (results.length === 0) return undefined;

    const result = results[0];
    const article = result.article;

    // Security: Prevent access to archived articles for non-admin/editor users
    if (article.status === 'archived') {
      const isAuthorized = userRole === 'system_admin' || userRole === 'admin' || userRole === 'editor';
      if (!isAuthorized) {
        console.warn(`[SECURITY] Archived article access denied - Article: ${article.slug}, UserRole: ${userRole || 'unauthenticated'}, UserId: ${userId || 'none'}`);
        return undefined; // Hide archived articles from regular users
      }
    }

    // Run all queries in parallel for better performance
    const [
      bookmarkResult,
      reactionResult,
      reactionsCountResult
    ] = await Promise.all([
      userId ? db.select().from(bookmarks)
        .where(and(eq(bookmarks.articleId, article.id), eq(bookmarks.userId, userId)))
        .limit(1) : Promise.resolve([]),
      userId ? db.select().from(reactions)
        .where(and(eq(reactions.articleId, article.id), eq(reactions.userId, userId)))
        .limit(1) : Promise.resolve([]),
      db.select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.articleId, article.id))
    ]);

    const isBookmarked = bookmarkResult.length > 0;
    const hasReacted = reactionResult.length > 0;
    const reactionsCount = Number(reactionsCountResult[0].count);

    return {
      ...article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
      opinionAuthor: article.articleType === 'opinion' ? result.author : undefined,
      staff: result.reporterStaffMember?.id ? result.reporterStaffMember : (result.staffMember?.id ? result.staffMember : undefined),
      isBookmarked,
      hasReacted,
      reactionsCount,
    };
  }

  async getArticleById(id: string, userId?: string): Promise<ArticleWithDetails | undefined> {
    const reporterAlias = aliasedTable(users, 'reporter');
    const reporterStaffAlias = aliasedTable(staff, 'reporterStaff');
    
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
        staffMember: {
          id: staff.id,
          nameAr: staff.nameAr,
          slug: staff.slug,
          profileImage: staff.profileImage,
          isVerified: staff.isVerified,
        },
        reporterStaffMember: {
          id: reporterStaffAlias.id,
          nameAr: reporterStaffAlias.nameAr,
          slug: reporterStaffAlias.slug,
          profileImage: reporterStaffAlias.profileImage,
          isVerified: reporterStaffAlias.isVerified,
        },
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .leftJoin(staff, eq(staff.userId, users.id))
      .leftJoin(reporterStaffAlias, eq(reporterStaffAlias.userId, reporterAlias.id))
      .where(eq(articles.id, id));

    if (results.length === 0) return undefined;

    const result = results[0];
    const article = result.article;

    // Run all queries in parallel for better performance
    const [
      bookmarkResult,
      reactionResult,
      reactionsCountResult
    ] = await Promise.all([
      userId ? db.select().from(bookmarks)
        .where(and(eq(bookmarks.articleId, article.id), eq(bookmarks.userId, userId)))
        .limit(1) : Promise.resolve([]),
      userId ? db.select().from(reactions)
        .where(and(eq(reactions.articleId, article.id), eq(reactions.userId, userId)))
        .limit(1) : Promise.resolve([]),
      db.select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.articleId, article.id))
    ]);

    const isBookmarked = bookmarkResult.length > 0;
    const hasReacted = reactionResult.length > 0;
    const reactionsCount = Number(reactionsCountResult[0].count);

    return {
      ...article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
      opinionAuthor: article.articleType === 'opinion' ? result.author : undefined,
      staff: result.reporterStaffMember?.id ? result.reporterStaffMember : (result.staffMember?.id ? result.staffMember : undefined),
      isBookmarked,
      hasReacted,
      reactionsCount,
    };
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [created] = await db.insert(articles).values([article as any]).returning();
    return created;
  }

  async updateArticle(id: string, articleData: Partial<InsertArticle>): Promise<Article> {
    const updateData: any = { ...articleData, updatedAt: new Date() };
    const [updated] = await db
      .update(articles)
      .set(updateData)
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

  async updateArticlesOrder(articleOrders: Array<{ id: string; displayOrder: number }>): Promise<void> {
    for (const { id, displayOrder } of articleOrders) {
      await db
        .update(articles)
        .set({ displayOrder, updatedAt: new Date() })
        .where(eq(articles.id, id));
    }
  }

  async getFeaturedArticle(userId?: string): Promise<ArticleWithDetails | undefined> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    // Get AI category IDs to exclude
    const aiCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        inArray(categories.slug, ['ai-news', 'ai-insights', 'ai-opinions', 'ai-tools', 'ai-voice'])
      );
    
    const aiCategoryIds = aiCategories.map(c => c.id);
    
    const baseConditions = [
      eq(articles.status, "published"),
      or(
        isNull(articles.articleType),
        ne(articles.articleType, 'opinion')
      )
    ];
    
    // Exclude AI articles
    if (aiCategoryIds.length > 0) {
      baseConditions.push(
        or(
          isNull(articles.categoryId),
          not(inArray(articles.categoryId, aiCategoryIds))
        )
      );
    }
    
    // First, try to get an article explicitly marked as featured
    const featuredConditions = [...baseConditions, eq(articles.isFeatured, true)];
    
    let results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(and(...featuredConditions))
      .orderBy(desc(articles.displayOrder), desc(articles.publishedAt))
      .limit(1);

    // If no explicitly featured article, fall back to most viewed
    if (results.length === 0) {
      results = await db
        .select({
          article: articles,
          category: categories,
          author: users,
          reporter: reporterAlias,
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
        .where(and(...baseConditions))
        .orderBy(desc(articles.views), desc(articles.publishedAt))
        .limit(1);
    }

    if (results.length === 0) return undefined;

    const result = results[0];
    return {
      ...result.article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
    };
  }

  async getRelatedArticles(articleId: string, categoryId?: string): Promise<ArticleWithDetails[]> {
    const conditions = [
      eq(articles.status, "published"),
      ne(articles.id, articleId),
      or(
        isNull(articles.articleType),
        ne(articles.articleType, 'opinion')
      ),
    ];

    if (categoryId) {
      conditions.push(eq(articles.categoryId, categoryId));
    }

    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(and(...conditions))
      .orderBy(desc(articles.displayOrder), desc(articles.publishedAt))
      .limit(5);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
    }));
  }

  async getArticlesMetrics(): Promise<{ published: number; scheduled: number; draft: number; archived: number }> {
    const now = new Date();

    const [publishedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.status, 'published'));

    const [scheduledResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(
        eq(articles.status, 'scheduled'),
        gte(articles.scheduledAt, now)
      ));

    const [draftResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.status, 'draft'));

    const [archivedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.status, 'archived'));

    return {
      published: Number(publishedResult.count),
      scheduled: Number(scheduledResult.count),
      draft: Number(draftResult.count),
      archived: Number(archivedResult.count),
    };
  }

  async archiveArticle(id: string, userId: string): Promise<Article> {
    const [updated] = await db
      .update(articles)
      .set({ 
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    
    return updated;
  }

  async restoreArticle(id: string, userId: string): Promise<Article> {
    const [updated] = await db
      .update(articles)
      .set({ 
        status: 'draft',
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    
    return updated;
  }

  async toggleArticleBreaking(id: string, userId: string): Promise<Article> {
    const article = await this.getArticleById(id);
    if (!article) {
      throw new Error('Article not found');
    }

    const newNewsType = article.newsType === 'breaking' ? 'regular' : 'breaking';
    
    const [updated] = await db
      .update(articles)
      .set({ 
        newsType: newNewsType,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    
    return updated;
  }

  async getNewsStatistics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total news (exclude opinion articles)
    const totalNews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          ne(articles.articleType, "opinion")
        )
      );

    // Today's news
    const todayNews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          ne(articles.articleType, "opinion"),
          gte(articles.publishedAt, todayStart)
        )
      );

    // Average views
    const avgViews = await db
      .select({ avg: sql<number>`COALESCE(AVG(views), 0)::int` })
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          ne(articles.articleType, "opinion")
        )
      );

    // Top viewed this week
    const topArticle = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(
        and(
          eq(articles.status, "published"),
          ne(articles.articleType, "opinion"),
          gte(articles.publishedAt, weekStart)
        )
      )
      .orderBy(desc(articles.views))
      .limit(1);

    const topArticleDetails = topArticle[0]
      ? {
          ...topArticle[0].articles,
          author: topArticle[0].users || undefined,
          category: topArticle[0].categories || undefined,
        }
      : null;

    return {
      totalNews: totalNews[0]?.count ?? 0,
      todayNews: todayNews[0]?.count ?? 0,
      topViewedThisWeek: {
        article: topArticleDetails,
        views: topArticleDetails?.views ?? 0,
      },
      averageViews: Math.round(avgViews[0]?.avg ?? 0),
    };
  }

  // SEO operations
  async getArticleForSeo(id: string, language: "ar" | "en" | "ur"): Promise<{
    id: string;
    title: string;
    subtitle?: string | null;
    content: string;
    excerpt?: string | null;
  } | undefined> {
    const table = language === "ar" ? articles : language === "en" ? enArticles : urArticles;
    
    const [article] = await db
      .select({
        id: table.id,
        title: table.title,
        subtitle: table.subtitle,
        content: table.content,
        excerpt: table.excerpt,
      })
      .from(table)
      .where(eq(table.id, id))
      .limit(1);

    return article;
  }

  async saveSeoMetadata(
    articleId: string,
    language: "ar" | "en" | "ur",
    seo: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      socialTitle?: string;
      socialDescription?: string;
      imageAltText?: string;
      ogImageUrl?: string;
    },
    metadata: {
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
    }
  ): Promise<void> {
    const table = language === "ar" ? articles : language === "en" ? enArticles : urArticles;
    
    await db
      .update(table)
      .set({
        seo,
        seoMetadata: metadata,
        updatedAt: new Date(),
      })
      .where(eq(table.id, articleId));
  }

  async createSeoHistoryEntry(params: {
    articleId: string;
    language: "ar" | "en" | "ur";
    seoContent: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      socialTitle?: string;
      socialDescription?: string;
      imageAltText?: string;
      ogImageUrl?: string;
    };
    seoMetadata: {
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
    };
    provider: string;
    model: string;
    generatedBy: string;
  }): Promise<void> {
    // Get the latest version for this article and language
    const [latestHistory] = await db
      .select({ version: articleSeoHistory.version })
      .from(articleSeoHistory)
      .where(
        and(
          eq(articleSeoHistory.articleId, params.articleId),
          eq(articleSeoHistory.language, params.language)
        )
      )
      .orderBy(desc(articleSeoHistory.version))
      .limit(1);

    const nextVersion = latestHistory ? latestHistory.version + 1 : 1;

    await db.insert(articleSeoHistory).values({
      id: nanoid(),
      articleId: params.articleId,
      language: params.language,
      seoContent: params.seoContent,
      seoMetadata: params.seoMetadata,
      version: nextVersion,
      provider: params.provider,
      model: params.model,
      generatedBy: params.generatedBy,
    });
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

  // Process scheduled announcements (auto-publish and auto-expire)
  async processScheduledAnnouncements(): Promise<void> {
    // Placeholder implementation to prevent crashes
    console.log("[AnnouncementScheduler] Processing scheduled announcements...");
  }

  // Get expired pending WhatsApp messages
  async getExpiredPendingMessages(): Promise<PendingWhatsappMessage[]> {
    // Placeholder implementation to prevent crashes
    return [];
  }

}

export const storage = new DatabaseStorage();
