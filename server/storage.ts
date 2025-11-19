// Reference: javascript_database blueprint + javascript_log_in_with_replit blueprint
import { db } from "./db";
import { eq, desc, asc, sql, and, or, inArray, ne, gte, lt, lte, isNull, isNotNull, ilike, count } from "drizzle-orm";
import { alias as aliasedTable } from "drizzle-orm/pg-core";
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { notificationBus } from "./notificationBus";
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
  enComments,
  enBookmarks,
  enReactions,
  enReadingHistory,
  urArticles,
  urCategories,
  urComments,
  urBookmarks,
  urReactions,
  urReadingHistory,
  urSmartBlocks,
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
  type DeepAnalysis,
  type InsertDeepAnalysis,
  type NotificationInbox,
  type InsertNotificationInbox,
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
  type Angle,
  type InsertAngle,
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
  type UrComment,
  type InsertUrComment,
  type UrReaction,
  type InsertUrReaction,
  type UrBookmark,
  type InsertUrBookmark,
  type UrReadingHistory,
  type InsertUrReadingHistory,
  type UrArticleWithDetails,
  type UrCommentWithUser,
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
  taskComments,
  taskAttachments,
  taskActivityLog,
  type Task,
  type InsertTask,
  type Subtask,
  type InsertSubtask,
  type TaskComment,
  type InsertTaskComment,
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
  type WhatsappToken,
  type InsertWhatsappToken,
  type WhatsappWebhookLog,
  type InsertWhatsappWebhookLog,
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
  
  // Comment operations
  getCommentsByArticle(articleId: string, showPending?: boolean): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  getAllComments(filters?: { status?: string; articleId?: string }): Promise<CommentWithUser[]>;
  approveComment(commentId: string, moderatorId: string): Promise<Comment>;
  rejectComment(commentId: string, moderatorId: string, reason?: string): Promise<Comment>;
  restoreComment(commentId: string): Promise<Comment>;
  
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
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<ArticleWithDetails[]>;
  
  // Muqtarib Angles operations
  getSectionBySlug(slug: string): Promise<Section | undefined>;
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
    recentArticles: ArticleWithDetails[];
    recentComments: CommentWithUser[];
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
  
  // Urdu Comments
  getUrArticleComments(articleId: string): Promise<UrCommentWithUser[]>;
  createUrComment(comment: InsertUrComment): Promise<UrComment>;
  updateUrComment(id: string, updates: Partial<InsertUrComment>): Promise<UrComment>;
  deleteUrComment(id: string): Promise<void>;
  
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
    comments: (TaskComment & { user: User })[];
    attachments: TaskAttachment[];
  } | null>;
  
  // Subtask Operations
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  getSubtaskById(id: string): Promise<Subtask | null>;
  updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask>;
  deleteSubtask(id: string): Promise<void>;
  toggleSubtaskComplete(id: string, completedById: string): Promise<Subtask>;
  
  // Task Comment Operations
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskCommentById(id: string): Promise<TaskComment | null>;
  getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]>;
  deleteTaskComment(id: string): Promise<void>;
  
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
        commentCount: sql<number>`count(distinct ${comments.id})`,
        articleCount: sql<number>`count(distinct ${articles.id})`,
        totalPoints: sql<number>`coalesce(${userPointsTotal.totalPoints}, 0)`,
      })
      .from(users)
      .leftJoin(comments, eq(comments.userId, users.id))
      .leftJoin(articles, eq(articles.authorId, users.id))
      .leftJoin(userPointsTotal, eq(userPointsTotal.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const usersWithStats = userResults.map((r) => ({
      ...r.user,
      commentCount: Number(r.commentCount),
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
  async getAllCategories(): Promise<Category[]> {
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

    // Exclude opinion articles from regular news feeds
    conditions.push(
      or(
        isNull(articles.articleType),
        ne(articles.articleType, 'opinion')
      )
    );

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
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt));

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
      const isAuthorized = userRole === 'admin' || userRole === 'editor';
      if (!isAuthorized) {
        console.warn(`[SECURITY] Archived article access denied - Article: ${article.slug}, UserRole: ${userRole || 'unauthenticated'}, UserId: ${userId || 'none'}`);
        return undefined; // Hide archived articles from regular users
      }
    }

    // Run all queries in parallel for better performance
    const [
      bookmarkResult,
      reactionResult,
      reactionsCountResult,
      commentsCountResult
    ] = await Promise.all([
      userId ? db.select().from(bookmarks)
        .where(and(eq(bookmarks.articleId, article.id), eq(bookmarks.userId, userId)))
        .limit(1) : Promise.resolve([]),
      userId ? db.select().from(reactions)
        .where(and(eq(reactions.articleId, article.id), eq(reactions.userId, userId)))
        .limit(1) : Promise.resolve([]),
      db.select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.articleId, article.id)),
      db.select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.articleId, article.id))
    ]);

    const isBookmarked = bookmarkResult.length > 0;
    const hasReacted = reactionResult.length > 0;
    const reactionsCount = Number(reactionsCountResult[0].count);
    const commentsCount = Number(commentsCountResult[0].count);

    return {
      ...article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
      opinionAuthor: article.articleType === 'opinion' ? result.author : undefined,
      staff: result.reporterStaffMember?.id ? result.reporterStaffMember : (result.staffMember?.id ? result.staffMember : undefined),
      isBookmarked,
      hasReacted,
      reactionsCount,
      commentsCount,
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
      reactionsCountResult,
      commentsCountResult
    ] = await Promise.all([
      userId ? db.select().from(bookmarks)
        .where(and(eq(bookmarks.articleId, article.id), eq(bookmarks.userId, userId)))
        .limit(1) : Promise.resolve([]),
      userId ? db.select().from(reactions)
        .where(and(eq(reactions.articleId, article.id), eq(reactions.userId, userId)))
        .limit(1) : Promise.resolve([]),
      db.select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.articleId, article.id)),
      db.select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.articleId, article.id))
    ]);

    const isBookmarked = bookmarkResult.length > 0;
    const hasReacted = reactionResult.length > 0;
    const reactionsCount = Number(reactionsCountResult[0].count);
    const commentsCount = Number(commentsCountResult[0].count);

    return {
      ...article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
      opinionAuthor: article.articleType === 'opinion' ? result.author : undefined,
      staff: result.reporterStaffMember?.id ? result.reporterStaffMember : (result.staffMember?.id ? result.staffMember : undefined),
      isBookmarked,
      hasReacted,
      reactionsCount,
      commentsCount,
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
      .where(
        and(
          eq(articles.status, "published"),
          or(
            isNull(articles.articleType),
            ne(articles.articleType, 'opinion')
          )
        )
      )
      .orderBy(desc(articles.views), desc(articles.publishedAt))
      .limit(1);

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
      .orderBy(desc(articles.publishedAt))
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

  // Comment operations
  async getCommentsByArticle(articleId: string, showPending: boolean = false): Promise<CommentWithUser[]> {
    const conditions = [eq(comments.articleId, articleId)];
    
    if (!showPending) {
      conditions.push(eq(comments.status, 'approved'));
    }
    
    const results = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(...conditions))
      .orderBy(comments.createdAt);

    const allComments = results.map((r) => ({
      ...r.comment,
      user: r.user!,
      replies: [] as CommentWithUser[],
    }));

    // Build nested structure: organize replies under parent comments
    const commentMap = new Map<string, CommentWithUser>();
    const topLevelComments: CommentWithUser[] = [];

    // First pass: create a map of all comments
    allComments.forEach(comment => {
      commentMap.set(comment.id, comment);
    });

    // Second pass: organize into parent-child relationships
    allComments.forEach(comment => {
      if (comment.parentId) {
        // This is a reply
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(comment);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(comment);
      }
    });

    return topLevelComments;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async getAllComments(filters?: { status?: string; articleId?: string }): Promise<CommentWithUser[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(comments.status, filters.status));
    }
    
    if (filters?.articleId) {
      conditions.push(eq(comments.articleId, filters.articleId));
    }
    
    const results = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(comments.createdAt));

    return results.map((r) => ({
      ...r.comment,
      user: r.user!,
    }));
  }

  async approveComment(commentId: string, moderatorId: string): Promise<Comment> {
    const [updated] = await db
      .update(comments)
      .set({
        status: 'approved',
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();
    
    return updated;
  }

  async rejectComment(commentId: string, moderatorId: string, reason?: string): Promise<Comment> {
    const [updated] = await db
      .update(comments)
      .set({
        status: 'rejected',
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        moderationReason: reason,
      })
      .where(eq(comments.id, commentId))
      .returning();
    
    return updated;
  }

  async restoreComment(commentId: string): Promise<Comment> {
    // First check if comment exists and is rejected
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    
    if (!comment) {
      throw new Error('Comment not found');
    }
    
    if (comment.status !== 'rejected') {
      throw new Error('Only rejected comments can be restored');
    }
    
    const [updated] = await db
      .update(comments)
      .set({
        status: 'pending',
        moderatedBy: null,
        moderatedAt: null,
        moderationReason: null,
      })
      .where(and(
        eq(comments.id, commentId),
        eq(comments.status, 'rejected')
      ))
      .returning();
    
    return updated;
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
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(bookmarks)
      .innerJoin(articles, eq(bookmarks.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      isBookmarked: true,
    }));
  }

  async getUserLikedArticles(userId: string): Promise<ArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(reactions)
      .innerJoin(articles, eq(reactions.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(and(eq(reactions.userId, userId), eq(articles.status, "published")))
      .orderBy(desc(reactions.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
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
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(readingHistory)
      .innerJoin(articles, eq(readingHistory.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.readAt))
      .limit(limit);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
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
      .where(
        and(
          eq(articles.status, "published"),
          inArray(articles.categoryId, categoryIds),
          or(
            isNull(articles.articleType),
            ne(articles.articleType, 'opinion')
          )
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(6);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
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
          a.reporter_id,
          a.article_type,
          a.news_type,
          a.publish_type,
          a.scheduled_at,
          a.status,
          a.hide_from_homepage,
          a.ai_summary,
          a.ai_generated,
          a.is_featured,
          a.views,
          a.seo,
          a.published_at,
          a.created_at,
          a.updated_at,
          a.credibility_score,
          a.credibility_analysis,
          a.credibility_last_updated,
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
          AND a.hide_from_homepage = false
          AND a.id NOT IN (SELECT article_id FROM recently_read_articles)
          AND (a.article_type IS NULL OR a.article_type != 'opinion')
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
      imageFocalPoint: row.image_focal_point || null,
      categoryId: row.category_id,
      authorId: row.author_id,
      reporterId: row.reporter_id,
      articleType: row.article_type,
      newsType: row.news_type,
      publishType: row.publish_type,
      scheduledAt: row.scheduled_at,
      status: row.status,
      reviewStatus: row.review_status || null,
      reviewedBy: row.reviewed_by || null,
      reviewedAt: row.reviewed_at || null,
      reviewNotes: row.review_notes || null,
      hideFromHomepage: row.hide_from_homepage,
      aiSummary: row.ai_summary,
      aiGenerated: row.ai_generated,
      isFeatured: row.is_featured,
      displayOrder: row.display_order || 0,
      views: row.views,
      seo: row.seo,
      seoMetadata: row.seo_metadata || null,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      credibilityScore: row.credibility_score || null,
      credibilityAnalysis: row.credibility_analysis || null,
      credibilityLastUpdated: row.credibility_last_updated || null,
      source: row.source || 'manual',
      sourceMetadata: row.source_metadata || null,
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
        emailVerified: row.author_email_verified || false,
        phoneVerified: row.author_phone_verified || false,
        verificationBadge: row.author_verification_badge || 'none',
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null,
        twoFactorMethod: 'authenticator',
        lastActivityAt: row.author_last_activity_at || null,
        suspendedUntil: row.author_suspended_until || null,
        suspensionReason: row.author_suspension_reason || null,
        bannedUntil: row.author_banned_until || null,
        banReason: row.author_ban_reason || null,
        accountLocked: row.author_account_locked || false,
        lockedUntil: row.author_locked_until || null,
        failedLoginAttempts: row.author_failed_login_attempts || 0,
        deletedAt: row.author_deleted_at || null,
        createdAt: row.author_created_at,
      } : undefined,
    }));
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<ArticleWithDetails[]> {
    console.log(`[Smart Recommendations] Fetching personalized recommendations for user: ${userId}, limit: ${limit}`);
    
    const sanitizedLimit = Math.min(Math.max(limit, 1), 50);
    console.log(`[Smart Recommendations] Sanitized limit: ${sanitizedLimit}`);

    const results = await db.execute(sql`
      WITH user_reading_categories AS (
        SELECT 
          a.category_id,
          COUNT(*) as read_count
        FROM reading_history rh
        INNER JOIN articles a ON rh.article_id = a.id
        WHERE rh.user_id = ${userId}
          AND a.category_id IS NOT NULL
        GROUP BY a.category_id
        ORDER BY read_count DESC
        LIMIT 3
      ),
      user_interest_categories AS (
        SELECT 
          category_id,
          weight
        FROM user_interests
        WHERE user_id = ${userId}
      ),
      user_followed_authors AS (
        SELECT following_id as author_id
        FROM social_follows
        WHERE follower_id = ${userId}
      ),
      user_prefs AS (
        SELECT 
          preferred_categories,
          blocked_categories,
          preferred_authors
        FROM user_preferences
        WHERE user_id = ${userId}
        LIMIT 1
      ),
      already_read_articles AS (
        SELECT article_id
        FROM reading_history
        WHERE user_id = ${userId}
      ),
      scored_articles AS (
        SELECT 
          a.id,
          a.title,
          a.subtitle,
          a.slug,
          a.content,
          a.excerpt,
          a.image_url,
          a.image_focal_point,
          a.category_id,
          a.author_id,
          a.reporter_id,
          a.article_type,
          a.news_type,
          a.publish_type,
          a.scheduled_at,
          a.status,
          a.review_status,
          a.reviewed_by,
          a.reviewed_at,
          a.review_notes,
          a.hide_from_homepage,
          a.ai_summary,
          a.ai_generated,
          a.is_featured,
          a.display_order,
          a.views,
          a.seo,
          a.seo_metadata,
          a.published_at,
          a.created_at,
          a.updated_at,
          a.credibility_score,
          a.credibility_analysis,
          a.credibility_last_updated,
          (
            CASE 
              WHEN a.category_id IN (SELECT category_id FROM user_reading_categories)
                OR a.category_id IN (SELECT category_id FROM user_interest_categories)
                OR (
                  SELECT preferred_categories @> ARRAY[a.category_id]::jsonb
                  FROM user_prefs
                  WHERE preferred_categories IS NOT NULL
                  LIMIT 1
                )
              THEN 10
              ELSE 0
            END
          ) as category_score,
          (
            CASE 
              WHEN a.author_id IN (SELECT author_id FROM user_followed_authors)
                OR a.reporter_id IN (SELECT author_id FROM user_followed_authors)
              THEN 15
              ELSE 0
            END
          ) as author_follow_score,
          (
            CASE 
              WHEN a.published_at > NOW() - INTERVAL '7 days'
              THEN 5
              ELSE 0
            END
          ) as recency_score,
          (
            CASE 
              WHEN a.views > 1000
              THEN 3
              ELSE 0
            END
          ) as high_views_score,
          (
            CASE 
              WHEN a.category_id IN (SELECT category_id FROM user_reading_categories)
                OR a.category_id IN (SELECT category_id FROM user_interest_categories)
                OR (
                  SELECT preferred_categories @> ARRAY[a.category_id]::jsonb
                  FROM user_prefs
                  WHERE preferred_categories IS NOT NULL
                  LIMIT 1
                )
              THEN 10
              ELSE 0
            END
            +
            CASE 
              WHEN a.author_id IN (SELECT author_id FROM user_followed_authors)
                OR a.reporter_id IN (SELECT author_id FROM user_followed_authors)
              THEN 15
              ELSE 0
            END
            +
            CASE 
              WHEN a.published_at > NOW() - INTERVAL '7 days'
              THEN 5
              ELSE 0
            END
            +
            CASE 
              WHEN a.views > 1000
              THEN 3
              ELSE 0
            END
          ) as total_score
        FROM articles a
        WHERE a.status = 'published'
          AND a.hide_from_homepage = false
          AND a.id NOT IN (SELECT article_id FROM already_read_articles)
          AND (
            a.published_at > NOW() - INTERVAL '30 days'
            OR a.views > 10000
          )
          AND NOT EXISTS (
            SELECT 1 FROM user_prefs up
            WHERE up.blocked_categories IS NOT NULL
              AND up.blocked_categories @> ARRAY[a.category_id]::jsonb
          )
        ORDER BY total_score DESC, a.published_at DESC
        LIMIT ${sanitizedLimit}
      )
      SELECT 
        sa.*,
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
        u.email_verified as author_email_verified,
        u.phone_verified as author_phone_verified,
        u.verification_badge as author_verification_badge,
        u.created_at as author_created_at,
        r.id as reporter_id,
        r.email as reporter_email,
        r.first_name as reporter_first_name,
        r.last_name as reporter_last_name,
        r.bio as reporter_bio,
        r.phone_number as reporter_phone_number,
        r.profile_image_url as reporter_profile_image_url,
        r.role as reporter_role,
        r.status as reporter_status,
        r.is_profile_complete as reporter_is_profile_complete,
        r.email_verified as reporter_email_verified,
        r.phone_verified as reporter_phone_verified,
        r.verification_badge as reporter_verification_badge,
        r.created_at as reporter_created_at
      FROM scored_articles sa
      LEFT JOIN categories c ON sa.category_id = c.id
      LEFT JOIN users u ON sa.author_id = u.id
      LEFT JOIN users r ON sa.reporter_id = r.id
      ORDER BY sa.total_score DESC, sa.published_at DESC
    `);

    console.log(`[Smart Recommendations] Found ${results.rows.length} recommendations for user ${userId}`);

    return (results.rows as any[]).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      imageUrl: row.image_url,
      imageFocalPoint: row.image_focal_point || null,
      categoryId: row.category_id,
      authorId: row.author_id,
      reporterId: row.reporter_id,
      articleType: row.article_type,
      newsType: row.news_type,
      publishType: row.publish_type,
      scheduledAt: row.scheduled_at,
      status: row.status,
      reviewStatus: row.review_status || null,
      reviewedBy: row.reviewed_by || null,
      reviewedAt: row.reviewed_at || null,
      reviewNotes: row.review_notes || null,
      hideFromHomepage: row.hide_from_homepage,
      aiSummary: row.ai_summary,
      aiGenerated: row.ai_generated,
      isFeatured: row.is_featured,
      displayOrder: row.display_order || 0,
      views: row.views,
      seo: row.seo,
      seoMetadata: row.seo_metadata || null,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      credibilityScore: row.credibility_score || null,
      credibilityAnalysis: row.credibility_analysis || null,
      credibilityLastUpdated: row.credibility_last_updated || null,
      source: row.source || 'manual',
      sourceMetadata: row.source_metadata || null,
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
        emailVerified: row.author_email_verified || false,
        phoneVerified: row.author_phone_verified || false,
        verificationBadge: row.author_verification_badge || 'none',
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null,
        twoFactorMethod: 'authenticator',
        lastActivityAt: null,
        suspendedUntil: null,
        suspensionReason: null,
        bannedUntil: null,
        banReason: null,
        accountLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
        deletedAt: null,
        authProvider: 'local',
        googleId: null,
        appleId: null,
        firstNameEn: null,
        lastNameEn: null,
        allowedLanguages: ['ar'],
        createdAt: row.author_created_at,
      } : row.reporter_id ? {
        id: row.reporter_id,
        email: row.reporter_email,
        passwordHash: null,
        firstName: row.reporter_first_name,
        lastName: row.reporter_last_name,
        bio: row.reporter_bio,
        phoneNumber: row.reporter_phone_number,
        profileImageUrl: row.reporter_profile_image_url,
        role: row.reporter_role,
        status: row.reporter_status,
        isProfileComplete: row.reporter_is_profile_complete,
        emailVerified: row.reporter_email_verified || false,
        phoneVerified: row.reporter_phone_verified || false,
        verificationBadge: row.reporter_verification_badge || 'none',
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null,
        twoFactorMethod: 'authenticator',
        lastActivityAt: null,
        suspendedUntil: null,
        suspensionReason: null,
        bannedUntil: null,
        banReason: null,
        accountLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
        deletedAt: null,
        authProvider: 'local',
        googleId: null,
        appleId: null,
        firstNameEn: null,
        lastNameEn: null,
        allowedLanguages: ['ar'],
        createdAt: row.reporter_created_at,
      } : undefined,
    }));
  }

  async getHeroArticles(): Promise<ArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        imageFocalPoint: articles.imageFocalPoint,
        categoryId: articles.categoryId,
        authorId: articles.authorId,
        reporterId: articles.reporterId,
        articleType: articles.articleType,
        newsType: articles.newsType,
        aiSummary: articles.aiSummary,
        aiGenerated: articles.aiGenerated,
        isFeatured: articles.isFeatured,
        views: articles.views,
        source: articles.source,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: categories,
        author: users,
        reporter: reporterAlias,
        storyLink: storyLinks,
        story: stories,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .leftJoin(storyLinks, eq(articles.id, storyLinks.articleId))
      .leftJoin(stories, eq(storyLinks.storyId, stories.id))
      .where(
        and(
          eq(articles.status, "published"),
          eq(articles.hideFromHomepage, false),
          or(
            eq(articles.newsType, "breaking"),
            eq(articles.isFeatured, true)
          ),
          or(
            isNull(articles.articleType),
            ne(articles.articleType, 'opinion')
          )
        )
      )
      .orderBy(desc(articles.displayOrder), desc(articles.publishedAt), desc(articles.views))
      .limit(3);

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      content: '', // Excluded for performance - not needed in list view
      excerpt: r.excerpt,
      imageUrl: r.imageUrl,
      imageFocalPoint: r.imageFocalPoint,
      categoryId: r.categoryId,
      authorId: r.authorId,
      reporterId: r.reporterId,
      articleType: r.articleType,
      newsType: r.newsType,
      publishType: 'instant',
      scheduledAt: null,
      status: 'published',
      reviewStatus: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      hideFromHomepage: false,
      aiSummary: r.aiSummary,
      aiGenerated: r.aiGenerated,
      isFeatured: r.isFeatured,
      views: r.views,
      displayOrder: 0,
      seo: null,
      seoMetadata: null,
      credibilityScore: null,
      credibilityAnalysis: null,
      credibilityLastUpdated: null,
      source: r.source || 'manual',
      sourceMetadata: null,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      storyId: r.story?.id || undefined,
      storyTitle: r.story?.title || undefined,
    }));
  }

  async getBreakingNews(limit: number = 5): Promise<ArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        imageFocalPoint: articles.imageFocalPoint,
        categoryId: articles.categoryId,
        authorId: articles.authorId,
        reporterId: articles.reporterId,
        articleType: articles.articleType,
        newsType: articles.newsType,
        aiSummary: articles.aiSummary,
        aiGenerated: articles.aiGenerated,
        isFeatured: articles.isFeatured,
        views: articles.views,
        source: articles.source,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: categories,
        author: users,
        reporter: reporterAlias,
        storyLink: storyLinks,
        story: stories,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .leftJoin(storyLinks, eq(articles.id, storyLinks.articleId))
      .leftJoin(stories, eq(storyLinks.storyId, stories.id))
      .where(
        and(
          eq(articles.status, "published"),
          eq(articles.hideFromHomepage, false),
          or(
            isNull(articles.articleType),
            ne(articles.articleType, 'opinion')
          )
        )
      )
      .orderBy(desc(articles.displayOrder), desc(articles.publishedAt))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      content: '', // Excluded for performance - not needed in list view
      excerpt: r.excerpt,
      imageUrl: r.imageUrl,
      imageFocalPoint: r.imageFocalPoint,
      categoryId: r.categoryId,
      authorId: r.authorId,
      reporterId: r.reporterId,
      articleType: r.articleType,
      newsType: r.newsType,
      publishType: 'instant',
      scheduledAt: null,
      status: 'published',
      reviewStatus: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      hideFromHomepage: false,
      aiSummary: r.aiSummary,
      aiGenerated: r.aiGenerated,
      isFeatured: r.isFeatured,
      views: r.views,
      displayOrder: 0,
      seo: null,
      seoMetadata: null,
      credibilityScore: null,
      credibilityAnalysis: null,
      credibilityLastUpdated: null,
      source: r.source || 'manual',
      sourceMetadata: null,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      storyId: r.story?.id || undefined,
      storyTitle: r.story?.title || undefined,
    }));
  }

  async getAllPublishedArticles(limit: number = 20, offset: number = 0): Promise<ArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        imageFocalPoint: articles.imageFocalPoint,
        categoryId: articles.categoryId,
        authorId: articles.authorId,
        reporterId: articles.reporterId,
        articleType: articles.articleType,
        newsType: articles.newsType,
        aiSummary: articles.aiSummary,
        aiGenerated: articles.aiGenerated,
        isFeatured: articles.isFeatured,
        views: articles.views,
        source: articles.source,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: categories,
        author: users,
        reporter: reporterAlias,
        storyLink: storyLinks,
        story: stories,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .leftJoin(storyLinks, eq(articles.id, storyLinks.articleId))
      .leftJoin(stories, eq(storyLinks.storyId, stories.id))
      .where(
        and(
          eq(articles.status, "published"),
          eq(articles.hideFromHomepage, false),
          or(
            isNull(articles.articleType),
            ne(articles.articleType, "opinion")
          )
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      content: '', // Excluded for performance - not needed in list view
      excerpt: r.excerpt,
      imageUrl: r.imageUrl,
      imageFocalPoint: r.imageFocalPoint,
      categoryId: r.categoryId,
      authorId: r.authorId,
      reporterId: r.reporterId,
      articleType: r.articleType,
      newsType: r.newsType,
      publishType: 'instant',
      scheduledAt: null,
      status: 'published',
      reviewStatus: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      hideFromHomepage: false,
      aiSummary: r.aiSummary,
      aiGenerated: r.aiGenerated,
      isFeatured: r.isFeatured,
      views: r.views,
      displayOrder: 0,
      seo: null,
      seoMetadata: null,
      credibilityScore: null,
      credibilityAnalysis: null,
      credibilityLastUpdated: null,
      source: r.source || 'manual',
      sourceMetadata: null,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      storyId: r.story?.id || undefined,
      storyTitle: r.story?.title || undefined,
    }));
  }

  async getEditorPicks(limit: number = 6): Promise<ArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        imageFocalPoint: articles.imageFocalPoint,
        categoryId: articles.categoryId,
        authorId: articles.authorId,
        reporterId: articles.reporterId,
        articleType: articles.articleType,
        newsType: articles.newsType,
        aiSummary: articles.aiSummary,
        aiGenerated: articles.aiGenerated,
        isFeatured: articles.isFeatured,
        views: articles.views,
        source: articles.source,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: categories,
        author: users,
        reporter: reporterAlias,
        storyLink: storyLinks,
        story: stories,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .leftJoin(storyLinks, eq(articles.id, storyLinks.articleId))
      .leftJoin(stories, eq(storyLinks.storyId, stories.id))
      .where(
        and(
          eq(articles.status, "published"),
          eq(articles.hideFromHomepage, false),
          or(
            isNull(articles.articleType),
            ne(articles.articleType, 'opinion')
          )
        )
      )
      .orderBy(desc(articles.displayOrder), desc(articles.publishedAt), desc(articles.views))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      content: '', // Excluded for performance - not needed in list view
      excerpt: r.excerpt,
      imageUrl: r.imageUrl,
      imageFocalPoint: r.imageFocalPoint,
      categoryId: r.categoryId,
      authorId: r.authorId,
      reporterId: r.reporterId,
      articleType: r.articleType,
      newsType: r.newsType,
      publishType: 'instant',
      scheduledAt: null,
      status: 'published',
      reviewStatus: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      hideFromHomepage: false,
      aiSummary: r.aiSummary,
      aiGenerated: r.aiGenerated,
      isFeatured: r.isFeatured,
      views: r.views,
      displayOrder: 0,
      seo: null,
      seoMetadata: null,
      credibilityScore: null,
      credibilityAnalysis: null,
      credibilityLastUpdated: null,
      source: r.source || 'manual',
      sourceMetadata: null,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      storyId: r.story?.id || undefined,
      storyTitle: r.story?.title || undefined,
    }));
  }

  async getDeepDiveArticles(limit: number = 6): Promise<ArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        imageFocalPoint: articles.imageFocalPoint,
        categoryId: articles.categoryId,
        authorId: articles.authorId,
        reporterId: articles.reporterId,
        articleType: articles.articleType,
        newsType: articles.newsType,
        aiSummary: articles.aiSummary,
        aiGenerated: articles.aiGenerated,
        isFeatured: articles.isFeatured,
        views: articles.views,
        source: articles.source,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: categories,
        author: users,
        reporter: reporterAlias,
        storyLink: storyLinks,
        story: stories,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .leftJoin(storyLinks, eq(articles.id, storyLinks.articleId))
      .leftJoin(stories, eq(storyLinks.storyId, stories.id))
      .where(and(
        eq(articles.status, "published"),
        eq(articles.hideFromHomepage, false),
        sql`${articles.aiSummary} IS NOT NULL AND LENGTH(${articles.content}) > 200`,
        or(
          isNull(articles.articleType),
          ne(articles.articleType, 'opinion')
        )
      ))
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      slug: r.slug,
      content: '', // Excluded for performance - not needed in list view
      excerpt: r.excerpt,
      imageUrl: r.imageUrl,
      imageFocalPoint: r.imageFocalPoint,
      categoryId: r.categoryId,
      authorId: r.authorId,
      reporterId: r.reporterId,
      articleType: r.articleType,
      newsType: r.newsType,
      publishType: 'instant',
      scheduledAt: null,
      status: 'published',
      reviewStatus: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      hideFromHomepage: false,
      aiSummary: r.aiSummary,
      aiGenerated: r.aiGenerated,
      isFeatured: r.isFeatured,
      views: r.views,
      displayOrder: 0,
      seo: null,
      seoMetadata: null,
      credibilityScore: null,
      credibilityAnalysis: null,
      credibilityLastUpdated: null,
      source: r.source || 'manual',
      sourceMetadata: null,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      storyId: r.story?.id || undefined,
      storyTitle: r.story?.title || undefined,
    }));
  }

  async getTrendingTopics(): Promise<Array<{ topic: string; count: number; views: number; articles: number; comments: number }>> {
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
        total_views::int as views,
        article_count::int as articles,
        total_comments::int as comments,
        ((total_views + (total_comments * 10) + (article_count * 5)))::int as count
      FROM topic_stats
      WHERE total_views + (total_comments * 10) + (article_count * 5) > 0
      ORDER BY count DESC
      LIMIT 8
    `);

    return (results.rows as Array<{ topic: string; count: number; views: number; articles: number; comments: number }>)
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

  // Admin Dashboard stats
  async getAdminDashboardStats(): Promise<{
    articles: {
      total: number;
      published: number;
      draft: number;
      archived: number;
      scheduled: number;
      totalViews: number;
      viewsToday: number;
    };
    users: {
      total: number;
      emailVerified: number;
      active24h: number;
      newThisWeek: number;
      activeToday: number;
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
      todayCount: number;
    };
    engagement: {
      averageTimeOnSite: number;
      totalReads: number;
      readsToday: number;
    };
    recentArticles: ArticleWithDetails[];
    recentComments: CommentWithUser[];
    topArticles: ArticleWithDetails[];
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get article stats with scheduled count
    const [articleStats] = await db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`count(*) filter (where ${articles.status} = 'published')`,
        draft: sql<number>`count(*) filter (where ${articles.status} = 'draft')`,
        archived: sql<number>`count(*) filter (where ${articles.status} = 'archived')`,
        scheduled: sql<number>`count(*) filter (where ${articles.status} = 'scheduled')`,
        totalViews: sql<number>`coalesce(sum(${articles.views}), 0)`,
      })
      .from(articles);

    // Get views today
    const [viewsTodayStats] = await db
      .select({
        viewsToday: sql<number>`coalesce(count(*), 0)`,
      })
      .from(userEvents)
      .where(and(
        sql`${userEvents.eventType} = 'view'`,
        sql`${userEvents.createdAt} >= ${todayStart}`
      ));

    // Get user stats with active today count
    const [userStats] = await db
      .select({
        total: sql<number>`count(*)`,
        emailVerified: sql<number>`count(*) filter (where ${users.emailVerified} = true)`,
        active24h: sql<number>`count(*) filter (where ${users.lastActivityAt} >= ${yesterday})`,
        newThisWeek: sql<number>`count(*) filter (where ${users.createdAt} >= ${weekAgo})`,
        activeToday: sql<number>`count(*) filter (where ${users.lastActivityAt} >= ${todayStart})`,
      })
      .from(users)
      .where(isNull(users.deletedAt));

    // Get comment stats
    const [commentStats] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${comments.status} = 'pending')`,
        approved: sql<number>`count(*) filter (where ${comments.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${comments.status} = 'rejected')`,
      })
      .from(comments);

    // Get categories count
    const [categoriesStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(categories);

    // Get AB tests stats
    const [abTestsStats] = await db
      .select({
        total: sql<number>`count(*)`,
        running: sql<number>`count(*) filter (where ${experiments.status} = 'running')`,
      })
      .from(experiments);

    // Get reactions count (total and today)
    const [reactionsStats] = await db
      .select({
        total: sql<number>`count(*)`,
        todayCount: sql<number>`count(*) filter (where ${reactions.createdAt} >= ${todayStart})`,
      })
      .from(reactions);

    // Get engagement stats
    const [engagementStats] = await db
      .select({
        totalReads: sql<number>`count(*)`,
        readsToday: sql<number>`count(*) filter (where ${readingHistory.readAt} >= ${todayStart})`,
        avgDuration: sql<number>`coalesce(avg(${readingHistory.readDuration}), 0)`,
      })
      .from(readingHistory);

    // Get recent articles (latest 5)
    const recentArticlesData = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .orderBy(desc(articles.createdAt))
      .limit(5);

    const recentArticles: ArticleWithDetails[] = recentArticlesData.map((r) => ({
      ...r.article,
      credibilityScore: r.article.credibilityScore || null,
      credibilityAnalysis: r.article.credibilityAnalysis || null,
      credibilityLastUpdated: r.article.credibilityLastUpdated || null,
      category: r.category || undefined,
      author: r.author || undefined,
    }));

    // Get recent comments (latest 5)
    const recentCommentsData = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .orderBy(desc(comments.createdAt))
      .limit(5);

    const recentComments: CommentWithUser[] = recentCommentsData.map((r) => ({
      ...r.comment,
      user: r.user,
    }));

    // Get top articles (most viewed, top 5)
    const topArticlesData = await db
      .select({
        article: articles,
        category: categories,
        author: users,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.views))
      .limit(5);

    const topArticles: ArticleWithDetails[] = topArticlesData.map((r) => ({
      ...r.article,
      credibilityScore: r.article.credibilityScore || null,
      credibilityAnalysis: r.article.credibilityAnalysis || null,
      credibilityLastUpdated: r.article.credibilityLastUpdated || null,
      category: r.category || undefined,
      author: r.author || undefined,
    }));

    return {
      articles: {
        total: Number(articleStats.total),
        published: Number(articleStats.published),
        draft: Number(articleStats.draft),
        archived: Number(articleStats.archived),
        scheduled: Number(articleStats.scheduled),
        totalViews: Number(articleStats.totalViews),
        viewsToday: Number(viewsTodayStats.viewsToday),
      },
      users: {
        total: Number(userStats.total),
        emailVerified: Number(userStats.emailVerified),
        active24h: Number(userStats.active24h),
        newThisWeek: Number(userStats.newThisWeek),
        activeToday: Number(userStats.activeToday),
      },
      comments: {
        total: Number(commentStats.total),
        pending: Number(commentStats.pending),
        approved: Number(commentStats.approved),
        rejected: Number(commentStats.rejected),
      },
      categories: {
        total: Number(categoriesStats.total),
      },
      abTests: {
        total: Number(abTestsStats.total),
        running: Number(abTestsStats.running),
      },
      reactions: {
        total: Number(reactionsStats.total),
        todayCount: Number(reactionsStats.todayCount),
      },
      engagement: {
        averageTimeOnSite: Math.round(Number(engagementStats.avgDuration)),
        totalReads: Number(engagementStats.totalReads),
        readsToday: Number(engagementStats.readsToday),
      },
      recentArticles,
      recentComments,
      topArticles,
    };
  }

  // English Admin Dashboard stats
  async getEnglishAdminDashboardStats(): Promise<{
    articles: {
      total: number;
      published: number;
      draft: number;
      archived: number;
      scheduled: number;
      totalViews: number;
      viewsToday: number;
    };
    users: {
      total: number;
      emailVerified: number;
      active24h: number;
      newThisWeek: number;
      activeToday: number;
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
      todayCount: number;
    };
    engagement: {
      averageTimeOnSite: number;
      totalReads: number;
      readsToday: number;
    };
    recentArticles: ArticleWithDetails[];
    recentComments: CommentWithUser[];
    topArticles: ArticleWithDetails[];
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get article stats with scheduled count
    const [articleStats] = await db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`count(*) filter (where ${enArticles.status} = 'published')`,
        draft: sql<number>`count(*) filter (where ${enArticles.status} = 'draft')`,
        archived: sql<number>`count(*) filter (where ${enArticles.status} = 'archived')`,
        scheduled: sql<number>`count(*) filter (where ${enArticles.status} = 'scheduled')`,
        totalViews: sql<number>`coalesce(sum(${enArticles.views}), 0)`,
      })
      .from(enArticles);

    // Get views today
    const [viewsTodayStats] = await db
      .select({
        viewsToday: sql<number>`coalesce(count(*), 0)`,
      })
      .from(userEvents)
      .where(and(
        sql`${userEvents.eventType} = 'view'`,
        sql`${userEvents.createdAt} >= ${todayStart}`
      ));

    // Get user stats with active today count
    const [userStats] = await db
      .select({
        total: sql<number>`count(*)`,
        emailVerified: sql<number>`count(*) filter (where ${users.emailVerified} = true)`,
        active24h: sql<number>`count(*) filter (where ${users.lastActivityAt} >= ${yesterday})`,
        newThisWeek: sql<number>`count(*) filter (where ${users.createdAt} >= ${weekAgo})`,
        activeToday: sql<number>`count(*) filter (where ${users.lastActivityAt} >= ${todayStart})`,
      })
      .from(users)
      .where(isNull(users.deletedAt));

    // Get comment stats
    const [commentStats] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${enComments.status} = 'pending')`,
        approved: sql<number>`count(*) filter (where ${enComments.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${enComments.status} = 'rejected')`,
      })
      .from(enComments);

    // Get categories count
    const [categoriesStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(enCategories);

    // Get AB tests stats
    const [abTestsStats] = await db
      .select({
        total: sql<number>`count(*)`,
        running: sql<number>`count(*) filter (where ${experiments.status} = 'running')`,
      })
      .from(experiments);

    // Get reactions count (total and today)
    const [reactionsStats] = await db
      .select({
        total: sql<number>`count(*)`,
        todayCount: sql<number>`count(*) filter (where ${reactions.createdAt} >= ${todayStart})`,
      })
      .from(reactions);

    // Get engagement stats
    const [engagementStats] = await db
      .select({
        totalReads: sql<number>`count(*)`,
        readsToday: sql<number>`count(*) filter (where ${readingHistory.readAt} >= ${todayStart})`,
        avgDuration: sql<number>`coalesce(avg(${readingHistory.readDuration}), 0)`,
      })
      .from(readingHistory);

    // Get recent articles (latest 5)
    const recentArticlesData = await db
      .select({
        article: enArticles,
        category: enCategories,
        author: users,
      })
      .from(enArticles)
      .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
      .leftJoin(users, eq(enArticles.authorId, users.id))
      .orderBy(desc(enArticles.createdAt))
      .limit(5);

    const recentArticles = recentArticlesData.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));

    // Get recent comments (latest 5)
    const recentCommentsData = await db
      .select({
        comment: enComments,
        user: users,
      })
      .from(enComments)
      .innerJoin(users, eq(enComments.userId, users.id))
      .orderBy(desc(enComments.createdAt))
      .limit(5);

    const recentComments: CommentWithUser[] = recentCommentsData.map((r) => ({
      ...r.comment,
      user: r.user,
    }));

    // Get top articles (most viewed, top 5)
    const topArticlesData = await db
      .select({
        article: enArticles,
        category: enCategories,
        author: users,
      })
      .from(enArticles)
      .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
      .leftJoin(users, eq(enArticles.authorId, users.id))
      .where(eq(enArticles.status, "published"))
      .orderBy(desc(enArticles.views))
      .limit(5);

    const topArticles = topArticlesData.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.author || undefined,
    }));

    return {
      articles: {
        total: Number(articleStats.total),
        published: Number(articleStats.published),
        draft: Number(articleStats.draft),
        archived: Number(articleStats.archived),
        scheduled: Number(articleStats.scheduled),
        totalViews: Number(articleStats.totalViews),
        viewsToday: Number(viewsTodayStats.viewsToday),
      },
      users: {
        total: Number(userStats.total),
        emailVerified: Number(userStats.emailVerified),
        active24h: Number(userStats.active24h),
        newThisWeek: Number(userStats.newThisWeek),
        activeToday: Number(userStats.activeToday),
      },
      comments: {
        total: Number(commentStats.total),
        pending: Number(commentStats.pending),
        approved: Number(commentStats.approved),
        rejected: Number(commentStats.rejected),
      },
      categories: {
        total: Number(categoriesStats.total),
      },
      abTests: {
        total: Number(abTestsStats.total),
        running: Number(abTestsStats.running),
      },
      reactions: {
        total: Number(reactionsStats.total),
        todayCount: Number(reactionsStats.todayCount),
      },
      engagement: {
        averageTimeOnSite: Math.round(Number(engagementStats.avgDuration)),
        totalReads: Number(engagementStats.totalReads),
        readsToday: Number(engagementStats.readsToday),
      },
      recentArticles,
      recentComments,
      topArticles,
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
      .innerJoin(interests, eq(userInterests.categoryId, interests.id))
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
          interestIds.map((categoryId) => ({
            userId,
            categoryId,
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
      .where(and(eq(userInterests.userId, userId), eq(userInterests.categoryId, interestId)));
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
          inArray(themes.status, ['active', 'scheduled']),
          or(isNull(themes.startAt), lte(themes.startAt, now)),
          or(isNull(themes.endAt), gte(themes.endAt, now)),
          sql`${scope} = ANY(${themes.applyTo})`
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
          eq(themes.status, 'active'),
          or(isNull(themes.startAt), lte(themes.startAt, now)),
          or(isNull(themes.endAt), gte(themes.endAt, now)),
          sql`${scope} = ANY(${themes.applyTo})`
        )
      )
      .orderBy(desc(themes.priority))
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

    const updateData: any = { ...themeData };
    if (updateData.startAt && typeof updateData.startAt === 'string') {
      updateData.startAt = new Date(updateData.startAt);
    }
    if (updateData.endAt && typeof updateData.endAt === 'string') {
      updateData.endAt = new Date(updateData.endAt);
    }
    updateData.updatedAt = new Date();

    const updated = await db
      .update(themes)
      .set(updateData)
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
      changes: { fromVersion: existing.version, toVersion: existing.version + 1 } as any,
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
    const result = await db.transaction(async (tx) => {
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

    // Trigger loyalty pass update (outside transaction)
    await this.triggerLoyaltyPassUpdate(params.userId, params.action);

    return result;
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
      .values([data as any])
      .returning();
    return reward;
  }

  async updateReward(id: string, data: Partial<InsertLoyaltyReward>): Promise<LoyaltyReward> {
    const updateData: any = { ...data };
    const [reward] = await db
      .update(loyaltyRewards)
      .set(updateData)
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
      await tx.insert(userLoyaltyEvents).values([{
        userId,
        action: "ADMIN_ADJUSTMENT",
        points,
        source: "admin",
        metadata: { extraInfo: reason } as any,
      }]);

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

  // Muqtarib Angles operations
  async getSectionBySlug(slug: string): Promise<Section | undefined> {
    const [section] = await db
      .select()
      .from(sections)
      .where(eq(sections.slug, slug))
      .limit(1);
    return section;
  }

  async getAllAngles(activeOnly?: boolean): Promise<Angle[]> {
    const conditions = [];
    
    if (activeOnly) {
      conditions.push(eq(angles.isActive, true));
    }

    return await db
      .select()
      .from(angles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(angles.sortOrder, angles.nameAr);
  }

  async getAngleBySlug(slug: string): Promise<Angle | undefined> {
    const [angle] = await db
      .select()
      .from(angles)
      .where(eq(angles.slug, slug));
    return angle;
  }

  async getAngleById(id: string): Promise<Angle | undefined> {
    const [angle] = await db
      .select()
      .from(angles)
      .where(eq(angles.id, id));
    return angle;
  }

  async createAngle(angle: InsertAngle): Promise<Angle> {
    const [created] = await db
      .insert(angles)
      .values(angle)
      .returning();
    return created;
  }

  async updateAngle(id: string, angleData: Partial<InsertAngle>): Promise<Angle> {
    const updateData: any = { ...angleData, updatedAt: new Date() };
    const [updated] = await db
      .update(angles)
      .set(updateData)
      .where(eq(angles.id, id))
      .returning();
    return updated;
  }

  async deleteAngle(id: string): Promise<void> {
    await db.delete(angles).where(eq(angles.id, id));
  }

  async getArticlesByAngle(angleSlug: string, limit?: number): Promise<ArticleWithDetails[]> {
    // First, get the angle by slug
    const angle = await this.getAngleBySlug(angleSlug);
    if (!angle) {
      return [];
    }

    const reporterAlias = aliasedTable(users, 'reporter');
    
    // Build query to get articles by angle
    let query = db
      .select({
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(articleAngles)
      .innerJoin(articles, eq(articleAngles.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(
        and(
          eq(articleAngles.angleId, angle.id),
          eq(articles.status, "published"),
          or(
            isNull(articles.articleType),
            ne(articles.articleType, 'opinion')
          )
        )
      )
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = await query;

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
    }));
  }

  async linkArticleToAngle(articleId: string, angleId: string): Promise<void> {
    await db
      .insert(articleAngles)
      .values({
        articleId,
        angleId,
      })
      .onConflictDoNothing();
  }

  async unlinkArticleFromAngle(articleId: string, angleId: string): Promise<void> {
    await db
      .delete(articleAngles)
      .where(
        and(
          eq(articleAngles.articleId, articleId),
          eq(articleAngles.angleId, angleId)
        )
      );
  }

  async getArticleAngles(articleId: string): Promise<Angle[]> {
    const results = await db
      .select({
        angle: angles,
      })
      .from(articleAngles)
      .innerJoin(angles, eq(articleAngles.angleId, angles.id))
      .where(eq(articleAngles.articleId, articleId))
      .orderBy(angles.sortOrder, angles.nameAr);

    return results.map((r) => r.angle);
  }

  // Story operations
  async createStory(story: InsertStory): Promise<Story> {
    const [created] = await db
      .insert(stories)
      .values(story)
      .returning();
    return created;
  }

  async getStoryById(id: string): Promise<Story | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, id));
    return story;
  }

  async getStoryBySlug(slug: string): Promise<StoryWithDetails | undefined> {
    const results = await db
      .select({
        story: stories,
        rootArticle: articles,
      })
      .from(stories)
      .leftJoin(articles, eq(stories.rootArticleId, articles.id))
      .where(eq(stories.slug, slug));

    if (results.length === 0) return undefined;

    const result = results[0];

    // Get articles count
    const [{ count: articlesCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(storyLinks)
      .where(eq(storyLinks.storyId, result.story.id));

    // Get followers count
    const [{ count: followersCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(storyFollows)
      .where(and(
        eq(storyFollows.storyId, result.story.id),
        eq(storyFollows.isActive, true)
      ));

    return {
      ...result.story,
      rootArticle: result.rootArticle || undefined,
      articlesCount: Number(articlesCount),
      followersCount: Number(followersCount),
    };
  }

  async getAllStories(filters?: { status?: string }): Promise<StoryWithDetails[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(stories.status, filters.status));
    }

    const results = await db
      .select({
        story: stories,
        rootArticle: articles,
      })
      .from(stories)
      .leftJoin(articles, eq(stories.rootArticleId, articles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(stories.createdAt));

    // Get counts for each story
    const storiesWithDetails = await Promise.all(
      results.map(async (result) => {
        const [{ count: articlesCount }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(storyLinks)
          .where(eq(storyLinks.storyId, result.story.id));

        const [{ count: followersCount }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(storyFollows)
          .where(and(
            eq(storyFollows.storyId, result.story.id),
            eq(storyFollows.isActive, true)
          ));

        return {
          ...result.story,
          rootArticle: result.rootArticle || undefined,
          articlesCount: Number(articlesCount),
          followersCount: Number(followersCount),
        };
      })
    );

    return storiesWithDetails;
  }

  async updateStory(id: string, data: Partial<InsertStory>): Promise<Story> {
    const [updated] = await db
      .update(stories)
      .set(data)
      .where(eq(stories.id, id))
      .returning();
    return updated;
  }

  async deleteStory(id: string): Promise<void> {
    await db.delete(stories).where(eq(stories.id, id));
  }

  // Story link operations
  async createStoryLink(link: InsertStoryLink): Promise<StoryLink> {
    const [created] = await db
      .insert(storyLinks)
      .values(link)
      .returning();
    return created;
  }

  async getStoryLinks(storyId: string): Promise<StoryLinkWithArticle[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        storyLink: storyLinks,
        article: articles,
        category: categories,
        author: users,
        reporter: reporterAlias,
      })
      .from(storyLinks)
      .leftJoin(articles, eq(storyLinks.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
      .where(eq(storyLinks.storyId, storyId))
      .orderBy(desc(storyLinks.createdAt));

    return results.map((r) => ({
      ...r.storyLink,
      article: r.article ? {
        ...r.article,
        category: r.category || undefined,
        author: r.reporter || r.author || undefined,
      } : undefined,
    }));
  }

  async deleteStoryLink(id: string): Promise<void> {
    await db.delete(storyLinks).where(eq(storyLinks.id, id));
  }

  // Story follow operations
  async followStory(follow: InsertStoryFollow): Promise<StoryFollow> {
    const [created] = await db
      .insert(storyFollows)
      .values(follow)
      .returning();
    return created;
  }

  async unfollowStory(userId: string, storyId: string): Promise<void> {
    await db
      .delete(storyFollows)
      .where(and(
        eq(storyFollows.userId, userId),
        eq(storyFollows.storyId, storyId)
      ));
  }

  async getStoryFollows(userId: string): Promise<(StoryFollow & { story: StoryWithDetails })[]> {
    const results = await db
      .select({
        storyFollow: storyFollows,
        story: stories,
        rootArticle: articles,
      })
      .from(storyFollows)
      .innerJoin(stories, eq(storyFollows.storyId, stories.id))
      .leftJoin(articles, eq(stories.rootArticleId, articles.id))
      .where(and(
        eq(storyFollows.userId, userId),
        eq(storyFollows.isActive, true)
      ))
      .orderBy(desc(storyFollows.createdAt));

    // Get counts for each story
    const followsWithDetails = await Promise.all(
      results.map(async (result) => {
        const [{ count: articlesCount }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(storyLinks)
          .where(eq(storyLinks.storyId, result.story.id));

        const [{ count: followersCount }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(storyFollows)
          .where(and(
            eq(storyFollows.storyId, result.story.id),
            eq(storyFollows.isActive, true)
          ));

        return {
          ...result.storyFollow,
          story: {
            ...result.story,
            rootArticle: result.rootArticle || undefined,
            articlesCount: Number(articlesCount),
            followersCount: Number(followersCount),
          },
        };
      })
    );

    return followsWithDetails;
  }

  async getStoryFollowersByStoryId(storyId: string): Promise<StoryFollow[]> {
    return await db
      .select()
      .from(storyFollows)
      .where(and(
        eq(storyFollows.storyId, storyId),
        eq(storyFollows.isActive, true)
      ))
      .orderBy(desc(storyFollows.createdAt));
  }

  async isFollowingStory(userId: string, storyId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(storyFollows)
      .where(and(
        eq(storyFollows.userId, userId),
        eq(storyFollows.storyId, storyId),
        eq(storyFollows.isActive, true)
      ));
    return !!follow;
  }

  async updateStoryFollow(userId: string, storyId: string, data: Partial<InsertStoryFollow>): Promise<StoryFollow> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const [updated] = await db
      .update(storyFollows)
      .set(updateData)
      .where(and(
        eq(storyFollows.userId, userId),
        eq(storyFollows.storyId, storyId)
      ))
      .returning();
    return updated;
  }

  // Social Following System
  async followUser(data: InsertSocialFollow): Promise<SocialFollow> {
    console.log('[Storage] Following user:', data);
    const [created] = await db
      .insert(socialFollows)
      .values(data)
      .returning();
    console.log('[Storage] User follow created:', created);
    return created;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    console.log('[Storage] Unfollowing user:', { followerId, followingId });
    await db
      .delete(socialFollows)
      .where(and(
        eq(socialFollows.followerId, followerId),
        eq(socialFollows.followingId, followingId)
      ));
    console.log('[Storage] User unfollowed successfully');
  }

  async getFollowers(userId: string, limit?: number): Promise<Array<SocialFollow & { follower: User }>> {
    console.log('[Storage] Getting followers for user:', userId, 'limit:', limit);
    const followerUser = aliasedTable(users, 'follower');
    
    let query = db
      .select({
        socialFollow: socialFollows,
        follower: followerUser,
      })
      .from(socialFollows)
      .leftJoin(followerUser, eq(socialFollows.followerId, followerUser.id))
      .where(eq(socialFollows.followingId, userId))
      .orderBy(desc(socialFollows.createdAt));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = await query;
    
    const followers = results.map(r => ({
      ...r.socialFollow,
      follower: r.follower!,
    }));
    
    console.log('[Storage] Found followers:', followers.length);
    return followers;
  }

  async getFollowing(userId: string, limit?: number): Promise<Array<SocialFollow & { following: User }>> {
    console.log('[Storage] Getting following for user:', userId, 'limit:', limit);
    const followingUser = aliasedTable(users, 'following');
    
    let query = db
      .select({
        socialFollow: socialFollows,
        following: followingUser,
      })
      .from(socialFollows)
      .leftJoin(followingUser, eq(socialFollows.followingId, followingUser.id))
      .where(eq(socialFollows.followerId, userId))
      .orderBy(desc(socialFollows.createdAt));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = await query;
    
    const following = results.map(r => ({
      ...r.socialFollow,
      following: r.following!,
    }));
    
    console.log('[Storage] Found following:', following.length);
    return following;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    console.log('[Storage] Checking if user is following:', { followerId, followingId });
    const [result] = await db
      .select()
      .from(socialFollows)
      .where(and(
        eq(socialFollows.followerId, followerId),
        eq(socialFollows.followingId, followingId)
      ));
    
    const isFollowing = !!result;
    console.log('[Storage] Is following:', isFollowing);
    return isFollowing;
  }

  async getFollowStats(userId: string): Promise<{ followersCount: number; followingCount: number }> {
    console.log('[Storage] Getting follow stats for user:', userId);
    
    const [followersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(socialFollows)
      .where(eq(socialFollows.followingId, userId));
    
    const [followingResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(socialFollows)
      .where(eq(socialFollows.followerId, userId));
    
    const stats = {
      followersCount: followersResult?.count || 0,
      followingCount: followingResult?.count || 0,
    };
    
    console.log('[Storage] Follow stats:', stats);
    return stats;
  }

  // Story notification operations
  async createStoryNotification(notification: InsertStoryNotification): Promise<StoryNotification> {
    const [created] = await db
      .insert(storyNotifications)
      .values(notification)
      .returning();
    return created;
  }

  async getStoryNotifications(storyId: string): Promise<StoryNotification[]> {
    return await db
      .select()
      .from(storyNotifications)
      .where(eq(storyNotifications.storyId, storyId))
      .orderBy(desc(storyNotifications.createdAt));
  }

  // System settings operations
  async getSystemSetting(key: string): Promise<any | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting?.value;
  }

  async upsertSystemSetting(key: string, value: any, category: string = "system", isPublic: boolean = false): Promise<void> {
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));

    if (existing.length > 0) {
      await db
        .update(systemSettings)
        .set({ 
          value, 
          category, 
          isPublic, 
          updatedAt: new Date() 
        })
        .where(eq(systemSettings.key, key));
    } else {
      await db
        .insert(systemSettings)
        .values({ key, value, category, isPublic });
    }
  }

  // User Behavior Analytics
  async getUserBehaviorAnalytics(range: string = "7d") {
    const days = parseInt(range) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Active users count (users who had any activity during the period)
    const activeUsersResult = await db
      .select({ userId: readingHistory.userId })
      .from(readingHistory)
      .where(gte(readingHistory.readAt, startDate))
      .union(
        db.select({ userId: comments.userId })
          .from(comments)
          .where(gte(comments.createdAt, startDate))
      )
      .union(
        db.select({ userId: reactions.userId })
          .from(reactions)
          .where(gte(reactions.createdAt, startDate))
      )
      .union(
        db.select({ userId: bookmarks.userId })
          .from(bookmarks)
          .where(gte(bookmarks.createdAt, startDate))
      )
      .union(
        db.select({ userId: behaviorLogs.userId })
          .from(behaviorLogs)
          .where(gte(behaviorLogs.createdAt, startDate))
      );

    const totalUsers = new Set(activeUsersResult.map(r => r.userId)).size;

    // Reading time average from readingHistory
    const readingStats = await db
      .select({
        avgDuration: sql<number>`avg(${readingHistory.readDuration})`,
        totalReads: sql<number>`count(*)`,
      })
      .from(readingHistory)
      .where(gte(readingHistory.readAt, startDate));

    // Interaction counts
    const [likesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reactions)
      .where(gte(reactions.createdAt, startDate));

    const [commentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(gte(comments.createdAt, startDate));

    const [bookmarksCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(gte(bookmarks.createdAt, startDate));

    // Top categories from user interactions
    const topCategories = await db
      .select({
        categoryId: articles.categoryId,
        categoryName: sql<string>`COALESCE(${categories.nameAr}, 'غير مصنف')`,
        count: sql<number>`count(*)`,
      })
      .from(readingHistory)
      .innerJoin(articles, eq(readingHistory.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(gte(readingHistory.readAt, startDate))
      .groupBy(articles.categoryId, sql`COALESCE(${categories.nameAr}, 'غير مصنف')`)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Active hours analysis from behaviorLogs
    const activeHours = await db
      .select({
        hour: sql<number>`extract(hour from ${behaviorLogs.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(behaviorLogs)
      .where(gte(behaviorLogs.createdAt, startDate))
      .groupBy(sql`extract(hour from ${behaviorLogs.createdAt})`);

    // Group by time periods
    const hourDistribution = { morning: 0, noon: 0, evening: 0, night: 0 };
    activeHours.forEach((h) => {
      const hour = Number(h.hour);
      const count = Number(h.count);
      if (hour >= 6 && hour < 12) hourDistribution.morning += count;
      else if (hour >= 12 && hour < 17) hourDistribution.noon += count;
      else if (hour >= 17 && hour < 22) hourDistribution.evening += count;
      else hourDistribution.night += count;
    });

    // Device distribution (mock data - would need user agent parsing)
    const deviceDistribution = {
      mobile: 65,
      desktop: 30,
      tablet: 5,
    };

    // Return time analysis (users who came back within 7 days)
    const returningUsers = await db
      .select({
        userId: readingHistory.userId,
        visitDays: sql<number>`count(distinct date(${readingHistory.readAt}))`,
      })
      .from(readingHistory)
      .where(gte(readingHistory.readAt, startDate))
      .groupBy(readingHistory.userId)
      .having(sql`count(distinct date(${readingHistory.readAt})) > 1`);

    const returnRate = totalUsers > 0 
      ? Math.round((returningUsers.length / Number(totalUsers)) * 100) 
      : 0;

    return {
      totalUsers: Number(totalUsers),
      readingTimeAvg: readingStats[0]?.avgDuration ? Math.round(Number(readingStats[0].avgDuration) / 60) : 0,
      totalReads: Number(readingStats[0]?.totalReads || 0),
      topCategories: topCategories.map(c => ({
        name: c.categoryName || 'غير مصنف',
        count: Number(c.count),
      })),
      interactionCounts: {
        likes: Number(likesCount.count),
        comments: Number(commentsCount.count),
        bookmarks: Number(bookmarksCount.count),
      },
      activeHours: hourDistribution,
      deviceDistribution,
      returnRate,
      returningUsersCount: returningUsers.length,
    };
  }

  // ============================================
  // A/B Testing Operations
  // ============================================

  // Experiment Operations
  async createExperiment(experiment: InsertExperiment): Promise<Experiment> {
    const [newExperiment] = await db
      .insert(experiments)
      .values(experiment)
      .returning();
    return newExperiment;
  }

  async getExperimentById(id: string): Promise<Experiment | undefined> {
    const [experiment] = await db
      .select()
      .from(experiments)
      .where(eq(experiments.id, id));
    return experiment;
  }

  async getAllExperiments(filters?: { status?: string; testType?: string }): Promise<Experiment[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(experiments.status, filters.status));
    }
    
    if (filters?.testType) {
      conditions.push(eq(experiments.testType, filters.testType));
    }

    const results = await db
      .select()
      .from(experiments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(experiments.createdAt));

    return results;
  }

  async updateExperiment(id: string, data: Partial<InsertExperiment>): Promise<Experiment> {
    const [updated] = await db
      .update(experiments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(experiments.id, id))
      .returning();
    return updated;
  }

  async deleteExperiment(id: string): Promise<void> {
    await db.delete(experiments).where(eq(experiments.id, id));
  }

  async startExperiment(id: string): Promise<Experiment> {
    const [updated] = await db
      .update(experiments)
      .set({ 
        status: 'running', 
        startedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(experiments.id, id))
      .returning();
    return updated;
  }

  async pauseExperiment(id: string): Promise<Experiment> {
    const [updated] = await db
      .update(experiments)
      .set({ 
        status: 'paused',
        updatedAt: new Date()
      })
      .where(eq(experiments.id, id))
      .returning();
    return updated;
  }

  async completeExperiment(id: string, winnerVariantId?: string): Promise<Experiment> {
    const updateData: any = { 
      status: 'completed', 
      endedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (winnerVariantId) {
      updateData.winnerVariantId = winnerVariantId;
    }

    const [updated] = await db
      .update(experiments)
      .set(updateData)
      .where(eq(experiments.id, id))
      .returning();
    return updated;
  }

  // Variant Operations
  async createExperimentVariant(variant: InsertExperimentVariant): Promise<ExperimentVariant> {
    const [newVariant] = await db
      .insert(experimentVariants)
      .values({
        ...variant,
        variantData: variant.variantData as any
      })
      .returning();
    return newVariant;
  }

  async getExperimentVariants(experimentId: string): Promise<ExperimentVariant[]> {
    const variants = await db
      .select()
      .from(experimentVariants)
      .where(eq(experimentVariants.experimentId, experimentId))
      .orderBy(asc(experimentVariants.createdAt));
    return variants;
  }

  async updateExperimentVariant(id: string, data: Partial<InsertExperimentVariant>): Promise<ExperimentVariant> {
    const updateData = data.variantData 
      ? { ...data, variantData: data.variantData as any }
      : data;
    
    const [updated] = await db
      .update(experimentVariants)
      .set(updateData as any)
      .where(eq(experimentVariants.id, id))
      .returning();
    return updated;
  }

  async deleteExperimentVariant(id: string): Promise<void> {
    await db.delete(experimentVariants).where(eq(experimentVariants.id, id));
  }

  // Exposure Operations
  async recordExperimentExposure(exposure: InsertExperimentExposure): Promise<ExperimentExposure> {
    const [newExposure] = await db
      .insert(experimentExposures)
      .values(exposure)
      .returning();

    // Update cached exposure count for variant
    await db
      .update(experimentVariants)
      .set({ 
        exposures: sql`${experimentVariants.exposures} + 1`
      })
      .where(eq(experimentVariants.id, exposure.variantId));

    // Update cached total exposures for experiment
    await db
      .update(experiments)
      .set({ 
        totalExposures: sql`${experiments.totalExposures} + 1`
      })
      .where(eq(experiments.id, exposure.experimentId));

    return newExposure;
  }

  async getExperimentExposures(experimentId: string, variantId?: string): Promise<ExperimentExposure[]> {
    const conditions = [eq(experimentExposures.experimentId, experimentId)];
    
    if (variantId) {
      conditions.push(eq(experimentExposures.variantId, variantId));
    }

    const exposures = await db
      .select()
      .from(experimentExposures)
      .where(and(...conditions))
      .orderBy(desc(experimentExposures.exposedAt));

    return exposures;
  }

  // Conversion Operations
  async recordExperimentConversion(conversion: InsertExperimentConversion): Promise<ExperimentConversion> {
    const [newConversion] = await db
      .insert(experimentConversions)
      .values({
        ...conversion,
        metadata: conversion.metadata as any
      })
      .returning();

    // Update cached conversion count for variant
    await db
      .update(experimentVariants)
      .set({ 
        conversions: sql`${experimentVariants.conversions} + 1`,
        conversionRate: sql`CASE WHEN ${experimentVariants.exposures} > 0 THEN (${experimentVariants.conversions} + 1)::float / ${experimentVariants.exposures}::float * 100 ELSE 0 END`
      })
      .where(eq(experimentVariants.id, conversion.variantId));

    // Update cached total conversions for experiment
    await db
      .update(experiments)
      .set({ 
        totalConversions: sql`${experiments.totalConversions} + 1`
      })
      .where(eq(experiments.id, conversion.experimentId));

    return newConversion;
  }

  async getExperimentConversions(experimentId: string, variantId?: string): Promise<ExperimentConversion[]> {
    const conditions = [eq(experimentConversions.experimentId, experimentId)];
    
    if (variantId) {
      conditions.push(eq(experimentConversions.variantId, variantId));
    }

    const conversions = await db
      .select()
      .from(experimentConversions)
      .where(and(...conditions))
      .orderBy(desc(experimentConversions.convertedAt));

    return conversions;
  }

  // Analytics Operations
  async getExperimentAnalytics(experimentId: string): Promise<{
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
  }> {
    // Get experiment
    const experiment = await this.getExperimentById(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Get all variants with detailed stats
    const variants = await db
      .select({
        variant: experimentVariants,
        exposureCount: sql<number>`COUNT(DISTINCT ${experimentExposures.id})`,
        conversionCount: sql<number>`COUNT(DISTINCT ${experimentConversions.id})`,
        avgReadTime: sql<number>`AVG(CASE WHEN ${experimentConversions.conversionType} = 'read' THEN ${experimentConversions.value} ELSE NULL END)`,
      })
      .from(experimentVariants)
      .leftJoin(experimentExposures, eq(experimentExposures.variantId, experimentVariants.id))
      .leftJoin(experimentConversions, eq(experimentConversions.variantId, experimentVariants.id))
      .where(eq(experimentVariants.experimentId, experimentId))
      .groupBy(experimentVariants.id);

    // Calculate stats for each variant
    const variantsWithStats = variants.map(v => {
      const exposureCount = Number(v.exposureCount) || 0;
      const conversionCount = Number(v.conversionCount) || 0;
      const conversionRate = exposureCount > 0 ? (conversionCount / exposureCount) * 100 : 0;
      const engagementScore = exposureCount > 0 ? (conversionCount / exposureCount) * 100 : 0;

      return {
        ...v.variant,
        exposureCount,
        conversionCount,
        conversionRate,
        averageReadTime: v.avgReadTime ? Number(v.avgReadTime) : undefined,
        engagementScore,
      };
    });

    // Calculate totals
    const totalExposures = variantsWithStats.reduce((sum, v) => sum + v.exposureCount, 0);
    const totalConversions = variantsWithStats.reduce((sum, v) => sum + v.conversionCount, 0);
    const overallConversionRate = totalExposures > 0 ? (totalConversions / totalExposures) * 100 : 0;

    // Determine winner (highest conversion rate)
    let winner: string | undefined;
    if (variantsWithStats.length > 0) {
      const winnerVariant = variantsWithStats.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      winner = winnerVariant.name;
    }

    return {
      experiment,
      variants: variantsWithStats,
      totalExposures,
      totalConversions,
      overallConversionRate,
      winner,
    };
  }

  // Helper Operations
  async getActiveExperimentForArticle(articleId: string): Promise<Experiment | undefined> {
    const [experiment] = await db
      .select()
      .from(experiments)
      .where(
        and(
          eq(experiments.articleId, articleId),
          eq(experiments.status, 'running')
        )
      )
      .limit(1);
    
    return experiment;
  }

  async assignExperimentVariant(
    experimentId: string, 
    userId?: string, 
    sessionId?: string
  ): Promise<ExperimentVariant> {
    // Get all variants for this experiment
    const variants = await this.getExperimentVariants(experimentId);
    
    if (variants.length === 0) {
      throw new Error('No variants found for this experiment');
    }

    // Check if user/session already has an assignment
    const conditions = [eq(experimentExposures.experimentId, experimentId)];
    
    if (userId) {
      conditions.push(eq(experimentExposures.userId, userId));
    } else if (sessionId) {
      conditions.push(eq(experimentExposures.sessionId, sessionId));
    }

    const [existingExposure] = await db
      .select()
      .from(experimentExposures)
      .where(and(...conditions))
      .limit(1);

    if (existingExposure) {
      // Return the existing variant assignment
      const [variant] = await db
        .select()
        .from(experimentVariants)
        .where(eq(experimentVariants.id, existingExposure.variantId));
      return variant;
    }

    // Assign new variant based on traffic allocation
    // Sort variants to ensure consistent ordering
    const sortedVariants = [...variants].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Calculate cumulative traffic allocation
    let cumulativeAllocation = 0;
    const allocations = sortedVariants.map(v => {
      const start = cumulativeAllocation;
      cumulativeAllocation += v.trafficAllocation;
      return { variant: v, start, end: cumulativeAllocation };
    });

    // Generate random number between 0 and total allocation
    const random = Math.random() * cumulativeAllocation;
    
    // Find which variant this random number falls into
    const selectedAllocation = allocations.find(a => random >= a.start && random < a.end);
    const selectedVariant = selectedAllocation?.variant || sortedVariants[0];

    return selectedVariant;
  }

  // Reporter/Staff operations
  async getReporterBySlug(slug: string): Promise<Staff | undefined> {
    const [result] = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        slug: staff.slug,
        name: staff.name,
        nameAr: staff.nameAr,
        title: staff.title,
        titleAr: staff.titleAr,
        bio: staff.bio,
        bioAr: staff.bioAr,
        profileImage: staff.profileImage,
        userProfileImage: users.profileImageUrl,
        staffType: staff.staffType,
        specializations: staff.specializations,
        isActive: staff.isActive,
        isVerified: staff.isVerified,
        publishedCount: staff.publishedCount,
        totalViews: staff.totalViews,
        totalLikes: staff.totalLikes,
        lastActiveAt: staff.lastActiveAt,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      })
      .from(staff)
      .leftJoin(users, eq(staff.userId, users.id))
      .where(and(eq(staff.slug, slug), eq(staff.isActive, true)))
      .limit(1);
    
    if (!result) return undefined;

    // Use staff profileImage first, fallback to user profileImage
    return {
      ...result,
      profileImage: result.profileImage || result.userProfileImage || null,
    } as Staff;
  }

  // Helper function to generate URL-friendly slug from Arabic/English names
  private generateSlug(firstName: string, lastName: string): string {
    // Transliteration map for Arabic to English
    const arabicToEnglish: Record<string, string> = {
      'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
      'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
      'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'dh',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
      'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
      'ة': 'h', 'ئ': 'e', 'ء': 'a',
      ' ': '-', '_': '-'
    };

    const transliterate = (text: string): string => {
      return text
        .split('')
        .map(char => arabicToEnglish[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };

    const firstSlug = transliterate(firstName || '');
    const lastSlug = transliterate(lastName || '');
    
    return `${firstSlug}-${lastSlug}`.replace(/^-|-$/g, '') || 'reporter';
  }

  // Ensure reporter has a staff record (auto-create if needed)
  async ensureReporterStaffRecord(userId: string): Promise<Staff> {
    // Check if staff record already exists
    const [existing] = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);
    
    if (existing) {
      return existing;
    }

    // Get user info
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Generate slug from user's name
    const baseSlug = this.generateSlug(user.firstName || '', user.lastName || '');
    
    // Check for slug conflicts and make it unique if needed
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [conflict] = await db
        .select()
        .from(staff)
        .where(eq(staff.slug, slug))
        .limit(1);
      
      if (!conflict) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create staff record
    const nameAr = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'مراسل';
    const name = nameAr; // For now, use same name

    const [staffRecord] = await db
      .insert(staff)
      .values({
        userId: userId,
        slug: slug,
        name: name,
        nameAr: nameAr,
        staffType: 'reporter',
        isActive: true,
        isVerified: false,
        bio: user.bio || undefined,
        bioAr: user.bio || undefined,
        profileImage: user.profileImageUrl || undefined,
      })
      .returning();

    console.log(`✅ Created staff record for reporter ${userId} with slug: ${slug}`);
    return staffRecord;
  }

  async getStaffByUserId(userId: string): Promise<Staff | null> {
    const [staffRecord] = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .limit(1);
    
    return staffRecord || null;
  }

  async upsertStaff(userId: string, data: { bio?: string; bioAr?: string; title?: string; titleAr?: string }): Promise<Staff> {
    const existingStaff = await this.getStaffByUserId(userId);
    
    if (existingStaff) {
      const [updated] = await db
        .update(staff)
        .set({
          bio: data.bio !== undefined ? (data.bio || null) : existingStaff.bio,
          bioAr: data.bioAr !== undefined ? (data.bioAr || null) : existingStaff.bioAr,
          title: data.title !== undefined ? (data.title || null) : existingStaff.title,
          titleAr: data.titleAr !== undefined ? (data.titleAr || null) : existingStaff.titleAr,
          updatedAt: new Date(),
        })
        .where(eq(staff.id, existingStaff.id))
        .returning();
      
      return updated;
    } else {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const baseSlug = this.generateSlug(user.firstName || '', user.lastName || '');
      
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const [conflict] = await db
          .select()
          .from(staff)
          .where(eq(staff.slug, slug))
          .limit(1);
        
        if (!conflict) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const nameAr = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'موظف';
      const name = nameAr;

      const [staffRecord] = await db
        .insert(staff)
        .values({
          userId: userId,
          slug: slug,
          name: name,
          nameAr: nameAr,
          staffType: 'writer',
          bio: data.bio || null,
          bioAr: data.bioAr || null,
          title: data.title || null,
          titleAr: data.titleAr || null,
          profileImage: user.profileImageUrl || null,
          isActive: true,
          isVerified: false,
        })
        .returning();

      return staffRecord;
    }
  }

  async getReporterProfile(slug: string, windowDays: number = 90, language: 'ar' | 'en' = 'ar'): Promise<ReporterProfile | undefined> {
    // Get reporter basic info
    const reporter = await this.getReporterBySlug(slug);
    if (!reporter) return undefined;

    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() - windowDays);

    // Get reporter's articles with detailed stats
    const reporterArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        publishedAt: articles.publishedAt,
        newsType: articles.newsType,
        views: articles.views,
        categoryId: categories.id,
        categoryNameAr: categories.nameAr,
        categoryNameEn: categories.nameEn,
        categorySlug: categories.slug,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(
        and(
          eq(articles.reporterId, reporter.userId!),
          eq(articles.status, 'published'),
          gte(articles.publishedAt, windowDate)
        )
      )
      .orderBy(desc(articles.publishedAt))
      .execute();

    // Get total stats
    const totalArticles = reporterArticles.length;
    const totalViews = reporterArticles.reduce((sum, a) => sum + (a.views || 0), 0);

    // Get likes count for reporter's articles
    const likesResult = await db
      .select({
        totalLikes: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(reactions)
      .innerJoin(articles, eq(reactions.articleId, articles.id))
      .where(
        and(
          eq(articles.reporterId, reporter.userId!),
          eq(reactions.type, 'like')
        )
      )
      .execute();
    
    const totalLikes = likesResult[0]?.totalLikes || 0;

    // Get comments count for last articles
    const commentsResult = await db
      .select({
        articleId: comments.articleId,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(comments)
      .where(
        inArray(
          comments.articleId,
          reporterArticles.slice(0, 5).map(a => a.id)
        )
      )
      .groupBy(comments.articleId)
      .execute();

    const commentsMap = new Map(commentsResult.map(r => [r.articleId, r.count || 0]));

    // Get reading history for average read time
    // Note: reading_history table has read_duration (in seconds)
    const readingStats = await db
      .select({
        avgReadTime: sql<number>`CAST(AVG(read_duration) / 60.0 AS REAL)`,
      })
      .from(readingHistory)
      .innerJoin(articles, eq(readingHistory.articleId, articles.id))
      .where(eq(articles.reporterId, reporter.userId!))
      .execute();

    // Use default values for completion rate (not tracked in reading_history)
    const avgCompletionRate = 75; // Default reasonable value
    const avgReadTimeMin = Math.round(readingStats[0]?.avgReadTime || 4);

    // Prepare last 5 articles with full details
    const lastArticles: ReporterArticle[] = reporterArticles.slice(0, 5).map(a => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      publishedAt: a.publishedAt,
      category: a.categoryId ? {
        // Always fallback to Arabic if English is missing
        name: language === 'en' 
          ? (a.categoryNameEn || a.categoryNameAr || '') 
          : (a.categoryNameAr || ''),
        slug: a.categorySlug || '',
        color: a.categoryColor,
        icon: a.categoryIcon,
      } : null,
      isBreaking: a.newsType === 'breaking',
      views: a.views || 0,
      likes: 0, // Will calculate separately if needed
      comments: commentsMap.get(a.id) || 0,
      readingTime: avgReadTimeMin,
    }));

    // Get top categories
    const categoryStats = reporterArticles.reduce((acc, a) => {
      // Always fallback to Arabic if English is missing
      const categoryName = language === 'en' 
        ? (a.categoryNameEn || a.categoryNameAr) 
        : a.categoryNameAr;
      if (!a.categoryId || !categoryName) return acc;
      
      const key = a.categoryId;
      if (!acc[key]) {
        acc[key] = {
          name: categoryName,
          slug: a.categorySlug || '',
          color: a.categoryColor,
          articles: 0,
          views: 0,
          sharePct: 0,
        };
      }
      
      acc[key].articles++;
      acc[key].views += a.views || 0;
      
      return acc;
    }, {} as Record<string, ReporterTopCategory>);

    const topCategories = Object.values(categoryStats)
      .sort((a, b) => b.articles - a.articles)
      .slice(0, 5)
      .map(cat => ({
        ...cat,
        sharePct: totalArticles > 0 ? Math.round((cat.articles / totalArticles) * 100) : 0,
      }));

    // Generate time series data (simplified - daily aggregates)
    const timeseries: ReporterTimeseries[] = [];
    const dailyStats = reporterArticles.reduce((acc, a) => {
      if (!a.publishedAt) return acc;
      
      const dateStr = a.publishedAt.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { views: 0, likes: 0 };
      }
      acc[dateStr].views += a.views || 0;
      
      return acc;
    }, {} as Record<string, { views: number; likes: number }>);

    Object.entries(dailyStats).forEach(([date, stats]) => {
      timeseries.push({
        date,
        views: stats.views,
        likes: stats.likes,
      });
    });

    timeseries.sort((a, b) => a.date.localeCompare(b.date));

    // Helper function to check if text contains Arabic characters
    const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
    
    // Generate badges
    const badges: Array<{ key: string; label: string }> = [];
    
    if (reporter.isVerified) {
      badges.push({ 
        key: 'verified', 
        label: language === 'en' ? 'Verified' : 'موثق' 
      });
    }
    
    if (totalArticles >= 20) {
      badges.push({ 
        key: 'active_contributor', 
        label: language === 'en' ? 'Active Contributor' : 'كاتب نشط' 
      });
    }
    
    if (reporter.specializations.length > 0) {
      if (language === 'en') {
        // For English, find first non-Arabic specialization
        const firstEnglishSpec = reporter.specializations.find(spec => !hasArabic(spec));
        if (firstEnglishSpec) {
          badges.push({ 
            key: 'specialist', 
            label: `Specialized in ${firstEnglishSpec}` 
          });
        }
        // If all specializations are in Arabic, skip the badge entirely
      } else {
        // For Arabic, use first specialization
        badges.push({ 
          key: 'specialist', 
          label: `متخصص في ${reporter.specializations[0]}` 
        });
      }
    }

    // Get followers count (only if reporter has a linked userId)
    let followersCount = 0;
    if (reporter.userId) {
      const followersResult = await db
        .select({
          followersCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        })
        .from(socialFollows)
        .where(eq(socialFollows.followingId, reporter.userId))
        .execute();
      
      followersCount = followersResult[0]?.followersCount || 0;
    }

    return {
      id: reporter.id,
      slug: reporter.slug,
      fullName: language === 'en' ? (reporter.name || reporter.nameAr) : (reporter.nameAr || reporter.name),
      title: language === 'en' ? (reporter.title || reporter.titleAr) : (reporter.titleAr || reporter.title),
      avatarUrl: reporter.profileImage,
      bio: language === 'en' ? (reporter.bio || reporter.bioAr) : (reporter.bioAr || reporter.bio),
      isVerified: reporter.isVerified,
      tags: reporter.specializations,
      kpis: {
        totalArticles,
        totalViews,
        totalLikes,
        avgReadTimeMin,
        avgCompletionRate,
        followers: followersCount,
      },
      lastArticles,
      topCategories,
      timeseries: {
        windowDays,
        daily: timeseries,
      },
      badges,
    };
  }

  // Activity Logs operations
  async getActivityLogs(filters?: {
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
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: any[] = [];

    if (filters?.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }

    if (filters?.action) {
      conditions.push(eq(activityLogs.action, filters.action));
    }

    if (filters?.entityType) {
      conditions.push(eq(activityLogs.entityType, filters.entityType));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(activityLogs.createdAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(activityLogs.createdAt, filters.dateTo));
    }

    if (filters?.searchQuery) {
      conditions.push(
        or(
          ilike(activityLogs.action, `%${filters.searchQuery}%`),
          ilike(activityLogs.entityType, `%${filters.searchQuery}%`),
          ilike(activityLogs.entityId, `%${filters.searchQuery}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLogs)
      .where(whereClause);

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get logs with user information
    const logs = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        oldValue: activityLogs.oldValue,
        newValue: activityLogs.newValue,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userProfileImage: users.profileImageUrl,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValue: log.oldValue,
        newValue: log.newValue,
        metadata: log.metadata,
        createdAt: log.createdAt,
        user: log.userId
          ? {
              id: log.userId,
              email: log.userEmail || '',
              firstName: log.userName,
              lastName: log.userLastName,
              profileImageUrl: log.userProfileImage,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getActivityLogById(id: string): Promise<{
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
  } | undefined> {
    const [log] = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        oldValue: activityLogs.oldValue,
        newValue: activityLogs.newValue,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userProfileImage: users.profileImageUrl,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.id, id))
      .limit(1);

    if (!log) {
      return undefined;
    }

    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      metadata: log.metadata,
      createdAt: log.createdAt,
      user: log.userId
        ? {
            id: log.userId,
            email: log.userEmail || '',
            firstName: log.userName,
            lastName: log.userLastName,
            profileImageUrl: log.userProfileImage,
          }
        : null,
    };
  }

  async getActivityLogsAnalytics(): Promise<{
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
  }> {
    // Get top 5 most active users
    const topUsersQuery = await db
      .select({
        userId: activityLogs.userId,
        userName: users.firstName,
        userLastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        activityCount: sql<number>`count(*)::int`,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .groupBy(
        activityLogs.userId,
        users.firstName,
        users.lastName,
        users.email,
        users.profileImageUrl
      )
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const topUsers = topUsersQuery.map((user) => ({
      userId: user.userId || '',
      userName: `${user.userName || ''} ${user.userLastName || ''}`.trim() || user.email || 'مستخدم غير معروف',
      email: user.email || '',
      activityCount: user.activityCount,
      profileImageUrl: user.profileImageUrl,
    }));

    // Get top actions
    const topActionsQuery = await db
      .select({
        action: activityLogs.action,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLogs)
      .groupBy(activityLogs.action)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topActions = topActionsQuery.map((item) => ({
      action: item.action,
      count: item.count,
    }));

    // Get peak hours (activity by hour of day)
    const peakHoursQuery = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${activityLogs.createdAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLogs)
      .groupBy(sql`EXTRACT(HOUR FROM ${activityLogs.createdAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${activityLogs.createdAt})`);

    const peakHours = peakHoursQuery.map((item) => ({
      hour: item.hour,
      count: item.count,
    }));

    // Get success/failure/warning rate (based on action naming convention)
    const actionsQuery = await db
      .select({
        action: activityLogs.action,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLogs)
      .groupBy(activityLogs.action);

    let successCount = 0;
    let failureCount = 0;
    let warningCount = 0;
    let totalCount = 0;

    actionsQuery.forEach((item) => {
      totalCount += item.count;
      const action = item.action.toLowerCase();
      if (action.includes('success') || action.includes('create') || action.includes('update')) {
        successCount += item.count;
      } else if (action.includes('fail') || action.includes('error') || action.includes('delete') || action.includes('ban')) {
        failureCount += item.count;
      } else if (action.includes('warn') || action.includes('suspend')) {
        warningCount += item.count;
      } else {
        successCount += item.count; // Default to success
      }
    });

    // Get recent activity (last 7 days)
    const recentActivityQuery = await db
      .select({
        date: sql<string>`DATE(${activityLogs.createdAt})::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, sql`NOW() - INTERVAL '7 days'`))
      .groupBy(sql`DATE(${activityLogs.createdAt})`)
      .orderBy(sql`DATE(${activityLogs.createdAt})`);

    const recentActivity = recentActivityQuery.map((item) => ({
      date: item.date,
      count: item.count,
    }));

    return {
      topUsers,
      topActions,
      peakHours,
      successFailureRate: {
        successCount,
        failureCount,
        warningCount,
        totalCount,
      },
      recentActivity,
    };
  }

  // ============================================
  // Mirqab Operations - المرقاب
  // ============================================

  // General Mirqab Entry operations
  async getMirqabEntries(filters: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = db.select().from(mirqabEntries);

    const conditions = [];
    if (filters.type) {
      conditions.push(eq(mirqabEntries.entryType, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(mirqabEntries.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(mirqabEntries.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return results;
  }

  async getMirqabEntryById(id: string): Promise<any | undefined> {
    const [entry] = await db
      .select()
      .from(mirqabEntries)
      .where(eq(mirqabEntries.id, id));
    return entry;
  }

  async getMirqabEntryBySlug(slug: string): Promise<any | undefined> {
    const [entry] = await db
      .select()
      .from(mirqabEntries)
      .where(eq(mirqabEntries.slug, slug));
    
    if (!entry) return undefined;

    // Fetch related data based on entry type
    let relatedData: any = {};
    
    if (entry.entryType === 'sabq_index') {
      const sabqIndex = await this.getSabqIndexByEntryId(entry.id);
      relatedData = { sabqIndex };
    } else if (entry.entryType === 'next_story') {
      const nextStory = await this.getNextStoryByEntryId(entry.id);
      relatedData = { nextStory };
    } else if (entry.entryType === 'radar') {
      const radarAlert = await this.getRadarReportByEntryId(entry.id);
      relatedData = { radarAlert };
    } else if (entry.entryType === 'algorithm_article') {
      const algorithmArticle = await this.getAlgorithmArticleByEntryId(entry.id);
      relatedData = { algorithmArticle };
    }

    // Fetch author and editor if available
    let author = undefined;
    let editor = undefined;
    
    if (entry.authorId) {
      author = await this.getUser(entry.authorId);
    }
    
    if (entry.editorId) {
      editor = await this.getUser(entry.editorId);
    }

    return { ...entry, ...relatedData, author, editor };
  }

  async createMirqabEntry(entry: any): Promise<any> {
    const [newEntry] = await db.insert(mirqabEntries).values(entry).returning();
    return newEntry;
  }

  async updateMirqabEntry(id: string, updates: any): Promise<any> {
    const [updated] = await db
      .update(mirqabEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mirqabEntries.id, id))
      .returning();
    return updated;
  }

  async deleteMirqabEntry(id: string): Promise<void> {
    await db.delete(mirqabEntries).where(eq(mirqabEntries.id, id));
  }

  // SABQ Index operations
  async createSabqIndex(data: any): Promise<any> {
    const [newIndex] = await db.insert(mirqabSabqIndex).values(data).returning();
    return newIndex;
  }

  async updateSabqIndex(id: string, updates: any): Promise<any> {
    const [updated] = await db
      .update(mirqabSabqIndex)
      .set(updates)
      .where(eq(mirqabSabqIndex.id, id))
      .returning();
    return updated;
  }

  async getSabqIndexByEntryId(entryId: string): Promise<any | undefined> {
    const [index] = await db
      .select()
      .from(mirqabSabqIndex)
      .where(eq(mirqabSabqIndex.entryId, entryId));
    return index;
  }

  async getLatestSabqIndexes(limit: number): Promise<any[]> {
    const results = await db
      .select({
        id: mirqabEntries.id,
        title: mirqabEntries.title,
        slug: mirqabEntries.slug,
        status: mirqabEntries.status,
        publishedAt: mirqabEntries.publishedAt,
        views: mirqabEntries.views,
        createdAt: mirqabEntries.createdAt,
        indexValue: mirqabSabqIndex.indexValue,
        maxValue: mirqabSabqIndex.maxValue,
        trend: mirqabSabqIndex.trend,
        indexCategory: mirqabSabqIndex.indexCategory,
      })
      .from(mirqabSabqIndex)
      .leftJoin(mirqabEntries, eq(mirqabSabqIndex.entryId, mirqabEntries.id))
      .where(eq(mirqabEntries.status, 'published'))
      .orderBy(desc(mirqabSabqIndex.createdAt))
      .limit(limit);
    return results;
  }

  // Next Story operations
  async createNextStory(data: any): Promise<any> {
    const [newStory] = await db.insert(mirqabNextStory).values(data).returning();
    return newStory;
  }

  async updateNextStory(id: string, updates: any): Promise<any> {
    const [updated] = await db
      .update(mirqabNextStory)
      .set(updates)
      .where(eq(mirqabNextStory.id, id))
      .returning();
    return updated;
  }

  async getNextStoryByEntryId(entryId: string): Promise<any | undefined> {
    const [story] = await db
      .select()
      .from(mirqabNextStory)
      .where(eq(mirqabNextStory.entryId, entryId));
    return story;
  }

  async getUpcomingNextStories(limit: number): Promise<any[]> {
    const results = await db
      .select({
        id: mirqabEntries.id,
        title: mirqabEntries.title,
        slug: mirqabEntries.slug,
        status: mirqabEntries.status,
        publishedAt: mirqabEntries.publishedAt,
        views: mirqabEntries.views,
        createdAt: mirqabEntries.createdAt,
        executiveSummary: mirqabNextStory.executiveSummary,
        confidenceLevel: mirqabNextStory.confidenceLevel,
        expectedTiming: mirqabNextStory.expectedTiming,
        expectedDate: mirqabNextStory.expectedDate,
      })
      .from(mirqabNextStory)
      .leftJoin(mirqabEntries, eq(mirqabNextStory.entryId, mirqabEntries.id))
      .where(eq(mirqabEntries.status, 'published'))
      .orderBy(asc(mirqabNextStory.expectedDate))
      .limit(limit);
    return results;
  }

  // Radar Alert operations
  async createRadarReport(data: any): Promise<any> {
    const [newReport] = await db.insert(mirqabRadarAlerts).values(data).returning();
    return newReport;
  }

  async updateRadarReport(id: string, updates: any): Promise<any> {
    const [updated] = await db
      .update(mirqabRadarAlerts)
      .set(updates)
      .where(eq(mirqabRadarAlerts.id, id))
      .returning();
    return updated;
  }

  async getRadarReportByEntryId(entryId: string): Promise<any | undefined> {
    const [report] = await db
      .select()
      .from(mirqabRadarAlerts)
      .where(eq(mirqabRadarAlerts.entryId, entryId));
    return report;
  }

  async getRadarReportByDate(date: Date): Promise<any | undefined> {
    const [report] = await db
      .select()
      .from(mirqabRadarAlerts)
      .where(eq(mirqabRadarAlerts.reportDate, date));
    return report;
  }

  async getLatestRadarReports(limit: number): Promise<any[]> {
    const results = await db
      .select({
        id: mirqabEntries.id,
        title: mirqabEntries.title,
        slug: mirqabEntries.slug,
        status: mirqabEntries.status,
        publishedAt: mirqabEntries.publishedAt,
        views: mirqabEntries.views,
        createdAt: mirqabEntries.createdAt,
        reportDate: mirqabRadarAlerts.reportDate,
        alerts: mirqabRadarAlerts.alerts,
        summary: mirqabRadarAlerts.summary,
      })
      .from(mirqabRadarAlerts)
      .leftJoin(mirqabEntries, eq(mirqabRadarAlerts.entryId, mirqabEntries.id))
      .where(eq(mirqabEntries.status, 'published'))
      .orderBy(desc(mirqabRadarAlerts.reportDate))
      .limit(limit);
    return results;
  }

  // Algorithm Article operations
  async createAlgorithmArticle(data: any): Promise<any> {
    const [newArticle] = await db.insert(mirqabAlgorithmArticles).values(data).returning();
    return newArticle;
  }

  async updateAlgorithmArticle(id: string, updates: any): Promise<any> {
    const [updated] = await db
      .update(mirqabAlgorithmArticles)
      .set(updates)
      .where(eq(mirqabAlgorithmArticles.id, id))
      .returning();
    return updated;
  }

  async getAlgorithmArticleByEntryId(entryId: string): Promise<any | undefined> {
    const [article] = await db
      .select()
      .from(mirqabAlgorithmArticles)
      .where(eq(mirqabAlgorithmArticles.entryId, entryId));
    return article;
  }

  async getLatestAlgorithmArticles(limit: number): Promise<any[]> {
    const results = await db
      .select({
        id: mirqabEntries.id,
        title: mirqabEntries.title,
        slug: mirqabEntries.slug,
        status: mirqabEntries.status,
        publishedAt: mirqabEntries.publishedAt,
        views: mirqabEntries.views,
        createdAt: mirqabEntries.createdAt,
        analysisType: mirqabAlgorithmArticles.analysisType,
        aiPercentage: mirqabAlgorithmArticles.aiPercentage,
        humanReviewed: mirqabAlgorithmArticles.humanReviewed,
      })
      .from(mirqabAlgorithmArticles)
      .leftJoin(mirqabEntries, eq(mirqabAlgorithmArticles.entryId, mirqabEntries.id))
      .where(eq(mirqabEntries.status, 'published'))
      .orderBy(desc(mirqabAlgorithmArticles.createdAt))
      .limit(limit);
    return results;
  }

  // ============================================
  // Smart Blocks Operations - البلوكات الذكية
  // ============================================

  async createSmartBlock(data: InsertSmartBlock): Promise<SmartBlock> {
    const [block] = await db.insert(smartBlocks).values(data as any).returning();
    return block;
  }

  async getSmartBlocks(filters?: { isActive?: boolean; placement?: string }): Promise<SmartBlock[]> {
    let query = db.select().from(smartBlocks);

    const conditions = [];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(smartBlocks.isActive, filters.isActive));
    }
    if (filters?.placement) {
      conditions.push(eq(smartBlocks.placement, filters.placement));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const blocks = await query.orderBy(desc(smartBlocks.createdAt));
    return blocks;
  }

  async getSmartBlockById(id: string): Promise<SmartBlock | undefined> {
    const [block] = await db.select().from(smartBlocks).where(eq(smartBlocks.id, id));
    return block;
  }

  async getSmartBlocksByPlacement(placement: string): Promise<SmartBlock[]> {
    const blocks = await db
      .select()
      .from(smartBlocks)
      .where(and(
        eq(smartBlocks.placement, placement),
        eq(smartBlocks.isActive, true)
      ))
      .orderBy(desc(smartBlocks.createdAt));
    return blocks;
  }

  async updateSmartBlock(id: string, updates: UpdateSmartBlock): Promise<SmartBlock> {
    const [updated] = await db
      .update(smartBlocks)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(smartBlocks.id, id))
      .returning();
    return updated;
  }

  async deleteSmartBlock(id: string): Promise<void> {
    await db.delete(smartBlocks).where(eq(smartBlocks.id, id));
  }

  async queryArticlesByKeyword(
    keyword: string,
    limit: number,
    filters?: {
      categories?: string[];
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<Array<any>> {
    console.log(`🔎 [Storage] Searching articles with keyword: "${keyword}"`);
    
    const conditions = [
      eq(articles.status, 'published'),
      // Exclude opinion articles
      or(
        isNull(articles.articleType),
        ne(articles.articleType, 'opinion')
      ),
      // Search ONLY in seo.keywords JSONB array - not in title/excerpt
      sql`${articles.seo}::jsonb -> 'keywords' @> ${JSON.stringify([keyword])}::jsonb`
    ];

    if (filters?.categories && filters.categories.length > 0) {
      conditions.push(inArray(articles.categoryId, filters.categories));
      console.log(`   - Filtering by categories: ${filters.categories.join(', ')}`);
    }

    if (filters?.dateFrom) {
      conditions.push(gte(articles.publishedAt, new Date(filters.dateFrom)));
      console.log(`   - Date from: ${filters.dateFrom}`);
    }

    if (filters?.dateTo) {
      conditions.push(lte(articles.publishedAt, new Date(filters.dateTo)));
      console.log(`   - Date to: ${filters.dateTo}`);
    }

    console.log(`   - Limit: ${limit}`);

    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        publishedAt: articles.publishedAt,
        imageUrl: articles.imageUrl,
        categoryId: categories.id,
        category: {
          nameAr: categories.nameAr,
          slug: categories.slug,
          color: categories.color,
        }
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    console.log(`✓ [Storage] Query returned ${results.length} results`);
    
    // Log each result
    results.forEach((article, index) => {
      console.log(`   ${index + 1}. "${article.title.substring(0, 50)}..." [Image: ${article.imageUrl ? '✓' : '✗'}]`);
    });

    return results;
  }

  async queryUrArticlesByKeyword(
    keyword: string,
    limit: number,
    filters?: {
      categories?: string[];
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<Array<any>> {
    console.log(`🔎 [Storage] Searching Urdu articles with keyword: "${keyword}"`);
    
    const conditions = [
      eq(urArticles.status, 'published'),
      // Search ONLY in seo.keywords JSONB array - not in title/excerpt
      sql`${urArticles.seo}::jsonb -> 'keywords' @> ${JSON.stringify([keyword])}::jsonb`
    ];

    if (filters?.categories && filters.categories.length > 0) {
      conditions.push(inArray(urArticles.categoryId, filters.categories));
      console.log(`   - Filtering by categories: ${filters.categories.join(', ')}`);
    }

    if (filters?.dateFrom) {
      conditions.push(gte(urArticles.publishedAt, new Date(filters.dateFrom)));
      console.log(`   - Date from: ${filters.dateFrom}`);
    }

    if (filters?.dateTo) {
      conditions.push(lte(urArticles.publishedAt, new Date(filters.dateTo)));
      console.log(`   - Date to: ${filters.dateTo}`);
    }

    console.log(`   - Limit: ${limit}`);

    const results = await db
      .select({
        id: urArticles.id,
        title: urArticles.title,
        slug: urArticles.slug,
        publishedAt: urArticles.publishedAt,
        imageUrl: urArticles.imageUrl,
        categoryId: urCategories.id,
        category: {
          name: urCategories.name,
          slug: urCategories.slug,
          color: urCategories.color,
        }
      })
      .from(urArticles)
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .where(and(...conditions))
      .orderBy(desc(urArticles.publishedAt))
      .limit(limit);

    console.log(`✓ [Storage] Query returned ${results.length} results`);
    
    // Log each result
    results.forEach((article, index) => {
      console.log(`   ${index + 1}. "${article.title.substring(0, 50)}..." [Image: ${article.imageUrl ? '✓' : '✗'}]`);
    });

    return results;
  }

  // ============================================
  // Audio News Briefs Operations - الأخبار الصوتية السريعة
  // ============================================

  async createAudioNewsBrief(data: InsertAudioNewsBrief): Promise<AudioNewsBrief> {
    const [brief] = await db.insert(audioNewsBriefs).values(data as any).returning();
    return brief;
  }

  async getAudioNewsBriefById(id: string): Promise<AudioNewsBrief | null> {
    const brief = await db.query.audioNewsBriefs.findFirst({
      where: eq(audioNewsBriefs.id, id),
    });
    return brief || null;
  }

  async getAllAudioNewsBriefs(): Promise<AudioNewsBrief[]> {
    return db.query.audioNewsBriefs.findMany({
      orderBy: [desc(audioNewsBriefs.createdAt)],
    });
  }

  async getPublishedAudioNewsBriefs(limit = 10): Promise<AudioNewsBrief[]> {
    return db.query.audioNewsBriefs.findMany({
      where: eq(audioNewsBriefs.status, 'published'),
      orderBy: [desc(audioNewsBriefs.publishedAt)],
      limit,
    });
  }

  async updateAudioNewsBrief(id: string, data: Partial<InsertAudioNewsBrief>): Promise<AudioNewsBrief> {
    const [updated] = await db.update(audioNewsBriefs)
      .set({ ...data as any, updatedAt: new Date() })
      .where(eq(audioNewsBriefs.id, id))
      .returning();
    return updated;
  }

  async deleteAudioNewsBrief(id: string): Promise<void> {
    await db.delete(audioNewsBriefs).where(eq(audioNewsBriefs.id, id));
  }

  async publishAudioNewsBrief(id: string): Promise<AudioNewsBrief> {
    const [published] = await db.update(audioNewsBriefs)
      .set({ 
        status: 'published', 
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(audioNewsBriefs.id, id))
      .returning();
    return published;
  }

  // ============================================
  // Audio Newsletters Operations - النشرات الصوتية
  // ============================================

  async createAudioNewsletter(data: InsertAudioNewsletter): Promise<AudioNewsletter> {
    const [newsletter] = await db
      .insert(audioNewsletters)
      .values(data as any)
      .returning();
    return newsletter;
  }

  async getAudioNewsletterById(id: string): Promise<AudioNewsletterWithDetails | null> {
    const [newsletter] = await db
      .select()
      .from(audioNewsletters)
      .where(eq(audioNewsletters.id, id));

    if (!newsletter) return null;

    // Get articles with details
    const articlesList = await db
      .select()
      .from(audioNewsletterArticles)
      .leftJoin(articles, eq(audioNewsletterArticles.articleId, articles.id))
      .where(eq(audioNewsletterArticles.newsletterId, id))
      .orderBy(asc(audioNewsletterArticles.order));

    const articlesWithDetails = articlesList.map((row) => ({
      ...row.audio_newsletter_articles,
      article: row.articles || undefined,
    }));

    // Get listen count
    const [listensCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(audioNewsletterListens)
      .where(eq(audioNewsletterListens.newsletterId, id));

    return {
      ...newsletter,
      articles: articlesWithDetails,
      _count: {
        articles: articlesWithDetails.length,
        listens: listensCount?.count || 0,
      },
    };
  }

  async getAudioNewsletterBySlug(slug: string): Promise<AudioNewsletterWithDetails | null> {
    const [newsletter] = await db
      .select()
      .from(audioNewsletters)
      .where(eq(audioNewsletters.slug, slug));

    if (!newsletter) return null;

    return this.getAudioNewsletterById(newsletter.id);
  }

  async getAllAudioNewsletters(filters?: { 
    status?: string; 
    limit?: number; 
    offset?: number 
  }): Promise<AudioNewsletterWithDetails[]> {
    let query = db
      .select()
      .from(audioNewsletters)
      .orderBy(desc(audioNewsletters.publishedAt), desc(audioNewsletters.createdAt));

    if (filters?.status) {
      query = query.where(eq(audioNewsletters.status, filters.status)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    const newsletters = await query;

    // Fetch details for each newsletter
    const newslettersWithDetails = await Promise.all(
      newsletters.map(async (newsletter) => {
        const details = await this.getAudioNewsletterById(newsletter.id);
        return details!;
      })
    );

    return newslettersWithDetails;
  }

  async updateAudioNewsletter(id: string, data: UpdateAudioNewsletter): Promise<AudioNewsletter> {
    const [updated] = await db
      .update(audioNewsletters)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(audioNewsletters.id, id))
      .returning();
    return updated;
  }

  async deleteAudioNewsletter(id: string): Promise<void> {
    await db.delete(audioNewsletters).where(eq(audioNewsletters.id, id));
  }

  async addArticlesToNewsletter(newsletterId: string, articleIds: string[]): Promise<void> {
    // Get current max order
    const [maxOrder] = await db
      .select({ max: sql<number>`cast(coalesce(max(${audioNewsletterArticles.order}), 0) as integer)` })
      .from(audioNewsletterArticles)
      .where(eq(audioNewsletterArticles.newsletterId, newsletterId));

    let currentOrder = (maxOrder?.max || 0) + 1;

    // Insert articles in order
    for (const articleId of articleIds) {
      await db
        .insert(audioNewsletterArticles)
        .values({
          newsletterId,
          articleId,
          order: currentOrder++,
        })
        .onConflictDoNothing();
    }
  }

  async removeArticleFromNewsletter(newsletterId: string, articleId: string): Promise<void> {
    await db
      .delete(audioNewsletterArticles)
      .where(
        and(
          eq(audioNewsletterArticles.newsletterId, newsletterId),
          eq(audioNewsletterArticles.articleId, articleId)
        )
      );
  }

  async getNewsletterArticles(newsletterId: string): Promise<(AudioNewsletterArticle & { article?: Article })[]> {
    const results = await db
      .select()
      .from(audioNewsletterArticles)
      .leftJoin(articles, eq(audioNewsletterArticles.articleId, articles.id))
      .where(eq(audioNewsletterArticles.newsletterId, newsletterId))
      .orderBy(asc(audioNewsletterArticles.order));

    return results.map((row) => ({
      ...row.audio_newsletter_articles,
      article: row.articles || undefined,
    }));
  }

  async trackListen(data: InsertAudioNewsletterListen): Promise<AudioNewsletterListen> {
    // Insert listen event
    const [listen] = await db
      .insert(audioNewsletterListens)
      .values(data as any)
      .returning();

    // Atomic analytics update using SQL subqueries (fixes race conditions)
    await db
      .update(audioNewsletters)
      .set({
        totalListens: sql`${audioNewsletters.totalListens} + 1`,
        uniqueListeners: sql`(
          SELECT COUNT(DISTINCT COALESCE(${audioNewsletterListens.userId}, ${audioNewsletterListens.sessionId}))
          FROM ${audioNewsletterListens}
          WHERE ${audioNewsletterListens.newsletterId} = ${data.newsletterId}
        )`,
        averageCompletionRate: sql`(
          SELECT COALESCE(AVG(${audioNewsletterListens.completionPercentage}), 0)
          FROM ${audioNewsletterListens}
          WHERE ${audioNewsletterListens.newsletterId} = ${data.newsletterId}
        )`,
        updatedAt: new Date()
      })
      .where(eq(audioNewsletters.id, data.newsletterId));

    return listen;
  }

  async getNewsletterAnalytics(newsletterId: string): Promise<{
    totalListens: number;
    uniqueListeners: number;
    averageCompletionRate: number;
    listensByDay: { date: string; count: number }[];
  }> {
    // Get unique listeners
    const [uniqueListeners] = await db
      .select({
        count: sql<number>`cast(
          count(distinct coalesce(${audioNewsletterListens.userId}, ${audioNewsletterListens.sessionId}))
          as integer
        )`,
      })
      .from(audioNewsletterListens)
      .where(eq(audioNewsletterListens.newsletterId, newsletterId));

    // Get total listens
    const [totalListens] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(audioNewsletterListens)
      .where(eq(audioNewsletterListens.newsletterId, newsletterId));

    // Calculate average completion rate
    const [avgCompletion] = await db
      .select({
        avg: sql<number>`cast(coalesce(avg(${audioNewsletterListens.completionPercentage}), 0) as real)`,
      })
      .from(audioNewsletterListens)
      .where(eq(audioNewsletterListens.newsletterId, newsletterId));

    // Get listens by day (last 30 days)
    const listensByDay = await db
      .select({
        date: sql<string>`date(${audioNewsletterListens.startedAt})`,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(audioNewsletterListens)
      .where(
        and(
          eq(audioNewsletterListens.newsletterId, newsletterId),
          gte(audioNewsletterListens.startedAt, sql`now() - interval '30 days'`)
        )
      )
      .groupBy(sql`date(${audioNewsletterListens.startedAt})`)
      .orderBy(sql`date(${audioNewsletterListens.startedAt})`);

    return {
      totalListens: totalListens?.count || 0,
      uniqueListeners: uniqueListeners?.count || 0,
      averageCompletionRate: avgCompletion?.avg || 0,
      listensByDay: listensByDay.map((row) => ({
        date: row.date,
        count: row.count,
      })),
    };
  }

  // ============================================
  // Internal Announcements Operations - نظام الإعلانات الداخلية المتقدم
  // ============================================

  async createInternalAnnouncement(data: InsertInternalAnnouncement): Promise<InternalAnnouncement> {
    const [announcement] = await db
      .insert(internalAnnouncements)
      .values(data as any)
      .returning();
    return announcement;
  }

  async getInternalAnnouncementById(id: string): Promise<InternalAnnouncementWithDetails | null> {
    const creatorAlias = aliasedTable(users, 'creator');
    const updaterAlias = aliasedTable(users, 'updater');
    const publisherAlias = aliasedTable(users, 'publisher');

    const [announcement] = await db
      .select()
      .from(internalAnnouncements)
      .leftJoin(creatorAlias, eq(internalAnnouncements.createdBy, creatorAlias.id))
      .leftJoin(updaterAlias, eq(internalAnnouncements.updatedBy, updaterAlias.id))
      .leftJoin(publisherAlias, eq(internalAnnouncements.publishedBy, publisherAlias.id))
      .where(eq(internalAnnouncements.id, id));

    if (!announcement) return null;

    // Get versions
    const versions = await db
      .select()
      .from(internalAnnouncementVersions)
      .where(eq(internalAnnouncementVersions.announcementId, id))
      .orderBy(desc(internalAnnouncementVersions.createdAt));

    // Get metrics
    const metrics = await db
      .select()
      .from(internalAnnouncementMetrics)
      .where(eq(internalAnnouncementMetrics.announcementId, id));

    // Calculate counts
    const [impressionsCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, id),
          eq(internalAnnouncementMetrics.event, 'impression')
        )
      );

    const [uniqueViewsCount] = await db
      .select({ count: sql<number>`cast(count(distinct ${internalAnnouncementMetrics.userId}) as integer)` })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, id),
          eq(internalAnnouncementMetrics.event, 'unique_view')
        )
      );

    const [dismissalsCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, id),
          eq(internalAnnouncementMetrics.event, 'dismiss')
        )
      );

    const [clicksCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, id),
          eq(internalAnnouncementMetrics.event, 'click')
        )
      );

    return {
      ...announcement.internal_announcements,
      creator: announcement.creator || undefined,
      updater: announcement.updater || undefined,
      publisher: announcement.publisher || undefined,
      versions,
      metrics,
      _count: {
        versions: versions.length,
        metrics: metrics.length,
        impressions: impressionsCount?.count || 0,
        uniqueViews: uniqueViewsCount?.count || 0,
        dismissals: dismissalsCount?.count || 0,
        clicks: clicksCount?.count || 0,
      },
    };
  }

  async getAllInternalAnnouncements(filters?: {
    status?: string;
    priority?: string;
    channel?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<InternalAnnouncementWithDetails[]> {
    const creatorAlias = aliasedTable(users, 'creator');
    
    let query = db
      .select()
      .from(internalAnnouncements)
      .leftJoin(creatorAlias, eq(internalAnnouncements.createdBy, creatorAlias.id))
      .orderBy(desc(internalAnnouncements.createdAt));

    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(internalAnnouncements.status, filters.status));
    }

    if (filters?.priority) {
      conditions.push(eq(internalAnnouncements.priority, filters.priority));
    }

    if (filters?.channel) {
      conditions.push(sql`${internalAnnouncements.channels}::jsonb @> ${JSON.stringify([filters.channel])}::jsonb`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      conditions.push(sql`${internalAnnouncements.tags}::jsonb ?| array[${filters.tags.map(t => `'${t}'`).join(',')}]`);
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(internalAnnouncements.title, `%${filters.search}%`),
          ilike(internalAnnouncements.message, `%${filters.search}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    const results = await query;

    // Fetch details for each announcement
    const announcementsWithDetails = await Promise.all(
      results.map(async (row) => {
        const details = await this.getInternalAnnouncementById(row.internal_announcements.id);
        return details!;
      })
    );

    return announcementsWithDetails;
  }

  async updateInternalAnnouncement(
    id: string,
    data: UpdateInternalAnnouncement,
    changedBy: string,
    changeReason?: string
  ): Promise<InternalAnnouncement> {
    // Get current announcement for version snapshot
    const [current] = await db
      .select()
      .from(internalAnnouncements)
      .where(eq(internalAnnouncements.id, id));

    if (!current) {
      throw new Error('Announcement not found');
    }

    // Create version snapshot
    await this.createAnnouncementVersion({
      announcementId: id,
      title: current.title,
      message: current.message,
      priority: current.priority,
      status: current.status,
      channels: current.channels as string[],
      audienceRoles: current.audienceRoles as string[] | undefined,
      audienceUserIds: current.audienceUserIds as string[] | undefined,
      tags: current.tags as string[] | undefined,
      changedBy,
      changeReason,
    });

    // Update announcement
    const [updated] = await db
      .update(internalAnnouncements)
      .set({
        ...data,
        updatedBy: changedBy,
        updatedAt: new Date(),
      } as any)
      .where(eq(internalAnnouncements.id, id))
      .returning();

    return updated;
  }

  async deleteInternalAnnouncement(id: string): Promise<void> {
    await db.delete(internalAnnouncements).where(eq(internalAnnouncements.id, id));
  }

  async publishInternalAnnouncement(id: string, publishedBy: string): Promise<InternalAnnouncement> {
    const [published] = await db
      .update(internalAnnouncements)
      .set({
        status: 'published',
        publishedBy,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(internalAnnouncements.id, id))
      .returning();

    return published;
  }

  async archiveInternalAnnouncement(id: string): Promise<InternalAnnouncement> {
    const [archived] = await db
      .update(internalAnnouncements)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(internalAnnouncements.id, id))
      .returning();

    return archived;
  }

  async scheduleInternalAnnouncement(id: string, startAt: Date, endAt?: Date): Promise<InternalAnnouncement> {
    const [scheduled] = await db
      .update(internalAnnouncements)
      .set({
        status: 'scheduled',
        startAt,
        endAt,
        updatedAt: new Date(),
      })
      .where(eq(internalAnnouncements.id, id))
      .returning();

    return scheduled;
  }

  async getActiveAnnouncementsForUser(
    userId: string,
    userRoles: string[],
    channel?: string
  ): Promise<InternalAnnouncementWithDetails[]> {
    const now = new Date();

    let query = db
      .select()
      .from(internalAnnouncements)
      .where(
        and(
          eq(internalAnnouncements.status, 'published'),
          or(
            isNull(internalAnnouncements.startAt),
            lte(internalAnnouncements.startAt, now)
          )!,
          or(
            isNull(internalAnnouncements.endAt),
            gte(internalAnnouncements.endAt, now)
          )!
        )
      )
      .orderBy(desc(internalAnnouncements.priority), desc(internalAnnouncements.publishedAt));

    const announcements = await query;

    // Filter by channel if specified
    let filteredAnnouncements = announcements;
    if (channel) {
      filteredAnnouncements = announcements.filter(a => 
        (a.channels as string[]).includes(channel)
      );
    }

    // Filter by audience targeting (roles and specific users)
    filteredAnnouncements = filteredAnnouncements.filter(a => {
      // If no audience targeting, show to everyone
      if (!a.audienceRoles && !a.audienceUserIds) {
        return true;
      }

      // Check if user is in specific user list
      if (a.audienceUserIds && (a.audienceUserIds as string[]).includes(userId)) {
        return true;
      }

      // Check if user has any of the required roles
      if (a.audienceRoles && (a.audienceRoles as string[]).some(role => userRoles.includes(role))) {
        return true;
      }

      return false;
    });

    // Fetch details for each announcement
    const announcementsWithDetails = await Promise.all(
      filteredAnnouncements.map(async (announcement) => {
        const details = await this.getInternalAnnouncementById(announcement.id);
        return details!;
      })
    );

    return announcementsWithDetails;
  }

  async createAnnouncementVersion(data: InsertInternalAnnouncementVersion): Promise<InternalAnnouncementVersion> {
    const [version] = await db
      .insert(internalAnnouncementVersions)
      .values(data as any)
      .returning();

    return version;
  }

  async getAnnouncementVersions(announcementId: string): Promise<InternalAnnouncementVersion[]> {
    const versions = await db
      .select()
      .from(internalAnnouncementVersions)
      .where(eq(internalAnnouncementVersions.announcementId, announcementId))
      .orderBy(desc(internalAnnouncementVersions.createdAt));

    return versions;
  }

  async restoreAnnouncementVersion(versionId: string, restoredBy: string): Promise<InternalAnnouncement> {
    // Get the version
    const [version] = await db
      .select()
      .from(internalAnnouncementVersions)
      .where(eq(internalAnnouncementVersions.id, versionId));

    if (!version) {
      throw new Error('Version not found');
    }

    // Get current announcement for creating a version snapshot before restore
    const [current] = await db
      .select()
      .from(internalAnnouncements)
      .where(eq(internalAnnouncements.id, version.announcementId));

    if (!current) {
      throw new Error('Announcement not found');
    }

    // Create snapshot of current state before restoring
    await this.createAnnouncementVersion({
      announcementId: version.announcementId,
      title: current.title,
      message: current.message,
      priority: current.priority,
      status: current.status,
      channels: current.channels as string[],
      audienceRoles: current.audienceRoles as string[] | undefined,
      audienceUserIds: current.audienceUserIds as string[] | undefined,
      tags: current.tags as string[] | undefined,
      changedBy: restoredBy,
      changeReason: `Restored from version ${versionId}`,
    });

    // Restore the version
    const [restored] = await db
      .update(internalAnnouncements)
      .set({
        title: version.title,
        message: version.message,
        priority: version.priority,
        status: version.status,
        channels: version.channels as any,
        audienceRoles: version.audienceRoles as any,
        audienceUserIds: version.audienceUserIds as any,
        tags: version.tags as any,
        updatedBy: restoredBy,
        updatedAt: new Date(),
      })
      .where(eq(internalAnnouncements.id, version.announcementId))
      .returning();

    return restored;
  }

  async trackAnnouncementMetric(data: InsertInternalAnnouncementMetric): Promise<InternalAnnouncementMetric> {
    const [metric] = await db
      .insert(internalAnnouncementMetrics)
      .values(data as any)
      .returning();

    return metric;
  }

  async getAnnouncementMetrics(announcementId: string, event?: string): Promise<InternalAnnouncementMetric[]> {
    const conditions = [eq(internalAnnouncementMetrics.announcementId, announcementId)];
    
    if (event) {
      conditions.push(eq(internalAnnouncementMetrics.event, event));
    }

    const metrics = await db
      .select()
      .from(internalAnnouncementMetrics)
      .where(and(...conditions))
      .orderBy(desc(internalAnnouncementMetrics.occurredAt));

    return metrics;
  }

  async getAnnouncementAnalytics(announcementId: string): Promise<{
    totalImpressions: number;
    uniqueViews: number;
    dismissals: number;
    clicks: number;
    viewsByChannel: { channel: string; count: number }[];
    viewsByDay: { date: string; count: number }[];
  }> {
    // Total impressions
    const [impressions] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, announcementId),
          eq(internalAnnouncementMetrics.event, 'impression')
        )
      );

    // Unique views
    const [uniqueViews] = await db
      .select({ 
        count: sql<number>`cast(count(distinct ${internalAnnouncementMetrics.userId}) as integer)` 
      })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, announcementId),
          eq(internalAnnouncementMetrics.event, 'unique_view')
        )
      );

    // Dismissals
    const [dismissals] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, announcementId),
          eq(internalAnnouncementMetrics.event, 'dismiss')
        )
      );

    // Clicks
    const [clicks] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, announcementId),
          eq(internalAnnouncementMetrics.event, 'click')
        )
      );

    // Views by channel
    const viewsByChannel = await db
      .select({
        channel: internalAnnouncementMetrics.channel,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, announcementId),
          eq(internalAnnouncementMetrics.event, 'unique_view')
        )
      )
      .groupBy(internalAnnouncementMetrics.channel)
      .orderBy(desc(sql`count(*)`));

    // Views by day (last 30 days)
    const viewsByDay = await db
      .select({
        date: sql<string>`date(${internalAnnouncementMetrics.occurredAt})`,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(internalAnnouncementMetrics)
      .where(
        and(
          eq(internalAnnouncementMetrics.announcementId, announcementId),
          eq(internalAnnouncementMetrics.event, 'unique_view'),
          gte(internalAnnouncementMetrics.occurredAt, sql`now() - interval '30 days'`)
        )
      )
      .groupBy(sql`date(${internalAnnouncementMetrics.occurredAt})`)
      .orderBy(sql`date(${internalAnnouncementMetrics.occurredAt})`);

    return {
      totalImpressions: impressions?.count || 0,
      uniqueViews: uniqueViews?.count || 0,
      dismissals: dismissals?.count || 0,
      clicks: clicks?.count || 0,
      viewsByChannel: viewsByChannel.map((row) => ({
        channel: row.channel || 'unknown',
        count: row.count,
      })),
      viewsByDay: viewsByDay.map((row) => ({
        date: row.date,
        count: row.count,
      })),
    };
  }

  async processScheduledAnnouncements(): Promise<void> {
    const now = new Date();

    // Publish scheduled announcements whose startAt time has arrived
    await db
      .update(internalAnnouncements)
      .set({
        status: 'published',
        publishedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(internalAnnouncements.status, 'scheduled'),
          lte(internalAnnouncements.startAt, now)
        )
      );

    // Expire published announcements whose endAt time has passed
    await db
      .update(internalAnnouncements)
      .set({
        status: 'expired',
        updatedAt: now,
      })
      .where(
        and(
          eq(internalAnnouncements.status, 'published'),
          lte(internalAnnouncements.endAt, now)
        )
      );
  }

  // ============================================
  // Sabq Shorts (Reels) Operations - سبق شورتس
  // ============================================

  async getAllShorts(filters?: {
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
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(shorts.status, filters.status));
    }
    if (filters?.categoryId) {
      conditions.push(eq(shorts.categoryId, filters.categoryId));
    }
    if (filters?.reporterId) {
      conditions.push(eq(shorts.reporterId, filters.reporterId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shorts)
      .where(whereClause);

    // Get shorts with relations
    const results = await db
      .select({
        short: shorts,
        category: categories,
        reporter: users,
      })
      .from(shorts)
      .leftJoin(categories, eq(shorts.categoryId, categories.id))
      .leftJoin(users, eq(shorts.reporterId, users.id))
      .where(whereClause)
      .orderBy(desc(shorts.publishedAt), desc(shorts.createdAt))
      .limit(limit)
      .offset(offset);

    const shortsWithDetails: ShortWithDetails[] = results.map(r => ({
      ...r.short,
      category: r.category || undefined,
      reporter: r.reporter || undefined,
    }));

    return {
      shorts: shortsWithDetails,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async getShortById(id: string): Promise<ShortWithDetails | undefined> {
    const [result] = await db
      .select({
        short: shorts,
        category: categories,
        reporter: users,
      })
      .from(shorts)
      .leftJoin(categories, eq(shorts.categoryId, categories.id))
      .leftJoin(users, eq(shorts.reporterId, users.id))
      .where(eq(shorts.id, id));

    if (!result) return undefined;

    return {
      ...result.short,
      category: result.category || undefined,
      reporter: result.reporter || undefined,
    };
  }

  async getShortBySlug(slug: string): Promise<ShortWithDetails | undefined> {
    const [result] = await db
      .select({
        short: shorts,
        category: categories,
        reporter: users,
      })
      .from(shorts)
      .leftJoin(categories, eq(shorts.categoryId, categories.id))
      .leftJoin(users, eq(shorts.reporterId, users.id))
      .where(
        and(
          eq(shorts.slug, slug),
          eq(shorts.status, 'published')
        )
      );

    if (!result) return undefined;

    return {
      ...result.short,
      category: result.category || undefined,
      reporter: result.reporter || undefined,
    };
  }

  async createShort(data: InsertShort): Promise<Short> {
    const [short] = await db.insert(shorts).values(data).returning();
    return short;
  }

  async updateShort(id: string, updates: UpdateShort): Promise<Short> {
    const [short] = await db
      .update(shorts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(shorts.id, id))
      .returning();

    return short;
  }

  async deleteShort(id: string): Promise<Short> {
    const [short] = await db
      .update(shorts)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(shorts.id, id))
      .returning();

    return short;
  }

  async incrementShortViews(id: string): Promise<void> {
    await db
      .update(shorts)
      .set({
        views: sql`${shorts.views} + 1`,
      })
      .where(eq(shorts.id, id));
  }

  async likeShort(id: string): Promise<Short> {
    const [short] = await db
      .update(shorts)
      .set({
        likes: sql`${shorts.likes} + 1`,
      })
      .where(eq(shorts.id, id))
      .returning();

    return short;
  }

  async shareShort(id: string): Promise<Short> {
    const [short] = await db
      .update(shorts)
      .set({
        shares: sql`${shorts.shares} + 1`,
      })
      .where(eq(shorts.id, id))
      .returning();

    return short;
  }

  async trackShortAnalytic(data: InsertShortAnalytic): Promise<ShortAnalytic> {
    const [analytic] = await db
      .insert(shortAnalytics)
      .values(data)
      .returning();

    return analytic;
  }

  async getShortAnalytics(shortId: string, filters?: {
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
  }> {
    // Build where conditions for analytics
    const conditions = [eq(shortAnalytics.shortId, shortId)];
    
    if (filters?.eventType) {
      conditions.push(eq(shortAnalytics.eventType, filters.eventType));
    }
    if (filters?.startDate) {
      conditions.push(gte(shortAnalytics.occurredAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(shortAnalytics.occurredAt, filters.endDate));
    }

    const whereClause = and(...conditions);

    // Get total views count
    const [viewsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shortAnalytics)
      .where(
        and(
          eq(shortAnalytics.shortId, shortId),
          eq(shortAnalytics.eventType, 'view')
        )
      );

    // Get unique viewers
    const [uniqueViewersResult] = await db
      .select({ count: sql<number>`count(DISTINCT COALESCE(${shortAnalytics.userId}, ${shortAnalytics.sessionId}))::int` })
      .from(shortAnalytics)
      .where(
        and(
          eq(shortAnalytics.shortId, shortId),
          eq(shortAnalytics.eventType, 'view')
        )
      );

    // Get average watch time
    const [watchTimeResult] = await db
      .select({ 
        avgWatchTime: sql<number>`COALESCE(AVG(${shortAnalytics.watchTime}), 0)::int`
      })
      .from(shortAnalytics)
      .where(
        and(
          eq(shortAnalytics.shortId, shortId),
          eq(shortAnalytics.eventType, 'watch_time')
        )
      );

    // Get the short to calculate completion rate
    const short = await this.getShortById(shortId);
    const videoDuration = short?.duration || 1;
    const completionRate = watchTimeResult.avgWatchTime / videoDuration;

    // Get events by type
    const eventsByType = await db
      .select({
        eventType: shortAnalytics.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(shortAnalytics)
      .where(eq(shortAnalytics.shortId, shortId))
      .groupBy(shortAnalytics.eventType);

    // Get views by day
    const viewsByDay = await db
      .select({
        date: sql<string>`DATE(${shortAnalytics.occurredAt})::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(shortAnalytics)
      .where(
        and(
          eq(shortAnalytics.shortId, shortId),
          eq(shortAnalytics.eventType, 'view')
        )
      )
      .groupBy(sql`DATE(${shortAnalytics.occurredAt})`)
      .orderBy(sql`DATE(${shortAnalytics.occurredAt})`);

    // Get likes and shares counts
    const [likesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shortAnalytics)
      .where(
        and(
          eq(shortAnalytics.shortId, shortId),
          eq(shortAnalytics.eventType, 'like')
        )
      );

    const [sharesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shortAnalytics)
      .where(
        and(
          eq(shortAnalytics.shortId, shortId),
          eq(shortAnalytics.eventType, 'share')
        )
      );

    return {
      totalViews: viewsResult.count,
      totalLikes: likesResult.count,
      totalShares: sharesResult.count,
      uniqueViewers: uniqueViewersResult.count,
      averageWatchTime: watchTimeResult.avgWatchTime,
      completionRate,
      eventsByType,
      viewsByDay,
    };
  }

  async getFeaturedShorts(limit: number = 10): Promise<ShortWithDetails[]> {
    const results = await db
      .select({
        short: shorts,
        category: categories,
        reporter: users,
      })
      .from(shorts)
      .leftJoin(categories, eq(shorts.categoryId, categories.id))
      .leftJoin(users, eq(shorts.reporterId, users.id))
      .where(
        and(
          eq(shorts.status, 'published'),
          eq(shorts.isFeatured, true)
        )
      )
      .orderBy(desc(shorts.displayOrder), desc(shorts.publishedAt))
      .limit(limit);

    return results.map(r => ({
      ...r.short,
      category: r.category || undefined,
      reporter: r.reporter || undefined,
    }));
  }

  // ============================================
  // Calendar System Implementation - تقويم سبق
  // ============================================

  async getAllCalendarEvents(filters?: {
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
    events: Array<CalendarEvent & { category?: Category | null; createdBy?: User | null }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      type,
      importance,
      dateFrom,
      dateTo,
      categoryId,
      tags,
      searchQuery,
      page = 1,
      limit = 50,
    } = filters || {};

    const conditions = [];

    if (type) conditions.push(eq(calendarEvents.type, type));
    if (importance !== undefined) conditions.push(eq(calendarEvents.importance, importance));
    if (dateFrom) conditions.push(gte(calendarEvents.dateStart, dateFrom));
    if (dateTo) conditions.push(lte(calendarEvents.dateStart, dateTo));
    if (categoryId) conditions.push(eq(calendarEvents.categoryId, categoryId));
    if (tags && tags.length > 0) {
      conditions.push(sql`${calendarEvents.tags} && ${tags}`);
    }
    if (searchQuery) {
      conditions.push(
        or(
          ilike(calendarEvents.title, `%${searchQuery}%`),
          ilike(calendarEvents.description, `%${searchQuery}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(calendarEvents)
      .where(whereClause);

    const total = countResult.count;
    const offset = (page - 1) * limit;

    const results = await db
      .select({
        event: calendarEvents,
        category: categories,
        createdBy: users,
      })
      .from(calendarEvents)
      .leftJoin(categories, eq(calendarEvents.categoryId, categories.id))
      .leftJoin(users, eq(calendarEvents.createdById, users.id))
      .where(whereClause)
      .orderBy(asc(calendarEvents.dateStart))
      .limit(limit)
      .offset(offset);

    const events = results.map(r => ({
      ...r.event,
      category: r.category,
      createdBy: r.createdBy,
    }));

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCalendarEventById(id: string): Promise<(CalendarEvent & { category?: Category | null; createdBy?: User | null }) | undefined> {
    const [result] = await db
      .select({
        event: calendarEvents,
        category: categories,
        createdBy: users,
      })
      .from(calendarEvents)
      .leftJoin(categories, eq(calendarEvents.categoryId, categories.id))
      .leftJoin(users, eq(calendarEvents.createdById, users.id))
      .where(eq(calendarEvents.id, id))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result.event,
      category: result.category,
      createdBy: result.createdBy,
    };
  }

  async getCalendarEventBySlug(slug: string): Promise<(CalendarEvent & { category?: Category | null; createdBy?: User | null }) | undefined> {
    const [result] = await db
      .select({
        event: calendarEvents,
        category: categories,
        createdBy: users,
      })
      .from(calendarEvents)
      .leftJoin(categories, eq(calendarEvents.categoryId, categories.id))
      .leftJoin(users, eq(calendarEvents.createdById, users.id))
      .where(eq(calendarEvents.slug, slug))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result.event,
      category: result.category,
      createdBy: result.createdBy,
    };
  }

  async createCalendarEvent(event: InsertCalendarEvent, reminders?: InsertCalendarReminder[]): Promise<CalendarEvent> {
    return await db.transaction(async (tx) => {
      const [newEvent] = await tx.insert(calendarEvents).values(event as any).returning();

      if (reminders && reminders.length > 0) {
        const reminderValues = reminders.map(r => ({
          ...r,
          eventId: newEvent.id,
        }));
        await tx.insert(calendarReminders).values(reminderValues as any);
      }

      return newEvent;
    });
  }

  async updateCalendarEvent(id: string, updates: UpdateCalendarEvent): Promise<CalendarEvent> {
    // تحويل التواريخ من strings إلى Date objects
    const processedUpdates: any = { ...updates };
    
    if (processedUpdates.dateStart && typeof processedUpdates.dateStart === 'string') {
      processedUpdates.dateStart = new Date(processedUpdates.dateStart);
    }
    
    if (processedUpdates.dateEnd && typeof processedUpdates.dateEnd === 'string') {
      processedUpdates.dateEnd = new Date(processedUpdates.dateEnd);
    }
    
    const [updated] = await db
      .update(calendarEvents)
      .set({ ...processedUpdates, updatedAt: new Date() } as any)
      .where(eq(calendarEvents.id, id))
      .returning();

    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  async getUpcomingCalendarEvents(days: number = 7): Promise<Array<CalendarEvent & { category?: Category | null }>> {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const results = await db
      .select({
        event: calendarEvents,
        category: categories,
      })
      .from(calendarEvents)
      .leftJoin(categories, eq(calendarEvents.categoryId, categories.id))
      .where(
        and(
          gte(calendarEvents.dateStart, now),
          lte(calendarEvents.dateStart, endDate)
        )
      )
      .orderBy(asc(calendarEvents.dateStart));

    return results.map(r => ({
      ...r.event,
      category: r.category,
    }));
  }

  async getCalendarReminders(eventId: string): Promise<CalendarReminder[]> {
    return await db
      .select()
      .from(calendarReminders)
      .where(eq(calendarReminders.eventId, eventId))
      .orderBy(asc(calendarReminders.fireWhen));
  }

  async createCalendarReminder(reminder: InsertCalendarReminder): Promise<CalendarReminder> {
    const [newReminder] = await db
      .insert(calendarReminders)
      .values(reminder as any)
      .returning();
    return newReminder;
  }

  async updateCalendarReminder(id: string, updates: Partial<InsertCalendarReminder>): Promise<CalendarReminder> {
    const [updated] = await db
      .update(calendarReminders)
      .set(updates as any)
      .where(eq(calendarReminders.id, id))
      .returning();
    return updated;
  }

  async deleteCalendarReminder(id: string): Promise<void> {
    await db.delete(calendarReminders).where(eq(calendarReminders.id, id));
  }

  async getRemindersToFire(date: Date): Promise<Array<CalendarReminder & { event: CalendarEvent }>> {
    const results = await db
      .select({
        reminder: calendarReminders,
        event: calendarEvents,
      })
      .from(calendarReminders)
      .innerJoin(calendarEvents, eq(calendarReminders.eventId, calendarEvents.id))
      .where(
        and(
          eq(calendarReminders.enabled, true),
          sql`DATE(${calendarEvents.dateStart}) - INTERVAL '1 day' * ${calendarReminders.fireWhen} <= ${date}`
        )
      );

    return results.map(r => ({
      ...r.reminder,
      event: r.event,
    }));
  }

  async getUpcomingReminders(days: number = 7): Promise<Array<any>> {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const results = await db
      .select({
        reminder: calendarReminders,
        event: calendarEvents,
      })
      .from(calendarReminders)
      .innerJoin(calendarEvents, eq(calendarReminders.eventId, calendarEvents.id))
      .where(
        and(
          eq(calendarReminders.enabled, true),
          gte(calendarEvents.dateStart, now),
          // وقت التذكير يجب أن يكون في المستقبل
          gte(
            sql`DATE(${calendarEvents.dateStart}) - INTERVAL '1 day' * ${calendarReminders.fireWhen}`,
            now
          ),
          // وقت التذكير خلال الأيام القادمة
          lte(
            sql`DATE(${calendarEvents.dateStart}) - INTERVAL '1 day' * ${calendarReminders.fireWhen}`,
            endDate
          )
        )
      )
      .orderBy(
        asc(sql`DATE(${calendarEvents.dateStart}) - INTERVAL '1 day' * ${calendarReminders.fireWhen}`)
      )
      .limit(10);

    // تحويل البيانات للشكل المتوقع في Frontend
    return results.map(r => {
      // حساب وقت التذكير الفعلي
      const eventDate = new Date(r.event.dateStart);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(eventDate.getDate() - r.reminder.fireWhen);

      return {
        id: r.reminder.id,
        eventId: r.reminder.eventId,
        eventTitle: r.event.title,
        reminderTime: reminderDate.toISOString(),
        channelType: r.reminder.channel,
        fireWhen: r.reminder.fireWhen,
        enabled: r.reminder.enabled,
      };
    });
  }

  async getCalendarAiDraft(eventId: string): Promise<CalendarAiDraft | undefined> {
    const [draft] = await db
      .select()
      .from(calendarAiDrafts)
      .where(eq(calendarAiDrafts.eventId, eventId))
      .limit(1);
    return draft;
  }

  async createCalendarAiDraft(draft: InsertCalendarAiDraft): Promise<CalendarAiDraft> {
    const [newDraft] = await db
      .insert(calendarAiDrafts)
      .values(draft as any)
      .returning();
    return newDraft;
  }

  async updateCalendarAiDraft(eventId: string, updates: Partial<InsertCalendarAiDraft>): Promise<CalendarAiDraft> {
    const [updated] = await db
      .update(calendarAiDrafts)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(calendarAiDrafts.eventId, eventId))
      .returning();
    return updated;
  }

  async deleteCalendarAiDraft(eventId: string): Promise<void> {
    await db.delete(calendarAiDrafts).where(eq(calendarAiDrafts.eventId, eventId));
  }

  async getCalendarAssignments(filters?: {
    eventId?: string;
    userId?: string;
    status?: string;
    role?: string;
  }): Promise<Array<any>> {
    const conditions = [];

    if (filters?.eventId) conditions.push(eq(calendarAssignments.eventId, filters.eventId));
    if (filters?.userId) conditions.push(eq(calendarAssignments.userId, filters.userId));
    if (filters?.status) conditions.push(eq(calendarAssignments.status, filters.status));
    if (filters?.role) conditions.push(eq(calendarAssignments.role, filters.role));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const assignedByUser = aliasedTable(users, 'assignedByUser');

    const results = await db
      .select({
        assignment: calendarAssignments,
        event: calendarEvents,
        user: users,
        assignedByUser,
      })
      .from(calendarAssignments)
      .leftJoin(calendarEvents, eq(calendarAssignments.eventId, calendarEvents.id))
      .leftJoin(users, eq(calendarAssignments.userId, users.id))
      .leftJoin(assignedByUser, eq(calendarAssignments.assignedBy, assignedByUser.id))
      .where(whereClause)
      .orderBy(desc(calendarAssignments.assignedAt));

    // تحويل البيانات للشكل المتوقع في Frontend
    return results.map(r => ({
      id: r.assignment.id,
      eventId: r.assignment.eventId,
      eventTitle: r.event?.title || 'مناسبة غير معروفة',
      role: r.assignment.role,
      status: r.assignment.status,
      userId: r.assignment.userId,
      assignedBy: r.assignment.assignedBy,
      assignedAt: r.assignment.assignedAt?.toISOString(),
      event: r.event || undefined,
      user: r.user || undefined,
      assignedByUser: r.assignedByUser || undefined,
    }));
  }

  async createCalendarAssignment(assignment: InsertCalendarAssignment): Promise<CalendarAssignment> {
    const [newAssignment] = await db
      .insert(calendarAssignments)
      .values(assignment as any)
      .returning();
    return newAssignment;
  }

  async updateCalendarAssignment(id: string, updates: UpdateCalendarAssignment): Promise<CalendarAssignment> {
    const [updated] = await db
      .update(calendarAssignments)
      .set(updates as any)
      .where(eq(calendarAssignments.id, id))
      .returning();
    return updated;
  }

  async deleteCalendarAssignment(id: string): Promise<void> {
    await db.delete(calendarAssignments).where(eq(calendarAssignments.id, id));
  }

  async completeCalendarAssignment(id: string): Promise<CalendarAssignment> {
    const [updated] = await db
      .update(calendarAssignments)
      .set({
        status: 'done',
        completedAt: new Date(),
      })
      .where(eq(calendarAssignments.id, id))
      .returning();
    return updated;
  }

  // =====================================================
  // SMART LINKS SYSTEM METHODS
  // =====================================================

  async getEntityTypes(): Promise<EntityType[]> {
    return await db.select().from(entityTypes).orderBy(entityTypes.displayOrder);
  }

  async createEntityType(data: InsertEntityTypeDb): Promise<EntityType> {
    const [entityType] = await db.insert(entityTypes).values(data).returning();
    return entityType;
  }

  async getSmartEntities(filters?: { typeId?: number; status?: string }): Promise<SmartEntity[]> {
    const conditions = [];
    
    if (filters?.typeId) conditions.push(eq(smartEntities.typeId, filters.typeId));
    if (filters?.status) conditions.push(eq(smartEntities.status, filters.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(smartEntities)
      .where(whereClause)
      .orderBy(desc(smartEntities.usageCount));
  }

  async createSmartEntity(data: InsertSmartEntityDb): Promise<SmartEntity> {
    const [entity] = await db.insert(smartEntities).values(data).returning();
    return entity;
  }

  async updateSmartEntity(id: string, data: Partial<InsertSmartEntityDb>): Promise<SmartEntity> {
    const [entity] = await db
      .update(smartEntities)
      .set(data)
      .where(eq(smartEntities.id, id))
      .returning();
    return entity;
  }

  async deleteSmartEntity(id: string): Promise<void> {
    await db.delete(smartEntities).where(eq(smartEntities.id, id));
  }

  async getSmartTerms(filters?: { category?: string; status?: string }): Promise<SmartTerm[]> {
    const conditions = [];
    
    if (filters?.category) conditions.push(eq(smartTerms.category, filters.category));
    if (filters?.status) conditions.push(eq(smartTerms.status, filters.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(smartTerms)
      .where(whereClause)
      .orderBy(desc(smartTerms.usageCount));
  }

  async createSmartTerm(data: InsertSmartTermDb): Promise<SmartTerm> {
    const [term] = await db.insert(smartTerms).values(data).returning();
    return term;
  }

  async incrementEntityUsage(entityId: string): Promise<void> {
    await db
      .update(smartEntities)
      .set({ usageCount: sql`${smartEntities.usageCount} + 1` })
      .where(eq(smartEntities.id, entityId));
  }

  async incrementTermUsage(termId: string): Promise<void> {
    await db
      .update(smartTerms)
      .set({ usageCount: sql`${smartTerms.usageCount} + 1` })
      .where(eq(smartTerms.id, termId));
  }

  // =====================================================
  // ENGLISH USER DATA METHODS
  // =====================================================

  async getEnUserBookmarks(userId: string): Promise<EnArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: enArticles,
        category: enCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(enBookmarks)
      .innerJoin(enArticles, eq(enBookmarks.articleId, enArticles.id))
      .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
      .leftJoin(users, eq(enArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
      .where(eq(enBookmarks.userId, userId))
      .orderBy(desc(enBookmarks.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      isBookmarked: true,
    }));
  }

  async getEnUserLikedArticles(userId: string): Promise<EnArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: enArticles,
        category: enCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(enReactions)
      .innerJoin(enArticles, eq(enReactions.articleId, enArticles.id))
      .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
      .leftJoin(users, eq(enArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
      .where(and(eq(enReactions.userId, userId), eq(enArticles.status, "published")))
      .orderBy(desc(enReactions.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      hasReacted: true,
    }));
  }

  async getEnUserReadingHistory(userId: string, limit: number = 20): Promise<EnArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: enArticles,
        category: enCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(enReadingHistory)
      .innerJoin(enArticles, eq(enReadingHistory.articleId, enArticles.id))
      .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
      .leftJoin(users, eq(enArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
      .where(eq(enReadingHistory.userId, userId))
      .orderBy(desc(enReadingHistory.readAt))
      .limit(limit);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
    }));
  }

  async getEnArticleById(id: string, userId?: string): Promise<EnArticleWithDetails | undefined> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: enArticles,
        category: enCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(enArticles)
      .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
      .leftJoin(users, eq(enArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
      .where(eq(enArticles.id, id));

    if (results.length === 0) return undefined;

    const result = results[0];
    const article = result.article;

    // Run all queries in parallel for better performance
    const [
      bookmarkResult,
      reactionResult,
      reactionsCountResult,
      commentsCountResult
    ] = await Promise.all([
      userId ? db.select().from(enBookmarks)
        .where(and(eq(enBookmarks.articleId, article.id), eq(enBookmarks.userId, userId)))
        .limit(1) : Promise.resolve([]),
      userId ? db.select().from(enReactions)
        .where(and(eq(enReactions.articleId, article.id), eq(enReactions.userId, userId)))
        .limit(1) : Promise.resolve([]),
      db.select({ count: sql<number>`count(*)` })
        .from(enReactions)
        .where(eq(enReactions.articleId, article.id)),
      db.select({ count: sql<number>`count(*)` })
        .from(enComments)
        .where(eq(enComments.articleId, article.id))
    ]);

    const isBookmarked = bookmarkResult.length > 0;
    const hasReacted = reactionResult.length > 0;
    const reactionsCount = Number(reactionsCountResult[0].count);
    const commentsCount = Number(commentsCountResult[0].count);

    return {
      ...article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
      isBookmarked,
      hasReacted,
      reactionsCount,
      commentsCount,
    };
  }

  async getEnglishRelatedArticles(articleId: string, categoryId?: string): Promise<any[]> {
    const conditions = [
      eq(enArticles.status, "published"),
      ne(enArticles.id, articleId),
    ];

    if (categoryId) {
      conditions.push(eq(enArticles.categoryId, categoryId));
    }

    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: enArticles,
        category: enCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(enArticles)
      .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
      .leftJoin(users, eq(enArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
      .where(and(...conditions))
      .orderBy(desc(enArticles.publishedAt))
      .limit(5);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
    }));
  }

  // =====================================================
  // URDU OPERATIONS - عملیات اردو
  // =====================================================

  // Urdu Categories
  async getUrCategories(filters?: { status?: string }): Promise<UrCategory[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(urCategories.status, filters.status));
    }

    const query = conditions.length > 0
      ? db.select().from(urCategories).where(and(...conditions)).orderBy(asc(urCategories.displayOrder))
      : db.select().from(urCategories).orderBy(asc(urCategories.displayOrder));

    return await query;
  }

  async getUrCategoryById(id: string): Promise<UrCategory | undefined> {
    const [category] = await db.select().from(urCategories).where(eq(urCategories.id, id));
    return category;
  }

  async getUrCategoryBySlug(slug: string): Promise<UrCategory | undefined> {
    const [category] = await db.select().from(urCategories).where(eq(urCategories.slug, slug));
    return category;
  }

  async createUrCategory(category: InsertUrCategory): Promise<UrCategory> {
    const [newCategory] = await db.insert(urCategories).values(category).returning();
    return newCategory;
  }

  async updateUrCategory(id: string, updates: Partial<InsertUrCategory>): Promise<UrCategory> {
    const [updatedCategory] = await db
      .update(urCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(urCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteUrCategory(id: string): Promise<void> {
    await db.delete(urCategories).where(eq(urCategories.id, id));
  }

  // Urdu Articles
  async getUrArticles(filters?: {
    categoryId?: string;
    status?: string;
    authorId?: string;
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<UrArticleWithDetails[]> {
    const conditions = [];

    if (filters?.categoryId) {
      conditions.push(eq(urArticles.categoryId, filters.categoryId));
    }
    if (filters?.status) {
      conditions.push(eq(urArticles.status, filters.status));
    }
    if (filters?.authorId) {
      conditions.push(eq(urArticles.authorId, filters.authorId));
    }
    if (filters?.searchQuery) {
      conditions.push(
        or(
          ilike(urArticles.title, `%${filters.searchQuery}%`),
          ilike(urArticles.content, `%${filters.searchQuery}%`)
        )!
      );
    }

    const reporterAlias = aliasedTable(users, 'reporter');
    
    let query = db
      .select({
        article: urArticles,
        category: urCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(urArticles)
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .leftJoin(users, eq(urArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(urArticles.publishedAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    const results = await query;

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
    }));
  }

  async getUrArticleBySlug(slug: string): Promise<UrArticleWithDetails | undefined> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: urArticles,
        category: urCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(urArticles)
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .leftJoin(users, eq(urArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
      .where(eq(urArticles.slug, slug));

    if (results.length === 0) return undefined;

    const result = results[0];
    return {
      ...result.article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
    };
  }

  async getUrArticleById(id: string): Promise<UrArticleWithDetails | undefined> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: urArticles,
        category: urCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(urArticles)
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .leftJoin(users, eq(urArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
      .where(eq(urArticles.id, id));

    if (results.length === 0) return undefined;

    const result = results[0];
    return {
      ...result.article,
      category: result.category || undefined,
      author: result.reporter || result.author || undefined,
    };
  }

  async createUrArticle(article: InsertUrArticle): Promise<UrArticle> {
    const [newArticle] = await db.insert(urArticles).values([article]).returning();
    return newArticle;
  }

  async updateUrArticle(id: string, updates: Partial<InsertUrArticle>): Promise<UrArticle> {
    const [updatedArticle] = await db
      .update(urArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(urArticles.id, id))
      .returning();
    return updatedArticle;
  }

  async deleteUrArticle(id: string): Promise<void> {
    await db.delete(urArticles).where(eq(urArticles.id, id));
  }

  async incrementUrArticleViews(id: string): Promise<void> {
    await db
      .update(urArticles)
      .set({ views: sql`${urArticles.views} + 1` })
      .where(eq(urArticles.id, id));
  }

  // Urdu Comments
  async getUrArticleComments(articleId: string): Promise<UrCommentWithUser[]> {
    const results = await db
      .select({
        comment: urComments,
        user: users,
      })
      .from(urComments)
      .leftJoin(users, eq(urComments.userId, users.id))
      .where(eq(urComments.articleId, articleId))
      .orderBy(desc(urComments.createdAt));

    return results.map((r) => ({
      ...r.comment,
      user: r.user!,
    }));
  }

  async createUrComment(comment: InsertUrComment): Promise<UrComment> {
    const [newComment] = await db.insert(urComments).values(comment).returning();
    return newComment;
  }

  async updateUrComment(id: string, updates: Partial<InsertUrComment>): Promise<UrComment> {
    const [updatedComment] = await db
      .update(urComments)
      .set(updates)
      .where(eq(urComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteUrComment(id: string): Promise<void> {
    await db.delete(urComments).where(eq(urComments.id, id));
  }

  // Urdu Reactions
  async getUrArticleReactions(articleId: string): Promise<UrReaction[]> {
    return await db.select().from(urReactions).where(eq(urReactions.articleId, articleId));
  }

  async getUserUrReaction(articleId: string, userId: string): Promise<UrReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(urReactions)
      .where(and(eq(urReactions.articleId, articleId), eq(urReactions.userId, userId)));
    return reaction;
  }

  async createUrReaction(reaction: InsertUrReaction): Promise<UrReaction> {
    const [newReaction] = await db.insert(urReactions).values(reaction).returning();
    return newReaction;
  }

  async deleteUrReaction(id: string): Promise<void> {
    await db.delete(urReactions).where(eq(urReactions.id, id));
  }

  // Urdu Bookmarks
  async getUrUserBookmarks(userId: string): Promise<UrArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: urArticles,
        category: urCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(urBookmarks)
      .innerJoin(urArticles, eq(urBookmarks.articleId, urArticles.id))
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .leftJoin(users, eq(urArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
      .where(eq(urBookmarks.userId, userId))
      .orderBy(desc(urBookmarks.createdAt));

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
      isBookmarked: true,
    }));
  }

  async getUserUrBookmark(articleId: string, userId: string): Promise<UrBookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(urBookmarks)
      .where(and(eq(urBookmarks.articleId, articleId), eq(urBookmarks.userId, userId)));
    return bookmark;
  }

  async createUrBookmark(bookmark: InsertUrBookmark): Promise<UrBookmark> {
    const [newBookmark] = await db.insert(urBookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async deleteUrBookmark(id: string): Promise<void> {
    await db.delete(urBookmarks).where(eq(urBookmarks.id, id));
  }

  // Urdu Reading History
  async getUrUserReadingHistory(userId: string, limit: number = 20): Promise<UrArticleWithDetails[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    
    const results = await db
      .select({
        article: urArticles,
        category: urCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(urReadingHistory)
      .innerJoin(urArticles, eq(urReadingHistory.articleId, urArticles.id))
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .leftJoin(users, eq(urArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
      .where(eq(urReadingHistory.userId, userId))
      .orderBy(desc(urReadingHistory.readAt))
      .limit(limit);

    return results.map((r) => ({
      ...r.article,
      category: r.category || undefined,
      author: r.reporter || r.author || undefined,
    }));
  }

  async createUrReadingHistory(history: InsertUrReadingHistory): Promise<UrReadingHistory> {
    const [newHistory] = await db.insert(urReadingHistory).values(history).returning();
    return newHistory;
  }

  // Urdu Smart Blocks
  async getUrSmartBlocks(filters?: { placement?: string; type?: string; isActive?: boolean }): Promise<UrSmartBlock[]> {
    let query = db.select().from(urSmartBlocks);

    const conditions = [];
    if (filters?.placement) {
      conditions.push(eq(urSmartBlocks.placement, filters.placement));
    }
    if (filters?.type) {
      conditions.push(eq(urSmartBlocks.type, filters.type));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(urSmartBlocks.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const blocks = await query.orderBy(desc(urSmartBlocks.createdAt));
    return blocks;
  }

  async getUrSmartBlockById(id: string): Promise<UrSmartBlock | undefined> {
    const [block] = await db.select().from(urSmartBlocks).where(eq(urSmartBlocks.id, id));
    return block;
  }

  async createUrSmartBlock(block: InsertUrSmartBlock): Promise<UrSmartBlock> {
    const [newBlock] = await db.insert(urSmartBlocks).values(block).returning();
    return newBlock;
  }

  async updateUrSmartBlock(id: string, updates: Partial<InsertUrSmartBlock>): Promise<UrSmartBlock> {
    const [updated] = await db
      .update(urSmartBlocks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(urSmartBlocks.id, id))
      .returning();
    return updated;
  }

  async deleteUrSmartBlock(id: string): Promise<void> {
    await db.delete(urSmartBlocks).where(eq(urSmartBlocks.id, id));
  }

  // Urdu Dashboard Statistics
  async getUrDashboardStats(): Promise<{
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
  }> {
    const [articlesStats] = await db
      .select({
        published: sql<number>`count(*) filter (where ${urArticles.status} = 'published')`,
        draft: sql<number>`count(*) filter (where ${urArticles.status} = 'draft')`,
        archived: sql<number>`count(*) filter (where ${urArticles.status} = 'archived')`,
        scheduled: sql<number>`count(*) filter (where ${urArticles.status} = 'scheduled')`,
        totalViews: sql<number>`coalesce(sum(${urArticles.views}), 0)`,
      })
      .from(urArticles);

    const [categoriesStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${urCategories.status} = 'active')`,
      })
      .from(urCategories);

    const reporterAlias = aliasedTable(users, 'reporter');
    
    const recentArticles = await db
      .select({
        article: urArticles,
        category: urCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(urArticles)
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .leftJoin(users, eq(urArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
      .orderBy(desc(urArticles.createdAt))
      .limit(5);

    const topArticles = await db
      .select({
        article: urArticles,
        category: urCategories,
        author: users,
        reporter: reporterAlias,
      })
      .from(urArticles)
      .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
      .leftJoin(users, eq(urArticles.authorId, users.id))
      .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
      .where(eq(urArticles.status, "published"))
      .orderBy(desc(urArticles.views))
      .limit(5);

    return {
      articles: {
        published: Number(articlesStats.published),
        draft: Number(articlesStats.draft),
        archived: Number(articlesStats.archived),
        scheduled: Number(articlesStats.scheduled),
        totalViews: Number(articlesStats.totalViews),
      },
      categories: {
        total: Number(categoriesStats.total),
        active: Number(categoriesStats.active),
      },
      recentArticles: recentArticles.map((r) => ({
        ...r.article,
        category: r.category || undefined,
        author: r.reporter || r.author || undefined,
      })),
      topArticles: topArticles.map((r) => ({
        ...r.article,
        category: r.category || undefined,
        author: r.reporter || r.author || undefined,
      })),
    };
  }
  
  // Data Story operations
  async createDataStorySource(source: InsertDataStorySource): Promise<DataStorySource> {
    const [created] = await db.insert(dataStorySources).values(source).returning();
    return created;
  }

  async getDataStorySource(id: string): Promise<DataStorySource | undefined> {
    const [source] = await db.select().from(dataStorySources).where(eq(dataStorySources.id, id)).limit(1);
    return source;
  }

  async updateDataStorySource(id: string, data: Partial<InsertDataStorySource>): Promise<DataStorySource> {
    const [updated] = await db
      .update(dataStorySources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataStorySources.id, id))
      .returning();
    return updated;
  }

  async getUserDataStorySources(userId: string, limit: number = 50): Promise<DataStorySource[]> {
    return await db
      .select()
      .from(dataStorySources)
      .where(eq(dataStorySources.userId, userId))
      .orderBy(desc(dataStorySources.createdAt))
      .limit(limit);
  }

  async createDataStoryAnalysis(analysis: InsertDataStoryAnalysis): Promise<DataStoryAnalysis> {
    const [created] = await db.insert(dataStoryAnalyses).values(analysis).returning();
    return created;
  }

  async getDataStoryAnalysis(id: string): Promise<DataStoryAnalysis | undefined> {
    const [analysis] = await db.select().from(dataStoryAnalyses).where(eq(dataStoryAnalyses.id, id)).limit(1);
    return analysis;
  }

  async updateDataStoryAnalysis(id: string, data: Partial<InsertDataStoryAnalysis>): Promise<DataStoryAnalysis> {
    const [updated] = await db
      .update(dataStoryAnalyses)
      .set(data)
      .where(eq(dataStoryAnalyses.id, id))
      .returning();
    return updated;
  }

  async getAnalysesBySourceId(sourceId: string): Promise<DataStoryAnalysis[]> {
    return await db
      .select()
      .from(dataStoryAnalyses)
      .where(eq(dataStoryAnalyses.sourceId, sourceId))
      .orderBy(desc(dataStoryAnalyses.createdAt));
  }

  async createDataStoryDraft(draft: InsertDataStoryDraft): Promise<DataStoryDraft> {
    const [created] = await db.insert(dataStoryDrafts).values(draft).returning();
    return created;
  }

  async getDataStoryDraft(id: string): Promise<DataStoryDraft | undefined> {
    const [draft] = await db.select().from(dataStoryDrafts).where(eq(dataStoryDrafts.id, id)).limit(1);
    return draft;
  }

  async updateDataStoryDraft(id: string, data: Partial<InsertDataStoryDraft>): Promise<DataStoryDraft> {
    const [updated] = await db
      .update(dataStoryDrafts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataStoryDrafts.id, id))
      .returning();
    return updated;
  }

  async getDraftsByAnalysisId(analysisId: string): Promise<DataStoryDraft[]> {
    return await db
      .select()
      .from(dataStoryDrafts)
      .where(eq(dataStoryDrafts.analysisId, analysisId))
      .orderBy(desc(dataStoryDrafts.createdAt));
  }

  async getUserDataStoryDrafts(userId: string, limit: number = 50): Promise<DataStoryDraft[]> {
    return await db
      .select()
      .from(dataStoryDrafts)
      .where(eq(dataStoryDrafts.userId, userId))
      .orderBy(desc(dataStoryDrafts.createdAt))
      .limit(limit);
  }

  async convertDraftToArticle(draftId: string, articleId: string): Promise<DataStoryDraft> {
    const [updated] = await db
      .update(dataStoryDrafts)
      .set({
        articleId,
        convertedAt: new Date(),
        status: 'converted_to_article',
        updatedAt: new Date()
      })
      .where(eq(dataStoryDrafts.id, draftId))
      .returning();
    return updated;
  }

  async getDataStoryWithDetails(sourceId: string): Promise<DataStoryWithDetails | undefined> {
    const source = await this.getDataStorySource(sourceId);
    if (!source) return undefined;

    const analyses = await this.getAnalysesBySourceId(sourceId);
    
    const analysesWithDrafts = await Promise.all(
      analyses.map(async (analysis) => {
        const drafts = await this.getDraftsByAnalysisId(analysis.id);
        return { ...analysis, drafts };
      })
    );

    return { ...source, analyses: analysesWithDrafts };
  }
  
  // Short Links operations
  async createShortLink(data: InsertShortLink): Promise<ShortLink> {
    const maxRetries = 5;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        const shortCode = nanoid(8);
        
        const [created] = await db
          .insert(shortLinks)
          .values({
            ...data,
            shortCode,
            utmMedium: data.utmMedium || 'social',
          })
          .returning();
        
        console.log(`✅ Short link created: ${shortCode} -> ${data.originalUrl}`);
        return created;
      } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'short_links_short_code_unique') {
          attempts++;
          console.log(`⚠️  Short code collision (attempt ${attempts}/${maxRetries}), retrying...`);
          if (attempts >= maxRetries) {
            throw new Error('Failed to generate unique short code after multiple attempts');
          }
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Failed to create short link');
  }

  async getShortLinkByCode(code: string): Promise<ShortLink | undefined> {
    const [link] = await db
      .select()
      .from(shortLinks)
      .where(eq(shortLinks.shortCode, code))
      .limit(1);
    return link;
  }

  async getShortLinkByArticle(articleId: string): Promise<ShortLink | undefined> {
    const [link] = await db
      .select()
      .from(shortLinks)
      .where(
        and(
          eq(shortLinks.articleId, articleId),
          eq(shortLinks.isActive, true)
        )
      )
      .orderBy(desc(shortLinks.createdAt))
      .limit(1);
    return link;
  }

  async incrementShortLinkClick(linkId: string, clickData: InsertShortLinkClick): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(shortLinks)
        .set({
          clickCount: sql`${shortLinks.clickCount} + 1`,
          lastClickedAt: new Date(),
        })
        .where(eq(shortLinks.id, linkId));

      await tx.insert(shortLinkClicks).values({
        shortLinkId: linkId,
        ...clickData,
      });
    });
    
    console.log(`📊 Short link click logged: ${linkId}`);
  }

  async getShortLinkAnalytics(linkId: string, days: number = 30): Promise<{
    totalClicks: number;
    uniqueUsers: number;
    topSources: Array<{ source: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const clicks = await db
      .select()
      .from(shortLinkClicks)
      .where(
        and(
          eq(shortLinkClicks.shortLinkId, linkId),
          gte(shortLinkClicks.clickedAt, startDate)
        )
      );

    const uniqueUserIds = new Set(
      clicks
        .filter(c => c.userId)
        .map(c => c.userId)
    );

    const sourceMap = new Map<string, number>();
    clicks.forEach(click => {
      const source = click.referer || 'direct';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });

    const topSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalClicks: clicks.length,
      uniqueUsers: uniqueUserIds.size,
      topSources,
    };
  }

  // ============================================================
  // APPLE WALLET OPERATIONS
  // ============================================================

  async getWalletPassByUserAndType(userId: string, passType: 'press' | 'loyalty'): Promise<WalletPass | null> {
    const [pass] = await db
      .select()
      .from(walletPasses)
      .where(and(
        eq(walletPasses.userId, userId),
        eq(walletPasses.passType, passType)
      ))
      .limit(1);
    return pass || null;
  }

  async getWalletPassBySerial(serialNumber: string): Promise<WalletPass | null> {
    const [pass] = await db
      .select()
      .from(walletPasses)
      .where(eq(walletPasses.serialNumber, serialNumber))
      .limit(1);
    return pass || null;
  }

  async createWalletPass(data: {
    userId: string;
    passType: 'press' | 'loyalty';
    passTypeIdentifier: string;
    serialNumber: string;
    authenticationToken: string;
  }): Promise<WalletPass> {
    const [pass] = await db
      .insert(walletPasses)
      .values(data)
      .returning();
    
    console.log(`✅ Wallet pass created for user ${data.userId} (${data.passType}): ${pass.serialNumber}`);
    return pass;
  }

  async updateWalletPassTimestamp(passId: string): Promise<void> {
    await db
      .update(walletPasses)
      .set({ lastUpdated: new Date() })
      .where(eq(walletPasses.id, passId));
    
    console.log(`🔄 Wallet pass timestamp updated: ${passId}`);
  }

  async deleteWalletPass(userId: string, passType: 'press' | 'loyalty'): Promise<void> {
    await db
      .delete(walletPasses)
      .where(and(
        eq(walletPasses.userId, userId),
        eq(walletPasses.passType, passType)
      ));
    
    console.log(`🗑️  Wallet pass deleted for user ${userId} (${passType})`);
  }

  async getWalletPassesByUser(userId: string): Promise<WalletPass[]> {
    return db
      .select()
      .from(walletPasses)
      .where(eq(walletPasses.userId, userId));
  }

  async getDevicesForPass(passId: string): Promise<WalletDevice[]> {
    const devices = await db
      .select()
      .from(walletDevices)
      .where(eq(walletDevices.passId, passId));
    return devices;
  }

  async registerDevice(data: {
    passId: string;
    deviceLibraryIdentifier: string;
    pushToken: string;
  }): Promise<WalletDevice> {
    try {
      const [device] = await db
        .insert(walletDevices)
        .values(data)
        .onConflictDoUpdate({
          target: [walletDevices.passId, walletDevices.deviceLibraryIdentifier],
          set: {
            pushToken: data.pushToken,
            registeredAt: new Date(),
          },
        })
        .returning();
      
      console.log(`📱 Device registered for pass ${data.passId}: ${data.deviceLibraryIdentifier}`);
      return device;
    } catch (error: any) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  async unregisterDevice(passId: string, deviceLibraryIdentifier: string): Promise<void> {
    await db
      .delete(walletDevices)
      .where(
        and(
          eq(walletDevices.passId, passId),
          eq(walletDevices.deviceLibraryIdentifier, deviceLibraryIdentifier)
        )
      );
    
    console.log(`🗑️  Device unregistered from pass ${passId}: ${deviceLibraryIdentifier}`);
  }

  async getUpdatedPasses(
    deviceLibraryIdentifier: string,
    passTypeIdentifier: string,
    tag?: string
  ): Promise<string[]> {
    const query = db
      .select({ serialNumber: walletPasses.serialNumber })
      .from(walletPasses)
      .innerJoin(walletDevices, eq(walletDevices.passId, walletPasses.id))
      .where(
        and(
          eq(walletDevices.deviceLibraryIdentifier, deviceLibraryIdentifier),
          eq(walletPasses.passTypeIdentifier, passTypeIdentifier)
        )
      );

    const results = await query;
    const serialNumbers = results.map(r => r.serialNumber);
    
    console.log(`🔍 Found ${serialNumbers.length} updated passes for device ${deviceLibraryIdentifier}`);
    return serialNumbers;
  }

  // ============================================================
  // USER POINTS/LOYALTY OPERATIONS
  // ============================================================

  async getUserPointsTotal(userId: string): Promise<UserPointsTotal | null> {
    const [points] = await db
      .select()
      .from(userPointsTotal)
      .where(eq(userPointsTotal.userId, userId))
      .limit(1);
    return points || null;
  }

  async createUserPointsTotal(userId: string): Promise<UserPointsTotal> {
    const [points] = await db
      .insert(userPointsTotal)
      .values({
        userId,
        totalPoints: 0,
        currentRank: 'القارئ الجديد',
        rankLevel: 1,
        lifetimePoints: 0,
      })
      .returning();
    
    console.log(`✅ User points total created for user ${userId}`);
    return points;
  }

  async updateUserPointsTotal(userId: string, data: {
    totalPoints?: number;
    currentRank?: string;
    rankLevel?: number;
    lifetimePoints?: number;
  }): Promise<UserPointsTotal> {
    const [points] = await db
      .update(userPointsTotal)
      .set(data)
      .where(eq(userPointsTotal.userId, userId))
      .returning();
    
    console.log(`🔄 User points total updated for user ${userId}`);
    return points;
  }

  // ============================================================
  // PRESS CARD PERMISSION OPERATIONS
  // ============================================================

  async updateUserPressCardPermission(userId: string, data: {
    hasPressCard?: boolean;
    jobTitle?: string | null;
    department?: string | null;
    pressIdNumber?: string | null;
    cardValidUntil?: Date | null;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        ...(data.cardValidUntil && { cardValidUntil: new Date(data.cardValidUntil) }),
      })
      .where(eq(users.id, userId))
      .returning();
    
    console.log(`🔄 Press card permissions updated for user ${userId}`);
    return user;
  }

  async triggerLoyaltyPassUpdate(userId: string, reason: string) {
    console.log('🔄 [Loyalty Pass] Triggering update for user:', userId, 'Reason:', reason);
    
    // Log the update event (Phase 2: will send APNs)
    const { passUpdateLogger } = await import('./lib/passkit/PassUpdateLogger');
    passUpdateLogger.log({
      userId,
      passType: 'loyalty',
      updateReason: reason,
      timestamp: new Date(),
    });
  }

  // ============================================================
  // DEEP ANALYSIS OPERATIONS
  // ============================================================

  async createDeepAnalysis(data: InsertDeepAnalysis): Promise<DeepAnalysis> {
    const [analysis] = await db
      .insert(deepAnalyses)
      .values(data)
      .returning();
    return analysis;
  }

  async getDeepAnalysis(id: string): Promise<DeepAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(deepAnalyses)
      .where(eq(deepAnalyses.id, id));
    return analysis;
  }

  async updateDeepAnalysis(id: string, data: Partial<DeepAnalysis>): Promise<DeepAnalysis> {
    const [analysis] = await db
      .update(deepAnalyses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(deepAnalyses.id, id))
      .returning();
    return analysis;
  }

  async listDeepAnalyses(params: {
    createdBy?: string;
    status?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ analyses: DeepAnalysis[]; total: number }> {
    const { createdBy, status, categoryId, limit = 20, offset = 0 } = params;

    let conditions = [];
    if (createdBy) conditions.push(eq(deepAnalyses.createdBy, createdBy));
    if (status) conditions.push(eq(deepAnalyses.status, status));
    if (categoryId) conditions.push(eq(deepAnalyses.categoryId, categoryId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const analyses = await db
      .select()
      .from(deepAnalyses)
      .where(whereClause)
      .orderBy(desc(deepAnalyses.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(deepAnalyses)
      .where(whereClause);

    return {
      analyses,
      total: count || 0,
    };
  }

  async deleteDeepAnalysis(id: string): Promise<void> {
    await db
      .delete(deepAnalyses)
      .where(eq(deepAnalyses.id, id));
  }

  // Deep Analysis (Omq) Methods - Phase 2
  async getPublishedDeepAnalyses(filters: {
    status?: string;
    keyword?: string;
    category?: string;
    dateRange?: { from: Date; to: Date };
    page?: number;
    limit?: number;
  }): Promise<{ analyses: (DeepAnalysis & { metrics?: any })[]; total: number }> {
    const { status, keyword, category, dateRange, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let conditions = [];
    
    // Status filter (default to published if not specified)
    if (status) {
      conditions.push(eq(deepAnalyses.status, status));
    } else {
      conditions.push(eq(deepAnalyses.status, 'published'));
    }
    
    // Keyword search in title or topic
    if (keyword) {
      conditions.push(
        or(
          ilike(deepAnalyses.title, `%${keyword}%`),
          ilike(deepAnalyses.topic, `%${keyword}%`)
        )
      );
    }
    
    // Category filter
    if (category) {
      conditions.push(eq(deepAnalyses.categoryId, category));
    }
    
    // Date range filter
    if (dateRange?.from && dateRange?.to) {
      conditions.push(
        and(
          gte(deepAnalyses.createdAt, dateRange.from),
          lte(deepAnalyses.createdAt, dateRange.to)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch analyses with metrics using left join
    const analysesWithMetrics = await db
      .select({
        analysis: deepAnalyses,
        metrics: deepAnalysisMetrics,
      })
      .from(deepAnalyses)
      .leftJoin(deepAnalysisMetrics, eq(deepAnalyses.id, deepAnalysisMetrics.analysisId))
      .where(whereClause)
      .orderBy(desc(deepAnalyses.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(deepAnalyses)
      .where(whereClause);

    // Format results
    const analyses = analysesWithMetrics.map(row => ({
      ...row.analysis,
      metrics: row.metrics || {
        views: 0,
        shares: 0,
        downloads: 0,
        exportsPdf: 0,
        exportsDocx: 0,
      },
    }));

    return {
      analyses,
      total: count || 0,
    };
  }

  async getDeepAnalysisMetrics(analysisId: string): Promise<any | null> {
    const [metrics] = await db
      .select()
      .from(deepAnalysisMetrics)
      .where(eq(deepAnalysisMetrics.analysisId, analysisId));
    
    return metrics || null;
  }

  async recordDeepAnalysisEvent(event: {
    analysisId: string;
    userId?: string;
    eventType: 'view' | 'share' | 'download' | 'export_pdf' | 'export_docx';
    metadata?: any;
  }): Promise<void> {
    const { analysisId, userId, eventType, metadata } = event;

    // Use transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // 1. Insert event record
      await tx
        .insert(deepAnalysisEvents)
        .values({
          analysisId,
          userId: userId || null,
          eventType,
          metadata: metadata || {},
        });

      // 2. Ensure metrics record exists
      const [existingMetrics] = await tx
        .select()
        .from(deepAnalysisMetrics)
        .where(eq(deepAnalysisMetrics.analysisId, analysisId));

      if (!existingMetrics) {
        // Create metrics if doesn't exist
        await tx
          .insert(deepAnalysisMetrics)
          .values({
            analysisId,
            views: eventType === 'view' ? 1 : 0,
            shares: eventType === 'share' ? 1 : 0,
            downloads: eventType === 'download' ? 1 : 0,
            exportsPdf: eventType === 'export_pdf' ? 1 : 0,
            exportsDocx: eventType === 'export_docx' ? 1 : 0,
            lastViewedAt: eventType === 'view' ? new Date() : null,
          });
      } else {
        // Update existing metrics
        const updates: any = {
          updatedAt: new Date(),
        };

        if (eventType === 'view') {
          updates.views = sql`${deepAnalysisMetrics.views} + 1`;
          updates.lastViewedAt = new Date();
        } else if (eventType === 'share') {
          updates.shares = sql`${deepAnalysisMetrics.shares} + 1`;
        } else if (eventType === 'download') {
          updates.downloads = sql`${deepAnalysisMetrics.downloads} + 1`;
        } else if (eventType === 'export_pdf') {
          updates.exportsPdf = sql`${deepAnalysisMetrics.exportsPdf} + 1`;
        } else if (eventType === 'export_docx') {
          updates.exportsDocx = sql`${deepAnalysisMetrics.exportsDocx} + 1`;
        }

        await tx
          .update(deepAnalysisMetrics)
          .set(updates)
          .where(eq(deepAnalysisMetrics.analysisId, analysisId));
      }
    });
  }

  async getDeepAnalysisStats(): Promise<{
    totalAnalyses: number;
    totalViews: number;
    totalShares: number;
    totalDownloads: number;
    recentAnalyses: any[];
  }> {
    // Get total analyses count
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(deepAnalyses)
      .where(eq(deepAnalyses.status, 'published'));

    const totalAnalyses = totalResult?.count || 0;

    // Get total metrics (sum of all metrics)
    const [metricsResult] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${deepAnalysisMetrics.views}), 0)::int`,
        totalShares: sql<number>`COALESCE(SUM(${deepAnalysisMetrics.shares}), 0)::int`,
        totalDownloads: sql<number>`COALESCE(SUM(${deepAnalysisMetrics.downloads} + ${deepAnalysisMetrics.exportsPdf} + ${deepAnalysisMetrics.exportsDocx}), 0)::int`,
      })
      .from(deepAnalysisMetrics);

    const totalViews = metricsResult?.totalViews || 0;
    const totalShares = metricsResult?.totalShares || 0;
    const totalDownloads = metricsResult?.totalDownloads || 0;

    // Get recent analyses (last 5 published)
    const recentAnalysesData = await db
      .select({
        analysis: deepAnalyses,
        metrics: deepAnalysisMetrics,
      })
      .from(deepAnalyses)
      .leftJoin(deepAnalysisMetrics, eq(deepAnalyses.id, deepAnalysisMetrics.analysisId))
      .where(eq(deepAnalyses.status, 'published'))
      .orderBy(desc(deepAnalyses.createdAt))
      .limit(5);

    const recentAnalyses = recentAnalysesData.map(row => ({
      ...row.analysis,
      metrics: row.metrics || {
        views: 0,
        shares: 0,
        downloads: 0,
        exportsPdf: 0,
        exportsDocx: 0,
      },
    }));

    return {
      totalAnalyses,
      totalViews,
      totalShares,
      totalDownloads,
      recentAnalyses,
    };
  }

  // ============================================================
  // HOMEPAGE STATISTICS
  // ============================================================

  async getHomepageStats(): Promise<HomepageStats> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total published articles
    const [totalArticlesResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(articles)
      .where(eq(articles.status, 'published'));
    
    const totalArticles = totalArticlesResult?.count || 0;

    // Articles published in last 24 hours
    const [todayArticlesResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(articles)
      .where(
        and(
          eq(articles.status, 'published'),
          gte(articles.publishedAt, oneDayAgo)
        )
      );
    
    const todayArticles = todayArticlesResult?.count || 0;

    // Total views (sum of all article views for published articles)
    const [totalViewsResult] = await db
      .select({ total: sql<number>`SUM(COALESCE(${articles.views}, 0))::int` })
      .from(articles)
      .where(eq(articles.status, 'published'));
    
    const totalViews = totalViewsResult?.total || 0;

    // Active users (users with activity in last 7 days)
    const [activeUsersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${users.id})::int` })
      .from(users)
      .where(gte(users.lastActivityAt, sevenDaysAgo));
    
    const activeUsers = activeUsersResult?.count || 0;

    return {
      totalArticles,
      todayArticles,
      totalViews,
      activeUsers,
    };
  }

  // ============================================================
  // TASK MANAGEMENT OPERATIONS
  // ============================================================

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    
    await this.logTaskActivity({
      taskId: newTask.id,
      userId: task.createdById,
      action: 'created',
      changes: {
        description: 'Task created',
      },
    });

    return newTask;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    
    return task || null;
  }

  async getTasks(filters: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    createdById?: string;
    department?: string;
    parentTaskId?: string | null;
    search?: string;
    limit?: number;
    offset?: number;
    userIdForOwn?: string; // For view_own permission: created OR assigned
  }): Promise<{ tasks: Task[]; total: number }> {
    const {
      status,
      priority,
      assignedToId,
      createdById,
      department,
      parentTaskId,
      search,
      limit = 20,
      offset = 0,
      userIdForOwn,
    } = filters;

    let conditions = [];

    if (status) conditions.push(eq(tasks.status, status));
    if (priority) conditions.push(eq(tasks.priority, priority));
    if (assignedToId) conditions.push(eq(tasks.assignedToId, assignedToId));
    if (createdById) conditions.push(eq(tasks.createdById, createdById));
    if (department) conditions.push(eq(tasks.department, department));
    
    // For view_own permission: show tasks created by OR assigned to user
    if (userIdForOwn) {
      conditions.push(
        or(
          eq(tasks.createdById, userIdForOwn),
          eq(tasks.assignedToId, userIdForOwn)
        )
      );
    }
    
    // Filter by parentTaskId
    if (parentTaskId !== undefined) {
      if (parentTaskId === null) {
        // Fetch root tasks (parentTaskId IS NULL)
        conditions.push(isNull(tasks.parentTaskId));
      } else {
        // Fetch subtasks of specific parent
        conditions.push(eq(tasks.parentTaskId, parentTaskId));
      }
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(tasks.title, `%${search}%`),
          ilike(tasks.description, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch tasks with subtasksCount using SQL subquery for performance
    const tasksListRaw = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        createdById: tasks.createdById,
        assignedToId: tasks.assignedToId,
        parentTaskId: tasks.parentTaskId,
        department: tasks.department,
        category: tasks.category,
        tags: tasks.tags,
        aiSuggestions: tasks.aiSuggestions,
        estimatedDuration: tasks.estimatedDuration,
        actualDuration: tasks.actualDuration,
        progress: tasks.progress,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        subtasksCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${tasks} subtask 
          WHERE subtask.parent_task_id = ${tasks.id}
        )`.as('subtasks_count'),
      })
      .from(tasks)
      .where(whereClause)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(whereClause);

    return {
      tasks: tasksListRaw as Task[],
      total: countResult?.count || 0,
    };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db
      .delete(tasks)
      .where(eq(tasks.id, id));
  }

  async getTaskWithDetails(id: string): Promise<Task & {
    createdBy: User;
    assignedTo: User | null;
    subtasks: Subtask[];
    comments: (TaskComment & { user: User })[];
    attachments: TaskAttachment[];
  } | null> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!task) return null;

    const createdByUser = aliasedTable(users, 'createdByUser');
    const assignedToUser = aliasedTable(users, 'assignedToUser');

    const [taskWithUsers] = await db
      .select({
        task: tasks,
        createdBy: createdByUser,
        assignedTo: assignedToUser,
      })
      .from(tasks)
      .leftJoin(createdByUser, eq(tasks.createdById, createdByUser.id))
      .leftJoin(assignedToUser, eq(tasks.assignedToId, assignedToUser.id))
      .where(eq(tasks.id, id));

    const taskSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, id))
      .orderBy(subtasks.displayOrder);

    const commentsData = await db
      .select({
        comment: taskComments,
        user: users,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, id))
      .orderBy(desc(taskComments.createdAt));

    const attachmentsData = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, id))
      .orderBy(desc(taskAttachments.createdAt));

    return {
      ...task,
      createdBy: taskWithUsers.createdBy!,
      assignedTo: taskWithUsers.assignedTo || null,
      subtasks: taskSubtasks,
      comments: commentsData.map(row => ({
        ...row.comment,
        user: row.user!,
      })),
      attachments: attachmentsData,
    };
  }

  async getTaskStatistics(userIdForOwn?: string): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    completed: number;
    overdue: number;
  }> {
    const now = new Date();
    let baseConditions = [];
    
    // For view_own permission: show tasks created by OR assigned to user
    if (userIdForOwn) {
      baseConditions.push(
        or(
          eq(tasks.createdById, userIdForOwn),
          eq(tasks.assignedToId, userIdForOwn)
        )
      );
    }

    const baseWhere = baseConditions.length > 0 ? and(...baseConditions) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(baseWhere);

    const [todoResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(
        baseWhere
          ? and(baseWhere, eq(tasks.status, 'todo'))
          : eq(tasks.status, 'todo')
      );

    const [inProgressResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(
        baseWhere
          ? and(baseWhere, eq(tasks.status, 'in_progress'))
          : eq(tasks.status, 'in_progress')
      );

    const [reviewResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(
        baseWhere
          ? and(baseWhere, eq(tasks.status, 'review'))
          : eq(tasks.status, 'review')
      );

    const [completedResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(
        baseWhere
          ? and(baseWhere, eq(tasks.status, 'completed'))
          : eq(tasks.status, 'completed')
      );

    const [overdueResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(
        baseWhere
          ? and(
              baseWhere,
              ne(tasks.status, 'completed'),
              ne(tasks.status, 'archived'),
              lte(tasks.dueDate, now)
            )
          : and(
              ne(tasks.status, 'completed'),
              ne(tasks.status, 'archived'),
              lte(tasks.dueDate, now)
            )
      );

    return {
      total: totalResult?.count || 0,
      todo: todoResult?.count || 0,
      inProgress: inProgressResult?.count || 0,
      review: reviewResult?.count || 0,
      completed: completedResult?.count || 0,
      overdue: overdueResult?.count || 0,
    };
  }

  // ============================================================
  // SUBTASK OPERATIONS
  // ============================================================

  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const [newSubtask] = await db
      .insert(subtasks)
      .values(subtask)
      .returning();

    await db
      .update(tasks)
      .set({
        subtasksCount: sql`${tasks.subtasksCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, subtask.taskId));

    await this.logTaskActivity({
      taskId: subtask.taskId,
      userId: subtask.taskId,
      action: 'subtask_created',
      changes: {
        description: `Subtask created: ${newSubtask.title}`,
      },
    });

    return newSubtask;
  }

  async getSubtaskById(id: string): Promise<Subtask | null> {
    const [subtask] = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.id, id));
    
    return subtask || null;
  }

  async updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask> {
    const [subtask] = await db
      .update(subtasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(subtasks.id, id))
      .returning();

    await db
      .update(tasks)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, subtask.taskId));

    return subtask;
  }

  async deleteSubtask(id: string): Promise<void> {
    const [subtask] = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.id, id));

    if (subtask) {
      await db
        .delete(subtasks)
        .where(eq(subtasks.id, id));

      await db
        .update(tasks)
        .set({
          subtasksCount: sql`${tasks.subtasksCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, subtask.taskId));

      await this.logTaskActivity({
        taskId: subtask.taskId,
        userId: subtask.taskId,
        action: 'subtask_deleted',
        changes: {
          description: `Subtask deleted: ${subtask.title}`,
        },
      });
    }
  }

  async toggleSubtaskComplete(id: string, completedById: string): Promise<Subtask> {
    const [currentSubtask] = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.id, id));

    if (!currentSubtask) {
      throw new Error('Subtask not found');
    }

    const newCompletedState = !currentSubtask.isCompleted;

    const [subtask] = await db
      .update(subtasks)
      .set({
        isCompleted: newCompletedState,
        completedAt: newCompletedState ? new Date() : null,
        completedById: newCompletedState ? completedById : null,
        updatedAt: new Date(),
      })
      .where(eq(subtasks.id, id))
      .returning();

    await db
      .update(tasks)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, subtask.taskId));

    await this.logTaskActivity({
      taskId: subtask.taskId,
      userId: completedById,
      action: newCompletedState ? 'subtask_completed' : 'subtask_uncompleted',
      changes: {
        description: `Subtask ${newCompletedState ? 'completed' : 'uncompleted'}: ${subtask.title}`,
      },
    });

    return subtask;
  }

  // ============================================================
  // TASK COMMENT OPERATIONS
  // ============================================================

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db
      .insert(taskComments)
      .values(comment)
      .returning();

    await db
      .update(tasks)
      .set({
        commentsCount: sql`${tasks.commentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, comment.taskId));

    await this.logTaskActivity({
      taskId: comment.taskId,
      userId: comment.userId,
      action: 'comment_added',
      changes: {
        description: 'Comment added',
      },
    });

    return newComment;
  }

  async getTaskCommentById(id: string): Promise<TaskComment | null> {
    const [comment] = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, id));
    
    return comment || null;
  }

  async getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]> {
    const commentsData = await db
      .select({
        comment: taskComments,
        user: users,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));

    return commentsData.map(row => ({
      ...row.comment,
      user: row.user!,
    }));
  }

  async deleteTaskComment(id: string): Promise<void> {
    const [comment] = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, id));

    if (comment) {
      await db
        .delete(taskComments)
        .where(eq(taskComments.id, id));

      await db
        .update(tasks)
        .set({
          commentsCount: sql`${tasks.commentsCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, comment.taskId));

      await this.logTaskActivity({
        taskId: comment.taskId,
        userId: comment.userId,
        action: 'comment_deleted',
        changes: {
          description: 'Comment deleted',
        },
      });
    }
  }

  // ============================================================
  // TASK ATTACHMENT OPERATIONS
  // ============================================================

  async createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment> {
    const [newAttachment] = await db
      .insert(taskAttachments)
      .values(attachment)
      .returning();

    await db
      .update(tasks)
      .set({
        attachmentsCount: sql`${tasks.attachmentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, attachment.taskId));

    await this.logTaskActivity({
      taskId: attachment.taskId,
      userId: attachment.userId,
      action: 'attachment_added',
      changes: {
        description: `Attachment added: ${newAttachment.fileName}`,
      },
    });

    return newAttachment;
  }

  async getTaskAttachmentById(id: string): Promise<TaskAttachment | null> {
    const [attachment] = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.id, id));
    
    return attachment || null;
  }

  async deleteTaskAttachment(id: string): Promise<void> {
    const [attachment] = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.id, id));

    if (attachment) {
      await db
        .delete(taskAttachments)
        .where(eq(taskAttachments.id, id));

      await db
        .update(tasks)
        .set({
          attachmentsCount: sql`${tasks.attachmentsCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, attachment.taskId));

      await this.logTaskActivity({
        taskId: attachment.taskId,
        userId: attachment.userId,
        action: 'attachment_deleted',
        changes: {
          description: `Attachment deleted: ${attachment.fileName}`,
        },
      });
    }
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    const attachments = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt));

    return attachments;
  }

  // ============================================================
  // TASK ACTIVITY LOG OPERATIONS
  // ============================================================

  async logTaskActivity(entry: {
    taskId: string;
    userId: string;
    action: string;
    changes?: {
      field?: string;
      oldValue?: any;
      newValue?: any;
      description?: string;
    };
  }): Promise<void> {
    await db
      .insert(taskActivityLog)
      .values(entry);
  }

  async getTaskActivity(taskId: string): Promise<(TaskActivityLogEntry & { user: User })[]> {
    const activityData = await db
      .select({
        activity: taskActivityLog,
        user: users,
      })
      .from(taskActivityLog)
      .leftJoin(users, eq(taskActivityLog.userId, users.id))
      .where(eq(taskActivityLog.taskId, taskId))
      .orderBy(desc(taskActivityLog.createdAt));

    return activityData.map(row => ({
      ...row.activity,
      user: row.user!,
    }));
  }

  // ============================================================
  // EMAIL AGENT OPERATIONS
  // ============================================================

  async createTrustedSender(sender: InsertTrustedEmailSender, createdBy: string): Promise<TrustedEmailSender> {
    const [newSender] = await db
      .insert(trustedEmailSenders)
      .values({
        ...sender,
        token: sender.token?.toLowerCase(),
        createdBy,
      })
      .returning();
    
    return newSender;
  }

  async getTrustedSenders(): Promise<TrustedEmailSender[]> {
    return await db
      .select()
      .from(trustedEmailSenders)
      .orderBy(desc(trustedEmailSenders.createdAt));
  }

  async getTrustedSenderById(id: string): Promise<TrustedEmailSender | null> {
    const [sender] = await db
      .select()
      .from(trustedEmailSenders)
      .where(eq(trustedEmailSenders.id, id));
    
    return sender || null;
  }

  async getTrustedSenderByEmail(email: string): Promise<TrustedEmailSender | null> {
    const [sender] = await db
      .select()
      .from(trustedEmailSenders)
      .where(eq(trustedEmailSenders.email, email));
    
    return sender || null;
  }

  async updateTrustedSender(id: string, updates: Partial<InsertTrustedEmailSender>): Promise<TrustedEmailSender> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };
    
    if (updates.token) {
      updateData.token = updates.token.toLowerCase();
    }
    
    const [updated] = await db
      .update(trustedEmailSenders)
      .set(updateData)
      .where(eq(trustedEmailSenders.id, id))
      .returning();
    
    return updated;
  }

  async deleteTrustedSender(id: string): Promise<void> {
    await db
      .delete(trustedEmailSenders)
      .where(eq(trustedEmailSenders.id, id));
  }

  async createEmailWebhookLog(log: InsertEmailWebhookLog): Promise<EmailWebhookLog> {
    const [newLog] = await db
      .insert(emailWebhookLogs)
      .values(log)
      .returning();
    
    return newLog;
  }

  async getEmailWebhookLogs(filters?: {
    status?: string;
    trustedSenderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: EmailWebhookLog[]; total: number }> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(emailWebhookLogs.status, filters.status));
    }
    
    if (filters?.trustedSenderId) {
      conditions.push(eq(emailWebhookLogs.trustedSenderId, filters.trustedSenderId));
    }
    
    const query = db
      .select()
      .from(emailWebhookLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(emailWebhookLogs.receivedAt));
    
    if (filters?.limit) {
      query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query.offset(filters.offset);
    }
    
    const logs = await query;
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailWebhookLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return { logs, total: Number(count) };
  }

  async updateEmailWebhookLog(id: string, updates: Partial<EmailWebhookLog>): Promise<EmailWebhookLog> {
    const [updated] = await db
      .update(emailWebhookLogs)
      .set({
        ...updates,
        processedAt: updates.status && updates.status !== 'received' ? new Date() : undefined,
      })
      .where(eq(emailWebhookLogs.id, id))
      .returning();
    
    return updated;
  }

  async deleteEmailWebhookLog(id: string): Promise<void> {
    await db
      .delete(emailWebhookLogs)
      .where(eq(emailWebhookLogs.id, id));
  }

  async deleteEmailWebhookLogs(ids: string[]): Promise<void> {
    await db
      .delete(emailWebhookLogs)
      .where(inArray(emailWebhookLogs.id, ids));
  }

  async getEmailWebhookLogsByDateRange(startDate: Date, endDate: Date): Promise<EmailWebhookLog[]> {
    const logs = await db
      .select()
      .from(emailWebhookLogs)
      .where(
        and(
          gte(emailWebhookLogs.receivedAt, startDate),
          lt(emailWebhookLogs.receivedAt, endDate)
        )
      )
      .orderBy(desc(emailWebhookLogs.receivedAt));
    
    return logs;
  }

  async getEmailAgentStats(date?: Date): Promise<EmailAgentStats | null> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const [stats] = await db
      .select()
      .from(emailAgentStats)
      .where(eq(emailAgentStats.date, targetDate));
    
    return stats || null;
  }

  async updateEmailAgentStats(date: Date, updates: Partial<EmailAgentStats>): Promise<EmailAgentStats> {
    date.setHours(0, 0, 0, 0);
    
    const [stats] = await db
      .insert(emailAgentStats)
      .values({
        date,
        ...updates,
      })
      .onConflictDoUpdate({
        target: emailAgentStats.date,
        set: {
          ...updates,
        },
      })
      .returning();
    
    return stats;
  }

  async getEmailLanguageCounts(): Promise<{ ar: number; en: number; ur: number }> {
    // Count articles created via email agent (articles that exist in emailWebhookLogs)
    // The database has separate tables for each language: articles (ar), enArticles (en), urArticles (ur)
    // Using three separate queries, one for each language table
    const arResults = await db
      .select({ id: articles.id })
      .from(articles)
      .innerJoin(emailWebhookLogs, eq(emailWebhookLogs.articleId, articles.id));
    
    const enResults = await db
      .select({ id: enArticles.id })
      .from(enArticles)
      .innerJoin(emailWebhookLogs, eq(emailWebhookLogs.articleId, enArticles.id));
    
    const urResults = await db
      .select({ id: urArticles.id })
      .from(urArticles)
      .innerJoin(emailWebhookLogs, eq(emailWebhookLogs.articleId, urArticles.id));
    
    return {
      ar: arResults.length,
      en: enResults.length,
      ur: urResults.length,
    };
  }

  // ============================================================
  // WHATSAPP INTEGRATION OPERATIONS
  // ============================================================

  async createWhatsappToken(token: InsertWhatsappToken): Promise<WhatsappToken> {
    const [newToken] = await db
      .insert(whatsappTokens)
      .values(token)
      .returning();
    
    return newToken;
  }

  async getWhatsappToken(id: string): Promise<WhatsappToken | null> {
    const [token] = await db
      .select()
      .from(whatsappTokens)
      .where(eq(whatsappTokens.id, id));
    
    return token || null;
  }

  async getWhatsappTokenByToken(token: string): Promise<WhatsappToken | null> {
    const [result] = await db
      .select()
      .from(whatsappTokens)
      .where(eq(whatsappTokens.token, token));
    
    return result || null;
  }

  async getWhatsappTokensByUser(userId: string): Promise<WhatsappToken[]> {
    return await db
      .select()
      .from(whatsappTokens)
      .where(eq(whatsappTokens.userId, userId))
      .orderBy(desc(whatsappTokens.createdAt));
  }

  async getAllWhatsappTokens(): Promise<WhatsappToken[]> {
    return await db
      .select()
      .from(whatsappTokens)
      .orderBy(desc(whatsappTokens.createdAt));
  }

  async updateWhatsappToken(id: string, updates: Partial<InsertWhatsappToken>): Promise<WhatsappToken | null> {
    const [updated] = await db
      .update(whatsappTokens)
      .set(updates)
      .where(eq(whatsappTokens.id, id))
      .returning();
    
    return updated || null;
  }

  async updateWhatsappTokenUsage(id: string): Promise<void> {
    await db
      .update(whatsappTokens)
      .set({
        usageCount: sql`${whatsappTokens.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(whatsappTokens.id, id));
  }

  async deleteWhatsappToken(id: string): Promise<void> {
    await db
      .delete(whatsappTokens)
      .where(eq(whatsappTokens.id, id));
  }

  async createWhatsappWebhookLog(log: InsertWhatsappWebhookLog): Promise<WhatsappWebhookLog> {
    const [newLog] = await db
      .insert(whatsappWebhookLogs)
      .values(log)
      .returning();
    
    return newLog;
  }

  async updateWhatsappWebhookLog(id: string, updates: Partial<InsertWhatsappWebhookLog>): Promise<WhatsappWebhookLog | null> {
    const [updated] = await db
      .update(whatsappWebhookLogs)
      .set(updates)
      .where(eq(whatsappWebhookLogs.id, id))
      .returning();
    
    return updated || null;
  }

  async getWhatsappWebhookLogs(params: { limit?: number; offset?: number; status?: string }): Promise<{ logs: WhatsappWebhookLog[]; total: number }> {
    const conditions = [];
    
    if (params?.status) {
      conditions.push(eq(whatsappWebhookLogs.status, params.status));
    }
    
    const query = db
      .select()
      .from(whatsappWebhookLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(whatsappWebhookLogs.createdAt));
    
    if (params?.limit) {
      query.limit(params.limit);
    }
    
    if (params?.offset) {
      query.offset(params.offset);
    }
    
    const logs = await query;
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(whatsappWebhookLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return {
      logs,
      total: Number(count),
    };
  }

  async getWhatsappWebhookLog(id: string): Promise<WhatsappWebhookLog | null> {
    const [log] = await db
      .select()
      .from(whatsappWebhookLogs)
      .where(eq(whatsappWebhookLogs.id, id));
    
    return log || null;
  }

  async deleteWhatsappWebhookLog(id: string): Promise<void> {
    await db
      .delete(whatsappWebhookLogs)
      .where(eq(whatsappWebhookLogs.id, id));
  }

  // Notification Operations
  private async getStaffUserIds(): Promise<string[]> {
    const staffRoles = ['super_admin', 'admin', 'editor', 'reporter', 'moderator', 'content_creator'];
    
    const staffUsers = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(roles.name, staffRoles));
    
    return staffUsers.map(u => u.userId);
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    deeplink?: string;
    metadata?: any;
  }): Promise<NotificationInbox> {
    const [notification] = await db.insert(notificationsInbox).values({
      id: nanoid(),
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      deeplink: data.deeplink,
      metadata: data.metadata,
    }).returning();
    
    notificationBus.emit(data.userId, notification);
    
    return notification;
  }

  async getNotifications(userId: string, filters?: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: NotificationInbox[]; total: number }> {
    const conditions = [eq(notificationsInbox.userId, userId)];
    
    if (filters?.read !== undefined) {
      conditions.push(eq(notificationsInbox.read, filters.read));
    }
    
    const whereClause = and(...conditions);
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(notificationsInbox)
      .where(whereClause);
    
    const notifications = await db
      .select()
      .from(notificationsInbox)
      .where(whereClause)
      .orderBy(desc(notificationsInbox.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
    
    return {
      notifications,
      total: Number(totalResult.count),
    };
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notificationsInbox)
      .where(and(
        eq(notificationsInbox.userId, userId),
        eq(notificationsInbox.read, false)
      ));
    
    return Number(result.count);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notificationsInbox)
      .set({ read: true })
      .where(eq(notificationsInbox.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notificationsInbox)
      .set({ read: true })
      .where(eq(notificationsInbox.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db
      .delete(notificationsInbox)
      .where(eq(notificationsInbox.id, notificationId));
  }

  async clearAllNotifications(userId: string): Promise<void> {
    await db
      .delete(notificationsInbox)
      .where(eq(notificationsInbox.userId, userId));
  }

  async broadcastNotificationToStaff(data: {
    type: string;
    title: string;
    body: string;
    deeplink?: string;
    metadata?: any;
  }): Promise<void> {
    const staffUserIds = await this.getStaffUserIds();
    
    await db.transaction(async (tx) => {
      for (const userId of staffUserIds) {
        const [notification] = await tx.insert(notificationsInbox).values({
          id: nanoid(),
          userId,
          type: data.type,
          title: data.title,
          body: data.body,
          deeplink: data.deeplink,
          metadata: data.metadata,
        }).returning();
        
        notificationBus.emit(userId, notification);
      }
    });
  }
}

export const storage = new DatabaseStorage();
