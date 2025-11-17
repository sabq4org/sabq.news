// Reference: javascript_object_storage blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import adsRoutes from "./ads-routes";
import { registerDataStoryRoutes } from './data-story-routes';
import journalistAgentRoutes from './journalist-agent-routes';
import emailAgentRoutes from './routes/emailAgent';
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { getObjectAclPolicy, setObjectAclPolicy } from "./objectAcl";
import { summarizeArticle, generateTitle, chatWithAssistant, analyzeCredibility, generateDailyActivityInsights, analyzeSEO, generateSmartContent } from "./openai";
import { chatWithMultilingualAssistant, chatWithAssistantFallback, type ChatLanguage } from "./multilingual-chatbot";
import { summarizeText, generateSocialPost, suggestImageQuery, translateContent, checkFactAccuracy, analyzeTrends } from "./ai-content-tools";
import { importFromRssFeed } from "./rssImporter";
import { generateCalendarEventIdeas, generateArticleDraft } from "./services/calendarAi";
import { requireAuth, requirePermission, requireAnyPermission, requireRole, logActivity, getUserPermissions } from "./rbac";
import { createNotification } from "./notificationEngine";
import { notificationBus } from "./notificationBus";
import { sendArticleNotification } from "./notificationService";
import { vectorizeArticle } from "./embeddingsService";
import { trackUserEvent } from "./eventTrackingService";
import { findSimilarArticles, getPersonalizedRecommendations } from "./similarityEngine";
import { sendSMSOTP, verifySMSOTP } from "./twilio";
import { sendVerificationEmail, verifyEmailToken, resendVerificationEmail } from "./services/email";
import { analyzeSentiment, detectLanguage } from './sentiment-analyzer';
import { classifyArticle } from './ai-classifier';
import { generateSeoMetadata } from './seo-generator';
import { cacheControl, noCache, withETag, CACHE_DURATIONS } from "./cacheMiddleware";
import { passKitService, type PressPassData, type LoyaltyPassData } from "./lib/passkit/PassKitService";
import pLimit from 'p-limit';
import { db } from "./db";
import { eq, and, or, desc, asc, ilike, sql, inArray, gte, lt, lte, aliasedTable, isNull, ne, not, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import passport from "passport";
import multer from "multer";

// إعداد multer للتعامل مع رفع الملفات في الذاكرة
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
import { randomUUID } from "crypto";
import { checkUserStatus } from "./userStatusMiddleware";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// Rate limiters for authentication and sensitive operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: "تم تجاوز حد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { message: "تم تجاوز حد الطلبات للعمليات الحساسة. يرجى المحاولة بعد قليل" },
  standardHeaders: true,
  legacyHeaders: false,
});

const followLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { message: "تم تجاوز حد طلبات المتابعة. يرجى المحاولة بعد دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
});

const taskLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: "تم تجاوز حد طلبات المهام. يرجى المحاولة بعد دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
});
import { 
  users, 
  roles, 
  userRoles, 
  articles, 
  categories, 
  comments,
  commentSentiments,
  rssFeeds,
  systemSettings,
  themes,
  themeAuditLog,
  activityLogs,
  rolePermissions,
  permissions,
  notificationTemplates,
  userNotificationPrefs,
  notificationQueue,
  notificationsInbox,
  notificationMetrics,
  userInterests,
  interests,
  reactions,
  bookmarks,
  passwordResetTokens,
  emailVerificationTokens,
  tags,
  articleTags,
  userFollowedTerms,
  recommendationLog,
  recommendationMetrics,
  userEvents,
  readingHistory,
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
  audioNewsletters,
  audioNewsletterArticles,
  audioNewsletterListens,
  shorts,
  shortAnalytics,
  quadCategoriesSettings,
  enQuadCategoriesSettings,
  urQuadCategoriesSettings,
  articleSmartCategories,
  entityTypes,
  smartEntities,
  smartTerms,
  articleSmartLinks,
  enArticles,
  enCategories,
  enComments,
  enReactions,
  enBookmarks,
  enSmartBlocks,
  urArticles,
  urCategories,
  urComments,
  urReactions,
  urBookmarks,
  urSmartBlocks,
  mediaFiles,
  mediaFolders,
  mediaUsageLog,
  shortLinks,
  shortLinkClicks,
  tasks,
  subtasks,
  taskComments,
  taskAttachments,
  taskActivityLog,
} from "@shared/schema";
import {
  insertArticleSchema,
  updateArticleSchema,
  insertCategorySchema,
  insertCommentSchema,
  insertRssFeedSchema,
  updateUserSchema,
  adminUpdateUserSchema,
  adminCreateUserSchema,
  adminUpdateUserRolesSchema,
  suspendUserSchema,
  banUserSchema,
  insertThemeSchema,
  updateThemeSchema,
  updateRolePermissionsSchema,
  updateUserNotificationPrefsSchema,
  insertNotificationQueueSchema,
  insertNotificationsInboxSchema,
  insertAngleSchema,
  insertTagSchema,
  updateTagSchema,
  insertArticleTagSchema,
  insertUserFollowedTermSchema,
  insertStorySchema,
  insertStoryLinkSchema,
  insertStoryFollowSchema,
  insertExperimentSchema,
  insertExperimentVariantSchema,
  insertExperimentExposureSchema,
  insertTaskSchema,
  insertSubtaskSchema,
  insertTaskCommentSchema,
  insertTaskAttachmentSchema,
  insertExperimentConversionSchema,
  insertMirqabEntrySchema,
  updateMirqabEntrySchema,
  insertMirqabSabqIndexSchema,
  updateMirqabSabqIndexSchema,
  insertMirqabNextStorySchema,
  updateMirqabNextStorySchema,
  insertMirqabRadarAlertSchema,
  updateMirqabRadarAlertSchema,
  insertMirqabAlgorithmArticleSchema,
  insertSmartBlockSchema,
  updateMirqabAlgorithmArticleSchema,
  insertAudioNewsletterSchema,
  updateAudioNewsletterSchema,
  insertAudioNewsletterArticleSchema,
  insertAudioNewsletterListenSchema,
  insertAudioNewsBriefSchema,
  insertInternalAnnouncementSchema,
  updateInternalAnnouncementSchema,
  insertInternalAnnouncementVersionSchema,
  insertInternalAnnouncementMetricSchema,
  insertShortSchema,
  updateShortSchema,
  insertShortAnalyticSchema,
  insertQuadCategoriesSettingsSchema,
  insertEnQuadCategoriesSettingsSchema,
  insertUrQuadCategoriesSettingsSchema,
  insertCalendarEventSchema,
  updateCalendarEventSchema,
  insertCalendarReminderSchema,
  insertCalendarAssignmentSchema,
  updateCalendarAssignmentSchema,
  insertEntityTypeSchema,
  insertSmartEntitySchema,
  insertSmartTermSchema,
  insertArticleSmartLinkSchema,
  insertEnCategorySchema,
  insertEnArticleSchema,
  insertEnCommentSchema,
  insertEnSmartBlockSchema,
  insertUrCategorySchema,
  insertUrArticleSchema,
  insertUrCommentSchema,
  insertUrSmartBlockSchema,
  insertMediaFolderSchema,
  insertMediaFileSchema,
  insertMediaUsageLogSchema,
  updateMediaFileSchema,
  updateMediaFolderSchema,
  insertShortLinkSchema,
  insertShortLinkClickSchema,
  insertSocialFollowSchema,
  type EnArticleWithDetails,
  type UrArticleWithDetails,
  type User,
  type InsertShortLinkClick,
  type Task,
  type InsertTask,
  type Subtask,
  type InsertSubtask,
  type TaskComment,
  type InsertTaskComment,
  type TaskAttachment,
  type InsertTaskAttachment,
} from "@shared/schema";
import { bootstrapAdmin } from "./utils/bootstrapAdmin";
import { setupProductionDatabase } from "./utils/setupProduction";
import { seedProductionData } from "./utils/seedProductionData";
import { pool } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // ============================================================
  // SETUP ROUTES (Protected, one-time use)
  // ============================================================

  // Seed production data only (no schema changes)
  app.post("/api/setup/seed", async (req, res) => {
    try {
      // Check if setup is enabled
      const isEnabled = process.env.ENABLE_PRODUCTION_SETUP === "true";
      if (!isEnabled) {
        return res.status(404).json({ message: "Not found" });
      }

      // Check setup secret
      const setupSecret = req.headers["x-setup-secret"];
      const expectedSecret = process.env.SETUP_SECRET;
      
      if (!expectedSecret || setupSecret !== expectedSecret) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Seed data only
      const result = await seedProductionData(db);

      console.log("✅ Production data seeding completed successfully");
      res.json(result);
    } catch (error) {
      console.error("❌ Production seeding error:", error);
      res.status(500).json({ 
        success: false,
        message: "Seeding failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Complete production database setup (schema + seed + admin)
  app.post("/api/setup/production", async (req, res) => {
    try {
      // Check if setup is enabled
      const isEnabled = process.env.ENABLE_PRODUCTION_SETUP === "true";
      if (!isEnabled) {
        return res.status(404).json({ message: "Not found" });
      }

      // Check setup secret
      const setupSecret = req.headers["x-setup-secret"];
      const expectedSecret = process.env.SETUP_SECRET;
      
      if (!expectedSecret || setupSecret !== expectedSecret) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Run complete setup
      const result = await setupProductionDatabase(pool, db);

      console.log("✅ Production setup completed successfully");
      res.json(result);
    } catch (error) {
      console.error("❌ Production setup error:", error);
      res.status(500).json({ 
        success: false,
        message: "Setup failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bootstrap admin user endpoint (for production deployment) - Legacy, use /api/setup/production instead
  app.post("/api/setup/admin", async (req, res) => {
    try {
      // Check if bootstrap is enabled
      const isEnabled = process.env.ENABLE_ADMIN_BOOTSTRAP === "true";
      if (!isEnabled) {
        return res.status(404).json({ message: "Not found" });
      }

      // Check setup secret
      const setupSecret = req.headers["x-setup-secret"];
      const expectedSecret = process.env.SETUP_ADMIN_SECRET;
      
      if (!expectedSecret || setupSecret !== expectedSecret) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Bootstrap admin
      const result = await bootstrapAdmin(db);

      console.log("✅ Admin bootstrap completed successfully");
      res.json({
        success: true,
        message: "Admin user created successfully",
        credentials: {
          email: result.email,
          password: result.password,
        },
      });
    } catch (error) {
      console.error("❌ Admin bootstrap error:", error);
      res.status(500).json({ message: "Bootstrap failed" });
    }
  });

  // ============================================================
  // AUTH ROUTES
  // ============================================================

  // Login
  app.post("/api/login", authLimiter, (req, res, next) => {
    console.log("🔐 Login attempt:", { email: req.body?.email, hasPassword: !!req.body?.password });
    
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        console.error("❌ Login error:", err);
        return res.status(500).json({ message: "خطأ في الخادم" });
      }
      if (!user) {
        console.log("❌ Login failed:", info?.message);
        return res.status(401).json({ message: info?.message || "فشل تسجيل الدخول" });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        console.log("🔐 2FA required for user:", user.email);
        // Store userId in session temporarily for 2FA verification
        (req.session as any).pending2FAUserId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("❌ Session save error:", saveErr);
            return res.status(500).json({ message: "خطأ في حفظ الجلسة" });
          }
          return res.json({ 
            requires2FA: true,
            message: "يرجى إدخال رمز التحقق بخطوتين" 
          });
        });
        return;
      }

      // If no 2FA, proceed with normal login
      req.logIn(user, (err) => {
        if (err) {
          console.error("❌ Session error:", err);
          return res.status(500).json({ message: "خطأ في إنشاء الجلسة" });
        }
        
        // Explicitly save session before sending response
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("❌ Session save error:", saveErr);
            return res.status(500).json({ message: "خطأ في حفظ الجلسة" });
          }
          console.log("✅ Login successful:", user.email);
          res.json({ message: "تم تسجيل الدخول بنجاح", user: { id: user.id, email: user.email } });
        });
      });
    })(req, res, next);
  });

  // Google OAuth Routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { 
      failureRedirect: "/ar/login?error=google_auth_failed",
      failureMessage: true 
    }),
    (req, res) => {
      console.log("✅ Google OAuth callback successful");
      // Redirect to onboarding or dashboard based on isProfileComplete
      const user = req.user as any;
      if (user && !user.isProfileComplete) {
        res.redirect("/onboarding/welcome");
      } else {
        res.redirect("/dashboard");
      }
    }
  );

  // Apple OAuth Routes
  app.get("/api/auth/apple", 
    passport.authenticate("apple")
  );

  app.post("/api/auth/apple/callback", 
    passport.authenticate("apple", { 
      failureRedirect: "/ar/login?error=apple_auth_failed",
      failureMessage: true 
    }),
    (req, res) => {
      console.log("✅ Apple OAuth callback successful");
      // Redirect to onboarding or dashboard based on isProfileComplete
      const user = req.user as any;
      if (user && !user.isProfileComplete) {
        res.redirect("/onboarding/welcome");
      } else {
        res.redirect("/dashboard");
      }
    }
  );

  // Register
  app.post("/api/register", authLimiter, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existingUser) {
        return res.status(409).json({ message: "هذا البريد الإلكتروني مستخدم بالفعل" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Determine user role (for development/testing only - production should use proper RBAC flow)
      // In production, only allow 'reader' and require admin approval for elevated roles
      const allowedRoles = ["reader", "advertiser", "admin", "superadmin"];
      const userRole = (process.env.NODE_ENV === "development" && role && allowedRoles.includes(role)) 
        ? role 
        : "reader";

      // Create user
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email: email.toLowerCase(),
          passwordHash,
          firstName: firstName || null,
          lastName: lastName || null,
          role: userRole,
          isProfileComplete: false, // Always false for new users - will be set to true after onboarding
        })
        .returning();

      // Create default notification preferences for new user
      await db
        .insert(userNotificationPrefs)
        .values({
          userId: newUser.id,
          breaking: true,
          interest: true,
          likedUpdates: true,
          mostRead: true,
          webPush: false,
          dailyDigest: false,
        })
        .catch((error) => {
          console.error("Error creating notification preferences:", error);
          // Don't fail registration if notification prefs fail
        });

      // Send verification email
      const emailResult = await sendVerificationEmail(newUser.id, newUser.email);
      
      if (!emailResult.success) {
        console.warn("⚠️  Failed to send verification email:", emailResult.error);
      }

      // Auto-login after registration
      req.logIn(newUser, (err) => {
        if (err) {
          console.error("❌ Session creation error after registration:", err);
          return res.status(500).json({ message: "تم إنشاء الحساب ولكن فشل تسجيل الدخول التلقائي" });
        }
        
        console.log("✅ User registered and logged in:", newUser.email);
        res.status(201).json({ 
          message: emailResult.success 
            ? "تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب" 
            : "تم إنشاء الحساب بنجاح",
          user: { 
            id: newUser.id, 
            email: newUser.email, 
            firstName: newUser.firstName, 
            lastName: newUser.lastName,
            emailVerified: newUser.emailVerified
          },
          emailSent: emailResult.success
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "خطأ في إنشاء الحساب" });
    }
  });

  // Verify Email
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "رمز التحقق مطلوب" });
      }

      const result = await verifyEmailToken(token);

      if (!result.success) {
        return res.status(400).json({ message: result.error || "فشل التحقق من البريد الإلكتروني" });
      }

      res.json({ 
        message: "تم التحقق من بريدك الإلكتروني بنجاح",
        userId: result.userId
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "خطأ في التحقق من البريد الإلكتروني" });
    }
  });

  // Resend Verification Email
  app.post("/api/auth/resend-verification", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const user = req.user as any;
      const result = await resendVerificationEmail(user.id);

      if (!result.success) {
        return res.status(400).json({ message: result.error || "فشل إعادة إرسال رسالة التحقق" });
      }

      res.json({ message: "تم إرسال رسالة التحقق بنجاح. يرجى فحص بريدك الإلكتروني" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "خطأ في إرسال رسالة التحقق" });
    }
  });

  // Forgot Password - Request reset token
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
      }

      // Check if user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ 
          message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور" 
        });
      }

      // Generate reset token (plaintext - will be sent via email)
      const resetToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Hash token before storing (security: never store plaintext tokens)
      const tokenHash = await bcrypt.hash(resetToken, 10);

      // Save hashed token to database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      // In production, send email here
      // For now, log the reset link (development only)
      if (process.env.NODE_ENV === 'development') {
        const resetLink = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
        console.log(`🔗 Password reset link for ${email}: ${resetLink}`);
      }

      res.json({ 
        message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور"
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "خطأ في معالجة الطلب" });
    }
  });

  // Reset Password - Set new password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "الرمز وكلمة المرور مطلوبان" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      // Find all unused tokens for potential matching
      const candidateTokens = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.used, false));

      // Find matching token by comparing hashes
      let matchedToken = null;
      for (const candidate of candidateTokens) {
        const isMatch = await bcrypt.compare(token, candidate.token);
        if (isMatch) {
          matchedToken = candidate;
          break;
        }
      }

      if (!matchedToken) {
        return res.status(400).json({ message: "رمز إعادة التعيين غير صحيح أو منتهي الصلاحية" });
      }

      // Check if token expired
      if (new Date() > new Date(matchedToken.expiresAt)) {
        return res.status(400).json({ message: "رمز إعادة التعيين منتهي الصلاحية" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update user password
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, matchedToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, matchedToken.id));

      res.json({ message: "تم إعادة تعيين كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "خطأ في إعادة تعيين كلمة المرور" });
    }
  });

  // Logout (POST)
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  // Logout (GET) - redirect to login after logout
  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/login");
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      console.log('🔍 /api/auth/user check:', {
        isAuthenticated: req.isAuthenticated(),
        hasUser: !!req.user,
        userId: req.user?.id,
        sessionID: req.sessionID
      });
      
      if (!req.isAuthenticated() || !req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all user's roles from RBAC system, fallback to user.role from users table
      const userRolesResult = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      // Get all roles as array
      const rolesArray = userRolesResult.map(r => r.roleName);
      
      // For backward compatibility, keep 'role' as first role, add 'roles' array
      const role = rolesArray.length > 0 
        ? rolesArray[0] 
        : (user.role || "reader");
      const allRoles = rolesArray.length > 0 
        ? rolesArray 
        : [user.role || "reader"];

      // SECURITY: Never send passwordHash to client
      const { passwordHash, twoFactorSecret, ...safeUser } = user;
      res.json({ ...safeUser, role, roles: allRoles });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      const user = await storage.updateUser(userId, parsed.data);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "فشل في تحديث البيانات" });
    }
  });

  // Profile image upload endpoints (Reference: javascript_object_storage blueprint)
  app.post("/api/profile/image/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "فشل في الحصول على رابط الرفع" });
    }
  });

  app.put("/api/profile/image", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.body.profileImageUrl) {
        return res.status(400).json({ message: "رابط الصورة مطلوب" });
      }

      console.log("[Profile Image] Upload URL received:", req.body.profileImageUrl);

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.profileImageUrl,
        {
          owner: userId,
          visibility: "public",
        }
      );

      console.log("[Profile Image] Object path after ACL:", objectPath);

      // Update user profile with the new image path
      const user = await storage.updateUser(userId, { 
        profileImageUrl: objectPath 
      });

      console.log("[Profile Image] User updated with new image:", user.profileImageUrl);

      res.json({ 
        success: true,
        profileImageUrl: objectPath,
        user
      });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "فشل في تحديث الصورة الشخصية" });
    }
  });

  // ============================================================
  // MEDIA LIBRARY API ENDPOINTS
  // ============================================================

  // GET /api/media - List all media files with pagination, search, and filtering
  app.get("/api/media", isAuthenticated, async (req: any, res) => {
    try {
      const {
        search,
        folder,
        folderId,
        category,
        isFavorite,
        page = 1,
        limit = 20,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 20);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(mediaFiles.fileName, `%${search}%`),
            ilike(mediaFiles.title, `%${search}%`),
            ilike(mediaFiles.description, `%${search}%`)
          )
        );
      }

      // Support both folderId and folder parameters
      const folderFilter = (folderId || folder) as string | undefined;
      if (folderFilter) {
        conditions.push(eq(mediaFiles.folderId, folderFilter));
      }

      if (category) {
        conditions.push(eq(mediaFiles.category, category as string));
      }

      if (isFavorite !== undefined) {
        conditions.push(eq(mediaFiles.isFavorite, isFavorite === 'true'));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(mediaFiles)
        .where(whereClause);

      const total = Number(countResult.count);

      // Get paginated results with folder and uploader details
      const items = await db
        .select({
          id: mediaFiles.id,
          fileName: mediaFiles.fileName,
          originalName: mediaFiles.originalName,
          folderId: mediaFiles.folderId,
          url: mediaFiles.url,
          thumbnailUrl: mediaFiles.thumbnailUrl,
          type: mediaFiles.type,
          mimeType: mediaFiles.mimeType,
          size: mediaFiles.size,
          width: mediaFiles.width,
          height: mediaFiles.height,
          title: mediaFiles.title,
          description: mediaFiles.description,
          altText: mediaFiles.altText,
          caption: mediaFiles.caption,
          keywords: mediaFiles.keywords,
          isFavorite: mediaFiles.isFavorite,
          category: mediaFiles.category,
          usedIn: mediaFiles.usedIn,
          usageCount: mediaFiles.usageCount,
          uploadedBy: mediaFiles.uploadedBy,
          createdAt: mediaFiles.createdAt,
          updatedAt: mediaFiles.updatedAt,
          folder: mediaFolders,
          uploader: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(mediaFiles)
        .leftJoin(mediaFolders, eq(mediaFiles.folderId, mediaFolders.id))
        .leftJoin(users, eq(mediaFiles.uploadedBy, users.id))
        .where(whereClause)
        .orderBy(desc(mediaFiles.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Return files with appropriate URLs:
      // - Files with https:// URLs (public) use direct URL
      // - Files with gs:// URLs (private) use proxy URL
      // - Keep originalUrl for storage in articles
      const filesWithUrls = items.map(item => {
        const displayUrl = item.url.startsWith('https://') 
          ? item.url 
          : `/api/media/proxy/${item.id}`;
        
        return {
          ...item,
          originalUrl: item.url, // Keep original URL from database (https:// or gs://)
          url: displayUrl, // Display URL for preview (https:// or /api/media/proxy/)
          proxyUrl: `/api/media/proxy/${item.id}`,
        };
      });

      res.json({
        files: filesWithUrls,
        total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error("Error fetching media files:", error);
      res.status(500).json({ message: "فشل في جلب ملفات الوسائط" });
    }
  });

  // POST /api/media/upload - Upload media file to GCS
  const mediaUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مسموح. الأنواع المسموحة: JPEG, PNG, WEBP, GIF, SVG'));
      }
    },
  });

  app.post("/api/media/upload", isAuthenticated, strictLimiter, mediaUpload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ message: "لم يتم اختيار ملف" });
      }

      console.log("[Media Upload] File received:", {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Extract bucket ID from PRIVATE_OBJECT_DIR
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      console.log("[Media Upload] PRIVATE_OBJECT_DIR:", privateObjectDir);
      
      // PRIVATE_OBJECT_DIR can be in format: "bucket-name/.private" or "/objects/bucket-name/.private"
      const parts = privateObjectDir.split('/').filter(Boolean);
      let bucketId: string;
      
      if (parts.length >= 2 && parts[0] === 'objects') {
        // Format: /objects/bucket-name/.private
        bucketId = parts[1];
      } else if (parts.length >= 1) {
        // Format: bucket-name/.private
        bucketId = parts[0];
      } else {
        throw new Error('Invalid PRIVATE_OBJECT_DIR format');
      }
      
      console.log("[Media Upload] Extracted bucket ID:", bucketId);

      if (!bucketId) {
        throw new Error('Bucket ID not found in PRIVATE_OBJECT_DIR');
      }

      // Generate unique filename with year/month structure
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const objectId = randomUUID();

      const objectPath = `uploads/media/${year}/${month}/${objectId}.${fileExtension}`;

      console.log("[Media Upload] Uploading to bucket:", bucketId, "path:", objectPath);

      // Upload file to GCS and make it public for direct access
      const { objectStorageClient } = await import('./objectStorage');
      const bucket = objectStorageClient.bucket(bucketId);
      const file = bucket.file(objectPath);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
      });

      // Make the file publicly accessible for direct access from GCS
      let isPublic = false;
      try {
        await file.makePublic();
        console.log("[Media Upload] File made public successfully");
        isPublic = true;
      } catch (error) {
        console.warn("[Media Upload] Could not make file public (bucket may have public access prevention):", error);
      }

      console.log("[Media Upload] File uploaded successfully");

      // Determine which URL to store in database based on public access success
      const publicGcsUrl = `https://storage.googleapis.com/${bucketId}/${objectPath}`;
      const gsPath = `gs://${bucketId}/${objectPath}`;
      
      // If public access succeeded, store public URL; otherwise store gs:// path for proxy
      const storagePath = isPublic ? publicGcsUrl : gsPath;

      // Extract metadata (width, height for images)
      let width: number | undefined;
      let height: number | undefined;

      if (req.file.mimetype.startsWith('image/')) {
        try {
          // Use sharp or image-size library to extract dimensions
          // For now, we'll leave them as undefined and can be updated later
          // In production, you'd use: const { width: w, height: h } = await sharp(req.file.buffer).metadata();
        } catch (err) {
          console.log("[Media Upload] Could not extract image dimensions:", err);
        }
      }

      // Determine file type
      let fileType = 'document';
      if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        fileType = 'video';
      }

      // Parse additional metadata from request body
      const {
        title,
        description,
        altText,
        caption,
        keywords,
        category,
        isFavorite,
        folderId,
        entityType,
        entityId,
      } = req.body;

      // Parse keywords - handle both JSON array string and comma-separated string
      let parsedKeywords: string[] = [];
      if (keywords) {
        try {
          // Try parsing as JSON first (e.g., ["keyword1", "keyword2"])
          if (typeof keywords === 'string' && keywords.trim().startsWith('[')) {
            parsedKeywords = JSON.parse(keywords);
          } else if (typeof keywords === 'string') {
            // Treat as comma-separated string
            parsedKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
          } else if (Array.isArray(keywords)) {
            parsedKeywords = keywords;
          }
        } catch (err) {
          // If JSON parse fails, treat as comma-separated string
          parsedKeywords = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
        }
      }

      // Save to media_files table with storage path
      const [mediaFile] = await db
        .insert(mediaFiles)
        .values({
          fileName: `${objectId}.${fileExtension}`,
          originalName: req.file.originalname,
          folderId: folderId || null,
          url: storagePath, // Store GCS path, will be replaced with proxy URL
          type: fileType,
          mimeType: req.file.mimetype,
          size: req.file.size,
          width,
          height,
          title: title || null,
          description: description || null,
          altText: altText || null,
          caption: caption || null,
          keywords: parsedKeywords,
          isFavorite: isFavorite === 'true' || false,
          category: category || null,
          uploadedBy: userId,
          usedIn: entityId ? [entityId] : [],
          usageCount: entityId ? 1 : 0,
        })
        .returning();

      // Auto-save to mediaUsageLog if entityId provided
      if (entityType && entityId) {
        await db.insert(mediaUsageLog).values({
          mediaId: mediaFile.id,
          entityType,
          entityId,
          usedBy: userId,
        });
      }

      // Fetch complete details with folder and uploader
      // Note: We keep the gs:// path in the database for the proxy to use
      const [mediaFileWithDetails] = await db
        .select({
          id: mediaFiles.id,
          fileName: mediaFiles.fileName,
          originalName: mediaFiles.originalName,
          folderId: mediaFiles.folderId,
          url: mediaFiles.url,
          thumbnailUrl: mediaFiles.thumbnailUrl,
          type: mediaFiles.type,
          mimeType: mediaFiles.mimeType,
          size: mediaFiles.size,
          width: mediaFiles.width,
          height: mediaFiles.height,
          title: mediaFiles.title,
          description: mediaFiles.description,
          altText: mediaFiles.altText,
          caption: mediaFiles.caption,
          keywords: mediaFiles.keywords,
          isFavorite: mediaFiles.isFavorite,
          category: mediaFiles.category,
          usedIn: mediaFiles.usedIn,
          usageCount: mediaFiles.usageCount,
          uploadedBy: mediaFiles.uploadedBy,
          createdAt: mediaFiles.createdAt,
          updatedAt: mediaFiles.updatedAt,
          folder: mediaFolders,
          uploader: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(mediaFiles)
        .leftJoin(mediaFolders, eq(mediaFiles.folderId, mediaFolders.id))
        .leftJoin(users, eq(mediaFiles.uploadedBy, users.id))
        .where(eq(mediaFiles.id, mediaFile.id));

      console.log("[Media Upload] Media file created:", mediaFileWithDetails.id);

      // Return appropriate URL:
      // - If public: use stored public URL
      // - If not public: use proxy URL
      const responseUrl = mediaFileWithDetails.url.startsWith('https://') 
        ? mediaFileWithDetails.url 
        : `/api/media/proxy/${mediaFile.id}`;
      
      res.json({
        ...mediaFileWithDetails,
        url: responseUrl,
        proxyUrl: `/api/media/proxy/${mediaFile.id}`,
      });
    } catch (error: any) {
      console.error("Error uploading media file:", error);

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "الملف كبير جداً. الحد الأقصى 10MB" });
      }

      if (error.message?.includes('نوع الملف')) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "فشل في رفع ملف الوسائط" });
    }
  });

  // GET /api/media/proxy/:id - Proxy endpoint to serve media files from Object Storage
  app.get("/api/media/proxy/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Get media file record
      const [mediaFile] = await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.id, id));

      if (!mediaFile) {
        return res.status(404).json({ message: "الملف غير موجود" });
      }

      const storagePath = mediaFile.url;
      
      // Handle different URL types
      
      // Type 1: Public URLs (https://) - redirect or return URL
      if (storagePath.startsWith('https://') || storagePath.startsWith('http://')) {
        return res.redirect(storagePath);
      }
      
      // Type 2: Public object paths (/public-objects/) - redirect to public route
      if (storagePath.startsWith('/public-objects/')) {
        return res.redirect(storagePath);
      }
      
      // Type 3: GCS paths (gs://) - stream from Object Storage
      if (storagePath.startsWith('gs://')) {
        const pathParts = storagePath.replace('gs://', '').split('/');
        const bucketName = pathParts[0];
        const objectPath = pathParts.slice(1).join('/');

        // Get file from Object Storage
        const { objectStorageClient } = await import('./objectStorage');
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectPath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
          return res.status(404).json({ message: "الملف غير موجود في التخزين" });
        }

        // Stream the file to response
        res.setHeader('Content-Type', mediaFile.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        
        file.createReadStream()
          .on('error', (error) => {
            console.error('[Media Proxy] Error streaming file:', error);
            if (!res.headersSent) {
              res.status(500).json({ message: "فشل في تحميل الملف" });
            }
          })
          .pipe(res);
        
        return;
      }
      
      // Invalid storage path format
      return res.status(400).json({ message: "مسار التخزين غير صحيح" });

    } catch (error) {
      console.error('[Media Proxy] Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "فشل في تحميل الملف" });
      }
    }
  });

  // POST /api/media/save-existing - Save existing image to media library (JSON endpoint for auto-save from editor)
  app.post("/api/media/save-existing", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { url, fileName, title, description, category } = req.body;
      
      // Validation
      if (!url || !fileName) {
        return res.status(400).json({ message: "URL والاسم مطلوبان" });
      }

      // Create media file record
      const [mediaFile] = await db.insert(mediaFiles).values({
        fileName,
        originalName: fileName,
        url,
        type: "image",
        mimeType: "image/jpeg",
        size: 0, // Unknown for existing URLs
        title: title || fileName,
        description,
        category: category || "articles",
        uploadedBy: userId,
      }).returning();

      res.json(mediaFile);
    } catch (error) {
      console.error("Error saving media metadata:", error);
      res.status(500).json({ message: "فشل حفظ البيانات" });
    }
  });

  // PUT /api/media/:id - Update media file metadata
  app.put("/api/media/:id", isAuthenticated, async (req: any, res) => {
    try {
      const mediaId = req.params.id;
      const userId = req.user.id;

      // Check if media file exists and user has permission
      const [existingMedia] = await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.id, mediaId))
        .limit(1);

      if (!existingMedia) {
        return res.status(404).json({ message: "ملف الوسائط غير موجود" });
      }

      // Check if user is owner or admin
      const isOwner = existingMedia.uploadedBy === userId;
      const userPermissions = await getUserPermissions(userId);
      const isAdmin = userPermissions.includes('media:manage');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "غير مصرح لك بتحديث هذا الملف" });
      }

      // Validate update data
      const { updateMediaFileSchema } = await import('@shared/schema');
      const parsed = updateMediaFileSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors,
        });
      }

      // Update media file
      const [updatedMedia] = await db
        .update(mediaFiles)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(mediaFiles.id, mediaId))
        .returning();

      res.json(updatedMedia);
    } catch (error) {
      console.error("Error updating media file:", error);
      res.status(500).json({ message: "فشل في تحديث ملف الوسائط" });
    }
  });

  // DELETE /api/media/:id - Delete media file
  app.delete("/api/media/:id", isAuthenticated, async (req: any, res) => {
    try {
      const mediaId = req.params.id;
      const userId = req.user.id;

      // Check if media file exists
      const [existingMedia] = await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.id, mediaId))
        .limit(1);

      if (!existingMedia) {
        return res.status(404).json({ message: "ملف الوسائط غير موجود" });
      }

      // Check if user is owner or admin
      const isOwner = existingMedia.uploadedBy === userId;
      const userPermissions = await getUserPermissions(userId);
      const isAdmin = userPermissions.includes('media:manage');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "غير مصرح لك بحذف هذا الملف" });
      }

      // Check if file is used in articles
      if (existingMedia.usedIn && existingMedia.usedIn.length > 0) {
        return res.status(400).json({
          message: "لا يمكن حذف الملف لأنه مستخدم في مقالات أو محتوى آخر",
          usedIn: existingMedia.usedIn,
        });
      }

      // Delete from GCS
      try {
        const { objectStorageClient } = await import('./objectStorage');
        const url = new URL(existingMedia.url);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const bucketName = pathParts[0];
        const objectPath = pathParts.slice(1).join('/');

        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectPath);
        await file.delete();

        console.log("[Media Delete] File deleted from GCS:", objectPath);
      } catch (gcsError) {
        console.error("[Media Delete] Error deleting from GCS:", gcsError);
        // Continue with database deletion even if GCS deletion fails
      }

      // Delete from database
      await db.delete(mediaFiles).where(eq(mediaFiles.id, mediaId));

      res.json({ message: "تم حذف ملف الوسائط بنجاح" });
    } catch (error) {
      console.error("Error deleting media file:", error);
      res.status(500).json({ message: "فشل في حذف ملف الوسائط" });
    }
  });

  // GET /api/media/folders - List all folders with file counts and nesting
  app.get("/api/media/folders", isAuthenticated, async (req: any, res) => {
    try {
      // Get all folders
      const allFolders = await db
        .select()
        .from(mediaFolders)
        .orderBy(asc(mediaFolders.name));

      // Get file counts for each folder
      const folderCounts = await db
        .select({
          folderId: mediaFiles.folderId,
          count: sql<number>`count(*)`,
        })
        .from(mediaFiles)
        .groupBy(mediaFiles.folderId);

      const countMap = new Map(
        folderCounts.map((fc) => [fc.folderId, Number(fc.count)])
      );

      // Build folder tree structure
      const buildTree = (parentId: string | null): any[] => {
        return allFolders
          .filter((folder) => folder.parentId === parentId)
          .map((folder) => ({
            ...folder,
            fileCount: countMap.get(folder.id) || 0,
            children: buildTree(folder.id),
          }));
      };

      const folderTree = buildTree(null);

      res.json(folderTree);
    } catch (error) {
      console.error("Error fetching media folders:", error);
      res.status(500).json({ message: "فشل في جلب مجلدات الوسائط" });
    }
  });

  // POST /api/media/folders - Create new folder
  app.post("/api/media/folders", isAuthenticated, async (req: any, res) => {
    try {
      const { insertMediaFolderSchema } = await import('@shared/schema');
      const parsed = insertMediaFolderSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors,
        });
      }

      // Check name uniqueness within same parent
      const existingFolder = await db
        .select()
        .from(mediaFolders)
        .where(
          and(
            eq(mediaFolders.name, parsed.data.name),
            parsed.data.parentId
              ? eq(mediaFolders.parentId, parsed.data.parentId)
              : isNull(mediaFolders.parentId)
          )
        )
        .limit(1);

      if (existingFolder.length > 0) {
        return res.status(400).json({
          message: "يوجد مجلد بنفس الاسم في نفس المستوى",
        });
      }

      // Create folder
      const [folder] = await db
        .insert(mediaFolders)
        .values(parsed.data)
        .returning();

      res.json(folder);
    } catch (error) {
      console.error("Error creating media folder:", error);
      res.status(500).json({ message: "فشل في إنشاء مجلد الوسائط" });
    }
  });

  // PUT /api/media/folders/:id - Update folder
  app.put("/api/media/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const folderId = req.params.id;

      // Check if folder exists
      const [existingFolder] = await db
        .select()
        .from(mediaFolders)
        .where(eq(mediaFolders.id, folderId))
        .limit(1);

      if (!existingFolder) {
        return res.status(404).json({ message: "المجلد غير موجود" });
      }

      // Validate update data
      const { updateMediaFolderSchema } = await import('@shared/schema');
      const parsed = updateMediaFolderSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors,
        });
      }

      // Prevent circular references
      if (parsed.data.parentId) {
        // Check if the new parent is a descendant of this folder
        const isCircular = async (checkId: string, targetId: string): Promise<boolean> => {
          if (checkId === targetId) return true;

          const [parent] = await db
            .select()
            .from(mediaFolders)
            .where(eq(mediaFolders.id, checkId))
            .limit(1);

          if (!parent || !parent.parentId) return false;

          return isCircular(parent.parentId, targetId);
        };

        if (await isCircular(parsed.data.parentId, folderId)) {
          return res.status(400).json({
            message: "لا يمكن نقل المجلد إلى أحد مجلداته الفرعية",
          });
        }
      }

      // Check name uniqueness if name is being changed
      if (parsed.data.name && parsed.data.name !== existingFolder.name) {
        const parentId = parsed.data.parentId !== undefined ? parsed.data.parentId : existingFolder.parentId;
        
        const existingWithName = await db
          .select()
          .from(mediaFolders)
          .where(
            and(
              eq(mediaFolders.name, parsed.data.name),
              ne(mediaFolders.id, folderId),
              parentId
                ? eq(mediaFolders.parentId, parentId)
                : isNull(mediaFolders.parentId)
            )
          )
          .limit(1);

        if (existingWithName.length > 0) {
          return res.status(400).json({
            message: "يوجد مجلد بنفس الاسم في نفس المستوى",
          });
        }
      }

      // Update folder
      const [updatedFolder] = await db
        .update(mediaFolders)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(mediaFolders.id, folderId))
        .returning();

      res.json(updatedFolder);
    } catch (error) {
      console.error("Error updating media folder:", error);
      res.status(500).json({ message: "فشل في تحديث مجلد الوسائط" });
    }
  });

  // POST /api/media/make-public - Admin endpoint to make all existing media files public
  app.post("/api/media/make-public", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user is admin
      const userPermissions = await getUserPermissions(userId);
      const isAdmin = userPermissions.includes('media:manage');
      
      if (!isAdmin) {
        return res.status(403).json({ message: "غير مصرح لك بتنفيذ هذه العملية" });
      }

      console.log("[Make Public] Starting bulk public access for media files...");

      // Get all media files with gs:// URLs
      const allFiles = await db
        .select({
          id: mediaFiles.id,
          url: mediaFiles.url,
          fileName: mediaFiles.fileName,
        })
        .from(mediaFiles)
        .where(sql`${mediaFiles.url} LIKE 'gs://%'`);

      console.log(`[Make Public] Found ${allFiles.length} files to process`);

      const { objectStorageClient } = await import('./objectStorage');
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const file of allFiles) {
        try {
          // Parse gs://bucket-name/path
          const gcsPath = file.url.replace('gs://', '');
          const pathParts = gcsPath.split('/');
          const bucketName = pathParts[0];
          const objectPath = pathParts.slice(1).join('/');

          const bucket = objectStorageClient.bucket(bucketName);
          const gcsFile = bucket.file(objectPath);

          // Check if file exists
          const [exists] = await gcsFile.exists();
          if (!exists) {
            console.warn(`[Make Public] File not found in GCS: ${objectPath}`);
            errorCount++;
            errors.push(`File not found: ${file.fileName}`);
            continue;
          }

          // Make file public
          await gcsFile.makePublic();
          successCount++;
          console.log(`[Make Public] ✓ ${file.fileName}`);
        } catch (error: any) {
          errorCount++;
          console.error(`[Make Public] ✗ ${file.fileName}:`, error);
          errors.push(`${file.fileName}: ${error.message}`);
        }
      }

      console.log(`[Make Public] Complete. Success: ${successCount}, Errors: ${errorCount}`);

      res.json({
        success: true,
        processed: allFiles.length,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors
        message: `تم معالجة ${successCount} ملف بنجاح${errorCount > 0 ? `، فشل ${errorCount} ملف` : ''}`,
      });
    } catch (error) {
      console.error("[Make Public] Error:", error);
      res.status(500).json({ message: "فشل في تحويل الملفات إلى public" });
    }
  });

  // DELETE /api/media/folders/:id - Delete folder
  app.delete("/api/media/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const folderId = req.params.id;

      // Check if folder exists
      const [existingFolder] = await db
        .select()
        .from(mediaFolders)
        .where(eq(mediaFolders.id, folderId))
        .limit(1);

      if (!existingFolder) {
        return res.status(404).json({ message: "المجلد غير موجود" });
      }

      // Check if folder has files
      const [filesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(mediaFiles)
        .where(eq(mediaFiles.folderId, folderId));

      if (Number(filesCount.count) > 0) {
        return res.status(400).json({
          message: "لا يمكن حذف المجلد لأنه يحتوي على ملفات",
          fileCount: Number(filesCount.count),
        });
      }

      // Check if folder has subfolders
      const [subfoldersCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(mediaFolders)
        .where(eq(mediaFolders.parentId, folderId));

      if (Number(subfoldersCount.count) > 0) {
        return res.status(400).json({
          message: "لا يمكن حذف المجلد لأنه يحتوي على مجلدات فرعية",
          subfolderCount: Number(subfoldersCount.count),
        });
      }

      // Delete folder
      await db.delete(mediaFolders).where(eq(mediaFolders.id, folderId));

      res.json({ message: "تم حذف المجلد بنجاح" });
    } catch (error) {
      console.error("Error deleting media folder:", error);
      res.status(500).json({ message: "فشل في حذف مجلد الوسائط" });
    }
  });

  // AI-powered media suggestions with caching
  const mediaSuggestionsCache = new Map<string, {
    keywords: string[];
    timestamp: number;
  }>();
  const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  app.get("/api/media/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const { title, content, keywords: userKeywords, limit = 10 } = req.query;

      // Validate required parameters
      if (!title) {
        return res.status(400).json({ message: "العنوان مطلوب" });
      }

      console.log("[Media Suggestions] Request:", { 
        title: title.substring(0, 50), 
        hasContent: !!content,
        hasUserKeywords: !!userKeywords,
        limit 
      });

      let extractedKeywords: string[] = [];

      // Use user-provided keywords if available, otherwise use AI
      if (userKeywords && typeof userKeywords === 'string') {
        extractedKeywords = userKeywords.split(',').map((k: string) => k.trim()).filter(Boolean);
        console.log("[Media Suggestions] Using user-provided keywords:", extractedKeywords);
      } else {
        // Check cache first
        const cacheKey = `${title}:${content || ''}`;
        const cached = mediaSuggestionsCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          extractedKeywords = cached.keywords;
          console.log("[Media Suggestions] ✅ Using cached keywords:", extractedKeywords);
        } else {
          // Call AI to extract keywords
          try {
            const { extractMediaKeywords } = await import('./openai');
            extractedKeywords = await extractMediaKeywords(title, content);
            
            // Cache the result
            mediaSuggestionsCache.set(cacheKey, {
              keywords: extractedKeywords,
              timestamp: Date.now(),
            });
            
            // Clean old cache entries (simple cleanup strategy)
            if (mediaSuggestionsCache.size > 100) {
              const entries = Array.from(mediaSuggestionsCache.entries());
              entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
              entries.slice(0, 50).forEach(([key]) => mediaSuggestionsCache.delete(key));
            }
            
            console.log("[Media Suggestions] ✅ AI extracted keywords:", extractedKeywords);
          } catch (aiError) {
            console.error("[Media Suggestions] AI extraction failed, using fallback:", aiError);
            // Fallback: extract simple keywords from title
            extractedKeywords = title
              .split(/[\s،؛]+/)
              .filter((word: string) => word.length > 3)
              .slice(0, 5);
            console.log("[Media Suggestions] Fallback keywords:", extractedKeywords);
          }
        }
      }

      if (extractedKeywords.length === 0) {
        return res.json({
          suggestions: [],
          extractedKeywords: [],
          confidence: "low",
          total: 0,
        });
      }

      // Build smart search query
      // Search across: fileName, title, description, keywords array
      const searchConditions = extractedKeywords.flatMap((keyword) => [
        ilike(mediaFiles.fileName, `%${keyword}%`),
        ilike(mediaFiles.title, `%${keyword}%`),
        ilike(mediaFiles.description, `%${keyword}%`),
        sql`${keyword} = ANY(${mediaFiles.keywords})`,
      ]);

      // Get all media files that match any keyword
      const matchedFiles = await db
        .select({
          id: mediaFiles.id,
          fileName: mediaFiles.fileName,
          originalName: mediaFiles.originalName,
          url: mediaFiles.url,
          thumbnailUrl: mediaFiles.thumbnailUrl,
          type: mediaFiles.type,
          mimeType: mediaFiles.mimeType,
          size: mediaFiles.size,
          width: mediaFiles.width,
          height: mediaFiles.height,
          title: mediaFiles.title,
          description: mediaFiles.description,
          altText: mediaFiles.altText,
          caption: mediaFiles.caption,
          keywords: mediaFiles.keywords,
          isFavorite: mediaFiles.isFavorite,
          category: mediaFiles.category,
          usedIn: mediaFiles.usedIn,
          usageCount: mediaFiles.usageCount,
          uploadedBy: mediaFiles.uploadedBy,
          folderId: mediaFiles.folderId,
          createdAt: mediaFiles.createdAt,
          updatedAt: mediaFiles.updatedAt,
          uploaderEmail: users.email,
          uploaderFirstName: users.firstName,
          uploaderLastName: users.lastName,
          folderName: mediaFolders.name,
        })
        .from(mediaFiles)
        .leftJoin(users, eq(mediaFiles.uploadedBy, users.id))
        .leftJoin(mediaFolders, eq(mediaFiles.folderId, mediaFolders.id))
        .where(or(...searchConditions))
        .limit(100); // Get more than needed for scoring

      console.log("[Media Suggestions] Found", matchedFiles.length, "potential matches");

      // Score and rank results
      const scoredResults = matchedFiles.map((file) => {
        let score = 0;

        extractedKeywords.forEach((keyword) => {
          const keywordLower = keyword.toLowerCase();
          
          // Exact match in title: +10 points
          if (file.title && file.title.toLowerCase().includes(keywordLower)) {
            score += 10;
          }
          
          // Match in description: +5 points
          if (file.description && file.description.toLowerCase().includes(keywordLower)) {
            score += 5;
          }
          
          // Match in keywords array: +7 points
          if (file.keywords && file.keywords.some((k: string) => k.toLowerCase().includes(keywordLower))) {
            score += 7;
          }
          
          // Match in fileName: +3 points
          if (file.fileName && file.fileName.toLowerCase().includes(keywordLower)) {
            score += 3;
          }
        });

        // Recent uploads (last 30 days): +3 points
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (file.createdAt && new Date(file.createdAt) > thirtyDaysAgo) {
          score += 3;
        }

        // Favorite status: +2 points
        if (file.isFavorite) {
          score += 2;
        }

        return {
          ...file,
          score,
          folder: file.folderName ? {
            id: file.folderId || '',
            name: file.folderName,
          } : undefined,
          uploader: {
            id: file.uploadedBy,
            email: file.uploaderEmail || '',
            firstName: file.uploaderFirstName,
            lastName: file.uploaderLastName,
          },
        };
      });

      // Sort by score descending and take top N
      scoredResults.sort((a, b) => b.score - a.score);
      const topResults = scoredResults.slice(0, Number(limit));

      // Determine confidence level based on number of matches and scores
      let confidence: "high" | "medium" | "low" = "low";
      if (topResults.length > 0) {
        const avgScore = topResults.reduce((sum, r) => sum + r.score, 0) / topResults.length;
        if (avgScore >= 15 && topResults.length >= 5) {
          confidence = "high";
        } else if (avgScore >= 8 && topResults.length >= 3) {
          confidence = "medium";
        }
      }

      // Clean up results (remove score from response)
      const suggestions = topResults.map(({ score, uploaderEmail, uploaderFirstName, uploaderLastName, folderName, ...rest }) => rest);

      console.log("[Media Suggestions] ✅ Returning", suggestions.length, "suggestions with confidence:", confidence);

      res.json({
        suggestions,
        extractedKeywords,
        confidence,
        total: suggestions.length,
      });
    } catch (error) {
      console.error("[Media Suggestions] Error:", error);
      res.status(500).json({ 
        message: "فشل في الحصول على اقتراحات الوسائط",
        suggestions: [],
        extractedKeywords: [],
        confidence: "low",
        total: 0,
      });
    }
  });

  // ============================================================
  // END OF MEDIA LIBRARY API ENDPOINTS
  // ============================================================

  // Simplified avatar upload endpoint - single step upload
  const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, WEBP'));
      }
    },
  });

  app.post("/api/profile/upload-avatar", isAuthenticated, strictLimiter, avatarUpload.single('avatar'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم اختيار ملف" });
      }

      console.log("[Avatar Upload] File received:", {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Extract bucket ID from PRIVATE_OBJECT_DIR
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      
      // PRIVATE_OBJECT_DIR can be in format: "bucket-name/.private" or "/objects/bucket-name/.private"
      const parts = privateObjectDir.split('/').filter(Boolean);
      let bucketId: string;
      
      if (parts.length >= 2 && parts[0] === 'objects') {
        // Format: /objects/bucket-name/.private
        bucketId = parts[1];
      } else if (parts.length >= 1) {
        // Format: bucket-name/.private
        bucketId = parts[0];
      } else {
        throw new Error('Invalid PRIVATE_OBJECT_DIR format');
      }

      if (!bucketId) {
        throw new Error('Bucket ID not found in PRIVATE_OBJECT_DIR');
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const objectId = randomUUID();
      
      // Build object path (simple, no complex directory structure)
      const objectPath = `uploads/avatars/${objectId}.${fileExtension}`;

      console.log("[Avatar Upload] Uploading to bucket:", bucketId, "path:", objectPath);

      // Upload file to GCS (without public access as bucket has public access prevention)
      const { objectStorageClient } = await import('./objectStorage');
      const bucket = objectStorageClient.bucket(bucketId);
      const file = bucket.file(objectPath);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      console.log("[Avatar Upload] File uploaded successfully");

      // Store the storage path and build proxy URL
      const storagePath = `gs://${bucketId}/${objectPath}`;
      const publicUrl = `/api/media/proxy-avatar/${encodeURIComponent(storagePath)}`;

      console.log("[Avatar Upload] Using proxy URL:", publicUrl);

      // Update user profile with the public URL
      const user = await storage.updateUser(userId, { 
        profileImageUrl: publicUrl 
      });

      console.log("[Avatar Upload] User updated with new avatar:", user.profileImageUrl);

      res.json({ 
        success: true,
        profileImageUrl: publicUrl,
        user
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      
      // Handle multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "الملف كبير جداً. الحد الأقصى 5MB" });
      }
      
      if (error.message?.includes('نوع الملف')) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "فشل في رفع الصورة" });
    }
  });

  // GET /api/media/proxy-avatar/:storagePath - Proxy endpoint for avatar images
  app.get("/api/media/proxy-avatar/:storagePath", async (req, res) => {
    try {
      const storagePath = decodeURIComponent(req.params.storagePath);

      if (!storagePath.startsWith('gs://')) {
        return res.status(400).json({ message: "مسار التخزين غير صحيح" });
      }

      const pathParts = storagePath.replace('gs://', '').split('/');
      const bucketName = pathParts[0];
      const objectPath = pathParts.slice(1).join('/');

      // Get file from Object Storage
      const { objectStorageClient } = await import('./objectStorage');
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectPath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: "الصورة غير موجودة في التخزين" });
      }

      // Stream the file to response
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      file.createReadStream()
        .on('error', (error) => {
          console.error('[Avatar Proxy] Error streaming file:', error);
          if (!res.headersSent) {
            res.status(500).json({ message: "فشل في تحميل الصورة" });
          }
        })
        .pipe(res);

    } catch (error) {
      console.error('[Avatar Proxy] Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "فشل في تحميل الصورة" });
      }
    }
  });

  // ============================================================
  // TWO-FACTOR AUTHENTICATION (2FA) ROUTES
  // ============================================================

  const { generateSecret, generateQRCode, verifyToken, generateBackupCodes, verifyBackupCode } = await import('./twoFactor');

  // Check 2FA status
  app.get("/api/2fa/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      res.json({
        enabled: user.twoFactorEnabled || false,
        hasBackupCodes: (user.twoFactorBackupCodes?.length || 0) > 0,
        backupCodesCount: user.twoFactorBackupCodes?.length || 0,
        method: user.twoFactorMethod || 'authenticator'
      });
    } catch (error) {
      console.error("Error checking 2FA status:", error);
      res.status(500).json({ message: "فشل في التحقق من حالة المصادقة الثنائية" });
    }
  });

  // Setup 2FA - Generate secret and QR code
  app.get("/api/2fa/setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user.email) {
        return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
      }

      // Generate new secret
      const secret = generateSecret();
      const qrCode = await generateQRCode(user.email, secret);
      const backupCodes = generateBackupCodes();

      // Store secret temporarily (not enabled yet until verified)
      await db.update(users)
        .set({ 
          twoFactorSecret: secret,
          twoFactorBackupCodes: backupCodes 
        })
        .where(eq(users.id, userId));

      res.json({
        secret,
        qrCode,
        backupCodes
      });
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      res.status(500).json({ message: "فشل في إعداد المصادقة الثنائية" });
    }
  });

  // Enable 2FA - Verify token and enable
  app.post("/api/2fa/enable", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "الرمز مطلوب" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user.twoFactorSecret) {
        return res.status(400).json({ message: "يجب إعداد المصادقة الثنائية أولاً" });
      }

      // Verify the token
      const isValid = verifyToken(user.twoFactorSecret, token);

      if (!isValid) {
        return res.status(400).json({ message: "الرمز غير صحيح" });
      }

      // Enable 2FA
      await db.update(users)
        .set({ twoFactorEnabled: true })
        .where(eq(users.id, userId));

      await logActivity({
        userId,
        action: 'enable_2fa',
        entityType: '2fa',
        entityId: userId,
        newValue: { enabled: true }
      });

      // Return the backup codes that were generated during setup
      res.json({ 
        message: "تم تفعيل المصادقة الثنائية بنجاح",
        backupCodes: user.twoFactorBackupCodes || []
      });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      res.status(500).json({ message: "فشل في تفعيل المصادقة الثنائية" });
    }
  });

  // Disable 2FA
  app.post("/api/2fa/disable", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { password, token } = req.body;

      if (!password) {
        return res.status(400).json({ message: "كلمة المرور مطلوبة" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية غير مفعلة" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isPasswordValid) {
        return res.status(400).json({ message: "كلمة المرور غير صحيحة" });
      }

      // Verify 2FA token if provided
      if (token) {
        const isTokenValid = verifyToken(user.twoFactorSecret || '', token);
        if (!isTokenValid) {
          return res.status(400).json({ message: "رمز المصادقة غير صحيح" });
        }
      }

      // Disable 2FA
      await db.update(users)
        .set({ 
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null
        })
        .where(eq(users.id, userId));

      await logActivity({
        userId,
        action: 'disable_2fa',
        entityType: '2fa',
        entityId: userId,
        oldValue: { enabled: true },
        newValue: { enabled: false }
      });

      res.json({ message: "تم تعطيل المصادقة الثنائية بنجاح" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ message: "فشل في تعطيل المصادقة الثنائية" });
    }
  });

  // Verify 2FA token during login
  app.post("/api/2fa/verify", async (req: any, res) => {
    try {
      const { token, backupCode } = req.body;

      // Get userId from session
      const userId = (req.session as any).pending2FAUserId;

      if (!userId) {
        return res.status(400).json({ message: "الجلسة منتهية. الرجاء تسجيل الدخول مرة أخرى" });
      }

      if (!token && !backupCode) {
        return res.status(400).json({ message: "الرمز أو الرمز الاحتياطي مطلوب" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user || !user.twoFactorEnabled) {
        return res.status(400).json({ message: "المستخدم غير موجود أو المصادقة الثنائية غير مفعلة" });
      }

      let isValid = false;

      // Try backup code first
      if (backupCode) {
        const result = verifyBackupCode(user.twoFactorBackupCodes || [], backupCode);
        if (result.valid) {
          isValid = true;
          // Update backup codes (remove used code)
          await db.update(users)
            .set({ twoFactorBackupCodes: result.remainingCodes || [] })
            .where(eq(users.id, userId));
        }
      } 
      // Try regular token
      else if (token) {
        isValid = verifyToken(user.twoFactorSecret || '', token);
      }

      if (!isValid) {
        return res.status(400).json({ message: "الرمز غير صحيح" });
      }

      // Log the user in
      req.login(user, (err: any) => {
        if (err) {
          console.error("Error logging in user after 2FA:", err);
          return res.status(500).json({ message: "فشل في تسجيل الدخول" });
        }

        // Clear the pending 2FA userId from session
        delete (req.session as any).pending2FAUserId;

        res.json({ 
          message: "تم التحقق بنجاح",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      res.status(500).json({ message: "فشل في التحقق من الرمز" });
    }
  });

  // Send SMS OTP for 2FA setup or verification
  app.post("/api/2fa/send-sms", strictLimiter, async (req: any, res) => {
    try {
      const userId = (req.session as any).pending2FAUserId || req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "غير مصرح" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      if (!user.phoneNumber) {
        return res.status(400).json({ message: "يرجى إضافة رقم الجوال أولاً في الملف الشخصي" });
      }

      // Send SMS OTP
      const result = await sendSMSOTP(user.phoneNumber);

      if (!result.success) {
        return res.status(500).json({ message: result.message });
      }

      res.json({ 
        success: true,
        message: result.message,
        phoneNumber: user.phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') // Mask phone number
      });
    } catch (error) {
      console.error("Error sending SMS OTP:", error);
      res.status(500).json({ message: "فشل في إرسال رمز التحقق" });
    }
  });

  // Get pending 2FA method
  app.get("/api/2fa/pending-method", async (req: any, res) => {
    try {
      const userId = (req.session as any).pending2FAUserId;

      if (!userId) {
        return res.status(401).json({ message: "غير مصرح" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      res.json({
        method: user.twoFactorMethod || 'authenticator',
        hasPhoneNumber: !!user.phoneNumber
      });
    } catch (error) {
      console.error("Error getting pending 2FA method:", error);
      res.status(500).json({ message: "فشل في الحصول على طريقة التحقق" });
    }
  });

  // Verify SMS OTP during login
  app.post("/api/2fa/verify-sms", strictLimiter, async (req: any, res) => {
    try {
      const { code } = req.body;

      // Get userId from session
      const userId = (req.session as any).pending2FAUserId;

      if (!userId) {
        return res.status(400).json({ message: "الجلسة منتهية. الرجاء تسجيل الدخول مرة أخرى" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      if (!user.phoneNumber) {
        return res.status(400).json({ message: "رقم الجوال غير موجود" });
      }

      // Verify SMS OTP
      const verification = await verifySMSOTP(user.phoneNumber, code);

      if (!verification.valid) {
        return res.status(400).json({ message: verification.message });
      }

      // Log the user in
      req.login(user, (err: any) => {
        if (err) {
          console.error("Error logging in user after SMS 2FA:", err);
          return res.status(500).json({ message: "فشل في تسجيل الدخول" });
        }

        // Clear the pending 2FA userId from session
        delete (req.session as any).pending2FAUserId;

        res.json({ 
          message: "تم التحقق بنجاح",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    } catch (error) {
      console.error("Error verifying SMS OTP:", error);
      res.status(500).json({ message: "فشل في التحقق من الرمز" });
    }
  });

  // Update 2FA method preference
  app.post("/api/2fa/update-method", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { method, password } = req.body;

      if (!method || !['authenticator', 'sms', 'both'].includes(method)) {
        return res.status(400).json({ message: "طريقة غير صالحة" });
      }

      if (!password) {
        return res.status(400).json({ message: "كلمة المرور مطلوبة" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية غير مفعلة" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isPasswordValid) {
        return res.status(400).json({ message: "كلمة المرور غير صحيحة" });
      }

      // Check if phone number is required for SMS methods
      if ((method === 'sms' || method === 'both') && !user.phoneNumber) {
        return res.status(400).json({ message: "يرجى إضافة رقم الجوال أولاً في الملف الشخصي" });
      }

      // Update method
      await db.update(users)
        .set({ twoFactorMethod: method })
        .where(eq(users.id, userId));

      await logActivity({
        userId,
        action: 'update_2fa_method',
        entityType: '2fa',
        entityId: userId,
        newValue: { method }
      });

      res.json({ 
        success: true,
        message: "تم تحديث طريقة المصادقة الثنائية بنجاح",
        method
      });
    } catch (error) {
      console.error("Error updating 2FA method:", error);
      res.status(500).json({ message: "فشل في تحديث طريقة المصادقة الثنائية" });
    }
  });

  // Generate new backup codes
  app.post("/api/2fa/backup-codes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "كلمة المرور مطلوبة" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "المصادقة الثنائية غير مفعلة" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isPasswordValid) {
        return res.status(400).json({ message: "كلمة المرور غير صحيحة" });
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes();

      await db.update(users)
        .set({ twoFactorBackupCodes: backupCodes })
        .where(eq(users.id, userId));

      await logActivity({
        userId,
        action: 'regenerate_backup_codes',
        entityType: '2fa',
        entityId: userId,
        newValue: { count: backupCodes.length }
      });

      res.json({ backupCodes });
    } catch (error) {
      console.error("Error generating backup codes:", error);
      res.status(500).json({ message: "فشل في إنشاء الرموز الاحتياطية" });
    }
  });

  // ============================================================
  // INTERESTS & ONBOARDING ROUTES
  // ============================================================

  // Get user interests (categories they're interested in)
  app.get("/api/interests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const userInterestsList = await db
        .select({
          id: categories.id,
          categoryId: categories.id,
          nameAr: categories.nameAr,
          nameEn: categories.nameEn,
          slug: categories.slug,
          heroImageUrl: categories.heroImageUrl,
        })
        .from(userInterests)
        .innerJoin(categories, eq(userInterests.categoryId, categories.id))
        .where(eq(userInterests.userId, userId));

      res.json(userInterestsList);
    } catch (error) {
      console.error("Error fetching user interests:", error);
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  });

  // Save user interests
  app.post("/api/interests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { interestIds } = req.body;

      if (!Array.isArray(interestIds) || interestIds.length === 0) {
        return res.status(400).json({ message: "يجب اختيار اهتمام واحد على الأقل" });
      }

      // Delete existing interests
      await db.delete(userInterests).where(eq(userInterests.userId, userId));

      // Insert new interests
      const interestsToInsert = interestIds.map(categoryId => ({
        userId,
        categoryId,
      }));

      await db.insert(userInterests).values(interestsToInsert);

      res.json({ success: true, message: "تم حفظ الاهتمامات بنجاح" });
    } catch (error) {
      console.error("Error saving interests:", error);
      res.status(500).json({ message: "Failed to save interests" });
    }
  });

  // Complete profile (mark onboarding as done)
  app.post("/api/auth/complete-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const user = await storage.updateUser(userId, { 
        isProfileComplete: true 
      });

      res.json({ success: true, user });
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });

  // ============================================================
  // SMART INTERESTS ROUTES
  // ============================================================

  // Analyze user interests from behavior
  app.get("/api/interests/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      // Validate days parameter
      if (isNaN(days) || days < 1 || days > 365) {
        return res.status(400).json({ message: "معامل الأيام يجب أن يكون بين 1 و 365" });
      }

      const analysis = await storage.analyzeUserInterestsFromBehavior(userId, days);

      // Calculate summary statistics
      const totalCategories = analysis.length;
      const avgWeight = totalCategories > 0 
        ? Math.round((analysis.reduce((sum, item) => sum + item.suggestedWeight, 0) / totalCategories) * 10) / 10
        : 0;

      res.json({
        analysis,
        summary: {
          totalCategories,
          avgWeight,
        },
      });
    } catch (error) {
      console.error("Error analyzing user interests:", error);
      res.status(500).json({ message: "فشل في تحليل الاهتمامات" });
    }
  });

  // Update user interests automatically based on behavior
  app.post("/api/interests/update-weights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { days } = req.body;

      // Validate days parameter if provided
      const daysToUse = days !== undefined ? parseInt(days) : 7;
      if (isNaN(daysToUse) || daysToUse < 1 || daysToUse > 365) {
        return res.status(400).json({ message: "معامل الأيام يجب أن يكون بين 1 و 365" });
      }

      const summary = await storage.updateUserInterestsAutomatically(userId, daysToUse);

      res.json({
        success: true,
        summary,
      });
    } catch (error) {
      console.error("Error updating user interests:", error);
      res.status(500).json({ message: "فشل في تحديث الاهتمامات تلقائياً" });
    }
  });

  // Get personalized feed for user based on interests weights
  app.get("/api/personal-feed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      // Validate limit parameter
      if (isNaN(limit) || limit < 1 || limit > 50) {
        return res.status(400).json({ message: "معامل العدد يجب أن يكون بين 1 و 50" });
      }

      const articles = await storage.getPersonalizedFeed(userId, limit);

      res.json({
        articles,
        count: articles.length,
      });
    } catch (error) {
      console.error("Error getting personalized feed:", error);
      res.status(500).json({ message: "فشل في جلب التوصيات المخصصة" });
    }
  });

  // Get daily brief - personalized news summary for today/yesterday
  app.get("/api/daily-brief", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user interests with category details
      const userInterestsList = await db
        .select({
          categoryId: userInterests.categoryId,
          weight: userInterests.weight,
          categoryNameAr: categories.nameAr,
          categoryNameEn: categories.nameEn,
          categorySlug: categories.slug,
        })
        .from(userInterests)
        .innerJoin(categories, eq(userInterests.categoryId, categories.id))
        .where(eq(userInterests.userId, userId));

      // If user has no interests, return empty brief
      if (userInterestsList.length === 0) {
        return res.json({
          hasInterests: false,
          categories: [],
          totalArticles: 0,
        });
      }

      // Calculate yesterday and today date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Fetch articles for each category from today or yesterday
      const briefByCategory = await Promise.all(
        userInterestsList.map(async (interest) => {
          const categoryArticles = await db
            .select({
              id: articles.id,
              title: articles.title,
              slug: articles.slug,
              excerpt: articles.excerpt,
              content: articles.content,
              imageUrl: articles.imageUrl,
              publishedAt: articles.publishedAt,
              categoryId: articles.categoryId,
            })
            .from(articles)
            .where(
              and(
                eq(articles.categoryId, interest.categoryId),
                eq(articles.status, "published"),
                sql`${articles.publishedAt} >= ${yesterday}`
              )
            )
            .orderBy(desc(articles.publishedAt))
            .limit(5);

          return {
            categoryId: interest.categoryId,
            categoryNameAr: interest.categoryNameAr,
            categoryNameEn: interest.categoryNameEn,
            categorySlug: interest.categorySlug,
            weight: interest.weight,
            articles: categoryArticles,
            articleCount: categoryArticles.length,
          };
        })
      );

      // Calculate total articles and estimated reading time
      const totalArticles = briefByCategory.reduce((sum, cat) => sum + cat.articleCount, 0);
      const estimatedReadingTime = Math.ceil(totalArticles * 2); // 2 minutes per article average

      res.json({
        hasInterests: true,
        categories: briefByCategory,
        totalArticles,
        estimatedReadingTime,
        dateRange: {
          from: yesterday.toISOString(),
          to: today.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error getting daily brief:", error);
      res.status(500).json({ message: "فشل في جلب الملخص اليومي" });
    }
  });

  // AI Daily Summary - Comprehensive 24h activity analysis
  app.get("/api/ai/daily-summary", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Define time ranges
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Query user events for last 24 hours
      const todayEvents = await db
        .select({
          id: userEvents.id,
          articleId: userEvents.articleId,
          eventType: userEvents.eventType,
          eventValue: userEvents.eventValue,
          metadata: userEvents.metadata,
          createdAt: userEvents.createdAt,
          categoryId: articles.categoryId,
          categoryNameAr: categories.nameAr,
          articleTitle: articles.title,
          articleSlug: articles.slug,
        })
        .from(userEvents)
        .leftJoin(articles, eq(userEvents.articleId, articles.id))
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(
          and(
            eq(userEvents.userId, userId),
            sql`${userEvents.createdAt} >= ${last24h.toISOString()}`
          )
        )
        .orderBy(desc(userEvents.createdAt));

      // Check if user has activity
      if (todayEvents.length === 0) {
        return res.status(404).json({ 
          message: "لا توجد نشاطات في آخر 24 ساعة",
          hasActivity: false 
        });
      }

      // Query previous 24h for comparison
      const yesterdayEvents = await db
        .select({
          eventType: userEvents.eventType,
          articleId: userEvents.articleId,
        })
        .from(userEvents)
        .where(
          and(
            eq(userEvents.userId, userId),
            sql`${userEvents.createdAt} >= ${previous24h.toISOString()}`,
            sql`${userEvents.createdAt} < ${last24h.toISOString()}`
          )
        );

      // ============================================================
      // 1. GREETING & SUMMARY
      // ============================================================

      const readEvents = todayEvents.filter(e => e.eventType === 'read');
      const uniqueArticlesRead = new Set(readEvents.map(e => e.articleId)).size;
      
      const totalReadingTimeSeconds = readEvents.reduce((sum, event) => {
        const duration = (event.metadata as any)?.readDuration || 0;
        return sum + duration;
      }, 0);
      const totalReadingTimeMinutes = Math.round(totalReadingTimeSeconds / 60);

      // Calculate top categories
      const categoryCounts = todayEvents.reduce((acc, event) => {
        if (event.categoryNameAr) {
          acc[event.categoryNameAr] = (acc[event.categoryNameAr] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([name]) => name);

      // Determine reading mood based on scrollDepth and duration
      const avgScrollDepth = readEvents.reduce((sum, event) => {
        const scrollDepth = (event.metadata as any)?.scrollDepth || 0;
        return sum + scrollDepth;
      }, 0) / (readEvents.length || 1);

      const avgReadDuration = totalReadingTimeSeconds / (readEvents.length || 1);

      let readingMood = "فضولي";
      if (avgScrollDepth > 80 && avgReadDuration > 120) {
        readingMood = "تحليلي";
      } else if (avgScrollDepth < 40 && avgReadDuration < 60) {
        readingMood = "سريع";
      } else if (avgScrollDepth > 60 && todayEvents.filter(e => e.eventType === 'comment').length > 2) {
        readingMood = "نقدي";
      }

      const personalizedGreeting = {
        userName: user.firstName || user.email.split('@')[0],
        articlesReadToday: uniqueArticlesRead,
        readingTimeMinutes: totalReadingTimeMinutes,
        topCategories,
        readingMood,
      };

      // ============================================================
      // 2. PERFORMANCE METRICS
      // ============================================================

      const articlesBookmarked = todayEvents.filter(e => e.eventType === 'save').length;
      const articlesLiked = todayEvents.filter(e => e.eventType === 'like').length;
      const commentsPosted = todayEvents.filter(e => e.eventType === 'comment').length;

      const completionRate = Math.round(avgScrollDepth);

      // Compare with yesterday
      const yesterdayReadCount = new Set(
        yesterdayEvents.filter(e => e.eventType === 'read').map(e => e.articleId)
      ).size;
      
      const percentChangeFromYesterday = yesterdayReadCount > 0
        ? Math.round(((uniqueArticlesRead - yesterdayReadCount) / yesterdayReadCount) * 100)
        : 100;

      const metrics = {
        articlesRead: uniqueArticlesRead,
        readingTimeMinutes: totalReadingTimeMinutes,
        completionRate,
        articlesBookmarked,
        articlesLiked,
        commentsPosted,
        percentChangeFromYesterday,
      };

      // ============================================================
      // 3. INTEREST ANALYSIS
      // ============================================================

      const categoryAnalysis = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({
          name,
          count,
        }));

      // Extract common topics from article titles
      const allTitles = todayEvents
        .filter(e => e.articleTitle)
        .map(e => e.articleTitle!);
      
      const topicWords = allTitles
        .join(' ')
        .split(/\s+/)
        .filter(word => word.length > 4)
        .reduce((acc, word) => {
          acc[word] = (acc[word] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topicsThatCatchAttention = Object.entries(topicWords)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

      // Get suggested articles based on user's reading patterns
      const userCategoryIds = Array.from(new Set(
        todayEvents.filter(e => e.categoryId).map(e => e.categoryId!)
      ));

      const suggestedArticlesData = userCategoryIds.length > 0
        ? await db
            .select({
              id: articles.id,
              title: articles.title,
              slug: articles.slug,
              categoryNameAr: categories.nameAr,
              imageUrl: articles.imageUrl,
            })
            .from(articles)
            .leftJoin(categories, eq(articles.categoryId, categories.id))
            .where(
              and(
                eq(articles.status, 'published'),
                sql`${articles.categoryId} IN (${sql.join(userCategoryIds, sql`, `)})`
              )
            )
            .orderBy(desc(articles.publishedAt))
            .limit(3)
        : [];

      const suggestedArticles = suggestedArticlesData.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.categoryNameAr || '',
        imageUrl: article.imageUrl,
      }));

      const interestAnalysis = {
        topCategories: categoryAnalysis,
        topicsThatCatchAttention,
        suggestedArticles,
      };

      // ============================================================
      // 4. TIME-BASED ACTIVITY
      // ============================================================

      const hourlyActivity = new Array(24).fill(0);
      todayEvents.forEach(event => {
        const hour = new Date(event.createdAt).getHours();
        hourlyActivity[hour]++;
      });

      const hourlyBreakdown = hourlyActivity.map((count, hour) => ({
        hour,
        count,
      }));

      const peakReadingTime = hourlyActivity.indexOf(Math.max(...hourlyActivity));
      const nonZeroHours = hourlyActivity.filter(count => count > 0);
      const lowActivityPeriod = nonZeroHours.length > 0
        ? hourlyActivity.indexOf(Math.min(...nonZeroHours.filter(h => h > 0)))
        : 0;

      let aiSuggestion = "استمر في القراءة المنتظمة!";
      if (peakReadingTime >= 20 || peakReadingTime <= 5) {
        aiSuggestion = "تفضل القراءة ليلاً، جرّب القراءة في الصباح لتنوع أكثر";
      } else if (uniqueArticlesRead < 3) {
        aiSuggestion = "حاول قراءة 3 مقالات يومياً لتحسين معرفتك";
      } else if (topCategories.length < 2) {
        aiSuggestion = "جرّب قراءة مقالات من تصنيفات جديدة لتوسيع اهتماماتك";
      }

      const timeActivity = {
        hourlyBreakdown,
        peakReadingTime,
        lowActivityPeriod,
        aiSuggestion,
      };

      // ============================================================
      // 5. AI INSIGHTS
      // ============================================================

      let dailyGoal = "اقرأ 3 مقالات من تصنيف لم تزره منذ أسبوع";
      
      if (uniqueArticlesRead >= 5) {
        dailyGoal = "أنت قارئ نشط! جرّب التعليق على مقال لمشاركة رأيك";
      } else if (articlesBookmarked > articlesLiked) {
        dailyGoal = "لديك الكثير من المقالات المحفوظة، خصص وقتاً لقراءتها";
      }

      const focusScore = Math.round(
        (completionRate * 0.6) + (Math.min(avgReadDuration / 180, 1) * 40)
      );

      const aiInsights = {
        readingMood,
        dailyGoal,
        focusScore,
      };

      // ============================================================
      // FINAL RESPONSE
      // ============================================================

      res.json({
        hasActivity: true,
        personalizedGreeting,
        metrics,
        interestAnalysis,
        timeActivity,
        aiInsights,
        generatedAt: now.toISOString(),
      });

    } catch (error) {
      console.error("Error generating daily summary:", error);
      res.status(500).json({ message: "فشل في إنشاء الملخص اليومي" });
    }
  });

  // ============================================================
  // SYSTEM ANNOUNCEMENT ROUTES
  // ============================================================

  // Get system announcement (public)
  app.get("/api/system/announcement", async (req, res) => {
    try {
      const announcement = await storage.getSystemSetting("announcement");
      
      if (!announcement) {
        return res.json({ isActive: false, message: "", type: "info" });
      }
      
      res.json(announcement);
    } catch (error) {
      console.error("Error fetching announcement:", error);
      res.status(500).json({ message: "Failed to fetch announcement" });
    }
  });

  // Update system announcement (admin only)
  app.post("/api/system/announcement", requireAuth, requirePermission("system.manage_settings"), async (req: any, res) => {
    try {
      const { message, type, isActive, durationType, expiresAt } = req.body;
      
      const announcementData = {
        message: message || "",
        type: type || "info",
        isActive: isActive !== undefined ? isActive : false,
        durationType: durationType || "never",
        expiresAt: expiresAt || null,
      };
      
      await storage.upsertSystemSetting("announcement", announcementData, "system", true);
      
      res.json({ success: true, announcement: announcementData });
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  // ============================================================
  // CATEGORY ROUTES (CMS Module 1)
  // ============================================================

  // Get all categories
  app.get("/api/categories", cacheControl({ maxAge: CACHE_DURATIONS.LONG, staleWhileRevalidate: CACHE_DURATIONS.LONG }), async (req, res) => {
    try {
      const withStats = req.query.withStats === 'true';
      
      if (withStats) {
        const categories = await storage.getCategoriesWithStats();
        res.json(categories);
      } else {
        const categories = await storage.getAllCategories();
        res.json(categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all English categories
  app.get("/api/en/categories", async (req, res) => {
    try {
      const withStats = req.query.withStats === 'true';
      
      if (withStats) {
        // Get categories with statistics
        const allCategories = await db
          .select()
          .from(enCategories)
          .where(eq(enCategories.status, 'active'))
          .orderBy(asc(enCategories.displayOrder));

        // Get stats for each category
        const categoriesWithStats = await Promise.all(
          allCategories.map(async (category) => {
            // Count articles
            const [{ articleCount }] = await db
              .select({ articleCount: sql<number>`count(*)::int` })
              .from(enArticles)
              .where(
                and(
                  eq(enArticles.categoryId, category.id),
                  eq(enArticles.status, "published")
                )
              );

            // Sum views
            const [{ totalViews }] = await db
              .select({ totalViews: sql<number>`coalesce(sum(${enArticles.views}), 0)::int` })
              .from(enArticles)
              .where(
                and(
                  eq(enArticles.categoryId, category.id),
                  eq(enArticles.status, "published")
                )
              );

            // Count likes (from reactions table for English articles)
            const [{ totalLikes }] = await db
              .select({ totalLikes: sql<number>`count(*)::int` })
              .from(reactions)
              .innerJoin(enArticles, eq(enArticles.id, reactions.articleId))
              .where(
                and(
                  eq(enArticles.categoryId, category.id),
                  eq(enArticles.status, "published"),
                  eq(reactions.type, "like")
                )
              );

            // Count bookmarks
            const [{ totalBookmarks }] = await db
              .select({ totalBookmarks: sql<number>`count(*)::int` })
              .from(bookmarks)
              .innerJoin(enArticles, eq(enArticles.id, bookmarks.articleId))
              .where(
                and(
                  eq(enArticles.categoryId, category.id),
                  eq(enArticles.status, "published")
                )
              );

            return {
              ...category,
              articleCount: articleCount || 0,
              totalViews: totalViews || 0,
              totalLikes: totalLikes || 0,
              totalBookmarks: totalBookmarks || 0,
            };
          })
        );

        res.json(categoriesWithStats);
      } else {
        const categories = await db
          .select()
          .from(enCategories)
          .where(eq(enCategories.status, 'active'))
          .orderBy(asc(enCategories.displayOrder));

        res.json(categories);
      }
    } catch (error) {
      console.error("Error fetching English categories:", error);
      res.status(500).json({ message: "Failed to fetch English categories" });
    }
  });

  // Get category by slug
  app.get("/api/categories/slug/:slug", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      const category = categories.find(c => c.slug === req.params.slug);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Get articles by category slug
  app.get("/api/categories/:slug/articles", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      const category = categories.find(c => c.slug === req.params.slug);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      let articlesList;

      // For smart/dynamic categories, use articleSmartCategories table
      if (category.type === "dynamic" || category.type === "smart") {
        const smartAssignments = await db
          .select({
            article: articles,
            score: articleSmartCategories.score,
          })
          .from(articleSmartCategories)
          .innerJoin(articles, eq(articles.id, articleSmartCategories.articleId))
          .where(and(
            eq(articleSmartCategories.categoryId, category.id),
            eq(articles.status, "published")
          ))
          .orderBy(desc(articleSmartCategories.score), desc(articles.publishedAt));

        articlesList = smartAssignments.map(item => item.article);
      } else {
        // For core/seasonal categories, use traditional categoryId
        articlesList = await storage.getArticles({ 
          categoryId: category.id,
          status: "published"
        });
      }

      res.json(articlesList);
    } catch (error) {
      console.error("Error fetching category articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Category Analytics Endpoint - Statistics for a specific category
  app.get("/api/categories/:slug/analytics", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      const category = categories.find(c => c.slug === req.params.slug);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Determine which articles to analyze based on category type
      let articleIds: string[] = [];
      
      if (category.type === "dynamic" || category.type === "smart") {
        // For smart/dynamic categories, get articles from articleSmartCategories
        const smartAssignments = await db
          .select({ articleId: articleSmartCategories.articleId })
          .from(articleSmartCategories)
          .where(eq(articleSmartCategories.categoryId, category.id));
        
        articleIds = smartAssignments.map(item => item.articleId);
      }

      // Build WHERE conditions for category articles
      const categoryConditions = category.type === "dynamic" || category.type === "smart"
        ? and(
            inArray(articles.id, articleIds.length > 0 ? articleIds : ['']), // Prevent empty array
            eq(articles.status, "published")
          )
        : and(
            eq(articles.categoryId, category.id),
            eq(articles.status, "published")
          );

      // Get total article count in this category
      const [totalCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(categoryConditions);

      // Get articles published in last 30 days
      const [recentCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(and(
          categoryConditions,
          gte(articles.publishedAt, monthAgo)
        ));

      // Get total views for all articles in this category
      const [totalViewsResult] = await db.select({
        total: sql<number>`COALESCE(SUM(${articles.views}), 0)::int`
      })
        .from(articles)
        .where(categoryConditions);

      // Calculate average views per article
      const avgViews = totalCount.count > 0 
        ? Math.round(totalViewsResult.total / totalCount.count)
        : 0;

      // Get most active reporter in this category
      let topAuthor;
      
      if (category.type === "dynamic" || category.type === "smart") {
        topAuthor = await db.select({
          userId: articles.reporterId,
          count: sql<number>`count(*)::int`,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
          .from(articles)
          .innerJoin(users, eq(articles.reporterId, users.id))
          .where(and(
            inArray(articles.id, articleIds.length > 0 ? articleIds : ['']),
            eq(articles.status, "published"),
            isNotNull(articles.reporterId)
          ))
          .groupBy(articles.reporterId, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(sql`count(*) DESC`)
          .limit(1);

        // Fallback to authorId if no reporter
        if (!topAuthor || topAuthor.length === 0) {
          topAuthor = await db.select({
            userId: articles.authorId,
            count: sql<number>`count(*)::int`,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          })
            .from(articles)
            .innerJoin(users, eq(articles.authorId, users.id))
            .where(and(
              inArray(articles.id, articleIds.length > 0 ? articleIds : ['']),
              eq(articles.status, "published"),
              isNotNull(articles.authorId)
            ))
            .groupBy(articles.authorId, users.firstName, users.lastName, users.profileImageUrl)
            .orderBy(sql`count(*) DESC`)
            .limit(1);
        }
      } else {
        topAuthor = await db.select({
          userId: articles.reporterId,
          count: sql<number>`count(*)::int`,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
          .from(articles)
          .innerJoin(users, eq(articles.reporterId, users.id))
          .where(and(
            eq(articles.categoryId, category.id),
            eq(articles.status, "published"),
            isNotNull(articles.reporterId)
          ))
          .groupBy(articles.reporterId, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(sql`count(*) DESC`)
          .limit(1);

        // Fallback to authorId
        if (!topAuthor || topAuthor.length === 0) {
          topAuthor = await db.select({
            userId: articles.authorId,
            count: sql<number>`count(*)::int`,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          })
            .from(articles)
            .innerJoin(users, eq(articles.authorId, users.id))
            .where(and(
              eq(articles.categoryId, category.id),
              eq(articles.status, "published"),
              isNotNull(articles.authorId)
            ))
            .groupBy(articles.authorId, users.firstName, users.lastName, users.profileImageUrl)
            .orderBy(sql`count(*) DESC`)
            .limit(1);
        }
      }

      // Get total interactions (reactions + comments) for category articles
      let totalInteractions = 0;
      
      if (articleIds.length > 0 || !(category.type === "dynamic" || category.type === "smart")) {
        const interactionCondition = category.type === "dynamic" || category.type === "smart"
          ? inArray(reactions.articleId, articleIds.length > 0 ? articleIds : [''])
          : eq(reactions.articleId, articles.id);

        const [reactionsCount] = await db.select({
          count: sql<number>`count(*)::int`
        })
          .from(reactions)
          .leftJoin(articles, eq(reactions.articleId, articles.id))
          .where(categoryConditions);

        const commentsCondition = category.type === "dynamic" || category.type === "smart"
          ? inArray(comments.articleId, articleIds.length > 0 ? articleIds : [''])
          : eq(comments.articleId, articles.id);

        const [commentsCount] = await db.select({
          count: sql<number>`count(*)::int`
        })
          .from(comments)
          .leftJoin(articles, eq(comments.articleId, articles.id))
          .where(categoryConditions);

        totalInteractions = (reactionsCount?.count || 0) + (commentsCount?.count || 0);
      }

      res.json({
        categoryName: category.nameAr,
        categoryIcon: category.icon,
        categoryColor: category.color,
        totalArticles: totalCount.count || 0,
        recentArticles: recentCount.count || 0,
        totalViews: totalViewsResult.total || 0,
        avgViewsPerArticle: avgViews,
        totalInteractions: totalInteractions,
        topAuthor: topAuthor && topAuthor.length > 0 ? {
          name: `${topAuthor[0].firstName} ${topAuthor[0].lastName}`.trim(),
          profileImageUrl: topAuthor[0].profileImageUrl,
          count: topAuthor[0].count
        } : null
      });
    } catch (error) {
      console.error("Error fetching category analytics:", error);
      res.status(500).json({ message: "Failed to fetch category analytics" });
    }
  });

  // GET /api/categories/smart - Get categories with filtering support
  app.get("/api/categories/smart", async (req, res) => {
    try {
      const { type, status } = req.query;
      
      // Build where conditions
      const conditions: any[] = [];
      
      // Filter by type if provided
      if (type && typeof type === "string") {
        if (type === "all") {
          // No type filter
        } else if (type === "core") {
          conditions.push(eq(categories.type, "core"));
        } else if (type === "smart") {
          conditions.push(eq(categories.type, "smart"));
        } else if (type === "dynamic") {
          conditions.push(eq(categories.type, "dynamic"));
        } else if (type === "seasonal") {
          conditions.push(eq(categories.type, "seasonal"));
        } else {
          conditions.push(inArray(categories.type, ["smart", "dynamic", "seasonal"]));
        }
      } else {
        // Default: only smart, dynamic, and seasonal (not core)
        conditions.push(inArray(categories.type, ["smart", "dynamic", "seasonal"]));
      }
      
      // Filter by status if provided
      if (status && typeof status === "string") {
        conditions.push(eq(categories.status, status));
      } else {
        // Default: only active
        conditions.push(eq(categories.status, "active"));
      }
      
      const filteredCategories = await db
        .select({
          id: categories.id,
          nameAr: categories.nameAr,
          nameEn: categories.nameEn,
          slug: categories.slug,
          type: categories.type,
          icon: categories.icon,
          description: categories.description,
          displayOrder: categories.displayOrder,
          status: categories.status,
          features: categories.features,
        })
        .from(categories)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(categories.displayOrder);

      // Get article counts for each category
      const categoriesWithCounts = await Promise.all(
        filteredCategories.map(async (category) => {
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(articles)
            .where(
              and(
                eq(articles.categoryId, category.id),
                eq(articles.status, "published")
              )
            );

          return {
            ...category,
            articleCount: count || 0,
          };
        })
      );

      res.json(categoriesWithCounts);
    } catch (error) {
      console.error("[Smart Categories] Error fetching smart categories:", error);
      res.status(500).json({ message: "فشل في جلب التصنيفات الذكية" });
    }
  });

  // Get AI metrics for footer
  app.get("/api/ai-metrics", async (req, res) => {
    try {
      // Get total articles processed
      const [{ articlesCount }] = await db
        .select({ articlesCount: sql<number>`count(*)::int` })
        .from(articles)
        .where(eq(articles.status, "published"));

      // Get active smart categories count
      const [{ smartCategoriesCount }] = await db
        .select({ smartCategoriesCount: sql<number>`count(*)::int` })
        .from(categories)
        .where(
          and(
            inArray(categories.type, ["smart", "dynamic"]),
            eq(categories.status, "active")
          )
        );

      // Mock AI signals active (can be replaced with real data later)
      const aiSignalsActive = 47;

      res.json({
        articlesProcessed: articlesCount || 0,
        aiSignalsActive,
        smartCategoriesCount: smartCategoriesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching AI metrics:", error);
      res.status(500).json({ 
        message: "فشل في جلب مقاييس الذكاء الاصطناعي",
        articlesProcessed: 0,
        aiSignalsActive: 0,
        smartCategoriesCount: 0,
      });
    }
  });

  // Get single category by ID
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Create new category (requires permission)
  app.post("/api/categories", requireAuth, requirePermission("categories.create"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      // Check if slug already exists
      const existingCategory = await storage.getAllCategories();
      if (existingCategory.some(cat => cat.slug === parsed.data.slug)) {
        return res.status(409).json({ message: "هذا المعرف مستخدم بالفعل" });
      }

      const category = await storage.createCategory(parsed.data);

      // Log activity
      await logActivity({
        userId,
        action: "created",
        entityType: "category",
        entityId: category.id,
        newValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update category (requires permission)
  app.patch("/api/categories/:id", requireAuth, requirePermission("categories.update"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const categoryId = req.params.id;

      const oldCategory = await storage.getCategoryById(categoryId);
      if (!oldCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Only allow specific fields to be updated
      const allowedFields = ["nameAr", "nameEn", "slug", "description", "icon", "heroImageUrl", "color", "displayOrder", "status"];
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const parsed = insertCategorySchema.partial().safeParse(updateData);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      // Check if slug already exists (excluding current category)
      if (parsed.data.slug && parsed.data.slug !== oldCategory.slug) {
        const existingCategory = await storage.getAllCategories();
        if (existingCategory.some(cat => cat.slug === parsed.data.slug && cat.id !== categoryId)) {
          return res.status(409).json({ message: "هذا المعرف مستخدم بالفعل" });
        }
      }

      const category = await storage.updateCategory(categoryId, parsed.data);

      // Log activity
      await logActivity({
        userId,
        action: "updated",
        entityType: "category",
        entityId: categoryId,
        oldValue: oldCategory,
        newValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete category (requires permission)
  app.delete("/api/categories/:id", requireAuth, requirePermission("categories.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const categoryId = req.params.id;

      const category = await storage.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      await storage.deleteCategory(categoryId);

      // Log activity
      await logActivity({
        userId,
        action: "deleted",
        entityType: "category",
        entityId: categoryId,
        oldValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Seed smart categories from config (admin only, for production deployment)
  app.post("/api/admin/categories/seed-smart", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("[Smart Categories Seed] 🌱 Starting smart categories seed...");

      // Smart categories configuration (embedded for production compatibility)
      const smartCategories = [
        {
          nameAr: "الآن",
          nameEn: "Now",
          slug: "now",
          description: "موجز فوري للأخبار والاتجاهات الحية - يتحدث تلقائياً كل 5 دقائق",
          icon: "🔥",
          type: "dynamic",
          status: "active",
          displayOrder: 1,
          autoActivate: true,
          updateInterval: 300,
          features: { realtime: true, ai_powered: true, trending: true, breaking_news: true }
        },
        {
          nameAr: "مختارات AI",
          nameEn: "AI Picks",
          slug: "ai-picks",
          description: "مختارات ذكية مخصصة لك بناءً على اهتماماتك وسلوكك القرائي",
          icon: "✨",
          type: "dynamic",
          status: "active",
          displayOrder: 2,
          autoActivate: true,
          features: { personalized: true, ai_powered: true, recommendation_engine: true, learning: true }
        },
        {
          nameAr: "رؤى وبيانات",
          nameEn: "Insights & Data",
          slug: "insights-data",
          description: "تحليلات بيانية تفاعلية تعتمد على الذكاء الاصطناعي - رسوم بيانية وتصورات ذكية",
          icon: "📊",
          type: "smart",
          status: "active",
          displayOrder: 3,
          autoActivate: true,
          features: { data_visualization: true, ai_analysis: true, interactive: true, charts: true }
        },
        {
          nameAr: "التحليل العميق",
          nameEn: "Deep Analysis",
          slug: "deep-analysis",
          description: "تحليلات معمقة ومقالات طويلة تغطي القضايا المعقدة بشكل شامل",
          icon: "🧠",
          type: "smart",
          status: "active",
          displayOrder: 4,
          autoActivate: false,
          features: { long_form: true, expert_analysis: true, ai_summary: true, audio_version: true }
        },
        {
          nameAr: "رمضان الذكي",
          nameEn: "Smart Ramadan",
          slug: "smart-ramadan",
          description: "تغطية شاملة لشهر رمضان بتقنيات ذكية - برامج، أنشطة، إفطار، صحة",
          icon: "🌙",
          type: "seasonal",
          status: "inactive",
          displayOrder: 100,
          autoActivate: true,
          seasonalRules: {
            hijriMonth: "رمضان",
            activateDaysBefore: 7,
            deactivateDaysAfter: 3,
            hijriYear: "auto"
          },
          features: { prayer_times: true, ramadan_programs: true, iftar_recipes: true, charity: true }
        },
        {
          nameAr: "الحج والعمرة",
          nameEn: "Hajj & Umrah",
          slug: "hajj-umrah",
          description: "دليل شامل للحج والعمرة - أخبار، إرشادات، خدمات ذكية",
          icon: "🕋",
          type: "seasonal",
          status: "inactive",
          displayOrder: 101,
          autoActivate: true,
          seasonalRules: {
            hijriMonth: "ذو الحجة",
            activateDaysBefore: 30,
            deactivateDaysAfter: 5,
            hijriYear: "auto"
          },
          features: { guides: true, services: true, live_updates: true, safety: true }
        },
        {
          nameAr: "كأس العالم",
          nameEn: "World Cup",
          slug: "world-cup",
          description: "تغطية حية وشاملة لكأس العالم - مباريات، تحليلات، إحصائيات",
          icon: "🏆",
          type: "seasonal",
          status: "inactive",
          displayOrder: 102,
          autoActivate: false,
          seasonalRules: {
            dateRange: { start: "2026-06-01", end: "2026-07-20" }
          },
          features: { live_scores: true, match_analysis: true, stats: true, predictions: true }
        },
        {
          nameAr: "الميزانية والاقتصاد",
          nameEn: "Budget & Economy",
          slug: "budget",
          description: "تحليل ميزانية الدولة والتوجهات الاقتصادية",
          icon: "💰",
          type: "seasonal",
          status: "inactive",
          displayOrder: 103,
          autoActivate: true,
          seasonalRules: {
            gregorianMonth: 12,
            activateDaysBefore: 15,
            deactivateDaysAfter: 7
          },
          features: { budget_analysis: true, infographics: true, expert_opinions: true, data_viz: true }
        }
      ];

      let insertedCount = 0;
      let updatedCount = 0;
      const results = [];

      for (const categoryConfig of smartCategories) {
        try {
          // Check if category exists
          const existingCategories = await storage.getAllCategories();
          const existing = existingCategories.find((c: any) => c.slug === categoryConfig.slug);

          if (existing) {
            // Update existing category
            await storage.updateCategory(existing.id, {
              nameAr: categoryConfig.nameAr,
              nameEn: categoryConfig.nameEn,
              description: categoryConfig.description,
              icon: categoryConfig.icon,
              type: categoryConfig.type as "core" | "dynamic" | "smart" | "seasonal",
              displayOrder: categoryConfig.displayOrder,
              updateInterval: categoryConfig.updateInterval,
              features: categoryConfig.features as any,
              seasonalRules: categoryConfig.seasonalRules as any,
              autoActivate: categoryConfig.autoActivate,
              status: (categoryConfig.status || "active") as "active" | "inactive",
            });
            updatedCount++;
            results.push({ slug: categoryConfig.slug, action: "updated" });
            console.log(`   ✓ Updated: ${categoryConfig.nameAr} (${categoryConfig.slug})`);
          } else {
            // Insert new category
            const newCategory = await storage.createCategory({
              nameAr: categoryConfig.nameAr,
              nameEn: categoryConfig.nameEn,
              slug: categoryConfig.slug,
              description: categoryConfig.description,
              icon: categoryConfig.icon,
              type: categoryConfig.type as "core" | "dynamic" | "smart" | "seasonal",
              displayOrder: categoryConfig.displayOrder,
              updateInterval: categoryConfig.updateInterval,
              features: categoryConfig.features as any,
              seasonalRules: categoryConfig.seasonalRules as any,
              autoActivate: categoryConfig.autoActivate,
              status: (categoryConfig.status || "active") as "active" | "inactive",
            });
            insertedCount++;
            results.push({ slug: categoryConfig.slug, action: "inserted", id: newCategory.id });
            console.log(`   ✓ Inserted: ${categoryConfig.nameAr} (${categoryConfig.slug})`);
          }
        } catch (error) {
          console.error(`   ✗ Error processing ${categoryConfig.slug}:`, error);
          results.push({ slug: categoryConfig.slug, action: "error", error: String(error) });
        }
      }

      // Log activity
      await logActivity({
        userId,
        action: "seeded",
        entityType: "category",
        entityId: "bulk",
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
          reason: `Seeded ${insertedCount} new and updated ${updatedCount} existing smart categories (total: ${smartCategories.length})`,
        },
      });

      console.log(`[Smart Categories Seed] ✅ Completed: ${insertedCount} inserted, ${updatedCount} updated`);

      res.json({
        success: true,
        message: `تم إضافة/تحديث ${insertedCount + updatedCount} تصنيف ذكي بنجاح`,
        inserted: insertedCount,
        updated: updatedCount,
        total: smartCategories.length,
        results,
      });
    } catch (error) {
      console.error("[Smart Categories Seed] Error:", error);
      res.status(500).json({ message: "فشل في تحديث التصنيفات الذكية" });
    }
  });

  // Update categories order (requires permission)
  app.post("/api/categories/reorder", requireAuth, requirePermission("categories.update"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { categoryIds } = req.body;
      
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "categoryIds must be an array" });
      }

      // Update each category's displayOrder
      const updates = categoryIds.map(async (id, index) => {
        return await storage.updateCategory(id, { displayOrder: index });
      });

      await Promise.all(updates);

      // Log activity
      await logActivity({
        userId,
        action: "reordered",
        entityType: "category",
        entityId: "bulk",
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
          reason: `Reordered ${categoryIds.length} categories`,
        },
      });

      res.json({ message: "Categories reordered successfully" });
    } catch (error) {
      console.error("Error reordering categories:", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });

  // ============================================================
  // USERS MANAGEMENT ROUTES
  // ============================================================

  // Upload profile image endpoint (for admin/user)
  const profileImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, WEBP, GIF'));
      }
    },
  });

  app.post("/api/upload/profile-image", isAuthenticated, strictLimiter, profileImageUpload.single('file'), async (req: any, res) => {
    const parseObjectPath = (path: string): { bucketName: string; objectName: string } => {
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      const pathParts = path.split("/");
      if (pathParts.length < 3) {
        throw new Error("Invalid path: must contain at least a bucket name");
      }
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");
      return { bucketName, objectName };
    };

    try {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم اختيار ملف" });
      }

      console.log("[Profile Image Upload] File received:", {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const publicObjectPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
      const publicPath = publicObjectPaths.split(',')[0];
      
      if (!publicPath) {
        throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
      }

      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const objectId = randomUUID();
      const relativePath = `uploads/profile-images/${objectId}.${fileExtension}`;
      const fullPath = `${publicPath}/${relativePath}`;

      console.log("[Profile Image Upload] Uploading to path:", fullPath);

      const { objectStorageClient } = await import('./objectStorage');

      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const proxyUrl = `/public-objects/${relativePath}`;

      console.log("[Profile Image Upload] Success. Proxy URL:", proxyUrl);

      res.json({ 
        success: true,
        url: proxyUrl
      });
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "الملف كبير جداً. الحد الأقصى 5MB" });
      }
      
      if (error.message?.includes('نوع الملف')) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "فشل في رفع الصورة" });
    }
  });

  // Get public user profile (no auth required)
  app.get("/api/users/:id/public", async (req, res) => {
    try {
      const userId = req.params.id;
      console.log(`📋 [PUBLIC PROFILE] Fetching public profile for user: ${userId}`);

      // Fetch user with public fields only
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          firstNameEn: users.firstNameEn,
          lastNameEn: users.lastNameEn,
          bio: users.bio,
          avatarUrl: users.profileImageUrl,
          verificationBadge: users.verificationBadge,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.status, 'active'),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      if (!user) {
        console.log(`❌ [PUBLIC PROFILE] User not found: ${userId}`);
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // Get follow statistics
      const followStats = await storage.getFollowStats(userId);

      // Count total published articles by this user
      const [articleCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(
          and(
            eq(articles.authorId, userId),
            eq(articles.status, 'published')
          )
        );

      // Count total articles read from reading history
      const [readingCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(readingHistory)
        .where(eq(readingHistory.userId, userId));

      const response = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameEn: user.firstNameEn,
        lastNameEn: user.lastNameEn,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isVerified: user.verificationBadge !== 'none',
        createdAt: user.createdAt,
        followersCount: followStats.followersCount,
        followingCount: followStats.followingCount,
        articlesPublished: articleCount?.count || 0,
        articlesRead: readingCount?.count || 0,
      };

      console.log(`✅ [PUBLIC PROFILE] Successfully fetched profile for user: ${userId}`);
      res.json(response);
    } catch (error) {
      console.error("❌ [PUBLIC PROFILE] Error fetching public profile:", error);
      res.status(500).json({ message: "فشل في جلب الملف الشخصي" });
    }
  });

  // Get all users with filtering (admin only)
  app.get("/api/admin/users", requireAuth, requirePermission("users.view"), async (req: any, res) => {
    try {
      const { search, query, roleId, role, status, limit = 20, ids } = req.query;

      // Build conditions for the main user query
      const conditions = [];
      conditions.push(sql`${users.deletedAt} IS NULL`);

      // Search by name or email
      const searchTerm = query || search;
      if (searchTerm) {
        conditions.push(
          or(
            ilike(users.email, `%${searchTerm}%`),
            ilike(users.firstName, `%${searchTerm}%`),
            ilike(users.lastName, `%${searchTerm}%`),
            sql`LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) LIKE LOWER(${'%' + searchTerm + '%'})`
          )
        );
      }

      // Filter by status
      if (status) {
        conditions.push(eq(users.status, status as string));
      }

      // If IDs are provided, fetch specific users by IDs
      if (ids) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        conditions.push(inArray(users.id, idArray));
      }

      // Build base query
      let usersListQuery = db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          status: users.status,
          isProfileComplete: users.isProfileComplete,
          createdAt: users.createdAt,
          emailVerified: users.emailVerified,
          verificationBadge: users.verificationBadge,
          lastActivityAt: users.lastActivityAt,
          hasPressCard: users.hasPressCard,
        })
        .from(users);

      // Apply filters
      if (conditions.length > 0) {
        usersListQuery = usersListQuery.where(and(...conditions)) as any;
      }

      // Apply role filters if provided - fetch user IDs that have the specified role
      let filteredUserIds: string[] | null = null;
      if (roleId || role) {
        const roleConditions = [];
        if (roleId) roleConditions.push(eq(roles.id, roleId as string));
        if (role) roleConditions.push(eq(roles.name, role as string));

        const usersWithRole = await db
          .select({ userId: userRoles.userId })
          .from(userRoles)
          .leftJoin(roles, eq(userRoles.roleId, roles.id))
          .where(and(...roleConditions));

        filteredUserIds = usersWithRole.map(u => u.userId);
        
        // If no users have this role, return empty array
        if (filteredUserIds.length === 0) {
          return res.json({ items: [], users: [] });
        }

        // Add to query conditions
        usersListQuery = usersListQuery.where(inArray(users.id, filteredUserIds)) as any;
      }

      // Execute main query
      const userList = await usersListQuery
        .orderBy(desc(users.createdAt))
        .limit(parseInt(limit as string, 10));

      // For each user, fetch their first role
      const usersWithRoles = await Promise.all(
        userList.map(async (user) => {
          const [firstRole] = await db
            .select({
              id: roles.id,
              name: roles.name,
              nameAr: roles.nameAr,
            })
            .from(userRoles)
            .leftJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id))
            .limit(1);

          return {
            ...user,
            roleName: firstRole?.name || null,
            roleNameAr: firstRole?.nameAr || null,
            roleId: firstRole?.id || null,
            role: firstRole?.name || 'user',
          };
        })
      );

      // Return in both formats for compatibility
      res.json({
        items: usersWithRoles.map(u => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          avatarUrl: u.profileImageUrl,
          firstName: u.firstName,
          lastName: u.lastName,
          status: u.status,
          roleName: u.roleName,
          roleNameAr: u.roleNameAr,
          roleId: u.roleId,
          emailVerified: u.emailVerified,
          verificationBadge: u.verificationBadge,
          lastActivityAt: u.lastActivityAt,
          hasPressCard: u.hasPressCard,
        })),
        users: usersWithRoles,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "فشل في جلب المستخدمين" });
    }
  });

  // Get user by ID (admin only)
  app.get("/api/admin/users/:id", requireAuth, requirePermission("users.view"), async (req: any, res) => {
    try {
      const userId = req.params.id;

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          firstNameEn: users.firstNameEn,
          lastNameEn: users.lastNameEn,
          bio: users.bio,
          phoneNumber: users.phoneNumber,
          profileImageUrl: users.profileImageUrl,
          status: users.status,
          emailVerified: users.emailVerified,
          phoneVerified: users.phoneVerified,
          isProfileComplete: users.isProfileComplete,
          createdAt: users.createdAt,
          hasPressCard: users.hasPressCard,
          jobTitle: users.jobTitle,
          department: users.department,
          pressIdNumber: users.pressIdNumber,
          cardValidUntil: users.cardValidUntil,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userRolesData = await db
        .select({
          id: roles.id,
          name: roles.name,
          nameAr: roles.nameAr,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      res.json({
        ...user,
        roles: userRolesData,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user (status, role assignment)
  app.patch("/api/admin/users/:id", requireAuth, requirePermission("users.update"), async (req: any, res) => {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const targetUserId = req.params.id;

      // Prevent self-modification to avoid privilege escalation/demotion
      if (targetUserId === adminUserId) {
        return res.status(403).json({ message: "Cannot modify your own account" });
      }

      const parsed = adminUpdateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      // Get old user data for logging
      const [oldUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!oldUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build update object with all provided fields
      const updateData: any = {};
      if (parsed.data.firstName !== undefined) updateData.firstName = parsed.data.firstName;
      if (parsed.data.lastName !== undefined) updateData.lastName = parsed.data.lastName;
      if (parsed.data.firstNameEn !== undefined) updateData.firstNameEn = parsed.data.firstNameEn || null;
      if (parsed.data.lastNameEn !== undefined) updateData.lastNameEn = parsed.data.lastNameEn || null;
      if (parsed.data.phoneNumber !== undefined) updateData.phoneNumber = parsed.data.phoneNumber || null;
      if (parsed.data.profileImageUrl !== undefined) updateData.profileImageUrl = parsed.data.profileImageUrl;
      if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
      if (parsed.data.emailVerified !== undefined) updateData.emailVerified = parsed.data.emailVerified;
      if (parsed.data.phoneVerified !== undefined) updateData.phoneVerified = parsed.data.phoneVerified;
      if (parsed.data.verificationBadge !== undefined) updateData.verificationBadge = parsed.data.verificationBadge;
      
      // Press Card fields (Apple Wallet Digital Press Card)
      if (parsed.data.hasPressCard !== undefined) {
        updateData.hasPressCard = parsed.data.hasPressCard;
        
        // If press card is disabled, clear all press card data
        if (!parsed.data.hasPressCard) {
          updateData.jobTitle = null;
          updateData.department = null;
          updateData.pressIdNumber = null;
          updateData.cardValidUntil = null;
        } else {
          // Only update press card fields if press card is enabled
          if (parsed.data.jobTitle !== undefined) updateData.jobTitle = parsed.data.jobTitle ?? null;
          if (parsed.data.department !== undefined) updateData.department = parsed.data.department ?? null;
          if (parsed.data.pressIdNumber !== undefined) updateData.pressIdNumber = parsed.data.pressIdNumber ?? null;
          if (parsed.data.cardValidUntil !== undefined) {
            if (parsed.data.cardValidUntil) {
              const parsedDate = new Date(parsed.data.cardValidUntil);
              if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({ 
                  message: "Invalid cardValidUntil date format. Expected ISO 8601 date string." 
                });
              }
              updateData.cardValidUntil = parsedDate;
            } else {
              updateData.cardValidUntil = null;
            }
          }
        }
      } else if (parsed.data.hasPressCard === undefined && oldUser.hasPressCard) {
        // Only allow updating individual fields if press card is currently enabled
        if (parsed.data.jobTitle !== undefined) updateData.jobTitle = parsed.data.jobTitle ?? null;
        if (parsed.data.department !== undefined) updateData.department = parsed.data.department ?? null;
        if (parsed.data.pressIdNumber !== undefined) updateData.pressIdNumber = parsed.data.pressIdNumber ?? null;
        if (parsed.data.cardValidUntil !== undefined) {
          if (parsed.data.cardValidUntil) {
            const parsedDate = new Date(parsed.data.cardValidUntil);
            if (Number.isNaN(parsedDate.getTime())) {
              return res.status(400).json({ 
                message: "Invalid cardValidUntil date format. Expected ISO 8601 date string." 
              });
            }
            updateData.cardValidUntil = parsedDate;
          } else {
            updateData.cardValidUntil = null;
          }
        }
      }

      // Update user data if there are any fields to update
      if (Object.keys(updateData).length > 0) {
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, targetUserId));
      }

      // Update role if provided
      if (parsed.data.roleId !== undefined) {
        // Verify role exists
        const [role] = await db
          .select()
          .from(roles)
          .where(eq(roles.id, parsed.data.roleId))
          .limit(1);

        if (!role) {
          return res.status(404).json({ message: "Role not found" });
        }

        // Remove existing role assignment
        await db
          .delete(userRoles)
          .where(eq(userRoles.userId, targetUserId));

        // Assign new role
        await db.insert(userRoles).values({
          userId: targetUserId,
          roleId: parsed.data.roleId,
          assignedBy: adminUserId,
        });
      }

      // Get updated user data
      const [updatedUser] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          status: users.status,
          isProfileComplete: users.isProfileComplete,
          createdAt: users.createdAt,
          roleName: roles.name,
          roleNameAr: roles.nameAr,
          roleId: roles.id,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(users.id, targetUserId))
        .limit(1);

      // Log activity
      await logActivity({
        userId: adminUserId,
        action: "updated",
        entityType: "user",
        entityId: targetUserId,
        oldValue: oldUser,
        newValue: updatedUser,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      // Handle duplicate press ID number
      if (error.code === '23505' && error.constraint === 'users_press_id_number_idx') {
        return res.status(400).json({ 
          message: "رقم البطاقة الصحفية موجود مسبقاً. يرجى استخدام رقم آخر." 
        });
      }
      
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete/Ban user
  app.delete("/api/admin/users/:id", requireAuth, requirePermission("users.delete"), async (req: any, res) => {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const targetUserId = req.params.id;

      // Prevent self-deletion
      if (targetUserId === adminUserId) {
        return res.status(403).json({ message: "Cannot delete your own account" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Soft delete by setting status to banned
      await db
        .update(users)
        .set({ status: "banned" })
        .where(eq(users.id, targetUserId));

      // Log activity
      await logActivity({
        userId: adminUserId,
        action: "deleted",
        entityType: "user",
        entityId: targetUserId,
        oldValue: user,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Reset user password (admin only)
  app.post("/api/admin/users/:id/reset-password", requireAuth, requirePermission("users.update"), async (req: any, res) => {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const targetUserId = req.params.id;

      // Prevent self-password reset
      if (targetUserId === adminUserId) {
        return res.status(403).json({ message: "Cannot reset your own password" });
      }

      const { newPassword } = req.body;

      if (!newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({ message: "New password is required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db
        .update(users)
        .set({ 
          passwordHash: hashedPassword
        })
        .where(eq(users.id, targetUserId));

      // Log activity
      await logActivity({
        userId: adminUserId,
        action: "reset_password",
        entityType: "user",
        entityId: targetUserId,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ============================================================
  // RBAC ROUTES - User & Role Management
  // ============================================================

  // Create new user with roles
  app.post("/api/admin/users", requireAuth, requirePermission("users.create"), async (req: any, res) => {
    try {
      const createdBy = req.user?.id;
      if (!createdBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = adminCreateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      console.log("✅ [CREATE USER] Creating new user with roles", {
        email: parsed.data.email,
        roleIds: parsed.data.roleIds,
        createdBy
      });

      const { user: newUser, temporaryPassword } = await storage.createUserWithRoles(
        {
          email: parsed.data.email,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          phoneNumber: parsed.data.phoneNumber,
          roleIds: parsed.data.roleIds,
          status: parsed.data.status,
          emailVerified: parsed.data.emailVerified,
          phoneVerified: parsed.data.phoneVerified,
        },
        createdBy
      );

      // Get user with roles
      const userRoles = await storage.getUserRoles(newUser.id);

      console.log("✅ [CREATE USER] User created successfully", {
        userId: newUser.id,
        email: newUser.email,
        roles: userRoles.map(r => r.name)
      });

      // Auto-create staff record if user has reporter role
      const hasReporterRole = userRoles.some(r => r.name === 'reporter');
      if (hasReporterRole) {
        try {
          console.log("🔍 [AUTO-CREATE STAFF] New user has reporter role, creating staff record");
          const staffRecord = await storage.ensureReporterStaffRecord(newUser.id);
          console.log("✅ [AUTO-CREATE STAFF] Staff record created for new reporter", { 
            userId: newUser.id, 
            slug: staffRecord.slug 
          });
        } catch (staffError) {
          console.error("❌ [AUTO-CREATE STAFF] FAILED to create staff record:", staffError);
          return res.status(500).json({ 
            message: "تم إنشاء المستخدم لكن فشل إنشاء صفحة المراسل. يرجى المحاولة مرة أخرى.",
            error: staffError instanceof Error ? staffError.message : "Unknown error"
          });
        }
      }

      res.status(201).json({
        user: {
          ...newUser,
          roles: userRoles
        },
        temporaryPassword,
        message: "تم إنشاء المستخدم بنجاح. كلمة المرور المؤقتة: " + temporaryPassword
      });
    } catch (error: any) {
      console.error("❌ [CREATE USER] Error creating user:", error);
      
      if (error.message?.includes("duplicate") || error.code === "23505") {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get user roles by user ID
  app.get("/api/admin/users/:id/roles", requireAuth, requirePermission("users.view"), async (req: any, res) => {
    try {
      const userId = req.params.id;

      console.log("✅ [GET USER ROLES] Fetching roles for user", { userId });

      const userRoles = await storage.getUserRoles(userId);

      console.log("✅ [GET USER ROLES] Found roles", { userId, count: userRoles.length });

      res.json(userRoles);
    } catch (error) {
      console.error("❌ [GET USER ROLES] Error fetching user roles:", error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  // Update user roles
  app.patch("/api/admin/users/:id/roles", requireAuth, requirePermission("users.change_role"), async (req: any, res) => {
    try {
      const updatedBy = req.user?.id;
      if (!updatedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const targetUserId = req.params.id;

      // Prevent self-modification
      if (targetUserId === updatedBy) {
        return res.status(403).json({ message: "Cannot modify your own roles" });
      }

      const parsed = adminUpdateUserRolesSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      console.log("✅ [UPDATE USER ROLES] Updating roles", {
        targetUserId,
        roleIds: parsed.data.roleIds,
        updatedBy,
        reason: parsed.data.reason
      });

      // Verify user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUserRoles(
        targetUserId,
        parsed.data.roleIds,
        updatedBy,
        parsed.data.reason
      );

      console.log("✅ [UPDATE USER ROLES] Roles updated successfully", { targetUserId });

      // Auto-create staff record if user has reporter role
      const [reporterRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, 'reporter'))
        .limit(1);
      
      if (reporterRole && parsed.data.roleIds.includes(reporterRole.id)) {
        try {
          console.log("🔍 [AUTO-CREATE STAFF] User assigned reporter role, ensuring staff record exists");
          const staffRecord = await storage.ensureReporterStaffRecord(targetUserId);
          console.log("✅ [AUTO-CREATE STAFF] Staff record ensured for reporter", { 
            targetUserId, 
            slug: staffRecord.slug 
          });
        } catch (staffError) {
          console.error("❌ [AUTO-CREATE STAFF] FAILED to create staff record:", staffError);
          return res.status(500).json({ 
            message: "تم تحديث الأدوار لكن فشل إنشاء صفحة المراسل. يرجى المحاولة مرة أخرى.",
            error: staffError instanceof Error ? staffError.message : "Unknown error"
          });
        }
      }

      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      console.error("❌ [UPDATE USER ROLES] Error updating user roles:", error);
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  // Get staff data for a user
  app.get("/api/admin/users/:id/staff", requireAuth, requirePermission("users.view"), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const staffData = await storage.getStaffByUserId(userId);
      res.json(staffData);
    } catch (error) {
      console.error("❌ [GET USER STAFF] Error fetching staff data:", error);
      res.status(500).json({ message: "Failed to fetch staff data" });
    }
  });

  // Update or create staff data for a user
  app.patch("/api/admin/users/:id/staff", requireAuth, requirePermission("users.update"), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { bio, bioAr, title, titleAr } = req.body;

      const staffData = await storage.upsertStaff(userId, {
        bio,
        bioAr,
        title,
        titleAr,
      });

      console.log("✅ [UPDATE USER STAFF] Staff data updated successfully", { userId });
      res.json(staffData);
    } catch (error) {
      console.error("❌ [UPDATE USER STAFF] Error updating staff data:", error);
      res.status(500).json({ message: "Failed to update staff data" });
    }
  });

  // Get role permissions by role ID
  app.get("/api/admin/roles/:id/permissions", requireAuth, async (req: any, res) => {
    try {
      const roleId = req.params.id;

      console.log("✅ [GET ROLE PERMISSIONS] Fetching permissions for role", { roleId });

      const rolePermissions = await storage.getRolePermissions(roleId);

      console.log("✅ [GET ROLE PERMISSIONS] Found permissions", {
        roleId,
        count: rolePermissions.length
      });

      res.json(rolePermissions);
    } catch (error) {
      console.error("❌ [GET ROLE PERMISSIONS] Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  // Get user management KPIs
  app.get("/api/dashboard/users/kpis", requireAuth, requirePermission("users.view"), async (req: any, res) => {
    try {
      // Get total users
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
      const total = totalResult?.count || 0;

      // Get email verified count
      const [emailVerifiedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.emailVerified, true));
      const emailVerified = emailVerifiedResult?.count || 0;

      // Get suspended users count
      const [suspendedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.status, 'suspended'));
      const suspended = suspendedResult?.count || 0;

      // Get banned users count
      const [bannedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.status, 'banned'));
      const banned = bannedResult?.count || 0;

      // Calculate trends (last 7 days vs previous 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Email verified trend
      const [recentVerified] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(
          eq(users.emailVerified, true),
          gte(users.createdAt, sevenDaysAgo)
        ));

      const [previousVerified] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(
          eq(users.emailVerified, true),
          gte(users.createdAt, fourteenDaysAgo),
          sql`${users.createdAt} < ${sevenDaysAgo}`
        ));

      const verifiedTrend = previousVerified.count > 0 
        ? ((recentVerified.count - previousVerified.count) / previousVerified.count) * 100 
        : recentVerified.count > 0 ? 100 : 0;

      // Suspended trend
      const [recentSuspended] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(
          eq(users.status, 'suspended'),
          or(
            gte(users.suspendedUntil || sql`now()`, sevenDaysAgo),
            sql`${users.suspendedUntil} IS NULL`
          )
        ));

      const suspendedTrend = suspended > 0 ? 5 : 0; // Mock trend

      // Banned trend
      const [recentBanned] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(
          eq(users.status, 'banned'),
          or(
            gte(users.bannedUntil || sql`now()`, sevenDaysAgo),
            sql`${users.bannedUntil} IS NULL`
          )
        ));

      const bannedTrend = banned > 0 ? -2 : 0; // Mock trend

      res.json({
        total,
        emailVerified,
        emailVerifiedTrend: Number(verifiedTrend.toFixed(1)),
        suspended,
        suspendedTrend: Number(suspendedTrend.toFixed(1)),
        banned,
        bannedTrend: Number(bannedTrend.toFixed(1)),
      });
    } catch (error) {
      console.error("Error fetching user KPIs:", error);
      res.status(500).json({ message: "Failed to fetch user KPIs" });
    }
  });

  // ============================================================
  // ADMIN: ROLES & PERMISSIONS MANAGEMENT  
  // ============================================================

  // Get all roles with their permissions
  app.get("/api/admin/roles", requireAuth, requirePermission("system.manage_roles"), async (req: any, res) => {
    try {
      // Get all roles with their permissions using JOIN
      const rolesData = await db.select().from(roles).orderBy(roles.name);
      
      const rolesWithPermissions = await Promise.all(
        rolesData.map(async (role) => {
          // Get permissions for this role
          const rolePerms = await db
            .select({ permission: permissions })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, role.id));

          // Get user count for this role
          const userCount = await db
            .select()
            .from(userRoles)
            .where(eq(userRoles.roleId, role.id));

          return {
            ...role,
            permissions: rolePerms.map(rp => rp.permission),
            userCount: userCount.length,
          };
        })
      );

      res.json(rolesWithPermissions);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Get a single role with its permissions
  app.get("/api/admin/roles/:id", requireAuth, requirePermission("system.manage_roles"), async (req: any, res) => {
    try {
      const role = await db.select().from(roles).where(eq(roles.id, req.params.id)).limit(1);
      
      if (!role || role.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Get permissions for this role
      const rolePerms = await db
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, req.params.id));

      // Get user count
      const userCount = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.roleId, req.params.id));

      res.json({
        ...role[0],
        permissions: rolePerms.map(rp => rp.permission),
        userCount: userCount.length,
      });
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  // Get all permissions (for UI selection)
  app.get("/api/permissions", requireAuth, requirePermission("system.manage_roles"), async (req: any, res) => {
    try {
      const allPermissions = await db.select().from(permissions).orderBy(permissions.module, permissions.code);
      res.json(allPermissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Update role permissions
  app.patch("/api/admin/roles/:id/permissions", requireAuth, requirePermission("system.manage_roles"), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const roleId = req.params.id;

      // Validate input
      const parsed = updateRolePermissionsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة", 
          errors: parsed.error.errors 
        });
      }

      // Check if role exists
      const role = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
      if (!role || role.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Prevent editing system roles
      if (role[0].isSystem) {
        return res.status(403).json({ message: "Cannot modify system role permissions" });
      }

      // Get system.manage_roles permission
      const manageRolesPerm = await db
        .select()
        .from(permissions)
        .where(eq(permissions.code, "system.manage_roles"))
        .limit(1);

      if (manageRolesPerm.length > 0) {
        const manageRolesPermId = manageRolesPerm[0].id;

        // Check if this update would remove system.manage_roles from ALL non-system roles
        if (!parsed.data.permissionIds.includes(manageRolesPermId)) {
          // This update wants to remove system.manage_roles from this role
          // Check if any OTHER non-system role still has this permission
          const otherRolesWithManagePerms = await db
            .select({ roleId: rolePermissions.roleId })
            .from(rolePermissions)
            .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
            .where(
              and(
                eq(rolePermissions.permissionId, manageRolesPermId),
                eq(roles.isSystem, false),
                // Exclude the current role being edited
                sql`${rolePermissions.roleId} != ${roleId}`
              )
            )
            .limit(1);

          // If no other non-system role has this permission, prevent removal
          if (otherRolesWithManagePerms.length === 0) {
            return res.status(409).json({ 
              message: "لا يمكن إزالة صلاحية إدارة الأدوار من آخر دور يملكها. يجب أن يحتفظ دور واحد على الأقل بهذه الصلاحية.",
              error: "Cannot remove system.manage_roles permission from the last role that has it. At least one role must retain this permission."
            });
          }
        }
      }

      // Get old permissions for logging
      const oldPermissions = await db
        .select({ permissionId: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      // Delete all existing permissions for this role
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      // Insert new permissions
      if (parsed.data.permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          parsed.data.permissionIds.map(permId => ({
            roleId,
            permissionId: permId,
          }))
        );
      }

      // Log activity
      await logActivity({
        userId,
        action: "update_role_permissions",
        entityType: "role",
        entityId: roleId,
        oldValue: { permissionIds: oldPermissions.map(p => p.permissionId) },
        newValue: { permissionIds: parsed.data.permissionIds },
        metadata: {
          reason: `Admin updated permissions for role: ${role[0].name}`,
        },
      });

      // Return updated role with permissions
      const updatedRolePerms = await db
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));

      res.json({
        ...role[0],
        permissions: updatedRolePerms.map(rp => rp.permission),
      });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // ============================================================
  // ADMIN ARTICLES ROUTES
  // ============================================================

  // Get all articles with filtering (admin only)
  app.get("/api/admin/articles", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const { search, status, articleType, categoryId, authorId, featured } = req.query;

      const reporterAlias = aliasedTable(users, 'reporter');

      let query = db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            firstNameEn: users.firstNameEn,
            lastNameEn: users.lastNameEn,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
          },
          reporter: {
            id: reporterAlias.id,
            firstName: reporterAlias.firstName,
            lastName: reporterAlias.lastName,
            firstNameEn: reporterAlias.firstNameEn,
            lastNameEn: reporterAlias.lastNameEn,
            email: reporterAlias.email,
            profileImageUrl: reporterAlias.profileImageUrl,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
        .$dynamic();

      if (search) {
        query = query.where(
          or(
            ilike(articles.title, `%${search}%`),
            ilike(articles.content, `%${search}%`),
            ilike(articles.excerpt, `%${search}%`)
          )
        );
      }

      if (status && status !== "all") {
        query = query.where(eq(articles.status, status));
      }

      if (articleType && articleType !== "all") {
        query = query.where(eq(articles.articleType, articleType));
      }

      if (categoryId) {
        query = query.where(eq(articles.categoryId, categoryId));
      }

      if (authorId) {
        query = query.where(eq(articles.authorId, authorId));
      }

      if (featured !== undefined) {
        query = query.where(eq(articles.isFeatured, featured === "true"));
      }

      query = query.orderBy(desc(articles.createdAt));

      const results = await query;

      const formattedArticles = results.map((row) => ({
        ...row.article,
        category: row.category,
        author: row.reporter || row.author,
      }));

      res.json(formattedArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get articles metrics
  app.get("/api/admin/articles/metrics", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const metrics = await storage.getArticlesMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching articles metrics:", error);
      res.status(500).json({ message: "Failed to fetch articles metrics" });
    }
  });

  // Get article by ID for editing (admin only)
  app.get("/api/admin/articles/:id", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const articleId = req.params.id;

      const reporterAlias = aliasedTable(users, 'reporter');

      const [result] = await db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            firstNameEn: users.firstNameEn,
            lastNameEn: users.lastNameEn,
            email: users.email,
          },
          reporter: {
            id: reporterAlias.id,
            firstName: reporterAlias.firstName,
            lastName: reporterAlias.lastName,
            firstNameEn: reporterAlias.firstNameEn,
            lastNameEn: reporterAlias.lastNameEn,
            email: reporterAlias.email,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(reporterAlias, eq(articles.reporterId, reporterAlias.id))
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!result) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json({
        ...result.article,
        category: result.category,
        author: result.reporter || result.author,
      });
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Create new article
  app.post("/api/admin/articles", requireAuth, requirePermission("articles.create"), async (req: any, res) => {
    try {
      let authorId = req.user?.id;
      if (!authorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.publishedAt && typeof requestData.publishedAt === 'string') {
        requestData.publishedAt = new Date(requestData.publishedAt);
      }
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }

      const parsed = insertArticleSchema.safeParse(requestData);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid article data",
          errors: parsed.error.flatten(),
        });
      }

      // Validate and set opinionAuthorId for opinion articles
      if (parsed.data.articleType === 'opinion' && req.body.opinionAuthorId) {
        const opinionAuthorId = req.body.opinionAuthorId;
        
        // Check if user exists
        const [opinionAuthor] = await db
          .select()
          .from(users)
          .where(eq(users.id, opinionAuthorId))
          .limit(1);
        
        if (!opinionAuthor) {
          return res.status(422).json({ 
            message: "كاتب الرأي المحدد غير موجود" 
          });
        }

        // Check if user has opinion_author role
        const authorRoles = await db
          .select({
            roleName: roles.name,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, opinionAuthorId));
        
        const hasOpinionAuthorRole = authorRoles.some(r => r.roleName === 'opinion_author');
        
        if (!hasOpinionAuthorRole) {
          return res.status(422).json({ 
            message: "المستخدم المحدد ليس كاتب رأي" 
          });
        }

        // Use the selected opinion author as the authorId
        authorId = opinionAuthorId;
      }

      // Validate reporterId if provided
      if (parsed.data.reporterId) {
        // Check if user exists
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, parsed.data.reporterId))
          .limit(1);
        
        if (!user) {
          return res.status(422).json({ 
            message: "المستخدم المحدد غير موجود" 
          });
        }

        // Check if user has reporter role (user can have multiple roles)
        const reporterRoles = await db
          .select({
            roleName: roles.name,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, parsed.data.reporterId));
        
        const hasReporterRole = reporterRoles.some(r => r.roleName === 'reporter');
        
        if (!hasReporterRole) {
          return res.status(422).json({ 
            message: "المستخدم المحدد ليس مراسلاً" 
          });
        }
      }

      // Add publishedAt automatically if status is published and publishedAt is not set
      const articleData: any = {
        ...parsed.data,
        authorId,
      };
      
      if (articleData.status === 'published' && !articleData.publishedAt) {
        articleData.publishedAt = new Date();
      }

      // Auto-assign high displayOrder (timestamp in seconds) if not set - makes new articles appear first
      if (articleData.displayOrder === undefined || articleData.displayOrder === null || articleData.displayOrder === 0) {
        articleData.displayOrder = Math.floor(Date.now() / 1000);
      }

      // Check for duplicate slug and append suffix if needed
      let finalSlug = articleData.slug;
      let slugSuffix = 1;
      let slugExists = true;
      
      while (slugExists) {
        const [existingArticle] = await db
          .select({ id: articles.id })
          .from(articles)
          .where(eq(articles.slug, finalSlug))
          .limit(1);
        
        if (existingArticle) {
          slugSuffix++;
          finalSlug = `${articleData.slug}-${slugSuffix}`;
        } else {
          slugExists = false;
        }
      }
      
      articleData.slug = finalSlug;

      const [newArticle] = await db
        .insert(articles)
        .values(articleData)
        .returning();

      // Log activity
      await logActivity({
        userId: authorId,
        action: "created",
        entityType: "article",
        entityId: newArticle.id,
        newValue: newArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      // Send notifications if article is published
      console.log(`🔍 [CREATE ARTICLE] Article created with status: ${newArticle.status}`);
      console.log(`🔍 [CREATE ARTICLE] Article ID: ${newArticle.id}, Title: ${newArticle.title}`);
      
      if (newArticle.status === 'published') {
        console.log(`🔔 [CREATE ARTICLE] Article is PUBLISHED - sending notifications...`);
        try {
          // Determine notification type based on newsType
          let notificationType: 'published' | 'breaking' | 'featured' = 'published';
          if (newArticle.newsType === 'breaking') {
            notificationType = 'breaking';
          } else if (newArticle.newsType === 'featured') {
            notificationType = 'featured';
          }

          console.log(`🔔 [CREATE ARTICLE] Calling sendArticleNotification with type: ${notificationType}`);
          
          // Send smart notifications via notification service
          await sendArticleNotification(newArticle, notificationType);

          console.log(`✅ [CREATE ARTICLE] Notifications sent for new article: ${newArticle.title}`);
        } catch (notificationError) {
          console.error("❌ [CREATE ARTICLE] Error sending notifications for new article:", notificationError);
          // Don't fail the creation operation if notification fails
        }
      } else {
        console.log(`⏸️ [CREATE ARTICLE] Article is NOT published (status: ${newArticle.status}) - skipping notifications`);
      }

      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  // Update article
  app.patch("/api/admin/articles/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      // Check if article exists
      const [existingArticle] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check permissions: edit_own or edit_any
      const userPermissions = await getUserPermissions(userId);
      const canEditOwn = userPermissions.includes("articles.edit_own");
      const canEditAny = userPermissions.includes("articles.edit_any");

      if (!canEditAny && (!canEditOwn || existingArticle.authorId !== userId)) {
        return res.status(403).json({ message: "You don't have permission to edit this article" });
      }

      const parsed = updateArticleSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: parsed.error.flatten(),
        });
      }

      // Validate reporterId if provided
      if (parsed.data.reporterId) {
        // Check if user exists
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, parsed.data.reporterId))
          .limit(1);
        
        if (!user) {
          return res.status(422).json({ 
            message: "المستخدم المحدد غير موجود" 
          });
        }

        // Check if user has reporter role (user can have multiple roles)
        const reporterRoles = await db
          .select({
            roleName: roles.name,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, parsed.data.reporterId));
        
        const hasReporterRole = reporterRoles.some(r => r.roleName === 'reporter');
        
        if (!hasReporterRole) {
          return res.status(422).json({ 
            message: "المستخدم المحدد ليس مراسلاً" 
          });
        }
      }

      // If status is being changed to published, check publish permission
      if (parsed.data.status === "published" && existingArticle.status !== "published") {
        const canPublish = userPermissions.includes("articles.publish");
        if (!canPublish) {
          return res.status(403).json({ message: "You don't have permission to publish articles" });
        }
      }

      // Convert all timestamp fields from strings to Date objects if provided
      const updateData: any = { ...parsed.data };
      
      // Convert timestamp fields (if they exist and are strings)
      const timestampFields = ['publishedAt', 'scheduledAt', 'credibilityLastUpdated'];
      timestampFields.forEach(field => {
        if (updateData[field] && typeof updateData[field] === 'string') {
          updateData[field] = new Date(updateData[field]);
        }
      });
      
      // Handle republish feature
      if (req.body.republish === true) {
        // User wants to republish with current timestamp
        updateData.publishedAt = new Date();
      } else if (parsed.data.status === "published" && existingArticle.status !== "published" && !updateData.publishedAt) {
        // Only set publishedAt automatically when publishing for the first time
        updateData.publishedAt = new Date();
      }
      // If republish is false or not present, keep the original publishedAt (don't update it)
      
      // Convert empty categoryId to null
      if (updateData.categoryId === "") {
        updateData.categoryId = null;
      }

      console.log('[UPDATE ARTICLE] Update data:', {
        reporterId: updateData.reporterId,
        reporterIdInBody: req.body.reporterId,
        reporterIdInParsed: parsed.data.reporterId,
      });

      const [updatedArticle] = await db
        .update(articles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      console.log('[UPDATE ARTICLE] Article updated:', {
        articleId: updatedArticle.id,
        reporterId: updatedArticle.reporterId,
        authorId: updatedArticle.authorId,
      });

      // Log activity
      await logActivity({
        userId,
        action: "updated",
        entityType: "article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      // Trigger notification if article was just published
      console.log(`🔍 [UPDATE ARTICLE] Article updated - Old status: ${existingArticle.status}, New status: ${updatedArticle.status}`);
      console.log(`🔍 [UPDATE ARTICLE] Article ID: ${updatedArticle.id}, Title: ${updatedArticle.title}`);
      
      if (updatedArticle.status === "published" && existingArticle.status !== "published") {
        console.log(`🔔 [UPDATE ARTICLE] Status changed to PUBLISHED - sending notifications...`);
        try {
          // Determine notification type based on article properties
          let notificationType: 'published' | 'breaking' | 'featured';
          
          if (updatedArticle.newsType === "breaking") {
            notificationType = 'breaking';
          } else if (updatedArticle.isFeatured) {
            notificationType = 'featured';
          } else {
            notificationType = 'published';
          }

          console.log(`🔔 [UPDATE ARTICLE] Calling sendArticleNotification with type: ${notificationType}`);

          // Send smart notifications via new service
          await sendArticleNotification(updatedArticle, notificationType);

          console.log(`✅ [UPDATE ARTICLE] Notifications sent successfully`);

          // Keep existing notification system for backward compatibility
          await createNotification({
            type: updatedArticle.newsType === "breaking" ? "BREAKING_NEWS" : "NEW_ARTICLE",
            data: {
              articleId: updatedArticle.id,
              articleTitle: updatedArticle.title,
              articleSlug: updatedArticle.slug,
              categoryId: updatedArticle.categoryId,
              newsType: updatedArticle.newsType,
            },
          });
        } catch (notificationError) {
          console.error("❌ [UPDATE ARTICLE] Error creating notification:", notificationError);
          // Don't fail the update operation if notification fails
        }
      } else {
        console.log(`⏸️ [UPDATE ARTICLE] No notification sent - Status unchanged or not published`);
      }

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  // Publish article
  app.post("/api/admin/articles/:id/publish", requireAuth, requirePermission("articles.publish"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const [updatedArticle] = await db
        .update(articles)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "published",
        entityType: "article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      // Trigger notification for published article
      console.log(`🔔 [PUBLISH ARTICLE] Publishing article - ID: ${updatedArticle.id}, Title: ${updatedArticle.title}`);
      try {
        // Determine notification type based on article properties
        let notificationType: 'published' | 'breaking' | 'featured';
        
        if (updatedArticle.newsType === "breaking") {
          notificationType = 'breaking';
        } else if (updatedArticle.isFeatured) {
          notificationType = 'featured';
        } else {
          notificationType = 'published';
        }

        console.log(`🔔 [PUBLISH ARTICLE] Calling sendArticleNotification with type: ${notificationType}`);

        // Send smart notifications via new service
        await sendArticleNotification(updatedArticle, notificationType);

        console.log(`✅ [PUBLISH ARTICLE] Notifications sent successfully`);

        // Keep existing notification system for backward compatibility
        await createNotification({
          type: updatedArticle.newsType === "breaking" ? "BREAKING_NEWS" : "NEW_ARTICLE",
          data: {
            articleId: updatedArticle.id,
            articleTitle: updatedArticle.title,
            articleSlug: updatedArticle.slug,
            categoryId: updatedArticle.categoryId,
            newsType: updatedArticle.newsType,
          },
        });
      } catch (notificationError) {
        console.error("❌ [PUBLISH ARTICLE] Error creating notification:", notificationError);
        // Don't fail the publish operation if notification fails
      }

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error publishing article:", error);
      res.status(500).json({ message: "Failed to publish article" });
    }
  });

  // Feature/unfeature article
  app.post("/api/admin/articles/:id/feature", requireAuth, requirePermission("articles.feature"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const { featured } = req.body;

      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const [updatedArticle] = await db
        .update(articles)
        .set({
          isFeatured: featured,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: featured ? "featured" : "unfeatured",
        entityType: "article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error featuring article:", error);
      res.status(500).json({ message: "Failed to feature article" });
    }
  });

  // Archive article
  app.post("/api/admin/articles/:id/archive", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const article = await storage.getArticleById(articleId);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const updatedArticle = await storage.archiveArticle(articleId, userId);

      // Log activity
      await logActivity({
        userId,
        action: "archived",
        entityType: "article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error archiving article:", error);
      res.status(500).json({ message: "Failed to archive article" });
    }
  });

  // Restore article
  app.post("/api/admin/articles/:id/restore", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const article = await storage.getArticleById(articleId);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const updatedArticle = await storage.restoreArticle(articleId, userId);

      // Log activity
      await logActivity({
        userId,
        action: "restored",
        entityType: "article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error restoring article:", error);
      res.status(500).json({ message: "Failed to restore article" });
    }
  });

  // Toggle article breaking news status
  app.post("/api/admin/articles/:id/toggle-breaking", requireAuth, requirePermission("articles.publish"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const article = await storage.getArticleById(articleId);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const updatedArticle = await storage.toggleArticleBreaking(articleId, userId);

      // Log activity
      await logActivity({
        userId,
        action: "toggle_breaking",
        entityType: "article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error toggling breaking news:", error);
      res.status(500).json({ message: "Failed to toggle breaking news" });
    }
  });

  // Archive article (soft delete)
  app.delete("/api/admin/articles/:id", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Soft delete by setting status to archived
      const [updatedArticle] = await db
        .update(articles)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "archived",
        entityType: "article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Article archived successfully" });
    } catch (error) {
      console.error("Error archiving article:", error);
      res.status(500).json({ message: "Failed to archive article" });
    }
  });

  // Permanently delete article (only for archived articles)
  app.delete("/api/admin/articles/:id/permanent", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Only allow permanent deletion of archived articles
      if (article.status !== "archived") {
        return res.status(400).json({ message: "Only archived articles can be permanently deleted" });
      }

      // Delete article permanently
      await db.delete(articles).where(eq(articles.id, articleId));

      // Log activity
      await logActivity({
        userId,
        action: "deleted_permanently",
        entityType: "article",
        entityId: articleId,
        oldValue: article,
        newValue: undefined,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Article permanently deleted successfully" });
    } catch (error) {
      console.error("Error permanently deleting article:", error);
      res.status(500).json({ message: "Failed to permanently delete article" });
    }
  });

  // Bulk archive articles
  app.post("/api/admin/articles/bulk-archive", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { articleIds } = req.body;

      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({ message: "Article IDs are required" });
      }

      // Archive all selected articles
      await db
        .update(articles)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(inArray(articles.id, articleIds));

      // Log activity
      await logActivity({
        userId,
        action: "bulk_archived",
        entityType: "article",
        entityId: articleIds.join(","),
        newValue: { count: articleIds.length, articleIds },
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: `Successfully archived ${articleIds.length} articles` });
    } catch (error) {
      console.error("Error bulk archiving articles:", error);
      res.status(500).json({ message: "Failed to bulk archive articles" });
    }
  });

  // Bulk permanently delete articles (only for archived articles)
  app.post("/api/admin/articles/bulk-delete-permanent", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { articleIds } = req.body;

      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({ message: "Article IDs are required" });
      }

      // Verify all articles are archived
      const articlesToDelete = await db
        .select()
        .from(articles)
        .where(inArray(articles.id, articleIds));

      const nonArchivedArticles = articlesToDelete.filter(a => a.status !== "archived");
      
      if (nonArchivedArticles.length > 0) {
        return res.status(400).json({ 
          message: "Only archived articles can be permanently deleted",
          nonArchivedCount: nonArchivedArticles.length 
        });
      }

      // Delete articles permanently
      await db.delete(articles).where(inArray(articles.id, articleIds));

      // Log activity
      await logActivity({
        userId,
        action: "bulk_deleted_permanently",
        entityType: "article",
        entityId: articleIds.join(","),
        oldValue: { count: articleIds.length, articleIds },
        newValue: undefined,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: `Successfully permanently deleted ${articleIds.length} articles` });
    } catch (error) {
      console.error("Error bulk permanently deleting articles:", error);
      res.status(500).json({ message: "Failed to bulk permanently delete articles" });
    }
  });

  // Update articles order
  app.post("/api/admin/articles/update-order", requireAuth, requirePermission("articles.edit_any"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { articleOrders } = req.body;

      if (!Array.isArray(articleOrders) || articleOrders.length === 0) {
        return res.status(400).json({ message: "Article orders are required" });
      }

      await storage.updateArticlesOrder(articleOrders);

      // Log activity
      await logActivity({
        userId,
        action: "articles_reordered",
        entityType: "article",
        entityId: "bulk",
        newValue: { count: articleOrders.length },
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Successfully updated article order" });
    } catch (error) {
      console.error("Error updating article order:", error);
      res.status(500).json({ message: "Failed to update article order" });
    }
  });

  // ============================================================
  // ADMIN ACTIVITY LOGS ROUTES
  // ============================================================

  // Get all activity logs with filtering and pagination (admin/system_admin only)
  app.get("/api/admin/activity-logs", requireAuth, requirePermission("system.view_audit"), async (req: any, res) => {
    try {
      const {
        userId,
        action,
        entityType,
        dateFrom,
        dateTo,
        searchQuery,
        page,
        limit,
      } = req.query;

      const filters: any = {};

      if (userId) filters.userId = userId;
      if (action) filters.action = action;
      if (entityType) filters.entityType = entityType;
      
      // Validate and parse dates
      if (dateFrom) {
        const parsedDateFrom = new Date(dateFrom);
        if (isNaN(parsedDateFrom.getTime())) {
          return res.status(400).json({ message: "Invalid dateFrom parameter" });
        }
        filters.dateFrom = parsedDateFrom;
      }
      
      if (dateTo) {
        const parsedDateTo = new Date(dateTo);
        if (isNaN(parsedDateTo.getTime())) {
          return res.status(400).json({ message: "Invalid dateTo parameter" });
        }
        filters.dateTo = parsedDateTo;
      }
      
      if (searchQuery) filters.searchQuery = searchQuery;
      if (page) filters.page = parseInt(page);
      if (limit) filters.limit = parseInt(limit);

      const result = await storage.getActivityLogs(filters);

      res.json(result);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Get activity logs analytics (admin/system_admin only)
  app.get("/api/admin/activity-logs/analytics", requireAuth, requirePermission("system.view_audit"), async (req: any, res) => {
    try {
      const analytics = await storage.getActivityLogsAnalytics();

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching activity logs analytics:", error);
      res.status(500).json({ message: "Failed to fetch activity logs analytics" });
    }
  });

  // Get activity log by ID (admin/system_admin only)
  app.get("/api/admin/activity-logs/:id", requireAuth, requirePermission("system.view_audit"), async (req: any, res) => {
    try {
      const { id } = req.params;

      const log = await storage.getActivityLogById(id);

      if (!log) {
        return res.status(404).json({ message: "Activity log not found" });
      }

      res.json(log);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });

  // ============================================================
  // HOMEPAGE ROUTE
  // ============================================================

  app.get("/api/homepage", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      // ✅ Validate and clamp limit/offset
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

      const [
        heroArticles,
        personalizedArticles,
        breakingNews,
        editorPicks,
        deepDiveArticles,
        trendingTopics,
      ] = await Promise.all([
        storage.getHeroArticles(),
        storage.getAllPublishedArticles(limit, offset),
        storage.getBreakingNews(5),
        storage.getEditorPicks(6),
        storage.getDeepDiveArticles(6),
        storage.getTrendingTopics(),
      ]);

      res.json({
        hero: heroArticles,
        forYou: personalizedArticles,
        breaking: breakingNews,
        editorPicks,
        deepDive: deepDiveArticles,
        trending: trendingTopics,
      });
    } catch (error) {
      console.error("Error fetching homepage data:", error);
      res.status(500).json({ message: "Failed to fetch homepage data" });
    }
  });

  // ============================================================
  // TRENDING KEYWORDS ROUTE
  // ============================================================

  app.get("/api/trending-keywords", cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM, staleWhileRevalidate: CACHE_DURATIONS.MEDIUM }), async (req, res) => {
    try {
      // Fetch published articles from the last 24 hours (1 day)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentArticles = await db
        .select({
          seo: articles.seo,
          categoryId: articles.categoryId,
        })
        .from(articles)
        .where(
          and(
            eq(articles.status, "published"),
            gte(articles.publishedAt, oneDayAgo)
          )
        );

      // Extract and count keywords
      const keywordMap = new Map<string, { count: number; categoryIds: string[] }>();

      for (const article of recentArticles) {
        const keywords = article.seo?.keywords;
        if (!keywords || !Array.isArray(keywords)) continue;

        for (const keyword of keywords) {
          if (!keyword || typeof keyword !== 'string') continue;

          const trimmedKeyword = keyword.trim();
          if (!trimmedKeyword) continue;

          const existing = keywordMap.get(trimmedKeyword);
          if (existing) {
            existing.count++;
            if (article.categoryId) {
              existing.categoryIds.push(article.categoryId);
            }
          } else {
            keywordMap.set(trimmedKeyword, {
              count: 1,
              categoryIds: article.categoryId ? [article.categoryId] : [],
            });
          }
        }
      }

      // Convert to array and find most common category for each keyword
      const keywordStats = Array.from(keywordMap.entries()).map(([keyword, data]) => {
        let mostCommonCategoryId: string | null = null;

        if (data.categoryIds.length > 0) {
          // Count category occurrences
          const categoryCounts = new Map<string, number>();
          for (const catId of data.categoryIds) {
            categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
          }

          // Find most common category
          let maxCount = 0;
          for (const [catId, count] of Array.from(categoryCounts.entries())) {
            if (count > maxCount) {
              maxCount = count;
              mostCommonCategoryId = catId;
            }
          }
        }

        return {
          keyword,
          count: data.count,
          categoryId: mostCommonCategoryId,
        };
      });

      // Sort by count descending
      keywordStats.sort((a, b) => b.count - a.count);

      // Get top 15
      const top15 = keywordStats.slice(0, 15);

      // Fetch category names for the top 15
      // Deduplicate categoryIds to avoid redundant queries
      const categoryIds = top15
        .map(k => k.categoryId)
        .filter((id): id is string => id !== null);
      
      const uniqueCategoryIds = Array.from(new Set(categoryIds));

      const categoriesData = uniqueCategoryIds.length > 0
        ? await db
            .select({
              id: categories.id,
              nameAr: categories.nameAr,
            })
            .from(categories)
            .where(inArray(categories.id, uniqueCategoryIds))
        : [];

      const categoryMap = new Map(categoriesData.map(c => [c.id, c.nameAr]));

      // Format final response
      const trendingKeywords = top15.map(item => ({
        keyword: item.keyword,
        count: item.count,
        category: item.categoryId ? categoryMap.get(item.categoryId) : undefined,
      }));

      res.json(trendingKeywords);
    } catch (error) {
      console.error("Error fetching trending keywords:", error);
      res.status(500).json({ message: "Failed to fetch trending keywords" });
    }
  });

  // ============================================================
  // KEYWORD FOLLOWING ROUTES
  // ============================================================

  // Follow a keyword
  app.post("/api/keywords/follow", requireAuth, async (req: any, res) => {
    try {
      const { keyword } = req.body;
      const userId = req.user.id;

      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ message: "الكلمة المفتاحية مطلوبة" });
      }

      // Find or create tag
      const slug = keyword.toLowerCase().trim().replace(/\s+/g, '-');
      let tag = await db.query.tags.findFirst({
        where: or(
          eq(tags.slug, slug),
          eq(tags.nameAr, keyword.trim())
        ),
      });

      if (!tag) {
        // Create new tag
        const [newTag] = await db.insert(tags).values({
          nameAr: keyword.trim(),
          nameEn: keyword.trim(),
          slug: slug,
          usageCount: 0,
          status: "active",
        }).returning();
        tag = newTag;
      }

      // Add follow
      await db.insert(userFollowedTerms).values({
        userId,
        tagId: tag.id,
        notify: true,
      }).onConflictDoNothing();

      // Update usage count
      const currentCount = tag.usageCount || 0;
      await db.update(tags)
        .set({ usageCount: currentCount + 1 })
        .where(eq(tags.id, tag.id));

      await logActivity({
        userId,
        action: 'keyword_followed',
        entityType: 'tag',
        entityId: tag.id,
      });

      res.json({ success: true, tagId: tag.id });
    } catch (error) {
      console.error("Error following keyword:", error);
      res.status(500).json({ message: "حدث خطأ أثناء متابعة الكلمة" });
    }
  });

  // Unfollow a keyword
  app.post("/api/keywords/unfollow", requireAuth, async (req: any, res) => {
    try {
      const { tagId } = req.body;
      const userId = req.user.id;

      if (!tagId) {
        return res.status(400).json({ message: "معرف الكلمة مطلوب" });
      }

      await db.delete(userFollowedTerms)
        .where(and(
          eq(userFollowedTerms.userId, userId),
          eq(userFollowedTerms.tagId, tagId)
        ));

      // Decrease usage count
      const currentTag = await db.query.tags.findFirst({
        where: eq(tags.id, tagId),
      });
      if (currentTag) {
        const newCount = Math.max(0, (currentTag.usageCount || 0) - 1);
        await db.update(tags)
          .set({ usageCount: newCount })
          .where(eq(tags.id, tagId));
      }

      await logActivity({
        userId,
        action: 'keyword_unfollowed',
        entityType: 'tag',
        entityId: tagId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing keyword:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إلغاء متابعة الكلمة" });
    }
  });

  // Get followed keywords (legacy format)
  app.get("/api/keywords/followed", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const followedTerms = await db
        .select({
          id: userFollowedTerms.id,
          tagId: userFollowedTerms.tagId,
          notify: userFollowedTerms.notify,
          createdAt: userFollowedTerms.createdAt,
          tag: {
            id: tags.id,
            nameAr: tags.nameAr,
            nameEn: tags.nameEn,
            slug: tags.slug,
            usageCount: tags.usageCount,
            color: tags.color,
          },
        })
        .from(userFollowedTerms)
        .innerJoin(tags, eq(userFollowedTerms.tagId, tags.id))
        .where(eq(userFollowedTerms.userId, userId))
        .orderBy(desc(userFollowedTerms.createdAt));

      res.json(followedTerms);
    } catch (error) {
      console.error("Error fetching followed keywords:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الكلمات المتابعة" });
    }
  });

  // Get followed keywords (simplified format with article count)
  app.get("/api/user/followed-keywords", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const followedTerms = await db
        .select({
          tagId: userFollowedTerms.tagId,
          notify: userFollowedTerms.notify,
          tagName: tags.nameAr,
        })
        .from(userFollowedTerms)
        .innerJoin(tags, eq(userFollowedTerms.tagId, tags.id))
        .where(eq(userFollowedTerms.userId, userId))
        .orderBy(desc(userFollowedTerms.createdAt));

      // Get article count for each keyword
      const keywordsWithCount = await Promise.all(
        followedTerms.map(async (term) => {
          const articleCount = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(articleTags)
            .innerJoin(articles, eq(articleTags.articleId, articles.id))
            .where(and(
              eq(articleTags.tagId, term.tagId),
              eq(articles.status, 'published')
            ));

          return {
            tagId: term.tagId,
            tagName: term.tagName,
            notify: term.notify,
            articleCount: articleCount[0]?.count || 0,
          };
        })
      );

      res.json(keywordsWithCount);
    } catch (error) {
      console.error("Error fetching followed keywords:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الكلمات المتابعة" });
    }
  });

  // Unfollow a keyword (DELETE method with path parameter)
  app.delete("/api/keywords/unfollow/:tagId", requireAuth, async (req: any, res) => {
    try {
      const { tagId } = req.params;
      const userId = req.user.id;

      if (!tagId) {
        return res.status(400).json({ message: "معرف الكلمة مطلوب" });
      }

      await db.delete(userFollowedTerms)
        .where(and(
          eq(userFollowedTerms.userId, userId),
          eq(userFollowedTerms.tagId, tagId)
        ));

      // Decrease usage count
      const currentTag = await db.query.tags.findFirst({
        where: eq(tags.id, tagId),
      });
      if (currentTag) {
        const newCount = Math.max(0, (currentTag.usageCount || 0) - 1);
        await db.update(tags)
          .set({ usageCount: newCount })
          .where(eq(tags.id, tagId));
      }

      await logActivity({
        userId,
        action: 'keyword_unfollowed',
        entityType: 'tag',
        entityId: tagId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing keyword:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إلغاء متابعة الكلمة" });
    }
  });

  // ============================================================
  // SOCIAL FOLLOWING ROUTES
  // ============================================================

  // POST /api/social/follow - Follow a user
  app.post("/api/social/follow", followLimiter, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const validatedData = insertSocialFollowSchema.parse({
        followerId: userId,
        followingId: req.body.followingId,
        notificationsEnabled: req.body.notificationsEnabled ?? true,
      });

      // Prevent self-follow
      if (validatedData.followerId === validatedData.followingId) {
        return res.status(400).json({ message: "لا يمكنك متابعة نفسك" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(validatedData.followingId);
      if (!targetUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // Check if already following
      const alreadyFollowing = await storage.isFollowing(validatedData.followerId, validatedData.followingId);
      if (alreadyFollowing) {
        return res.status(400).json({ message: "أنت تتابع هذا المستخدم بالفعل" });
      }

      const follow = await storage.followUser(validatedData);

      await logActivity({
        userId,
        action: 'user_followed',
        entityType: 'user',
        entityId: validatedData.followingId,
      });

      console.log('[Social Follow] User followed:', { followerId: userId, followingId: validatedData.followingId });
      res.json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء متابعة المستخدم" });
    }
  });

  // DELETE /api/social/unfollow/:userId - Unfollow a user
  app.delete("/api/social/unfollow/:userId", followLimiter, requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followingId = req.params.userId;

      if (!followingId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }

      // Check if currently following
      const isFollowing = await storage.isFollowing(followerId, followingId);
      if (!isFollowing) {
        return res.status(400).json({ message: "أنت لا تتابع هذا المستخدم" });
      }

      await storage.unfollowUser(followerId, followingId);

      await logActivity({
        userId: followerId,
        action: 'user_unfollowed',
        entityType: 'user',
        entityId: followingId,
      });

      console.log('[Social Follow] User unfollowed:', { followerId, followingId });
      res.json({ success: true, message: "تم إلغاء المتابعة بنجاح" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إلغاء متابعة المستخدم" });
    }
  });

  // GET /api/social/followers/:userId - Get followers list
  app.get("/api/social/followers/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 50));

      if (!userId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const followers = await storage.getFollowers(userId, limit);

      console.log('[Social Follow] Fetched followers:', { userId, count: followers.length });
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب المتابعين" });
    }
  });

  // GET /api/social/following/:userId - Get following list
  app.get("/api/social/following/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 50));

      if (!userId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const following = await storage.getFollowing(userId, limit);

      console.log('[Social Follow] Fetched following:', { userId, count: following.length });
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب قائمة المتابعة" });
    }
  });

  // GET /api/social/stats/:userId - Get follow statistics
  app.get("/api/social/stats/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const stats = await storage.getFollowStats(userId);

      console.log('[Social Follow] Fetched stats:', { userId, stats });
      res.json(stats);
    } catch (error) {
      console.error("Error fetching follow stats:", error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب إحصائيات المتابعة" });
    }
  });

  // GET /api/social/is-following/:userId - Check if current user follows another user
  app.get("/api/social/is-following/:userId", requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followingId = req.params.userId;

      if (!followingId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }

      const isFollowing = await storage.isFollowing(followerId, followingId);

      console.log('[Social Follow] Checked following status:', { followerId, followingId, isFollowing });
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "حدث خطأ أثناء التحقق من حالة المتابعة" });
    }
  });

  // ============================================================
  // ACTIVITIES ROUTE (Moment by Moment)
  // ============================================================

  app.get("/api/activities", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const cursor = req.query.cursor as string | undefined;
      const typeFilter = req.query.type ? (Array.isArray(req.query.type) ? req.query.type : [req.query.type]) : undefined;
      const importanceFilter = req.query.importance as string | undefined;
      const fromDate = req.query.from as string | undefined;
      const toDate = req.query.to as string | undefined;
      const targetKind = req.query.targetKind as string | undefined;

      // Build the unified activities query using UNION ALL
      const activitiesQuery = `
        WITH all_activities AS (
          -- Article Published
          SELECT 
            a.id as activity_id,
            'article_published' as type,
            a.published_at as occurred_at,
            u.id as actor_id,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as actor_name,
            u.profile_image_url as actor_avatar,
            a.id as target_id,
            'article' as target_kind,
            a.title as target_title,
            a.slug as target_slug,
            a.image_url as target_image,
            CASE 
              WHEN a.news_type = 'breaking' THEN 'urgent'
              WHEN a.news_type = 'featured' THEN 'high'
              ELSE 'normal'
            END as importance,
            'تم نشر: ' || a.title as summary
          FROM articles a
          LEFT JOIN users u ON a.author_id = u.id
          WHERE a.status = 'published' AND a.published_at IS NOT NULL

          UNION ALL

          -- Article Updated
          SELECT 
            a.id as activity_id,
            'article_updated' as type,
            a.updated_at as occurred_at,
            u.id as actor_id,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as actor_name,
            u.profile_image_url as actor_avatar,
            a.id as target_id,
            'article' as target_kind,
            a.title as target_title,
            a.slug as target_slug,
            a.image_url as target_image,
            'normal' as importance,
            'تم تحديث: ' || a.title as summary
          FROM articles a
          LEFT JOIN users u ON a.author_id = u.id
          WHERE a.status = 'published' AND a.updated_at > a.created_at

          UNION ALL

          -- Breaking News
          SELECT 
            a.id as activity_id,
            'breaking_news' as type,
            a.published_at as occurred_at,
            u.id as actor_id,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as actor_name,
            u.profile_image_url as actor_avatar,
            a.id as target_id,
            'article' as target_kind,
            a.title as target_title,
            a.slug as target_slug,
            a.image_url as target_image,
            'urgent' as importance,
            'عاجل: ' || a.title as summary
          FROM articles a
          LEFT JOIN users u ON a.author_id = u.id
          WHERE a.news_type = 'breaking' AND a.status = 'published' AND a.published_at IS NOT NULL

          UNION ALL

          -- Comment Added
          SELECT 
            c.id as activity_id,
            'comment_added' as type,
            c.created_at as occurred_at,
            u.id as actor_id,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as actor_name,
            u.profile_image_url as actor_avatar,
            a.id as target_id,
            'article' as target_kind,
            a.title as target_title,
            a.slug as target_slug,
            a.image_url as target_image,
            'low' as importance,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) || ' علق على: ' || a.title as summary
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          LEFT JOIN articles a ON c.article_id = a.id
          WHERE c.status = 'approved'

          UNION ALL

          -- Reaction Added
          SELECT 
            r.id as activity_id,
            'reaction_added' as type,
            r.created_at as occurred_at,
            u.id as actor_id,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as actor_name,
            u.profile_image_url as actor_avatar,
            a.id as target_id,
            'article' as target_kind,
            a.title as target_title,
            a.slug as target_slug,
            a.image_url as target_image,
            'low' as importance,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) || ' أعجب بـ: ' || a.title as summary
          FROM reactions r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN articles a ON r.article_id = a.id

          UNION ALL

          -- Bookmark Added
          SELECT 
            b.id as activity_id,
            'bookmark_added' as type,
            b.created_at as occurred_at,
            u.id as actor_id,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as actor_name,
            u.profile_image_url as actor_avatar,
            a.id as target_id,
            'article' as target_kind,
            a.title as target_title,
            a.slug as target_slug,
            a.image_url as target_image,
            'low' as importance,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) || ' حفظ: ' || a.title as summary
          FROM bookmarks b
          LEFT JOIN users u ON b.user_id = u.id
          LEFT JOIN articles a ON b.article_id = a.id

          UNION ALL

          -- Category Created
          SELECT 
            c.id as activity_id,
            'category_created' as type,
            c.created_at as occurred_at,
            NULL as actor_id,
            NULL as actor_name,
            NULL as actor_avatar,
            c.id as target_id,
            'category' as target_kind,
            c.name_ar as target_title,
            c.slug as target_slug,
            c.hero_image_url as target_image,
            'normal' as importance,
            'تم إنشاء تصنيف: ' || c.name_ar as summary
          FROM categories c
          WHERE c.status = 'active'

          UNION ALL

          -- Tag Created
          SELECT 
            t.id as activity_id,
            'tag_created' as type,
            t.created_at as occurred_at,
            NULL as actor_id,
            NULL as actor_name,
            NULL as actor_avatar,
            t.id as target_id,
            'tag' as target_kind,
            t.name_ar as target_title,
            t.slug as target_slug,
            NULL as target_image,
            'low' as importance,
            'تم إنشاء وسم: ' || t.name_ar as summary
          FROM tags t
          WHERE t.status = 'active'

          UNION ALL

          -- User Registered
          SELECT 
            u.id as activity_id,
            'user_registered' as type,
            u.created_at as occurred_at,
            u.id as actor_id,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as actor_name,
            u.profile_image_url as actor_avatar,
            u.id as target_id,
            'user' as target_kind,
            COALESCE(u.first_name || ' ' || u.last_name, u.email) as target_title,
            NULL as target_slug,
            u.profile_image_url as target_image,
            'low' as importance,
            'مستخدم جديد: ' || COALESCE(u.first_name || ' ' || u.last_name, u.email) as summary
          FROM users u
          WHERE u.status = 'active'
        )
        SELECT * FROM all_activities
        WHERE 1=1
          ${typeFilter ? `AND type = ANY($1)` : ''}
          ${importanceFilter ? `AND importance = $${typeFilter ? 2 : 1}` : ''}
          ${fromDate ? `AND occurred_at >= $${typeFilter && importanceFilter ? 3 : typeFilter || importanceFilter ? 2 : 1}::timestamp` : ''}
          ${toDate ? `AND occurred_at <= $${[typeFilter, importanceFilter, fromDate].filter(Boolean).length + 1}::timestamp` : ''}
          ${targetKind ? `AND target_kind = $${[typeFilter, importanceFilter, fromDate, toDate].filter(Boolean).length + 1}` : ''}
          ${cursor ? `AND occurred_at < $${[typeFilter, importanceFilter, fromDate, toDate, targetKind].filter(Boolean).length + 1}::timestamp` : ''}
        ORDER BY occurred_at DESC
        LIMIT $${[typeFilter, importanceFilter, fromDate, toDate, targetKind, cursor].filter(Boolean).length + 1}
      `;

      // Build query parameters array
      const params: any[] = [];
      if (typeFilter) params.push(typeFilter);
      if (importanceFilter) params.push(importanceFilter);
      if (fromDate) params.push(fromDate);
      if (toDate) params.push(toDate);
      if (targetKind) params.push(targetKind);
      if (cursor) params.push(cursor);
      params.push(limit + 1); // Fetch one extra to determine if there's a next page

      const result = await pool.query(activitiesQuery, params);
      const rows = result.rows as any[];

      // Check if there's a next page
      const hasMore = rows.length > limit;
      const activities = rows.slice(0, limit);
      
      // Format activities according to ActivitySchema
      const formattedActivities = activities.map((row: any) => ({
        id: row.activity_id,
        type: row.type,
        occurredAt: row.occurred_at?.toISOString(),
        actor: row.actor_id ? {
          id: row.actor_id,
          name: row.actor_name,
          avatarUrl: row.actor_avatar || undefined,
        } : undefined,
        target: row.target_id ? {
          id: row.target_id,
          kind: row.target_kind,
          title: row.target_title,
          slug: row.target_slug || undefined,
          url: row.target_kind === 'article' && row.target_slug ? `/article/${row.target_slug}` : 
               row.target_kind === 'category' && row.target_slug ? `/category/${row.target_slug}` :
               row.target_kind === 'tag' && row.target_slug ? `/tag/${row.target_slug}` : undefined,
          imageUrl: row.target_image || undefined,
        } : undefined,
        importance: row.importance,
        summary: row.summary,
      }));

      // Calculate next cursor
      const nextCursor = hasMore && activities.length > 0 
        ? activities[activities.length - 1].occurred_at?.toISOString()
        : null;

      res.json({
        items: formattedActivities,
        nextCursor,
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // ============================================================
  // LIVE NEWS UPDATES ROUTES (Moment by Moment - News Only)
  // ============================================================

  // GET /api/live/updates - Get live news updates (published & updated articles)
  app.get("/api/live/updates", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 20);
      const cursor = req.query.cursor as string | undefined;
      const filter = req.query.filter as string | undefined; // "breaking" | "all"

      // Build WHERE conditions
      const whereConditions = [
        sql`${articles.status} = 'published'`,
        sql`${articles.publishedAt} IS NOT NULL`,
      ];

      if (filter === "breaking") {
        whereConditions.push(sql`${articles.newsType} = 'breaking'`);
      }

      if (cursor) {
        whereConditions.push(sql`${articles.publishedAt} < ${cursor}::timestamp`);
      }

      // Fetch articles with category info
      const results = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          publishedAt: articles.publishedAt,
          updatedAt: articles.updatedAt,
          newsType: articles.newsType,
          categoryId: articles.categoryId,
          categoryNameAr: categories.nameAr,
          viewsCount: articles.views,
          content: articles.content,
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(...whereConditions))
        .orderBy(desc(articles.publishedAt))
        .limit(limit + 1);

      // Get comments count for each article
      const articleIds = results.slice(0, limit).map(r => r.id);
      let commentsCountMap: Record<string, number> = {};

      if (articleIds.length > 0) {
        const commentsCounts = await db
          .select({
            articleId: comments.articleId,
            count: sql<number>`count(*)::int`,
          })
          .from(comments)
          .where(
            and(
              inArray(comments.articleId, articleIds),
              eq(comments.status, "approved")
            )
          )
          .groupBy(comments.articleId);

        commentsCountMap = Object.fromEntries(
          commentsCounts.map(c => [c.articleId, c.count])
        );
      }

      // Check if there's a next page
      const hasMore = results.length > limit;
      const items = results.slice(0, limit);

      // Format response
      const formattedItems = items.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        imageUrl: item.imageUrl || null,
        publishedAt: item.publishedAt?.toISOString() || "",
        updatedAt: item.updatedAt?.toISOString() || "",
        isBreaking: item.newsType === "breaking",
        categoryId: item.categoryId || "",
        categoryNameAr: item.categoryNameAr || "غير مصنف",
        viewsCount: item.viewsCount || 0,
        commentsCount: commentsCountMap[item.id] || 0,
        summary: item.content
          ? item.content.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
          : "",
      }));

      const nextCursor =
        hasMore && items.length > 0 && items[items.length - 1].publishedAt
          ? items[items.length - 1].publishedAt?.toISOString()
          : null;

      res.json({
        items: formattedItems,
        nextCursor,
      });
    } catch (error) {
      console.error("Error fetching live updates:", error);
      res.status(500).json({ message: "Failed to fetch live updates" });
    }
  });

  // GET /api/live/breaking - Get latest 5 breaking news
  app.get("/api/live/breaking", async (req, res) => {
    try {
      // Fetch latest 5 breaking news
      const results = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          publishedAt: articles.publishedAt,
          updatedAt: articles.updatedAt,
          newsType: articles.newsType,
          categoryId: articles.categoryId,
          categoryNameAr: categories.nameAr,
          viewsCount: articles.views,
          content: articles.content,
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(
          and(
            eq(articles.newsType, "breaking"),
            eq(articles.status, "published"),
            isNotNull(articles.publishedAt)
          )
        )
        .orderBy(desc(articles.publishedAt))
        .limit(5);

      // Get comments count for each article
      const articleIds = results.map(r => r.id);
      let commentsCountMap: Record<string, number> = {};

      if (articleIds.length > 0) {
        const commentsCounts = await db
          .select({
            articleId: comments.articleId,
            count: sql<number>`count(*)::int`,
          })
          .from(comments)
          .where(
            and(
              inArray(comments.articleId, articleIds),
              eq(comments.status, "approved")
            )
          )
          .groupBy(comments.articleId);

        commentsCountMap = Object.fromEntries(
          commentsCounts.map(c => [c.articleId, c.count])
        );
      }

      // Format response
      const formattedItems = results.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        imageUrl: item.imageUrl || null,
        publishedAt: item.publishedAt?.toISOString() || "",
        updatedAt: item.updatedAt?.toISOString() || "",
        isBreaking: true,
        categoryId: item.categoryId || "",
        categoryNameAr: item.categoryNameAr || "غير مصنف",
        viewsCount: item.viewsCount || 0,
        commentsCount: commentsCountMap[item.id] || 0,
        summary: item.content
          ? item.content.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
          : "",
      }));

      res.json({
        items: formattedItems,
      });
    } catch (error) {
      console.error("Error fetching breaking news:", error);
      res.status(500).json({ message: "Failed to fetch breaking news" });
    }
  });

  // ============================================================
  // AI INSIGHTS ROUTE
  // ============================================================

  // Personal Smart Summary (Today's Knowledge Snapshot)
  app.get("/api/ai/insights/today", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user info
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // 1. Reading time and articles read today
      const readingHistoryToday = await db
        .select({
          articleId: readingHistory.articleId,
          readAt: readingHistory.readAt,
        })
        .from(readingHistory)
        .where(and(
          eq(readingHistory.userId, userId),
          gte(readingHistory.readAt, startOfDay)
        ));

      const articlesReadToday = readingHistoryToday.length;
      
      // Calculate reading time (estimate 3 minutes per article)
      const readingTimeMinutes = articlesReadToday * 3;

      // 2. Likes today
      const likesToday = await db
        .select()
        .from(reactions)
        .where(and(
          eq(reactions.userId, userId),
          eq(reactions.type, "like"),
          gte(reactions.createdAt, startOfDay)
        ));
      
      const likesCount = likesToday.length;

      // 3. Comments today
      const commentsToday = await db
        .select()
        .from(comments)
        .where(and(
          eq(comments.userId, userId),
          gte(comments.createdAt, startOfDay)
        ));
      
      const commentsCount = commentsToday.length;

      // 4. Top interests today (categories) - aggregated by frequency
      const articleIds = readingHistoryToday.map(r => r.articleId);
      let topInterests: string[] = [];
      
      if (articleIds.length > 0) {
        const articlesWithCategories = await db
          .select({
            categoryId: articles.categoryId,
          })
          .from(articles)
          .where(inArray(articles.id, articleIds));

        // Count category frequencies
        const categoryFrequency = new Map<string, number>();
        articlesWithCategories.forEach(a => {
          if (a.categoryId) {
            categoryFrequency.set(a.categoryId, (categoryFrequency.get(a.categoryId) || 0) + 1);
          }
        });

        // Sort by frequency and get top 3
        const topCategoryIds = Array.from(categoryFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id]) => id);

        if (topCategoryIds.length > 0) {
          const categoriesList = await db
            .select({
              id: categories.id,
              nameAr: categories.nameAr,
            })
            .from(categories)
            .where(inArray(categories.id, topCategoryIds));

          // Maintain frequency order
          topInterests = topCategoryIds
            .map(id => categoriesList.find(c => c.id === id)?.nameAr)
            .filter((name): name is string => name !== undefined);
        }
      }

      // 5. Completion rate (based on realistic daily reading goal of 3 articles)
      const DAILY_READING_GOAL = 3;
      const completionRate = articlesReadToday > 0 
        ? Math.min(100, Math.round((articlesReadToday / DAILY_READING_GOAL) * 100)) 
        : 0;

      // 6. AI-generated encouragement (no emojis)
      let aiPhrase = "ابدأ رحلتك المعرفية اليوم";
      if (articlesReadToday === 0) {
        aiPhrase = "لم تقرأ أي مقال بعد اليوم، ابدأ الآن";
      } else if (articlesReadToday >= 1 && articlesReadToday <= 3) {
        aiPhrase = "بداية جيدة! استمر في القراءة";
      } else if (articlesReadToday >= 4 && articlesReadToday <= 7) {
        aiPhrase = "ممتاز! ذكاؤك القرائي يرتفع يوماً بعد يوم";
      } else {
        aiPhrase = "رائع! أنت قارئ متميز اليوم";
      }

      // Greeting based on time of day
      const hour = new Date().getHours();
      let greeting = "مساء الخير";
      if (hour < 12) greeting = "صباح الخير";
      else if (hour < 18) greeting = "مساء الخير";
      else greeting = "مساء الخير";

      const firstName = user.firstName || user.email?.split('@')[0] || "عزيزي";

      res.json({
        greeting: `${greeting} يا ${firstName}`,
        metrics: {
          readingTime: readingTimeMinutes,
          completionRate,
          likes: likesCount,
          comments: commentsCount,
          articlesRead: articlesReadToday,
        },
        topInterests,
        aiPhrase,
        quickSummary: articlesReadToday > 0 
          ? `قرأت ${articlesReadToday} ${articlesReadToday === 1 ? 'مقال' : 'مقالات'} اليوم بإجمالي ${readingTimeMinutes} دقيقة.`
          : "لم تقرأ أي مقال اليوم بعد.",
      });
    } catch (error) {
      console.error("Error fetching today's insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  // AI Insights for Moment-by-Moment Page
  // Cache to avoid excessive OpenAI API calls (cache for 1 minute)
  let momentInsightsCache: {
    data: any;
    timestamp: number;
  } | null = null;

  app.get("/api/moment/ai-insights", async (req, res) => {
    try {
      const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds
      const now = Date.now();

      // Return cached data if still valid
      if (momentInsightsCache && (now - momentInsightsCache.timestamp) < CACHE_DURATION) {
        return res.json(momentInsightsCache.data);
      }

      // Get today's date range
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // 1. Get active users today (users who have any activity)
      const activeUsersQuery = await db.execute<{ count: number }>(sql`
        SELECT COUNT(DISTINCT user_id)::int as count
        FROM (
          SELECT user_id FROM comments WHERE created_at >= ${startOfDay}
          UNION
          SELECT user_id FROM reactions WHERE created_at >= ${startOfDay}
          UNION
          SELECT user_id FROM reading_history WHERE read_at >= ${startOfDay}
        ) as active_users
      `);
      const activeUsers = activeUsersQuery.rows[0]?.count || 0;

      // 2. Get total comments today
      const commentsQuery = await db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int as count
        FROM comments
        WHERE created_at >= ${startOfDay}
      `);
      const totalComments = commentsQuery.rows[0]?.count || 0;

      // 3. Get total reactions today
      const reactionsQuery = await db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int as count
        FROM reactions
        WHERE created_at >= ${startOfDay}
      `);
      const totalReactions = reactionsQuery.rows[0]?.count || 0;

      // 4. Get published articles today
      const publishedArticlesQuery = await db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int as count
        FROM articles
        WHERE published_at >= ${startOfDay} AND status = 'published'
      `);
      const publishedArticles = publishedArticlesQuery.rows[0]?.count || 0;

      // 5. Get breaking news count today
      const breakingNewsQuery = await db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int as count
        FROM articles
        WHERE published_at >= ${startOfDay} AND status = 'published' AND news_type = 'breaking'
      `);
      const breakingNews = breakingNewsQuery.rows[0]?.count || 0;

      // 6. Get recent activities for AI analysis
      const recentActivitiesQuery = await db.execute<{
        type: string;
        summary: string;
        occurred_at: string;
        importance: string;
        target_title: string | null;
        target_kind: string | null;
      }>(sql`
        WITH all_activities AS (
          SELECT 
            'article_published' as type,
            'تم نشر: ' || a.title as summary,
            a.published_at as occurred_at,
            CASE 
              WHEN a.news_type = 'breaking' THEN 'urgent'
              WHEN a.news_type = 'featured' THEN 'high'
              ELSE 'normal'
            END as importance,
            a.title as target_title,
            'article' as target_kind
          FROM articles a
          WHERE a.status = 'published' AND a.published_at >= ${startOfDay}

          UNION ALL

          SELECT 
            'comment_added' as type,
            'تعليق جديد على: ' || a.title as summary,
            c.created_at as occurred_at,
            'normal' as importance,
            a.title as target_title,
            'article' as target_kind
          FROM comments c
          LEFT JOIN articles a ON c.article_id = a.id
          WHERE c.created_at >= ${startOfDay}

          UNION ALL

          SELECT 
            'reaction_added' as type,
            'تفاعل جديد' as summary,
            r.created_at as occurred_at,
            'normal' as importance,
            NULL as target_title,
            'article' as target_kind
          FROM reactions r
          WHERE r.created_at >= ${startOfDay}
        )
        SELECT * FROM all_activities
        ORDER BY occurred_at DESC
        LIMIT 50
      `);

      const activities = recentActivitiesQuery.rows.map(row => ({
        type: row.type,
        summary: row.summary,
        occurredAt: row.occurred_at,
        importance: row.importance,
        target: row.target_title ? {
          title: row.target_title,
          kind: row.target_kind || 'article'
        } : undefined
      }));

      // 7. Generate AI insights using OpenAI
      const aiInsights = await generateDailyActivityInsights(
        activities,
        {
          activeUsers,
          totalComments,
          totalReactions,
          publishedArticles,
          breakingNews,
        }
      );

      const responseData = {
        dailySummary: aiInsights.dailySummary,
        topTopics: aiInsights.topTopics,
        activityTrend: aiInsights.activityTrend,
        userEngagement: {
          activeUsers,
          totalComments,
          totalReactions,
        },
        keyHighlights: aiInsights.keyHighlights,
      };

      // Update cache
      momentInsightsCache = {
        data: responseData,
        timestamp: now,
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error generating moment insights:", error);
      res.status(500).json({ 
        message: "Failed to generate insights",
        dailySummary: "نشاط معتدل اليوم مع تفاعل جيد من المستخدمين.",
        topTopics: [],
        activityTrend: "نشاط مستقر",
        userEngagement: {
          activeUsers: 0,
          totalComments: 0,
          totalReactions: 0,
        },
        keyHighlights: [],
      });
    }
  });

  // User Behavior Analytics
  app.get("/api/analytics/user-behavior", async (req, res) => {
    try {
      const range = (req.query.range as string) || "7d";
      const analytics = await storage.getUserBehaviorAnalytics(range);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user behavior analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Reporter Analytics - عرض إحصائيات المراسل فقط
  app.get("/api/reporter/analytics", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      // التحقق من أن المستخدم مراسل
      if (user.role !== 'reporter') {
        return res.status(403).json({ error: "هذا الـ endpoint خاص بالمراسلين فقط" });
      }
      
      // جلب مقالات المراسل
      const myArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.authorId, user.id));
      
      const articleIds = myArticles.map(a => a.id);
      
      if (articleIds.length === 0) {
        return res.json({
          totalArticles: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          articles: [],
        });
      }
      
      // حساب الإحصائيات
      const totalViews = myArticles.reduce((sum, a) => sum + (a.views || 0), 0);
      
      const likesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reactions)
        .where(
          and(
            inArray(reactions.articleId, articleIds),
            eq(reactions.type, 'like')
          )
        );
      
      const commentsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(inArray(comments.articleId, articleIds));
      
      res.json({
        totalArticles: myArticles.length,
        totalViews,
        totalLikes: likesResult[0]?.count || 0,
        totalComments: commentsResult[0]?.count || 0,
        articles: myArticles,
      });
    } catch (error) {
      console.error("Error fetching reporter analytics:", error);
      res.status(500).json({ message: "فشل في جلب الإحصائيات" });
    }
  });

  app.get("/api/ai-insights", async (req, res) => {
    try {
      // Changed from 24 hours to 7 days for better data availability
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // 1. Most Viewed (last 7 days)
      const [mostViewed] = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          views: articles.views,
          imageUrl: articles.imageUrl,
        })
        .from(articles)
        .where(
          and(
            eq(articles.status, "published"),
            sql`${articles.publishedAt} >= ${last7Days}`
          )
        )
        .orderBy(desc(articles.views))
        .limit(1);

      const viewsCount = mostViewed?.views || 0;
      const viewsTrend = viewsCount > 0 ? `+${Math.round((viewsCount / 1000) * 18)}%` : "+0%";

      // 2. Most Commented (last 7 days)
      const mostCommented = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          commentCount: sql<number>`count(${comments.id})::int`,
        })
        .from(articles)
        .leftJoin(comments, eq(comments.articleId, articles.id))
        .where(
          and(
            eq(articles.status, "published"),
            sql`${articles.publishedAt} >= ${last7Days}`
          )
        )
        .groupBy(articles.id)
        .orderBy(desc(sql`count(${comments.id})`))
        .limit(1);

      const commentsCount = mostCommented[0]?.commentCount || 0;
      const commentsTrend = commentsCount > 5 ? `+${Math.round((commentsCount / 10) * 12)}%` : "+0%";

      // 3. Most Controversial (highest comment rate relative to views)
      const controversial = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          views: articles.views,
          commentCount: sql<number>`count(${comments.id})::int`,
          ratio: sql<number>`CASE WHEN ${articles.views} > 0 THEN count(${comments.id})::float / ${articles.views}::float ELSE 0 END`,
        })
        .from(articles)
        .leftJoin(comments, eq(comments.articleId, articles.id))
        .where(
          and(
            eq(articles.status, "published"),
            sql`${articles.publishedAt} >= ${last7Days}`,
            sql`${articles.views} > 10` // Lowered threshold from 100 to 10
          )
        )
        .groupBy(articles.id)
        .orderBy(desc(sql`CASE WHEN ${articles.views} > 0 THEN count(${comments.id})::float / ${articles.views}::float ELSE 0 END`))
        .limit(1);

      const controversialRatio = controversial[0]?.ratio || 0;
      const controversialTrend = controversialRatio > 0 ? `+${Math.round(controversialRatio * 4700)}%` : "+0%";

      // 4. Most Positive (most liked)
      const mostLiked = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          likeCount: sql<number>`count(${reactions.id})::int`,
          views: articles.views,
          positiveRate: sql<number>`CASE WHEN ${articles.views} > 0 THEN (count(${reactions.id})::float / ${articles.views}::float) * 100 ELSE 0 END`,
        })
        .from(articles)
        .leftJoin(reactions, and(
          eq(reactions.articleId, articles.id),
          eq(reactions.type, "like")
        ))
        .where(
          and(
            eq(articles.status, "published"),
            sql`${articles.publishedAt} >= ${last7Days}`,
            sql`${articles.views} > 5` // Lowered threshold from 50 to 5
          )
        )
        .groupBy(articles.id)
        .orderBy(desc(sql`count(${reactions.id})`))
        .limit(1);

      const positiveRate = mostLiked[0]?.positiveRate || 0;
      const positiveRateDisplay = positiveRate > 0 && positiveRate < 1 
        ? positiveRate.toFixed(1)  // Show decimal for small values
        : Math.round(positiveRate);
      const positiveTrend = positiveRate > 0 ? `+${Math.ceil(positiveRate)}%` : "+0%";

      // 5. AI Pick (highest engagement score: views + comments*5 + likes*3)
      const aiPick = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          views: articles.views,
          commentCount: sql<number>`count(DISTINCT ${comments.id})::int`,
          likeCount: sql<number>`count(DISTINCT ${reactions.id})::int`,
          engagementScore: sql<number>`${articles.views} + (count(DISTINCT ${comments.id}) * 5) + (count(DISTINCT ${reactions.id}) * 3)`,
        })
        .from(articles)
        .leftJoin(comments, eq(comments.articleId, articles.id))
        .leftJoin(reactions, eq(reactions.articleId, articles.id))
        .where(
          and(
            eq(articles.status, "published"),
            sql`${articles.publishedAt} >= ${last7Days}`
          )
        )
        .groupBy(articles.id)
        .orderBy(desc(sql`${articles.views} + (count(DISTINCT ${comments.id}) * 5) + (count(DISTINCT ${reactions.id}) * 3)`))
        .limit(1);

      const aiEngagementScore = aiPick[0]?.engagementScore || 0;

      res.json({
        mostViewed: {
          article: mostViewed || null,
          count: viewsCount,
          trend: viewsTrend,
        },
        mostCommented: {
          article: mostCommented[0] || null,
          count: commentsCount,
          trend: commentsTrend,
        },
        mostControversial: {
          article: controversial[0] || null,
          trend: controversialTrend,
          aiAnalysis: controversialRatio > 0.05 
            ? `زاد النقاش حول هذا الموضوع بنسبة ${Math.round(controversialRatio * 4700)}٪`
            : "تفاعل معتدل من القراء",
        },
        mostPositive: {
          article: mostLiked[0] || null,
          positiveRate: `${positiveRateDisplay}٪`,
          trend: positiveTrend,
        },
        aiPick: {
          article: aiPick[0] || null,
          engagementScore: aiEngagementScore,
          forecast: aiEngagementScore > 1000 
            ? "يُتوقع استمرار التفاعل خلال الساعات القادمة" 
            : "تفاعل متوسط متوقع",
        },
      });
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Homepage statistics (cached for 5 min)
  app.get("/api/homepage/stats", cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM }), async (req, res) => {
    try {
      const stats = await storage.getHomepageStats();
      res.json(stats);
    } catch (error) {
      console.error('[Homepage Stats] Error:', error);
      res.status(500).json({ error: 'Failed to fetch homepage stats' });
    }
  });

  // ============================================================
  // ARTICLE ROUTES
  // ============================================================

  app.get("/api/articles", async (req, res) => {
    try {
      const { category, search, status, author } = req.query;
      const articles = await storage.getArticles({
        categoryId: category as string,
        searchQuery: search as string,
        status: status as string,
        authorId: author as string,
      });
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // News Analytics Endpoint - Smart statistics and insights
  app.get("/api/news/analytics", async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevMonthStart = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get article counts for different periods (excluding opinion articles)
      const [todayCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(and(
          gte(articles.publishedAt, today),
          eq(articles.status, "published"),
          or(isNull(articles.articleType), ne(articles.articleType, 'opinion'))
        ));

      const [weekCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(and(
          gte(articles.publishedAt, weekAgo),
          eq(articles.status, "published"),
          or(isNull(articles.articleType), ne(articles.articleType, 'opinion'))
        ));

      const [monthCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(and(
          gte(articles.publishedAt, monthAgo),
          eq(articles.status, "published"),
          or(isNull(articles.articleType), ne(articles.articleType, 'opinion'))
        ));

      const [prevMonthCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(and(
          gte(articles.publishedAt, prevMonthStart),
          sql`${articles.publishedAt} < ${monthAgo}`,
          eq(articles.status, "published"),
          or(isNull(articles.articleType), ne(articles.articleType, 'opinion'))
        ));

      // Calculate growth percentage
      const growthPercentage = prevMonthCount.count > 0
        ? ((monthCount.count - prevMonthCount.count) / prevMonthCount.count) * 100
        : 0;

      // Get most active category
      const topCategory = await db.select({
        categoryId: articles.categoryId,
        count: sql<number>`count(*)::int`,
        name: categories.nameAr,
        icon: categories.icon,
        color: categories.color,
      })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(
          gte(articles.publishedAt, monthAgo),
          eq(articles.status, "published"),
          or(isNull(articles.articleType), ne(articles.articleType, 'opinion'))
        ))
        .groupBy(articles.categoryId, categories.nameAr, categories.icon, categories.color)
        .orderBy(sql`count(*) DESC`)
        .limit(1);

      // Get most active reporter (prefer reporter over system author)
      let topAuthor = await db.select({
        userId: articles.reporterId,
        count: sql<number>`count(*)::int`,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
        .from(articles)
        .innerJoin(users, eq(articles.reporterId, users.id))
        .where(and(
          gte(articles.publishedAt, monthAgo),
          eq(articles.status, "published"),
          or(isNull(articles.articleType), ne(articles.articleType, 'opinion')),
          isNotNull(articles.reporterId)
        ))
        .groupBy(articles.reporterId, users.firstName, users.lastName, users.profileImageUrl)
        .orderBy(sql`count(*) DESC`)
        .limit(1);

      // Fallback to authorId if no reporter found
      if (!topAuthor || topAuthor.length === 0) {
        topAuthor = await db.select({
          userId: articles.authorId,
          count: sql<number>`count(*)::int`,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
          .from(articles)
          .innerJoin(users, eq(articles.authorId, users.id))
          .where(and(
            gte(articles.publishedAt, monthAgo),
            eq(articles.status, "published"),
            or(isNull(articles.articleType), ne(articles.articleType, 'opinion')),
            isNotNull(articles.authorId)
          ))
          .groupBy(articles.authorId, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(sql`count(*) DESC`)
          .limit(1);
      }

      // Get total views
      const [totalViewsResult] = await db.select({
        total: sql<number>`COALESCE(SUM(${articles.views}), 0)::int`
      })
        .from(articles)
        .where(and(
          eq(articles.status, "published"),
          or(isNull(articles.articleType), ne(articles.articleType, 'opinion'))
        ));

      // Get total interactions (reactions + bookmarks + comments)
      const [totalReactions] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(reactions);

      const [totalBookmarks] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(bookmarks);

      const [totalComments] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(comments);

      const totalInteractions = (totalReactions?.count || 0) + 
                                (totalBookmarks?.count || 0) + 
                                (totalComments?.count || 0);

      // Generate simple AI insights (can be enhanced with real AI later)
      const insights = {
        dailySummary: "منصة سبق الذكية تواصل تقديم أحدث الأخبار والتحليلات لقرائها",
        topTopics: [],
        activityTrend: growthPercentage > 5 ? "نمو ملحوظ في النشاط" : growthPercentage < -5 ? "انخفاض في النشاط" : "نشاط مستقر",
        keyHighlights: [
          `تم نشر ${todayCount.count} خبراً اليوم`,
          topCategory[0] ? `تصنيف ${topCategory[0].name} الأكثر نشاطاً` : "تنوع في التصنيفات",
          `إجمالي ${totalInteractions.toLocaleString('en-US')} تفاعل`
        ]
      };

      res.json({
        period: {
          today: todayCount.count || 0,
          week: weekCount.count || 0,
          month: monthCount.count || 0,
        },
        growth: {
          percentage: Math.round(growthPercentage * 10) / 10,
          trend: growthPercentage > 0 ? 'up' : growthPercentage < 0 ? 'down' : 'stable',
          previousMonth: prevMonthCount.count || 0,
        },
        topCategory: topCategory[0] ? {
          name: topCategory[0].name,
          icon: topCategory[0].icon,
          color: topCategory[0].color,
          count: topCategory[0].count,
        } : null,
        topAuthor: topAuthor[0] ? {
          name: `${topAuthor[0].firstName || ''} ${topAuthor[0].lastName || ''}`.trim(),
          profileImageUrl: topAuthor[0].profileImageUrl,
          count: topAuthor[0].count,
        } : null,
        totalViews: totalViewsResult.total || 0,
        totalInteractions,
        aiInsights: insights,
      });
    } catch (error) {
      console.error("Error fetching news analytics:", error);
      res.status(500).json({ message: "Failed to fetch news analytics" });
    }
  });

  // News Statistics Endpoint - Statistics cards data
  app.get("/api/news/stats", async (req, res) => {
    try {
      const stats = await storage.getNewsStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching news stats:", error);
      res.status(500).json({ message: "Failed to fetch news statistics" });
    }
  });

  app.get("/api/articles/featured", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const article = await storage.getFeaturedArticle(userId);
      res.json(article || null);
    } catch (error) {
      console.error("Error fetching featured article:", error);
      res.status(500).json({ message: "Failed to fetch featured article" });
    }
  });

  app.get("/api/articles/:slug", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      if (userId) {
        await storage.recordArticleRead(userId, article.id);
      }

      await storage.incrementArticleViews(article.id);

      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.get("/api/articles/:slug/comments", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // For admins and editors, show all comments (including pending)
      // For regular users, show only approved comments
      const showPending = userRole === 'admin' || userRole === 'editor';
      const comments = await storage.getCommentsByArticle(article.id, showPending);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.get("/api/articles/:slug/related", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const related = await storage.getRelatedArticles(article.id, article.categoryId || undefined);
      res.json(related);
    } catch (error) {
      console.error("Error fetching related articles:", error);
      res.status(500).json({ message: "Failed to fetch related articles" });
    }
  });

  // Get AI-powered smart recommendations for an article
  app.get("/api/articles/:slug/ai-recommendations", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Get personalized recommendations using similarity engine
      const similarArticles = await findSimilarArticles(article.id, 5, []);
      
      // Get personalized recommendations if user is logged in
      let personalizedRecommendations: any[] = [];
      if (userId) {
        try {
          personalizedRecommendations = await getPersonalizedRecommendations(userId, 3, [article.id]);
        } catch (error) {
          console.error("Error getting personalized recommendations:", error);
        }
      }

      // Combine and deduplicate
      const combinedRecommendations = [
        ...personalizedRecommendations,
        ...similarArticles.filter((sa: any) => 
          !personalizedRecommendations.find((pr: any) => pr.articleId === sa.articleId)
        )
      ].slice(0, 5);

      // Get full article details for each recommendation
      const articleIds = combinedRecommendations.map((r: any) => r.articleId);
      const fullArticles = await storage.getArticles({ 
        status: "published",
      });
      
      const recommendedArticles = fullArticles.filter((a: any) => articleIds.includes(a.id));

      // Enhance with AI reasoning
      const enhancedRecommendations = recommendedArticles.map((rec: any, index: number) => {
        let reason = "";
        let icon = "Newspaper";
        
        // Determine reason based on recommendation source
        if (personalizedRecommendations.find((pr: any) => pr.articleId === rec.id)) {
          reason = "مختار خصيصًا لك بناءً على اهتماماتك";
          icon = "Brain";
        } else if (rec.categoryId === article.categoryId) {
          reason = "مشابه في التصنيف والموضوع";
          icon = "Sparkles";
        } else {
          reason = "قد يثير اهتمامك أيضًا";
          icon = "Compass";
        }

        return {
          ...rec,
          aiMetadata: {
            reason,
            icon,
            aiLabel: "اقتراح من الذكاء الاصطناعي",
            relevanceScore: Math.max(70, 100 - (index * 10)),
          }
        };
      });

      res.json(enhancedRecommendations);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      res.status(500).json({ message: "Failed to fetch AI recommendations" });
    }
  });

  // Get smart summary audio for an article
  app.get("/api/articles/:slug/summary-audio", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);
      
      if (!article) {
        return res.status(404).json({ message: "المقال غير موجود" });
      }

      // Use aiSummary or excerpt (in priority order)
      const textToConvert = article.aiSummary || article.excerpt;
      
      if (!textToConvert) {
        return res.status(400).json({ message: "الموجز غير متوفر لهذا المقال" });
      }

      // Import ElevenLabs service
      const { getElevenLabsService } = await import("./services/elevenlabs");
      const elevenLabsService = getElevenLabsService();

      // Generate audio using ElevenLabs with timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('ElevenLabs timeout')), 30000) // 30 second timeout
      );

      const audioBuffer = await Promise.race([
        elevenLabsService.textToSpeech({
          text: textToConvert,
          voiceSettings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        }),
        timeoutPromise
      ]);

      // Set response headers for audio with cache busting support
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", audioBuffer.length.toString());
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      res.setHeader("ETag", `"${article.id}-${article.updatedAt}"`); // Add ETag for cache validation
      res.send(audioBuffer);
    } catch (error) {
      console.error("Error generating summary audio:", error);
      const errorMessage = error instanceof Error && error.message === 'ElevenLabs timeout' 
        ? "انتهت مهلة توليد الموجز الصوتي" 
        : "فشل في توليد الموجز الصوتي";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get AI-powered analytics/insights for an article
  app.get("/api/articles/:slug/ai-insights", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);
      
      if (!article) {
        return res.status(404).json({ message: "المقال غير موجود" });
      }

      // Get reading history stats
      const readingStats = await db
        .select({
          avgDuration: sql<number>`AVG(${readingHistory.readDuration})`,
          totalReads: sql<number>`COUNT(*)`,
        })
        .from(readingHistory)
        .where(eq(readingHistory.articleId, article.id));

      // Get reactions count
      const reactionsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(reactions)
        .where(eq(reactions.articleId, article.id));

      // Get comments count
      const commentsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(comments)
        .where(and(
          eq(comments.articleId, article.id),
          eq(comments.status, "approved")
        ));

      const avgReadTime = readingStats[0]?.avgDuration || 0;
      const totalReads = Number(readingStats[0]?.totalReads || 0);
      const totalReactions = Number(reactionsCount[0]?.count || 0);
      const totalComments = Number(commentsCount[0]?.count || 0);
      const totalViews = article.views || 0;

      // Calculate engagement rate: (reactions + comments) / views
      const engagementRate = totalViews > 0 
        ? ((totalReactions + totalComments) / totalViews) 
        : 0;

      // Estimate reading completion based on avg read time
      // Assuming 200 words per minute reading speed
      const estimatedReadTime = article.content 
        ? Math.ceil(article.content.split(/\s+/).length / 200) * 60 
        : 180; // default 3 min
      
      const completionRate = avgReadTime > 0 && estimatedReadTime > 0
        ? Math.min(100, (avgReadTime / estimatedReadTime) * 100)
        : 0;

      res.json({
        avgReadTime: Math.round(avgReadTime), // in seconds
        totalReads,
        totalReactions,
        totalComments,
        totalViews,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        completionRate: Math.round(completionRate), // percentage
        totalInteractions: totalReactions + totalComments,
      });
    } catch (error) {
      console.error("Error fetching article AI insights:", error);
      res.status(500).json({ message: "فشل في جلب إحصائيات المقال" });
    }
  });

  // Get articles by keyword
  app.get("/api/keyword/:keyword", async (req, res) => {
    try {
      const keyword = decodeURIComponent(req.params.keyword);
      const allArticles = await storage.getArticles({ status: "published" });
      
      // Filter articles that contain the keyword in their SEO keywords
      const filteredArticles = allArticles.filter(article => 
        article.seo?.keywords?.some(k => k.toLowerCase() === keyword.toLowerCase())
      );

      res.json(filteredArticles);
    } catch (error) {
      console.error("Error fetching articles by keyword:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.post("/api/articles/:id/react", isAuthenticated, checkUserStatus(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await storage.toggleReaction(req.params.id, userId);

      // إضافة نقطة ولاء عند الإعجاب (ليس عند الإلغاء)
      if (result.hasReacted) {
        try {
          await storage.recordLoyaltyPoints({
            userId,
            action: "LIKE",
            points: 1,
            source: req.params.id,
            metadata: { articleId: req.params.id }
          });
        } catch (error) {
          console.error("Error recording loyalty points:", error);
          // Don't fail the request if loyalty fails
        }

        // Track user event for daily summary analytics
        try {
          await trackUserEvent({
            userId,
            articleId: req.params.id,
            eventType: 'like',
          });
        } catch (error) {
          console.error("Error tracking like event:", error);
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  app.post("/api/articles/:id/bookmark", isAuthenticated, checkUserStatus(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await storage.toggleBookmark(req.params.id, userId);

      // Track user event for daily summary analytics (when bookmarking, not unbookmarking)
      if (result.isBookmarked) {
        try {
          await trackUserEvent({
            userId,
            articleId: req.params.id,
            eventType: 'bookmark',
          });
        } catch (error) {
          console.error("Error tracking bookmark event:", error);
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  app.post("/api/articles/:id/analyze-credibility", isAuthenticated, async (req: any, res) => {
    try {
      const articleId = req.params.id;
      
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "المقال غير موجود" });
      }

      const analysisResult = await analyzeCredibility(article.content, article.title);

      await db
        .update(articles)
        .set({
          credibilityScore: analysisResult.score,
          credibilityAnalysis: JSON.stringify(analysisResult),
          credibilityLastUpdated: new Date(),
        })
        .where(eq(articles.id, articleId));

      res.json(analysisResult);
    } catch (error) {
      console.error("Error analyzing credibility:", error);
      res.status(500).json({ message: "فشل تحليل المصداقية" });
    }
  });

  // SEO AI Assistant Endpoint
  app.post("/api/articles/:id/analyze-seo", isAuthenticated, requireAnyPermission('articles.create', 'articles.edit_any', 'articles.edit_own'), async (req: any, res) => {
    try {
      const articleId = req.params.id;
      
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "المقال غير موجود" });
      }

      const seoAnalysis = await analyzeSEO(
        article.title,
        article.content,
        article.excerpt || undefined
      );

      // Update article with SEO suggestions if provided
      if (req.body.applyChanges) {
        const seoData = article.seo || {};
        
        await db
          .update(articles)
          .set({
            seo: {
              ...seoData,
              metaTitle: seoAnalysis.seoTitle,
              metaDescription: seoAnalysis.metaDescription,
              keywords: seoAnalysis.keywords,
            } as any,
          })
          .where(eq(articles.id, articleId));
      }

      res.json(seoAnalysis);
    } catch (error) {
      console.error("Error analyzing SEO:", error);
      res.status(500).json({ message: "فشل تحليل SEO" });
    }
  });

  // Smart Content Generation Endpoint
  app.post("/api/articles/generate-content", isAuthenticated, requireAnyPermission('articles.create', 'articles.edit_any', 'articles.edit_own'), async (req: any, res) => {
    try {
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "يجب توفير محتوى الخبر" });
      }

      console.log("[Smart Content API] Generating content for news...");
      
      const generatedContent = await generateSmartContent(content);

      console.log("[Smart Content API] Content generated successfully");
      
      res.json(generatedContent);
    } catch (error) {
      console.error("[Smart Content API] Error generating content:", error);
      res.status(500).json({ message: "فشل توليد المحتوى الذكي" });
    }
  });

  app.post("/api/articles/:slug/comments", isAuthenticated, checkUserStatus(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const parsed = insertCommentSchema.safeParse({
        ...req.body,
        articleId: article.id,
        userId,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid comment data" });
      }

      const comment = await storage.createComment(parsed.data);

      // إضافة نقطة ولاء للتعليق
      try {
        await storage.recordLoyaltyPoints({
          userId,
          action: "COMMENT",
          points: 1,
          source: article.id,
          metadata: { articleId: article.id, commentId: comment.id }
        });
      } catch (error) {
        console.error("Error recording loyalty points:", error);
      }

      // Track user event for daily summary analytics
      try {
        await trackUserEvent({
          userId,
          articleId: article.id,
          eventType: 'comment',
        });
      } catch (error) {
        console.error("Error tracking comment event:", error);
      }

      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // ============================================================
  // DASHBOARD ROUTES (Editors & Admins)
  // ============================================================

  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin dashboard comprehensive stats (Arabic)
  app.get("/api/admin/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      // Require admin or editor role
      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard stats" });
    }
  });

  // Admin dashboard comprehensive stats (English)
  app.get("/api/en/admin/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      // Require admin or editor role
      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const stats = await storage.getEnglishAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching English admin dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch English admin dashboard stats" });
    }
  });

  // ============================================================
  // ENGLISH DASHBOARD ARTICLES ROUTES
  // ============================================================

  // Get English articles metrics
  app.get("/api/en/dashboard/articles/metrics", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(enArticles);
      const [publishedResult] = await db.select({ count: sql<number>`count(*)::int` }).from(enArticles).where(eq(enArticles.status, "published"));
      const [draftResult] = await db.select({ count: sql<number>`count(*)::int` }).from(enArticles).where(eq(enArticles.status, "draft"));
      const [archivedResult] = await db.select({ count: sql<number>`count(*)::int` }).from(enArticles).where(eq(enArticles.status, "archived"));

      res.json({
        total: totalResult.count || 0,
        published: publishedResult.count || 0,
        draft: draftResult.count || 0,
        archived: archivedResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching English articles metrics:", error);
      res.status(500).json({ message: "Failed to fetch English articles metrics" });
    }
  });

  // Get all English articles with filtering (dashboard)
  app.get("/api/en/dashboard/articles", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const { search, status, articleType, categoryId, authorId, featured } = req.query;

      const reporterAlias = aliasedTable(users, 'reporter');

      let query = db
        .select({
          article: enArticles,
          category: enCategories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            firstNameEn: users.firstNameEn,
            lastNameEn: users.lastNameEn,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
          },
          reporter: {
            id: reporterAlias.id,
            firstName: reporterAlias.firstName,
            lastName: reporterAlias.lastName,
            firstNameEn: reporterAlias.firstNameEn,
            lastNameEn: reporterAlias.lastNameEn,
            email: reporterAlias.email,
            profileImageUrl: reporterAlias.profileImageUrl,
          },
        })
        .from(enArticles)
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .leftJoin(users, eq(enArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
        .$dynamic();

      if (search) {
        query = query.where(
          or(
            ilike(enArticles.title, `%${search}%`),
            ilike(enArticles.content, `%${search}%`),
            ilike(enArticles.excerpt, `%${search}%`)
          )
        );
      }

      if (status && status !== "all") {
        query = query.where(eq(enArticles.status, status));
      }

      if (articleType && articleType !== "all") {
        query = query.where(eq(enArticles.articleType, articleType));
      }

      if (categoryId) {
        query = query.where(eq(enArticles.categoryId, categoryId));
      }

      if (authorId) {
        query = query.where(eq(enArticles.authorId, authorId));
      }

      if (featured !== undefined) {
        query = query.where(eq(enArticles.isFeatured, featured === "true"));
      }

      query = query.orderBy(desc(enArticles.createdAt));

      const results = await query;

      const formattedArticles = results.map((row) => ({
        ...row.article,
        category: row.category,
        author: row.reporter || row.author,
      }));

      res.json(formattedArticles);
    } catch (error) {
      console.error("Error fetching English articles:", error);
      res.status(500).json({ message: "Failed to fetch English articles" });
    }
  });

  // Get single English article by ID (for editing)
  app.get("/api/en/dashboard/articles/:id", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const article = await storage.getEnArticleById(articleId, userId);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check permissions
      const userPermissions = await getUserPermissions(userId);
      const canViewAny = userPermissions.includes("articles.view");
      const canEditOwn = userPermissions.includes("articles.edit_own");
      const canEditAny = userPermissions.includes("articles.edit_any");

      const isOwner = article.authorId === userId;

      if (!canViewAny && !canEditAny && (!canEditOwn || !isOwner)) {
        return res.status(403).json({ message: "You don't have permission to view this article" });
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching English article:", error);
      res.status(500).json({ message: "Failed to fetch English article" });
    }
  });

  // Create new English article
  app.post("/api/en/dashboard/articles", requireAuth, requirePermission("articles.create"), async (req: any, res) => {
    try {
      let authorId = req.user?.id;
      if (!authorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.publishedAt && typeof requestData.publishedAt === 'string') {
        requestData.publishedAt = new Date(requestData.publishedAt);
      }
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }

      const parsed = insertEnArticleSchema.safeParse(requestData);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid article data",
          errors: parsed.error.flatten(),
        });
      }

      // Validate reporterId if provided
      if (parsed.data.reporterId) {
        const [reporter] = await db
          .select()
          .from(users)
          .where(eq(users.id, parsed.data.reporterId))
          .limit(1);
        
        if (!reporter) {
          return res.status(422).json({ message: "Reporter not found" });
        }
      }

      // If status is published, set publishedAt
      const articleData = {
        ...parsed.data,
        authorId,
      };

      const [newArticle] = await db
        .insert(enArticles)
        .values([{
          ...articleData,
          publishedAt: articleData.status === 'published' ? new Date() : undefined,
        } as any])
        .returning();

      // Log activity
      await logActivity({
        userId: authorId,
        action: "created",
        entityType: "en_article",
        entityId: newArticle.id,
        newValue: newArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating English article:", error);
      res.status(500).json({ message: "Failed to create English article" });
    }
  });

  // Update English article
  app.patch("/api/en/dashboard/articles/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      // Check if article exists
      const [existingArticle] = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.id, articleId))
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check permissions
      const userPermissions = await getUserPermissions(userId);
      const canEditOwn = userPermissions.includes("articles.edit_own");
      const canEditAny = userPermissions.includes("articles.edit_any");

      if (!canEditAny && (!canEditOwn || existingArticle.authorId !== userId)) {
        return res.status(403).json({ message: "You don't have permission to edit this article" });
      }

      const parsed = insertEnArticleSchema.partial().safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: parsed.error.flatten(),
        });
      }

      // Validate reporterId if provided
      if (parsed.data.reporterId) {
        const [reporter] = await db
          .select()
          .from(users)
          .where(eq(users.id, parsed.data.reporterId))
          .limit(1);
        
        if (!reporter) {
          return res.status(422).json({ message: "Reporter not found" });
        }
      }

      // If status is being changed to published, check publish permission
      if (parsed.data.status === "published" && existingArticle.status !== "published") {
        const canPublish = userPermissions.includes("articles.publish");
        if (!canPublish) {
          return res.status(403).json({ message: "You don't have permission to publish articles" });
        }
      }

      // Convert timestamp fields
      const updateData: any = { ...parsed.data };
      const timestampFields = ['publishedAt', 'scheduledAt'];
      timestampFields.forEach(field => {
        if (updateData[field] && typeof updateData[field] === 'string') {
          updateData[field] = new Date(updateData[field]);
        }
      });

      // Handle republish feature
      if (req.body.republish === true) {
        updateData.publishedAt = new Date();
      } else if (parsed.data.status === "published" && existingArticle.status !== "published" && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }

      // Convert empty categoryId to null
      if (updateData.categoryId === "") {
        updateData.categoryId = null;
      }

      const [updatedArticle] = await db
        .update(enArticles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(enArticles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "updated",
        entityType: "en_article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating English article:", error);
      res.status(500).json({ message: "Failed to update English article" });
    }
  });

  // Delete (archive) English article
  app.delete("/api/en/dashboard/articles/:id", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [article] = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Soft delete by setting status to archived
      const [updatedArticle] = await db
        .update(enArticles)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(enArticles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "archived",
        entityType: "en_article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "English article archived successfully" });
    } catch (error) {
      console.error("Error archiving English article:", error);
      res.status(500).json({ message: "Failed to archive English article" });
    }
  });

  // Toggle English article breaking news status
  app.patch("/api/en/dashboard/articles/:id/toggle-breaking", requireAuth, requirePermission("articles.publish"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      
      const [article] = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const newNewsType = article.newsType === 'breaking' ? 'standard' : 'breaking';

      const [updatedArticle] = await db
        .update(enArticles)
        .set({
          newsType: newNewsType,
          updatedAt: new Date(),
        })
        .where(eq(enArticles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "toggle_breaking",
        entityType: "en_article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error toggling English breaking news:", error);
      res.status(500).json({ message: "Failed to toggle English breaking news" });
    }
  });

  // Toggle English article featured status (PATCH - toggle)
  app.patch("/api/en/dashboard/articles/:id/toggle-featured", requireAuth, requirePermission("articles.publish"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      
      const [article] = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const [updatedArticle] = await db
        .update(enArticles)
        .set({
          isFeatured: !article.isFeatured,
          updatedAt: new Date(),
        })
        .where(eq(enArticles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "toggle_featured",
        entityType: "en_article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error toggling English featured status:", error);
      res.status(500).json({ message: "Failed to toggle English featured status" });
    }
  });

  // Feature/unfeature English article (POST - set specific value)
  app.post("/api/en/dashboard/articles/:id/feature", requireAuth, requirePermission("articles.publish"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const { featured } = req.body;

      const [article] = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const [updatedArticle] = await db
        .update(enArticles)
        .set({
          isFeatured: featured,
          updatedAt: new Date(),
        })
        .where(eq(enArticles.id, articleId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: featured ? "featured" : "unfeatured",
        entityType: "en_article",
        entityId: articleId,
        oldValue: article,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating English featured status:", error);
      res.status(500).json({ message: "Failed to update English featured status" });
    }
  });

  // Reorder English articles
  app.post("/api/en/dashboard/articles/reorder", requireAuth, requirePermission("articles.edit_any"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { articleOrders } = req.body;

      if (!Array.isArray(articleOrders) || articleOrders.length === 0) {
        return res.status(400).json({ message: "Article orders are required" });
      }

      // Update each article's displayOrder
      const updates = articleOrders.map(async ({ id, displayOrder }: any) => {
        return await db
          .update(enArticles)
          .set({ displayOrder, updatedAt: new Date() })
          .where(eq(enArticles.id, id));
      });

      await Promise.all(updates);

      // Log activity
      await logActivity({
        userId,
        action: "reordered",
        entityType: "en_article",
        entityId: "bulk",
        newValue: { count: articleOrders.length },
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Successfully reordered English articles" });
    } catch (error) {
      console.error("Error reordering English articles:", error);
      res.status(500).json({ message: "Failed to reorder English articles" });
    }
  });

  // Bulk delete (archive) English articles
  app.post("/api/en/dashboard/articles/bulk-delete", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { articleIds } = req.body;

      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({ message: "Article IDs are required" });
      }

      // Archive articles by setting status to archived
      await db
        .update(enArticles)
        .set({ status: "archived", updatedAt: new Date() })
        .where(inArray(enArticles.id, articleIds));

      // Log activity
      await logActivity({
        userId,
        action: "bulk_archived",
        entityType: "en_article",
        entityId: articleIds.join(","),
        newValue: { count: articleIds.length, articleIds },
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: `Successfully archived ${articleIds.length} English articles` });
    } catch (error) {
      console.error("Error bulk archiving English articles:", error);
      res.status(500).json({ message: "Failed to bulk archive English articles" });
    }
  });

  // ============================================================
  // ENGLISH CATEGORIES ROUTES
  // ============================================================

  // Get all English categories (public)
  app.get("/api/en/categories", async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.status, "active"))
        .orderBy(asc(enCategories.displayOrder));

      res.json(categories);
    } catch (error) {
      console.error("Error fetching English categories:", error);
      res.status(500).json({ message: "Failed to fetch English categories" });
    }
  });

  // Get all English categories (dashboard)
  app.get("/api/en/dashboard/categories", requireAuth, requirePermission("categories.view"), async (req: any, res) => {
    try {
      const categories = await db
        .select()
        .from(enCategories)
        .orderBy(asc(enCategories.displayOrder));

      res.json(categories);
    } catch (error) {
      console.error("Error fetching English categories:", error);
      res.status(500).json({ message: "Failed to fetch English categories" });
    }
  });

  // Get single English category by ID (for editing)
  app.get("/api/en/dashboard/categories/:id", requireAuth, requirePermission("categories.view"), async (req: any, res) => {
    try {
      const categoryId = req.params.id;

      const [category] = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.id, categoryId))
        .limit(1);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Error fetching English category:", error);
      res.status(500).json({ message: "Failed to fetch English category" });
    }
  });

  // Create new English category
  app.post("/api/en/dashboard/categories", requireAuth, requirePermission("categories.create"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = insertEnCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid data",
          errors: parsed.error.errors 
        });
      }

      // Check if slug already exists
      const [existingCategory] = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.slug, parsed.data.slug))
        .limit(1);

      if (existingCategory) {
        return res.status(409).json({ message: "Category slug already exists" });
      }

      const [category] = await db
        .insert(enCategories)
        .values(parsed.data)
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "created",
        entityType: "en_category",
        entityId: category.id,
        newValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(category);
    } catch (error) {
      console.error("Error creating English category:", error);
      res.status(500).json({ message: "Failed to create English category" });
    }
  });

  // Update English category
  app.patch("/api/en/dashboard/categories/:id", requireAuth, requirePermission("categories.update"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const categoryId = req.params.id;

      const [oldCategory] = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.id, categoryId))
        .limit(1);

      if (!oldCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const parsed = insertEnCategorySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid data",
          errors: parsed.error.errors 
        });
      }

      // Check if slug already exists (excluding current category)
      if (parsed.data.slug && parsed.data.slug !== oldCategory.slug) {
        const [existingCategory] = await db
          .select()
          .from(enCategories)
          .where(eq(enCategories.slug, parsed.data.slug))
          .limit(1);

        if (existingCategory && existingCategory.id !== categoryId) {
          return res.status(409).json({ message: "Category slug already exists" });
        }
      }

      const [category] = await db
        .update(enCategories)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(enCategories.id, categoryId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "updated",
        entityType: "en_category",
        entityId: categoryId,
        oldValue: oldCategory,
        newValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(category);
    } catch (error) {
      console.error("Error updating English category:", error);
      res.status(500).json({ message: "Failed to update English category" });
    }
  });

  // Delete English category
  app.delete("/api/en/dashboard/categories/:id", requireAuth, requirePermission("categories.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const categoryId = req.params.id;

      const [category] = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.id, categoryId))
        .limit(1);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check if category has articles
      const [articleCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enArticles)
        .where(eq(enArticles.categoryId, categoryId));

      if (articleCount.count > 0) {
        return res.status(400).json({ 
          message: `Cannot delete category with ${articleCount.count} articles. Please reassign or delete the articles first.` 
        });
      }

      await db.delete(enCategories).where(eq(enCategories.id, categoryId));

      // Log activity
      await logActivity({
        userId,
        action: "deleted",
        entityType: "en_category",
        entityId: categoryId,
        oldValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "English category deleted successfully" });
    } catch (error) {
      console.error("Error deleting English category:", error);
      res.status(500).json({ message: "Failed to delete English category" });
    }
  });

  // Reorder English categories
  app.post("/api/en/dashboard/categories/reorder", requireAuth, requirePermission("categories.update"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { categoryIds } = req.body;
      
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "categoryIds must be an array" });
      }

      // Update each category's displayOrder
      const updates = categoryIds.map(async (id, index) => {
        return await db
          .update(enCategories)
          .set({ displayOrder: index, updatedAt: new Date() })
          .where(eq(enCategories.id, id));
      });

      await Promise.all(updates);

      // Log activity
      await logActivity({
        userId,
        action: "reordered",
        entityType: "en_category",
        entityId: "bulk",
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
          reason: `Reordered ${categoryIds.length} English categories`,
        },
      });

      res.json({ message: "English categories reordered successfully" });
    } catch (error) {
      console.error("Error reordering English categories:", error);
      res.status(500).json({ message: "Failed to reorder English categories" });
    }
  });

  // ============================================================
  // ENGLISH COMMENTS ROUTES
  // ============================================================

  // Get all English comments with filtering
  app.get("/api/en/dashboard/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status, articleId } = req.query;

      let query = db
        .select({
          comment: enComments,
          article: {
            id: enArticles.id,
            title: enArticles.title,
          },
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(enComments)
        .leftJoin(enArticles, eq(enComments.articleId, enArticles.id))
        .leftJoin(users, eq(enComments.userId, users.id))
        .$dynamic();

      if (status) {
        query = query.where(eq(enComments.status, status));
      }

      if (articleId) {
        query = query.where(eq(enComments.articleId, articleId));
      }

      query = query.orderBy(desc(enComments.createdAt));

      const results = await query;

      const formattedComments = results.map((row) => ({
        ...row.comment,
        article: row.article,
        user: row.user,
      }));

      res.json(formattedComments);
    } catch (error) {
      console.error("Error fetching English comments:", error);
      res.status(500).json({ message: "Failed to fetch English comments" });
    }
  });

  // Approve English comment
  app.patch("/api/en/dashboard/comments/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;

      const [comment] = await db
        .select()
        .from(enComments)
        .where(eq(enComments.id, commentId))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const [approved] = await db
        .update(enComments)
        .set({
          status: "approved",
          moderatedBy: userId,
          moderatedAt: new Date(),
        })
        .where(eq(enComments.id, commentId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "approved",
        entityType: "en_comment",
        entityId: commentId,
        oldValue: comment,
        newValue: approved,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "English comment approved", comment: approved });
    } catch (error) {
      console.error("Error approving English comment:", error);
      res.status(500).json({ message: "Failed to approve English comment" });
    }
  });

  // Reject English comment
  app.patch("/api/en/dashboard/comments/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;
      const { reason } = req.body;

      const [comment] = await db
        .select()
        .from(enComments)
        .where(eq(enComments.id, commentId))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const [rejected] = await db
        .update(enComments)
        .set({
          status: "rejected",
          moderatedBy: userId,
          moderatedAt: new Date(),
          moderationReason: reason || null,
        })
        .where(eq(enComments.id, commentId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "rejected",
        entityType: "en_comment",
        entityId: commentId,
        oldValue: comment,
        newValue: rejected,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
          reason,
        },
      });

      res.json({ message: "English comment rejected", comment: rejected });
    } catch (error) {
      console.error("Error rejecting English comment:", error);
      res.status(500).json({ message: "Failed to reject English comment" });
    }
  });

  // Restore English comment
  app.patch("/api/en/dashboard/comments/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;

      const [comment] = await db
        .select()
        .from(enComments)
        .where(eq(enComments.id, commentId))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const [restored] = await db
        .update(enComments)
        .set({
          status: "pending",
          moderatedBy: null,
          moderatedAt: null,
          moderationReason: null,
        })
        .where(eq(enComments.id, commentId))
        .returning();

      // Log activity
      await logActivity({
        userId,
        action: "restored",
        entityType: "en_comment",
        entityId: commentId,
        oldValue: comment,
        newValue: restored,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "English comment restored", comment: restored });
    } catch (error) {
      console.error("Error restoring English comment:", error);
      res.status(500).json({ message: "Failed to restore English comment" });
    }
  });

  // ============================================================
  // ARABIC DASHBOARD ARTICLES ROUTES (LEGACY)
  // ============================================================

  app.get("/api/dashboard/articles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const articles = await storage.getArticles({ authorId: userId });
      res.json(articles);
    } catch (error) {
      console.error("Error fetching user articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/dashboard/articles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const article = await storage.getArticleById(req.params.id, userId);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      if (article.authorId !== userId && user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/dashboard/articles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Convert date strings to Date objects before validation
      const requestData = { ...req.body, authorId: userId };
      if (requestData.publishedAt && typeof requestData.publishedAt === 'string') {
        requestData.publishedAt = new Date(requestData.publishedAt);
      }
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }

      const parsed = insertArticleSchema.safeParse(requestData);

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid article data", errors: parsed.error });
      }

      const article = await storage.createArticle(parsed.data);

      console.log(`🔍 [DASHBOARD CREATE] Article created with status: ${article.status}`);
      console.log(`🔍 [DASHBOARD CREATE] Article ID: ${article.id}, Title: ${article.title}`);
      
      // Return response immediately to user
      res.json(article);

      // Process async operations in background (non-blocking)
      if (article.status === "published") {
        console.log(`🔔 [DASHBOARD CREATE] Article is PUBLISHED - processing notifications in background...`);
        
        // Run async operations without blocking the response
        setImmediate(async () => {
          try {
            // Determine notification type based on newsType
            let notificationType: 'published' | 'breaking' | 'featured' = 'published';
            if (article.newsType === 'breaking') {
              notificationType = 'breaking';
            } else if (article.newsType === 'featured') {
              notificationType = 'featured';
            }

            console.log(`🔔 [DASHBOARD CREATE] Calling sendArticleNotification with type: ${notificationType}`);
            
            // Send smart notifications via notification service
            await sendArticleNotification(article, notificationType);

            console.log(`✅ [DASHBOARD CREATE] Notifications sent for new article: ${article.title}`);

            // Generate article embeddings for recommendation system
            try {
              await vectorizeArticle(article.id);
              console.log(`✅ [DASHBOARD CREATE] Article vectorized for recommendations: ${article.title}`);
            } catch (vectorizationError) {
              console.error("❌ [DASHBOARD CREATE] Error vectorizing article:", vectorizationError);
              // Don't fail the article creation if vectorization fails
            }

            // Auto-link article to story using AI
            try {
              const { matchAndLinkArticle } = await import("./storyMatcher");
              await matchAndLinkArticle(article.id);
              console.log(`✅ [DASHBOARD CREATE] Article auto-linked to story: ${article.title}`);
            } catch (storyMatchError) {
              console.error("❌ [DASHBOARD CREATE] Error linking article to story:", storyMatchError);
              // Don't fail the article creation if story matching fails
            }

            // Keep old system for backward compatibility
            await createNotification({
              type: article.newsType === "breaking" ? "BREAKING_NEWS" : "NEW_ARTICLE",
              data: {
                articleId: article.id,
                articleTitle: article.title,
                articleSlug: article.slug,
                categoryId: article.categoryId,
                newsType: article.newsType,
              },
            });
          } catch (notificationError) {
            console.error("❌ [DASHBOARD CREATE] Error creating notification:", notificationError);
            // Don't fail the article creation if notification fails
          }
        });
      } else {
        console.log(`⏸️ [DASHBOARD CREATE] Article is NOT published (status: ${article.status}) - skipping notifications`);
      }
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/dashboard/articles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const article = await storage.getArticleById(req.params.id);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      if (article.authorId !== userId && user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Prepare article data for update
      const articleData = { ...req.body };
      
      // Remove republish flag from data (it's only for control logic)
      const shouldRepublish = articleData.republish === true;
      delete articleData.republish;
      
      // Handle publishedAt timestamp logic
      if (shouldRepublish) {
        // Explicitly requested to update publish time
        articleData.publishedAt = new Date();
        console.log(`🔄 [DASHBOARD UPDATE] Republishing article with new timestamp`);
      } else {
        // Check if this is the first time publishing (transitioning to published status)
        const isFirstTimePublishing = articleData.status === "published" && article.status !== "published";
        
        if (isFirstTimePublishing && !article.publishedAt) {
          // First time publishing - set publishedAt
          articleData.publishedAt = new Date();
          console.log(`🆕 [DASHBOARD UPDATE] First time publishing - setting publishedAt`);
        } else {
          // Preserve original publishedAt (don't update it)
          // Remove it from update data to ensure it's not changed
          delete articleData.publishedAt;
          console.log(`✅ [DASHBOARD UPDATE] Preserving original publishedAt`);
        }
      }

      const updated = await storage.updateArticle(req.params.id, articleData);

      console.log(`🔍 [DASHBOARD UPDATE] Article updated - Old status: ${article.status}, New status: ${updated.status}`);
      console.log(`🔍 [DASHBOARD UPDATE] Article ID: ${updated.id}, Title: ${updated.title}`);
      
      // Return response immediately to user
      res.json(updated);

      // Process async operations in background (non-blocking)
      if (updated.status === "published" && article.status !== "published") {
        console.log(`🔔 [DASHBOARD UPDATE] Status changed to PUBLISHED - processing notifications in background...`);
        
        // Run async operations without blocking the response
        setImmediate(async () => {
          try {
            // Determine notification type based on article properties
            let notificationType: 'published' | 'breaking' | 'featured';
            
            if (updated.newsType === "breaking") {
              notificationType = 'breaking';
            } else if (updated.newsType === 'featured') {
              notificationType = 'featured';
            } else {
              notificationType = 'published';
            }

            console.log(`🔔 [DASHBOARD UPDATE] Calling sendArticleNotification with type: ${notificationType}`);

            // Send smart notifications via new service
            await sendArticleNotification(updated, notificationType);

            console.log(`✅ [DASHBOARD UPDATE] Notifications sent successfully`);

            // Generate article embeddings for recommendation system
            try {
              await vectorizeArticle(updated.id);
              console.log(`✅ [DASHBOARD UPDATE] Article vectorized for recommendations: ${updated.title}`);
            } catch (vectorizationError) {
              console.error("❌ [DASHBOARD UPDATE] Error vectorizing article:", vectorizationError);
              // Don't fail the update operation if vectorization fails
            }

            // Auto-link article to story using AI
            try {
              const { matchAndLinkArticle } = await import("./storyMatcher");
              await matchAndLinkArticle(updated.id);
              console.log(`✅ [DASHBOARD UPDATE] Article auto-linked to story: ${updated.title}`);
            } catch (storyMatchError) {
              console.error("❌ [DASHBOARD UPDATE] Error linking article to story:", storyMatchError);
              // Don't fail the update operation if story matching fails
            }
          } catch (notificationError) {
            console.error("❌ [DASHBOARD UPDATE] Error creating notification:", notificationError);
            // Don't fail the update operation if notification fails
          }
        });
      } else {
        console.log(`⏸️ [DASHBOARD UPDATE] No notification sent - Status unchanged or not published`);
      }
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/dashboard/articles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const article = await storage.getArticleById(req.params.id);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      if (article.authorId !== userId && user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteArticle(req.params.id);
      res.json({ message: "Article deleted" });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // ============================================================
  // COMMENT MODERATION ROUTES (Editors & Admins)
  // ============================================================

  app.get("/api/dashboard/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status, articleId } = req.query;
      const filters: { status?: string; articleId?: string } = {};
      
      if (status) {
        filters.status = status as string;
      }
      
      if (articleId) {
        filters.articleId = articleId as string;
      }

      const comments = await storage.getAllComments(filters);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Reporter Comments - عرض التعليقات على مقالات المراسل فقط
  app.get("/api/reporter/comments", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      // التحقق من أن المستخدم مراسل
      if (user.role !== 'reporter') {
        return res.status(403).json({ error: "هذا الـ endpoint خاص بالمراسلين فقط" });
      }
      
      // جلب مقالات المراسل
      const myArticles = await db
        .select({ id: articles.id })
        .from(articles)
        .where(eq(articles.authorId, user.id));
      
      const articleIds = myArticles.map(a => a.id);
      
      if (articleIds.length === 0) {
        return res.json([]);
      }
      
      // جلب التعليقات على مقالات المراسل
      const { status } = req.query;
      
      // Build where conditions
      const whereConditions = [inArray(comments.articleId, articleIds)];
      
      if (status) {
        whereConditions.push(eq(comments.status, status as string));
      }
      
      const myComments = await db
        .select()
        .from(comments)
        .where(and(...whereConditions))
        .orderBy(desc(comments.createdAt));
      
      res.json(myComments);
    } catch (error) {
      console.error("Error fetching reporter comments:", error);
      res.status(500).json({ message: "فشل في جلب التعليقات" });
    }
  });

  app.post("/api/dashboard/comments/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;
      const approved = await storage.approveComment(commentId, userId);
      res.json({ message: "Comment approved", comment: approved });
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(500).json({ message: "Failed to approve comment" });
    }
  });

  app.post("/api/dashboard/comments/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;
      const { reason } = req.body;
      const rejected = await storage.rejectComment(commentId, userId, reason);
      res.json({ message: "Comment rejected", comment: rejected });
    } catch (error) {
      console.error("Error rejecting comment:", error);
      res.status(500).json({ message: "Failed to reject comment" });
    }
  });

  app.post("/api/dashboard/comments/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;
      const restored = await storage.restoreComment(commentId);
      res.json({ message: "Comment restored", comment: restored });
    } catch (error) {
      console.error("Error restoring comment:", error);
      res.status(500).json({ message: "Failed to restore comment" });
    }
  });

  // ============================================================
  // AI ROUTES (Editors & Admins)
  // ============================================================

  app.post("/api/ai/summarize", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const summary = await summarizeArticle(content);
      res.json({ summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  app.post("/api/ai/generate-titles", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { content, language = "ar" } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      if (!["ar", "en", "ur"].includes(language)) {
        return res.status(400).json({ message: "Invalid language parameter" });
      }

      const titles = await generateTitle(content, language as "ar" | "en" | "ur");
      res.json({ titles });
    } catch (error) {
      console.error("Error generating titles:", error);
      res.status(500).json({ message: "Failed to generate titles" });
    }
  });

  // Smart Headline Comparison - Multi-Model AI
  app.post("/api/ai/compare-headlines", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { content, currentTitle } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Dynamic import to avoid circular dependencies
      const { aiManager, AI_MODELS } = await import("./ai-manager");

      // Build prompt
      const prompt = `أنت محرر خبير في كتابة العناوين الصحفية الجذابة باللغة العربية.

المحتوى:
${content.substring(0, 500)}...

${currentTitle ? `العنوان الحالي: ${currentTitle}\n\n` : ''}
المطلوب: اقترح عنوانًا واحدًا جذابًا وواضحًا يلخص المحتوى (لا تكتب أي شيء آخر، فقط العنوان).`;

      // Generate titles from 3 different AI models in parallel
      const results = await aiManager.generateMultiple(prompt, [
        { ...AI_MODELS.GPT5, maxTokens: 512, temperature: 0.8 },
        { ...AI_MODELS.CLAUDE_SONNET, maxTokens: 512, temperature: 0.8 },
        { ...AI_MODELS.GEMINI_FLASH, maxTokens: 512, temperature: 0.8 },
      ]);

      // Clean up titles (remove quotes, extra whitespace)
      const suggestions = results.map((result) => ({
        provider: result.provider,
        model: result.model,
        title: result.content.replace(/^["']|["']$/g, '').trim(),
        error: result.error,
      }));

      res.json({ suggestions });
    } catch (error) {
      console.error("Error comparing headlines:", error);
      res.status(500).json({ message: "Failed to compare headlines" });
    }
  });

  // ============================================================
  // AI CONTENT TOOLS - Input Validation Schemas
  // ============================================================

  const summarizeSchema = z.object({
    text: z.string().min(10, "النص قصير جداً").max(50000, "النص طويل جداً"),
    language: z.enum(["ar", "en", "ur"]).default("ar"),
  });

  const socialPostSchema = z.object({
    articleTitle: z.string().min(5, "العنوان قصير جداً"),
    articleSummary: z.string().min(20, "الملخص قصير جداً"),
    platform: z.enum(["twitter", "facebook", "linkedin"]),
  });

  const imageSearchSchema = z.object({
    contentText: z.string().min(10, "النص قصير جداً"),
  });

  const translateSchema = z.object({
    text: z.string().min(1, "النص فارغ"),
    fromLang: z.string().min(2).max(5),
    toLang: z.string().min(2).max(5),
  });

  const factCheckSchema = z.object({
    claim: z.string().min(10, "المعلومة قصيرة جداً").max(5000, "المعلومة طويلة جداً"),
    context: z.string().max(3000).optional(),
  });

  const analyzeTrendsSchema = z.object({
    timeframe: z.enum(["day", "week", "month"]).default("week"),
    limit: z.number().min(10).max(200).default(50),
  });

  // ============================================================
  // AI CONTENT TOOLS - Endpoints with Validation
  // ============================================================

  // AI Content Tools - Text Summarizer
  app.post("/api/ai-tools/summarize", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = summarizeSchema.parse(req.body);
      const result = await summarizeText(validatedData.text, validatedData.language);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error summarizing text:", error);
      res.status(500).json({ 
        message: error.message || "فشل تلخيص النص. يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // AI Content Tools - Social Media Post Generator
  app.post("/api/ai-tools/social-post", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = socialPostSchema.parse(req.body);
      const result = await generateSocialPost(
        validatedData.articleTitle, 
        validatedData.articleSummary, 
        validatedData.platform
      );
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error generating social post:", error);
      res.status(500).json({ 
        message: error.message || "فشل إنشاء المنشور. يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // AI Content Tools - Smart Image Search
  app.post("/api/ai-tools/image-search", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = imageSearchSchema.parse(req.body);
      const result = await suggestImageQuery(validatedData.contentText);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error suggesting image query:", error);
      res.status(500).json({ 
        message: error.message || "فشل اقتراح كلمات البحث. يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // AI Content Tools - Instant Translator
  app.post("/api/ai-tools/translate", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = translateSchema.parse(req.body);
      const result = await translateContent(
        validatedData.text, 
        validatedData.fromLang, 
        validatedData.toLang
      );
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error translating content:", error);
      res.status(500).json({ 
        message: error.message || "فشلت الترجمة. يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // AI Content Tools - Fact Checker
  app.post("/api/ai-tools/fact-check", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = factCheckSchema.parse(req.body);
      const result = await checkFactAccuracy(
        validatedData.claim,
        validatedData.context
      );
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("❌ [AI Tools] Fact check failed:", error);
      res.status(500).json({ 
        message: error.message || "فشل التحقق من المعلومة. يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // AI Content Tools - Trends Analysis
  app.post("/api/ai-tools/analyze-trends", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = analyzeTrendsSchema.parse(req.body);
      const result = await analyzeTrends(
        validatedData.timeframe,
        validatedData.limit
      );
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("❌ [AI Tools] Trends analysis failed:", error);
      res.status(500).json({ 
        message: error.message || "فشل تحليل الاتجاهات. يرجى المحاولة مرة أخرى" 
      });
    }
  });

  // Text-to-Speech using ElevenLabs
  app.post("/api/ai/text-to-speech", async (req: any, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "ElevenLabs API key not configured" });
      }

      // Using Adam voice (pre-made multilingual voice ID)
      const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam - multilingual

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", audioBuffer.byteLength.toString());
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error("Error generating speech:", error);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  // AI Chat Assistant - Arabic (Enhanced with multilingual support)
  app.post("/api/ai/chat", async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "الرسالة مطلوبة" });
      }

      // Get last 10 published articles for context
      const recentArticles = await db
        .select({
          title: articles.title,
          summary: articles.aiSummary,
          categoryName: categories.nameAr,
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(eq(articles.status, "published"))
        .orderBy(desc(articles.publishedAt))
        .limit(10);

      const articlesForContext = recentArticles.map(article => ({
        title: article.title,
        summary: article.summary || undefined,
        categoryName: article.categoryName || undefined,
      }));

      const result = await chatWithAssistantFallback(message, 'ar', {
        recentArticles: articlesForContext,
      });
      
      res.json({ response: result.content, model: result.modelUsed });
    } catch (error) {
      console.error("Error in AI chat (Arabic):", error);
      res.status(500).json({ message: "فشل في معالجة الرسالة" });
    }
  });

  // AI Chat Assistant - English
  app.post("/api/en/chat", async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get last 10 published English articles for context
      const recentArticles = await db
        .select({
          title: enArticles.title,
          summary: enArticles.aiSummary,
          categoryName: enCategories.name,
        })
        .from(enArticles)
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .where(eq(enArticles.status, "published"))
        .orderBy(desc(enArticles.publishedAt))
        .limit(10);

      const articlesForContext = recentArticles.map(article => ({
        title: article.title,
        summary: article.summary || undefined,
        categoryName: article.categoryName || undefined,
      }));

      const result = await chatWithAssistantFallback(message, 'en', {
        recentArticles: articlesForContext,
      });
      
      res.json({ response: result.content, model: result.modelUsed });
    } catch (error) {
      console.error("Error in AI chat (English):", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // AI Chat Assistant - Urdu
  app.post("/api/ur/chat", async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "پیغام ضروری ہے" });
      }

      // Get last 10 published Urdu articles for context
      const recentArticles = await db
        .select({
          title: urArticles.title,
          summary: urArticles.aiSummary,
          categoryName: urCategories.name,
        })
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .where(eq(urArticles.status, "published"))
        .orderBy(desc(urArticles.publishedAt))
        .limit(10);

      const articlesForContext = recentArticles.map(article => ({
        title: article.title,
        summary: article.summary || undefined,
        categoryName: article.categoryName || undefined,
      }));

      const result = await chatWithAssistantFallback(message, 'ur', {
        recentArticles: articlesForContext,
      });
      
      res.json({ response: result.content, model: result.modelUsed });
    } catch (error) {
      console.error("Error in AI chat (Urdu):", error);
      res.status(500).json({ message: "پیغام پر کارروائی ناکام" });
    }
  });

  // ============================================================
  // USER MANAGEMENT ROUTES (Admin Dashboard)
  // ============================================================

  // 1. GET /api/dashboard/users - Get users with pagination and filters
  app.get("/api/dashboard/users", requireAuth, requirePermission('users.view'), async (req: any, res) => {
    try {
      console.log("📋 [USERS] Fetching users with filters:", req.query);
      
      const params = {
        page: req.query.page ? parseInt(req.query.page) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        status: req.query.status,
        role: req.query.role,
        verificationBadge: req.query.verificationBadge,
        emailVerified: req.query.emailVerified === 'true' ? true : req.query.emailVerified === 'false' ? false : undefined,
        searchQuery: req.query.searchQuery,
        activityDays: req.query.activityDays ? parseInt(req.query.activityDays) : undefined,
      };

      const result = await storage.getUsersWithStats(params);
      console.log("✅ [USERS] Fetched users successfully:", result.total);
      res.json(result);
    } catch (error) {
      console.error("❌ [USERS] Error fetching users:", error);
      res.status(500).json({ message: "فشل في جلب المستخدمين" });
    }
  });

  // 2. GET /api/dashboard/users/kpis - Get user KPIs
  app.get("/api/dashboard/users/kpis", requireAuth, requirePermission('users.view'), async (req: any, res) => {
    try {
      console.log("📊 [USERS KPIs] Fetching user KPIs");
      const kpis = await storage.getUserKPIs();
      console.log("✅ [USERS KPIs] Fetched successfully");
      res.json(kpis);
    } catch (error) {
      console.error("❌ [USERS KPIs] Error fetching KPIs:", error);
      res.status(500).json({ message: "فشل في جلب إحصائيات المستخدمين" });
    }
  });

  // 3. POST /api/dashboard/users/:id/suspend - Suspend user
  app.post("/api/dashboard/users/:id/suspend", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      console.log("⏸️ [USER SUSPEND] Suspending user:", userId);

      const parsed = suspendUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: parsed.error });
      }

      const { reason, duration } = parsed.data;
      const updatedUser = await storage.suspendUser(userId, reason, duration);
      
      console.log("✅ [USER SUSPEND] User suspended successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER SUSPEND] Error suspending user:", error);
      res.status(500).json({ message: "فشل في تعليق المستخدم" });
    }
  });

  // 4. POST /api/dashboard/users/:id/unsuspend - Unsuspend user
  app.post("/api/dashboard/users/:id/unsuspend", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      console.log("▶️ [USER UNSUSPEND] Unsuspending user:", userId);

      const updatedUser = await storage.unsuspendUser(userId);
      
      console.log("✅ [USER UNSUSPEND] User unsuspended successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER UNSUSPEND] Error unsuspending user:", error);
      res.status(500).json({ message: "فشل في رفع التعليق عن المستخدم" });
    }
  });

  // 5. POST /api/dashboard/users/:id/ban - Ban user
  app.post("/api/dashboard/users/:id/ban", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      console.log("🚫 [USER BAN] Banning user:", userId);

      const parsed = banUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: parsed.error });
      }

      const { reason, isPermanent, duration } = parsed.data;
      const updatedUser = await storage.banUser(userId, reason, isPermanent, duration);
      
      console.log("✅ [USER BAN] User banned successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER BAN] Error banning user:", error);
      res.status(500).json({ message: "فشل في حظر المستخدم" });
    }
  });

  // 6. POST /api/dashboard/users/:id/unban - Unban user
  app.post("/api/dashboard/users/:id/unban", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      console.log("✅ [USER UNBAN] Unbanning user:", userId);

      const updatedUser = await storage.unbanUser(userId);
      
      console.log("✅ [USER UNBAN] User unbanned successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER UNBAN] Error unbanning user:", error);
      res.status(500).json({ message: "فشل في رفع الحظر عن المستخدم" });
    }
  });

  // 7. PATCH /api/dashboard/users/:id/role - Update user role
  app.patch("/api/dashboard/users/:id/role", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      console.log("👤 [USER ROLE] Updating user role:", userId, "to", role);

      if (!role) {
        return res.status(400).json({ message: "الدور مطلوب" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      
      console.log("✅ [USER ROLE] User role updated successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER ROLE] Error updating user role:", error);
      res.status(500).json({ message: "فشل في تحديث دور المستخدم" });
    }
  });

  // 8. PATCH /api/dashboard/users/:id/verification-badge - Update verification badge
  app.patch("/api/dashboard/users/:id/verification-badge", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { badge } = req.body;
      
      console.log("🏅 [USER BADGE] Updating verification badge:", userId, "to", badge);

      if (!badge || !['none', 'silver', 'gold'].includes(badge)) {
        return res.status(400).json({ message: "علامة التوثيق غير صحيحة" });
      }

      const updatedUser = await storage.updateVerificationBadge(userId, badge);
      
      console.log("✅ [USER BADGE] Verification badge updated successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER BADGE] Error updating verification badge:", error);
      res.status(500).json({ message: "فشل في تحديث علامة التوثيق" });
    }
  });

  // 9. POST /api/dashboard/users/:id/soft-delete - Soft delete user
  app.post("/api/dashboard/users/:id/soft-delete", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      console.log("🗑️ [USER DELETE] Soft deleting user:", userId);

      const updatedUser = await storage.softDeleteUser(userId);
      
      console.log("✅ [USER DELETE] User soft deleted successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER DELETE] Error soft deleting user:", error);
      res.status(500).json({ message: "فشل في حذف المستخدم" });
    }
  });

  // 10. POST /api/dashboard/users/:id/restore - Restore deleted user
  app.post("/api/dashboard/users/:id/restore", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      console.log("♻️ [USER RESTORE] Restoring deleted user:", userId);

      const updatedUser = await storage.restoreUser(userId);
      
      console.log("✅ [USER RESTORE] User restored successfully:", userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ [USER RESTORE] Error restoring user:", error);
      res.status(500).json({ message: "فشل في استعادة المستخدم" });
    }
  });

  // 11. POST /api/dashboard/users/bulk/suspend - Bulk suspend users
  app.post("/api/dashboard/users/bulk/suspend", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const { userIds, reason, duration } = req.body;
      
      console.log("⏸️ [BULK SUSPEND] Suspending users:", userIds?.length);

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "قائمة المستخدمين مطلوبة" });
      }

      if (!reason || reason.length < 5) {
        return res.status(400).json({ message: "يجب إدخال سبب التعليق (5 أحرف على الأقل)" });
      }

      const result = await storage.bulkSuspendUsers(userIds, reason, duration);
      
      console.log("✅ [BULK SUSPEND] Bulk suspend completed:", result);
      res.json(result);
    } catch (error) {
      console.error("❌ [BULK SUSPEND] Error bulk suspending users:", error);
      res.status(500).json({ message: "فشل في تعليق المستخدمين" });
    }
  });

  // 12. POST /api/dashboard/users/bulk/ban - Bulk ban users
  app.post("/api/dashboard/users/bulk/ban", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const { userIds, reason, isPermanent, duration } = req.body;
      
      console.log("🚫 [BULK BAN] Banning users:", userIds?.length);

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "قائمة المستخدمين مطلوبة" });
      }

      if (!reason || reason.length < 5) {
        return res.status(400).json({ message: "يجب إدخال سبب الحظر (5 أحرف على الأقل)" });
      }

      const result = await storage.bulkBanUsers(userIds, reason, isPermanent || false, duration);
      
      console.log("✅ [BULK BAN] Bulk ban completed:", result);
      res.json(result);
    } catch (error) {
      console.error("❌ [BULK BAN] Error bulk banning users:", error);
      res.status(500).json({ message: "فشل في حظر المستخدمين" });
    }
  });

  // 13. POST /api/dashboard/users/bulk/update-role - Bulk update user roles
  app.post("/api/dashboard/users/bulk/update-role", requireAuth, requirePermission('users.manage'), async (req: any, res) => {
    try {
      const { userIds, role } = req.body;
      
      console.log("👥 [BULK ROLE] Updating role for users:", userIds?.length, "to", role);

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "قائمة المستخدمين مطلوبة" });
      }

      if (!role) {
        return res.status(400).json({ message: "الدور مطلوب" });
      }

      const result = await storage.bulkUpdateUserRole(userIds, role);
      
      console.log("✅ [BULK ROLE] Bulk role update completed:", result);
      res.json(result);
    } catch (error) {
      console.error("❌ [BULK ROLE] Error bulk updating user roles:", error);
      res.status(500).json({ message: "فشل في تحديث أدوار المستخدمين" });
    }
  });

  // ============================================================
  // RSS FEED ROUTES (Admins only)
  // ============================================================

  app.get("/api/rss-feeds", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const feeds = await storage.getAllRssFeeds();
      res.json(feeds);
    } catch (error) {
      console.error("Error fetching RSS feeds:", error);
      res.status(500).json({ message: "Failed to fetch RSS feeds" });
    }
  });

  app.post("/api/rss-feeds", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const parsed = insertRssFeedSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid RSS feed data" });
      }

      const feed = await storage.createRssFeed(parsed.data);
      res.json(feed);
    } catch (error) {
      console.error("Error creating RSS feed:", error);
      res.status(500).json({ message: "Failed to create RSS feed" });
    }
  });

  app.post("/api/rss-feeds/:id/import", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { categoryId } = req.body;
      const count = await importFromRssFeed(req.params.id, categoryId, user.id);
      res.json({ imported: count });
    } catch (error) {
      console.error("Error importing from RSS:", error);
      res.status(500).json({ message: "Failed to import from RSS" });
    }
  });

  // ============================================================
  // USER PROFILE ROUTES
  // ============================================================

  app.get("/api/profile/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.get("/api/profile/liked", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const articles = await storage.getUserLikedArticles(userId);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching liked articles:", error);
      res.status(500).json({ message: "Failed to fetch liked articles" });
    }
  });

  app.get("/api/profile/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = await storage.getUserReadingHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching reading history:", error);
      res.status(500).json({ message: "Failed to fetch reading history" });
    }
  });

  // ============================================================
  // RECOMMENDATIONS
  // ============================================================

  app.get("/api/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recommendations = await storage.getRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // ============================================================
  // OBJECT STORAGE ROUTES (Protected file uploading)
  // ============================================================

  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check if object is public first (no auth needed)
      const aclPolicy = await getObjectAclPolicy(objectFile);
      if (aclPolicy?.visibility === "public") {
        return objectStorageService.downloadObject(objectFile, res);
      }
      
      // For private objects, require authentication
      const userId = req.user?.id;
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/article-images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = req.user?.id;

    try {
      console.log("[Article Image] Received imageURL:", req.body.imageURL);
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      console.log("[Article Image] Returning objectPath:", objectPath);
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("[Article Image] Error setting article image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  app.post("/api/behavior/log", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "يجب تسجيل الدخول لتسجيل السلوك" });
      }
      
      const { eventType, metadata } = req.body;

      const validEventTypes = [
        "article_view",
        "article_read",
        "comment_create",
        "bookmark_add",
        "bookmark_remove",
        "reaction_add",
        "search",
        "category_filter",
        "interest_update",
        "social_share"
      ];

      if (!eventType || !validEventTypes.includes(eventType)) {
        console.error("❌ Invalid eventType:", eventType);
        return res.status(400).json({ 
          message: "Invalid eventType",
          received: eventType,
          valid: validEventTypes
        });
      }

      const sanitizedMetadata = metadata && typeof metadata === 'object' 
        ? Object.fromEntries(
            Object.entries(metadata)
              .filter(([_, value]) => 
                typeof value === 'string' || 
                typeof value === 'number' || 
                typeof value === 'boolean'
              )
              .slice(0, 10)
          )
        : {};

      await storage.logBehavior({
        userId,
        eventType,
        metadata: sanitizedMetadata,
      });

      const meta = sanitizedMetadata as Record<string, any>;

      // Track events in userEvents table for daily summary analytics
      if (meta.articleId) {
        try {
          // Map behavior event types to userEvent types for daily summary
          if (eventType === "article_read") {
            await trackUserEvent({
              userId,
              articleId: meta.articleId,
              eventType: 'read',
              metadata: {
                readDuration: meta.readTime || meta.duration,
                scrollDepth: meta.scrollDepth,
              },
            });
          } else if (eventType === "article_view") {
            await trackUserEvent({
              userId,
              articleId: meta.articleId,
              eventType: 'view',
              metadata: {
                scrollDepth: meta.scrollDepth,
              },
            });
          }
        } catch (error) {
          console.error("Error tracking user event:", error);
        }
      }

      // إضافة نقاط ولاء بناءً على نوع السلوك
      try {
        let loyaltyPoints = 0;
        let action = "";
        
        switch(eventType) {
          case "article_view":
            loyaltyPoints = 2;
            action = "READ";
            break;
          case "article_read":
            // قراءة أكثر من 60 ثانية
            if (meta.duration && typeof meta.duration === 'number' && meta.duration >= 60) {
              loyaltyPoints = 3;
              action = "READ_DEEP";
            }
            break;
          // يمكن إضافة المزيد لاحقاً
        }
        
        if (loyaltyPoints > 0 && action) {
          await storage.recordLoyaltyPoints({
            userId,
            action,
            points: loyaltyPoints,
            source: (meta.articleId || meta.slug) as string | undefined,
            metadata: meta
          });
        }
      } catch (error) {
        console.error("Error recording loyalty points:", error);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error logging behavior:", error);
      res.status(500).json({ message: "Failed to log behavior" });
    }
  });

  app.get("/api/user/profile/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const userInterests = await storage.getUserInterests(userId);
      const behaviorSummary = await storage.getUserBehaviorSummary(userId, 7);
      const sentimentProfile = await storage.getUserSentimentProfile(userId);
      
      res.json({
        interests: userInterests,
        behaviorSummary: {
          last7Days: behaviorSummary,
        },
        sentimentProfile,
      });
    } catch (error) {
      console.error("Error fetching complete profile:", error);
      res.status(500).json({ message: "Failed to fetch complete profile" });
    }
  });

  // ============================================================
  // THEME MANAGEMENT ROUTES
  // ============================================================

  app.get("/api/themes/active", cacheControl({ maxAge: CACHE_DURATIONS.LONG }), async (req, res) => {
    try {
      const scope = (req.query.scope as string) || 'site_full';
      const theme = await storage.getActiveTheme(scope);
      res.json(theme || null);
    } catch (error) {
      console.error("Error fetching active theme:", error);
      res.status(500).json({ message: "Failed to fetch active theme" });
    }
  });

  app.get("/api/themes", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status, createdBy } = req.query;
      const themes = await storage.getAllThemes({
        status: status as string,
        createdBy: createdBy as string,
      });
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  // Export all themes (must be before :id route)
  app.get("/api/themes/export", requireRole("admin"), async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get all themes from database
      const allThemes = await db
        .select()
        .from(themes)
        .orderBy(themes.createdAt);

      // Log activity
      await logActivity({
        userId,
        action: "export",
        entityType: "themes",
        entityId: "all",
        newValue: { count: allThemes.length },
      });

      // Format response with metadata
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        themes: allThemes,
      };

      res.json(exportData);
    } catch (error) {
      console.error("Error exporting themes:", error);
      res.status(500).json({ message: "فشل في تصدير السمات" });
    }
  });

  // Import themes (must be before :id route)
  app.post("/api/themes/import", requireRole("admin"), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { version, themes: importThemes, mode = "merge" } = req.body;

      // Validate request body
      if (!version || !importThemes || !Array.isArray(importThemes)) {
        return res.status(400).json({ 
          message: "بيانات الاستيراد غير صحيحة. يجب توفير version و themes" 
        });
      }

      // Validate each theme
      for (const theme of importThemes) {
        if (!theme.name || !theme.tokens) {
          return res.status(400).json({ 
            message: "كل سمة يجب أن تحتوي على name و tokens" 
          });
        }
      }

      let imported = 0;
      let updated = 0;
      let created = 0;

      // Use transaction for safety
      await db.transaction(async (tx) => {
        // If mode is replace, delete all existing themes first
        if (mode === "replace") {
          await tx.delete(themes);
        }

        // Process each theme
        for (const importTheme of importThemes) {
          const themeId = importTheme.id;

          // Check if theme exists
          const [existingTheme] = themeId 
            ? await tx
                .select()
                .from(themes)
                .where(eq(themes.id, themeId))
                .limit(1)
            : [];

          if (existingTheme) {
            // Update existing theme
            await tx
              .update(themes)
              .set({
                name: importTheme.name,
                slug: importTheme.slug || importTheme.name.toLowerCase().replace(/\s+/g, '-'),
                isDefault: importTheme.isDefault || false,
                priority: importTheme.priority || 0,
                status: importTheme.status || "draft",
                startAt: importTheme.startAt ? new Date(importTheme.startAt) : null,
                endAt: importTheme.endAt ? new Date(importTheme.endAt) : null,
                assets: importTheme.assets || null,
                tokens: importTheme.tokens,
                applyTo: importTheme.applyTo || [],
                updatedAt: new Date(),
              })
              .where(eq(themes.id, themeId));
            
            updated++;
          } else {
            // Create new theme with new ID
            await tx
              .insert(themes)
              .values({
                name: importTheme.name,
                slug: importTheme.slug || importTheme.name.toLowerCase().replace(/\s+/g, '-'),
                isDefault: importTheme.isDefault || false,
                priority: importTheme.priority || 0,
                status: importTheme.status || "draft",
                startAt: importTheme.startAt ? new Date(importTheme.startAt) : null,
                endAt: importTheme.endAt ? new Date(importTheme.endAt) : null,
                assets: importTheme.assets || null,
                tokens: importTheme.tokens,
                applyTo: importTheme.applyTo || [],
                createdBy: userId,
              });
            
            created++;
          }
          
          imported++;
        }

        // Ensure only one default theme exists
        const defaultThemes = await tx
          .select()
          .from(themes)
          .where(eq(themes.isDefault, true));

        if (defaultThemes.length > 1) {
          // Keep only the first one as default
          for (let i = 1; i < defaultThemes.length; i++) {
            await tx
              .update(themes)
              .set({ isDefault: false })
              .where(eq(themes.id, defaultThemes[i].id));
          }
        }
      });

      // Log activity
      await logActivity({
        userId,
        action: "import",
        entityType: "themes",
        entityId: "bulk",
        newValue: { mode, imported, updated, created },
      });

      res.json({
        message: "تم استيراد السمات بنجاح",
        imported,
        updated,
        created,
      });
    } catch (error) {
      console.error("Error importing themes:", error);
      res.status(500).json({ message: "فشل في استيراد السمات" });
    }
  });

  app.get("/api/themes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const theme = await storage.getThemeById(req.params.id);
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ message: "Failed to fetch theme" });
    }
  });

  app.post("/api/themes", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const parsed = insertThemeSchema.safeParse({
        ...req.body,
        createdBy: req.user.id,
      });

      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات السمة غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      const theme = await storage.createTheme(parsed.data);
      res.json(theme);
    } catch (error) {
      console.error("Error creating theme:", error);
      res.status(500).json({ message: "Failed to create theme" });
    }
  });

  app.patch("/api/themes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const parsed = updateThemeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات السمة غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      const theme = await storage.updateTheme(
        req.params.id, 
        parsed.data, 
        req.user.id
      );
      res.json(theme);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  app.delete("/api/themes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      await storage.deleteTheme(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting theme:", error);
      res.status(500).json({ message: "Failed to delete theme" });
    }
  });

  // POST /api/themes/:id/duplicate - Duplicate existing theme
  app.post("/api/themes/:id/duplicate", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const sourceTheme = await storage.getThemeById(req.params.id);
      if (!sourceTheme) {
        return res.status(404).json({ message: "Theme not found" });
      }

      const { name, slug } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      // Create duplicated theme
      const duplicatedTheme = await storage.createTheme({
        name,
        slug,
        isDefault: false,
        priority: 0,
        status: 'draft',
        assets: sourceTheme.assets,
        tokens: sourceTheme.tokens,
        applyTo: sourceTheme.applyTo,
        createdBy: req.user.id,
      });

      // Log duplication
      await storage.createThemeAuditLog({
        themeId: duplicatedTheme.id,
        userId: req.user.id,
        action: 'duplicate',
        metadata: {
          reason: `Duplicated from theme ${sourceTheme.name} (ID: ${sourceTheme.id})`,
        },
      });

      res.json(duplicatedTheme);
    } catch (error: any) {
      console.error("Error duplicating theme:", error);
      res.status(500).json({ message: error.message || "Failed to duplicate theme" });
    }
  });

  // POST /api/themes/:id/activate - Activate theme and deactivate others (transactional)
  app.post("/api/themes/:id/activate", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      const themeToActivate = await storage.getThemeById(req.params.id);
      if (!themeToActivate) {
        return res.status(404).json({ message: "Theme not found" });
      }

      // Use transaction to ensure atomic activation
      await db.transaction(async (tx) => {
        // 1. Get all currently active themes
        const activeThemes = await tx
          .select()
          .from(themes)
          .where(eq(themes.status, 'active'));

        // 2. Deactivate all active themes
        for (const activeTheme of activeThemes) {
          await tx
            .update(themes)
            .set({
              status: 'draft',
              updatedAt: new Date(),
            })
            .where(eq(themes.id, activeTheme.id));

          await tx.insert(themeAuditLog).values({
            themeId: activeTheme.id,
            userId: req.user.id,
            action: 'deactivate',
            metadata: {
              reason: `Deactivated to activate theme ${themeToActivate.name}`,
              previousStatus: 'active',
              newStatus: 'draft',
            },
          });
        }

        // 3. Activate the selected theme
        await tx
          .update(themes)
          .set({
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(themes.id, req.params.id));

        await tx.insert(themeAuditLog).values({
          themeId: req.params.id,
          userId: req.user.id,
          action: 'activate',
          metadata: {
            previousStatus: themeToActivate.status,
            newStatus: 'active',
          },
        });
      });

      // Fetch and return the activated theme
      const activatedTheme = await storage.getThemeById(req.params.id);

      res.json(activatedTheme);
    } catch (error) {
      console.error("Error activating theme:", error);
      res.status(500).json({ message: "Failed to activate theme" });
    }
  });

  app.post("/api/themes/:id/publish", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      const theme = await storage.publishTheme(req.params.id, req.user.id);
      res.json(theme);
    } catch (error) {
      console.error("Error publishing theme:", error);
      res.status(500).json({ message: "Failed to publish theme" });
    }
  });

  // POST /api/themes/seed/sabq-red - Create Sabq Red theme (one-time setup)
  app.post("/api/themes/seed/sabq-red", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      // Check if already exists
      const existing = await db
        .select()
        .from(themes)
        .where(eq(themes.slug, "sabq-red"))
        .limit(1);

      if (existing.length > 0) {
        return res.json({ 
          message: "Theme 'سبق الأحمر' already exists",
          theme: existing[0] 
        });
      }

      // Create the Sabq Red theme
      const sabqRedTheme = await storage.createTheme({
        name: "سبق الأحمر",
        slug: "sabq-red",
        isDefault: false,
        priority: 0,
        status: "draft",
        assets: {
          logoLight: "/assets/sabq_no_bg_high_res_1762663557037.png",
          logoDark: "/assets/sabq_no_bg_high_res_1762663557037.png",
        },
        tokens: {
          colors: {
            "primary-light": "348 100% 45%",
            "primary-dark": "348 95% 60%",
            "primary-foreground-light": "0 0% 100%",
            "primary-foreground-dark": "0 0% 100%",
            "secondary-light": "220 9% 62%",
            "secondary-dark": "220 9% 62%",
            "secondary-foreground-light": "0 0% 0%",
            "secondary-foreground-dark": "0 0% 100%",
            "muted-light": "220 8% 33%",
            "muted-dark": "220 8% 33%",
            "muted-foreground-light": "0 0% 100%",
            "muted-foreground-dark": "0 0% 100%",
            "accent-light": "348 100% 45%",
            "accent-dark": "348 95% 60%",
            "accent-foreground-light": "0 0% 100%",
            "accent-foreground-dark": "0 0% 100%",
            "destructive-light": "0 84% 60%",
            "destructive-dark": "0 62% 30%",
            "destructive-foreground-light": "0 0% 100%",
            "destructive-foreground-dark": "0 0% 100%",
            "border-light": "220 13% 91%",
            "border-dark": "220 13% 18%",
            "input-light": "220 13% 91%",
            "input-dark": "220 13% 18%",
            "ring-light": "348 100% 45%",
            "ring-dark": "348 95% 60%",
            "background-light": "0 0% 100%",
            "background-dark": "220 15% 8%",
            "foreground-light": "220 9% 15%",
            "foreground-dark": "0 0% 95%",
            "card-light": "0 0% 100%",
            "card-dark": "220 15% 12%",
            "card-foreground-light": "220 9% 15%",
            "card-foreground-dark": "0 0% 95%",
            "popover-light": "0 0% 100%",
            "popover-dark": "220 15% 12%",
            "popover-foreground-light": "220 9% 15%",
            "popover-foreground-dark": "0 0% 95%",
          },
        },
        applyTo: ["site_full"],
        createdBy: req.user.id,
      });

      res.json({
        message: "تم إنشاء ثيم 'سبق الأحمر' بنجاح",
        theme: sabqRedTheme,
      });
    } catch (error: any) {
      console.error("Error creating Sabq Red theme:", error);
      res.status(500).json({ message: error.message || "Failed to create theme" });
    }
  });

  app.post("/api/themes/:id/expire", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      const theme = await storage.expireTheme(req.params.id, req.user.id);
      res.json(theme);
    } catch (error) {
      console.error("Error expiring theme:", error);
      res.status(500).json({ message: "Failed to expire theme" });
    }
  });

  app.post("/api/themes/:id/rollback", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      const theme = await storage.rollbackTheme(req.params.id, req.user.id);
      res.json(theme);
    } catch (error: any) {
      console.error("Error rolling back theme:", error);
      res.status(500).json({ message: error.message || "Failed to rollback theme" });
    }
  });

  app.get("/api/themes/:id/logs", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const logs = await storage.getThemeAuditLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching theme logs:", error);
      res.status(500).json({ message: "Failed to fetch theme logs" });
    }
  });

  app.post("/api/themes/initialize", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      const theme = await storage.initializeDefaultTheme(req.user.id);
      res.json(theme);
    } catch (error) {
      console.error("Error initializing default theme:", error);
      res.status(500).json({ message: "Failed to initialize default theme" });
    }
  });

  // ============================================================
  // NOTIFICATION ROUTES
  // ============================================================

  // Get user's notifications inbox (last 20)
  app.get("/api/me/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true'; // القائمة المنسدلة تطلب فقط غير المقروءة
      const language = (req.query.language as string) || 'ar'; // 'ar' or 'en'
      
      // بناء شروط الاستعلام
      const conditions = unreadOnly 
        ? and(
            eq(notificationsInbox.userId, userId),
            eq(notificationsInbox.read, false) // فقط غير المقروءة للقائمة المنسدلة
          )
        : eq(notificationsInbox.userId, userId); // كل الإشعارات لصفحة الأرشيف
      
      // Fetch all notifications first
      const allNotifications = await db
        .select()
        .from(notificationsInbox)
        .where(conditions)
        .orderBy(desc(notificationsInbox.createdAt))
        .limit(limit * 2); // Get more to account for filtering

      // Filter by language based on article metadata
      const filteredNotifications = await Promise.all(
        allNotifications.map(async (notification) => {
          const metadata = notification.metadata as any;
          const articleId = metadata?.articleId;
          
          // If no articleId, it's a system notification - include in both languages
          if (!articleId) {
            return notification;
          }
          
          // Check if article exists in the appropriate table
          if (language === 'en') {
            // For English, check if article exists in en_articles
            const [enArticle] = await db
              .select({ id: enArticles.id })
              .from(enArticles)
              .where(eq(enArticles.id, articleId))
              .limit(1);
            
            return enArticle ? notification : null;
          } else {
            // For Arabic, check if article exists in articles
            const [arArticle] = await db
              .select({ id: articles.id })
              .from(articles)
              .where(eq(articles.id, articleId))
              .limit(1);
            
            return arArticle ? notification : null;
          }
        })
      );

      // Remove null entries and limit
      const notifications = filteredNotifications
        .filter((n): n is NonNullable<typeof n> => n !== null)
        .slice(0, limit);

      // Get unread count (also filtered by language)
      const allUnread = await db
        .select()
        .from(notificationsInbox)
        .where(
          and(
            eq(notificationsInbox.userId, userId),
            eq(notificationsInbox.read, false)
          )
        );

      // Filter unread by language
      const filteredUnread = await Promise.all(
        allUnread.map(async (notification) => {
          const metadata = notification.metadata as any;
          const articleId = metadata?.articleId;
          
          if (!articleId) return notification;
          
          if (language === 'en') {
            const [enArticle] = await db
              .select({ id: enArticles.id })
              .from(enArticles)
              .where(eq(enArticles.id, articleId))
              .limit(1);
            return enArticle ? notification : null;
          } else {
            const [arArticle] = await db
              .select({ id: articles.id })
              .from(articles)
              .where(eq(articles.id, articleId))
              .limit(1);
            return arArticle ? notification : null;
          }
        })
      );

      const unreadCount = filteredUnread.filter(n => n !== null).length;

      res.json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "فشل تحميل الإشعارات" });
    }
  });

  // Mark notification as read
  app.patch("/api/me/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      const [notification] = await db
        .update(notificationsInbox)
        .set({ read: true })
        .where(
          and(
            eq(notificationsInbox.id, notificationId),
            eq(notificationsInbox.userId, userId)
          )
        )
        .returning();

      if (!notification) {
        return res.status(404).json({ message: "الإشعار غير موجود" });
      }

      // Track opened metric
      await db.insert(notificationMetrics).values({
        notificationId,
        userId,
        type: notification.type,
        opened: true,
        openedAt: new Date(),
      });

      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "فشل تحديث الإشعار" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/me/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      await db
        .update(notificationsInbox)
        .set({ read: true })
        .where(
          and(
            eq(notificationsInbox.userId, userId),
            eq(notificationsInbox.read, false)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "فشل تحديث الإشعارات" });
    }
  });

  // SSE endpoint for real-time notifications
  app.get("/api/notifications/stream", isAuthenticated, (req: any, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const userId = req.user.id;
    console.log(`📡 SSE connection opened for user: ${userId}`);
    
    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 30000);

    // Subscribe to notifications for this user
    const listener = (notification: any) => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    };
    
    notificationBus.subscribe(userId, listener);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      notificationBus.unsubscribe(userId, listener);
      console.log(`📡 SSE connection closed for user: ${userId}`);
    });
  });

  // Get user notification preferences
  app.get("/api/me/notification-prefs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      let [prefs] = await db
        .select()
        .from(userNotificationPrefs)
        .where(eq(userNotificationPrefs.userId, userId))
        .limit(1);

      // Create default preferences if not exists
      if (!prefs) {
        [prefs] = await db
          .insert(userNotificationPrefs)
          .values({ userId })
          .returning();
      }

      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "فشل تحميل إعدادات الإشعارات" });
    }
  });

  // Update user notification preferences
  app.patch("/api/me/notification-prefs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const parsed = updateUserNotificationPrefsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "البيانات غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      // Upsert preferences
      const [prefs] = await db
        .insert(userNotificationPrefs)
        .values({
          userId,
          ...parsed.data,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userNotificationPrefs.userId,
          set: {
            ...parsed.data,
            updatedAt: new Date(),
          },
        })
        .returning();

      res.json(prefs);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "فشل تحديث إعدادات الإشعارات" });
    }
  });

  // Admin: Fix notification settings for all users
  app.post("/api/admin/fix-notification-settings", requireRole('admin'), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      // Get all users without notification preferences
      const usersWithoutPrefs = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .leftJoin(userNotificationPrefs, eq(users.id, userNotificationPrefs.userId))
        .where(sql`${userNotificationPrefs.userId} IS NULL`);

      let createdCount = 0;
      for (const userRecord of usersWithoutPrefs) {
        await db.insert(userNotificationPrefs).values({
          userId: userRecord.id,
          breaking: true,
          interest: true,
          likedUpdates: true,
          mostRead: true,
        }).onConflictDoNothing({ target: userNotificationPrefs.userId });
        createdCount++;
      }

      res.json({ 
        success: true,
        message: `تم إنشاء إعدادات إشعارات لـ ${createdCount} مستخدم`,
        createdCount,
        totalUsersFixed: usersWithoutPrefs.length
      });
    } catch (error) {
      console.error("Error fixing notification settings:", error);
      res.status(500).json({ message: "فشل إصلاح إعدادات الإشعارات" });
    }
  });

  // Admin: Add interest to current user
  app.post("/api/admin/add-my-interest", requireRole('admin'), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { categoryId } = req.body;
      if (!categoryId) {
        return res.status(400).json({ message: "categoryId is required" });
      }

      // Check if interest already exists
      const [existing] = await db
        .select()
        .from(userInterests)
        .where(
          and(
            eq(userInterests.userId, userId),
            eq(userInterests.categoryId, categoryId)
          )
        )
        .limit(1);

      if (existing) {
        return res.json({ 
          success: true,
          message: "الاهتمام موجود مسبقاً",
          alreadyExists: true
        });
      }

      // Add new interest
      await db.insert(userInterests).values({
        userId,
        categoryId,
      });

      res.json({ 
        success: true,
        message: "تم إضافة الاهتمام بنجاح",
        alreadyExists: false
      });
    } catch (error) {
      console.error("Error adding interest:", error);
      res.status(500).json({ message: "فشل إضافة الاهتمام" });
    }
  });

  // Admin: Get notification system status
  app.get("/api/admin/notification-status", requireRole('admin'), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - Admin only" });
      }

      // Get counts
      const [totalUsersResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      
      const [usersWithPrefsResult] = await db
        .select({ count: sql<number>`count(distinct ${userNotificationPrefs.userId})` })
        .from(userNotificationPrefs);

      const [usersWithInterestsResult] = await db
        .select({ count: sql<number>`count(distinct ${userInterests.userId})` })
        .from(userInterests);

      const [totalNotificationsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notificationsInbox);

      const totalUsers = Number(totalUsersResult?.count || 0);
      const usersWithPrefs = Number(usersWithPrefsResult?.count || 0);
      const usersWithInterests = Number(usersWithInterestsResult?.count || 0);
      const totalNotifications = Number(totalNotificationsResult?.count || 0);

      res.json({
        totalUsers,
        usersWithPrefs,
        usersWithInterests,
        usersWithoutPrefs: totalUsers - usersWithPrefs,
        totalNotifications,
        systemHealth: usersWithPrefs === totalUsers ? 'healthy' : 'needs_fix'
      });
    } catch (error) {
      console.error("Error getting notification status:", error);
      res.status(500).json({ message: "فشل تحميل حالة النظام" });
    }
  });

  // Internal API: Enqueue notification (system use only)
  app.post("/internal/notify/enqueue", async (req, res) => {
    try {
      // Simple API key check for internal services
      const apiKey = req.headers["x-internal-key"];
      if (apiKey !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === "production") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const parsed = insertNotificationQueueSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid notification data",
          errors: parsed.error.errors 
        });
      }

      const [notification] = await db
        .insert(notificationQueue)
        .values({
          userId: parsed.data.userId,
          type: parsed.data.type,
          payload: parsed.data.payload as any,
          dedupeKey: parsed.data.dedupeKey,
          priority: parsed.data.priority,
          scheduledAt: parsed.data.scheduledAt,
        })
        .returning();

      res.json(notification);
    } catch (error) {
      console.error("Error enqueueing notification:", error);
      res.status(500).json({ message: "Failed to enqueue notification" });
    }
  });

  // ============================================================
  // LOYALTY SYSTEM ROUTES
  // ============================================================

  // Get user loyalty points
  app.get("/api/loyalty/points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const points = await storage.getUserPoints(userId);
      
      if (!points) {
        // إنشاء سجل جديد للمستخدم
        return res.json({
          totalPoints: 0,
          currentRank: "القارئ الجديد",
          lifetimePoints: 0
        });
      }
      
      res.json(points);
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
      res.status(500).json({ message: "Failed to fetch loyalty points" });
    }
  });

  // Get user loyalty history
  app.get("/api/loyalty/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserLoyaltyHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching loyalty history:", error);
      res.status(500).json({ message: "Failed to fetch loyalty history" });
    }
  });

  // Get active loyalty rewards
  app.get("/api/loyalty/rewards", isAuthenticated, async (req: any, res) => {
    try {
      const rewards = await storage.getActiveRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  // Get loyalty leaderboard
  app.get("/api/loyalty/leaderboard", async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const topUsers = await storage.getTopUsers(limit);
      res.json(topUsers);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Manual points update endpoint (for testing/admin use)
  app.post("/api/loyalty/update-points", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { points, reason } = req.body;
      
      if (typeof points !== 'number') {
        return res.status(400).json({ error: 'Points must be a number' });
      }
      
      // Update points
      await storage.updateUserPointsTotal(userId, {
        totalPoints: points,
      });
      
      // Trigger pass update
      await storage.triggerLoyaltyPassUpdate(userId, reason || 'manual_update');
      
      res.json({ success: true, points });
    } catch (error: any) {
      console.error('Error updating points:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // MUQTARIB PUBLIC ROUTES
  // ============================================================

  // Get muqtarib section
  app.get("/api/muqtarib/section", async (req, res) => {
    try {
      const section = await storage.getSectionBySlug("muqtarib");
      if (!section) {
        return res.status(404).json({ message: "Muqtarib section not found" });
      }
      res.json(section);
    } catch (error) {
      console.error("Error fetching muqtarib section:", error);
      res.status(500).json({ message: "Failed to fetch section" });
    }
  });

  // Get all angles (with optional active filter)
  app.get("/api/muqtarib/angles", async (req, res) => {
    try {
      const activeOnly = req.query.active === "1" || req.query.active === "true";
      const angles = await storage.getAllAngles(activeOnly);
      res.json(angles);
    } catch (error) {
      console.error("Error fetching angles:", error);
      res.status(500).json({ message: "Failed to fetch angles" });
    }
  });

  // Get angle by slug with latest articles
  app.get("/api/muqtarib/angles/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const limit = parseInt(req.query.limit as string) || 12;
      
      const angle = await storage.getAngleBySlug(slug);
      if (!angle) {
        return res.status(404).json({ message: "Angle not found" });
      }
      
      const articles = await storage.getArticlesByAngle(slug, limit);
      res.json({ ...angle, articles });
    } catch (error) {
      console.error("Error fetching angle:", error);
      res.status(500).json({ message: "Failed to fetch angle" });
    }
  });

  // ============================================================
  // MUQTARIB ADMIN ROUTES (RBAC Protected)
  // ============================================================

  // Create angle
  app.post("/api/admin/muqtarib/angles", requirePermission("muqtarib.manage"), async (req: any, res) => {
    try {
      const parsed = insertAngleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة", 
          errors: parsed.error.errors 
        });
      }
      
      const angle = await storage.createAngle(parsed.data);
      await logActivity({
        userId: req.user.id,
        action: "create",
        entityType: "angle",
        entityId: angle.id,
        newValue: { angleId: angle.id, slug: angle.slug },
      });
      res.json(angle);
    } catch (error) {
      console.error("Error creating angle:", error);
      res.status(500).json({ message: "فشل في إنشاء الزاوية" });
    }
  });

  // Update angle
  app.put("/api/admin/muqtarib/angles/:id", requirePermission("muqtarib.manage"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsed = insertAngleSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة", 
          errors: parsed.error.errors 
        });
      }
      
      const angle = await storage.updateAngle(id, parsed.data);
      await logActivity({
        userId: req.user.id,
        action: "update",
        entityType: "angle",
        entityId: id,
        newValue: parsed.data,
      });
      res.json(angle);
    } catch (error) {
      console.error("Error updating angle:", error);
      res.status(500).json({ message: "فشل في تحديث الزاوية" });
    }
  });

  // Delete angle
  app.delete("/api/admin/muqtarib/angles/:id", requirePermission("muqtarib.manage"), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAngle(id);
      await logActivity({
        userId: req.user.id,
        action: "delete",
        entityType: "angle",
        entityId: id,
      });
      res.json({ message: "تم حذف الزاوية بنجاح" });
    } catch (error) {
      console.error("Error deleting angle:", error);
      res.status(500).json({ message: "فشل في حذف الزاوية" });
    }
  });

  // Link article to angle
  app.post("/api/admin/articles/:articleId/angles", requirePermission("muqtarib.manage"), async (req: any, res) => {
    try {
      const { articleId } = req.params;
      const { angleId } = req.body;
      
      if (!angleId) {
        return res.status(400).json({ message: "معرف الزاوية مطلوب" });
      }
      
      await storage.linkArticleToAngle(articleId, angleId);
      await logActivity({
        userId: req.user.id,
        action: "link",
        entityType: "article_angle",
        entityId: articleId,
        newValue: { articleId, angleId },
      });
      res.json({ message: "تم ربط المقال بالزاوية بنجاح" });
    } catch (error) {
      console.error("Error linking article to angle:", error);
      res.status(500).json({ message: "فشل في ربط المقال" });
    }
  });

  // Unlink article from angle
  app.delete("/api/admin/articles/:articleId/angles/:angleId", requirePermission("muqtarib.manage"), async (req: any, res) => {
    try {
      const { articleId, angleId } = req.params;
      await storage.unlinkArticleFromAngle(articleId, angleId);
      await logActivity({
        userId: req.user.id,
        action: "unlink",
        entityType: "article_angle",
        entityId: articleId,
        oldValue: { articleId, angleId },
      });
      res.json({ message: "تم إلغاء ربط المقال بنجاح" });
    } catch (error) {
      console.error("Error unlinking article:", error);
      res.status(500).json({ message: "فشل في إلغاء الربط" });
    }
  });

  // Get article's angles
  app.get("/api/admin/articles/:articleId/angles", requirePermission("articles.view"), async (req: any, res) => {
    try {
      const { articleId } = req.params;
      const angles = await storage.getArticleAngles(articleId);
      res.json(angles);
    } catch (error) {
      console.error("Error fetching article angles:", error);
      res.status(500).json({ message: "Failed to fetch article angles" });
    }
  });

  // ============================================================
  // TAGS ROUTES
  // ============================================================

  // Helper function to generate slug from Arabic or English text
  function generateSlug(text: string): string {
    const baseSlug = text
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Add timestamp to ensure uniqueness
    return `${baseSlug}-${Date.now()}`;
  }

  // 1. GET /api/tags - Get all tags with filters and sorting
  app.get("/api/tags", async (req, res) => {
    try {
      const { status, search } = req.query;

      let query = db.select().from(tags);

      // Build where conditions
      const conditions = [];
      
      if (status) {
        conditions.push(eq(tags.status, status as string));
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            ilike(tags.nameAr, searchTerm),
            ilike(tags.nameEn, searchTerm)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // Order by usage count descending
      const result = await query.orderBy(desc(tags.usageCount));

      res.json(result);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "فشل في جلب الوسوم" });
    }
  });

  // 2. GET /api/tags/:id - Get specific tag with article count
  app.get("/api/tags/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [tag] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1);

      if (!tag) {
        return res.status(404).json({ message: "الوسم غير موجود" });
      }

      // Count associated articles
      const [articleCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(articleTags)
        .where(eq(articleTags.tagId, id));

      res.json({
        ...tag,
        articleCount: articleCount?.count || 0,
      });
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "فشل في جلب الوسم" });
    }
  });

  // 3. POST /api/tags - Create new tag (admin & editor only)
  app.post("/api/tags", requireAuth, requireRole("admin", "editor"), async (req: any, res) => {
    try {
      const parsed = insertTagSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      const data = parsed.data;

      // Generate slug automatically from nameEn or nameAr
      const slug = data.slug || generateSlug(data.nameEn || data.nameAr);

      // Check if slug already exists
      const [existingTag] = await db
        .select()
        .from(tags)
        .where(eq(tags.slug, slug))
        .limit(1);

      if (existingTag) {
        return res.status(409).json({ message: "الوسم موجود بالفعل (slug مكرر)" });
      }

      // Create tag
      const [newTag] = await db
        .insert(tags)
        .values({
          ...data,
          slug,
          usageCount: 0,
        })
        .returning();

      await logActivity({
        userId: req.user.id,
        action: "create",
        entityType: "tag",
        entityId: newTag.id,
        newValue: newTag,
      });

      res.status(201).json(newTag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "فشل في إنشاء الوسم" });
    }
  });

  // 4. PATCH /api/tags/:id - Update tag (admin & editor only)
  app.patch("/api/tags/:id", requireAuth, requireRole("admin", "editor"), async (req: any, res) => {
    try {
      const { id } = req.params;

      const parsed = updateTagSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة",
          errors: parsed.error.errors 
        });
      }

      const data = parsed.data;

      // Check if tag exists
      const [existingTag] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1);

      if (!existingTag) {
        return res.status(404).json({ message: "الوسم غير موجود" });
      }

      // If slug is being updated, check for duplicates
      if (data.slug && data.slug !== existingTag.slug) {
        const [duplicateTag] = await db
          .select()
          .from(tags)
          .where(eq(tags.slug, data.slug))
          .limit(1);

        if (duplicateTag) {
          return res.status(409).json({ message: "الوسم موجود بالفعل (slug مكرر)" });
        }
      }

      // Update tag
      const [updatedTag] = await db
        .update(tags)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(tags.id, id))
        .returning();

      await logActivity({
        userId: req.user.id,
        action: "update",
        entityType: "tag",
        entityId: id,
        oldValue: existingTag,
        newValue: updatedTag,
      });

      res.json(updatedTag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "فشل في تحديث الوسم" });
    }
  });

  // 5. DELETE /api/tags/:id - Delete tag (admin only)
  app.delete("/api/tags/:id", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const { id } = req.params;

      // Check if tag exists
      const [existingTag] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1);

      if (!existingTag) {
        return res.status(404).json({ message: "الوسم غير موجود" });
      }

      // Delete all article-tag relations first
      await db
        .delete(articleTags)
        .where(eq(articleTags.tagId, id));

      // Delete the tag
      await db
        .delete(tags)
        .where(eq(tags.id, id));

      await logActivity({
        userId: req.user.id,
        action: "delete",
        entityType: "tag",
        entityId: id,
        oldValue: existingTag,
      });

      res.json({ message: "تم حذف الوسم بنجاح" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "فشل في حذف الوسم" });
    }
  });

  // 6. GET /api/tags/:id/articles - Get articles for a specific tag
  app.get("/api/tags/:id/articles", async (req, res) => {
    try {
      const { id } = req.params;

      // Check if tag exists
      const [tag] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1);

      if (!tag) {
        return res.status(404).json({ message: "الوسم غير موجود" });
      }

      // Get articles with tag
      const result = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          excerpt: articles.excerpt,
          publishedAt: articles.publishedAt,
          views: articles.views,
          status: articles.status,
        })
        .from(articleTags)
        .innerJoin(articles, eq(articleTags.articleId, articles.id))
        .where(eq(articleTags.tagId, id))
        .orderBy(desc(articles.publishedAt));

      res.json(result);
    } catch (error) {
      console.error("Error fetching tag articles:", error);
      res.status(500).json({ message: "فشل في جلب مقالات الوسم" });
    }
  });

  // 7. POST /api/articles/:articleId/tags - Link tag to article (admin & editor only)
  app.post("/api/articles/:articleId/tags", requireAuth, requireRole("admin", "editor"), async (req: any, res) => {
    try {
      const { articleId } = req.params;
      const { tagId } = req.body;

      if (!tagId) {
        return res.status(400).json({ message: "معرف الوسم مطلوب" });
      }

      // Check if article exists
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "المقالة غير موجودة" });
      }

      // Check if tag exists
      const [tag] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tagId))
        .limit(1);

      if (!tag) {
        return res.status(404).json({ message: "الوسم غير موجود" });
      }

      // Check if relation already exists
      const [existingRelation] = await db
        .select()
        .from(articleTags)
        .where(
          and(
            eq(articleTags.articleId, articleId),
            eq(articleTags.tagId, tagId)
          )
        )
        .limit(1);

      if (existingRelation) {
        return res.status(409).json({ message: "الوسم مرتبط بالمقالة بالفعل" });
      }

      // Create relation
      await db
        .insert(articleTags)
        .values({
          articleId,
          tagId,
        });

      // Update usage count (+1)
      await db
        .update(tags)
        .set({
          usageCount: sql`${tags.usageCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(tags.id, tagId));

      await logActivity({
        userId: req.user.id,
        action: "link",
        entityType: "article_tag",
        entityId: articleId,
        newValue: { articleId, tagId },
      });

      res.status(201).json({ message: "تم ربط الوسم بالمقالة بنجاح" });
    } catch (error) {
      console.error("Error linking tag to article:", error);
      res.status(500).json({ message: "فشل في ربط الوسم" });
    }
  });

  // 8. DELETE /api/articles/:articleId/tags/:tagId - Unlink tag from article (admin & editor only)
  app.delete("/api/articles/:articleId/tags/:tagId", requireAuth, requireRole("admin", "editor"), async (req: any, res) => {
    try {
      const { articleId, tagId } = req.params;

      // Check if relation exists
      const [relation] = await db
        .select()
        .from(articleTags)
        .where(
          and(
            eq(articleTags.articleId, articleId),
            eq(articleTags.tagId, tagId)
          )
        )
        .limit(1);

      if (!relation) {
        return res.status(404).json({ message: "الربط غير موجود" });
      }

      // Delete relation
      await db
        .delete(articleTags)
        .where(
          and(
            eq(articleTags.articleId, articleId),
            eq(articleTags.tagId, tagId)
          )
        );

      // Update usage count (-1)
      await db
        .update(tags)
        .set({
          usageCount: sql`GREATEST(${tags.usageCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(tags.id, tagId));

      await logActivity({
        userId: req.user.id,
        action: "unlink",
        entityType: "article_tag",
        entityId: articleId,
        oldValue: { articleId, tagId },
      });

      res.json({ message: "تم فك ربط الوسم بنجاح" });
    } catch (error) {
      console.error("Error unlinking tag from article:", error);
      res.status(500).json({ message: "فشل في فك الربط" });
    }
  });

  // 9. GET /api/articles/:articleId/tags - Get tags for an article
  app.get("/api/articles/:articleId/tags", async (req, res) => {
    try {
      const { articleId } = req.params;

      // Check if article exists
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "المقالة غير موجودة" });
      }

      // Get tags for article
      const result = await db
        .select({
          id: tags.id,
          nameAr: tags.nameAr,
          nameEn: tags.nameEn,
          slug: tags.slug,
          color: tags.color,
          description: tags.description,
          usageCount: tags.usageCount,
          status: tags.status,
        })
        .from(articleTags)
        .innerJoin(tags, eq(articleTags.tagId, tags.id))
        .where(eq(articleTags.articleId, articleId));

      res.json(result);
    } catch (error) {
      console.error("Error fetching article tags:", error);
      res.status(500).json({ message: "فشل في جلب وسوم المقالة" });
    }
  });

  // ============================================================
  // TEST ENDPOINTS - FOR DEVELOPMENT ONLY
  // ============================================================
  
  // Test notification sending for a specific article (by ID)
  app.post("/api/test/send-notifications/:articleId", async (req, res) => {
    try {
      const { articleId } = req.params;
      
      // Get article details
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      console.log(`🧪 TEST: Sending notifications for article: ${article.title}`);
      
      // Determine notification type
      let notificationType: 'published' | 'breaking' | 'featured' = 'published';
      if (article.newsType === 'breaking') {
        notificationType = 'breaking';
      } else if (article.newsType === 'featured') {
        notificationType = 'featured';
      }
      
      // Send notifications
      await sendArticleNotification(article, notificationType);
      
      res.json({
        success: true,
        message: `Notifications sent for article: ${article.title}`,
        articleId: article.id,
        notificationType
      });
    } catch (error) {
      console.error("Error in test notification endpoint:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to send notifications",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Resend notifications for article (for admin use - requires authentication)
  app.post("/api/admin/articles/:id/resend-notification", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const articleId = req.params.id;
      
      // Get article details
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);
      
      if (!article) {
        return res.status(404).json({ message: "المقال غير موجود" });
      }
      
      if (article.status !== 'published') {
        return res.status(400).json({ message: "لا يمكن إرسال إشعارات لمقال غير منشور" });
      }
      
      console.log(`📢 Admin: Resending notifications for article: ${article.title}`);
      
      // Determine notification type
      let notificationType: 'published' | 'breaking' | 'featured' = 'published';
      if (article.newsType === 'breaking') {
        notificationType = 'breaking';
      } else if (article.newsType === 'featured') {
        notificationType = 'featured';
      }
      
      // Send notifications
      await sendArticleNotification(article, notificationType);
      
      res.json({
        success: true,
        message: `تم إرسال الإشعارات للمقال: ${article.title}`,
        articleId: article.id,
        articleTitle: article.title,
        notificationType
      });
    } catch (error) {
      console.error("Error resending notifications:", error);
      res.status(500).json({ 
        success: false,
        message: "فشل إرسال الإشعارات",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================================
  // RECOMMENDATION & EVENT TRACKING APIs
  // ============================================================

  // Track user event (view, click, share, etc.)
  app.post("/api/events/track", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { eventType, articleId, metadata } = req.body;

      if (!eventType || !articleId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await trackUserEvent({
        userId,
        articleId,
        eventType,
        metadata,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({ message: "فشل في تتبع الحدث" });
    }
  });

  // Get personalized recommendations for user (Smart Recommendations System)
  app.get(
    "/api/recommendations/personalized",
    requireAuth,
    cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM, public: false }),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        console.log(`[API] GET /api/recommendations/personalized - User: ${userId}`);

        const rawLimit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const limit = Math.min(Math.max(rawLimit, 1), 50);
        
        console.log(`[API] Requested limit: ${rawLimit}, Sanitized limit: ${limit}`);

        const recommendations = await storage.getPersonalizedRecommendations(userId, limit);

        console.log(`[API] Successfully fetched ${recommendations.length} personalized recommendations for user ${userId}`);

        res.json({ recommendations });
      } catch (error) {
        console.error("[API] Error getting personalized recommendations:", error);
        res.status(500).json({ message: "فشل في جلب التوصيات الشخصية" });
      }
    }
  );

  // Get recommendations similar to specific article
  app.get("/api/recommendations/similar/:articleId", async (req, res) => {
    try {
      const { articleId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const { findSimilarArticles } = await import('./similarityEngine');
      const similar = await findSimilarArticles(articleId, limit);

      res.json({ similar });
    } catch (error) {
      console.error("Error finding similar articles:", error);
      res.status(500).json({ message: "فشل في جلب المقالات المشابهة" });
    }
  });

  // Get trending articles
  app.get("/api/recommendations/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const { getTrendingArticles } = await import('./similarityEngine');
      const trending = await getTrendingArticles(limit);

      res.json({ trending });
    } catch (error) {
      console.error("Error getting trending articles:", error);
      res.status(500).json({ message: "فشل في جلب المقالات الرائجة" });
    }
  });

  // Get user's recommendation preferences
  app.get("/api/recommendations/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { userRecommendationPrefs } = await import('@shared/schema');

      let prefs = await db.query.userRecommendationPrefs.findFirst({
        where: eq(userRecommendationPrefs.userId, userId),
      });

      // Create default preferences if not exist
      if (!prefs) {
        const [newPrefs] = await db.insert(userRecommendationPrefs).values({
          userId,
        }).returning();
        prefs = newPrefs;
      }

      res.json({ preferences: prefs });
    } catch (error) {
      console.error("Error getting recommendation preferences:", error);
      res.status(500).json({ message: "فشل في جلب إعدادات التوصيات" });
    }
  });

  // Update user's recommendation preferences
  app.patch("/api/recommendations/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      const { userRecommendationPrefs } = await import('@shared/schema');

      // Filter only allowed fields to update (exclude id, userId, createdAt, updatedAt)
      const allowedFields = [
        'enableRecommendations',
        'enableDailyDigest',
        'digestTime',
        'minSimilarityScore',
        'enableCrossCategory',
        'enableTrending',
        'enablePersonalized',
        'maxNotificationsPerDay',
        'quietHoursStart',
        'quietHoursEnd'
      ];

      const filteredUpdates: any = {};
      for (const field of allowedFields) {
        if (field in updates) {
          filteredUpdates[field] = updates[field];
        }
      }

      // Check if preferences exist
      const existing = await db.query.userRecommendationPrefs.findFirst({
        where: eq(userRecommendationPrefs.userId, userId),
      });

      if (!existing) {
        // Create with updates
        const [newPrefs] = await db.insert(userRecommendationPrefs).values({
          userId,
          ...filteredUpdates,
        }).returning();
        return res.json({ preferences: newPrefs });
      }

      // Update existing
      const [updated] = await db
        .update(userRecommendationPrefs)
        .set(filteredUpdates)
        .where(eq(userRecommendationPrefs.userId, userId))
        .returning();

      res.json({ preferences: updated });
    } catch (error) {
      console.error("Error updating recommendation preferences:", error);
      res.status(500).json({ message: "فشل في تحديث إعدادات التوصيات" });
    }
  });

  // Get user's recommendation log (what was recommended)
  app.get("/api/recommendations/log", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const { recommendationLog } = await import('@shared/schema');

      const logs = await db.query.recommendationLog.findMany({
        where: eq(recommendationLog.userId, userId),
        orderBy: desc(recommendationLog.sentAt),
        limit,
      });

      res.json({ logs });
    } catch (error) {
      console.error("Error getting recommendation log:", error);
      res.status(500).json({ message: "فشل في جلب سجل التوصيات" });
    }
  });

  // Trigger recommendation processing for user (admin/testing)
  app.post("/api/admin/recommendations/process/:userId", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;

      const { processUserRecommendations } = await import('./recommendationNotificationService');
      await processUserRecommendations(userId);

      res.json({ success: true, message: "تم معالجة التوصيات بنجاح" });
    } catch (error) {
      console.error("Error processing recommendations:", error);
      res.status(500).json({ message: "فشل في معالجة التوصيات" });
    }
  });

  // Get user affinities (what they're interested in)
  app.get("/api/recommendations/affinities", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { userAffinities } = await import('@shared/schema');

      const affinities = await db.query.userAffinities.findMany({
        where: eq(userAffinities.userId, userId),
        orderBy: desc(userAffinities.score),
        limit: 50,
      });

      res.json({ affinities });
    } catch (error) {
      console.error("Error getting user affinities:", error);
      res.status(500).json({ message: "فشل في جلب الاهتمامات" });
    }
  });

  // ============================================================
  // DAILY DIGEST APIs
  // ============================================================

  // Get daily digest preview for user
  app.get("/api/digest/preview", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { getDigestPreview } = await import('./digestService');
      
      const digest = await getDigestPreview(userId);
      
      if (!digest) {
        return res.status(404).json({ message: "لا توجد مقالات جديدة في اهتماماتك" });
      }

      res.json({ digest });
    } catch (error) {
      console.error("Error getting digest preview:", error);
      res.status(500).json({ message: "فشل في جلب الملخص اليومي" });
    }
  });

  // Send daily digest manually (admin/testing)
  app.post("/api/admin/digest/send/:userId", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { sendDailyDigest } = await import('./digestService');
      
      const sent = await sendDailyDigest(userId);
      
      if (!sent) {
        return res.status(404).json({ message: "لا يمكن إرسال الملخص اليومي" });
      }

      res.json({ success: true, message: "تم إرسال الملخص اليومي بنجاح" });
    } catch (error) {
      console.error("Error sending digest:", error);
      res.status(500).json({ message: "فشل في إرسال الملخص اليومي" });
    }
  });

  // Process all daily digests (admin/testing)
  app.post("/api/admin/digest/process-all", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { processDailyDigests } = await import('./digestService');
      
      // Run in background
      processDailyDigests().catch(err => {
        console.error("Error in background digest processing:", err);
      });

      res.json({ success: true, message: "بدأت معالجة الملخصات اليومية" });
    } catch (error) {
      console.error("Error processing digests:", error);
      res.status(500).json({ message: "فشل في معالجة الملخصات اليومية" });
    }
  });

  // ============================================================
  // RECOMMENDATION ANALYTICS APIs
  // ============================================================

  // Get recommendation analytics (admin only)
  app.get("/api/admin/recommendations/analytics", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const daysNum = parseInt(days as string, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get total recommendations sent in the period
      const totalRecommendations = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(recommendationLog)
        .where(sql`${recommendationLog.sentAt} >= ${startDate}`);

      // Get daily recommendations count
      const dailyRecommendations = await db
        .select({
          date: sql<string>`DATE(${recommendationLog.sentAt})`,
          count: sql<number>`count(*)::int`,
        })
        .from(recommendationLog)
        .where(sql`${recommendationLog.sentAt} >= ${startDate}`)
        .groupBy(sql`DATE(${recommendationLog.sentAt})`)
        .orderBy(sql`DATE(${recommendationLog.sentAt})`);

      // Get recommendations by type/reason
      const byReason = await db
        .select({
          reason: recommendationLog.reason,
          count: sql<number>`count(*)::int`,
          avgScore: sql<number>`avg(${recommendationLog.score})::float`,
        })
        .from(recommendationLog)
        .where(sql`${recommendationLog.sentAt} >= ${startDate}`)
        .groupBy(recommendationLog.reason);

      // Get top recommended articles
      const topArticles = await db
        .select({
          articleId: recommendationLog.articleId,
          title: articles.title,
          count: sql<number>`count(*)::int`,
          avgScore: sql<number>`avg(${recommendationLog.score})::float`,
        })
        .from(recommendationLog)
        .leftJoin(articles, eq(recommendationLog.articleId, articles.id))
        .where(sql`${recommendationLog.sentAt} >= ${startDate}`)
        .groupBy(recommendationLog.articleId, articles.title)
        .orderBy(sql`count(*) DESC`)
        .limit(10);

      // Get engagement metrics (CTR)
      const engagementMetrics = await db
        .select({
          totalSent: sql<number>`count(DISTINCT ${recommendationLog.id})::int`,
          totalViewed: sql<number>`count(DISTINCT CASE WHEN ${recommendationMetrics.viewed} = true THEN ${recommendationMetrics.recommendationId} END)::int`,
          totalClicked: sql<number>`count(DISTINCT CASE WHEN ${recommendationMetrics.clicked} = true THEN ${recommendationMetrics.recommendationId} END)::int`,
        })
        .from(recommendationLog)
        .leftJoin(recommendationMetrics, eq(recommendationLog.id, recommendationMetrics.recommendationId))
        .where(sql`${recommendationLog.sentAt} >= ${startDate}`);

      // Calculate CTR (Click-Through Rate)
      const engagement = engagementMetrics[0];
      const ctr = engagement.totalSent > 0 
        ? ((engagement.totalClicked / engagement.totalSent) * 100).toFixed(2)
        : "0.00";
      const viewRate = engagement.totalSent > 0 
        ? ((engagement.totalViewed / engagement.totalSent) * 100).toFixed(2)
        : "0.00";

      // Get engagement by reason
      const engagementByReason = await db
        .select({
          reason: recommendationLog.reason,
          totalSent: sql<number>`count(DISTINCT ${recommendationLog.id})::int`,
          totalClicked: sql<number>`count(DISTINCT CASE WHEN ${recommendationMetrics.clicked} = true THEN ${recommendationMetrics.recommendationId} END)::int`,
          ctr: sql<number>`CASE WHEN count(DISTINCT ${recommendationLog.id}) > 0 THEN (count(DISTINCT CASE WHEN ${recommendationMetrics.clicked} = true THEN ${recommendationMetrics.recommendationId} END)::float / count(DISTINCT ${recommendationLog.id})::float * 100) ELSE 0 END::float`,
        })
        .from(recommendationLog)
        .leftJoin(recommendationMetrics, eq(recommendationLog.id, recommendationMetrics.recommendationId))
        .where(sql`${recommendationLog.sentAt} >= ${startDate}`)
        .groupBy(recommendationLog.reason);

      // Get unique users who received recommendations
      const uniqueUsers = await db
        .select({ count: sql<number>`count(DISTINCT ${recommendationLog.userId})::int` })
        .from(recommendationLog)
        .where(sql`${recommendationLog.sentAt} >= ${startDate}`);

      res.json({
        period: {
          days: daysNum,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        overview: {
          totalRecommendations: totalRecommendations[0].count,
          uniqueUsers: uniqueUsers[0].count,
          clickThroughRate: parseFloat(ctr),
          viewRate: parseFloat(viewRate),
          totalViewed: engagement.totalViewed,
          totalClicked: engagement.totalClicked,
        },
        dailyTrend: dailyRecommendations,
        byReason: byReason.map(r => ({
          ...r,
          avgScore: r.avgScore ? parseFloat(r.avgScore.toFixed(2)) : 0,
        })),
        topArticles: topArticles.map(a => ({
          ...a,
          avgScore: a.avgScore ? parseFloat(a.avgScore.toFixed(2)) : 0,
        })),
        engagementByReason: engagementByReason.map(e => ({
          ...e,
          ctr: parseFloat(e.ctr.toFixed(2)),
        })),
      });
    } catch (error) {
      console.error("Error getting recommendation analytics:", error);
      res.status(500).json({ message: "فشل في جلب إحصائيات التوصيات" });
    }
  });

  // ============================================================
  // AI ARTICLE CLASSIFICATION ENDPOINTS
  // ============================================================

  // POST /api/articles/:id/auto-categorize - Auto-categorize article using AI
  app.post("/api/articles/:id/auto-categorize", requireAuth, requireAnyPermission("articles.edit", "system.admin"), async (req: any, res) => {
    try {
      const { id } = req.params;

      // Get article
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, id))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "المقال غير موجود" });
      }

      // Get all active categories
      const activeCategories = await db
        .select({
          id: categories.id,
          slug: categories.slug,
          nameAr: categories.nameAr,
          nameEn: categories.nameEn,
        })
        .from(categories)
        .where(eq(categories.status, "active"));

      if (activeCategories.length === 0) {
        return res.status(400).json({ message: "لا توجد تصنيفات متاحة" });
      }

      // Classify article using AI
      const classification = await classifyArticle(
        article.title,
        article.content,
        activeCategories
      );

      // Delete existing smart category assignments for this article
      await db
        .delete(articleSmartCategories)
        .where(eq(articleSmartCategories.articleId, id));

      // Insert primary category
      await db
        .insert(articleSmartCategories)
        .values({
          id: randomUUID(),
          articleId: id,
          categoryId: classification.primaryCategory.categoryId,
          score: classification.primaryCategory.confidence,
          assignedAt: new Date(),
        });

      // Insert suggested categories
      for (const suggestion of classification.suggestedCategories) {
        await db
          .insert(articleSmartCategories)
          .values({
            id: randomUUID(),
            articleId: id,
            categoryId: suggestion.categoryId,
            score: suggestion.confidence,
            assignedAt: new Date(),
          });
      }

      // Log activity
      await logActivity({
        userId: req.user?.id,
        action: "auto_categorize_article",
        entityType: "article",
        entityId: id,
        newValue: {
          primary: classification.primaryCategory.categoryName,
          suggested: classification.suggestedCategories.map(s => s.categoryName),
        },
      });

      res.json({
        success: true,
        primaryCategory: classification.primaryCategory,
        suggestedCategories: classification.suggestedCategories,
        provider: classification.provider,
        model: classification.model,
      });
    } catch (error) {
      console.error("Error auto-categorizing article:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "فشل في تصنيف المقال تلقائياً",
      });
    }
  });

  // Zod schema for draft classification
  const classifyDraftSchema = z.object({
    title: z.string().min(10, "العنوان يجب أن يكون 10 أحرف على الأقل").max(200, "العنوان يجب أن يكون أقل من 200 حرف"),
    content: z.string().min(100, "المحتوى يجب أن يكون 100 حرف على الأقل"),
    language: z.enum(["ar", "en", "ur"]).default("ar"),
  });

  // POST /api/articles/auto-classify-draft - Auto-classify draft article (before saving)
  app.post("/api/articles/auto-classify-draft", strictLimiter, requireAuth, requireAnyPermission("articles.create", "system.admin"), async (req: any, res) => {
    try {
      // Validate request body
      const { title, content, language } = classifyDraftSchema.parse(req.body);
      console.log('[Classification] Draft classification request:', { titleLength: title.length, contentLength: content.length, language });

      // Get all active categories
      const activeCategories = await db
        .select({
          id: categories.id,
          slug: categories.slug,
          nameAr: categories.nameAr,
          nameEn: categories.nameEn,
        })
        .from(categories)
        .where(eq(categories.status, "active"));

      if (activeCategories.length === 0) {
        return res.status(400).json({ message: "لا توجد تصنيفات متاحة" });
      }

      // Classify using AI (same logic as saved articles, but without article ID)
      const classification = await classifyArticle(title, content, activeCategories);

      console.log('[Classification] Draft classification successful:', {
        primary: classification.primaryCategory.categoryName,
        confidence: classification.primaryCategory.confidence,
      });

      // Return classification results without saving to database
      res.json({
        success: true,
        primaryCategory: classification.primaryCategory,
        suggestedCategories: classification.suggestedCategories,
        provider: classification.provider,
        model: classification.model,
      });
    } catch (error) {
      console.error("Error auto-classifying draft:", error);
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return res.status(400).json({
          success: false,
          message: firstError.message,
        });
      }
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "فشل في تصنيف المقال تلقائياً",
      });
    }
  });

  // ============================================================
  // SEO GENERATION ENDPOINTS
  // ============================================================

  // Zod schema for SEO generation (supports both saved articles and draft data)
  const seoGenerateSchema = z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal("saved"),
      articleId: z.string(),
      language: z.enum(["ar", "en", "ur"]).default("ar"),
    }),
    z.object({
      mode: z.literal("draft"),
      draftData: z.object({
        title: z.string().min(10, "العنوان يجب أن يكون 10 أحرف على الأقل").max(200, "العنوان يجب أن يكون أقل من 200 حرف"),
        content: z.string().min(100, "المحتوى يجب أن يكون 100 حرف على الأقل"),
        excerpt: z.string().optional(),
      }),
      language: z.enum(["ar", "en", "ur"]).default("ar"),
    }),
  ]);

  // POST /api/seo/generate - Generate SEO metadata for article using AI (supports draft mode)
  app.post("/api/seo/generate", strictLimiter, requireAuth, requireAnyPermission("articles.create", "system.admin"), async (req: any, res) => {
    try {
      // Validate request body using Zod schema
      const validated = seoGenerateSchema.parse(req.body);
      console.log('[SEO] Generation request:', { mode: validated.mode, language: validated.language });

      if (validated.mode === "saved") {
        // Existing flow: generate SEO for saved article
        const { articleId, language } = validated;

        // Fetch article using storage method
        const article = await storage.getArticleForSeo(articleId, language);

        if (!article) {
          return res.status(404).json({ message: "المقال غير موجود" });
        }

        // Generate SEO metadata using AI
        const seoResult = await generateSeoMetadata({
          id: articleId,
          title: article.title,
          subtitle: article.subtitle || undefined,
          content: article.content,
          excerpt: article.excerpt || undefined,
        }, language);

        // Prepare SEO content and metadata
        const seoContent = {
          metaTitle: seoResult.content.metaTitle,
          metaDescription: seoResult.content.metaDescription,
          keywords: seoResult.content.keywords,
          socialTitle: seoResult.content.socialTitle,
          socialDescription: seoResult.content.socialDescription,
          imageAltText: seoResult.content.imageAltText,
          ogImageUrl: seoResult.content.ogImageUrl,
        };

        const seoMetadata = {
          status: "generated" as const,
          generatedAt: new Date().toISOString(),
          generatedBy: req.user?.id,
          provider: seoResult.provider,
          model: seoResult.model,
          manualOverride: false,
        };

        // Save SEO metadata to article
        await storage.saveSeoMetadata(
          articleId,
          language,
          seoContent,
          seoMetadata
        );

        // Create history entry
        await storage.createSeoHistoryEntry({
          articleId,
          language,
          seoContent,
          seoMetadata,
          provider: seoResult.provider,
          model: seoResult.model,
          generatedBy: req.user?.id,
        });

        // Log activity
        await logActivity({
          userId: req.user?.id,
          action: "generate_seo_metadata",
          entityType: "article",
          entityId: articleId,
        });

        console.log('[SEO] Generated and saved for article:', articleId);
        res.json({
          success: true,
          seo: seoContent,
          metadata: seoMetadata,
          provider: seoResult.provider,
          model: seoResult.model,
        });
      } else {
        // Draft mode: generate SEO without saving to database
        const { draftData, language } = validated;
        console.log('[SEO] Generating for draft (no save):', { titleLength: draftData.title.length, contentLength: draftData.content.length });

        // Generate SEO metadata using AI
        const seoResult = await generateSeoMetadata({
          id: "draft-" + Date.now(), // Temporary ID for draft
          title: draftData.title,
          subtitle: undefined,
          content: draftData.content,
          excerpt: draftData.excerpt || undefined,
        }, language);

        // Prepare SEO content (no metadata needed for draft)
        const seoContent = {
          metaTitle: seoResult.content.metaTitle,
          metaDescription: seoResult.content.metaDescription,
          keywords: seoResult.content.keywords,
          socialTitle: seoResult.content.socialTitle,
          socialDescription: seoResult.content.socialDescription,
          imageAltText: seoResult.content.imageAltText,
          ogImageUrl: seoResult.content.ogImageUrl,
        };

        console.log('[SEO] Draft generation successful');
        
        // Return results without saving to database
        res.json({
          success: true,
          seo: seoContent,
          provider: seoResult.provider,
          model: seoResult.model,
        });
      }
    } catch (error) {
      console.error("Error generating SEO metadata:", error);
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return res.status(400).json({
          success: false,
          message: firstError.message,
        });
      }
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "فشل في توليد البيانات الوصفية لتحسين محركات البحث",
      });
    }
  });

  // ============================================================
  // SENTIMENT ANALYSIS ENDPOINTS
  // ============================================================

  // POST /api/comments/:id/analyze-sentiment - Analyze single comment
  app.post("/api/comments/:id/analyze-sentiment", requireAuth, requireAnyPermission("comments.moderate", "system.admin"), async (req: any, res) => {
    try {
      const { id } = req.params;

      // Validate comment exists
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "التعليق غير موجود" });
      }

      // Detect language and analyze sentiment
      const language = detectLanguage(comment.content);
      const result = await analyzeSentiment(comment.content, language);

      // Save sentiment analysis to comment_sentiments table
      const [sentimentRecord] = await db
        .insert(commentSentiments)
        .values({
          id: randomUUID(),
          commentId: id,
          sentiment: result.sentiment,
          confidence: result.confidence,
          provider: result.provider,
          model: result.model,
          language: language,
          rawMetadata: result.rawMetadata,
          analyzedAt: new Date(),
        })
        .returning();

      // Update comment's current sentiment fields
      await db
        .update(comments)
        .set({
          currentSentiment: result.sentiment,
          currentSentimentConfidence: result.confidence,
          sentimentAnalyzedAt: new Date(),
        })
        .where(eq(comments.id, id));

      // Log activity
      await logActivity({
        userId: req.user?.id,
        action: "analyze_sentiment",
        entityType: "comment",
        entityId: id,
        newValue: { sentiment: result.sentiment, confidence: result.confidence },
      });

      res.json({
        success: true,
        sentiment: result.sentiment,
        confidence: result.confidence,
        provider: result.provider,
        model: result.model,
      });
    } catch (error) {
      console.error("Error analyzing comment sentiment:", error);
      res.status(500).json({ 
        success: false,
        message: "فشل في تحليل مشاعر التعليق" 
      });
    }
  });

  // POST /api/comments/analyze-batch - Analyze multiple comments
  app.post("/api/comments/analyze-batch", requireAuth, requireAnyPermission("comments.moderate", "system.admin"), async (req: any, res) => {
    try {
      // Validate request body
      const bodySchema = z.object({
        commentIds: z.array(z.string()).min(1).max(100),
      });

      const { commentIds } = bodySchema.parse(req.body);

      // Fetch all comments
      const commentsToAnalyze = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, commentIds));

      if (commentsToAnalyze.length === 0) {
        return res.status(404).json({ message: "لم يتم العثور على تعليقات" });
      }

      // Process comments in parallel with concurrency limit of 3
      const limit = pLimit(3);
      const results = await Promise.allSettled(
        commentsToAnalyze.map(comment =>
          limit(async () => {
            try {
              // Detect language and analyze sentiment
              const language = detectLanguage(comment.content);
              const result = await analyzeSentiment(comment.content, language);

              // Save sentiment analysis
              await db.insert(commentSentiments).values({
                id: randomUUID(),
                commentId: comment.id,
                sentiment: result.sentiment,
                confidence: result.confidence,
                provider: result.provider,
                model: result.model,
                language: language,
                rawMetadata: result.rawMetadata,
                analyzedAt: new Date(),
              });

              // Update comment's current sentiment
              await db
                .update(comments)
                .set({
                  currentSentiment: result.sentiment,
                  currentSentimentConfidence: result.confidence,
                  sentimentAnalyzedAt: new Date(),
                })
                .where(eq(comments.id, comment.id));

              return {
                commentId: comment.id,
                success: true,
                sentiment: result.sentiment,
                confidence: result.confidence,
                provider: result.provider,
                model: result.model,
              };
            } catch (error: any) {
              return {
                commentId: comment.id,
                success: false,
                error: error.message || "فشل التحليل",
              };
            }
          })
        )
      );

      // Map results
      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            commentId: commentsToAnalyze[index].id,
            success: false,
            error: result.reason?.message || "فشل التحليل",
          };
        }
      });

      // Log activity
      await logActivity({
        userId: req.user?.id,
        action: "batch_analyze_sentiment",
        entityType: "comment",
        entityId: "batch",
        newValue: { 
          total: commentIds.length,
          successful: processedResults.filter(r => r.success).length,
          failed: processedResults.filter(r => !r.success).length,
        },
      });

      res.json({
        success: true,
        results: processedResults,
        summary: {
          total: commentIds.length,
          successful: processedResults.filter(r => r.success).length,
          failed: processedResults.filter(r => !r.success).length,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "بيانات الطلب غير صالحة",
          errors: error.errors,
        });
      }

      console.error("Error in batch sentiment analysis:", error);
      res.status(500).json({ 
        success: false,
        message: "فشل في تحليل المشاعر" 
      });
    }
  });

  // GET /api/comments/:id/sentiment-history - Get sentiment analysis history
  app.get("/api/comments/:id/sentiment-history", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Validate comment exists
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "التعليق غير موجود" });
      }

      // Get sentiment history
      const history = await db
        .select({
          id: commentSentiments.id,
          sentiment: commentSentiments.sentiment,
          confidence: commentSentiments.confidence,
          provider: commentSentiments.provider,
          model: commentSentiments.model,
          language: commentSentiments.language,
          analyzedAt: commentSentiments.analyzedAt,
        })
        .from(commentSentiments)
        .where(eq(commentSentiments.commentId, id))
        .orderBy(desc(commentSentiments.analyzedAt));

      res.json({
        commentId: id,
        currentSentiment: comment.currentSentiment,
        currentConfidence: comment.currentSentimentConfidence,
        lastAnalyzedAt: comment.sentimentAnalyzedAt,
        history: history,
      });
    } catch (error) {
      console.error("Error getting sentiment history:", error);
      res.status(500).json({ message: "فشل في جلب سجل تحليل المشاعر" });
    }
  });

  // GET /api/sentiment/analytics - Get sentiment analytics dashboard data
  app.get("/api/sentiment/analytics", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const { days = 30 } = req.query;
      const daysNum = parseInt(days as string, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Overall sentiment distribution
      const distribution = await db
        .select({
          sentiment: comments.currentSentiment,
          count: sql<number>`count(*)::int`,
        })
        .from(comments)
        .where(
          and(
            isNotNull(comments.currentSentiment),
            gte(comments.sentimentAnalyzedAt, startDate)
          )
        )
        .groupBy(comments.currentSentiment);

      // Sentiment trend over time (last N days)
      const trend = await db
        .select({
          date: sql<string>`DATE(${comments.sentimentAnalyzedAt})`,
          sentiment: comments.currentSentiment,
          count: sql<number>`count(*)::int`,
        })
        .from(comments)
        .where(
          and(
            isNotNull(comments.currentSentiment),
            gte(comments.sentimentAnalyzedAt, startDate)
          )
        )
        .groupBy(sql`DATE(${comments.sentimentAnalyzedAt})`, comments.currentSentiment)
        .orderBy(sql`DATE(${comments.sentimentAnalyzedAt})`);

      // Top articles by sentiment (most positive and most negative)
      const articleSentiment = await db
        .select({
          articleId: comments.articleId,
          articleTitle: articles.title,
          positiveCount: sql<number>`count(*) FILTER (WHERE ${comments.currentSentiment} = 'positive')::int`,
          neutralCount: sql<number>`count(*) FILTER (WHERE ${comments.currentSentiment} = 'neutral')::int`,
          negativeCount: sql<number>`count(*) FILTER (WHERE ${comments.currentSentiment} = 'negative')::int`,
          totalComments: sql<number>`count(*)::int`,
          avgConfidence: sql<number>`avg(${comments.currentSentimentConfidence})::float`,
        })
        .from(comments)
        .leftJoin(articles, eq(comments.articleId, articles.id))
        .where(
          and(
            isNotNull(comments.currentSentiment),
            gte(comments.sentimentAnalyzedAt, startDate)
          )
        )
        .groupBy(comments.articleId, articles.title)
        .orderBy(sql`count(*) DESC`)
        .limit(20);

      // Calculate overall stats
      const totalAnalyzed = distribution.reduce((sum, item) => sum + item.count, 0);
      const positiveCount = distribution.find(d => d.sentiment === 'positive')?.count || 0;
      const neutralCount = distribution.find(d => d.sentiment === 'neutral')?.count || 0;
      const negativeCount = distribution.find(d => d.sentiment === 'negative')?.count || 0;

      res.json({
        period: {
          days: daysNum,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        overview: {
          totalAnalyzed,
          distribution: {
            positive: positiveCount,
            neutral: neutralCount,
            negative: negativeCount,
            positivePercentage: totalAnalyzed > 0 ? ((positiveCount / totalAnalyzed) * 100).toFixed(2) : "0.00",
            neutralPercentage: totalAnalyzed > 0 ? ((neutralCount / totalAnalyzed) * 100).toFixed(2) : "0.00",
            negativePercentage: totalAnalyzed > 0 ? ((negativeCount / totalAnalyzed) * 100).toFixed(2) : "0.00",
          },
        },
        trend: trend,
        topArticles: articleSentiment.map(a => ({
          articleId: a.articleId,
          title: a.articleTitle,
          positive: a.positiveCount,
          neutral: a.neutralCount,
          negative: a.negativeCount,
          total: a.totalComments,
          avgConfidence: a.avgConfidence ? parseFloat(a.avgConfidence.toFixed(2)) : 0,
          sentimentScore: a.totalComments > 0 
            ? (((a.positiveCount - a.negativeCount) / a.totalComments) * 100).toFixed(2)
            : "0.00",
        })),
      });
    } catch (error) {
      console.error("Error getting sentiment analytics:", error);
      res.status(500).json({ message: "فشل في جلب تحليلات المشاعر" });
    }
  });

  // ============================================================
  // STORY MANAGEMENT ROUTES
  // ============================================================

  // GET /api/stories - جلب جميع القصص
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getAllStories({ status: 'active' });
      res.json(stories);
    } catch (error) {
      console.error("Error getting stories:", error);
      res.status(500).json({ message: "فشل في جلب القصص" });
    }
  });

  // GET /api/stories/:slug - جلب قصة واحدة
  app.get("/api/stories/:slug", async (req, res) => {
    try {
      const story = await storage.getStoryBySlug(req.params.slug);
      if (!story) return res.status(404).json({ message: "القصة غير موجودة" });
      res.json(story);
    } catch (error) {
      console.error("Error getting story:", error);
      res.status(500).json({ message: "فشل في جلب القصة" });
    }
  });

  // POST /api/stories - إنشاء قصة (للمشرفين)
  app.post("/api/stories", requireAuth, requireRole('admin', 'editor'), async (req: any, res) => {
    try {
      const data = insertStorySchema.parse(req.body);
      const story = await storage.createStory(data);
      await logActivity({
        userId: req.user?.id,
        action: 'StoryCreated',
        entityType: 'Story',
        entityId: story.id,
      });
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "فشل في إنشاء القصة" });
    }
  });

  // PUT /api/stories/:id - تحديث قصة
  app.put("/api/stories/:id", requireAuth, requireRole('admin', 'editor'), async (req: any, res) => {
    try {
      const story = await storage.updateStory(req.params.id, req.body);
      await logActivity({
        userId: req.user?.id,
        action: 'StoryUpdated',
        entityType: 'Story',
        entityId: req.params.id,
      });
      res.json(story);
    } catch (error) {
      console.error("Error updating story:", error);
      res.status(500).json({ message: "فشل في تحديث القصة" });
    }
  });

  // DELETE /api/stories/:id - حذف قصة
  app.delete("/api/stories/:id", requireAuth, requireRole('admin', 'editor'), async (req: any, res) => {
    try {
      await storage.deleteStory(req.params.id);
      await logActivity({
        userId: req.user?.id,
        action: 'StoryDeleted',
        entityType: 'Story',
        entityId: req.params.id,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ message: "فشل في حذف القصة" });
    }
  });

  // ============================================================
  // STORY TIMELINE ROUTES
  // ============================================================

  // GET /api/stories/:storyId/timeline - الأخبار المرتبطة بالقصة
  app.get("/api/stories/:storyId/timeline", async (req, res) => {
    try {
      const links = await storage.getStoryLinks(req.params.storyId);
      res.json(links);
    } catch (error) {
      console.error("Error getting story timeline:", error);
      res.status(500).json({ message: "فشل في جلب الأخبار المرتبطة" });
    }
  });

  // POST /api/stories/:storyId/links - ربط خبر بقصة (للمشرفين)
  app.post("/api/stories/:storyId/links", requireAuth, requireRole('admin', 'editor'), async (req, res) => {
    try {
      const data = insertStoryLinkSchema.parse({
        ...req.body,
        storyId: req.params.storyId
      });
      const link = await storage.createStoryLink(data);
      res.json(link);
    } catch (error) {
      console.error("Error creating story link:", error);
      res.status(500).json({ message: "فشل في ربط الخبر بالقصة" });
    }
  });

  // DELETE /api/stories/links/:linkId - إزالة ربط
  app.delete("/api/stories/links/:linkId", requireAuth, requireRole('admin', 'editor'), async (req, res) => {
    try {
      await storage.deleteStoryLink(req.params.linkId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting story link:", error);
      res.status(500).json({ message: "فشل في إزالة الربط" });
    }
  });

  // ============================================================
  // STORY FOLLOWING ROUTES
  // ============================================================

  // POST /api/stories/:storyId/follow - متابعة قصة
  app.post("/api/stories/:storyId/follow", requireAuth, async (req: any, res) => {
    try {
      const follow = await storage.followStory({
        userId: req.user?.id,
        storyId: req.params.storyId,
        level: req.body.level || 'all',
        channels: req.body.channels || ['inapp'],
      });
      await logActivity({
        userId: req.user?.id,
        action: 'StoryFollowed',
        entityType: 'Story',
        entityId: req.params.storyId,
      });
      res.json(follow);
    } catch (error) {
      console.error("Error following story:", error);
      res.status(500).json({ message: "فشل في متابعة القصة" });
    }
  });

  // DELETE /api/stories/:storyId/follow - إلغاء متابعة قصة
  app.delete("/api/stories/:storyId/follow", requireAuth, async (req: any, res) => {
    try {
      await storage.unfollowStory(req.user?.id, req.params.storyId);
      await logActivity({
        userId: req.user?.id,
        action: 'StoryUnfollowed',
        entityType: 'Story',
        entityId: req.params.storyId,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing story:", error);
      res.status(500).json({ message: "فشل في إلغاء متابعة القصة" });
    }
  });

  // GET /api/stories/my-follows - قصصي المتابعة
  app.get("/api/stories/my-follows", requireAuth, async (req: any, res) => {
    try {
      const follows = await storage.getStoryFollows(req.user?.id);
      res.json(follows);
    } catch (error) {
      console.error("Error getting user story follows:", error);
      res.status(500).json({ message: "فشل في جلب القصص المتابعة" });
    }
  });

  // PUT /api/stories/follows/:storyId - تحديث إعدادات المتابعة
  app.put("/api/stories/follows/:storyId", requireAuth, async (req: any, res) => {
    try {
      const follow = await storage.updateStoryFollow(req.user?.id, req.params.storyId, req.body);
      res.json(follow);
    } catch (error) {
      console.error("Error updating story follow settings:", error);
      res.status(500).json({ message: "فشل في تحديث إعدادات المتابعة" });
    }
  });

  // GET /api/stories/:storyId/is-following - هل أتابع هذه القصة؟
  app.get("/api/stories/:storyId/is-following", requireAuth, async (req: any, res) => {
    try {
      const isFollowing = await storage.isFollowingStory(req.user?.id, req.params.storyId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking story follow status:", error);
      res.status(500).json({ message: "فشل في التحقق من حالة المتابعة" });
    }
  });

  // POST /api/admin/stories/link-existing - ربط المقالات الموجودة بقصص (للإدمن فقط)
  app.post("/api/admin/stories/link-existing", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      console.log("[ADMIN] Starting to link existing articles to stories...");
      
      // جلب جميع المقالات المنشورة
      const publishedArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.publishedAt));

      console.log(`[ADMIN] Found ${publishedArticles.length} published articles`);

      const { matchAndLinkArticle } = await import("./storyMatcher");
      let successCount = 0;
      let errorCount = 0;

      // ربط كل مقال بقصة
      for (const article of publishedArticles) {
        try {
          console.log(`[ADMIN] Processing article: ${article.title}`);
          await matchAndLinkArticle(article.id);
          successCount++;
        } catch (error) {
          console.error(`[ADMIN] Error linking article ${article.id}:`, error);
          errorCount++;
        }
      }

      console.log(`[ADMIN] Finished! Success: ${successCount}, Errors: ${errorCount}`);

      res.json({
        success: true,
        message: `تم ربط ${successCount} مقال بقصص بنجاح`,
        stats: {
          total: publishedArticles.length,
          success: successCount,
          errors: errorCount
        }
      });
    } catch (error) {
      console.error("[ADMIN] Error in link-existing:", error);
      res.status(500).json({ message: "فشل في ربط المقالات بالقصص" });
    }
  });

  // ============================================================
  // MIRQAB ROUTES - المرقاب (AI-Powered Forecasting)
  // ============================================================

  // GENERAL MIRQAB ENTRY ROUTES

  // GET /api/mirqab/entries - List Mirqab entries (with filters)
  app.get("/api/mirqab/entries", async (req, res) => {
    try {
      const { type, status, limit, offset } = req.query;
      const entries = await storage.getMirqabEntries({
        type: type as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });
      res.json(entries);
    } catch (error) {
      console.error("Error fetching Mirqab entries:", error);
      res.status(500).json({ message: "فشل في جلب مدخلات المرقاب" });
    }
  });

  // GET /api/mirqab/entries/:id - Get single Mirqab entry by ID
  app.get("/api/mirqab/entries/:id", async (req, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "المدخل غير موجود" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching Mirqab entry:", error);
      res.status(500).json({ message: "فشل في جلب المدخل" });
    }
  });

  // DELETE /api/mirqab/entries/:id - Delete Mirqab entry
  app.delete("/api/mirqab/entries/:id", requireAuth, requirePermission('mirqab.delete'), async (req: any, res) => {
    try {
      await storage.deleteMirqabEntry(req.params.id);
      
      await logActivity({
        userId: req.user?.id,
        action: 'delete_mirqab_entry',
        entityType: 'mirqab_entry',
        entityId: req.params.id
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting Mirqab entry:", error);
      res.status(500).json({ message: "فشل في حذف المدخل" });
    }
  });

  // GET /api/mirqab/entries/slug/:slug - Get single Mirqab entry by slug
  app.get("/api/mirqab/entries/slug/:slug", async (req, res) => {
    try {
      const entry = await storage.getMirqabEntryBySlug(req.params.slug);
      if (!entry) {
        return res.status(404).json({ message: "المدخل غير موجود" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching Mirqab entry by slug:", error);
      res.status(500).json({ message: "فشل في جلب المدخل" });
    }
  });

  // SABQ INDEX ROUTES - مؤشر سبق

  // GET /api/mirqab/sabq-index - List SABQ Indexes
  app.get("/api/mirqab/sabq-index", async (req, res) => {
    try {
      const { limit } = req.query;
      const indexes = await storage.getLatestSabqIndexes(
        limit ? parseInt(limit as string) : 10
      );
      res.json(indexes);
    } catch (error) {
      console.error("Error fetching SABQ indexes:", error);
      res.status(500).json({ message: "فشل في جلب مؤشرات سبق" });
    }
  });

  // GET /api/mirqab/sabq-index/:id - Get single SABQ Index
  app.get("/api/mirqab/sabq-index/:id", async (req, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'sabq_index') {
        return res.status(404).json({ message: "المؤشر غير موجود" });
      }
      
      const indexData = await storage.getSabqIndexByEntryId(entry.id);
      res.json({ ...entry, indexData });
    } catch (error) {
      console.error("Error fetching SABQ index:", error);
      res.status(500).json({ message: "فشل في جلب المؤشر" });
    }
  });

  // POST /api/mirqab/sabq-index - Create SABQ Index
  app.post("/api/mirqab/sabq-index", requireAuth, requirePermission('mirqab.create'), async (req: any, res) => {
    try {
      const entryData = insertMirqabEntrySchema.parse({
        ...req.body.entry,
        entryType: 'sabq_index',
        slug: generateSlug(req.body.entry.title),
        authorId: req.user?.id,
      });
      
      const entry = await storage.createMirqabEntry(entryData);
      
      const indexData = insertMirqabSabqIndexSchema.parse({
        ...req.body.indexData,
        entryId: entry.id,
      });
      
      const sabqIndex = await storage.createSabqIndex(indexData);
      
      await logActivity({
        userId: req.user?.id,
        action: 'create_sabq_index',
        entityType: 'mirqab_entry',
        entityId: entry.id,
        newValue: { title: entry.title }
      });
      
      res.status(201).json({ entry, indexData: sabqIndex });
    } catch (error) {
      console.error("Error creating SABQ index:", error);
      res.status(500).json({ message: "فشل في إنشاء المؤشر" });
    }
  });

  // PUT /api/mirqab/sabq-index/:id - Update SABQ Index
  app.put("/api/mirqab/sabq-index/:id", requireAuth, requirePermission('mirqab.edit'), async (req: any, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'sabq_index') {
        return res.status(404).json({ message: "المؤشر غير موجود" });
      }
      
      if (req.body.entry) {
        const entryUpdates = updateMirqabEntrySchema.parse({
          ...req.body.entry,
          editorId: req.user?.id,
        });
        await storage.updateMirqabEntry(req.params.id, entryUpdates);
      }
      
      if (req.body.indexData) {
        const indexData = await storage.getSabqIndexByEntryId(req.params.id);
        if (indexData) {
          const indexUpdates = updateMirqabSabqIndexSchema.parse(req.body.indexData);
          await storage.updateSabqIndex(indexData.id, indexUpdates);
        }
      }
      
      await logActivity({
        userId: req.user?.id,
        action: 'update_sabq_index',
        entityType: 'mirqab_entry',
        entityId: req.params.id,
        newValue: { title: entry.title }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating SABQ index:", error);
      res.status(500).json({ message: "فشل في تحديث المؤشر" });
    }
  });

  // DELETE /api/mirqab/sabq-index/:id - Delete SABQ Index
  app.delete("/api/mirqab/sabq-index/:id", requireAuth, requirePermission('mirqab.delete'), async (req: any, res) => {
    try {
      await storage.deleteMirqabEntry(req.params.id);
      
      await logActivity({
        userId: req.user?.id,
        action: 'delete_sabq_index',
        entityType: 'mirqab_entry',
        entityId: req.params.id
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting SABQ index:", error);
      res.status(500).json({ message: "فشل في حذف المؤشر" });
    }
  });

  // NEXT STORY ROUTES - قصة قادمة

  // GET /api/mirqab/next-stories - List Next Stories
  app.get("/api/mirqab/next-stories", async (req, res) => {
    try {
      const { limit } = req.query;
      const stories = await storage.getUpcomingNextStories(
        limit ? parseInt(limit as string) : 10
      );
      res.json(stories);
    } catch (error) {
      console.error("Error fetching next stories:", error);
      res.status(500).json({ message: "فشل في جلب القصص القادمة" });
    }
  });

  // GET /api/mirqab/next-stories/:id - Get single Next Story
  app.get("/api/mirqab/next-stories/:id", async (req, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'next_story') {
        return res.status(404).json({ message: "القصة غير موجودة" });
      }
      
      const storyData = await storage.getNextStoryByEntryId(entry.id);
      res.json({ ...entry, storyData });
    } catch (error) {
      console.error("Error fetching next story:", error);
      res.status(500).json({ message: "فشل في جلب القصة" });
    }
  });

  // POST /api/mirqab/next-stories - Create Next Story
  app.post("/api/mirqab/next-stories", requireAuth, requirePermission('mirqab.create'), async (req: any, res) => {
    try {
      const entryData = insertMirqabEntrySchema.parse({
        ...req.body.entry,
        entryType: 'next_story',
        slug: generateSlug(req.body.entry.title),
        authorId: req.user?.id,
      });
      
      const entry = await storage.createMirqabEntry(entryData);
      
      const storyData = insertMirqabNextStorySchema.parse({
        ...req.body.storyData,
        entryId: entry.id,
      });
      
      const nextStory = await storage.createNextStory(storyData);
      
      await logActivity({
        userId: req.user?.id,
        action: 'create_next_story',
        entityType: 'mirqab_entry',
        entityId: entry.id,
        newValue: { title: entry.title }
      });
      
      res.status(201).json({ entry, storyData: nextStory });
    } catch (error) {
      console.error("Error creating next story:", error);
      res.status(500).json({ message: "فشل في إنشاء القصة" });
    }
  });

  // PUT /api/mirqab/next-stories/:id - Update Next Story
  app.put("/api/mirqab/next-stories/:id", requireAuth, requirePermission('mirqab.edit'), async (req: any, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'next_story') {
        return res.status(404).json({ message: "القصة غير موجودة" });
      }
      
      if (req.body.entry) {
        const entryUpdates = updateMirqabEntrySchema.parse({
          ...req.body.entry,
          editorId: req.user?.id,
        });
        await storage.updateMirqabEntry(req.params.id, entryUpdates);
      }
      
      if (req.body.storyData) {
        const storyData = await storage.getNextStoryByEntryId(req.params.id);
        if (storyData) {
          const storyUpdates = updateMirqabNextStorySchema.parse(req.body.storyData);
          await storage.updateNextStory(storyData.id, storyUpdates);
        }
      }
      
      await logActivity({
        userId: req.user?.id,
        action: 'update_next_story',
        entityType: 'mirqab_entry',
        entityId: req.params.id,
        newValue: { title: entry.title }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating next story:", error);
      res.status(500).json({ message: "فشل في تحديث القصة" });
    }
  });

  // DELETE /api/mirqab/next-stories/:id - Delete Next Story
  app.delete("/api/mirqab/next-stories/:id", requireAuth, requirePermission('mirqab.delete'), async (req: any, res) => {
    try {
      await storage.deleteMirqabEntry(req.params.id);
      
      await logActivity({
        userId: req.user?.id,
        action: 'delete_next_story',
        entityType: 'mirqab_entry',
        entityId: req.params.id
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting next story:", error);
      res.status(500).json({ message: "فشل في حذف القصة" });
    }
  });

  // RADAR ALERT ROUTES - الرادار

  // GET /api/mirqab/radar - List Radar Reports
  app.get("/api/mirqab/radar", async (req, res) => {
    try {
      const { limit } = req.query;
      const reports = await storage.getLatestRadarReports(
        limit ? parseInt(limit as string) : 10
      );
      res.json(reports);
    } catch (error) {
      console.error("Error fetching radar reports:", error);
      res.status(500).json({ message: "فشل في جلب تقارير الرادار" });
    }
  });

  // GET /api/mirqab/radar/today - Get today's radar report
  app.get("/api/mirqab/radar/today", async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const report = await storage.getRadarReportByDate(today);
      res.json(report || null);
    } catch (error) {
      console.error("Error fetching today's radar report:", error);
      res.status(500).json({ message: "فشل في جلب تقرير اليوم" });
    }
  });

  // GET /api/mirqab/radar/:id - Get single Radar Report
  app.get("/api/mirqab/radar/:id", async (req, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'radar') {
        return res.status(404).json({ message: "التقرير غير موجود" });
      }
      
      const radarData = await storage.getRadarReportByEntryId(entry.id);
      res.json({ ...entry, radarData });
    } catch (error) {
      console.error("Error fetching radar report:", error);
      res.status(500).json({ message: "فشل في جلب التقرير" });
    }
  });

  // POST /api/mirqab/radar - Create Radar Report
  app.post("/api/mirqab/radar", requireAuth, requirePermission('mirqab.create'), async (req: any, res) => {
    try {
      const entryData = insertMirqabEntrySchema.parse({
        ...req.body.entry,
        entryType: 'radar',
        slug: generateSlug(req.body.entry.title),
        authorId: req.user?.id,
      });
      
      const entry = await storage.createMirqabEntry(entryData);
      
      const radarData = insertMirqabRadarAlertSchema.parse({
        ...req.body.radarData,
        entryId: entry.id,
      });
      
      const radarReport = await storage.createRadarReport(radarData);
      
      await logActivity({
        userId: req.user?.id,
        action: 'create_radar_report',
        entityType: 'mirqab_entry',
        entityId: entry.id,
        newValue: { title: entry.title }
      });
      
      res.status(201).json({ entry, radarData: radarReport });
    } catch (error) {
      console.error("Error creating radar report:", error);
      res.status(500).json({ message: "فشل في إنشاء التقرير" });
    }
  });

  // PUT /api/mirqab/radar/:id - Update Radar Report
  app.put("/api/mirqab/radar/:id", requireAuth, requirePermission('mirqab.edit'), async (req: any, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'radar') {
        return res.status(404).json({ message: "التقرير غير موجود" });
      }
      
      if (req.body.entry) {
        const entryUpdates = updateMirqabEntrySchema.parse({
          ...req.body.entry,
          editorId: req.user?.id,
        });
        await storage.updateMirqabEntry(req.params.id, entryUpdates);
      }
      
      if (req.body.radarData) {
        const radarData = await storage.getRadarReportByEntryId(req.params.id);
        if (radarData) {
          const radarUpdates = updateMirqabRadarAlertSchema.parse(req.body.radarData);
          await storage.updateRadarReport(radarData.id, radarUpdates);
        }
      }
      
      await logActivity({
        userId: req.user?.id,
        action: 'update_radar_report',
        entityType: 'mirqab_entry',
        entityId: req.params.id,
        newValue: { title: entry.title }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating radar report:", error);
      res.status(500).json({ message: "فشل في تحديث التقرير" });
    }
  });

  // DELETE /api/mirqab/radar/:id - Delete Radar Report
  app.delete("/api/mirqab/radar/:id", requireAuth, requirePermission('mirqab.delete'), async (req: any, res) => {
    try {
      await storage.deleteMirqabEntry(req.params.id);
      
      await logActivity({
        userId: req.user?.id,
        action: 'delete_radar_report',
        entityType: 'mirqab_entry',
        entityId: req.params.id
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting radar report:", error);
      res.status(500).json({ message: "فشل في حذف التقرير" });
    }
  });

  // ALGORITHM ARTICLE ROUTES - الخوارزمي يكتب

  // GET /api/mirqab/algorithm-writes - List Algorithm Articles
  app.get("/api/mirqab/algorithm-writes", async (req, res) => {
    try {
      const { limit } = req.query;
      const articles = await storage.getLatestAlgorithmArticles(
        limit ? parseInt(limit as string) : 10
      );
      res.json({
        entries: articles,
        total: articles.length
      });
    } catch (error) {
      console.error("Error fetching algorithm articles:", error);
      res.status(500).json({ message: "فشل في جلب مقالات الخوارزمي" });
    }
  });

  // GET /api/mirqab/algorithm-writes/:id - Get single Algorithm Article
  app.get("/api/mirqab/algorithm-writes/:id", async (req, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'algorithm_article') {
        return res.status(404).json({ message: "المقال غير موجود" });
      }
      
      const articleData = await storage.getAlgorithmArticleByEntryId(entry.id);
      res.json({ ...entry, articleData });
    } catch (error) {
      console.error("Error fetching algorithm article:", error);
      res.status(500).json({ message: "فشل في جلب المقال" });
    }
  });

  // POST /api/mirqab/algorithm-writes - Create Algorithm Article
  app.post("/api/mirqab/algorithm-writes", requireAuth, requirePermission('mirqab.create'), async (req: any, res) => {
    try {
      const entryData = insertMirqabEntrySchema.parse({
        ...req.body.entry,
        entryType: 'algorithm_article',
        slug: generateSlug(req.body.entry.title),
        authorId: req.user?.id,
      });
      
      const entry = await storage.createMirqabEntry(entryData);
      
      const articleData = insertMirqabAlgorithmArticleSchema.parse({
        ...req.body.articleData,
        entryId: entry.id,
      });
      
      const algorithmArticle = await storage.createAlgorithmArticle(articleData);
      
      await logActivity({
        userId: req.user?.id,
        action: 'create_algorithm_article',
        entityType: 'mirqab_entry',
        entityId: entry.id,
        newValue: { title: entry.title }
      });
      
      res.status(201).json({ entry, articleData: algorithmArticle });
    } catch (error) {
      console.error("Error creating algorithm article:", error);
      res.status(500).json({ message: "فشل في إنشاء المقال" });
    }
  });

  // PUT /api/mirqab/algorithm-writes/:id - Update Algorithm Article
  app.put("/api/mirqab/algorithm-writes/:id", requireAuth, requirePermission('mirqab.edit'), async (req: any, res) => {
    try {
      const entry = await storage.getMirqabEntryById(req.params.id);
      if (!entry || entry.entryType !== 'algorithm_article') {
        return res.status(404).json({ message: "المقال غير موجود" });
      }
      
      if (req.body.entry) {
        const entryUpdates = updateMirqabEntrySchema.parse({
          ...req.body.entry,
          editorId: req.user?.id,
        });
        await storage.updateMirqabEntry(req.params.id, entryUpdates);
      }
      
      if (req.body.articleData) {
        const articleData = await storage.getAlgorithmArticleByEntryId(req.params.id);
        if (articleData) {
          const articleUpdates = updateMirqabAlgorithmArticleSchema.parse(req.body.articleData);
          await storage.updateAlgorithmArticle(articleData.id, articleUpdates);
        }
      }
      
      await logActivity({
        userId: req.user?.id,
        action: 'update_algorithm_article',
        entityType: 'mirqab_entry',
        entityId: req.params.id,
        newValue: { title: entry.title }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating algorithm article:", error);
      res.status(500).json({ message: "فشل في تحديث المقال" });
    }
  });

  // DELETE /api/mirqab/algorithm-writes/:id - Delete Algorithm Article
  app.delete("/api/mirqab/algorithm-writes/:id", requireAuth, requirePermission('mirqab.delete'), async (req: any, res) => {
    try {
      await storage.deleteMirqabEntry(req.params.id);
      
      await logActivity({
        userId: req.user?.id,
        action: 'delete_algorithm_article',
        entityType: 'mirqab_entry',
        entityId: req.params.id
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting algorithm article:", error);
      res.status(500).json({ message: "فشل في حذف المقال" });
    }
  });

  // ============================================================
  // A/B TESTING ROUTES
  // ============================================================

  // Helper: Get or generate session ID
  const getOrCreateSessionId = (req: any): string => {
    if (req.session?.id) {
      return req.session.id;
    }
    if (req.sessionID) {
      return req.sessionID;
    }
    return randomUUID();
  };

  // 1. EXPERIMENT MANAGEMENT (Protected with auth)

  // GET /api/ab-tests - List all experiments (with filters)
  app.get("/api/ab-tests", requireAuth, async (req: any, res) => {
    try {
      const { status, testType } = req.query;
      
      const experiments = await storage.getAllExperiments({
        status: status as string,
        testType: testType as string,
      });

      res.json(experiments);
    } catch (error) {
      console.error("Error fetching experiments:", error);
      res.status(500).json({ message: "فشل في جلب التجارب" });
    }
  });

  // POST /api/ab-tests - Create experiment (admin/editor only)
  app.post("/api/ab-tests", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح لك بإنشاء التجارب" });
      }

      // Validate request body
      const validatedData = insertExperimentSchema.parse({
        ...req.body,
        createdBy: req.user.id,
        status: 'draft', // Always start as draft
      });

      const experiment = await storage.createExperiment(validatedData);

      await logActivity({
        userId: req.user.id,
        action: 'ExperimentCreated',
        entityType: 'Experiment',
        entityId: experiment.id,
        newValue: { name: experiment.name },
      });

      res.status(201).json(experiment);
    } catch (error: any) {
      console.error("Error creating experiment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في إنشاء التجربة" });
    }
  });

  // GET /api/ab-tests/:id - Get experiment by ID
  app.get("/api/ab-tests/:id", requireAuth, async (req: any, res) => {
    try {
      const experiment = await storage.getExperimentById(req.params.id);
      
      if (!experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      // Get variants as well
      const variants = await storage.getExperimentVariants(req.params.id);

      res.json({ ...experiment, variants });
    } catch (error) {
      console.error("Error fetching experiment:", error);
      res.status(500).json({ message: "فشل في جلب التجربة" });
    }
  });

  // PATCH /api/ab-tests/:id - Update experiment (admin/editor only)
  app.patch("/api/ab-tests/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح لك بتعديل التجارب" });
      }

      const experiment = await storage.getExperimentById(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      // Cannot update running experiment (except to pause)
      if (experiment.status === 'running') {
        return res.status(400).json({ 
          message: "لا يمكن تعديل تجربة قيد التشغيل. يرجى إيقافها مؤقتاً أولاً" 
        });
      }

      const updatedExperiment = await storage.updateExperiment(req.params.id, req.body);

      await logActivity({
        userId: req.user.id,
        action: 'ExperimentUpdated',
        entityType: 'Experiment',
        entityId: updatedExperiment.id,
        newValue: req.body,
      });

      res.json(updatedExperiment);
    } catch (error) {
      console.error("Error updating experiment:", error);
      res.status(500).json({ message: "فشل في تحديث التجربة" });
    }
  });

  // DELETE /api/ab-tests/:id - Delete experiment (admin only)
  app.delete("/api/ab-tests/:id", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const experiment = await storage.getExperimentById(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      // Cannot delete running experiments
      if (experiment.status === 'running') {
        return res.status(400).json({ 
          message: "لا يمكن حذف تجربة قيد التشغيل. يرجى إيقافها أولاً" 
        });
      }

      await storage.deleteExperiment(req.params.id);

      await logActivity({
        userId: req.user.id,
        action: 'ExperimentDeleted',
        entityType: 'Experiment',
        entityId: req.params.id,
        oldValue: { name: experiment.name },
      });

      res.json({ success: true, message: "تم حذف التجربة بنجاح" });
    } catch (error) {
      console.error("Error deleting experiment:", error);
      res.status(500).json({ message: "فشل في حذف التجربة" });
    }
  });

  // POST /api/ab-tests/:id/start - Start experiment (admin/editor only)
  app.post("/api/ab-tests/:id/start", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح لك ببدء التجارب" });
      }

      const experiment = await storage.getExperimentById(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      if (experiment.status === 'running') {
        return res.status(400).json({ message: "التجربة قيد التشغيل بالفعل" });
      }

      // Validate: Must have at least 2 variants
      const variants = await storage.getExperimentVariants(req.params.id);
      if (variants.length < 2) {
        return res.status(400).json({ 
          message: "يجب أن تحتوي التجربة على نسختين على الأقل قبل البدء" 
        });
      }

      // Validate: Traffic allocation must equal 100%
      const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
      if (totalAllocation !== 100) {
        return res.status(400).json({ 
          message: `نسبة توزيع الزيارات يجب أن تساوي 100% (حالياً: ${totalAllocation}%)` 
        });
      }

      const startedExperiment = await storage.startExperiment(req.params.id);

      await logActivity({
        userId: req.user.id,
        action: 'ExperimentStarted',
        entityType: 'Experiment',
        entityId: startedExperiment.id,
      });

      res.json(startedExperiment);
    } catch (error) {
      console.error("Error starting experiment:", error);
      res.status(500).json({ message: "فشل في بدء التجربة" });
    }
  });

  // POST /api/ab-tests/:id/pause - Pause experiment (admin/editor only)
  app.post("/api/ab-tests/:id/pause", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح لك بإيقاف التجارب" });
      }

      const experiment = await storage.getExperimentById(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      if (experiment.status !== 'running') {
        return res.status(400).json({ message: "التجربة ليست قيد التشغيل" });
      }

      const pausedExperiment = await storage.pauseExperiment(req.params.id);

      await logActivity({
        userId: req.user.id,
        action: 'ExperimentPaused',
        entityType: 'Experiment',
        entityId: pausedExperiment.id,
      });

      res.json(pausedExperiment);
    } catch (error) {
      console.error("Error pausing experiment:", error);
      res.status(500).json({ message: "فشل في إيقاف التجربة" });
    }
  });

  // POST /api/ab-tests/:id/complete - Complete experiment (admin/editor only)
  app.post("/api/ab-tests/:id/complete", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح لك بإكمال التجارب" });
      }

      const experiment = await storage.getExperimentById(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      const { winnerVariantId } = req.body;

      // Validate winner variant if provided
      if (winnerVariantId) {
        const variants = await storage.getExperimentVariants(req.params.id);
        const winnerExists = variants.some(v => v.id === winnerVariantId);
        if (!winnerExists) {
          return res.status(400).json({ message: "النسخة الفائزة غير موجودة في التجربة" });
        }
      }

      const completedExperiment = await storage.completeExperiment(req.params.id, winnerVariantId);

      await logActivity({
        userId: req.user.id,
        action: 'ExperimentCompleted',
        entityType: 'Experiment',
        entityId: completedExperiment.id,
        newValue: { winnerVariantId },
      });

      res.json(completedExperiment);
    } catch (error) {
      console.error("Error completing experiment:", error);
      res.status(500).json({ message: "فشل في إكمال التجربة" });
    }
  });

  // GET /api/ab-tests/:id/analytics - Get analytics
  app.get("/api/ab-tests/:id/analytics", requireAuth, async (req: any, res) => {
    try {
      // Readers can view analytics
      const analytics = await storage.getExperimentAnalytics(req.params.id);
      
      if (!analytics.experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching experiment analytics:", error);
      res.status(500).json({ message: "فشل في جلب تحليلات التجربة" });
    }
  });

  // 2. VARIANT MANAGEMENT (Protected with auth)

  // POST /api/ab-tests/:id/variants - Create variant (admin/editor only)
  app.post("/api/ab-tests/:id/variants", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح لك بإنشاء النسخ" });
      }

      const experiment = await storage.getExperimentById(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: "التجربة غير موجودة" });
      }

      // Cannot add variants to running experiment
      if (experiment.status === 'running') {
        return res.status(400).json({ 
          message: "لا يمكن إضافة نسخ لتجربة قيد التشغيل" 
        });
      }

      // Validate request body
      const validatedData = insertExperimentVariantSchema.parse({
        ...req.body,
        experimentId: req.params.id,
      });

      const variant = await storage.createExperimentVariant(validatedData);

      await logActivity({
        userId: req.user.id,
        action: 'VariantCreated',
        entityType: 'ExperimentVariant',
        entityId: variant.id,
        newValue: { experimentId: req.params.id, name: variant.name },
      });

      res.status(201).json(variant);
    } catch (error: any) {
      console.error("Error creating variant:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في إنشاء النسخة" });
    }
  });

  // GET /api/ab-tests/:id/variants - Get all variants
  app.get("/api/ab-tests/:id/variants", requireAuth, async (req: any, res) => {
    try {
      const variants = await storage.getExperimentVariants(req.params.id);
      res.json(variants);
    } catch (error) {
      console.error("Error fetching variants:", error);
      res.status(500).json({ message: "فشل في جلب النسخ" });
    }
  });

  // PATCH /api/ab-tests/variants/:variantId - Update variant (admin/editor only)
  app.patch("/api/ab-tests/variants/:variantId", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: "غير مصرح لك بتعديل النسخ" });
      }

      // Get the variant first to check its experiment status
      const variants = await db
        .select()
        .from(experimentVariants)
        .where(eq(experimentVariants.id, req.params.variantId))
        .limit(1);

      if (variants.length === 0) {
        return res.status(404).json({ message: "النسخة غير موجودة" });
      }

      const variant = variants[0];
      const experiment = await storage.getExperimentById(variant.experimentId);

      if (experiment && experiment.status === 'running') {
        return res.status(400).json({ 
          message: "لا يمكن تعديل نسخ تجربة قيد التشغيل" 
        });
      }

      const updatedVariant = await storage.updateExperimentVariant(req.params.variantId, req.body);

      await logActivity({
        userId: req.user.id,
        action: 'VariantUpdated',
        entityType: 'ExperimentVariant',
        entityId: updatedVariant.id,
      });

      res.json(updatedVariant);
    } catch (error) {
      console.error("Error updating variant:", error);
      res.status(500).json({ message: "فشل في تحديث النسخة" });
    }
  });

  // DELETE /api/ab-tests/variants/:variantId - Delete variant (admin only)
  app.delete("/api/ab-tests/variants/:variantId", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      // Get the variant first to check its experiment status
      const variants = await db
        .select()
        .from(experimentVariants)
        .where(eq(experimentVariants.id, req.params.variantId))
        .limit(1);

      if (variants.length === 0) {
        return res.status(404).json({ message: "النسخة غير موجودة" });
      }

      const variant = variants[0];
      const experiment = await storage.getExperimentById(variant.experimentId);

      if (experiment && experiment.status === 'running') {
        return res.status(400).json({ 
          message: "لا يمكن حذف نسخ من تجربة قيد التشغيل" 
        });
      }

      await storage.deleteExperimentVariant(req.params.variantId);

      await logActivity({
        userId: req.user.id,
        action: 'VariantDeleted',
        entityType: 'ExperimentVariant',
        entityId: req.params.variantId,
      });

      res.json({ success: true, message: "تم حذف النسخة بنجاح" });
    } catch (error) {
      console.error("Error deleting variant:", error);
      res.status(500).json({ message: "فشل في حذف النسخة" });
    }
  });

  // 3. TRACKING ENDPOINTS (Public - no auth required)

  // POST /api/ab-tests/track/exposure - Record exposure (visitor saw variant)
  app.post("/api/ab-tests/track/exposure", async (req: any, res) => {
    try {
      const { experimentId, variantId } = req.body;

      if (!experimentId || !variantId) {
        return res.status(400).json({ message: "experimentId و variantId مطلوبان" });
      }

      const sessionId = getOrCreateSessionId(req);
      const userId = req.user?.id || null;

      // Validate request body
      const validatedData = insertExperimentExposureSchema.parse({
        experimentId,
        variantId,
        userId,
        sessionId,
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'] || req.headers['referrer'],
      });

      const exposure = await storage.recordExperimentExposure(validatedData);

      res.status(201).json({ success: true, exposureId: exposure.id });
    } catch (error: any) {
      console.error("Error recording exposure:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في تسجيل المشاهدة" });
    }
  });

  // POST /api/ab-tests/track/conversion - Record conversion (click/read/like)
  app.post("/api/ab-tests/track/conversion", async (req: any, res) => {
    try {
      const { experimentId, variantId, exposureId, conversionType, value, metadata } = req.body;

      if (!experimentId || !variantId || !exposureId || !conversionType) {
        return res.status(400).json({ 
          message: "experimentId, variantId, exposureId, و conversionType مطلوبة" 
        });
      }

      // Validate conversion type
      const validConversionTypes = ['click', 'read', 'like', 'share', 'comment', 'bookmark'];
      if (!validConversionTypes.includes(conversionType)) {
        return res.status(400).json({ 
          message: `نوع التحويل غير صالح. القيم المسموحة: ${validConversionTypes.join(', ')}` 
        });
      }

      // Validate request body
      const validatedData = insertExperimentConversionSchema.parse({
        experimentId,
        variantId,
        exposureId,
        conversionType,
        value: value || null,
        metadata: metadata || null,
      });

      const conversion = await storage.recordExperimentConversion(validatedData);

      res.status(201).json({ success: true, conversionId: conversion.id });
    } catch (error: any) {
      console.error("Error recording conversion:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في تسجيل التحويل" });
    }
  });

  // GET /api/ab-tests/assign/:experimentId - Assign variant to user/session
  app.get("/api/ab-tests/assign/:experimentId", async (req: any, res) => {
    try {
      const sessionId = getOrCreateSessionId(req);
      const userId = req.user?.id || null;

      const variant = await storage.assignExperimentVariant(
        req.params.experimentId,
        userId || undefined,
        sessionId
      );

      if (!variant) {
        return res.status(404).json({ message: "التجربة غير موجودة أو غير نشطة" });
      }

      res.json({ 
        variant,
        sessionId, // Return sessionId so frontend can store it if needed
      });
    } catch (error) {
      console.error("Error assigning variant:", error);
      res.status(500).json({ message: "فشل في تعيين النسخة" });
    }
  });

  // ==========================================
  // Reporter/Staff Routes
  // ==========================================

  // GET /api/reporters/:slug - Get reporter profile (Arabic)
  app.get("/api/reporters/:slug", async (req: any, res) => {
    try {
      const { slug } = req.params;
      const windowDays = parseInt(req.query.windowDays as string) || 90;

      if (!slug) {
        return res.status(400).json({ message: "معرّف المراسل مطلوب" });
      }

      const profile = await storage.getReporterProfile(slug, windowDays, 'ar');

      if (!profile) {
        return res.status(404).json({ message: "المراسل غير موجود" });
      }

      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching reporter profile:", error);
      res.status(500).json({ message: "فشل في جلب بيانات المراسل" });
    }
  });

  // GET /api/en/reporters/:slug - Get reporter profile (English)
  app.get("/api/en/reporters/:slug", async (req: any, res) => {
    try {
      const { slug } = req.params;
      const windowDays = parseInt(req.query.windowDays as string) || 90;

      if (!slug) {
        return res.status(400).json({ message: "Reporter identifier required" });
      }

      const profile = await storage.getReporterProfile(slug, windowDays, 'en');

      if (!profile) {
        return res.status(404).json({ message: "Reporter not found" });
      }

      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching reporter profile:", error);
      res.status(500).json({ message: "Failed to fetch reporter data" });
    }
  });

  // ==========================================
  // Smart Blocks Routes - البلوكات الذكية
  // ==========================================

  // GET /api/smart-blocks - List all smart blocks
  app.get("/api/smart-blocks", cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM, staleWhileRevalidate: CACHE_DURATIONS.MEDIUM }), async (req: any, res) => {
    try {
      const { isActive, placement } = req.query;
      
      const filters: any = {};
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }
      if (placement) {
        filters.placement = placement;
      }

      const blocks = await storage.getSmartBlocks(filters);
      res.json(blocks);
    } catch (error: any) {
      console.error("Error fetching smart blocks:", error);
      res.status(500).json({ message: "فشل في جلب البلوكات الذكية" });
    }
  });

  // POST /api/smart-blocks - Create new smart block
  app.post("/api/smart-blocks", requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const validatedData = insertSmartBlockSchema.parse({
        ...req.body,
        createdBy: req.user?.id,
      });

      const block = await storage.createSmartBlock(validatedData as any);

      await logActivity({
        userId: req.user?.id,
        action: 'create_smart_block',
        entityType: 'smart_block',
        entityId: block.id,
        newValue: { title: block.title, keyword: block.keyword }
      });

      res.status(201).json(block);
    } catch (error: any) {
      console.error("Error creating smart block:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في إنشاء البلوك الذكي" });
    }
  });

  // GET /api/smart-blocks/:id - Get specific smart block
  app.get("/api/smart-blocks/:id", async (req: any, res) => {
    try {
      const block = await storage.getSmartBlockById(req.params.id);
      
      if (!block) {
        return res.status(404).json({ message: "البلوك الذكي غير موجود" });
      }

      res.json(block);
    } catch (error: any) {
      console.error("Error fetching smart block:", error);
      res.status(500).json({ message: "فشل في جلب البلوك الذكي" });
    }
  });

  // PUT /api/smart-blocks/:id - Update smart block
  app.put("/api/smart-blocks/:id", requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const existingBlock = await storage.getSmartBlockById(req.params.id);
      if (!existingBlock) {
        return res.status(404).json({ message: "البلوك الذكي غير موجود" });
      }

      const updated = await storage.updateSmartBlock(req.params.id, req.body);

      await logActivity({
        userId: req.user?.id,
        action: 'update_smart_block',
        entityType: 'smart_block',
        entityId: updated.id,
        oldValue: { title: existingBlock.title, keyword: existingBlock.keyword },
        newValue: { title: updated.title, keyword: updated.keyword }
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating smart block:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في تحديث البلوك الذكي" });
    }
  });

  // DELETE /api/smart-blocks/:id - Delete smart block
  app.delete("/api/smart-blocks/:id", requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const existingBlock = await storage.getSmartBlockById(req.params.id);
      if (!existingBlock) {
        return res.status(404).json({ message: "البلوك الذكي غير موجود" });
      }

      await storage.deleteSmartBlock(req.params.id);

      await logActivity({
        userId: req.user?.id,
        action: 'delete_smart_block',
        entityType: 'smart_block',
        entityId: req.params.id,
        oldValue: { title: existingBlock.title, keyword: existingBlock.keyword }
      });

      res.json({ success: true, message: "تم حذف البلوك الذكي بنجاح" });
    } catch (error: any) {
      console.error("Error deleting smart block:", error);
      res.status(500).json({ message: "فشل في حذف البلوك الذكي" });
    }
  });

  // GET /api/smart-blocks/query/articles - Query articles by keyword
  app.get("/api/smart-blocks/query/articles", async (req: any, res) => {
    try {
      const { keyword, limit = 6, categories, dateFrom, dateTo } = req.query;

      if (!keyword) {
        return res.status(400).json({ message: "الكلمة المفتاحية مطلوبة" });
      }

      console.log(`🔍 [Smart Block] Searching for keyword: "${keyword}", limit: ${limit}`);

      const filters: any = {};
      if (categories) {
        filters.categories = Array.isArray(categories) ? categories : [categories];
      }
      if (dateFrom) {
        filters.dateFrom = dateFrom;
      }
      if (dateTo) {
        filters.dateTo = dateTo;
      }

      const articles = await storage.queryArticlesByKeyword(
        keyword,
        parseInt(limit as string) || 6,
        filters
      );

      console.log(`✅ [Smart Block] Found ${articles.length} articles for "${keyword}"`);
      articles.forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title.substring(0, 60)}..."`);
      });

      res.json({ items: articles, total: articles.length });
    } catch (error: any) {
      console.error("❌ [Smart Block] Error querying articles:", error);
      res.status(500).json({ message: "فشل في البحث عن المقالات" });
    }
  });

  // ============================================================
  // ENGLISH SMART BLOCKS API - بلوكات النسخة الإنجليزية
  // ============================================================

  // GET /api/en/smart-blocks - List all English smart blocks
  app.get("/api/en/smart-blocks", async (req: any, res) => {
    try {
      const { isActive, placement } = req.query;
      
      const conditions: any[] = [];
      if (isActive !== undefined) {
        conditions.push(eq(enSmartBlocks.isActive, isActive === 'true'));
      }
      if (placement) {
        conditions.push(eq(enSmartBlocks.placement, placement));
      }

      const blocks = await db.query.enSmartBlocks.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(enSmartBlocks.createdAt)],
      });

      res.json(blocks);
    } catch (error: any) {
      console.error("Error fetching English smart blocks:", error);
      res.status(500).json({ message: "Failed to fetch smart blocks" });
    }
  });

  // POST /api/en/smart-blocks - Create new English smart block
  app.post("/api/en/smart-blocks", requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const validatedData = insertEnSmartBlockSchema.parse({
        ...req.body,
        createdBy: req.user?.id,
      });

      const [block] = await db.insert(enSmartBlocks).values(validatedData as any).returning();

      await logActivity({
        userId: req.user?.id,
        action: 'create_en_smart_block',
        entityType: 'en_smart_block',
        entityId: block.id,
        newValue: { title: block.title, keyword: block.keyword }
      });

      res.status(201).json(block);
    } catch (error: any) {
      console.error("Error creating English smart block:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create smart block" });
    }
  });

  // GET /api/en/smart-blocks/:id - Get specific English smart block
  app.get("/api/en/smart-blocks/:id", async (req: any, res) => {
    try {
      const block = await db.query.enSmartBlocks.findFirst({
        where: eq(enSmartBlocks.id, req.params.id),
      });
      
      if (!block) {
        return res.status(404).json({ message: "Smart block not found" });
      }

      res.json(block);
    } catch (error: any) {
      console.error("Error fetching English smart block:", error);
      res.status(500).json({ message: "Failed to fetch smart block" });
    }
  });

  // PUT /api/en/smart-blocks/:id - Update English smart block
  app.put("/api/en/smart-blocks/:id", requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const existingBlock = await db.query.enSmartBlocks.findFirst({
        where: eq(enSmartBlocks.id, req.params.id),
      });

      if (!existingBlock) {
        return res.status(404).json({ message: "Smart block not found" });
      }

      const [updated] = await db.update(enSmartBlocks)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(enSmartBlocks.id, req.params.id))
        .returning();

      await logActivity({
        userId: req.user?.id,
        action: 'update_en_smart_block',
        entityType: 'en_smart_block',
        entityId: updated.id,
        oldValue: { title: existingBlock.title, keyword: existingBlock.keyword },
        newValue: { title: updated.title, keyword: updated.keyword }
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating English smart block:", error);
      res.status(500).json({ message: "Failed to update smart block" });
    }
  });

  // DELETE /api/en/smart-blocks/:id - Delete English smart block
  app.delete("/api/en/smart-blocks/:id", requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const existingBlock = await db.query.enSmartBlocks.findFirst({
        where: eq(enSmartBlocks.id, req.params.id),
      });

      if (!existingBlock) {
        return res.status(404).json({ message: "Smart block not found" });
      }

      await db.delete(enSmartBlocks).where(eq(enSmartBlocks.id, req.params.id));

      await logActivity({
        userId: req.user?.id,
        action: 'delete_en_smart_block',
        entityType: 'en_smart_block',
        entityId: req.params.id,
        oldValue: { title: existingBlock.title, keyword: existingBlock.keyword }
      });

      res.json({ success: true, message: "Smart block deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting English smart block:", error);
      res.status(500).json({ message: "Failed to delete smart block" });
    }
  });

  // GET /api/en/smart-blocks/query/articles - Query English articles by keyword
  app.get("/api/en/smart-blocks/query/articles", async (req: any, res) => {
    try {
      const { keyword, limit = 6, categories, dateFrom, dateTo } = req.query;

      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      console.log(`🔍 [EN Smart Block] Searching for keyword: "${keyword}", limit: ${limit}`);

      const conditions: any[] = [
        eq(enArticles.status, 'published'),
        // Search ONLY in seo.keywords JSONB array - not in title/content/excerpt
        sql`${enArticles.seo}::jsonb -> 'keywords' @> ${JSON.stringify([keyword])}::jsonb`
      ];

      if (categories) {
        const categoryList = Array.isArray(categories) ? categories : [categories];
        conditions.push(inArray(enArticles.categoryId, categoryList));
      }

      if (dateFrom) {
        conditions.push(gte(enArticles.publishedAt, new Date(dateFrom as string)));
      }

      if (dateTo) {
        conditions.push(gte(enArticles.publishedAt, new Date(dateTo as string)));
      }

      // Use leftJoin to get articles with category and author information
      const results = await db
        .select()
        .from(enArticles)
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .leftJoin(users, eq(enArticles.authorId, users.id))
        .where(and(...conditions))
        .orderBy(desc(enArticles.publishedAt))
        .limit(parseInt(limit as string) || 6);

      // Map results to include category and author information
      const articles = results.map(result => {
        const article = result.en_articles;
        const category = result.en_categories;
        const authorData = result.users;

        return {
          ...article,
          category: category || undefined,
          author: authorData ? {
            id: authorData.id,
            email: authorData.email,
            firstName: authorData.firstName,
            lastName: authorData.lastName,
            profileImageUrl: authorData.profileImageUrl,
            bio: authorData.bio,
          } : undefined,
        };
      });

      console.log(`✅ [EN Smart Block] Found ${articles.length} articles for "${keyword}"`);

      res.json({ items: articles, total: articles.length });
    } catch (error: any) {
      console.error("❌ [EN Smart Block] Error querying articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  // ============================================================
  // AUDIO NEWSLETTERS ROUTES - النشرات الصوتية
  // ============================================================

  // GET /api/audio-newsletters/admin - List all newsletters for admin (protected)
  app.get("/api/audio-newsletters/admin", 
    requireAuth,
    requirePermission('audio_newsletters.view'),
    async (req: any, res) => {
      try {
        const { limit = 50, offset = 0 } = req.query;

        // Admin can see all statuses
        const newsletters = await storage.getAllAudioNewsletters({
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        });

        res.json(newsletters);
      } catch (error: any) {
        console.error("Error fetching audio newsletters:", error);
        res.status(500).json({ message: "فشل في جلب النشرات الصوتية" });
      }
    }
  );

  // GET /api/audio-newsletters - List published newsletters (public)
  app.get("/api/audio-newsletters", async (req: any, res) => {
    try {
      const { status = 'published', limit = 20, offset = 0 } = req.query;

      const newsletters = await storage.getAllAudioNewsletters({
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({ newsletters, total: newsletters.length });
    } catch (error: any) {
      console.error("Error fetching audio newsletters:", error);
      res.status(500).json({ message: "فشل في جلب النشرات الصوتية" });
    }
  });

  // GET /api/audio-newsletters/feed.xml - RSS/Podcast feed (public)
  app.get("/api/audio-newsletters/feed.xml", async (req: any, res) => {
    try {
      const newsletters = await storage.getAllAudioNewsletters({
        status: 'published',
        limit: 50,
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const rssItems = newsletters
        .filter(n => n.audioUrl && n.publishedAt)
        .map(newsletter => {
          const pubDate = newsletter.publishedAt ? new Date(newsletter.publishedAt).toUTCString() : new Date().toUTCString();
          const duration = newsletter.duration || 0;
          const fileSize = newsletter.fileSize || 0;

          return `
    <item>
      <title><![CDATA[${newsletter.title}]]></title>
      <description><![CDATA[${newsletter.description || ''}]]></description>
      <link>${baseUrl}/audio-newsletters/${newsletter.slug}</link>
      <guid isPermaLink="false">${newsletter.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${newsletter.audioUrl}" length="${fileSize}" type="audio/mpeg"/>
      <itunes:duration>${duration}</itunes:duration>
      <itunes:author>${newsletter.author || 'سبق الذكية'}</itunes:author>
      <itunes:explicit>no</itunes:explicit>
      ${newsletter.coverImageUrl ? `<itunes:image href="${newsletter.coverImageUrl}"/>` : ''}
    </item>`;
        }).join('\n');

      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>سبق الذكية - النشرات الصوتية</title>
    <link>${baseUrl}/audio-newsletters</link>
    <atom:link href="${baseUrl}/api/audio-newsletters/feed.xml" rel="self" type="application/rss+xml"/>
    <description>النشرات الإخبارية الصوتية من سبق الذكية</description>
    <language>ar</language>
    <copyright>© ${new Date().getFullYear()} سبق الذكية</copyright>
    <itunes:author>سبق الذكية</itunes:author>
    <itunes:summary>النشرات الإخبارية الصوتية من سبق الذكية</itunes:summary>
    <itunes:category text="News"/>
    <itunes:explicit>no</itunes:explicit>
    ${rssItems}
  </channel>
</rss>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.send(rssXml);
    } catch (error: any) {
      console.error("Error generating RSS feed:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate feed</error>');
    }
  });

  // GET /api/audio-newsletters/:slug - Get newsletter by slug (public)
  app.get("/api/audio-newsletters/:slug", async (req: any, res) => {
    try {
      const newsletter = await storage.getAudioNewsletterBySlug(req.params.slug);

      if (!newsletter) {
        return res.status(404).json({ message: "النشرة الصوتية غير موجودة" });
      }

      if (newsletter.status !== 'published' && !req.user) {
        return res.status(403).json({ message: "هذه النشرة غير منشورة" });
      }

      res.json(newsletter);
    } catch (error: any) {
      console.error("Error fetching audio newsletter:", error);
      res.status(500).json({ message: "فشل في جلب النشرة الصوتية" });
    }
  });

  // POST /api/audio-newsletters - Create new newsletter (admin only)
  app.post("/api/audio-newsletters", requireAuth, requirePermission('audio_newsletters.create'), async (req: any, res) => {
    try {
      const validatedData = insertAudioNewsletterSchema.parse(req.body);

      // Auto-generate slug from title if not provided
      let slug = validatedData.slug;
      if (!slug && validatedData.title) {
        slug = validatedData.title
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);
      }

      const newsletter = await storage.createAudioNewsletter({
        ...validatedData,
        slug: slug || `newsletter-${Date.now()}`,
        generatedBy: req.user.id,
      });

      await logActivity({
        userId: req.user.id,
        action: 'create_audio_newsletter',
        entityType: 'audio_newsletter',
        entityId: newsletter.id,
        newValue: { title: newsletter.title, slug: newsletter.slug }
      });

      res.json(newsletter);
    } catch (error: any) {
      console.error("Error creating audio newsletter:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في إنشاء النشرة الصوتية" });
    }
  });

  // POST /api/audio-newsletters/:id/generate - Generate TTS audio (admin only)
  app.post("/api/audio-newsletters/:id/generate", 
    requireAuth, 
    requirePermission('audio_newsletters.manage_all'),
    async (req: any, res) => {
      try {
        const newsletter = await storage.getAudioNewsletterById(req.params.id);

        if (!newsletter) {
          return res.status(404).json({ message: "النشرة الصوتية غير موجودة" });
        }

        // Import job queue
        const { jobQueue } = await import("./services/job-queue");

        // Add job to queue instead of processing immediately
        const jobId = await jobQueue.add('generate-tts', { 
          newsletterId: req.params.id, 
          userId: req.user.id 
        });

        res.json({ 
          status: 'queued', 
          jobId, 
          message: 'جاري التوليد في الخلفية' 
        });
      } catch (error: any) {
        console.error("Error initiating audio generation:", error);
        res.status(500).json({ message: "فشل في بدء توليد الصوت" });
      }
    }
  );

  // GET /api/audio-newsletters/jobs/:jobId - Get job status (admin only)
  app.get("/api/audio-newsletters/jobs/:jobId",
    requireAuth,
    async (req: any, res) => {
      try {
        const { jobQueue } = await import("./services/job-queue");
        const job = await jobQueue.getStatus(req.params.jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'الوظيفة غير موجودة' });
        }
        
        res.json(job);
      } catch (error: any) {
        console.error("Error fetching job status:", error);
        res.status(500).json({ message: "فشل في جلب حالة الوظيفة" });
      }
    }
  );

  // PUT /api/audio-newsletters/:id - Update newsletter (admin only)
  app.put("/api/audio-newsletters/:id", requireAuth, requirePermission('audio_newsletters.update'), async (req: any, res) => {
    try {
      const validatedData = updateAudioNewsletterSchema.parse(req.body);

      const existing = await storage.getAudioNewsletterById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "النشرة الصوتية غير موجودة" });
      }

      const updated = await storage.updateAudioNewsletter(req.params.id, validatedData);

      await logActivity({
        userId: req.user.id,
        action: 'update_audio_newsletter',
        entityType: 'audio_newsletter',
        entityId: req.params.id,
        oldValue: { title: existing.title, status: existing.status },
        newValue: { title: updated.title, status: updated.status }
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating audio newsletter:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في تحديث النشرة الصوتية" });
    }
  });

  // DELETE /api/audio-newsletters/:id - Delete newsletter (admin only)
  app.delete("/api/audio-newsletters/:id", requireAuth, requirePermission('audio_newsletters.delete'), async (req: any, res) => {
    try {
      const existing = await storage.getAudioNewsletterById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "النشرة الصوتية غير موجودة" });
      }

      await storage.deleteAudioNewsletter(req.params.id);

      await logActivity({
        userId: req.user.id,
        action: 'delete_audio_newsletter',
        entityType: 'audio_newsletter',
        entityId: req.params.id,
        oldValue: { title: existing.title }
      });

      res.json({ success: true, message: "تم حذف النشرة الصوتية بنجاح" });
    } catch (error: any) {
      console.error("Error deleting audio newsletter:", error);
      res.status(500).json({ message: "فشل في حذف النشرة الصوتية" });
    }
  });

  // POST /api/audio-newsletters/:id/articles - Add articles to newsletter (admin only)
  app.post("/api/audio-newsletters/:id/articles", requireAuth, requirePermission('audio_newsletters.update'), async (req: any, res) => {
    try {
      const { articleIds } = req.body;

      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({ message: "يجب تحديد مقالات" });
      }

      const newsletter = await storage.getAudioNewsletterById(req.params.id);
      if (!newsletter) {
        return res.status(404).json({ message: "النشرة الصوتية غير موجودة" });
      }

      await storage.addArticlesToNewsletter(req.params.id, articleIds);

      res.json({ success: true, message: "تمت إضافة المقالات بنجاح" });
    } catch (error: any) {
      console.error("Error adding articles to newsletter:", error);
      res.status(500).json({ message: "فشل في إضافة المقالات" });
    }
  });

  // DELETE /api/audio-newsletters/:id/articles/:articleId - Remove article from newsletter (admin only)
  app.delete("/api/audio-newsletters/:id/articles/:articleId", requireAuth, requirePermission('audio_newsletters.update'), async (req: any, res) => {
    try {
      await storage.removeArticleFromNewsletter(req.params.id, req.params.articleId);

      res.json({ success: true, message: "تمت إزالة المقال بنجاح" });
    } catch (error: any) {
      console.error("Error removing article from newsletter:", error);
      res.status(500).json({ message: "فشل في إزالة المقال" });
    }
  });

  // POST /api/audio-newsletters/:id/publish - Publish newsletter (admin only)
  app.post("/api/audio-newsletters/:id/publish", 
    requireAuth, 
    requirePermission('audio_newsletters.publish'), 
    async (req: any, res) => {
    try {
      const newsletter = await storage.getAudioNewsletterById(req.params.id);

      if (!newsletter) {
        return res.status(404).json({ message: "النشرة الصوتية غير موجودة" });
      }

      if (!newsletter.audioUrl) {
        return res.status(400).json({ message: "يجب توليد الصوت أولاً" });
      }

      const updated = await storage.updateAudioNewsletter(req.params.id, {
        status: 'published',
        publishedAt: new Date(),
      });

      await logActivity({
        userId: req.user.id,
        action: 'publish_audio_newsletter',
        entityType: 'audio_newsletter',
        entityId: req.params.id,
        newValue: { status: 'published' }
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Error publishing audio newsletter:", error);
      res.status(500).json({ message: "فشل في نشر النشرة الصوتية" });
    }
  });

  // POST /api/audio-newsletters/:id/listen - Track listening event (public/authenticated)
  app.post("/api/audio-newsletters/:id/listen", async (req: any, res) => {
    try {
      const validatedData = insertAudioNewsletterListenSchema.parse(req.body);

      const { nanoid } = await import('nanoid');

      const listenData = {
        ...validatedData,
        newsletterId: req.params.id,
        userId: req.user?.id || null,
        sessionId: validatedData.sessionId || nanoid(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const listen = await storage.trackListen(listenData as any);

      res.json(listen);
    } catch (error: any) {
      console.error("Error tracking listen:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في تسجيل الاستماع" });
    }
  });

  // GET /api/audio-newsletters/:id/analytics - Get analytics (admin only)
  app.get("/api/audio-newsletters/:id/analytics", requireAuth, requirePermission('audio_newsletters.view_analytics'), async (req: any, res) => {
    try {
      const analytics = await storage.getNewsletterAnalytics(req.params.id);

      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "فشل في جلب الإحصائيات" });
    }
  });

  // ============================================================
  // AUDIO NEWS BRIEFS ROUTES - الأخبار الصوتية السريعة
  // ============================================================

  // GET /api/audio-briefs/admin - List all briefs for admin (protected)
  app.get("/api/audio-briefs/admin",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const briefs = await storage.getAllAudioNewsBriefs();
        res.json(briefs);
      } catch (error: any) {
        console.error("Error fetching audio briefs:", error);
        res.status(500).json({ message: "فشل في جلب الأخبار الصوتية" });
      }
    }
  );

  // GET /api/audio-briefs/published - List published briefs (public)
  app.get("/api/audio-briefs/published", async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const briefs = await storage.getPublishedAudioNewsBriefs(limit);
      res.json(briefs);
    } catch (error: any) {
      console.error("Error fetching published briefs:", error);
      res.status(500).json({ message: "فشل في جلب الأخبار الصوتية المنشورة" });
    }
  });

  // GET /api/audio-briefs/:id - Get brief by ID (public)
  app.get("/api/audio-briefs/:id", async (req: any, res) => {
    try {
      const brief = await storage.getAudioNewsBriefById(req.params.id);
      if (!brief) {
        return res.status(404).json({ message: "الخبر غير موجود" });
      }
      res.json(brief);
    } catch (error: any) {
      console.error("Error fetching audio brief:", error);
      res.status(500).json({ message: "فشل في جلب الخبر الصوتي" });
    }
  });

  // POST /api/audio-briefs - Create new brief (admin only)
  app.post("/api/audio-briefs",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const validatedData = insertAudioNewsBriefSchema.parse({
          ...req.body,
          createdBy: req.user.id,
        });
        const brief = await storage.createAudioNewsBrief(validatedData as any);
        res.status(201).json(brief);
      } catch (error: any) {
        console.error("Error creating audio brief:", error);
        if (error.name === 'ZodError') {
          return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
        }
        res.status(500).json({ message: "فشل في إنشاء الخبر الصوتي" });
      }
    }
  );

  // POST /api/audio-briefs/:id/generate - Generate audio (admin only)
  app.post("/api/audio-briefs/:id/generate",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const brief = await storage.getAudioNewsBriefById(req.params.id);
        if (!brief) {
          return res.status(404).json({ message: "الخبر غير موجود" });
        }

        const { jobQueue } = await import("./services/job-queue");

        const jobId = await jobQueue.add('generate-audio-brief', { 
          briefId: req.params.id,
          userId: req.user.id 
        });

        res.json({ 
          status: 'queued', 
          jobId, 
          message: 'جاري التوليد في الخلفية' 
        });
      } catch (error: any) {
        console.error("Error queueing audio brief generation:", error);
        res.status(500).json({ message: "فشل في بدء توليد الصوت" });
      }
    }
  );

  // GET /api/audio-briefs/jobs/:jobId - Get job status for audio brief generation
  app.get("/api/audio-briefs/jobs/:jobId",
    requireAuth,
    async (req: any, res) => {
      try {
        const { jobQueue } = await import("./services/job-queue");
        const job = await jobQueue.getStatus(req.params.jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'الوظيفة غير موجودة' });
        }
        
        res.json(job);
      } catch (error: any) {
        console.error("Error fetching job status:", error);
        res.status(500).json({ message: "فشل في جلب حالة الوظيفة" });
      }
    }
  );

  // PUT /api/audio-briefs/:id - Update brief (admin only)
  app.put("/api/audio-briefs/:id",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const brief = await storage.updateAudioNewsBrief(req.params.id, req.body);
        res.json(brief);
      } catch (error: any) {
        console.error("Error updating audio brief:", error);
        res.status(500).json({ message: "فشل في تحديث الخبر الصوتي" });
      }
    }
  );

  // POST /api/audio-briefs/:id/publish - Publish brief (admin only)
  app.post("/api/audio-briefs/:id/publish",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const brief = await storage.getAudioNewsBriefById(req.params.id);
        
        if (!brief) {
          return res.status(404).json({ message: "الخبر الصوتي غير موجود" });
        }
        
        // CRITICAL: Check generation status before allowing publish
        if (brief.generationStatus !== 'completed') {
          return res.status(400).json({ 
            message: 'لا يمكن النشر - يجب إتمام توليد الصوت أولاً' 
          });
        }
        
        if (!brief.audioUrl) {
          return res.status(400).json({ 
            message: 'لا يمكن النشر - رابط الملف الصوتي غير موجود' 
          });
        }

        const published = await storage.publishAudioNewsBrief(req.params.id);
        res.json(published);
      } catch (error: any) {
        console.error("Error publishing audio brief:", error);
        res.status(500).json({ message: "فشل في نشر الخبر الصوتي" });
      }
    }
  );

  // DELETE /api/audio-briefs/:id - Delete brief (admin only)
  app.delete("/api/audio-briefs/:id",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        await storage.deleteAudioNewsBrief(req.params.id);
        res.status(204).send();
      } catch (error: any) {
        console.error("Error deleting audio brief:", error);
        res.status(500).json({ message: "فشل في حذف الخبر الصوتي" });
      }
    }
  );

  // ============================================================
  // INTERNAL ANNOUNCEMENTS ROUTES - نظام الإعلانات الداخلية المتقدم
  // ============================================================

  // 1. POST /api/announcements - Create announcement (admin only)
  app.post("/api/announcements",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        // Validate request body
        const validatedData = insertInternalAnnouncementSchema.parse(req.body);

        // Create announcement
        const announcement = await storage.createInternalAnnouncement({
          ...validatedData,
          createdBy: userId,
        } as any);

        // Log activity
        await logActivity({
          userId,
          action: 'create',
          entityType: 'internal_announcement',
          entityId: announcement.id,
          newValue: { title: announcement.title, status: announcement.status },
        });

        res.status(201).json(announcement);
      } catch (error: any) {
        console.error("Error creating announcement:", error);
        if (error.name === 'ZodError') {
          return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
        }
        res.status(500).json({ message: "فشل في إنشاء الإعلان" });
      }
    }
  );

  // 2. GET /api/announcements/active - Get active announcements for user (public endpoint)
  // IMPORTANT: This must be BEFORE /:id route to avoid matching "active" as an id
  app.get("/api/announcements/active",
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        
        // If user is not logged in, return empty array (no announcements for guests)
        if (!userId) {
          return res.json([]);
        }

        const { channel } = req.query;

        // Get user roles
        const userRolesData = await storage.getUserRoles(userId);
        const userRoles = userRolesData.map(r => r.name);

        // Get active announcements for this user
        const announcements = await storage.getActiveAnnouncementsForUser(
          userId,
          userRoles,
          channel as string | undefined
        );

        res.json(announcements);
      } catch (error: any) {
        console.error("Error fetching active announcements:", error);
        res.status(500).json({ message: "فشل في جلب الإعلانات النشطة" });
      }
    }
  );

  // 3. GET /api/announcements - List all with filters (admin only)
  app.get("/api/announcements",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const {
          status,
          priority,
          channel,
          tags,
          search,
          limit,
          offset,
        } = req.query;

        const filters: any = {};
        
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (channel) filters.channel = channel;
        if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
        if (search) filters.search = search;
        if (limit) filters.limit = parseInt(limit as string);
        if (offset) filters.offset = parseInt(offset as string);

        const announcements = await storage.getAllInternalAnnouncements(filters);

        res.json(announcements);
      } catch (error: any) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ message: "فشل في جلب الإعلانات" });
      }
    }
  );

  // 4. GET /api/announcements/:id - Get single announcement with details
  app.get("/api/announcements/:id",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const announcement = await storage.getInternalAnnouncementById(req.params.id);

        if (!announcement) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        res.json(announcement);
      } catch (error: any) {
        console.error("Error fetching announcement:", error);
        res.status(500).json({ message: "فشل في جلب الإعلان" });
      }
    }
  );

  // 4. PATCH /api/announcements/:id - Update announcement (auto-creates version)
  app.patch("/api/announcements/:id",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const announcementId = req.params.id;

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        // Validate request body
        const validatedData = updateInternalAnnouncementSchema.parse(req.body);

        // Check permissions for editors
        const userPermissions = await getUserPermissions(userId);
        const isAdmin = userPermissions.includes('system.admin') || 
                       userPermissions.includes('announcements.publish');
        
        // Editors can only update drafts
        if (!isAdmin && existing.status !== 'draft') {
          return res.status(403).json({ 
            message: "لا يمكن تعديل الإعلان - يمكن للمحررين تعديل المسودات فقط" 
          });
        }

        // Update announcement (auto-creates version)
        const updated = await storage.updateInternalAnnouncement(
          announcementId,
          validatedData as any,
          userId,
          req.body.changeReason
        );

        // Log activity
        await logActivity({
          userId,
          action: 'update',
          entityType: 'internal_announcement',
          entityId: announcementId,
          oldValue: { 
            title: existing.title, 
            status: existing.status,
            message: existing.message 
          },
          newValue: { 
            title: updated.title, 
            status: updated.status,
            message: updated.message 
          },
          metadata: { reason: req.body.changeReason },
        });

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating announcement:", error);
        if (error.name === 'ZodError') {
          return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
        }
        res.status(500).json({ message: "فشل في تحديث الإعلان" });
      }
    }
  );

  // 5. DELETE /api/announcements/:id - Delete announcement
  app.delete("/api/announcements/:id",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const announcementId = req.params.id;

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        // Delete announcement
        await storage.deleteInternalAnnouncement(announcementId);

        // Log activity
        await logActivity({
          userId,
          action: 'delete',
          entityType: 'internal_announcement',
          entityId: announcementId,
          oldValue: { title: existing.title, status: existing.status },
        });

        res.status(204).send();
      } catch (error: any) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ message: "فشل في حذف الإعلان" });
      }
    }
  );

  // 6. POST /api/announcements/:id/publish - Publish announcement
  app.post("/api/announcements/:id/publish",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const announcementId = req.params.id;

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        // Check if already published
        if (existing.status === 'published') {
          return res.status(400).json({ message: "الإعلان منشور بالفعل" });
        }

        // Publish announcement
        const published = await storage.publishInternalAnnouncement(announcementId, userId);

        // Log activity
        await logActivity({
          userId,
          action: 'publish',
          entityType: 'internal_announcement',
          entityId: announcementId,
          oldValue: { status: existing.status },
          newValue: { status: 'published', publishedAt: published.publishedAt },
        });

        res.json(published);
      } catch (error: any) {
        console.error("Error publishing announcement:", error);
        res.status(500).json({ message: "فشل في نشر الإعلان" });
      }
    }
  );

  // 7. POST /api/announcements/:id/archive - Archive announcement
  app.post("/api/announcements/:id/archive",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const announcementId = req.params.id;

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        // Archive announcement
        const archived = await storage.archiveInternalAnnouncement(announcementId);

        // Log activity
        await logActivity({
          userId,
          action: 'archive',
          entityType: 'internal_announcement',
          entityId: announcementId,
          oldValue: { status: existing.status },
          newValue: { status: 'archived' },
        });

        res.json(archived);
      } catch (error: any) {
        console.error("Error archiving announcement:", error);
        res.status(500).json({ message: "فشل في أرشفة الإعلان" });
      }
    }
  );

  // 8. POST /api/announcements/:id/schedule - Schedule announcement
  app.post("/api/announcements/:id/schedule",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const announcementId = req.params.id;
        const { startAt, endAt } = req.body;

        if (!startAt) {
          return res.status(400).json({ message: "تاريخ البدء مطلوب" });
        }

        // Validate dates
        const startDate = new Date(startAt);
        const endDate = endAt ? new Date(endAt) : undefined;

        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: "تاريخ البدء غير صالح" });
        }

        if (endDate && isNaN(endDate.getTime())) {
          return res.status(400).json({ message: "تاريخ الانتهاء غير صالح" });
        }

        if (endDate && endDate <= startDate) {
          return res.status(400).json({ message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء" });
        }

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        // Schedule announcement
        const scheduled = await storage.scheduleInternalAnnouncement(
          announcementId,
          startDate,
          endDate
        );

        // Log activity
        await logActivity({
          userId,
          action: 'schedule',
          entityType: 'internal_announcement',
          entityId: announcementId,
          oldValue: { 
            status: existing.status,
            startAt: existing.startAt,
            endAt: existing.endAt 
          },
          newValue: { 
            status: 'scheduled',
            startAt: startDate,
            endAt: endDate 
          },
        });

        res.json(scheduled);
      } catch (error: any) {
        console.error("Error scheduling announcement:", error);
        res.status(500).json({ message: "فشل في جدولة الإعلان" });
      }
    }
  );

  // 9. GET /api/announcements/:id/versions - Get version history
  app.get("/api/announcements/:id/versions",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const announcementId = req.params.id;

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        const versions = await storage.getAnnouncementVersions(announcementId);

        res.json(versions);
      } catch (error: any) {
        console.error("Error fetching versions:", error);
        res.status(500).json({ message: "فشل في جلب الإصدارات" });
      }
    }
  );

  // 10. POST /api/announcements/:id/versions/:versionId/restore - Restore version
  app.post("/api/announcements/:id/versions/:versionId/restore",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const { id: announcementId, versionId } = req.params;

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        // Restore version
        const restored = await storage.restoreAnnouncementVersion(versionId, userId);

        // Log activity
        await logActivity({
          userId,
          action: 'restore_version',
          entityType: 'internal_announcement',
          entityId: announcementId,
          metadata: { reason: `Restored from version ${versionId}` },
        });

        res.json(restored);
      } catch (error: any) {
        console.error("Error restoring version:", error);
        if (error.message === 'Version not found' || error.message === 'Announcement not found') {
          return res.status(404).json({ message: "الإصدار أو الإعلان غير موجود" });
        }
        res.status(500).json({ message: "فشل في استعادة الإصدار" });
      }
    }
  );

  // 11. POST /api/announcements/:id/metrics - Track event
  app.post("/api/announcements/:id/metrics",
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        const announcementId = req.params.id;
        const { event, channel, meta } = req.body;

        if (!event) {
          return res.status(400).json({ message: "نوع الحدث مطلوب" });
        }

        // Validate event type
        const validEvents = ['impression', 'unique_view', 'dismiss', 'click'];
        if (!validEvents.includes(event)) {
          return res.status(400).json({ 
            message: "نوع حدث غير صالح. الأنواع المسموحة: impression, unique_view, dismiss, click" 
          });
        }

        // Track metric
        const metric = await storage.trackAnnouncementMetric({
          announcementId,
          userId: userId || null,
          event,
          channel: channel || null,
          meta: meta || null,
        } as any);

        res.status(201).json(metric);
      } catch (error: any) {
        console.error("Error tracking metric:", error);
        res.status(500).json({ message: "فشل في تتبع الحدث" });
      }
    }
  );

  // 12. GET /api/announcements/:id/analytics - Get aggregated analytics
  app.get("/api/announcements/:id/analytics",
    requireAuth,
    requireRole('admin'),
    async (req: any, res) => {
      try {
        const announcementId = req.params.id;

        // Check if announcement exists
        const existing = await storage.getInternalAnnouncementById(announcementId);
        if (!existing) {
          return res.status(404).json({ message: "الإعلان غير موجود" });
        }

        const analytics = await storage.getAnnouncementAnalytics(announcementId);

        res.json(analytics);
      } catch (error: any) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "فشل في جلب التحليلات" });
      }
    }
  );

  // ============================================================
  // SABQ SHORTS (REELS) API ROUTES - سبق شورتس
  // ============================================================

  // ============================================================
  // PUBLIC ENDPOINTS (No auth required)
  // ============================================================

  // 1. GET /api/shorts - List all published shorts with pagination and filters
  app.get("/api/shorts", async (req, res) => {
    try {
      const { 
        page = "1", 
        limit = "20", 
        categoryId, 
        reporterId 
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

      const filters: any = {
        status: "published",
        page: pageNum,
        limit: limitNum,
      };

      if (categoryId) {
        filters.categoryId = categoryId as string;
      }

      if (reporterId) {
        filters.reporterId = reporterId as string;
      }

      const result = await storage.getAllShorts(filters);

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching shorts:", error);
      res.status(500).json({ message: "فشل في جلب الشورتس" });
    }
  });

  // 2. GET /api/shorts/featured - Get featured shorts for homepage block
  app.get("/api/shorts/featured", async (req, res) => {
    try {
      const { limit = "10" } = req.query;
      const limitNum = Math.min(20, Math.max(1, parseInt(limit as string)));

      const featuredShorts = await storage.getFeaturedShorts(limitNum);

      res.json({
        shorts: featuredShorts,
        total: featuredShorts.length,
      });
    } catch (error: any) {
      console.error("Error fetching featured shorts:", error);
      res.status(500).json({ message: "فشل في جلب الشورتس المميزة" });
    }
  });

  // 3. GET /api/shorts/:id - Get single short by ID
  app.get("/api/shorts/:id", async (req, res) => {
    try {
      const shortId = req.params.id;

      const short = await storage.getShortById(shortId);

      if (!short) {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      // Only return published shorts for public endpoint
      if (short.status !== "published") {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      res.json(short);
    } catch (error: any) {
      console.error("Error fetching short:", error);
      res.status(500).json({ message: "فشل في جلب الشورت" });
    }
  });

  // 4. GET /api/shorts/slug/:slug - Get single short by slug
  app.get("/api/shorts/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;

      const short = await storage.getShortBySlug(slug);

      if (!short) {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      // Only return published shorts for public endpoint
      if (short.status !== "published") {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      res.json(short);
    } catch (error: any) {
      console.error("Error fetching short by slug:", error);
      res.status(500).json({ message: "فشل في جلب الشورت" });
    }
  });

  // 5. POST /api/shorts/:id/view - Track view event
  app.post("/api/shorts/:id/view", async (req, res) => {
    try {
      const shortId = req.params.id;
      const userId = (req as any).user?.id || null;

      // Check if short exists and is published
      const short = await storage.getShortById(shortId);
      if (!short || short.status !== "published") {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      // Increment view count
      await storage.incrementShortViews(shortId);

      // Track analytics event
      await storage.trackShortAnalytic({
        shortId,
        userId,
        eventType: "view",
      });

      res.status(201).json({ message: "تم تسجيل المشاهدة" });
    } catch (error: any) {
      console.error("Error tracking view:", error);
      res.status(500).json({ message: "فشل في تسجيل المشاهدة" });
    }
  });

  // 6. POST /api/shorts/:id/like - Like a short
  app.post("/api/shorts/:id/like", async (req, res) => {
    try {
      const shortId = req.params.id;
      const userId = (req as any).user?.id || null;

      // Check if short exists and is published
      const short = await storage.getShortById(shortId);
      if (!short || short.status !== "published") {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      // Increment like count
      const updated = await storage.likeShort(shortId);

      // Track analytics event
      await storage.trackShortAnalytic({
        shortId,
        userId,
        eventType: "like",
      });

      res.json({ 
        message: "تم الإعجاب بالشورت",
        likes: updated.likes 
      });
    } catch (error: any) {
      console.error("Error liking short:", error);
      res.status(500).json({ message: "فشل في الإعجاب بالشورت" });
    }
  });

  // 7. POST /api/shorts/:id/unlike - Unlike a short (decrement like count)
  app.post("/api/shorts/:id/unlike", async (req, res) => {
    try {
      const shortId = req.params.id;
      const userId = (req as any).user?.id || null;

      // Check if short exists and is published
      const short = await storage.getShortById(shortId);
      if (!short || short.status !== "published") {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      // Decrement like count (we'll use the database directly for this)
      const [updated] = await db
        .update(shorts)
        .set({ 
          likes: sql`GREATEST(0, ${shorts.likes} - 1)` 
        })
        .where(eq(shorts.id, shortId))
        .returning();

      // Track analytics event
      await storage.trackShortAnalytic({
        shortId,
        userId,
        eventType: "unlike",
      });

      res.json({ 
        message: "تم إلغاء الإعجاب بالشورت",
        likes: updated.likes 
      });
    } catch (error: any) {
      console.error("Error unliking short:", error);
      res.status(500).json({ message: "فشل في إلغاء الإعجاب بالشورت" });
    }
  });

  // 8. POST /api/shorts/:id/share - Track share event
  app.post("/api/shorts/:id/share", async (req, res) => {
    try {
      const shortId = req.params.id;
      const userId = (req as any).user?.id || null;
      const { platform } = req.body;

      // Check if short exists and is published
      const short = await storage.getShortById(shortId);
      if (!short || short.status !== "published") {
        return res.status(404).json({ message: "الشورت غير موجود" });
      }

      // Increment share count
      const updated = await storage.shareShort(shortId);

      // Track analytics event with platform info
      await storage.trackShortAnalytic({
        shortId,
        userId,
        eventType: "share",
      });

      res.status(201).json({ 
        message: "تم تسجيل المشاركة",
        shares: updated.shares 
      });
    } catch (error: any) {
      console.error("Error tracking share:", error);
      res.status(500).json({ message: "فشل في تسجيل المشاركة" });
    }
  });

  // 9. POST /api/analytics/short - Track watch time and other analytics
  app.post("/api/analytics/short", async (req, res) => {
    try {
      const validatedData = insertShortAnalyticSchema.parse(req.body);
      const userId = (req as any).user?.id || null;

      // Add userId if authenticated
      const analyticData = {
        ...validatedData,
        userId,
      };

      const analytic = await storage.trackShortAnalytic(analyticData);

      res.status(201).json(analytic);
    } catch (error: any) {
      console.error("Error tracking analytics:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "بيانات غير صالحة",
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "فشل في تسجيل التحليلات" });
    }
  });

  // ============================================================
  // ADMIN/REPORTER ENDPOINTS (Auth required)
  // ============================================================

  // 10. GET /api/admin/shorts - List all shorts for admin panel (with all statuses)
  app.get("/api/admin/shorts",
    requireAuth,
    requireAnyPermission('shorts:view', 'shorts:manage'),
    async (req: any, res) => {
      try {
        const { 
          page = "1", 
          limit = "20", 
          status,
          categoryId, 
          reporterId 
        } = req.query;

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
        const offset = (pageNum - 1) * limitNum;

        // Build where conditions
        const conditions = [];
        if (status) {
          conditions.push(eq(shorts.status, status));
        }
        if (categoryId) {
          conditions.push(eq(shorts.categoryId, categoryId));
        }
        if (reporterId) {
          conditions.push(eq(shorts.reporterId, reporterId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(shorts)
          .where(whereClause);

        // Get shorts with relations - ADMIN MODE: Order by createdAt DESC (newest first)
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
          .orderBy(desc(shorts.createdAt))
          .limit(limitNum)
          .offset(offset);

        const shortsWithDetails = results.map(r => ({
          ...r.short,
          category: r.category || undefined,
          reporter: r.reporter || undefined,
        }));

        res.json({
          shorts: shortsWithDetails,
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        });
      } catch (error: any) {
        console.error("Error fetching admin shorts:", error);
        res.status(500).json({ message: "فشل في جلب الشورتس" });
      }
    }
  );

  // 11. POST /api/admin/shorts - Create new short
  app.post("/api/admin/shorts",
    requireAuth,
    requireAnyPermission('shorts:create', 'shorts:manage'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        // Validate request body
        const validatedData = insertShortSchema.parse(req.body);

        // Create short with current user as author if not specified
        const shortData: any = {
          ...validatedData,
          reporterId: validatedData.reporterId || userId,
        };

        // Auto-assign high displayOrder (timestamp in seconds) if not set - makes new shorts appear first
        if (shortData.displayOrder === undefined || shortData.displayOrder === null || shortData.displayOrder === 0) {
          shortData.displayOrder = Math.floor(Date.now() / 1000);
        }

        const newShort = await storage.createShort(shortData);

        // Log activity
        await logActivity({
          userId,
          action: 'create',
          entityType: 'short',
          entityId: newShort.id,
          newValue: { 
            title: newShort.title, 
            status: newShort.status,
            categoryId: newShort.categoryId 
          },
        });

        res.status(201).json(newShort);
      } catch (error: any) {
        console.error("Error creating short:", error);
        
        if (error.name === "ZodError") {
          return res.status(400).json({ 
            message: "بيانات غير صالحة",
            errors: error.errors 
          });
        }
        
        res.status(500).json({ message: "فشل في إنشاء الشورت" });
      }
    }
  );

  // 12. PUT /api/admin/shorts/:id - Update short
  app.put("/api/admin/shorts/:id",
    requireAuth,
    requireAnyPermission('shorts:edit', 'shorts:manage'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const shortId = req.params.id;

        // Check if short exists
        const existing = await storage.getShortById(shortId);
        if (!existing) {
          return res.status(404).json({ message: "الشورت غير موجود" });
        }

        // Validate request body
        const validatedData = updateShortSchema.parse(req.body);

        // Update short
        const updated = await storage.updateShort(shortId, validatedData);

        // Log activity
        await logActivity({
          userId,
          action: 'update',
          entityType: 'short',
          entityId: shortId,
          oldValue: { 
            title: existing.title,
            status: existing.status 
          },
          newValue: { 
            title: updated.title,
            status: updated.status 
          },
        });

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating short:", error);
        
        if (error.name === "ZodError") {
          return res.status(400).json({ 
            message: "بيانات غير صالحة",
            errors: error.errors 
          });
        }
        
        res.status(500).json({ message: "فشل في تحديث الشورت" });
      }
    }
  );

  // 13. GET /api/admin/shorts/:id - Get single short (any status) for editing
  app.get("/api/admin/shorts/:id",
    requireAuth,
    requireAnyPermission('shorts:view', 'shorts:edit', 'shorts:manage'),
    async (req: any, res) => {
      try {
        const shortId = req.params.id;

        const short = await storage.getShortById(shortId);

        if (!short) {
          return res.status(404).json({ message: "الشورت غير موجود" });
        }

        res.json(short);
      } catch (error: any) {
        console.error("Error fetching short:", error);
        res.status(500).json({ message: "فشل في جلب الشورت" });
      }
    }
  );

  // 14. DELETE /api/admin/shorts/:id - Delete short (soft delete)
  app.delete("/api/admin/shorts/:id",
    requireAuth,
    requireAnyPermission('shorts:delete', 'shorts:manage'),
    async (req: any, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "غير مصرح" });
        }

        const shortId = req.params.id;

        // Check if short exists
        const existing = await storage.getShortById(shortId);
        if (!existing) {
          return res.status(404).json({ message: "الشورت غير موجود" });
        }

        // Soft delete (set status to archived)
        const deleted = await storage.deleteShort(shortId);

        // Log activity
        await logActivity({
          userId,
          action: 'delete',
          entityType: 'short',
          entityId: shortId,
          oldValue: { 
            title: existing.title,
            status: existing.status 
          },
          newValue: { 
            status: 'archived' 
          },
        });

        res.json(deleted);
      } catch (error: any) {
        console.error("Error deleting short:", error);
        res.status(500).json({ message: "فشل في حذف الشورت" });
      }
    }
  );

  // 14. POST /api/admin/shorts/upload - Get upload URL for shorts files (images/videos)
  app.post("/api/admin/shorts/upload",
    requireAuth,
    requireAnyPermission('shorts:create', 'shorts:edit', 'shorts:manage'),
    async (req: any, res) => {
      try {
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        res.json({ uploadURL });
      } catch (error: any) {
        console.error("Error getting upload URL for shorts:", error);
        res.status(500).json({ message: "فشل في الحصول على رابط الرفع" });
      }
    }
  );

  // 15. GET /api/admin/shorts/:id/analytics - Get analytics for a short
  app.get("/api/admin/shorts/:id/analytics",
    requireAuth,
    requireAnyPermission('shorts:view', 'shorts:manage'),
    async (req: any, res) => {
      try {
        const shortId = req.params.id;
        const { eventType, startDate, endDate } = req.query;

        // Check if short exists
        const existing = await storage.getShortById(shortId);
        if (!existing) {
          return res.status(404).json({ message: "الشورت غير موجود" });
        }

        const filters: any = {};

        if (eventType) {
          filters.eventType = eventType as string;
        }

        if (startDate) {
          filters.startDate = new Date(startDate as string);
        }

        if (endDate) {
          filters.endDate = new Date(endDate as string);
        }

        const analytics = await storage.getShortAnalytics(shortId, filters);

        res.json(analytics);
      } catch (error: any) {
        console.error("Error fetching short analytics:", error);
        res.status(500).json({ message: "فشل في جلب التحليلات" });
      }
    }
  );

  // ============================================================
  // AI PUBLISHER API v1 - Machine-readable endpoints for LLMs
  // ============================================================

  // GET /api/v1/articles - List articles with full AI-ready metadata
  app.get("/api/v1/articles", async (req, res) => {
    try {
      const { 
        limit = "50", 
        offset = "0", 
        category, 
        status = "published",
        since,
        newsType,
        featured
      } = req.query;

      const limitNum = Math.min(parseInt(limit as string), 200);
      const offsetNum = parseInt(offset as string);

      let query = db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .$dynamic();

      // Default to published only
      if (status) {
        query = query.where(eq(articles.status, status as string));
      }

      // Filter by category
      if (category) {
        query = query.where(eq(articles.categoryId, category as string));
      }

      // Filter by date (articles updated/published since timestamp)
      if (since) {
        const sinceDate = new Date(since as string);
        query = query.where(gte(articles.updatedAt, sinceDate));
      }

      // Filter by news type (breaking, featured, regular)
      if (newsType) {
        query = query.where(eq(articles.newsType, newsType as string));
      }

      // Filter by featured status
      if (featured !== undefined) {
        query = query.where(eq(articles.isFeatured, featured === "true"));
      }

      query = query
        .orderBy(desc(articles.publishedAt))
        .limit(limitNum)
        .offset(offsetNum);

      const results = await query;

      // Format for AI consumption
      const formattedArticles = results.map((row) => ({
        id: row.article.id,
        url: `${req.protocol}://${req.get("host")}/article/${row.article.slug}`,
        canonical_url: `${req.protocol}://${req.get("host")}/article/${row.article.slug}`,
        title: row.article.title,
        subtitle: row.article.subtitle,
        section: row.category?.nameAr || "عام",
        section_en: row.category?.nameEn || "General",
        category_id: row.article.categoryId,
        author: row.author ? {
          id: row.author.id,
          name: `${row.author.firstName || ""} ${row.author.lastName || ""}`.trim(),
          email: row.author.email,
          profile_image: row.author.profileImageUrl,
        } : null,
        lang: "ar",
        published_at: row.article.publishedAt?.toISOString(),
        updated_at: row.article.updatedAt.toISOString(),
        summary: row.article.aiSummary || row.article.excerpt || "",
        excerpt: row.article.excerpt || "",
        full_text: row.article.content,
        image: row.article.imageUrl,
        article_type: row.article.articleType,
        news_type: row.article.newsType,
        is_featured: row.article.isFeatured,
        views: row.article.views,
        credibility_score: row.article.credibilityScore,
        seo: row.article.seo,
        rights: {
          attribution_required: true,
          training_allowed: false,
          usage: "inference-only",
          license: "Sabq-AI-Use-1.0",
        },
      }));

      res.json({
        total: formattedArticles.length,
        limit: limitNum,
        offset: offsetNum,
        articles: formattedArticles,
      });
    } catch (error) {
      console.error("Error fetching AI articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // GET /api/v1/articles/:id - Get single article with full metadata
  app.get("/api/v1/articles/:id", async (req, res) => {
    try {
      const articleId = req.params.id;

      const [result] = await db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            bio: users.bio,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!result) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Get tags for this article
      const articleTagsData = await db
        .select({
          tag: tags,
        })
        .from(articleTags)
        .innerJoin(tags, eq(articleTags.tagId, tags.id))
        .where(eq(articleTags.articleId, articleId));

      const tagsList = articleTagsData.map(t => t.tag.nameAr);

      // Format for AI consumption with full metadata
      const formattedArticle = {
        id: result.article.id,
        url: `${req.protocol}://${req.get("host")}/article/${result.article.slug}`,
        canonical_url: `${req.protocol}://${req.get("host")}/article/${result.article.slug}`,
        title: result.article.title,
        subtitle: result.article.subtitle,
        section: result.category?.nameAr || "عام",
        section_en: result.category?.nameEn || "General",
        tags: tagsList,
        author: result.author ? {
          id: result.author.id,
          name: `${result.author.firstName || ""} ${result.author.lastName || ""}`.trim(),
          email: result.author.email,
          bio: result.author.bio,
          profile_image: result.author.profileImageUrl,
          profile_url: `${req.protocol}://${req.get("host")}/reporter/${result.author.id}`,
        } : null,
        lang: "ar",
        published_at: result.article.publishedAt?.toISOString(),
        updated_at: result.article.updatedAt.toISOString(),
        created_at: result.article.createdAt.toISOString(),
        summary: result.article.aiSummary || result.article.excerpt || "",
        excerpt: result.article.excerpt || "",
        full_text: result.article.content,
        images: result.article.imageUrl ? [{
          url: result.article.imageUrl,
          caption: result.article.title,
          copyright: "© صحيفة سبق",
        }] : [],
        article_type: result.article.articleType,
        news_type: result.article.newsType,
        is_featured: result.article.isFeatured,
        views: result.article.views,
        credibility_score: result.article.credibilityScore,
        credibility_analysis: result.article.credibilityAnalysis,
        seo: result.article.seo || {},
        rights: {
          attribution_required: true,
          training_allowed: false,
          usage: "inference-only",
          license: "Sabq-AI-Use-1.0",
          attribution_text: "المصدر: صحيفة سبق",
          linkback_required: true,
        },
        content_hash: `sha256:${result.article.id}`,
      };

      res.json(formattedArticle);
    } catch (error) {
      console.error("Error fetching AI article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // GET /api/v1/search - Advanced search for LLMs
  app.get("/api/v1/search", async (req, res) => {
    try {
      const { 
        q,
        limit = "20",
        category,
        since,
        newsType
      } = req.query;

      if (!q) {
        return res.status(400).json({ message: "Search query 'q' is required" });
      }

      const limitNum = Math.min(parseInt(limit as string), 100);
      const searchQuery = q as string;

      let query = db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .$dynamic();

      // Search in title, content, excerpt
      query = query.where(
        and(
          eq(articles.status, "published"),
          or(
            ilike(articles.title, `%${searchQuery}%`),
            ilike(articles.content, `%${searchQuery}%`),
            ilike(articles.excerpt, `%${searchQuery}%`)
          )
        )
      );

      if (category) {
        query = query.where(eq(articles.categoryId, category as string));
      }

      if (since) {
        const sinceDate = new Date(since as string);
        query = query.where(gte(articles.publishedAt, sinceDate));
      }

      if (newsType) {
        query = query.where(eq(articles.newsType, newsType as string));
      }

      query = query
        .orderBy(desc(articles.publishedAt))
        .limit(limitNum);

      const results = await query;

      const formattedResults = results.map((row) => ({
        id: row.article.id,
        url: `${req.protocol}://${req.get("host")}/article/${row.article.slug}`,
        title: row.article.title,
        summary: row.article.aiSummary || row.article.excerpt || "",
        section: row.category?.nameAr || "عام",
        author: row.author ? `${row.author.firstName || ""} ${row.author.lastName || ""}`.trim() : null,
        published_at: row.article.publishedAt?.toISOString(),
        news_type: row.article.newsType,
        relevance_score: 1.0,
      }));

      res.json({
        query: searchQuery,
        total: formattedResults.length,
        results: formattedResults,
      });
    } catch (error) {
      console.error("Error searching articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  // GET /api/v1/breaking - Get breaking news only
  app.get("/api/v1/breaking", async (req, res) => {
    try {
      const { limit = "10" } = req.query;
      const limitNum = Math.min(parseInt(limit as string), 50);

      const results = await db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(
          and(
            eq(articles.status, "published"),
            eq(articles.newsType, "breaking")
          )
        )
        .orderBy(desc(articles.publishedAt))
        .limit(limitNum);

      const formattedResults = results.map((row) => ({
        id: row.article.id,
        url: `${req.protocol}://${req.get("host")}/article/${row.article.slug}`,
        title: row.article.title,
        summary: row.article.aiSummary || row.article.excerpt || "",
        section: row.category?.nameAr || "عام",
        author: row.author ? `${row.author.firstName || ""} ${row.author.lastName || ""}`.trim() : null,
        published_at: row.article.publishedAt?.toISOString(),
        image: row.article.imageUrl,
        priority: "urgent",
      }));

      res.json({
        total: formattedResults.length,
        breaking_news: formattedResults,
      });
    } catch (error) {
      console.error("Error fetching breaking news:", error);
      res.status(500).json({ message: "Failed to fetch breaking news" });
    }
  });

  // GET /api/v1/categories - Get all categories
  app.get("/api/v1/categories", async (req, res) => {
    try {
      const categoriesList = await db
        .select()
        .from(categories)
        .where(eq(categories.status, "active"))
        .orderBy(categories.displayOrder);

      const formattedCategories = categoriesList.map(cat => ({
        id: cat.id,
        name_ar: cat.nameAr,
        name_en: cat.nameEn,
        slug: cat.slug,
        description: cat.description,
        url: `${req.protocol}://${req.get("host")}/category/${cat.slug}`,
      }));

      res.json({
        total: formattedCategories.length,
        categories: formattedCategories,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // GET /.well-known/ai-usage.json - AI usage policy (machine-readable)
  app.get("/.well-known/ai-usage.json", (req, res) => {
    res.json({
      policy_version: "1.0",
      publisher: {
        name: "صحيفة سبق",
        name_en: "Sabq Newspaper",
        url: `${req.protocol}://${req.get("host")}`,
        contact: "info@sabq.org",
      },
      inference: {
        allowed: true,
        attribution: "required",
        attribution_text: "المصدر: صحيفة سبق",
        linkback: "required",
        description: "يُسمح باستخدام المحتوى لتقديم إجابات للمستخدمين مع إسناد واضح ورابط المصدر",
      },
      training: {
        allowed: false,
        contact: "partnerships@sabq.org",
        description: "تدريب النماذج الأساسية ممنوع بدون اتفاق مكتوب",
      },
      quotas: {
        free_per_day: 200,
        description: "200 طلب يومياً للاستخدام المجاني مع إسناد إلزامي",
      },
      rate_limits: {
        rpm: 120,
        rpd: 5000,
      },
      api_endpoints: {
        articles: "/api/v1/articles",
        search: "/api/v1/search",
        breaking: "/api/v1/breaking",
        categories: "/api/v1/categories",
      },
      documentation: {
        publisher_kit: `${req.protocol}://${req.get("host")}/ai-publisher`,
        policy: `${req.protocol}://${req.get("host")}/ai-policy`,
        openapi_spec: `${req.protocol}://${req.get("host")}/openapi.json`,
      },
      license: "Sabq-AI-Use-1.0",
      last_updated: "2025-10-27",
    });
  });

  // GET /openapi.json - OpenAPI 3.0 specification
  app.get("/openapi.json", (req, res) => {
    res.sendFile("openapi.json", { root: "./public" });
  });

  // ==================== Smart Categories APIs ====================
  
  // GET /api/admin/categories/smart - Get all smart categories (admin)
  app.get("/api/admin/categories/smart", requireAuth, requireAnyPermission("categories.edit"), async (req, res) => {
    try {
      const allCategories = await db
        .select()
        .from(categories)
        .orderBy(desc(categories.displayOrder));

      res.json(allCategories);
    } catch (error) {
      console.error("[Smart Categories Admin] Error fetching categories:", error);
      res.status(500).json({ message: "فشل في جلب التصنيفات" });
    }
  });

  // POST /api/admin/categories/smart - Create new smart category (admin)
  app.post("/api/admin/categories/smart", requireAuth, requireAnyPermission("categories.edit"), async (req, res) => {
    try {
      // Validate with Zod schema
      const validated = insertCategorySchema.parse(req.body);

      // Check if slug already exists
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, validated.slug))
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ message: "التصنيف بهذا الـ slug موجود بالفعل" });
      }

      // Create new category with auto-assigned displayOrder
      const insertData: any = {
        ...validated,
        displayOrder: validated.displayOrder ?? Math.floor(Date.now() / 1000),
      };
      
      const [newCategory] = await db
        .insert(categories)
        .values(insertData)
        .returning();

      res.json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      console.error("[Smart Categories Admin] Error creating category:", error);
      res.status(500).json({ message: "فشل في إنشاء التصنيف" });
    }
  });

  // PUT /api/admin/categories/smart/:id - Update smart category (admin)
  app.put("/api/admin/categories/smart/:id", requireAuth, requireAnyPermission("categories.edit"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate with Zod schema (partial update allowed)
      const validated = insertCategorySchema.partial().parse(req.body);

      // Remove id/timestamps from validated data
      delete (validated as any).id;
      delete (validated as any).createdAt;
      delete (validated as any).updatedAt;

      const updateData: any = validated;

      const [updated] = await db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "التصنيف غير موجود" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      console.error("[Smart Categories Admin] Error updating category:", error);
      res.status(500).json({ message: "فشل في تحديث التصنيف" });
    }
  });

  // DELETE /api/admin/categories/smart/:id - Delete smart category (admin)
  app.delete("/api/admin/categories/smart/:id", requireAuth, requireAnyPermission("categories.edit"), async (req, res) => {
    try {
      const { id } = req.params;

      // Check if category has articles
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(eq(articles.categoryId, id));

      if (count > 0) {
        return res.status(400).json({ 
          message: `لا يمكن حذف التصنيف لأنه يحتوي على ${count} مقال/مقالات` 
        });
      }

      await db.delete(categories).where(eq(categories.id, id));

      res.json({ message: "تم حذف التصنيف بنجاح" });
    } catch (error) {
      console.error("[Smart Categories Admin] Error deleting category:", error);
      res.status(500).json({ message: "فشل في حذف التصنيف" });
    }
  });

  // POST /api/admin/categories/smart/sync - Manually sync seasonal categories (admin)
  app.post("/api/admin/categories/smart/sync", requireAuth, requireAnyPermission("categories.edit"), async (req, res) => {
    try {
      const { updateSeasonalCategories } = await import("./smartCategoriesEngine");
      const result = await updateSeasonalCategories();

      res.json({
        message: "تم تحديث التصنيفات الموسمية بنجاح",
        activated: result.activated,
        deactivated: result.deactivated,
      });
    } catch (error) {
      console.error("[Smart Categories Admin] Error syncing categories:", error);
      res.status(500).json({ message: "فشل في مزامنة التصنيفات" });
    }
  });

  // ==================== Quad Categories Block APIs ====================
  
  // GET /api/blocks/quad-categories - Get quad categories block data for frontend
  app.get("/api/blocks/quad-categories", async (req, res) => {
    try {
      // Get active settings
      const [settings] = await db
        .select()
        .from(quadCategoriesSettings)
        .where(eq(quadCategoriesSettings.isActive, true))
        .limit(1);

      if (!settings) {
        return res.json({ items: [] });
      }

      const config = settings.config;
      const items = [];

      // Process each section
      for (const section of config.sections) {
        const category = await db
          .select()
          .from(categories)
          .where(and(
            eq(categories.slug, section.categorySlug),
            eq(categories.status, "active")
          ))
          .limit(1);

        if (!category.length) continue;

        const cat = category[0];

        // Calculate stats based on statType
        let stats: { label: string; value: number; trend?: string } = { label: "", value: 0 };
        
        if (section.statType === "dailyCount") {
          const count = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(articles)
            .where(and(
              eq(articles.categoryId, cat.id),
              eq(articles.status, "published"),
              gte(articles.publishedAt, sql`NOW() - INTERVAL '24 hours'`),
              or(
                isNull(articles.articleType),
                ne(articles.articleType, "opinion")
              )
            ));
          stats = { label: "أخبار اليوم", value: count[0]?.count || 0 };
        } else if (section.statType === "weeklyCount") {
          const count = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(articles)
            .where(and(
              eq(articles.categoryId, cat.id),
              eq(articles.status, "published"),
              gte(articles.publishedAt, sql`NOW() - INTERVAL '7 days'`),
              or(
                isNull(articles.articleType),
                ne(articles.articleType, "opinion")
              )
            ));
          stats = { label: "هذا الأسبوع", value: count[0]?.count || 0 };
        } else if (section.statType === "totalViews") {
          const sum = await db
            .select({ total: sql<number>`COALESCE(SUM(${articles.views}), 0)::int` })
            .from(articles)
            .where(and(
              eq(articles.categoryId, cat.id),
              eq(articles.status, "published"),
              or(
                isNull(articles.articleType),
                ne(articles.articleType, "opinion")
              )
            ));
          stats = { label: "إجمالي المشاهدات", value: sum[0]?.total || 0 };
        } else if (section.statType === "engagementRate") {
          // Calculate engagement rate based on reactions and comments
          const result = await db
            .select({
              totalViews: sql<number>`COALESCE(SUM(${articles.views}), 0)::int`,
              totalReactions: sql<number>`COALESCE(COUNT(DISTINCT ${reactions.id}), 0)::int`,
              totalComments: sql<number>`COALESCE(COUNT(DISTINCT ${comments.id}), 0)::int`,
            })
            .from(articles)
            .leftJoin(reactions, eq(reactions.articleId, articles.id))
            .leftJoin(comments, eq(comments.articleId, articles.id))
            .where(and(
              eq(articles.categoryId, cat.id),
              eq(articles.status, "published"),
              or(
                isNull(articles.articleType),
                ne(articles.articleType, "opinion")
              )
            ));

          const totalViews = result[0]?.totalViews || 0;
          const totalEngagements = (result[0]?.totalReactions || 0) + (result[0]?.totalComments || 0);
          const engagementRate = totalViews > 0 ? Math.round((totalEngagements / totalViews) * 100) : 0;
          
          stats = { label: "معدل التفاعل", value: engagementRate };
        }

        // Get articles based on headlineMode
        let articlesQuery = db
          .select({
            article: articles,
            author: users,
          })
          .from(articles)
          .leftJoin(users, eq(articles.authorId, users.id))
          .where(and(
            eq(articles.categoryId, cat.id),
            eq(articles.status, "published"),
            or(
              isNull(articles.articleType),
              ne(articles.articleType, "opinion")
            )
          ))
          .$dynamic();

        if (section.headlineMode === "mostViewed") {
          articlesQuery = articlesQuery.orderBy(desc(articles.views), desc(articles.publishedAt));
        } else if (section.headlineMode === "editorsPick") {
          articlesQuery = articlesQuery
            .where(and(
              eq(articles.categoryId, cat.id),
              eq(articles.status, "published"),
              eq(articles.isFeatured, true)
            ))
            .orderBy(desc(articles.publishedAt));
        } else {
          articlesQuery = articlesQuery.orderBy(desc(articles.publishedAt));
        }

        const articlesList = await articlesQuery.limit(section.listSize + 1);

        if (!articlesList.length) continue;

        // Featured article (first one)
        const featuredData = articlesList[0];
        const timeDiff = featuredData.article.publishedAt 
          ? Date.now() - new Date(featuredData.article.publishedAt).getTime()
          : 0;
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const isFresh = hoursAgo <= config.freshHours;

        let badge = null;
        if (config.badges.breaking && featuredData.article.newsType === "breaking") {
          badge = "عاجل";
        } else if (config.badges.analysis && featuredData.article.articleType === "analysis") {
          badge = "تحليل";
        }

        const featured = {
          id: featuredData.article.id,
          title: featuredData.article.title,
          image: featuredData.article.imageUrl,
          href: `/article/${featuredData.article.slug}`,
          meta: {
            age: hoursAgo < 1 ? "منذ دقائق" : hoursAgo < 24 ? `منذ ${hoursAgo}س` : `منذ ${Math.floor(hoursAgo / 24)}ي`,
            readMins: 3,
            views: featuredData.article.views,
            badge: isFresh && hoursAgo < 2 ? "جديد" : badge,
          },
        };

        // List items (remaining articles)
        const list = articlesList.slice(1).map((item) => {
          const timeDiff = item.article.publishedAt 
            ? Date.now() - new Date(item.article.publishedAt).getTime()
            : 0;
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

          return {
            id: item.article.id,
            title: item.article.title,
            href: `/article/${item.article.slug}`,
            meta: {
              views: item.article.views,
              age: hoursAgo < 1 ? "دقائق" : hoursAgo < 24 ? `${hoursAgo}س` : `${Math.floor(hoursAgo / 24)}ي`,
            },
          };
        });

        items.push({
          category: {
            slug: cat.slug,
            name: cat.nameAr,
            icon: cat.icon || "folder",
          },
          stats,
          featured,
          list,
          teaser: section.teaser || "",
        });
      }

      res.json({
        items,
        mobileCarousel: config.mobileCarousel,
        backgroundColor: config.backgroundColor,
      });
    } catch (error) {
      console.error("Error fetching quad categories block:", error);
      res.status(500).json({ message: "فشل تحميل بلوك التصنيفات" });
    }
  });

  // GET /api/admin/blocks/quad-categories/settings - Get current settings (admin)
  app.get("/api/admin/blocks/quad-categories/settings", requireAuth, requireAnyPermission("system.manage_themes", "articles.edit_any"), async (req, res) => {
    try {
      const [settings] = await db
        .select()
        .from(quadCategoriesSettings)
        .where(eq(quadCategoriesSettings.isActive, true))
        .limit(1);

      if (!settings) {
        // Return default configuration
        return res.json({
          config: {
            sections: [
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
            ],
            mobileCarousel: true,
            freshHours: 12,
            badges: {
              exclusive: true,
              breaking: true,
              analysis: true,
            },
            backgroundColor: undefined,
          },
          isActive: true,
        });
      }

      res.json({
        config: settings.config,
        isActive: settings.isActive,
      });
    } catch (error) {
      console.error("Error fetching quad categories settings:", error);
      res.status(500).json({ message: "فشل تحميل الإعدادات" });
    }
  });

  // PUT /api/admin/blocks/quad-categories/settings - Update settings (admin)
  app.put("/api/admin/blocks/quad-categories/settings", requireAuth, requireAnyPermission("system.manage_themes", "articles.edit_any"), async (req, res) => {
    try {
      const validated = insertQuadCategoriesSettingsSchema.parse(req.body);

      // Deactivate existing settings
      await db
        .update(quadCategoriesSettings)
        .set({ isActive: false })
        .where(eq(quadCategoriesSettings.isActive, true));

      // Create new settings
      const [newSettings] = await db
        .insert(quadCategoriesSettings)
        .values({
          config: validated.config,
          isActive: true,
        })
        .returning();

      // Log activity
      await logActivity({
        userId: (req.user as any).id,
        action: "quad_categories_settings_update",
        entityType: "quad_categories_settings",
        entityId: newSettings.id,
        newValue: { config: validated.config },
      });

      res.json({
        message: "تم حفظ الإعدادات بنجاح",
        settings: newSettings,
      });
    } catch (error: any) {
      console.error("Error updating quad categories settings:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل حفظ الإعدادات" });
    }
  });

  // ==================== English Quad Categories Block APIs ====================
  
  // GET /api/en/blocks/quad-categories - Get English quad categories block data for frontend
  app.get("/api/en/blocks/quad-categories", async (req, res) => {
    try {
      // Get active settings
      const [settings] = await db
        .select()
        .from(enQuadCategoriesSettings)
        .where(eq(enQuadCategoriesSettings.isActive, true))
        .limit(1);

      if (!settings) {
        return res.json({ items: [] });
      }

      const config = settings.config;
      const items = [];

      // Process each section
      for (const section of config.sections) {
        const category = await db
          .select()
          .from(enCategories)
          .where(and(
            eq(enCategories.slug, section.categorySlug),
            eq(enCategories.status, "active")
          ))
          .limit(1);

        if (!category.length) continue;

        const cat = category[0];

        // Calculate stats based on statType
        let stats: { label: string; value: number; trend?: string } = { label: "", value: 0 };
        
        if (section.statType === "dailyCount") {
          const count = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(enArticles)
            .where(and(
              eq(enArticles.categoryId, cat.id),
              eq(enArticles.status, "published"),
              gte(enArticles.publishedAt, sql`NOW() - INTERVAL '24 hours'`),
              or(
                isNull(enArticles.articleType),
                ne(enArticles.articleType, "opinion")
              )
            ));
          stats = { label: "Today's News", value: count[0]?.count || 0 };
        } else if (section.statType === "weeklyCount") {
          const count = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(enArticles)
            .where(and(
              eq(enArticles.categoryId, cat.id),
              eq(enArticles.status, "published"),
              gte(enArticles.publishedAt, sql`NOW() - INTERVAL '7 days'`),
              or(
                isNull(enArticles.articleType),
                ne(enArticles.articleType, "opinion")
              )
            ));
          stats = { label: "This Week", value: count[0]?.count || 0 };
        } else if (section.statType === "totalViews") {
          const sum = await db
            .select({ total: sql<number>`COALESCE(SUM(${enArticles.views}), 0)::int` })
            .from(enArticles)
            .where(and(
              eq(enArticles.categoryId, cat.id),
              eq(enArticles.status, "published"),
              or(
                isNull(enArticles.articleType),
                ne(enArticles.articleType, "opinion")
              )
            ));
          stats = { label: "Total Views", value: sum[0]?.total || 0 };
        } else if (section.statType === "engagementRate") {
          // Calculate engagement rate based on reactions and comments
          const result = await db
            .select({
              totalViews: sql<number>`COALESCE(SUM(${enArticles.views}), 0)::int`,
              totalReactions: sql<number>`COALESCE(COUNT(DISTINCT ${enReactions.id}), 0)::int`,
              totalComments: sql<number>`COALESCE(COUNT(DISTINCT ${enComments.id}), 0)::int`,
            })
            .from(enArticles)
            .leftJoin(enReactions, eq(enReactions.articleId, enArticles.id))
            .leftJoin(enComments, eq(enComments.articleId, enArticles.id))
            .where(and(
              eq(enArticles.categoryId, cat.id),
              eq(enArticles.status, "published"),
              or(
                isNull(enArticles.articleType),
                ne(enArticles.articleType, "opinion")
              )
            ));

          const totalViews = result[0]?.totalViews || 0;
          const totalEngagements = (result[0]?.totalReactions || 0) + (result[0]?.totalComments || 0);
          const engagementRate = totalViews > 0 ? Math.round((totalEngagements / totalViews) * 100) : 0;
          
          stats = { label: "Engagement Rate", value: engagementRate };
        }

        // Get articles based on headlineMode
        let articlesQuery = db
          .select({
            article: enArticles,
            author: users,
          })
          .from(enArticles)
          .leftJoin(users, eq(enArticles.authorId, users.id))
          .where(and(
            eq(enArticles.categoryId, cat.id),
            eq(enArticles.status, "published"),
            or(
              isNull(enArticles.articleType),
              ne(enArticles.articleType, "opinion")
            )
          ))
          .$dynamic();

        if (section.headlineMode === "mostViewed") {
          articlesQuery = articlesQuery.orderBy(desc(enArticles.views), desc(enArticles.publishedAt));
        } else if (section.headlineMode === "editorsPick") {
          articlesQuery = articlesQuery
            .where(and(
              eq(enArticles.categoryId, cat.id),
              eq(enArticles.status, "published"),
              eq(enArticles.isFeatured, true)
            ))
            .orderBy(desc(enArticles.publishedAt));
        } else {
          articlesQuery = articlesQuery.orderBy(desc(enArticles.publishedAt));
        }

        const articlesList = await articlesQuery.limit(section.listSize + 1);

        if (!articlesList.length) continue;

        // Featured article (first one)
        const featuredData = articlesList[0];
        const timeDiff = featuredData.article.publishedAt 
          ? Date.now() - new Date(featuredData.article.publishedAt).getTime()
          : 0;
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const isFresh = hoursAgo <= config.freshHours;

        let badge = null;
        if (config.badges.breaking && featuredData.article.newsType === "breaking") {
          badge = "Breaking";
        } else if (config.badges.analysis && featuredData.article.articleType === "analysis") {
          badge = "Analysis";
        }

        const featured = {
          id: featuredData.article.id,
          title: featuredData.article.title,
          image: featuredData.article.imageUrl,
          href: `/en/article/${featuredData.article.slug}`,
          meta: {
            age: hoursAgo < 1 ? "minutes ago" : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.floor(hoursAgo / 24)}d`,
            readMins: 3,
            views: featuredData.article.views,
            badge: isFresh && hoursAgo < 2 ? "New" : badge,
          },
        };

        // List items (remaining articles)
        const list = articlesList.slice(1).map((item) => {
          const timeDiff = item.article.publishedAt 
            ? Date.now() - new Date(item.article.publishedAt).getTime()
            : 0;
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

          return {
            id: item.article.id,
            title: item.article.title,
            href: `/en/article/${item.article.slug}`,
            meta: {
              views: item.article.views,
              age: hoursAgo < 1 ? "min" : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.floor(hoursAgo / 24)}d`,
            },
          };
        });

        items.push({
          category: {
            slug: cat.slug,
            name: cat.name,
            icon: cat.icon || "folder",
          },
          stats,
          featured,
          list,
          teaser: section.teaser || "",
        });
      }

      res.json({
        items,
        mobileCarousel: config.mobileCarousel,
        backgroundColor: config.backgroundColor,
      });
    } catch (error) {
      console.error("Error fetching English quad categories block:", error);
      res.status(500).json({ message: "Failed to load quad categories block" });
    }
  });

  // GET /api/en/admin/blocks/quad-categories/settings - Get current settings (admin)
  app.get("/api/en/admin/blocks/quad-categories/settings", requireAuth, requireAnyPermission("system.manage_themes", "articles.edit_any"), async (req, res) => {
    try {
      const [settings] = await db
        .select()
        .from(enQuadCategoriesSettings)
        .where(eq(enQuadCategoriesSettings.isActive, true))
        .limit(1);

      if (!settings) {
        // Return default configuration
        return res.json({
          config: {
            sections: [
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
              {
                categorySlug: "",
                headlineMode: "latest" as const,
                statType: "dailyCount" as const,
                teaser: "",
                listSize: 5,
              },
            ],
            mobileCarousel: true,
            freshHours: 12,
            badges: {
              exclusive: true,
              breaking: true,
              analysis: true,
            },
            backgroundColor: undefined,
          },
          isActive: true,
        });
      }

      res.json({
        config: settings.config,
        isActive: settings.isActive,
      });
    } catch (error) {
      console.error("Error fetching English quad categories settings:", error);
      res.status(500).json({ message: "Failed to load settings" });
    }
  });

  // PUT /api/en/admin/blocks/quad-categories/settings - Update settings (admin)
  app.put("/api/en/admin/blocks/quad-categories/settings", requireAuth, requireAnyPermission("system.manage_themes", "articles.edit_any"), async (req, res) => {
    try {
      const validated = insertEnQuadCategoriesSettingsSchema.parse(req.body);

      // Deactivate existing settings
      await db
        .update(enQuadCategoriesSettings)
        .set({ isActive: false })
        .where(eq(enQuadCategoriesSettings.isActive, true));

      // Create new settings
      const [newSettings] = await db
        .insert(enQuadCategoriesSettings)
        .values({
          config: validated.config,
          isActive: true,
        })
        .returning();

      // Log activity
      await logActivity({
        userId: (req.user as any).id,
        action: "en_quad_categories_settings_update",
        entityType: "en_quad_categories_settings",
        entityId: newSettings.id,
        newValue: { config: validated.config },
      });

      res.json({
        message: "Settings saved successfully",
        settings: newSettings,
      });
    } catch (error: any) {
      console.error("Error updating English quad categories settings:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // ==================== Urdu Quad Categories Block APIs ====================
  
  // GET /api/ur/blocks/quad-categories - Get Urdu quad categories block data for frontend
  app.get("/api/ur/blocks/quad-categories", async (req, res) => {
    try {
      // Get active settings
      const [settings] = await db
        .select()
        .from(urQuadCategoriesSettings)
        .where(eq(urQuadCategoriesSettings.isActive, true))
        .limit(1);

      if (!settings) {
        return res.json({ items: [] });
      }

      const config = settings.config;
      const items = [];

      // Process each section
      for (const section of config.sections) {
        const category = await db
          .select()
          .from(urCategories)
          .where(and(
            eq(urCategories.slug, section.categorySlug),
            eq(urCategories.status, "active")
          ))
          .limit(1);

        if (!category.length) continue;

        const cat = category[0];

        // Calculate stats based on statType
        let stats: { label: string; value: number; trend?: string } = { label: "", value: 0 };
        
        if (section.statType === "dailyCount") {
          const count = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(urArticles)
            .where(and(
              eq(urArticles.categoryId, cat.id),
              eq(urArticles.status, "published"),
              gte(urArticles.publishedAt, sql`NOW() - INTERVAL '24 hours'`)
            ));
          stats = { label: "آج کی خبریں", value: count[0]?.count || 0 };
        } else if (section.statType === "weeklyCount") {
          const count = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(urArticles)
            .where(and(
              eq(urArticles.categoryId, cat.id),
              eq(urArticles.status, "published"),
              gte(urArticles.publishedAt, sql`NOW() - INTERVAL '7 days'`)
            ));
          stats = { label: "اس ہفتے", value: count[0]?.count || 0 };
        } else if (section.statType === "totalViews") {
          const sum = await db
            .select({ total: sql<number>`COALESCE(SUM(${urArticles.views}), 0)::int` })
            .from(urArticles)
            .where(and(
              eq(urArticles.categoryId, cat.id),
              eq(urArticles.status, "published")
            ));
          stats = { label: "کل ملاحظات", value: sum[0]?.total || 0 };
        }

        // Get articles based on headlineMode
        let articlesQuery = db
          .select()
          .from(urArticles)
          .where(and(
            eq(urArticles.categoryId, cat.id),
            eq(urArticles.status, "published")
          ))
          .$dynamic();

        if (section.headlineMode === "mostViewed") {
          articlesQuery = articlesQuery.orderBy(desc(urArticles.views), desc(urArticles.publishedAt));
        } else if (section.headlineMode === "editorsPick") {
          articlesQuery = articlesQuery
            .where(and(
              eq(urArticles.categoryId, cat.id),
              eq(urArticles.status, "published"),
              eq(urArticles.isFeatured, true)
            ))
            .orderBy(desc(urArticles.publishedAt));
        } else {
          articlesQuery = articlesQuery.orderBy(desc(urArticles.publishedAt));
        }

        const articlesList = await articlesQuery.limit(section.listSize + 1);

        if (!articlesList.length) continue;

        // Featured article (first one)
        const featuredArticle = articlesList[0];
        const timeDiff = featuredArticle.publishedAt 
          ? Date.now() - new Date(featuredArticle.publishedAt).getTime()
          : 0;
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const isFresh = hoursAgo <= config.freshHours;

        let badge = null;
        if (config.badges.breaking && featuredArticle.newsType === "breaking") {
          badge = "تازہ";
        }

        const featured = {
          id: featuredArticle.id,
          title: featuredArticle.title,
          image: featuredArticle.imageUrl,
          href: `/ur/article/${featuredArticle.slug}`,
          meta: {
            age: hoursAgo < 1 ? "منٹ قبل" : hoursAgo < 24 ? `${hoursAgo} گھنٹے قبل` : `${Math.floor(hoursAgo / 24)} دن قبل`,
            readMins: 3,
            views: featuredArticle.views,
            badge: isFresh && hoursAgo < 2 ? "نیا" : badge,
          },
        };

        // List items (remaining articles)
        const list = articlesList.slice(1).map((item) => {
          const timeDiff = item.publishedAt 
            ? Date.now() - new Date(item.publishedAt).getTime()
            : 0;
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

          return {
            id: item.id,
            title: item.title,
            href: `/ur/article/${item.slug}`,
            meta: {
              views: item.views,
              age: hoursAgo < 1 ? "منٹ" : hoursAgo < 24 ? `${hoursAgo}گھ` : `${Math.floor(hoursAgo / 24)}د`,
            },
          };
        });

        items.push({
          category: {
            slug: cat.slug,
            name: cat.name,
            icon: cat.icon || "folder",
          },
          stats,
          featured,
          list,
          teaser: section.teaser || "",
        });
      }

      res.json({
        items,
        mobileCarousel: config.mobileCarousel,
        backgroundColor: config.backgroundColor,
      });
    } catch (error) {
      console.error("Error fetching Urdu quad categories block:", error);
      res.status(500).json({ message: "Failed to load quad categories block" });
    }
  });

  // GET /api/ur/admin/blocks/quad-categories/settings - Get current settings (admin)
  app.get("/api/ur/admin/blocks/quad-categories/settings", requireAuth, requireAnyPermission("system.manage_themes", "articles.edit_any"), async (req, res) => {
    try {
      const [settings] = await db
        .select()
        .from(urQuadCategoriesSettings)
        .where(eq(urQuadCategoriesSettings.isActive, true))
        .limit(1);

      if (!settings) {
        // Return default configuration
        return res.json({
          config: {
            sections: [
              { categorySlug: "", headlineMode: "latest", statType: "dailyCount", teaser: "", listSize: 5 },
              { categorySlug: "", headlineMode: "latest", statType: "dailyCount", teaser: "", listSize: 5 },
              { categorySlug: "", headlineMode: "latest", statType: "dailyCount", teaser: "", listSize: 5 },
              { categorySlug: "", headlineMode: "latest", statType: "dailyCount", teaser: "", listSize: 5 },
            ],
            mobileCarousel: true,
            freshHours: 12,
            badges: {
              exclusive: true,
              breaking: true,
              analysis: true,
            },
          },
          isActive: false,
        });
      }

      res.json({
        config: settings.config,
        isActive: settings.isActive,
      });
    } catch (error) {
      console.error("Error fetching Urdu quad categories settings:", error);
      res.status(500).json({ message: "Failed to load settings" });
    }
  });

  // PUT /api/ur/admin/blocks/quad-categories/settings - Update settings (admin)
  app.put("/api/ur/admin/blocks/quad-categories/settings", requireAuth, requireAnyPermission("system.manage_themes", "articles.edit_any"), async (req, res) => {
    try {
      const validated = insertUrQuadCategoriesSettingsSchema.parse(req.body);

      // Deactivate existing settings
      await db
        .update(urQuadCategoriesSettings)
        .set({ isActive: false })
        .where(eq(urQuadCategoriesSettings.isActive, true));

      // Create new settings
      const [newSettings] = await db
        .insert(urQuadCategoriesSettings)
        .values({
          config: validated.config,
          isActive: true,
        })
        .returning();

      // Log activity
      await logActivity({
        userId: (req.user as any).id,
        action: "ur_quad_categories_settings_update",
        entityType: "ur_quad_categories_settings",
        entityId: newSettings.id,
        newValue: { config: validated.config },
      });

      res.json({
        message: "Settings saved successfully",
        settings: newSettings,
      });
    } catch (error: any) {
      console.error("Error updating Urdu quad categories settings:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // ============================================================================
  // Analytics Dashboard APIs
  // ============================================================================

  // GET /api/analytics/overview - Get analytics metrics summary with percentage changes
  app.get("/api/analytics/overview", 
    requireAuth, 
    requireAnyPermission("analytics.view", "articles.view"), 
    cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM }),
    async (req, res) => {
      try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Upper bound for "this month" queries
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Helper function to calculate percentage change
        const calculateChange = (current: number, previous: number): number => {
          if (previous === 0) {
            // If no previous data but we have current data, show 100% growth
            return current > 0 ? 100 : 0;
          }
          return Math.round(((current - previous) / previous) * 100);
        };

        // LIFETIME TOTALS (all-time counts)
        
        // Get LIFETIME total views (count of all reading history entries)
        const [lifetimeViews] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(readingHistory);

        // Get views for this month (for month-over-month comparison)
        // Date range: thisMonthStart (inclusive) to nextMonthStart (exclusive)
        const [thisMonthViews] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(readingHistory)
          .where(and(
            gte(readingHistory.readAt, thisMonthStart),
            lt(readingHistory.readAt, nextMonthStart)
          ));

        // Get views for last month (for month-over-month comparison)
        const [lastMonthViews] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(readingHistory)
          .where(and(
            gte(readingHistory.readAt, lastMonthStart),
            lte(readingHistory.readAt, lastMonthEnd)
          ));

        const totalViews = lifetimeViews?.count || 0;
        const viewsChange = calculateChange(thisMonthViews?.count || 0, lastMonthViews?.count || 0);

        // Get LIFETIME total users (all users ever created, excluding deleted)
        const [lifetimeUsers] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(users)
          .where(isNull(users.deletedAt));

        // Get new users this month (for month-over-month comparison)
        // Date range: thisMonthStart (inclusive) to nextMonthStart (exclusive)
        const [thisMonthUsers] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(users)
          .where(and(
            gte(users.createdAt, thisMonthStart),
            lt(users.createdAt, nextMonthStart),
            isNull(users.deletedAt)
          ));

        // Get new users last month (for month-over-month comparison)
        const [lastMonthUsers] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(users)
          .where(and(
            gte(users.createdAt, lastMonthStart),
            lte(users.createdAt, lastMonthEnd),
            isNull(users.deletedAt)
          ));

        const totalUsers = lifetimeUsers?.count || 0;
        const usersChange = calculateChange(thisMonthUsers?.count || 0, lastMonthUsers?.count || 0);

        // Get LIFETIME total articles (all published articles)
        const [lifetimeArticles] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(articles)
          .where(eq(articles.status, "published"));

        // Get articles published this month (for month-over-month comparison)
        // Date range: thisMonthStart (inclusive) to nextMonthStart (exclusive)
        const [thisMonthArticles] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(articles)
          .where(and(
            eq(articles.status, "published"),
            gte(articles.publishedAt, thisMonthStart),
            lt(articles.publishedAt, nextMonthStart)
          ));

        // Get articles published last month (for month-over-month comparison)
        const [lastMonthArticles] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(articles)
          .where(and(
            eq(articles.status, "published"),
            gte(articles.publishedAt, lastMonthStart),
            lte(articles.publishedAt, lastMonthEnd)
          ));

        const totalArticles = lifetimeArticles?.count || 0;
        const articlesChange = calculateChange(thisMonthArticles?.count || 0, lastMonthArticles?.count || 0);

        // Get LIFETIME total comments
        const [lifetimeComments] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(comments);

        // Get comments this month (for month-over-month comparison)
        // Date range: thisMonthStart (inclusive) to nextMonthStart (exclusive)
        const [thisMonthComments] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(comments)
          .where(and(
            gte(comments.createdAt, thisMonthStart),
            lt(comments.createdAt, nextMonthStart)
          ));

        // Get comments last month (for month-over-month comparison)
        const [lastMonthComments] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(comments)
          .where(and(
            gte(comments.createdAt, lastMonthStart),
            lte(comments.createdAt, lastMonthEnd)
          ));

        const totalComments = lifetimeComments?.count || 0;
        const commentsChange = calculateChange(thisMonthComments?.count || 0, lastMonthComments?.count || 0);

        // Get LIFETIME total likes (reactions)
        const [lifetimeLikes] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(reactions);

        // Get likes this month (for month-over-month comparison)
        // Date range: thisMonthStart (inclusive) to nextMonthStart (exclusive)
        const [thisMonthLikes] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(reactions)
          .where(and(
            gte(reactions.createdAt, thisMonthStart),
            lt(reactions.createdAt, nextMonthStart)
          ));

        // Get likes last month (for month-over-month comparison)
        const [lastMonthLikes] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(reactions)
          .where(and(
            gte(reactions.createdAt, lastMonthStart),
            lte(reactions.createdAt, lastMonthEnd)
          ));

        const totalLikes = lifetimeLikes?.count || 0;
        const likesChange = calculateChange(thisMonthLikes?.count || 0, lastMonthLikes?.count || 0);

        // Get LIFETIME total bookmarks
        const [lifetimeBookmarks] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(bookmarks);

        // Get bookmarks this month (for month-over-month comparison)
        // Date range: thisMonthStart (inclusive) to nextMonthStart (exclusive)
        const [thisMonthBookmarks] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(bookmarks)
          .where(and(
            gte(bookmarks.createdAt, thisMonthStart),
            lt(bookmarks.createdAt, nextMonthStart)
          ));

        // Get bookmarks last month (for month-over-month comparison)
        const [lastMonthBookmarks] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(bookmarks)
          .where(and(
            gte(bookmarks.createdAt, lastMonthStart),
            lte(bookmarks.createdAt, lastMonthEnd)
          ));

        const totalBookmarks = lifetimeBookmarks?.count || 0;
        const bookmarksChange = calculateChange(thisMonthBookmarks?.count || 0, lastMonthBookmarks?.count || 0);

        res.json({
          totalViews,
          viewsChange,
          totalUsers,
          usersChange,
          totalArticles,
          articlesChange,
          totalComments,
          commentsChange,
          totalLikes,
          likesChange,
          totalBookmarks,
          bookmarksChange,
        });
      } catch (error) {
        console.error("Error fetching analytics overview:", error);
        res.status(500).json({ message: "Failed to fetch analytics overview" });
      }
    }
  );

  // GET /api/analytics/chart - Get time-series data for charts (12 months)
  app.get("/api/analytics/chart",
    requireAuth,
    requireAnyPermission("analytics.view", "articles.view"),
    cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM }),
    async (req, res) => {
      try {
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        // Use SQL GROUP BY to aggregate data by month (OPTIMIZED)
        
        // Get views per month using GROUP BY
        const viewsData = await db
          .select({
            month: sql<string>`TO_CHAR(${readingHistory.readAt}, 'YYYY-MM')`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(readingHistory)
          .where(gte(readingHistory.readAt, twelveMonthsAgo))
          .groupBy(sql`TO_CHAR(${readingHistory.readAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${readingHistory.readAt}, 'YYYY-MM')`);

        // Get new users per month using GROUP BY
        const usersData = await db
          .select({
            month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(users)
          .where(and(
            gte(users.createdAt, twelveMonthsAgo),
            isNull(users.deletedAt)
          ))
          .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`);

        // Get published articles per month using GROUP BY
        const articlesData = await db
          .select({
            month: sql<string>`TO_CHAR(${articles.publishedAt}, 'YYYY-MM')`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(articles)
          .where(and(
            eq(articles.status, "published"),
            gte(articles.publishedAt, twelveMonthsAgo)
          ))
          .groupBy(sql`TO_CHAR(${articles.publishedAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${articles.publishedAt}, 'YYYY-MM')`);

        // Create maps for quick lookup
        const viewsMap = new Map(viewsData.map(item => [item.month, item.count]));
        const usersMap = new Map(usersData.map(item => [item.month, item.count]));
        const articlesMap = new Map(articlesData.map(item => [item.month, item.count]));

        // Ensure EXACTLY 12 data points (fill missing months with 0)
        const months: string[] = [];
        const viewsArray: number[] = [];
        const usersArray: number[] = [];
        const articlesArray: number[] = [];

        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
          const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          months.push(monthName);
          viewsArray.push(viewsMap.get(yearMonth) || 0);
          usersArray.push(usersMap.get(yearMonth) || 0);
          articlesArray.push(articlesMap.get(yearMonth) || 0);
        }

        res.json({
          months,
          views: viewsArray,
          users: usersArray,
          articles: articlesArray,
        });
      } catch (error) {
        console.error("Error fetching analytics chart data:", error);
        res.status(500).json({ message: "Failed to fetch analytics chart data" });
      }
    }
  );

  // GET /api/analytics/top-content - Get top 10 articles by views
  app.get("/api/analytics/top-content",
    requireAuth,
    requireAnyPermission("analytics.view", "articles.view"),
    cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM }),
    async (req, res) => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Get top 10 articles by views with category info
        const topArticles = await db
          .select({
            id: articles.id,
            title: articles.title,
            slug: articles.slug,
            views: articles.views,
            publishedAt: articles.publishedAt,
            categoryId: articles.categoryId,
            categoryName: categories.nameAr,
            categorySlug: categories.slug,
          })
          .from(articles)
          .leftJoin(categories, eq(articles.categoryId, categories.id))
          .where(and(
            eq(articles.status, "published"),
            gte(articles.publishedAt, thirtyDaysAgo)
          ))
          .orderBy(desc(articles.views))
          .limit(10);

        // Calculate view changes for each article (compare with previous 30 days)
        const enrichedArticles = await Promise.all(
          topArticles.map(async (article) => {
            // Get views in last 30 days
            const [currentPeriodViews] = await db
              .select({ count: sql<number>`COUNT(*)::int` })
              .from(readingHistory)
              .where(and(
                eq(readingHistory.articleId, article.id),
                gte(readingHistory.readAt, thirtyDaysAgo)
              ));

            // Get views in previous 30 days (30-60 days ago)
            const [previousPeriodViews] = await db
              .select({ count: sql<number>`COUNT(*)::int` })
              .from(readingHistory)
              .where(and(
                eq(readingHistory.articleId, article.id),
                gte(readingHistory.readAt, sixtyDaysAgo),
                lte(readingHistory.readAt, thirtyDaysAgo)
              ));

            const currentViews = currentPeriodViews?.count || 0;
            const previousViews = previousPeriodViews?.count || 0;
            
            // Calculate percentage change (fixed: returns 0 instead of 100 when previousViews = 0)
            let change = 0;
            if (previousViews > 0) {
              change = Math.round(((currentViews - previousViews) / previousViews) * 100);
            }
            // If previousViews === 0, change remains 0 (not 100)

            return {
              id: article.id,
              title: article.title,
              slug: article.slug,
              views: article.views || 0,
              category: article.categoryName || 'Uncategorized',
              categorySlug: article.categorySlug || 'uncategorized',
              publishedAt: article.publishedAt?.toISOString() || '',
              change,
            };
          })
        );

        res.json(enrichedArticles);
      } catch (error) {
        console.error("Error fetching top content:", error);
        res.status(500).json({ message: "Failed to fetch top content" });
      }
    }
  );

  // GET /api/analytics/recent-activity - Get latest 20 activities
  app.get("/api/analytics/recent-activity",
    requireAuth,
    requireAnyPermission("analytics.view", "articles.view"),
    cacheControl({ maxAge: CACHE_DURATIONS.MEDIUM }),
    async (req, res) => {
      try {
        // Get latest activities from activityLogs
        // Using INNER JOIN to filter out activities with null/undefined users
        const activities = await db
          .select({
            id: activityLogs.id,
            action: activityLogs.action,
            entityType: activityLogs.entityType,
            entityId: activityLogs.entityId,
            userId: activityLogs.userId,
            metadata: activityLogs.metadata,
            createdAt: activityLogs.createdAt,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          })
          .from(activityLogs)
          .innerJoin(users, eq(activityLogs.userId, users.id))
          .orderBy(desc(activityLogs.createdAt))
          .limit(20);

        // Transform activities to the required format
        const formattedActivities = await Promise.all(
          activities.map(async (activity) => {
            let type: string = 'other';
            let description: string = '';
            let metadata: any = {};

            // Determine activity type and description based on action
            if (activity.action.includes('article')) {
              type = activity.action.includes('delete') ? 'delete' :
                     activity.action.includes('edit') || activity.action.includes('update') ? 'edit' :
                     activity.action.includes('create') || activity.action.includes('publish') ? 'article' :
                     'other';
              
              // Try to get article title
              if (activity.entityId) {
                const [article] = await db
                  .select({ title: articles.title })
                  .from(articles)
                  .where(eq(articles.id, activity.entityId))
                  .limit(1);
                
                if (article) {
                  metadata.articleTitle = article.title;
                  description = `${activity.action} - ${article.title}`;
                } else {
                  description = activity.action;
                }
              }
            } else if (activity.action.includes('comment')) {
              type = activity.action.includes('delete') ? 'delete' : 'comment';
              
              // Try to get comment text
              if (activity.entityId) {
                const [comment] = await db
                  .select({ content: comments.content })
                  .from(comments)
                  .where(eq(comments.id, activity.entityId))
                  .limit(1);
                
                if (comment) {
                  metadata.commentText = comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '');
                  description = `${activity.action} - ${metadata.commentText}`;
                } else {
                  description = activity.action;
                }
              }
            } else if (activity.action.includes('reaction') || activity.action.includes('like')) {
              type = 'like';
              description = activity.action;
            } else if (activity.action.includes('follow')) {
              type = 'follow';
              description = activity.action;
            } else {
              type = 'other';
              description = activity.action;
            }

            return {
              id: activity.id,
              type,
              user: {
                name: `${activity.firstName || ''} ${activity.lastName || ''}`.trim() || 'Unknown User',
                avatar: activity.profileImageUrl || null,
              },
              description,
              timestamp: activity.createdAt?.toISOString() || new Date().toISOString(),
              metadata,
            };
          })
        );

        res.json(formattedActivities);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        res.status(500).json({ message: "Failed to fetch recent activity" });
      }
    }
  );

  // ============================================================================
  // Opinion Articles Routes - مقالات الرأي
  // ============================================================================

  // Public: Get all published opinion articles
  app.get("/api/opinion", async (req, res) => {
    try {
      const { page = 1, limit = 12, authorId, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const reporterAlias = aliasedTable(users, 'reporter');

      let query = db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            bio: users.bio,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(
          and(
            eq(articles.articleType, "opinion"),
            eq(articles.status, "published")
          )
        )
        .$dynamic();

      if (authorId) {
        query = query.where(eq(articles.authorId, authorId as string));
      }

      if (search) {
        query = query.where(
          or(
            ilike(articles.title, `%${search}%`),
            ilike(articles.content, `%${search}%`),
            ilike(articles.excerpt, `%${search}%`)
          )
        );
      }

      const results = await query
        .orderBy(desc(articles.publishedAt))
        .limit(Number(limit))
        .offset(offset);

      const formattedArticles = results.map((row) => ({
        ...row.article,
        category: row.category,
        author: row.author,
      }));

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(
          and(
            eq(articles.articleType, "opinion"),
            eq(articles.status, "published")
          )
        );

      res.json({
        articles: formattedArticles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching opinion articles:", error);
      res.status(500).json({ message: "Failed to fetch opinion articles" });
    }
  });

  // Public: Get single opinion article by slug
  app.get("/api/opinion/:slug", async (req: any, res) => {
    try {
      const { slug } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const article = await storage.getArticleBySlug(slug, userId, userRole);

      if (!article || article.articleType !== 'opinion') {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      // Record read if user is logged in
      if (userId) {
        await storage.recordArticleRead(userId, article.id);
      }

      // Increment view count
      await storage.incrementArticleViews(article.id);

      res.json(article);
    } catch (error) {
      console.error("Error fetching opinion article:", error);
      res.status(500).json({ message: "Failed to fetch opinion article" });
    }
  });

  // Public: Get comments for an opinion article
  app.get("/api/opinion/:slug/comments", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);
      if (!article || article.articleType !== 'opinion') {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      // For admins and editors, show all comments (including pending)
      // For regular users, show only approved comments
      const showPending = userRole === 'admin' || userRole === 'editor';
      const comments = await storage.getCommentsByArticle(article.id, showPending);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching opinion comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Public: Get related articles for an opinion article
  app.get("/api/opinion/:slug/related", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const article = await storage.getArticleBySlug(req.params.slug, userId, userRole);
      if (!article || article.articleType !== 'opinion') {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      const related = await storage.getRelatedArticles(article.id, article.categoryId || undefined);
      res.json(related);
    } catch (error) {
      console.error("Error fetching related opinion articles:", error);
      res.status(500).json({ message: "Failed to fetch related articles" });
    }
  });

  // Public: Get related opinion articles by category (smart recommendations)
  app.get("/api/opinion/related/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { excludeId, limit = 5 } = req.query;

      // Build query for opinion articles in the same category
      let query = db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          slug: articles.slug,
          imageUrl: articles.imageUrl,
          publishedAt: articles.publishedAt,
          views: articles.views,
          categoryId: articles.categoryId,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            bio: users.bio,
          },
          category: {
            id: categories.id,
            nameAr: categories.nameAr,
            nameEn: categories.nameEn,
            slug: categories.slug,
            color: categories.color,
            icon: categories.icon,
          },
          // Smart ranking score: recent + popular
          score: sql<number>`
            (EXTRACT(EPOCH FROM (NOW() - ${articles.publishedAt})) / 86400)::numeric * -1 +
            (${articles.views}::numeric / 100) +
            (COALESCE(${articles.isFeatured}, false)::int * 10)
          `.as('score'),
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(
          and(
            eq(articles.categoryId, categoryId as string),
            eq(articles.articleType, "opinion"),
            eq(articles.status, "published"),
            excludeId ? sql`${articles.id} != ${excludeId}` : undefined
          )
        )
        .orderBy(sql`score DESC`)
        .limit(Number(limit));

      const results = await query;

      res.json({
        articles: results.map(r => ({
          id: r.id,
          title: r.title,
          excerpt: r.excerpt,
          slug: r.slug,
          imageUrl: r.imageUrl,
          publishedAt: r.publishedAt,
          views: r.views,
          author: r.author,
          category: r.category,
        })),
        total: results.length,
      });
    } catch (error) {
      console.error("Error fetching related opinion articles:", error);
      res.status(500).json({ message: "Failed to fetch related opinion articles" });
    }
  });

  // Dashboard: Get all opinion articles (for authors and editors)
  app.get("/api/dashboard/opinion", requireAuth, requireAnyPermission("articles.view", "articles.edit_own"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userPermissions = await getUserPermissions(userId);
      const { page = 1, limit = 20, status, reviewStatus, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db
        .select({
          article: articles,
          category: categories,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(eq(articles.articleType, "opinion"))
        .$dynamic();

      // If user can only view their own, filter by authorId
      if (!userPermissions.includes("opinion.edit_any") && userPermissions.includes("opinion.edit_own")) {
        query = query.where(eq(articles.authorId, userId));
      }

      if (status && status !== "all") {
        query = query.where(eq(articles.status, status as string));
      }

      if (reviewStatus && reviewStatus !== "all") {
        query = query.where(eq(articles.reviewStatus, reviewStatus as string));
      }

      if (search) {
        query = query.where(
          or(
            ilike(articles.title, `%${search}%`),
            ilike(articles.content, `%${search}%`),
            ilike(articles.excerpt, `%${search}%`)
          )
        );
      }

      const results = await query
        .orderBy(desc(articles.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const formattedArticles = results.map((row) => ({
        ...row.article,
        category: row.category,
        author: row.author,
      }));

      // Calculate metrics
      let metricsQuery = db
        .select({ id: articles.id, status: articles.status, reviewStatus: articles.reviewStatus })
        .from(articles)
        .where(eq(articles.articleType, "opinion"))
        .$dynamic();

      // Apply same permission filter for metrics
      if (!userPermissions.includes("opinion.edit_any") && userPermissions.includes("opinion.edit_own")) {
        metricsQuery = metricsQuery.where(eq(articles.authorId, userId));
      }

      const allOpinionArticles = await metricsQuery;

      const metrics = {
        total: allOpinionArticles.length,
        pending_review: allOpinionArticles.filter(a => a.reviewStatus === "pending_review").length,
        approved: allOpinionArticles.filter(a => a.reviewStatus === "approved").length,
        published: allOpinionArticles.filter(a => a.status === "published").length,
      };

      res.json({
        articles: formattedArticles,
        metrics,
        pagination: {
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching opinion articles:", error);
      res.status(500).json({ message: "Failed to fetch opinion articles" });
    }
  });

  // Dashboard: Create new opinion article
  app.post("/api/dashboard/opinion", requireAuth, requirePermission("articles.create"), async (req: any, res) => {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const requestData = { ...req.body, articleType: "opinion" };
      const parsed = insertArticleSchema.safeParse(requestData);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid article data",
          errors: parsed.error.flatten(),
        });
      }

      const articleData: any = {
        ...parsed.data,
        authorId,
        articleType: "opinion",
      };

      const [newArticle] = await db
        .insert(articles)
        .values(articleData)
        .returning();

      await logActivity({
        userId: authorId,
        action: "created_opinion",
        entityType: "article",
        entityId: newArticle.id,
        newValue: newArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating opinion article:", error);
      res.status(500).json({ message: "Failed to create opinion article" });
    }
  });

  // Dashboard: Update opinion article
  app.patch("/api/dashboard/opinion/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [existingArticle] = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.id, articleId),
            eq(articles.articleType, "opinion")
          )
        )
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      // Check permissions
      const userPermissions = await getUserPermissions(userId);
      const canEditOwn = userPermissions.includes("opinion.edit_own");
      const canEditAny = userPermissions.includes("opinion.edit_any");

      if (!canEditAny && (!canEditOwn || existingArticle.authorId !== userId)) {
        return res.status(403).json({ message: "You don't have permission to edit this opinion article" });
      }

      const parsed = updateArticleSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: parsed.error.flatten(),
        });
      }

      // Convert all timestamp fields from strings to Date objects if provided
      const updateData: any = { ...parsed.data };
      
      // Convert timestamp fields (if they exist and are strings)
      const timestampFields = ['publishedAt', 'scheduledAt'];
      timestampFields.forEach(field => {
        if (updateData[field] && typeof updateData[field] === 'string') {
          updateData[field] = new Date(updateData[field]);
        }
      });

      const [updatedArticle] = await db
        .update(articles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      await logActivity({
        userId,
        action: "updated_opinion",
        entityType: "article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating opinion article:", error);
      res.status(500).json({ message: "Failed to update opinion article" });
    }
  });

  // Dashboard: Submit opinion article for review
  app.post("/api/dashboard/opinion/:id/submit-review", requireAuth, requirePermission("articles.edit_own"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [existingArticle] = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.id, articleId),
            eq(articles.articleType, "opinion"),
            eq(articles.authorId, userId)
          )
        )
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      if (existingArticle.reviewStatus === "pending_review") {
        return res.status(400).json({ message: "Article is already pending review" });
      }

      const [updatedArticle] = await db
        .update(articles)
        .set({
          reviewStatus: "pending_review",
          status: "draft",
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      await logActivity({
        userId,
        action: "submitted_for_review",
        entityType: "article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error submitting opinion for review:", error);
      res.status(500).json({ message: "Failed to submit opinion for review" });
    }
  });

  // Dashboard: Approve opinion article
  app.post("/api/dashboard/opinion/:id/approve", requireAuth, requirePermission("articles.edit_any"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const { reviewNotes } = req.body;

      const [existingArticle] = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.id, articleId),
            eq(articles.articleType, "opinion")
          )
        )
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      const [updatedArticle] = await db
        .update(articles)
        .set({
          reviewStatus: "approved",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      await logActivity({
        userId,
        action: "approved_opinion",
        entityType: "article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error approving opinion article:", error);
      res.status(500).json({ message: "Failed to approve opinion article" });
    }
  });

  // Dashboard: Reject opinion article
  app.post("/api/dashboard/opinion/:id/reject", requireAuth, requirePermission("articles.edit_any"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const { reviewNotes } = req.body;

      if (!reviewNotes) {
        return res.status(400).json({ message: "Review notes are required when rejecting" });
      }

      const [existingArticle] = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.id, articleId),
            eq(articles.articleType, "opinion")
          )
        )
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      const [updatedArticle] = await db
        .update(articles)
        .set({
          reviewStatus: "rejected",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes,
          status: "draft",
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      await logActivity({
        userId,
        action: "rejected_opinion",
        entityType: "article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error rejecting opinion article:", error);
      res.status(500).json({ message: "Failed to reject opinion article" });
    }
  });

  // Dashboard: Publish opinion article
  app.post("/api/dashboard/opinion/:id/publish", requireAuth, requirePermission("articles.publish"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [existingArticle] = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.id, articleId),
            eq(articles.articleType, "opinion")
          )
        )
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      // Check if article is approved or user has override permission
      if (existingArticle.reviewStatus !== "approved") {
        return res.status(400).json({ message: "Article must be approved before publishing" });
      }

      const [updatedArticle] = await db
        .update(articles)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      await logActivity({
        userId,
        action: "published_opinion",
        entityType: "article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      // Send notifications for published opinion article
      try {
        await createNotification({
          type: "NEW_ARTICLE",
          data: {
            articleId: updatedArticle.id,
            articleTitle: updatedArticle.title,
            articleSlug: updatedArticle.slug,
            categoryId: updatedArticle.categoryId,
          },
        });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error publishing opinion article:", error);
      res.status(500).json({ message: "Failed to publish opinion article" });
    }
  });

  // Dashboard: Delete opinion article
  app.delete("/api/dashboard/opinion/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [existingArticle] = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.id, articleId),
            eq(articles.articleType, "opinion")
          )
        )
        .limit(1);

      if (!existingArticle) {
        return res.status(404).json({ message: "Opinion article not found" });
      }

      // Check permissions
      const userPermissions = await getUserPermissions(userId);
      const canDeleteOwn = userPermissions.includes("opinion.delete_own");
      const canDeleteAny = userPermissions.includes("opinion.delete_any");

      if (!canDeleteAny && (!canDeleteOwn || existingArticle.authorId !== userId)) {
        return res.status(403).json({ message: "You don't have permission to delete this opinion article" });
      }

      // Soft delete by archiving
      const [updatedArticle] = await db
        .update(articles)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

      await logActivity({
        userId,
        action: "deleted_opinion",
        entityType: "article",
        entityId: articleId,
        oldValue: existingArticle,
        newValue: updatedArticle,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Opinion article deleted successfully" });
    } catch (error) {
      console.error("Error deleting opinion article:", error);
      res.status(500).json({ message: "Failed to delete opinion article" });
    }
  });

  // ============================================================
  // CALENDAR SYSTEM API ENDPOINTS - تقويم سبق
  // ============================================================

  // GET /api/calendar - قائمة الأحداث مع الفلاتر
  app.get("/api/calendar", async (req: any, res) => {
    try {
      const filters: any = {};
      
      if (req.query.type) filters.type = req.query.type;
      if (req.query.importance) filters.importance = parseInt(req.query.importance as string);
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
      if (req.query.categoryId) filters.categoryId = req.query.categoryId;
      if (req.query.tags) {
        filters.tags = Array.isArray(req.query.tags) 
          ? req.query.tags 
          : [req.query.tags];
      }
      if (req.query.searchQuery) filters.searchQuery = req.query.searchQuery;
      if (req.query.page) filters.page = parseInt(req.query.page as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);

      const result = await storage.getAllCalendarEvents(filters);
      res.json(result);
    } catch (error) {
      console.error("خطأ في جلب أحداث التقويم:", error);
      res.status(500).json({ message: "حدث خطأ في جلب أحداث التقويم" });
    }
  });

  // GET /api/calendar/upcoming - الأحداث القادمة
  app.get("/api/calendar/upcoming", async (req: any, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const events = await storage.getUpcomingCalendarEvents(days);
      res.json(events);
    } catch (error) {
      console.error("خطأ في جلب الأحداث القادمة:", error);
      res.status(500).json({ message: "حدث خطأ في جلب الأحداث القادمة" });
    }
  });

  // GET /api/calendar/upcoming-reminders - التذكيرات القادمة
  app.get("/api/calendar/upcoming-reminders", requireAuth, async (req: any, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const reminders = await storage.getUpcomingReminders(days);
      res.json(reminders);
    } catch (error) {
      console.error("خطأ في جلب التذكيرات القادمة:", error);
      res.status(500).json({ message: "حدث خطأ في جلب التذكيرات القادمة" });
    }
  });

  // GET /api/calendar/my-assignments - المهام المخصصة للمستخدم
  app.get("/api/calendar/my-assignments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string | undefined;
      
      const assignments = await storage.getCalendarAssignments({
        userId,
        status: status || undefined,
      });
      
      res.json(assignments);
    } catch (error) {
      console.error("خطأ في جلب المهام:", error);
      res.status(500).json({ message: "حدث خطأ في جلب المهام" });
    }
  });

  // GET /api/calendar/:id - تفاصيل حدث
  app.get("/api/calendar/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getCalendarEventById(id);
      
      if (!event) {
        return res.status(404).json({ message: "الحدث غير موجود" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("خطأ في جلب تفاصيل الحدث:", error);
      res.status(500).json({ message: "حدث خطأ في جلب تفاصيل الحدث" });
    }
  });

  // POST /api/calendar - إنشاء حدث جديد
  app.post("/api/calendar", requireAuth, requirePermission("calendar:create"), async (req: any, res) => {
    try {
      const userId = req.user!.id;
      
      // توليد slug تلقائياً من العنوان إذا لم يكن موجوداً
      if (!req.body.slug && req.body.title) {
        const baseSlug = req.body.title
          .toLowerCase()
          .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '') // إبقاء العربية والإنجليزية والأرقام
          .trim()
          .replace(/\s+/g, '-') // استبدال المسافات بـ -
          .substring(0, 100); // الحد الأقصى 100 حرف
        
        // إضافة timestamp للتأكد من عدم التكرار
        req.body.slug = `${baseSlug}-${Date.now()}`;
      }
      
      const validatedData = insertCalendarEventSchema.parse(req.body);
      
      // تحويل التواريخ من string إلى Date
      const eventData = {
        ...validatedData,
        dateStart: new Date(validatedData.dateStart),
        dateEnd: validatedData.dateEnd ? new Date(validatedData.dateEnd) : undefined,
        createdById: userId
      };
      
      // تحويل التذكيرات: من scheduledFor (timestamp) إلى fireWhen (days before)
      const rawReminders = req.body.reminders || [];
      const reminders = rawReminders.map((r: any) => {
        // حساب عدد الأيام بين scheduledFor و dateStart
        const eventDate = new Date(validatedData.dateStart);
        const reminderDate = new Date(r.scheduledFor);
        const diffMs = eventDate.getTime() - reminderDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        return {
          fireWhen: Math.max(0, diffDays), // على الأقل 0 (يوم الحدث نفسه)
          channel: r.channel || 'IN_APP',
          enabled: true,
        };
      });
      
      const event = await storage.createCalendarEvent(
        eventData as any,
        reminders
      );

      await logActivity({
        userId,
        action: 'calendar_event_created',
        entityType: 'calendar_event',
        entityId: event.id,
        newValue: event,
      });

      res.status(201).json(event);
    } catch (error: any) {
      console.error("خطأ في إنشاء حدث:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ في إنشاء الحدث" });
    }
  });

  // PATCH /api/calendar/:id - تحديث حدث
  app.patch("/api/calendar/:id", requireAuth, requirePermission("calendar:edit"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const event = await storage.getCalendarEventById(id);
      if (!event) {
        return res.status(404).json({ message: "الحدث غير موجود" });
      }

      const validatedData = updateCalendarEventSchema.parse(req.body);
      const updated = await storage.updateCalendarEvent(id, validatedData as any);

      await logActivity({
        userId,
        action: 'calendar_event_updated',
        entityType: 'calendar_event',
        entityId: id,
        oldValue: event,
        newValue: updated
      });

      res.json(updated);
    } catch (error: any) {
      console.error("خطأ في تحديث الحدث:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ في تحديث الحدث" });
    }
  });

  // DELETE /api/calendar/:id - حذف حدث
  app.delete("/api/calendar/:id", requireAuth, requirePermission("calendar:delete"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const event = await storage.getCalendarEventById(id);
      if (!event) {
        return res.status(404).json({ message: "الحدث غير موجود" });
      }

      await storage.deleteCalendarEvent(id);

      await logActivity({
        userId,
        action: 'calendar_event_deleted',
        entityType: 'calendar_event',
        entityId: id,
        oldValue: event
      });

      res.json({ success: true, message: "تم حذف الحدث بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف الحدث:", error);
      res.status(500).json({ message: "حدث خطأ في حذف الحدث" });
    }
  });

  // GET /api/calendar/:id/reminders - جلب التذكيرات
  app.get("/api/calendar/:id/reminders", async (req: any, res) => {
    try {
      const { id } = req.params;
      const reminders = await storage.getCalendarReminders(id);
      res.json(reminders);
    } catch (error) {
      console.error("خطأ في جلب التذكيرات:", error);
      res.status(500).json({ message: "حدث خطأ في جلب التذكيرات" });
    }
  });

  // POST /api/calendar/:id/reminders - إضافة تذكير
  app.post("/api/calendar/:id/reminders", requireAuth, requirePermission("calendar:edit"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const event = await storage.getCalendarEventById(id);
      if (!event) {
        return res.status(404).json({ message: "الحدث غير موجود" });
      }

      const validatedData = insertCalendarReminderSchema.parse({ ...req.body, eventId: id });
      const reminder = await storage.createCalendarReminder(validatedData as any);

      await logActivity({
        userId,
        action: 'calendar_reminder_created',
        entityType: 'calendar_reminder',
        entityId: reminder.id,
        newValue: reminder,
      });

      res.status(201).json(reminder);
    } catch (error: any) {
      console.error("خطأ في إضافة تذكير:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ في إضافة التذكير" });
    }
  });

  // DELETE /api/calendar/reminders/:id - حذف تذكير
  app.delete("/api/calendar/reminders/:id", requireAuth, requirePermission("calendar:edit"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await storage.deleteCalendarReminder(id);

      await logActivity({
        userId,
        action: 'calendar_reminder_deleted',
        entityType: 'calendar_reminder',
        entityId: id
      });

      res.json({ success: true, message: "تم حذف التذكير بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف التذكير:", error);
      res.status(500).json({ message: "حدث خطأ في حذف التذكير" });
    }
  });

  // GET /api/calendar/:id/assignments - جلب المهام
  app.get("/api/calendar/:id/assignments", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const assignments = await storage.getCalendarAssignments({ eventId: id });
      res.json(assignments);
    } catch (error) {
      console.error("خطأ في جلب المهام:", error);
      res.status(500).json({ message: "حدث خطأ في جلب المهام" });
    }
  });

  // POST /api/calendar/:id/assignments - تعيين مهمة
  app.post("/api/calendar/:id/assignments", requireAuth, requirePermission("calendar:assign_tasks"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const event = await storage.getCalendarEventById(id);
      if (!event) {
        return res.status(404).json({ message: "الحدث غير موجود" });
      }

      const validatedData = insertCalendarAssignmentSchema.parse({
        ...req.body,
        eventId: id,
        assignedBy: userId,
        assignedAt: new Date()
      });

      const assignment = await storage.createCalendarAssignment(validatedData as any);

      // إرسال إشعار للمستخدم المعين
      if (assignment.userId) {
        await createNotification({
          type: 'NEW_ARTICLE',
          data: {
            articleId: id,
            articleTitle: event.title,
            articleSlug: id,
          },
        });
      }

      await logActivity({
        userId,
        action: 'calendar_assignment_created',
        entityType: 'calendar_assignment',
        entityId: assignment.id,
        newValue: assignment,
      });

      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("خطأ في تعيين المهمة:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ في تعيين المهمة" });
    }
  });

  // PATCH /api/calendar/assignments/:id - تحديث حالة المهمة
  app.patch("/api/calendar/assignments/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const validatedData = updateCalendarAssignmentSchema.parse(req.body);
      const updated = await storage.updateCalendarAssignment(id, validatedData as any);

      await logActivity({
        userId,
        action: 'calendar_assignment_updated',
        entityType: 'calendar_assignment',
        entityId: id,
        newValue: updated
      });

      res.json(updated);
    } catch (error: any) {
      console.error("خطأ في تحديث المهمة:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ في تحديث المهمة" });
    }
  });

  // POST /api/calendar/assignments/:id/complete - إكمال المهمة
  app.post("/api/calendar/assignments/:id/complete", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const updated = await storage.completeCalendarAssignment(id);

      await logActivity({
        userId,
        action: 'calendar_assignment_completed',
        entityType: 'calendar_assignment',
        entityId: id,
        newValue: updated
      });

      res.json(updated);
    } catch (error) {
      console.error("خطأ في إكمال المهمة:", error);
      res.status(500).json({ message: "حدث خطأ في إكمال المهمة" });
    }
  });

  // GET /api/calendar/:id/ai-drafts - جلب المسودة الذكية
  app.get("/api/calendar/:id/ai-drafts", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const draft = await storage.getCalendarAiDraft(id);
      
      if (!draft) {
        return res.status(404).json({ message: "لا توجد مسودة ذكية لهذا الحدث" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("خطأ في جلب المسودة الذكية:", error);
      res.status(500).json({ message: "حدث خطأ في جلب المسودة الذكية" });
    }
  });

  // POST /api/calendar/:id/ai-drafts/generate - توليد مسودة ذكية
  app.post("/api/calendar/:id/ai-drafts/generate", requireAuth, requirePermission("calendar:generate_ai"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const event = await storage.getCalendarEventById(id);
      if (!event) {
        return res.status(404).json({ message: "الحدث غير موجود" });
      }

      console.log(`[CalendarAI] Generating draft for event: ${event.title}`);
      
      // توليد المحتوى الذكي
      const aiDraft = await generateCalendarEventIdeas(
        event.title,
        event.description || '',
        event.type,
        event.dateStart
      );

      // حفظ أو تحديث المسودة
      const existingDraft = await storage.getCalendarAiDraft(id);
      
      let savedDraft;
      if (existingDraft) {
        savedDraft = await storage.updateCalendarAiDraft(id, {
          editorialIdeas: aiDraft.editorialIdeas,
          headlines: aiDraft.headlines as any,
          infographicData: aiDraft.infographicData,
          socialMedia: aiDraft.socialMedia,
          seo: aiDraft.seo as any,
        } as any);
      } else {
        savedDraft = await storage.createCalendarAiDraft({
          eventId: id,
          editorialIdeas: aiDraft.editorialIdeas,
          headlines: aiDraft.headlines as any,
          infographicData: aiDraft.infographicData,
          socialMedia: aiDraft.socialMedia,
          seo: aiDraft.seo as any,
        } as any);
      }

      await logActivity({
        userId,
        action: 'calendar_ai_draft_generated',
        entityType: 'calendar_ai_draft',
        entityId: savedDraft.id,
        newValue: savedDraft,
      });

      console.log(`[CalendarAI] Draft generated successfully for event: ${event.title}`);
      res.json(savedDraft);
    } catch (error: any) {
      console.error("خطأ في توليد المسودة الذكية:", error);
      res.status(500).json({ message: "حدث خطأ في توليد المسودة الذكية" });
    }
  });

  // POST /api/calendar/:id/create-article-draft - إنشاء مسودة مقال من الحدث
  app.post("/api/calendar/:id/create-article-draft", requireAuth, requireAnyPermission("calendar:generate_ai", "articles:create"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { selectedAngle } = req.body;
      
      if (!selectedAngle) {
        return res.status(400).json({ message: "يجب اختيار زاوية تحريرية" });
      }

      const event = await storage.getCalendarEventById(id);
      if (!event) {
        return res.status(404).json({ message: "الحدث غير موجود" });
      }

      console.log(`[CalendarAI] Creating article draft for event: ${event.title}, angle: ${selectedAngle}`);
      
      // توليد مسودة المقال
      const articleDraft = await generateArticleDraft(
        event.title,
        event.description || '',
        selectedAngle
      );

      // إنشاء مقال كمسودة
      const slug = articleDraft.title
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      const article = await storage.createArticle({
        title: articleDraft.title,
        slug: slug + '-' + Date.now(),
        content: articleDraft.content,
        excerpt: articleDraft.summary,
        authorId: userId,
        categoryId: event.categoryId || undefined,
        status: 'draft',
        tags: event.tags || [],
      } as any);

      await logActivity({
        userId,
        action: 'article_created_from_calendar',
        entityType: 'article',
        entityId: article.id,
        newValue: article,
      });

      console.log(`[CalendarAI] Article draft created: ${article.id}`);
      res.status(201).json({ article, draft: articleDraft });
    } catch (error: any) {
      console.error("خطأ في إنشاء مسودة المقال:", error);
      res.status(500).json({ message: "حدث خطأ في إنشاء مسودة المقال" });
    }
  });

  // ============================================================
  // END CALENDAR SYSTEM API ENDPOINTS
  // ============================================================

  // ============================================================
  // SMART LINKS SYSTEM API ENDPOINTS
  // ============================================================

  // GET /api/entity-types - جلب أنواع الكيانات
  app.get("/api/entity-types", requireAuth, async (req: any, res) => {
    try {
      const types = await storage.getEntityTypes();
      res.json(types);
    } catch (error: any) {
      console.error("خطأ في جلب أنواع الكيانات:", error);
      res.status(500).json({ message: "حدث خطأ في جلب أنواع الكيانات" });
    }
  });

  // POST /api/entity-types - إنشاء نوع كيان جديد
  app.post("/api/entity-types", requireAuth, async (req: any, res) => {
    try {
      const result = insertEntityTypeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: result.error.errors });
      }

      const entityType = await storage.createEntityType(result.data);
      
      await logActivity({
        userId: req.user!.id,
        action: 'entity_type_created',
        entityType: 'entity_type',
        entityId: entityType.id.toString(),
        newValue: entityType,
      });

      res.status(201).json(entityType);
    } catch (error: any) {
      console.error("خطأ في إنشاء نوع الكيان:", error);
      res.status(500).json({ message: "حدث خطأ في إنشاء نوع الكيان" });
    }
  });

  // GET /api/smart-entities - جلب الكيانات
  app.get("/api/smart-entities", requireAuth, async (req: any, res) => {
    try {
      const { typeId, status = 'active' } = req.query;
      const entities = await storage.getSmartEntities({
        typeId: typeId ? parseInt(typeId) : undefined,
        status: status as string,
      });
      res.json(entities);
    } catch (error: any) {
      console.error("خطأ في جلب الكيانات:", error);
      res.status(500).json({ message: "حدث خطأ في جلب الكيانات" });
    }
  });

  // POST /api/smart-entities - إنشاء كيان جديد
  app.post("/api/smart-entities", requireAuth, async (req: any, res) => {
    try {
      const result = insertSmartEntitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: result.error.errors });
      }

      const entity = await storage.createSmartEntity(result.data as any);
      
      await logActivity({
        userId: req.user!.id,
        action: 'smart_entity_created',
        entityType: 'smart_entity',
        entityId: entity.id,
        newValue: entity,
      });

      res.status(201).json(entity);
    } catch (error: any) {
      console.error("خطأ في إنشاء الكيان:", error);
      res.status(500).json({ message: "حدث خطأ في إنشاء الكيان" });
    }
  });

  // PATCH /api/smart-entities/:id - تحديث كيان
  app.patch("/api/smart-entities/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const entity = await storage.updateSmartEntity(id, req.body);
      
      await logActivity({
        userId: req.user!.id,
        action: 'smart_entity_updated',
        entityType: 'smart_entity',
        entityId: id,
        newValue: entity,
      });

      res.json(entity);
    } catch (error: any) {
      console.error("خطأ في تحديث الكيان:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث الكيان" });
    }
  });

  // DELETE /api/smart-entities/:id - حذف كيان
  app.delete("/api/smart-entities/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSmartEntity(id);
      
      await logActivity({
        userId: req.user!.id,
        action: 'smart_entity_deleted',
        entityType: 'smart_entity',
        entityId: id,
      });

      res.json({ message: "تم حذف الكيان بنجاح" });
    } catch (error: any) {
      console.error("خطأ في حذف الكيان:", error);
      res.status(500).json({ message: "حدث خطأ في حذف الكيان" });
    }
  });

  // GET /api/smart-terms - جلب المصطلحات
  app.get("/api/smart-terms", requireAuth, async (req: any, res) => {
    try {
      const { category, status = 'active' } = req.query;
      const terms = await storage.getSmartTerms({
        category: category as string,
        status: status as string,
      });
      res.json(terms);
    } catch (error: any) {
      console.error("خطأ في جلب المصطلحات:", error);
      res.status(500).json({ message: "حدث خطأ في جلب المصطلحات" });
    }
  });

  // POST /api/smart-terms - إنشاء مصطلح جديد
  app.post("/api/smart-terms", requireAuth, async (req: any, res) => {
    try {
      const result = insertSmartTermSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: result.error.errors });
      }

      const term = await storage.createSmartTerm(result.data as any);
      
      await logActivity({
        userId: req.user!.id,
        action: 'smart_term_created',
        entityType: 'smart_term',
        entityId: term.id,
        newValue: term,
      });

      res.status(201).json(term);
    } catch (error: any) {
      console.error("خطأ في إنشاء المصطلح:", error);
      res.status(500).json({ message: "حدث خطأ في إنشاء المصطلح" });
    }
  });

  // GET /api/smart-terms/:identifier - جلب مصطلح بناءً على ID أو term
  app.get("/api/smart-terms/:identifier", async (req: any, res) => {
    try {
      const { identifier } = req.params;
      const terms = await storage.getSmartTerms({ status: 'active' });
      
      // البحث بالـ ID أو بالـ term
      const term = terms.find(t => 
        t.id === identifier || 
        t.term.toLowerCase().replace(/\s+/g, '-') === decodeURIComponent(identifier).toLowerCase()
      );
      
      if (!term) {
        return res.status(404).json({ message: "المصطلح غير موجود" });
      }
      
      res.json(term);
    } catch (error: any) {
      console.error("خطأ في جلب المصطلح:", error);
      res.status(500).json({ message: "حدث خطأ في جلب المصطلح" });
    }
  });

  // GET /api/smart-entities/:slug - جلب كيان بناءً على slug
  app.get("/api/smart-entities/:slug", async (req: any, res) => {
    try {
      const { slug } = req.params;
      const entities = await storage.getSmartEntities({ status: 'active' });
      
      const entity = entities.find(e => e.slug === decodeURIComponent(slug));
      
      if (!entity) {
        return res.status(404).json({ message: "الكيان غير موجود" });
      }
      
      res.json(entity);
    } catch (error: any) {
      console.error("خطأ في جلب الكيان:", error);
      res.status(500).json({ message: "حدث خطأ في جلب الكيان" });
    }
  });

  // GET /api/smart-entities/:slug/articles - جلب المقالات المرتبطة بكيان
  app.get("/api/smart-entities/:slug/articles", async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { limit = 10 } = req.query;
      
      // جلب الكيان أولاً
      const entities = await storage.getSmartEntities({ status: 'active' });
      const entity = entities.find(e => e.slug === decodeURIComponent(slug));
      
      if (!entity) {
        return res.status(404).json({ message: "الكيان غير موجود" });
      }
      
      // البحث عن المقالات التي تحتوي على اسم الكيان
      const articlesData = await storage.getArticles({ 
        searchQuery: entity.name,
        status: 'published' 
      });
      
      // تحديد عدد النتائج
      const limitedArticles = articlesData.slice(0, parseInt(limit as string));
      
      res.json({ articles: limitedArticles, total: articlesData.length });
    } catch (error: any) {
      console.error("خطأ في جلب المقالات المرتبطة:", error);
      res.status(500).json({ message: "حدث خطأ في جلب المقالات" });
    }
  });

  // GET /api/smart-terms/:identifier/articles - جلب المقالات المرتبطة بمصطلح
  app.get("/api/smart-terms/:identifier/articles", async (req: any, res) => {
    try {
      const { identifier } = req.params;
      const { limit = 10 } = req.query;
      
      // جلب المصطلح أولاً
      const terms = await storage.getSmartTerms({ status: 'active' });
      const term = terms.find(t => 
        t.id === identifier || 
        t.term.toLowerCase().replace(/\s+/g, '-') === decodeURIComponent(identifier).toLowerCase()
      );
      
      if (!term) {
        return res.status(404).json({ message: "المصطلح غير موجود" });
      }
      
      // البحث عن المقالات التي تحتوي على المصطلح
      const articlesData = await storage.getArticles({ 
        searchQuery: term.term,
        status: 'published' 
      });
      
      // تحديد عدد النتائج
      const limitedArticles = articlesData.slice(0, parseInt(limit as string));
      
      res.json({ articles: limitedArticles, total: articlesData.length });
    } catch (error: any) {
      console.error("خطأ في جلب المقالات المرتبطة:", error);
      res.status(500).json({ message: "حدث خطأ في جلب المقالات" });
    }
  });

  // POST /api/smart-entities/upload-image - رفع صورة كيان
  app.post("/api/smart-entities/upload-image", requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "الصورة مطلوبة" });
      }

      const objectStorageService = new ObjectStorageService();
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      
      if (!privateObjectDir) {
        return res.status(500).json({ message: "Object Storage غير مُعد" });
      }

      // تحديد مسار الملف
      const timestamp = Date.now();
      const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `entities/${timestamp}-${sanitizedFilename}`;
      const fullPath = `${privateObjectDir}/${filename}`;
      
      // استخراج bucket name و object name
      const pathParts = fullPath.split('/').filter(Boolean);
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');

      // رفع الملف
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // جعل الملف عام باستخدام نظام ACL المخصص (بدلاً من makePublic)
      await setObjectAclPolicy(file, {
        owner: req.user.id,
        visibility: "public",
      });

      // إنشاء URL للوصول للملف عبر /objects/ endpoint
      const objectPath = `/objects/${filename}`;

      console.log(`✅ Image uploaded successfully: ${objectPath}`);
      res.json({ imageUrl: objectPath });
    } catch (error: any) {
      console.error("خطأ في رفع الصورة:", error);
      res.status(500).json({ message: "حدث خطأ في رفع الصورة: " + error.message });
    }
  });

  // POST /api/ai/generate-entity-description - توليد تعريف تلقائي للكيان
  app.post("/api/ai/generate-entity-description", requireAuth, async (req: any, res) => {
    try {
      const { name, type, position, organization, location } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "اسم الكيان مطلوب" });
      }

      const openai = await import('openai').then(m => m.default);
      const client = new openai({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // بناء السياق للتوليد
      let context = `اكتب تعريفاً موجزاً ومهنياً باللغة العربية عن "${name}"`;
      if (type) context += ` (${type})`;
      if (position) context += `. المنصب: ${position}`;
      if (organization) context += `. المنظمة: ${organization}`;
      if (location) context += `. الموقع: ${location}`;
      context += `.\n\nالتعريف يجب أن يكون:\n- موجز (2-3 جمل)\n- مهني وواقعي\n- يركز على الإنجازات والدور الرئيسي\n- بدون مقدمات أو عناوين`;

      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "أنت مساعد ذكي متخصص في كتابة تعريفات موجزة ومهنية عن الشخصيات والمنظمات باللغة العربية الفصحى."
          },
          {
            role: "user",
            content: context
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const description = completion.choices[0]?.message?.content?.trim() || "";
      
      res.json({ description });
    } catch (error: any) {
      console.error("خطأ في توليد التعريف:", error);
      res.status(500).json({ message: "حدث خطأ في توليد التعريف" });
    }
  });

  // POST /api/smart-links/analyze - تحليل المحتوى واقتراح الروابط الذكية
  app.post("/api/smart-links/analyze", requireAuth, async (req: any, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "المحتوى مطلوب" });
      }

      // جلب الكيانات والمصطلحات النشطة
      const entities = await storage.getSmartEntities({ status: 'active' });
      const terms = await storage.getSmartTerms({ status: 'active' });

      // تحليل المحتوى
      const { analyzeContent } = await import('./services/smartLinks');
      const result = await analyzeContent(content, entities, terms);

      res.json(result);
    } catch (error: any) {
      console.error("خطأ في تحليل المحتوى:", error);
      res.status(500).json({ message: "حدث خطأ في تحليل المحتوى" });
    }
  });

  // ============================================================
  // END SMART LINKS SYSTEM API ENDPOINTS
  // ============================================================

  // ============================================================
  // SEO ENDPOINTS - Sitemap & Robots.txt
  // ============================================================

  // Dynamic XML Sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = process.env.REPL_DOMAINS?.split(',')[0] || "https://sabq.life";
      
      // Get all published articles
      const publishedArticles = await db
        .select({
          slug: articles.slug,
          updatedAt: articles.updatedAt,
          publishedAt: articles.publishedAt,
        })
        .from(articles)
        .where(eq(articles.status, "published"))
        .orderBy(desc(articles.publishedAt))
        .limit(5000); // Limit for performance

      // Get all active categories
      const activeCategories = await db
        .select({
          slug: categories.slug,
        })
        .from(categories)
        .where(eq(categories.status, "active"));

      // Build XML sitemap
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Homepage
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}</loc>\n`;
      xml += '    <changefreq>hourly</changefreq>\n';
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';

      // Articles
      for (const article of publishedArticles) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/article/${article.slug}</loc>\n`;
        xml += `    <lastmod>${(article.updatedAt || article.publishedAt || new Date()).toISOString()}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }

      // Categories
      for (const category of activeCategories) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/category/${category.slug}</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      }

      xml += '</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = process.env.REPL_DOMAINS?.split(',')[0] || "https://sabq.life";
    
    const robotsTxt = `# Sabq Smart - سبق الذكية
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for polite crawlers
Crawl-delay: 1

# Allow important crawlers full access
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /
`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // ============================================================
  // END SEO ENDPOINTS
  // ============================================================

  // ============================================================
  // ENGLISH VERSION API ENDPOINTS
  // ============================================================

  // GET English Categories
  app.get("/api/en/categories", async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.status, "active"))
        .orderBy(asc(enCategories.displayOrder));
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching EN categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // GET Single English Category
  app.get("/api/en/categories/:id", async (req, res) => {
    try {
      const category = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.id, req.params.id))
        .limit(1);
      
      if (!category || category.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category[0]);
    } catch (error) {
      console.error("Error fetching EN category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // POST English Category (Admin only)
  app.post("/api/en/categories", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    
    // Check if user has EN language permission and is admin/editor
    if (!user.allowedLanguages?.includes('en') || !['admin', 'editor', 'chief_editor'].includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions for English content" });
    }

    try {
      const validatedData = insertEnCategorySchema.parse(req.body);
      
      const newCategory = await db
        .insert(enCategories)
        .values(validatedData)
        .returning();
      
      res.json(newCategory[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating EN category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // PATCH English Category (Admin only)
  app.patch("/api/en/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    
    if (!user.allowedLanguages?.includes('en') || !['admin', 'editor', 'chief_editor'].includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    try {
      const updated = await db
        .update(enCategories)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(enCategories.id, req.params.id))
        .returning();
      
      if (!updated || updated.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating EN category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // GET English Category by Slug
  app.get("/api/en/categories/slug/:slug", async (req, res) => {
    try {
      const category = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.slug, req.params.slug))
        .limit(1);
      
      if (!category || category.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category[0]);
    } catch (error) {
      console.error("Error fetching EN category by slug:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // GET English Articles by Category ID
  app.get("/api/en/categories/:id/articles", async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      // Create alias for reporter
      const reporterAlias = aliasedTable(users, 'reporter');

      // Get articles with category, author and reporter information
      const results = await db
        .select()
        .from(enArticles)
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .leftJoin(users, eq(enArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
        .where(
          and(
            eq(enArticles.categoryId, req.params.id),
            eq(enArticles.status, "published")
          )
        )
        .orderBy(desc(enArticles.publishedAt))
        .limit(Number(limit))
        .offset(Number(offset));

      // Map results to include category, author and reporter information
      const articles = results.map((result: any) => {
        const article = result.en_articles;
        const category = result.en_categories;
        const authorData = result.users;
        const reporterData = result.reporter;

        // Priority: reporter > author (same as dashboard)
        const displayAuthor = reporterData || authorData;

        return {
          id: article.id,
          title: article.title,
          subtitle: article.subtitle,
          slug: article.slug,
          excerpt: article.excerpt,
          imageUrl: article.imageUrl,
          imageFocalPoint: article.imageFocalPoint,
          categoryId: article.categoryId,
          authorId: article.authorId,
          reporterId: article.reporterId,
          articleType: article.articleType,
          newsType: article.newsType,
          status: article.status,
          isFeatured: article.isFeatured,
          views: article.views,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt,
          category: category ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            description: category.description,
          } : undefined,
          author: displayAuthor ? {
            id: displayAuthor.id,
            email: displayAuthor.email,
            firstName: displayAuthor.firstName,
            lastName: displayAuthor.lastName,
            profileImageUrl: displayAuthor.profileImageUrl,
            bio: displayAuthor.bio,
          } : undefined,
        };
      });
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching EN articles by category:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // English Category Analytics Endpoint
  app.get("/api/en/categories/:id/analytics", async (req, res) => {
    try {
      const categoryId = req.params.id;
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get category details
      const [category] = await db
        .select()
        .from(enCategories)
        .where(eq(enCategories.id, categoryId))
        .limit(1);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Get total article count in this category
      const [totalCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(enArticles)
        .where(and(
          eq(enArticles.categoryId, categoryId),
          eq(enArticles.status, "published")
        ));

      // Get articles published in last 30 days
      const [recentCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(enArticles)
        .where(and(
          eq(enArticles.categoryId, categoryId),
          eq(enArticles.status, "published"),
          gte(enArticles.publishedAt, monthAgo)
        ));

      // Get total views
      const [totalViewsResult] = await db.select({
        total: sql<number>`COALESCE(SUM(${enArticles.views}), 0)::int`
      })
        .from(enArticles)
        .where(and(
          eq(enArticles.categoryId, categoryId),
          eq(enArticles.status, "published")
        ));

      // Calculate average views
      const avgViews = totalCount.count > 0 
        ? Math.round(totalViewsResult.total / totalCount.count)
        : 0;

      // Get most active reporter in this category (using English names with Arabic fallback)
      let topAuthor = await db.select({
        userId: enArticles.reporterId,
        count: sql<number>`count(*)::int`,
        firstName: sql<string>`COALESCE(${users.firstNameEn}, ${users.firstName})`,
        lastName: sql<string>`COALESCE(${users.lastNameEn}, ${users.lastName})`,
        profileImageUrl: users.profileImageUrl,
      })
        .from(enArticles)
        .innerJoin(users, eq(enArticles.reporterId, users.id))
        .where(and(
          eq(enArticles.categoryId, categoryId),
          eq(enArticles.status, "published"),
          isNotNull(enArticles.reporterId)
        ))
        .groupBy(
          enArticles.reporterId, 
          users.firstName, 
          users.lastName, 
          users.firstNameEn, 
          users.lastNameEn, 
          users.profileImageUrl
        )
        .orderBy(sql`count(*) DESC`)
        .limit(1);

      // Fallback to authorId (using English names with Arabic fallback)
      if (!topAuthor || topAuthor.length === 0) {
        topAuthor = await db.select({
          userId: enArticles.authorId,
          count: sql<number>`count(*)::int`,
          firstName: sql<string>`COALESCE(${users.firstNameEn}, ${users.firstName})`,
          lastName: sql<string>`COALESCE(${users.lastNameEn}, ${users.lastName})`,
          profileImageUrl: users.profileImageUrl,
        })
          .from(enArticles)
          .innerJoin(users, eq(enArticles.authorId, users.id))
          .where(and(
            eq(enArticles.categoryId, categoryId),
            eq(enArticles.status, "published"),
            isNotNull(enArticles.authorId)
          ))
          .groupBy(
            enArticles.authorId, 
            users.firstName, 
            users.lastName, 
            users.firstNameEn, 
            users.lastNameEn, 
            users.profileImageUrl
          )
          .orderBy(sql`count(*) DESC`)
          .limit(1);
      }

      // Get total interactions
      const [reactionsCount] = await db.select({
        count: sql<number>`count(*)::int`
      })
        .from(enReactions)
        .leftJoin(enArticles, eq(enReactions.articleId, enArticles.id))
        .where(and(
          eq(enArticles.categoryId, categoryId),
          eq(enArticles.status, "published")
        ));

      const [commentsCount] = await db.select({
        count: sql<number>`count(*)::int`
      })
        .from(enComments)
        .leftJoin(enArticles, eq(enComments.articleId, enArticles.id))
        .where(and(
          eq(enArticles.categoryId, categoryId),
          eq(enArticles.status, "published")
        ));

      const totalInteractions = (reactionsCount?.count || 0) + (commentsCount?.count || 0);

      res.json({
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        totalArticles: totalCount.count || 0,
        recentArticles: recentCount.count || 0,
        totalViews: totalViewsResult.total || 0,
        avgViewsPerArticle: avgViews,
        totalInteractions: totalInteractions,
        topAuthor: topAuthor && topAuthor.length > 0 ? {
          name: `${topAuthor[0].firstName} ${topAuthor[0].lastName}`.trim(),
          profileImageUrl: topAuthor[0].profileImageUrl,
          count: topAuthor[0].count
        } : null
      });
    } catch (error) {
      console.error("Error fetching EN category analytics:", error);
      res.status(500).json({ message: "Failed to fetch category analytics" });
    }
  });

  // GET English Articles (with filters)
  app.get("/api/en/articles", async (req, res) => {
    try {
      const { categoryId, status = "published", limit = 20, offset = 0 } = req.query;
      
      // Build conditions array
      const conditions: any[] = [];
      if (status) {
        conditions.push(eq(enArticles.status, status as string));
      }
      if (categoryId) {
        conditions.push(eq(enArticles.categoryId, categoryId as string));
      }

      // Create alias for reporter
      const reporterAlias = aliasedTable(users, 'reporter');

      // Get articles with category, author and reporter information using leftJoin
      const results = await db
        .select()
        .from(enArticles)
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .leftJoin(users, eq(enArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(enArticles.publishedAt))
        .limit(Number(limit))
        .offset(Number(offset));

      // Map results to include category, author and reporter information
      const articles = results.map((result: any) => {
        const article = result.en_articles;
        const category = result.en_categories;
        const authorData = result.users;
        const reporterData = result.reporter;

        // Priority: reporter > author (same as dashboard)
        const displayAuthor = reporterData || authorData;

        return {
          id: article.id,
          title: article.title,
          subtitle: article.subtitle,
          slug: article.slug,
          excerpt: article.excerpt,
          imageUrl: article.imageUrl,
          imageFocalPoint: article.imageFocalPoint,
          categoryId: article.categoryId,
          authorId: article.authorId,
          reporterId: article.reporterId,
          articleType: article.articleType,
          newsType: article.newsType,
          status: article.status,
          isFeatured: article.isFeatured,
          views: article.views,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt,
          category: category ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            description: category.description,
          } : undefined,
          author: displayAuthor ? {
            id: displayAuthor.id,
            email: displayAuthor.email,
            firstName: displayAuthor.firstName,
            lastName: displayAuthor.lastName,
            profileImageUrl: displayAuthor.profileImageUrl,
            bio: displayAuthor.bio,
          } : undefined,
        };
      });
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching EN articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // GET English News Analytics
  app.get("/api/en/news/analytics", async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevMonthStart = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get article counts for different periods
      const [todayCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(enArticles)
        .where(and(
          gte(enArticles.publishedAt, today),
          eq(enArticles.status, "published")
        ));

      const [weekCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(enArticles)
        .where(and(
          gte(enArticles.publishedAt, weekAgo),
          eq(enArticles.status, "published")
        ));

      const [monthCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(enArticles)
        .where(and(
          gte(enArticles.publishedAt, monthAgo),
          eq(enArticles.status, "published")
        ));

      const [prevMonthCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(enArticles)
        .where(and(
          gte(enArticles.publishedAt, prevMonthStart),
          sql`${enArticles.publishedAt} < ${monthAgo}`,
          eq(enArticles.status, "published")
        ));

      // Calculate growth percentage
      const growthPercentage = prevMonthCount.count > 0
        ? ((monthCount.count - prevMonthCount.count) / prevMonthCount.count) * 100
        : 0;

      // Get most active category
      const topCategory = await db.select({
        categoryId: enArticles.categoryId,
        count: sql<number>`count(*)::int`,
        name: enCategories.name,
        icon: enCategories.icon,
        color: enCategories.color,
      })
        .from(enArticles)
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .where(and(
          gte(enArticles.publishedAt, monthAgo),
          eq(enArticles.status, "published")
        ))
        .groupBy(enArticles.categoryId, enCategories.name, enCategories.icon, enCategories.color)
        .orderBy(sql`count(*) DESC`)
        .limit(1);

      // Get most active reporter (prefer reporter over system author)
      let topAuthor = await db.select({
        userId: enArticles.reporterId,
        count: sql<number>`count(*)::int`,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
        .from(enArticles)
        .innerJoin(users, eq(enArticles.reporterId, users.id))
        .where(and(
          gte(enArticles.publishedAt, monthAgo),
          eq(enArticles.status, "published"),
          isNotNull(enArticles.reporterId)
        ))
        .groupBy(enArticles.reporterId, users.firstName, users.lastName, users.profileImageUrl)
        .orderBy(sql`count(*) DESC`)
        .limit(1);

      // Fallback to authorId if no reporter found
      if (!topAuthor || topAuthor.length === 0) {
        topAuthor = await db.select({
          userId: enArticles.authorId,
          count: sql<number>`count(*)::int`,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
          .from(enArticles)
          .innerJoin(users, eq(enArticles.authorId, users.id))
          .where(and(
            gte(enArticles.publishedAt, monthAgo),
            eq(enArticles.status, "published"),
            isNotNull(enArticles.authorId)
          ))
          .groupBy(enArticles.authorId, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(sql`count(*) DESC`)
          .limit(1);
      }

      // Get total views
      const [totalViewsResult] = await db.select({
        total: sql<number>`COALESCE(SUM(${enArticles.views}), 0)::int`
      })
        .from(enArticles)
        .where(eq(enArticles.status, "published"));

      // Get total interactions (reactions + bookmarks + comments)
      const [totalReactions] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(enReactions);

      const [totalBookmarks] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(enBookmarks);

      const [totalComments] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(enComments);

      const totalInteractions = (totalReactions?.count || 0) + 
                                (totalBookmarks?.count || 0) + 
                                (totalComments?.count || 0);

      // Generate AI insights
      const insights = {
        dailySummary: "Sabq Smart continues to deliver the latest news and analysis to readers",
        topTopics: [],
        activityTrend: growthPercentage > 5 ? "Notable growth in activity" : growthPercentage < -5 ? "Decrease in activity" : "Stable activity",
        keyHighlights: [
          `${todayCount.count} articles published today`,
          topCategory[0] ? `${topCategory[0].name} is the most active category` : "Diverse coverage across categories",
          `${totalInteractions.toLocaleString('en-US')} total interactions`
        ]
      };

      res.json({
        period: {
          today: todayCount.count || 0,
          week: weekCount.count || 0,
          month: monthCount.count || 0,
        },
        growth: {
          percentage: Math.round(growthPercentage * 10) / 10,
          trend: growthPercentage > 0 ? 'up' : growthPercentage < 0 ? 'down' : 'stable',
          previousMonth: prevMonthCount.count || 0,
        },
        topCategory: topCategory[0] ? {
          name: topCategory[0].name,
          icon: topCategory[0].icon,
          color: topCategory[0].color,
          count: topCategory[0].count,
        } : null,
        topAuthor: topAuthor[0] ? {
          name: `${topAuthor[0].firstName || ''} ${topAuthor[0].lastName || ''}`.trim(),
          profileImageUrl: topAuthor[0].profileImageUrl,
          count: topAuthor[0].count,
        } : null,
        totalViews: totalViewsResult.total || 0,
        totalInteractions,
        aiInsights: insights,
      });
    } catch (error) {
      console.error("Error fetching EN news analytics:", error);
      res.status(500).json({ message: "Failed to fetch news analytics" });
    }
  });

  // GET Urdu News Analytics
  app.get("/api/ur/news/analytics", async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevMonthStart = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get article counts for different periods
      const [todayCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(and(
          gte(urArticles.publishedAt, today),
          eq(urArticles.status, "published")
        ));

      const [weekCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(and(
          gte(urArticles.publishedAt, weekAgo),
          eq(urArticles.status, "published")
        ));

      const [monthCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(and(
          gte(urArticles.publishedAt, monthAgo),
          eq(urArticles.status, "published")
        ));

      const [prevMonthCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(and(
          gte(urArticles.publishedAt, prevMonthStart),
          sql`${urArticles.publishedAt} < ${monthAgo}`,
          eq(urArticles.status, "published")
        ));

      // Calculate growth percentage
      const growthPercentage = prevMonthCount.count > 0
        ? ((monthCount.count - prevMonthCount.count) / prevMonthCount.count) * 100
        : 0;

      // Get most active category
      const topCategory = await db.select({
        categoryId: urArticles.categoryId,
        count: sql<number>`count(*)::int`,
        name: urCategories.name,
        icon: urCategories.icon,
        color: urCategories.color,
      })
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .where(and(
          gte(urArticles.publishedAt, monthAgo),
          eq(urArticles.status, "published")
        ))
        .groupBy(urArticles.categoryId, urCategories.name, urCategories.icon, urCategories.color)
        .orderBy(sql`count(*) DESC`)
        .limit(1);

      // Get most active reporter (prefer reporter over system author)
      let topAuthor = await db.select({
        userId: urArticles.reporterId,
        count: sql<number>`count(*)::int`,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
        .from(urArticles)
        .innerJoin(users, eq(urArticles.reporterId, users.id))
        .where(and(
          gte(urArticles.publishedAt, monthAgo),
          eq(urArticles.status, "published"),
          isNotNull(urArticles.reporterId)
        ))
        .groupBy(urArticles.reporterId, users.firstName, users.lastName, users.profileImageUrl)
        .orderBy(sql`count(*) DESC`)
        .limit(1);

      // Fallback to authorId if no reporter found
      if (!topAuthor || topAuthor.length === 0) {
        topAuthor = await db.select({
          userId: urArticles.authorId,
          count: sql<number>`count(*)::int`,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
          .from(urArticles)
          .innerJoin(users, eq(urArticles.authorId, users.id))
          .where(and(
            gte(urArticles.publishedAt, monthAgo),
            eq(urArticles.status, "published"),
            isNotNull(urArticles.authorId)
          ))
          .groupBy(urArticles.authorId, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(sql`count(*) DESC`)
          .limit(1);
      }

      // Get total views
      const [totalViewsResult] = await db.select({
        total: sql<number>`COALESCE(SUM(${urArticles.views}), 0)::int`
      })
        .from(urArticles)
        .where(eq(urArticles.status, "published"));

      // Get total interactions (reactions + bookmarks + comments)
      const [totalReactions] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(urReactions);

      const [totalBookmarks] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(urBookmarks);

      const [totalComments] = await db.select({
        count: sql<number>`count(*)::int`
      }).from(urComments);

      const totalInteractions = (totalReactions?.count || 0) + 
                                (totalBookmarks?.count || 0) + 
                                (totalComments?.count || 0);

      // Generate AI insights
      const insights = {
        dailySummary: "سبق سمارٹ قارئین کو تازہ ترین خبریں اور تجزیہ پیش کرتا رہتا ہے",
        topTopics: [],
        activityTrend: growthPercentage > 5 ? "سرگرمی میں نمایاں اضافہ" : growthPercentage < -5 ? "سرگرمی میں کمی" : "مستحکم سرگرمی",
        keyHighlights: [
          `آج ${todayCount.count} مضامین شائع ہوئے`,
          topCategory[0] ? `${topCategory[0].name} سب سے زیادہ فعال زمرہ ہے` : "مختلف زمروں میں متنوع کوریج",
          `کل ${totalInteractions.toLocaleString('ur-PK')} تعاملات`
        ]
      };

      res.json({
        period: {
          today: todayCount.count || 0,
          week: weekCount.count || 0,
          month: monthCount.count || 0,
        },
        growth: {
          percentage: Math.round(growthPercentage * 10) / 10,
          trend: growthPercentage > 0 ? 'up' : growthPercentage < 0 ? 'down' : 'stable',
          previousMonth: prevMonthCount.count || 0,
        },
        topCategory: topCategory[0] ? {
          name: topCategory[0].name,
          icon: topCategory[0].icon,
          color: topCategory[0].color,
          count: topCategory[0].count,
        } : null,
        topAuthor: topAuthor[0] ? {
          name: `${topAuthor[0].firstName || ''} ${topAuthor[0].lastName || ''}`.trim(),
          profileImageUrl: topAuthor[0].profileImageUrl,
          count: topAuthor[0].count,
        } : null,
        totalViews: totalViewsResult.total || 0,
        totalInteractions,
        aiInsights: insights,
      });
    } catch (error) {
      console.error("Error fetching Urdu news analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // GET Single English Article by Slug - with full details
  app.get("/api/en/articles/:slug", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Create alias for reporter
      const reporterAlias = aliasedTable(users, 'reporter');

      // Get article with category, author, and reporter joins
      const results = await db
        .select()
        .from(enArticles)
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .leftJoin(users, eq(enArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(enArticles.reporterId, reporterAlias.id))
        .where(eq(enArticles.slug, req.params.slug))
        .limit(1);
      
      if (!results || results.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Access joined tables by their actual table names
      const result: any = results[0];
      const article = result.en_articles;
      const category = result.en_categories;
      const authorData = result.users;
      const reporterData = result.reporter;

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

      // Increment views
      await db
        .update(enArticles)
        .set({ views: sql`${enArticles.views} + 1` })
        .where(eq(enArticles.id, article.id));

      // Priority: reporter > author (same as dashboard)
      const displayAuthor = reporterData || authorData;

      // Return full article details with ALL article fields
      const articleWithDetails: EnArticleWithDetails = {
        ...article,
        category: category || undefined,
        author: displayAuthor || undefined,
        isBookmarked,
        hasReacted,
        reactionsCount,
        commentsCount,
      };
      
      res.json(articleWithDetails);
    } catch (error) {
      console.error("Error fetching EN article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Get related articles for an English article
  app.get("/api/en/articles/:slug/related", async (req: any, res) => {
    try {
      // Get the English article by slug
      const articleResults = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.slug, req.params.slug))
        .limit(1);
      
      if (!articleResults || articleResults.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      const article = articleResults[0];

      // Get related articles using storage method
      const related = await storage.getEnglishRelatedArticles(article.id, article.categoryId || undefined);
      res.json(related);
    } catch (error) {
      console.error("Error fetching related English articles:", error);
      res.status(500).json({ message: "Failed to fetch related articles" });
    }
  });

  // Get AI-powered analytics/insights for an English article
  app.get("/api/en/articles/:slug/ai-insights", async (req: any, res) => {
    try {
      // Get the English article by slug
      const articleResults = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.slug, req.params.slug))
        .limit(1);
      
      if (!articleResults || articleResults.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      const article = articleResults[0];

      // Get reading history stats (shared table uses article.id)
      const readingStats = await db
        .select({
          avgDuration: sql<number>`AVG(${readingHistory.readDuration})`,
          totalReads: sql<number>`COUNT(*)`,
        })
        .from(readingHistory)
        .where(eq(readingHistory.articleId, article.id));

      // Get reactions count (English reactions table: en_reactions)
      const reactionsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(enReactions)
        .where(eq(enReactions.articleId, article.id));

      // Get comments count (English comments table: en_comments)
      const commentsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(enComments)
        .where(and(
          eq(enComments.articleId, article.id),
          eq(enComments.status, "approved")
        ));

      const avgReadTime = readingStats[0]?.avgDuration || 0;
      const totalReads = Number(readingStats[0]?.totalReads || 0);
      const totalReactions = Number(reactionsCount[0]?.count || 0);
      const totalComments = Number(commentsCount[0]?.count || 0);
      const totalViews = article.views || 0;

      // Calculate engagement rate: (reactions + comments) / views
      const engagementRate = totalViews > 0 
        ? ((totalReactions + totalComments) / totalViews) 
        : 0;

      // Estimate reading completion based on avg read time
      // Assuming 200 words per minute reading speed
      const estimatedReadTime = article.content 
        ? Math.ceil(article.content.split(/\s+/).length / 200) * 60 
        : 180; // default 3 min
      
      const completionRate = avgReadTime > 0 && estimatedReadTime > 0
        ? Math.min(100, (avgReadTime / estimatedReadTime) * 100)
        : 0;

      res.json({
        avgReadTime: Math.round(avgReadTime), // in seconds
        totalReads,
        totalReactions,
        totalComments,
        totalViews,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        completionRate: Math.round(completionRate), // percentage
        totalInteractions: totalReactions + totalComments,
      });
    } catch (error) {
      console.error("Error fetching EN article AI insights:", error);
      res.status(500).json({ message: "Failed to fetch article insights" });
    }
  });

  // GET English Articles by Keyword
  app.get("/api/en/keyword/:keyword", async (req, res) => {
    try {
      const keyword = decodeURIComponent(req.params.keyword);
      
      // Get all published English articles
      const allArticles = await db
        .select({
          id: enArticles.id,
          title: enArticles.title,
          subtitle: enArticles.subtitle,
          slug: enArticles.slug,
          excerpt: enArticles.excerpt,
          imageUrl: enArticles.imageUrl,
          imageFocalPoint: enArticles.imageFocalPoint,
          categoryId: enArticles.categoryId,
          authorId: enArticles.authorId,
          articleType: enArticles.articleType,
          newsType: enArticles.newsType,
          status: enArticles.status,
          isFeatured: enArticles.isFeatured,
          views: enArticles.views,
          publishedAt: enArticles.publishedAt,
          createdAt: enArticles.createdAt,
          seo: enArticles.seo,
        })
        .from(enArticles)
        .where(eq(enArticles.status, "published"))
        .orderBy(desc(enArticles.publishedAt));
      
      // Filter articles that contain the keyword in their SEO keywords
      const filteredArticles = allArticles.filter(article => 
        article.seo?.keywords?.some(k => k.toLowerCase() === keyword.toLowerCase())
      );

      res.json(filteredArticles);
    } catch (error) {
      console.error("Error fetching EN articles by keyword:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // POST Toggle English Article Reaction
  app.post("/api/en/articles/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const articleId = req.params.id;

      // Check if reaction exists
      const existing = await db
        .select()
        .from(enReactions)
        .where(
          and(
            eq(enReactions.articleId, articleId),
            eq(enReactions.userId, userId)
          )
        )
        .limit(1);
      
      if (existing && existing.length > 0) {
        // Remove reaction
        await db
          .delete(enReactions)
          .where(eq(enReactions.id, existing[0].id));
        
        return res.json({ hasReacted: false });
      } else {
        // Add reaction
        await db
          .insert(enReactions)
          .values({
            articleId: articleId,
            userId: userId,
            type: "like",
          });
        
        return res.json({ hasReacted: true });
      }
    } catch (error) {
      console.error("Error toggling EN reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  // POST Toggle English Article Bookmark
  app.post("/api/en/articles/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const articleId = req.params.id;

      // Check if bookmark exists
      const existing = await db
        .select()
        .from(enBookmarks)
        .where(
          and(
            eq(enBookmarks.articleId, articleId),
            eq(enBookmarks.userId, userId)
          )
        )
        .limit(1);
      
      if (existing && existing.length > 0) {
        // Remove bookmark
        await db
          .delete(enBookmarks)
          .where(eq(enBookmarks.id, existing[0].id));
        
        return res.json({ isBookmarked: false });
      } else {
        // Add bookmark
        await db
          .insert(enBookmarks)
          .values({
            articleId: articleId,
            userId: userId,
          });
        
        return res.json({ isBookmarked: true });
      }
    } catch (error) {
      console.error("Error toggling EN bookmark:", error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // POST English Article (Editor/Admin only)
  app.post("/api/en/articles", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('[EN Article] User not authenticated');
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    
    console.log('[EN Article POST] User check:', {
      userId: user.id,
      role: user.role,
      allowedLanguages: user.allowedLanguages,
      hasEnglish: user.allowedLanguages?.includes('en'),
      hasValidRole: ['admin', 'editor', 'chief_editor', 'reporter', 'opinion_author'].includes(user.role)
    });
    
    if (!user.allowedLanguages?.includes('en') || !['admin', 'editor', 'chief_editor', 'reporter', 'opinion_author'].includes(user.role)) {
      console.log('[EN Article] Permission denied - Language or role check failed');
      return res.status(403).json({ message: "Insufficient permissions for English content" });
    }

    try {
      const validatedData = insertEnArticleSchema.parse({
        ...req.body,
        authorId: user.id,
      });
      
      // Set published_at if status is published
      const articleData = {
        ...validatedData,
        publishedAt: validatedData.status === 'published' ? new Date() : null,
      };
      
      const newArticle = await db
        .insert(enArticles)
        .values([articleData as any])
        .returning();
      
      res.json(newArticle[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating EN article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  // PATCH English Article
  app.patch("/api/en/articles/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    
    if (!user.allowedLanguages?.includes('en')) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    try {
      // Check if article exists and user has permission
      const existing = await db
        .select()
        .from(enArticles)
        .where(eq(enArticles.id, req.params.id))
        .limit(1);
      
      if (!existing || existing.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Only admins and the author can edit
      if (user.role !== 'admin' && user.id !== existing[0].authorId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updateData: any = {
        ...req.body,
        updatedAt: new Date(),
      };

      // Set published_at when status changes to published
      if (req.body.status === 'published' && existing[0].status !== 'published') {
        updateData.publishedAt = new Date();
      }

      const updated = await db
        .update(enArticles)
        .set(updateData)
        .where(eq(enArticles.id, req.params.id))
        .returning();
      
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating EN article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  // DELETE English Article
  app.delete("/api/en/articles/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    
    if (!user.allowedLanguages?.includes('en') || !['admin', 'chief_editor'].includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    try {
      await db
        .delete(enArticles)
        .where(eq(enArticles.id, req.params.id));
      
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("Error deleting EN article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // GET English Comments for Article
  app.get("/api/en/articles/:articleId/comments", async (req, res) => {
    try {
      const comments = await db
        .select()
        .from(enComments)
        .where(
          and(
            eq(enComments.articleId, req.params.articleId),
            eq(enComments.status, "approved")
          )
        )
        .orderBy(desc(enComments.createdAt));
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching EN comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // POST English Comment
  app.post("/api/en/articles/:articleId/comments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;

    try {
      const validatedData = insertEnCommentSchema.parse({
        ...req.body,
        articleId: req.params.articleId,
        userId: user.id,
      });
      
      const newComment = await db
        .insert(enComments)
        .values(validatedData)
        .returning();
      
      res.json(newComment[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating EN comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Toggle English Article Reaction (Like)
  app.post("/api/en/articles/:articleId/reaction", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;

    try {
      // Check if reaction exists
      const existing = await db
        .select()
        .from(enReactions)
        .where(
          and(
            eq(enReactions.articleId, req.params.articleId),
            eq(enReactions.userId, user.id)
          )
        )
        .limit(1);
      
      if (existing && existing.length > 0) {
        // Remove reaction
        await db
          .delete(enReactions)
          .where(eq(enReactions.id, existing[0].id));
        
        return res.json({ liked: false });
      } else {
        // Add reaction
        await db
          .insert(enReactions)
          .values({
            articleId: req.params.articleId,
            userId: user.id,
            type: "like",
          });
        
        return res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling EN reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  // Toggle English Article Bookmark
  app.post("/api/en/articles/:articleId/bookmark", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;

    try {
      const existing = await db
        .select()
        .from(enBookmarks)
        .where(
          and(
            eq(enBookmarks.articleId, req.params.articleId),
            eq(enBookmarks.userId, user.id)
          )
        )
        .limit(1);
      
      if (existing && existing.length > 0) {
        await db
          .delete(enBookmarks)
          .where(eq(enBookmarks.id, existing[0].id));
        
        return res.json({ bookmarked: false });
      } else {
        await db
          .insert(enBookmarks)
          .values({
            articleId: req.params.articleId,
            userId: user.id,
          });
        
        return res.json({ bookmarked: true });
      }
    } catch (error) {
      console.error("Error toggling EN bookmark:", error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // Get English User Bookmarks
  app.get("/api/en/user/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const bookmarks = await storage.getEnUserBookmarks(req.user.id);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching EN user bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Get English User Liked Articles
  app.get("/api/en/user/liked", isAuthenticated, async (req: any, res) => {
    try {
      const articles = await storage.getEnUserLikedArticles(req.user.id);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching EN user liked articles:", error);
      res.status(500).json({ message: "Failed to fetch liked articles" });
    }
  });

  // Get English User Reading History
  app.get("/api/en/user/history", isAuthenticated, async (req: any, res) => {
    try {
      const history = await storage.getEnUserReadingHistory(req.user.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching EN user reading history:", error);
      res.status(500).json({ message: "Failed to fetch reading history" });
    }
  });

  // English Daily Summary - Comprehensive 24h activity analysis for English content
  app.get("/api/en/ai/daily-summary", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Define time ranges
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Query user events for last 24 hours (English articles only)
      const todayEvents = await db
        .select({
          id: userEvents.id,
          articleId: userEvents.articleId,
          eventType: userEvents.eventType,
          eventValue: userEvents.eventValue,
          metadata: userEvents.metadata,
          createdAt: userEvents.createdAt,
          categoryId: enArticles.categoryId,
          categoryName: enCategories.name,
          articleTitle: enArticles.title,
          articleSlug: enArticles.slug,
        })
        .from(userEvents)
        .innerJoin(enArticles, eq(userEvents.articleId, enArticles.id))
        .leftJoin(enCategories, eq(enArticles.categoryId, enCategories.id))
        .where(
          and(
            eq(userEvents.userId, userId),
            sql`${userEvents.createdAt} >= ${last24h.toISOString()}`
          )
        )
        .orderBy(desc(userEvents.createdAt));

      // Check if user has activity
      if (todayEvents.length === 0) {
        return res.status(404).json({ 
          message: "No activity in the last 24 hours",
          hasActivity: false 
        });
      }

      // Query previous 24h for comparison (English articles only)
      const yesterdayEvents = await db
        .select({
          eventType: userEvents.eventType,
          articleId: userEvents.articleId,
        })
        .from(userEvents)
        .innerJoin(enArticles, eq(userEvents.articleId, enArticles.id))
        .where(
          and(
            eq(userEvents.userId, userId),
            sql`${userEvents.createdAt} >= ${previous24h.toISOString()}`,
            sql`${userEvents.createdAt} < ${last24h.toISOString()}`
          )
        );

      // ============================================================
      // 1. GREETING & SUMMARY
      // ============================================================

      const readEvents = todayEvents.filter(e => e.eventType === 'read');
      const uniqueArticlesRead = new Set(readEvents.map(e => e.articleId)).size;
      
      const totalReadingTimeSeconds = readEvents.reduce((sum, event) => {
        const duration = (event.metadata as any)?.readDuration || 0;
        return sum + duration;
      }, 0);
      const totalReadingTimeMinutes = Math.round(totalReadingTimeSeconds / 60);

      // Calculate top categories
      const categoryCounts = todayEvents.reduce((acc, event) => {
        if (event.categoryName) {
          acc[event.categoryName] = (acc[event.categoryName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([name]) => name);

      // Determine reading mood based on scrollDepth and duration
      const avgScrollDepth = readEvents.reduce((sum, event) => {
        const scrollDepth = (event.metadata as any)?.scrollDepth || 0;
        return sum + scrollDepth;
      }, 0) / (readEvents.length || 1);

      const avgReadDuration = totalReadingTimeSeconds / (readEvents.length || 1);

      let readingMood = "Curious";
      if (avgScrollDepth > 80 && avgReadDuration > 120) {
        readingMood = "Analytical";
      } else if (avgScrollDepth < 40 && avgReadDuration < 60) {
        readingMood = "Fast";
      } else if (avgScrollDepth > 60 && todayEvents.filter(e => e.eventType === 'comment').length > 2) {
        readingMood = "Critical";
      }

      const personalizedGreeting = {
        userName: user.firstName || user.email.split('@')[0],
        articlesReadToday: uniqueArticlesRead,
        readingTimeMinutes: totalReadingTimeMinutes,
        topCategories,
        readingMood,
      };

      // ============================================================
      // 2. PERFORMANCE METRICS
      // ============================================================

      const articlesBookmarked = todayEvents.filter(e => e.eventType === 'save').length;
      const articlesLiked = todayEvents.filter(e => e.eventType === 'like').length;
      const commentsPosted = todayEvents.filter(e => e.eventType === 'comment').length;

      const completionRate = Math.round(avgScrollDepth);

      // Compare with yesterday
      const yesterdayReadCount = new Set(
        yesterdayEvents.filter(e => e.eventType === 'read').map(e => e.articleId)
      ).size;
      
      const percentChangeFromYesterday = yesterdayReadCount > 0
        ? Math.round(((uniqueArticlesRead - yesterdayReadCount) / yesterdayReadCount) * 100)
        : 100;

      const metrics = {
        articlesRead: uniqueArticlesRead,
        readingTimeMinutes: totalReadingTimeMinutes,
        completionRate,
        articlesBookmarked,
        articlesLiked,
        commentsPosted,
        percentChangeFromYesterday,
      };

      // ============================================================
      // 3. INTEREST ANALYSIS
      // ============================================================

      const categoryBreakdown = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({
          name,
          count,
        }));

      // Extract common topics from article titles
      const allTitles = todayEvents
        .filter(e => e.articleTitle)
        .map(e => e.articleTitle!);
      
      const topicWords = allTitles
        .join(' ')
        .split(/\s+/)
        .filter(word => word.length > 4)
        .reduce((acc, word) => {
          acc[word] = (acc[word] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topicsThatCatchAttention = Object.entries(topicWords)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

      // Get suggested categories based on user's reading patterns
      const userCategoryIds = Array.from(new Set(
        todayEvents.filter(e => e.categoryId).map(e => e.categoryId!)
      ));

      const suggestedCategoriesData = userCategoryIds.length > 0
        ? await db
            .select({
              name: enCategories.name,
            })
            .from(enCategories)
            .where(
              and(
                eq(enCategories.status, 'active'),
                sql`${enCategories.id} IN (${sql.join(userCategoryIds, sql`, `)})`
              )
            )
            .limit(3)
        : [];

      const suggestedCategories = suggestedCategoriesData.map(cat => cat.name);

      const interestAnalysis = {
        categoryBreakdown,
        topicsThatCatchAttention,
        suggestedCategories,
      };

      // ============================================================
      // 4. TIME-BASED ACTIVITY
      // ============================================================

      const hourlyActivity = new Array(24).fill(0);
      todayEvents.forEach(event => {
        const hour = new Date(event.createdAt).getHours();
        hourlyActivity[hour]++;
      });

      const hourlyBreakdown = hourlyActivity.map((count, hour) => ({
        hour,
        count,
      }));

      const peakReadingTime = hourlyActivity.indexOf(Math.max(...hourlyActivity));
      const nonZeroHours = hourlyActivity.filter(count => count > 0);
      const lowActivityPeriod = nonZeroHours.length > 0
        ? hourlyActivity.indexOf(Math.min(...nonZeroHours.filter(h => h > 0)))
        : 0;

      let aiSuggestion = "Keep up the consistent reading!";
      if (peakReadingTime >= 20 || peakReadingTime <= 5) {
        aiSuggestion = "You prefer reading at night, try morning reading for more variety";
      } else if (uniqueArticlesRead < 3) {
        aiSuggestion = "Try reading 3 articles daily to expand your knowledge";
      } else if (topCategories.length < 2) {
        aiSuggestion = "Explore articles from new categories to broaden your interests";
      }

      const timeActivity = {
        hourlyBreakdown,
        peakReadingTime,
        lowActivityPeriod,
        aiSuggestion,
      };

      // ============================================================
      // 5. AI INSIGHTS
      // ============================================================

      let dailyGoal = "Read 3 articles from a category you haven't visited in a week";
      
      if (uniqueArticlesRead >= 5) {
        dailyGoal = "You're an active reader! Try commenting on an article to share your thoughts";
      } else if (articlesBookmarked > articlesLiked) {
        dailyGoal = "You have many saved articles, dedicate time to read them";
      }

      const focusScore = Math.round(
        (completionRate * 0.6) + (Math.min(avgReadDuration / 180, 1) * 40)
      );

      const aiInsights = {
        readingMood,
        dailyGoal,
        focusScore,
      };

      // ============================================================
      // FINAL RESPONSE
      // ============================================================

      res.json({
        hasActivity: true,
        personalizedGreeting,
        metrics,
        interestAnalysis,
        timeActivity,
        aiInsights,
        generatedAt: now.toISOString(),
      });

    } catch (error) {
      console.error("Error generating English daily summary:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // ============================================================
  // END ENGLISH VERSION API ENDPOINTS
  // ============================================================

  // ============================================================
  // URDU VERSION API ENDPOINTS
  // ============================================================

  // Public Urdu Categories endpoint
  app.get("/api/ur/categories", async (req, res) => {
    try {
      const categories = await storage.getUrCategories({ status: "active" });
      res.json(categories);
    } catch (error) {
      console.error("Error fetching Urdu categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get specific Urdu category
  app.get("/api/ur/categories/:id", async (req, res) => {
    try {
      const [category] = await db
        .select()
        .from(urCategories)
        .where(eq(urCategories.id, req.params.id))
        .limit(1);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching Urdu category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Get Urdu articles (published)
  app.get("/api/ur/articles", async (req, res) => {
    try {
      const { categoryId, status = "published", limit = 20, offset = 0 } = req.query;
      
      const conditions: any[] = [];
      if (status) {
        conditions.push(eq(urArticles.status, status as string));
      }
      if (categoryId) {
        conditions.push(eq(urArticles.categoryId, categoryId as string));
      }

      const reporterAlias = aliasedTable(users, 'reporter');

      const results = await db
        .select()
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .leftJoin(users, eq(urArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(urArticles.publishedAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const articles = results.map((result: any) => {
        const article = result.ur_articles;
        const category = result.ur_categories;
        const authorData = result.users;
        const reporterData = result.reporter;
        const displayAuthor = reporterData || authorData;

        return {
          id: article.id,
          title: article.title,
          subtitle: article.subtitle,
          slug: article.slug,
          excerpt: article.excerpt,
          imageUrl: article.imageUrl,
          imageFocalPoint: article.imageFocalPoint,
          categoryId: article.categoryId,
          authorId: article.authorId,
          reporterId: article.reporterId,
          articleType: article.articleType,
          newsType: article.newsType,
          status: article.status,
          isFeatured: article.isFeatured,
          views: article.views,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt,
          category: category ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            description: category.description,
          } : undefined,
          author: displayAuthor ? {
            id: displayAuthor.id,
            email: displayAuthor.email,
            firstName: displayAuthor.firstName,
            lastName: displayAuthor.lastName,
            profileImageUrl: displayAuthor.profileImageUrl,
            bio: displayAuthor.bio,
          } : undefined,
        };
      });
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching Urdu articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get Single Urdu Article by Slug - with full details
  app.get("/api/ur/articles/:slug", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Create alias for reporter
      const reporterAlias = aliasedTable(users, 'reporter');

      // Get article with category, author, and reporter joins
      const results = await db
        .select()
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .leftJoin(users, eq(urArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
        .where(eq(urArticles.slug, req.params.slug))
        .limit(1);
      
      if (!results || results.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Access joined tables by their actual table names
      const result: any = results[0];
      const article = result.ur_articles;
      const category = result.ur_categories;
      const authorData = result.users;
      const reporterData = result.reporter;

      // Run all queries in parallel for better performance
      const [
        bookmarkResult,
        reactionResult,
        reactionsCountResult,
        commentsCountResult
      ] = await Promise.all([
        userId ? db.select().from(urBookmarks)
          .where(and(eq(urBookmarks.articleId, article.id), eq(urBookmarks.userId, userId)))
          .limit(1) : Promise.resolve([]),
        userId ? db.select().from(urReactions)
          .where(and(eq(urReactions.articleId, article.id), eq(urReactions.userId, userId)))
          .limit(1) : Promise.resolve([]),
        db.select({ count: sql<number>`count(*)` })
          .from(urReactions)
          .where(eq(urReactions.articleId, article.id)),
        db.select({ count: sql<number>`count(*)` })
          .from(urComments)
          .where(eq(urComments.articleId, article.id))
      ]);

      const isBookmarked = bookmarkResult.length > 0;
      const hasReacted = reactionResult.length > 0;
      const reactionsCount = Number(reactionsCountResult[0].count);
      const commentsCount = Number(commentsCountResult[0].count);

      // Increment views
      await db
        .update(urArticles)
        .set({ views: sql`${urArticles.views} + 1` })
        .where(eq(urArticles.id, article.id));

      // Priority: reporter > author (same as dashboard)
      const displayAuthor = reporterData || authorData;

      // Return full article details with ALL article fields
      const articleWithDetails: UrArticleWithDetails = {
        ...article,
        category: category || undefined,
        author: displayAuthor || undefined,
        isBookmarked,
        hasReacted,
        reactionsCount,
        commentsCount,
      };
      
      res.json(articleWithDetails);
    } catch (error) {
      console.error("Error fetching Urdu article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Get related articles for a Urdu article
  app.get("/api/ur/articles/:slug/related", async (req: any, res) => {
    try {
      // Get the Urdu article by slug
      const articleResults = await db
        .select()
        .from(urArticles)
        .where(eq(urArticles.slug, req.params.slug))
        .limit(1);
      
      if (!articleResults || articleResults.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      const article = articleResults[0];

      // Get related articles - same logic as English version
      const conditions = [
        eq(urArticles.status, "published"),
        ne(urArticles.id, article.id),
      ];

      if (article.categoryId) {
        conditions.push(eq(urArticles.categoryId, article.categoryId));
      }

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
        .where(and(...conditions))
        .orderBy(desc(urArticles.publishedAt))
        .limit(5);

      const related = results.map((r) => ({
        ...r.article,
        category: r.category || undefined,
        author: r.reporter || r.author || undefined,
      }));

      res.json(related);
    } catch (error) {
      console.error("Error fetching related Urdu articles:", error);
      res.status(500).json({ message: "Failed to fetch related articles" });
    }
  });

  // Get AI-powered analytics/insights for a Urdu article
  app.get("/api/ur/articles/:slug/ai-insights", async (req: any, res) => {
    try {
      // Get the Urdu article by slug
      const articleResults = await db
        .select()
        .from(urArticles)
        .where(eq(urArticles.slug, req.params.slug))
        .limit(1);
      
      if (!articleResults || articleResults.length === 0) {
        return res.status(404).json({ message: "Article not found" });
      }

      const article = articleResults[0];

      // Get reading history stats (shared table uses article.id)
      const readingStats = await db
        .select({
          avgDuration: sql<number>`AVG(${readingHistory.readDuration})`,
          totalReads: sql<number>`COUNT(*)`,
        })
        .from(readingHistory)
        .where(eq(readingHistory.articleId, article.id));

      // Get reactions count (Urdu reactions table: ur_reactions)
      const reactionsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(urReactions)
        .where(eq(urReactions.articleId, article.id));

      // Get comments count (Urdu comments table: ur_comments)
      const commentsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(urComments)
        .where(and(
          eq(urComments.articleId, article.id),
          eq(urComments.status, "approved")
        ));

      const avgReadTime = readingStats[0]?.avgDuration || 0;
      const totalReads = Number(readingStats[0]?.totalReads || 0);
      const totalReactions = Number(reactionsCount[0]?.count || 0);
      const totalComments = Number(commentsCount[0]?.count || 0);
      const totalViews = article.views || 0;

      // Calculate engagement rate: (reactions + comments) / views
      const engagementRate = totalViews > 0 
        ? ((totalReactions + totalComments) / totalViews) 
        : 0;

      // Estimate reading completion based on avg read time
      // Assuming 200 words per minute reading speed
      const estimatedReadTime = article.content 
        ? Math.ceil(article.content.split(/\s+/).length / 200) * 60 
        : 180; // default 3 min
      
      const completionRate = avgReadTime > 0 && estimatedReadTime > 0
        ? Math.min(100, (avgReadTime / estimatedReadTime) * 100)
        : 0;

      res.json({
        avgReadTime: Math.round(avgReadTime), // in seconds
        totalReads,
        totalReactions,
        totalComments,
        totalViews,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        completionRate: Math.round(completionRate), // percentage
        totalInteractions: totalReactions + totalComments,
      });
    } catch (error) {
      console.error("Error fetching Urdu article AI insights:", error);
      res.status(500).json({ message: "Failed to fetch article insights" });
    }
  });

  // Get Urdu category articles by slug
  app.get("/api/ur/category/:slug/articles", async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const [category] = await db
        .select()
        .from(urCategories)
        .where(eq(urCategories.slug, req.params.slug))
        .limit(1);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const reporterAlias = aliasedTable(users, 'reporter');

      const results = await db
        .select()
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .leftJoin(users, eq(urArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
        .where(
          and(
            eq(urArticles.categoryId, category.id),
            eq(urArticles.status, "published")
          )
        )
        .orderBy(desc(urArticles.publishedAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const articles = results.map((result: any) => {
        const article = result.ur_articles;
        const categoryData = result.ur_categories;
        const authorData = result.users;
        const reporterData = result.reporter;
        const displayAuthor = reporterData || authorData;

        return {
          id: article.id,
          title: article.title,
          subtitle: article.subtitle,
          slug: article.slug,
          excerpt: article.excerpt,
          imageUrl: article.imageUrl,
          imageFocalPoint: article.imageFocalPoint,
          categoryId: article.categoryId,
          authorId: article.authorId,
          reporterId: article.reporterId,
          articleType: article.articleType,
          newsType: article.newsType,
          status: article.status,
          isFeatured: article.isFeatured,
          views: article.views,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt,
          category: categoryData ? {
            id: categoryData.id,
            name: categoryData.name,
            slug: categoryData.slug,
            icon: categoryData.icon,
            color: categoryData.color,
            description: categoryData.description,
          } : undefined,
          author: displayAuthor ? {
            id: displayAuthor.id,
            email: displayAuthor.email,
            firstName: displayAuthor.firstName,
            lastName: displayAuthor.lastName,
            profileImageUrl: displayAuthor.profileImageUrl,
            bio: displayAuthor.bio,
          } : undefined,
        };
      });
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching Urdu category articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get Urdu category by slug
  app.get("/api/ur/categories/slug/:slug", async (req, res) => {
    try {
      const [category] = await db
        .select()
        .from(urCategories)
        .where(eq(urCategories.slug, req.params.slug))
        .limit(1);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching Urdu category by slug:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Get Urdu articles by category ID
  app.get("/api/ur/categories/:id/articles", async (req, res) => {
    try {
      const categoryId = req.params.id;
      const { limit = 50, offset = 0 } = req.query;

      const reporterAlias = aliasedTable(users, 'reporter');

      const results = await db
        .select()
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .leftJoin(users, eq(urArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
        .where(
          and(
            eq(urArticles.categoryId, categoryId),
            eq(urArticles.status, "published")
          )
        )
        .orderBy(desc(urArticles.publishedAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const articles = results.map((result: any) => {
        const article = result.ur_articles;
        const categoryData = result.ur_categories;
        const authorData = result.users;
        const reporterData = result.reporter;
        const displayAuthor = reporterData || authorData;

        return {
          id: article.id,
          title: article.title,
          subtitle: article.subtitle,
          slug: article.slug,
          excerpt: article.excerpt,
          imageUrl: article.imageUrl,
          imageFocalPoint: article.imageFocalPoint,
          categoryId: article.categoryId,
          authorId: article.authorId,
          reporterId: article.reporterId,
          articleType: article.articleType,
          newsType: article.newsType,
          status: article.status,
          isFeatured: article.isFeatured,
          views: article.views,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt,
          category: categoryData ? {
            id: categoryData.id,
            name: categoryData.name,
            slug: categoryData.slug,
            icon: categoryData.icon,
            color: categoryData.color,
            description: categoryData.description,
          } : undefined,
          author: displayAuthor ? {
            id: displayAuthor.id,
            email: displayAuthor.email,
            firstName: displayAuthor.firstName,
            lastName: displayAuthor.lastName,
            profileImageUrl: displayAuthor.profileImageUrl,
            bio: displayAuthor.bio,
          } : undefined,
        };
      });
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching Urdu category articles by ID:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get Urdu category analytics
  app.get("/api/ur/categories/:id/analytics", async (req, res) => {
    try {
      const categoryId = req.params.id;

      // Get total articles in category
      const [articleCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(
          and(
            eq(urArticles.categoryId, categoryId),
            eq(urArticles.status, "published")
          )
        );

      // Get total views
      const [viewsSum] = await db
        .select({ total: sql<number>`COALESCE(SUM(${urArticles.views}), 0)::int` })
        .from(urArticles)
        .where(
          and(
            eq(urArticles.categoryId, categoryId),
            eq(urArticles.status, "published")
          )
        );

      // Total interactions not available for Urdu version yet
      const totalInteractions = 0;

      // Get most active author (prioritize reporterId)
      const reporterAlias = aliasedTable(users, 'reporter');
      const authorResults = await db
        .select({
          reporterId: urArticles.reporterId,
          authorId: urArticles.authorId,
          count: sql<number>`count(*)::int`,
          reporter: {
            id: reporterAlias.id,
            firstName: reporterAlias.firstName,
            lastName: reporterAlias.lastName,
            profileImageUrl: reporterAlias.profileImageUrl,
          },
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(urArticles)
        .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
        .leftJoin(users, eq(urArticles.authorId, users.id))
        .where(
          and(
            eq(urArticles.categoryId, categoryId),
            eq(urArticles.status, "published")
          )
        )
        .groupBy(urArticles.reporterId, urArticles.authorId, reporterAlias.id, reporterAlias.firstName, reporterAlias.lastName, reporterAlias.profileImageUrl, users.id, users.firstName, users.lastName, users.profileImageUrl)
        .orderBy(desc(sql`count(*)`))
        .limit(1);

      let mostActiveAuthor = null;
      if (authorResults.length > 0) {
        const result = authorResults[0];
        const displayAuthor = result.reporter?.id ? result.reporter : result.author;
        if (displayAuthor?.id) {
          mostActiveAuthor = {
            id: displayAuthor.id,
            name: `${displayAuthor.firstName || ''} ${displayAuthor.lastName || ''}`.trim() || 'Unknown',
            profileImageUrl: displayAuthor.profileImageUrl,
            articleCount: result.count,
          };
        }
      }

      // Calculate average views per article
      const avgViews = articleCount.count > 0 
        ? Math.round((viewsSum.total || 0) / articleCount.count)
        : 0;

      res.json({
        totalArticles: articleCount.count || 0,
        totalViews: viewsSum.total || 0,
        totalInteractions,
        mostActiveAuthor,
        avgViewsPerArticle: avgViews,
      });
    } catch (error) {
      console.error("Error fetching Urdu category analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ============================================================
  // URDU DASHBOARD ENDPOINTS
  // ============================================================

  // Urdu Dashboard Statistics
  app.get("/api/ur/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getUrDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching Urdu dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Get Urdu dashboard categories
  app.get("/api/ur/dashboard/categories", requireAuth, requirePermission("categories.view"), async (req: any, res) => {
    try {
      const categories = await db
        .select()
        .from(urCategories)
        .orderBy(asc(urCategories.displayOrder));

      res.json(categories);
    } catch (error) {
      console.error("Error fetching Urdu categories:", error);
      res.status(500).json({ message: "Failed to fetch Urdu categories" });
    }
  });

  // Get single Urdu category by ID (for editing)
  app.get("/api/ur/dashboard/categories/:id", requireAuth, requirePermission("categories.view"), async (req: any, res) => {
    try {
      const categoryId = req.params.id;

      const [category] = await db
        .select()
        .from(urCategories)
        .where(eq(urCategories.id, categoryId))
        .limit(1);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Error fetching Urdu category:", error);
      res.status(500).json({ message: "Failed to fetch Urdu category" });
    }
  });

  // Create new Urdu category
  app.post("/api/ur/dashboard/categories", requireAuth, requirePermission("categories.create"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = insertUrCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid data",
          errors: parsed.error.errors 
        });
      }

      const [existingCategory] = await db
        .select()
        .from(urCategories)
        .where(eq(urCategories.slug, parsed.data.slug))
        .limit(1);

      if (existingCategory) {
        return res.status(409).json({ message: "Category slug already exists" });
      }

      const [category] = await db
        .insert(urCategories)
        .values(parsed.data)
        .returning();

      await logActivity({
        userId,
        action: "created",
        entityType: "ur_category",
        entityId: category.id,
        newValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(category);
    } catch (error) {
      console.error("Error creating Urdu category:", error);
      res.status(500).json({ message: "Failed to create Urdu category" });
    }
  });

  // Update Urdu category
  app.patch("/api/ur/dashboard/categories/:id", requireAuth, requirePermission("categories.update"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const categoryId = req.params.id;

      const [oldCategory] = await db
        .select()
        .from(urCategories)
        .where(eq(urCategories.id, categoryId))
        .limit(1);

      if (!oldCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const parsed = insertUrCategorySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid data",
          errors: parsed.error.errors 
        });
      }

      if (parsed.data.slug && parsed.data.slug !== oldCategory.slug) {
        const [existingCategory] = await db
          .select()
          .from(urCategories)
          .where(eq(urCategories.slug, parsed.data.slug))
          .limit(1);

        if (existingCategory && existingCategory.id !== categoryId) {
          return res.status(409).json({ message: "Category slug already exists" });
        }
      }

      const [category] = await db
        .update(urCategories)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(urCategories.id, categoryId))
        .returning();

      await logActivity({
        userId,
        action: "updated",
        entityType: "ur_category",
        entityId: categoryId,
        oldValue: oldCategory,
        newValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(category);
    } catch (error) {
      console.error("Error updating Urdu category:", error);
      res.status(500).json({ message: "Failed to update Urdu category" });
    }
  });

  // Delete Urdu category
  app.delete("/api/ur/dashboard/categories/:id", requireAuth, requirePermission("categories.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const categoryId = req.params.id;

      const [category] = await db
        .select()
        .from(urCategories)
        .where(eq(urCategories.id, categoryId))
        .limit(1);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const [articleCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(eq(urArticles.categoryId, categoryId));

      if (articleCount.count > 0) {
        return res.status(400).json({ 
          message: `Cannot delete category with ${articleCount.count} articles. Please reassign or delete the articles first.` 
        });
      }

      await db.delete(urCategories).where(eq(urCategories.id, categoryId));

      await logActivity({
        userId,
        action: "deleted",
        entityType: "ur_category",
        entityId: categoryId,
        oldValue: category,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Urdu category deleted successfully" });
    } catch (error) {
      console.error("Error deleting Urdu category:", error);
      res.status(500).json({ message: "Failed to delete Urdu category" });
    }
  });

  // Urdu Articles Metrics
  app.get("/api/ur/dashboard/articles/metrics", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const [publishedCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(eq(urArticles.status, "published"));

      const [draftCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(eq(urArticles.status, "draft"));

      const [scheduledCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(urArticles)
        .where(eq(urArticles.status, "scheduled"));

      const [totalViews] = await db
        .select({ total: sql<number>`COALESCE(SUM(${urArticles.views}), 0)::int` })
        .from(urArticles)
        .where(eq(urArticles.status, "published"));

      res.json({
        published: publishedCount.count,
        draft: draftCount.count,
        scheduled: scheduledCount.count,
        totalViews: totalViews.total,
      });
    } catch (error) {
      console.error("Error fetching Urdu articles metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Get Urdu dashboard articles
  app.get("/api/ur/dashboard/articles", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
    try {
      const { status, categoryId, limit = 50, offset = 0 } = req.query;

      const conditions: any[] = [];
      if (status) {
        conditions.push(eq(urArticles.status, status as string));
      }
      if (categoryId) {
        conditions.push(eq(urArticles.categoryId, categoryId as string));
      }

      const reporterAlias = aliasedTable(users, 'reporter');

      const results = await db
        .select()
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .leftJoin(users, eq(urArticles.authorId, users.id))
        .leftJoin(reporterAlias, eq(urArticles.reporterId, reporterAlias.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(urArticles.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const articles = results.map((result: any) => {
        const article = result.ur_articles;
        const category = result.ur_categories;
        const authorData = result.users;
        const reporterData = result.reporter;
        const displayAuthor = reporterData || authorData;

        return {
          ...article,
          category: category ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
          } : undefined,
          author: displayAuthor ? {
            id: displayAuthor.id,
            email: displayAuthor.email,
            firstName: displayAuthor.firstName,
            lastName: displayAuthor.lastName,
            profileImageUrl: displayAuthor.profileImageUrl,
          } : undefined,
        };
      });

      res.json(articles);
    } catch (error) {
      console.error("Error fetching Urdu articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get single Urdu article by ID for editing
  app.get("/api/ur/dashboard/articles/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      
      const [article] = await db
        .select({
          id: urArticles.id,
          title: urArticles.title,
          subtitle: urArticles.subtitle,
          slug: urArticles.slug,
          content: urArticles.content,
          excerpt: urArticles.excerpt,
          imageUrl: urArticles.imageUrl,
          imageFocalPoint: urArticles.imageFocalPoint,
          categoryId: urArticles.categoryId,
          authorId: urArticles.authorId,
          reporterId: urArticles.reporterId,
          articleType: urArticles.articleType,
          newsType: urArticles.newsType,
          publishType: urArticles.publishType,
          scheduledAt: urArticles.scheduledAt,
          status: urArticles.status,
          reviewStatus: urArticles.reviewStatus,
          reviewedBy: urArticles.reviewedBy,
          reviewedAt: urArticles.reviewedAt,
          reviewNotes: urArticles.reviewNotes,
          hideFromHomepage: urArticles.hideFromHomepage,
          aiSummary: urArticles.aiSummary,
          smartSummary: urArticles.smartSummary,
          aiGenerated: urArticles.aiGenerated,
          isFeatured: urArticles.isFeatured,
          views: urArticles.views,
          displayOrder: urArticles.displayOrder,
          seo: urArticles.seo,
          publishedAt: urArticles.publishedAt,
          createdAt: urArticles.createdAt,
          updatedAt: urArticles.updatedAt,
          category: {
            id: urCategories.id,
            name: urCategories.name,
            slug: urCategories.slug,
          },
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(urArticles)
        .leftJoin(urCategories, eq(urArticles.categoryId, urCategories.id))
        .leftJoin(users, eq(urArticles.authorId, users.id))
        .where(eq(urArticles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching Urdu article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Create Urdu article
  app.post("/api/ur/dashboard/articles", requireAuth, requirePermission("articles.create"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const parsed = insertUrArticleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid data",
          errors: parsed.error.errors 
        });
      }

      const [existingArticle] = await db
        .select()
        .from(urArticles)
        .where(eq(urArticles.slug, parsed.data.slug))
        .limit(1);

      if (existingArticle) {
        return res.status(409).json({ message: "Article slug already exists" });
      }

      const [article] = await db
        .insert(urArticles)
        .values({
          ...parsed.data,
          authorId: userId,
        } as any)
        .returning();

      await logActivity({
        userId,
        action: "created",
        entityType: "ur_article",
        entityId: article.id,
        newValue: article,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(article);
    } catch (error) {
      console.error("Error creating Urdu article:", error);
      res.status(500).json({ message: "Failed to create Urdu article" });
    }
  });

  // Update Urdu article
  app.patch("/api/ur/dashboard/articles/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [oldArticle] = await db
        .select()
        .from(urArticles)
        .where(eq(urArticles.id, articleId))
        .limit(1);

      if (!oldArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      const permissions = await getUserPermissions(userId);
      const canEditAny = permissions.includes("articles.edit_any");
      const canEditOwn = permissions.includes("articles.edit_own");

      if (!canEditAny && (!canEditOwn || oldArticle.authorId !== userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const parsed = insertUrArticleSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid data",
          errors: parsed.error.errors 
        });
      }

      if (parsed.data.slug && parsed.data.slug !== oldArticle.slug) {
        const [existingArticle] = await db
          .select()
          .from(urArticles)
          .where(eq(urArticles.slug, parsed.data.slug))
          .limit(1);

        if (existingArticle && existingArticle.id !== articleId) {
          return res.status(409).json({ message: "Article slug already exists" });
        }
      }

      const [article] = await db
        .update(urArticles)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        } as any)
        .where(eq(urArticles.id, articleId))
        .returning();

      await logActivity({
        userId,
        action: "updated",
        entityType: "ur_article",
        entityId: articleId,
        oldValue: oldArticle,
        newValue: article,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json(article);
    } catch (error) {
      console.error("Error updating Urdu article:", error);
      res.status(500).json({ message: "Failed to update Urdu article" });
    }
  });

  // Delete/Archive Urdu article
  app.delete("/api/ur/dashboard/articles/:id", requireAuth, requirePermission("articles.delete"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [article] = await db
        .select()
        .from(urArticles)
        .where(eq(urArticles.id, articleId))
        .limit(1);

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      await db
        .update(urArticles)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(urArticles.id, articleId));

      await logActivity({
        userId,
        action: "archived",
        entityType: "ur_article",
        entityId: articleId,
        oldValue: article,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Urdu article archived successfully" });
    } catch (error) {
      console.error("Error archiving Urdu article:", error);
      res.status(500).json({ message: "Failed to archive Urdu article" });
    }
  });

  // ============================================================
  // URDU COMMENTS ENDPOINTS
  // ============================================================

  // Get Urdu article comments
  app.get("/api/ur/article/:id/comments", async (req, res) => {
    try {
      const articleId = req.params.id;

      const commentsData = await db
        .select({
          comment: urComments,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(urComments)
        .leftJoin(users, eq(urComments.userId, users.id))
        .where(
          and(
            eq(urComments.articleId, articleId),
            eq(urComments.status, "approved")
          )
        )
        .orderBy(desc(urComments.createdAt));

      const comments = commentsData.map((row) => ({
        ...row.comment,
        user: row.user,
      }));

      res.json(comments);
    } catch (error) {
      console.error("Error fetching Urdu comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create Urdu comment
  app.post("/api/ur/article/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const parsed = insertUrCommentSchema.safeParse({
        ...req.body,
        articleId,
        userId,
      });

      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid data",
          errors: parsed.error.errors 
        });
      }

      const [comment] = await db
        .insert(urComments)
        .values(parsed.data)
        .returning();

      res.json(comment);
    } catch (error) {
      console.error("Error creating Urdu comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Get all Urdu comments (dashboard)
  app.get("/api/ur/dashboard/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status, articleId } = req.query;

      let query = db
        .select({
          comment: urComments,
          article: {
            id: urArticles.id,
            title: urArticles.title,
          },
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(urComments)
        .leftJoin(urArticles, eq(urComments.articleId, urArticles.id))
        .leftJoin(users, eq(urComments.userId, users.id))
        .$dynamic();

      if (status) {
        query = query.where(eq(urComments.status, status));
      }

      if (articleId) {
        query = query.where(eq(urComments.articleId, articleId));
      }

      query = query.orderBy(desc(urComments.createdAt));

      const results = await query;

      const formattedComments = results.map((row) => ({
        ...row.comment,
        article: row.article,
        user: row.user,
      }));

      res.json(formattedComments);
    } catch (error) {
      console.error("Error fetching Urdu comments:", error);
      res.status(500).json({ message: "Failed to fetch Urdu comments" });
    }
  });

  // Approve Urdu comment
  app.patch("/api/ur/dashboard/comments/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;

      const [comment] = await db
        .select()
        .from(urComments)
        .where(eq(urComments.id, commentId))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const [approved] = await db
        .update(urComments)
        .set({
          status: "approved",
          moderatedBy: userId,
          moderatedAt: new Date(),
        })
        .where(eq(urComments.id, commentId))
        .returning();

      await logActivity({
        userId,
        action: "approved",
        entityType: "ur_comment",
        entityId: commentId,
        oldValue: comment,
        newValue: approved,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      res.json({ message: "Urdu comment approved", comment: approved });
    } catch (error) {
      console.error("Error approving Urdu comment:", error);
      res.status(500).json({ message: "Failed to approve Urdu comment" });
    }
  });

  // Reject Urdu comment
  app.patch("/api/ur/dashboard/comments/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "editor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const commentId = req.params.id;
      const { reason } = req.body;

      const [comment] = await db
        .select()
        .from(urComments)
        .where(eq(urComments.id, commentId))
        .limit(1);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const [rejected] = await db
        .update(urComments)
        .set({
          status: "rejected",
          moderatedBy: userId,
          moderatedAt: new Date(),
          moderationReason: reason || null,
        })
        .where(eq(urComments.id, commentId))
        .returning();

      await logActivity({
        userId,
        action: "rejected",
        entityType: "ur_comment",
        entityId: commentId,
        oldValue: comment,
        newValue: rejected,
        metadata: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
          reason,
        },
      });

      res.json({ message: "Urdu comment rejected", comment: rejected });
    } catch (error) {
      console.error("Error rejecting Urdu comment:", error);
      res.status(500).json({ message: "Failed to reject Urdu comment" });
    }
  });

  // ============================================================
  // URDU ENGAGEMENT ENDPOINTS
  // ============================================================

  // Add reaction to Urdu article
  app.post("/api/ur/article/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;
      const { type = "like" } = req.body;

      const [existingReaction] = await db
        .select()
        .from(urReactions)
        .where(
          and(
            eq(urReactions.articleId, articleId),
            eq(urReactions.userId, userId)
          )
        )
        .limit(1);

      if (existingReaction) {
        return res.status(409).json({ message: "Already reacted" });
      }

      const [reaction] = await db
        .insert(urReactions)
        .values({
          articleId,
          userId,
          type,
        })
        .returning();

      res.json(reaction);
    } catch (error) {
      console.error("Error adding Urdu reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // Remove reaction from Urdu article
  app.delete("/api/ur/article/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      await db
        .delete(urReactions)
        .where(
          and(
            eq(urReactions.articleId, articleId),
            eq(urReactions.userId, userId)
          )
        );

      res.json({ message: "Reaction removed" });
    } catch (error) {
      console.error("Error removing Urdu reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  // Add bookmark to Urdu article
  app.post("/api/ur/article/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      const [existingBookmark] = await db
        .select()
        .from(urBookmarks)
        .where(
          and(
            eq(urBookmarks.articleId, articleId),
            eq(urBookmarks.userId, userId)
          )
        )
        .limit(1);

      if (existingBookmark) {
        return res.status(409).json({ message: "Already bookmarked" });
      }

      const [bookmark] = await db
        .insert(urBookmarks)
        .values({
          articleId,
          userId,
        })
        .returning();

      res.json(bookmark);
    } catch (error) {
      console.error("Error adding Urdu bookmark:", error);
      res.status(500).json({ message: "Failed to add bookmark" });
    }
  });

  // Remove bookmark from Urdu article
  app.delete("/api/ur/article/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const articleId = req.params.id;

      await db
        .delete(urBookmarks)
        .where(
          and(
            eq(urBookmarks.articleId, articleId),
            eq(urBookmarks.userId, userId)
          )
        );

      res.json({ message: "Bookmark removed" });
    } catch (error) {
      console.error("Error removing Urdu bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  // ============================================================
  // URDU SMART BLOCKS - سمارٹ بلاکس
  // ============================================================

  // GET /api/ur/smart-blocks - List all Urdu smart blocks
  app.get("/api/ur/smart-blocks", async (req: any, res) => {
    try {
      const { isActive, placement, type } = req.query;
      
      const filters: any = {};
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }
      if (placement) {
        filters.placement = placement;
      }
      if (type) {
        filters.type = type;
      }

      const blocks = await storage.getUrSmartBlocks(filters);
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching Urdu smart blocks:", error);
      res.status(500).json({ message: "Failed to fetch smart blocks" });
    }
  });

  // POST /api/ur/smart-blocks - Create new Urdu smart block
  app.post("/api/ur/smart-blocks", requireAuth, requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const block = await storage.createUrSmartBlock(req.body);
      
      await logActivity({
        userId: req.user?.id,
        action: "create",
        entityType: "ur_smart_block",
        entityId: block.id,
        newValue: block,
      });

      res.json(block);
    } catch (error) {
      console.error("Error creating Urdu smart block:", error);
      res.status(500).json({ message: "Failed to create smart block" });
    }
  });

  // GET /api/ur/smart-blocks/:id - Get specific Urdu smart block
  app.get("/api/ur/smart-blocks/:id", async (req: any, res) => {
    try {
      const block = await storage.getUrSmartBlockById(req.params.id);
      
      if (!block) {
        return res.status(404).json({ message: "Smart block not found" });
      }

      res.json(block);
    } catch (error) {
      console.error("Error fetching Urdu smart block:", error);
      res.status(500).json({ message: "Failed to fetch smart block" });
    }
  });

  // PUT /api/ur/smart-blocks/:id - Update Urdu smart block
  app.put("/api/ur/smart-blocks/:id", requireAuth, requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const existingBlock = await storage.getUrSmartBlockById(req.params.id);

      if (!existingBlock) {
        return res.status(404).json({ message: "Smart block not found" });
      }

      const updated = await storage.updateUrSmartBlock(req.params.id, req.body);

      await logActivity({
        userId: req.user?.id,
        action: "update",
        entityType: "ur_smart_block",
        entityId: req.params.id,
        oldValue: existingBlock,
        newValue: updated,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating Urdu smart block:", error);
      res.status(500).json({ message: "Failed to update smart block" });
    }
  });

  // DELETE /api/ur/smart-blocks/:id - Delete Urdu smart block
  app.delete("/api/ur/smart-blocks/:id", requireAuth, requirePermission('system.manage_settings'), async (req: any, res) => {
    try {
      const existingBlock = await storage.getUrSmartBlockById(req.params.id);

      if (!existingBlock) {
        return res.status(404).json({ message: "Smart block not found" });
      }

      await storage.deleteUrSmartBlock(req.params.id);

      await logActivity({
        userId: req.user?.id,
        action: "delete",
        entityType: "ur_smart_block",
        entityId: req.params.id,
        oldValue: existingBlock,
      });

      res.json({ message: "Smart block deleted successfully" });
    } catch (error) {
      console.error("Error deleting Urdu smart block:", error);
      res.status(500).json({ message: "Failed to delete smart block" });
    }
  });

  // GET /api/ur/smart-blocks/query/articles - Query Urdu articles by keyword
  app.get("/api/ur/smart-blocks/query/articles", async (req: any, res) => {
    try {
      const { keyword, limit = 6, categories, dateFrom, dateTo } = req.query;

      if (!keyword) {
        return res.status(400).json({ message: "مطلوبہ مطلوبہ لفظ" });
      }

      console.log(`🔍 [Urdu Smart Block] Searching for keyword: "${keyword}", limit: ${limit}`);

      const filters: any = {};
      if (categories) {
        filters.categories = Array.isArray(categories) ? categories : [categories];
      }
      if (dateFrom) {
        filters.dateFrom = dateFrom;
      }
      if (dateTo) {
        filters.dateTo = dateTo;
      }

      const articles = await storage.queryUrArticlesByKeyword(
        keyword,
        parseInt(limit as string) || 6,
        filters
      );

      console.log(`✅ [Urdu Smart Block] Found ${articles.length} articles for "${keyword}"`);
      articles.forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title.substring(0, 60)}..."`);
      });

      res.json({
        items: articles,
        total: articles.length
      });
    } catch (error) {
      console.error("Error querying Urdu articles by keyword:", error);
      res.status(500).json({ message: "Failed to query articles" });
    }
  });

  // ============================================================
  // END URDU VERSION API ENDPOINTS
  // ============================================================

  // ============================================================
  // ADVERTISING SYSTEM - نظام الإعلانات الذكي
  // ============================================================
  app.use("/api/ads", adsRoutes);

  // ============================================================
  // DATA STORY GENERATOR - مولد القصص من البيانات
  // ============================================================
  registerDataStoryRoutes(app, storage);

  // ============================================================
  // SMART JOURNALIST AGENT - وكيل الصحفي الذكي
  // ============================================================
  app.use(journalistAgentRoutes);

  // ============================================================
  // SHORT LINKS - SOCIAL SHARING
  // ============================================================
  
  const shortLinksLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per IP
    message: { message: "تم تجاوز حد إنشاء الروابط القصيرة. يرجى المحاولة بعد دقيقة" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // POST /api/shortlinks - Create or get existing short link
  app.post("/api/shortlinks", shortLinksLimiter, async (req: any, res) => {
    try {
      const validatedData = insertShortLinkSchema.parse(req.body);
      
      if (validatedData.articleId) {
        const existingLink = await storage.getShortLinkByArticle(validatedData.articleId);
        if (existingLink) {
          console.log(`🔗 Returning existing short link for article ${validatedData.articleId}: ${existingLink.shortCode}`);
          return res.json(existingLink);
        }
      }

      const shortLink = await storage.createShortLink({
        ...validatedData,
        createdBy: req.user?.id,
      });

      await logActivity({
        userId: req.user?.id,
        action: "create",
        entityType: "short_link",
        entityId: shortLink.id,
        newValue: { shortCode: shortLink.shortCode, originalUrl: shortLink.originalUrl },
      });

      res.status(201).json(shortLink);
    } catch (error) {
      console.error("Error creating short link:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل إنشاء الرابط القصير" });
    }
  });

  // GET /api/shortlinks/article/:articleId - Get existing short link for article
  app.get("/api/shortlinks/article/:articleId", async (req, res) => {
    try {
      const { articleId } = req.params;
      
      if (!articleId || typeof articleId !== "string" || articleId.trim() === "") {
        return res.status(400).json({ message: "معرف المقال مطلوب" });
      }

      const existingLink = await storage.getShortLinkByArticle(articleId);
      
      if (!existingLink) {
        return res.status(404).json({ message: "لا يوجد رابط قصير لهذا المقال" });
      }

      res.json(existingLink);
    } catch (error) {
      console.error("Error fetching short link by article:", error);
      res.status(500).json({ message: "فشل جلب الرابط القصير" });
    }
  });

  // GET /s/:code - Redirect to original URL and log click
  app.get("/s/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      const shortLink = await storage.getShortLinkByCode(code);
      
      if (!shortLink) {
        return res.status(404).send("الرابط غير موجود");
      }

      if (!shortLink.isActive) {
        return res.status(410).send("هذا الرابط غير نشط");
      }

      if (shortLink.expiresAt && new Date(shortLink.expiresAt) < new Date()) {
        return res.status(410).send("انتهت صلاحية هذا الرابط");
      }

      const clickData: InsertShortLinkClick = {
        shortLinkId: shortLink.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        referer: req.get("referer"),
        userId: (req as any).user?.id,
      };

      await storage.incrementShortLinkClick(shortLink.id, clickData);

      let redirectUrl = shortLink.originalUrl;
      
      const urlObj = new URL(redirectUrl);
      if (shortLink.utmSource) urlObj.searchParams.set("utm_source", shortLink.utmSource);
      if (shortLink.utmMedium) urlObj.searchParams.set("utm_medium", shortLink.utmMedium);
      if (shortLink.utmCampaign) urlObj.searchParams.set("utm_campaign", shortLink.utmCampaign);
      if (shortLink.utmContent) urlObj.searchParams.set("utm_content", shortLink.utmContent);
      
      redirectUrl = urlObj.toString();

      // If there's an articleId, fetch article data for Open Graph tags
      let article = null;
      if (shortLink.articleId) {
        try {
          article = await storage.getArticleById(shortLink.articleId);
        } catch (err) {
          console.error("Error fetching article for short link:", err);
        }
      }

      // HTML escape function to prevent broken meta tags
      const escapeHtml = (text: string): string => {
        if (!text) return '';
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      // Prepare Open Graph data with proper escaping
      const ogTitle = escapeHtml(article?.title || 'سبق الذكية - منصة الأخبار الذكية');
      const ogDescription = escapeHtml(article?.excerpt || 'أخبار محدثة مع تلخيص تلقائي بالذكاء الاصطناعي ونظام توصيات شخصي');
      const ogImage = escapeHtml(article?.imageUrl || 'https://sabq.life/default-og-image.jpg');
      const ogUrl = escapeHtml(`https://sabq.life/s/${code}`);
      const safeRedirectUrl = escapeHtml(redirectUrl);

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:site_name" content="صحيفة سبق الإلكترونية">
  <meta property="og:locale" content="ar_SA">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${ogUrl}">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Instant redirect for browsers -->
  <meta http-equiv="refresh" content="0;url=${safeRedirectUrl}">
  <script>window.location.href="${safeRedirectUrl}";</script>
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; direction: rtl;">
  <h1>جارٍ التوجيه...</h1>
  <p>إذا لم يتم التوجيه تلقائياً، <a href="${safeRedirectUrl}">اضغط هنا</a></p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error("Error redirecting short link:", error);
      res.status(500).send("حدث خطأ في إعادة التوجيه");
    }
  });

  // GET /api/shortlinks/analytics/:linkId - Get analytics (auth required)
  app.get("/api/shortlinks/analytics/:linkId", requireAuth, async (req: any, res) => {
    try {
      const { linkId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const analytics = await storage.getShortLinkAnalytics(linkId, days);

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching short link analytics:", error);
      res.status(500).json({ message: "فشل جلب الإحصائيات" });
    }
  });

  // ============================================================
  // APPLE WALLET ROUTES
  // ============================================================

  // ============================================================
  // PRESS CARD ENDPOINTS (Admin-Only)
  // ============================================================

  // Issue press card - requires hasPressCard flag
  app.post("/api/wallet/press/issue", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user is authorized for press card
      if (!req.user.hasPressCard) {
        return res.status(403).json({ 
          error: 'غير مصرح لك بإصدار بطاقة صحفية. يرجى التواصل مع الإدارة.' 
        });
      }
      
      // Check if pass already exists
      let existingPass = await storage.getWalletPassByUserAndType(userId, 'press');
      
      if (existingPass) {
        // Regenerate existing pass
        try {
          const passData: PressPassData = {
            userId: req.user.id,
            serialNumber: existingPass.serialNumber,
            authToken: existingPass.authenticationToken,
            userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
            userEmail: req.user.email,
            userRole: req.user.role || 'reader',
            profileImageUrl: req.user.profileImageUrl,
            jobTitle: req.user.jobTitle,
            department: req.user.department,
            pressIdNumber: req.user.pressIdNumber,
            validUntil: req.user.cardValidUntil,
          };
          
          const passBuffer = await passKitService.generatePressPass(passData);
          
          // Update timestamp
          await storage.updateWalletPassTimestamp(existingPass.id);
          
          res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="sabq-press-card-${existingPass.serialNumber}.pkpass"`,
            'Content-Length': passBuffer.length,
          });
          
          return res.send(passBuffer);
        } catch (error: any) {
          console.error('❌ [Press Card] Generation failed:', error);
          return res.status(400).json({ 
            error: error.message || 'تعذر إنشاء البطاقة. يرجى التحقق من إعدادات Apple Wallet.',
          });
        }
      }
      
      // Create new pass
      const serialNumber = passKitService.generateSerialNumber(userId, 'press');
      const authToken = passKitService.generateAuthToken();
      
      const passData: PressPassData = {
        userId: req.user.id,
        serialNumber,
        authToken,
        userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
        userEmail: req.user.email,
        userRole: req.user.role || 'reader',
        profileImageUrl: req.user.profileImageUrl,
        jobTitle: req.user.jobTitle,
        department: req.user.department,
        pressIdNumber: req.user.pressIdNumber,
        validUntil: req.user.cardValidUntil,
      };
      
      try {
        const passBuffer = await passKitService.generatePressPass(passData);
        
        // Save to database AFTER successful generation
        await storage.createWalletPass({
          userId,
          passType: 'press',
          passTypeIdentifier: process.env.APPLE_PRESS_PASS_TYPE_ID || 'pass.life.sabq.presscard',
          serialNumber,
          authenticationToken: authToken,
        });
        
        console.log('✅ [Press Card] Issued successfully for user:', userId);
        
        res.set({
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="sabq-press-card-${serialNumber}.pkpass"`,
          'Content-Length': passBuffer.length,
        });
        
        res.send(passBuffer);
      } catch (error: any) {
        console.error('❌ [Press Card] Generation failed:', error);
        res.status(400).json({ 
          error: error.message || 'تعذر إنشاء البطاقة. يرجى التحقق من إعدادات Apple Wallet.',
        });
      }
    } catch (error: any) {
      console.error('❌ [Press Card] Issue error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get press card status
  app.get("/api/wallet/press/status", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user is authorized
      if (!req.user.hasPressCard) {
        return res.json({ 
          hasPass: false,
          authorized: false,
          message: 'غير مصرح لك بإصدار بطاقة صحفية',
        });
      }
      
      const pass = await storage.getWalletPassByUserAndType(userId, 'press');
      
      if (!pass) {
        return res.json({ 
          hasPass: false,
          authorized: true,
        });
      }
      
      res.json({
        hasPass: true,
        authorized: true,
        serialNumber: pass.serialNumber,
        lastUpdated: pass.lastUpdated,
        createdAt: pass.createdAt,
      });
    } catch (error: any) {
      console.error('❌ [Press Card] Status check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // LOYALTY CARD ENDPOINTS (All Users)
  // ============================================================

  // Issue loyalty card - all authenticated users
  app.post("/api/wallet/loyalty/issue", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get or create user points
      let userPoints = await storage.getUserPointsTotal(userId);
      if (!userPoints) {
        userPoints = await storage.createUserPointsTotal(userId);
      }
      
      // Check if pass already exists
      let existingPass = await storage.getWalletPassByUserAndType(userId, 'loyalty');
      
      if (existingPass) {
        // Regenerate with latest points
        try {
          const passData: LoyaltyPassData = {
            userId: req.user.id,
            serialNumber: existingPass.serialNumber,
            authToken: existingPass.authenticationToken,
            userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
            userEmail: req.user.email,
            userRole: req.user.role || 'reader',
            profileImageUrl: req.user.profileImageUrl,
            totalPoints: userPoints.totalPoints,
            currentRank: userPoints.currentRank,
            rankLevel: userPoints.rankLevel,
            memberSince: userPoints.createdAt,
          };
          
          const passBuffer = await passKitService.generateLoyaltyPass(passData);
          
          // Update timestamp
          await storage.updateWalletPassTimestamp(existingPass.id);
          
          res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="sabq-loyalty-card-${existingPass.serialNumber}.pkpass"`,
            'Content-Length': passBuffer.length,
          });
          
          return res.send(passBuffer);
        } catch (error: any) {
          console.error('❌ [Loyalty Card] Generation failed:', error);
          return res.status(400).json({ 
            error: error.message || 'تعذر إنشاء بطاقة العضوية. يرجى المحاولة لاحقاً.',
          });
        }
      }
      
      // Create new pass
      const serialNumber = passKitService.generateSerialNumber(userId, 'loyalty');
      const authToken = passKitService.generateAuthToken();
      
      const passData: LoyaltyPassData = {
        userId: req.user.id,
        serialNumber,
        authToken,
        userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
        userEmail: req.user.email,
        userRole: req.user.role || 'reader',
        profileImageUrl: req.user.profileImageUrl,
        totalPoints: userPoints.totalPoints,
        currentRank: userPoints.currentRank,
        rankLevel: userPoints.rankLevel,
        memberSince: userPoints.createdAt,
      };
      
      try {
        const passBuffer = await passKitService.generateLoyaltyPass(passData);
        
        // Save to database AFTER successful generation
        await storage.createWalletPass({
          userId,
          passType: 'loyalty',
          passTypeIdentifier: process.env.APPLE_LOYALTY_PASS_TYPE_ID || 'pass.life.sabq.loyalty',
          serialNumber,
          authenticationToken: authToken,
        });
        
        console.log('✅ [Loyalty Card] Issued successfully for user:', userId);
        
        res.set({
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="sabq-loyalty-card-${serialNumber}.pkpass"`,
          'Content-Length': passBuffer.length,
        });
        
        res.send(passBuffer);
      } catch (error: any) {
        console.error('❌ [Loyalty Card] Generation failed:', error);
        res.status(400).json({ 
          error: error.message || 'تعذر إنشاء بطاقة العضوية. يرجى المحاولة لاحقاً.',
        });
      }
    } catch (error: any) {
      console.error('❌ [Loyalty Card] Issue error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get loyalty card status with points data
  app.get("/api/wallet/loyalty/status", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user points
      const userPoints = await storage.getUserPointsTotal(userId);
      
      const pass = await storage.getWalletPassByUserAndType(userId, 'loyalty');
      
      res.json({
        hasPass: !!pass,
        ...(pass && {
          serialNumber: pass.serialNumber,
          lastUpdated: pass.lastUpdated,
          createdAt: pass.createdAt,
        }),
        points: userPoints ? {
          total: userPoints.totalPoints,
          rank: userPoints.currentRank,
          level: userPoints.rankLevel,
          lifetime: userPoints.lifetimePoints,
        } : null,
      });
    } catch (error: any) {
      console.error('❌ [Loyalty Card] Status check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PassKit Web Service: Register device
  app.post("/api/wallet/v1/devices/:deviceLibraryId/registrations/:passTypeId/:serialNumber", 
    async (req, res) => {
      try {
        const { deviceLibraryId, passTypeId, serialNumber } = req.params;
        const { pushToken } = req.body;

        const pass = await storage.getWalletPassBySerial(serialNumber);
        if (!pass) {
          return res.status(404).json({ error: 'Pass not found' });
        }

        await storage.registerDevice({
          passId: pass.id,
          deviceLibraryIdentifier: deviceLibraryId,
          pushToken,
        });

        res.status(201).end();
      } catch (error: any) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: error.message });
      }
  });

  // PassKit Web Service: Get updatable passes
  app.get("/api/wallet/v1/devices/:deviceLibraryId/registrations/:passTypeId", 
    async (req, res) => {
      try {
        const { deviceLibraryId, passTypeId } = req.params;
        const passesUpdatedSince = req.query.passesUpdatedSince as string | undefined;
        
        const serialNumbers = await storage.getUpdatedPasses(deviceLibraryId, passTypeId, passesUpdatedSince);

        if (serialNumbers.length === 0) {
          return res.status(204).end();
        }

        res.json({
          serialNumbers,
          lastUpdated: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error('Error getting updated passes:', error);
        res.status(500).json({ error: error.message });
      }
  });

  // PassKit Web Service: Unregister device
  app.delete("/api/wallet/v1/devices/:deviceLibraryId/registrations/:passTypeId/:serialNumber",
    async (req, res) => {
      try {
        const { deviceLibraryId, serialNumber } = req.params;
        
        const pass = await storage.getWalletPassBySerial(serialNumber);
        if (!pass) {
          return res.status(404).json({ error: 'Pass not found' });
        }

        await storage.unregisterDevice(pass.id, deviceLibraryId);
        res.status(200).end();
      } catch (error: any) {
        console.error('Error unregistering device:', error);
        res.status(500).json({ error: error.message });
      }
  });

  // ============================================================
  // DEEP ANALYSIS ROUTES
  // ============================================================

  // Generate Deep Analysis with SSE (requires authentication)
  app.post("/api/deep-analysis/generate", requireAuth, async (req, res) => {
    try {
      const { topic, keywords, category, saudiContext } = req.body;
      
      if (!topic || topic.trim().length === 0) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      // Set up SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        sendEvent('progress', { stage: 'initializing', message: 'جاري تهيئة التحليل...', percent: 10 });

        const { deepAnalysisEngine } = await import('./deepAnalysisEngine');
        
        sendEvent('progress', { stage: 'generating', message: 'جاري توليد التحليل من 3 نماذج AI...', percent: 30 });

        const result = await deepAnalysisEngine.generateAnalysis({
          topic,
          keywords: keywords || [],
          category,
          saudiContext,
        });

        sendEvent('progress', { stage: 'saving', message: 'جاري حفظ النتائج...', percent: 90 });

        const analysisData = {
          title: topic.substring(0, 200),
          topic,
          keywords: keywords || [],
          categoryId: category || null,
          saudiContext,
          createdBy: (req.user as any).id,
          reporterId: (req.user as any).id,
          analysisType: 'comprehensive' as const,
          analysisDepth: 'deep' as const,
          status: 'completed',
          gptAnalysis: result.gpt5Result?.content || null,
          geminiAnalysis: result.geminiResult?.content || null,
          claudeAnalysis: result.claudeResult?.content || null,
          mergedAnalysis: result.unifiedAnalysis,
          executiveSummary: result.executiveSummary,
          recommendations: result.recommendations.join('\n'),
        };

        const analysis = await storage.createDeepAnalysis(analysisData);
        
        sendEvent('complete', { analysis, message: 'تم إنشاء التحليل بنجاح!', percent: 100 });
        res.end();
      } catch (error: any) {
        console.error('Error generating deep analysis:', error);
        sendEvent('error', { message: error.message || 'فشل في توليد التحليل' });
        res.end();
      }
    } catch (error: any) {
      console.error('Error setting up SSE:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Deep Analysis by ID
  app.get("/api/deep-analysis/:id", requireAuth, async (req, res) => {
    try {
      const analysis = await storage.getDeepAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json(analysis);
    } catch (error: any) {
      console.error('Error fetching deep analysis:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // List Deep Analyses
  app.get("/api/deep-analysis", requireAuth, async (req, res) => {
    try {
      const { createdBy, status, categoryId, limit, offset } = req.query;
      
      const result = await storage.listDeepAnalyses({
        createdBy: createdBy as string | undefined,
        status: status as string | undefined,
        categoryId: categoryId as string | undefined,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error listing deep analyses:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Deep Analysis Status (publish/unpublish/archive)
  app.patch("/api/deep-analysis/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['draft', 'completed', 'published', 'archived'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be one of: draft, completed, published, archived' 
        });
      }

      const analysis = await storage.getDeepAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'التحليل غير موجود' });
      }

      // Check permissions using RBAC
      const userPermissions = await getUserPermissions((req.user as any).id);
      const canEditAny = userPermissions.includes('articles.edit_any');
      const canPublish = userPermissions.includes('articles.publish');
      const canEditOwn = userPermissions.includes('articles.edit_own');
      const isOwner = analysis.createdBy === (req.user as any).id;

      // Authorization logic:
      // - articles.edit_any or articles.publish: can update any analysis
      // - articles.edit_own: can only update own analyses
      if (!canEditAny && !canPublish && !(canEditOwn && isOwner)) {
        return res.status(403).json({ error: 'غير مصرح لك بتحديث حالة هذا التحليل' });
      }

      // Update status
      const updated = await storage.updateDeepAnalysis(req.params.id, { status });
      
      // Log activity
      const statusArabic = {
        draft: 'مسودة',
        completed: 'مكتمل',
        published: 'منشور',
        archived: 'مؤرشف'
      };
      
      await storage.logActivity({
        userId: (req.user as any).id,
        action: 'update_analysis_status',
        entityType: 'deep_analysis',
        entityId: req.params.id,
        metadata: { 
          oldStatus: analysis.status, 
          newStatus: status,
          title: analysis.title,
          isOwner 
        },
      });

      res.json({ 
        success: true, 
        analysis: updated,
        message: `تم تحديث حالة التحليل إلى "${statusArabic[status as keyof typeof statusArabic]}"` 
      });
    } catch (error: any) {
      console.error('Error updating deep analysis status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Deep Analysis (full update)
  app.put("/api/deep-analysis/:id", requireAuth, async (req, res) => {
    try {
      const analysis = await storage.getDeepAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      if (analysis.createdBy !== (req.user as any).id) {
        return res.status(403).json({ error: 'Not authorized to update this analysis' });
      }

      const updated = await storage.updateDeepAnalysis(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating deep analysis:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Deep Analysis
  app.delete("/api/deep-analysis/:id", requireAuth, async (req, res) => {
    try {
      const analysis = await storage.getDeepAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      if (analysis.createdBy !== (req.user as any).id) {
        return res.status(403).json({ error: 'Not authorized to delete this analysis' });
      }

      await storage.deleteDeepAnalysis(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting deep analysis:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // OMQ (DEEP ANALYSIS PUBLIC) ROUTES - PHASE 2
  // ============================================================

  // GET /api/omq - قائمة التحليلات المنشورة (public)
  app.get("/api/omq", async (req, res) => {
    try {
      const { status, keyword, category, dateFrom, dateTo, page, limit } = req.query;
      
      // Parse filters
      const filters: any = {
        status: status as string | undefined,
        keyword: keyword as string | undefined,
        category: category as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      };
      
      // Parse date range if provided
      if (dateFrom && dateTo) {
        filters.dateRange = {
          from: new Date(dateFrom as string),
          to: new Date(dateTo as string),
        };
      }
      
      const result = await storage.getPublishedDeepAnalyses(filters);
      
      res.json({
        analyses: result.analyses,
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(result.total / filters.limit),
      });
    } catch (error: any) {
      console.error('Error fetching published analyses:', error);
      res.status(500).json({ 
        success: false,
        error: 'فشل في جلب التحليلات',
        message: error.message 
      });
    }
  });

  // GET /api/omq/:id - تفاصيل تحليل محدد (public)
  app.get("/api/omq/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validation
      if (!id) {
        return res.status(400).json({ 
          success: false,
          error: 'معرف التحليل مطلوب' 
        });
      }
      
      // Get analysis
      const analysis = await storage.getDeepAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ 
          success: false,
          error: 'التحليل غير موجود' 
        });
      }
      
      // Only return published analyses to public
      if (analysis.status !== 'published') {
        return res.status(404).json({ 
          success: false,
          error: 'التحليل غير موجود' 
        });
      }
      
      // Get metrics
      const metrics = await storage.getDeepAnalysisMetrics(id);
      
      // Record view event automatically
      const userId = req.user ? (req.user as any).id : undefined;
      await storage.recordDeepAnalysisEvent({
        analysisId: id,
        userId,
        eventType: 'view',
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          referrer: req.headers.referer,
        },
      });
      
      res.json({
        success: true,
        data: {
          ...analysis,
          metrics: metrics || {
            views: 0,
            shares: 0,
            downloads: 0,
            exportsPdf: 0,
            exportsDocx: 0,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching analysis details:', error);
      res.status(500).json({ 
        success: false,
        error: 'فشل في جلب تفاصيل التحليل',
        message: error.message 
      });
    }
  });

  // POST /api/omq/:id/events - تسجيل حدث (share, download, etc)
  app.post("/api/omq/:id/events", async (req, res) => {
    try {
      const { id } = req.params;
      const { eventType, metadata } = req.body;
      
      // Validation
      const eventSchema = z.object({
        eventType: z.enum(['view', 'share', 'download', 'export_pdf', 'export_docx'], {
          errorMap: () => ({ message: 'نوع الحدث غير صالح' }),
        }),
        metadata: z.any().optional(),
      });
      
      const validation = eventSchema.safeParse({ eventType, metadata });
      if (!validation.success) {
        return res.status(400).json({ 
          success: false,
          error: 'بيانات غير صالحة',
          details: validation.error.errors 
        });
      }
      
      // Check if analysis exists and is published
      const analysis = await storage.getDeepAnalysis(id);
      if (!analysis || analysis.status !== 'published') {
        return res.status(404).json({ 
          success: false,
          error: 'التحليل غير موجود' 
        });
      }
      
      // Record event
      const userId = req.user ? (req.user as any).id : undefined;
      await storage.recordDeepAnalysisEvent({
        analysisId: id,
        userId,
        eventType: validation.data.eventType,
        metadata: {
          ...metadata,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        },
      });
      
      // Get updated metrics
      const updatedMetrics = await storage.getDeepAnalysisMetrics(id);
      
      res.json({
        success: true,
        message: 'تم تسجيل الحدث بنجاح',
        data: {
          metrics: updatedMetrics,
        },
      });
    } catch (error: any) {
      console.error('Error recording event:', error);
      res.status(500).json({ 
        success: false,
        error: 'فشل في تسجيل الحدث',
        message: error.message 
      });
    }
  });

  // GET /api/omq/stats/summary - إحصائيات عامة (protected)
  app.get("/api/omq/stats/summary", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDeepAnalysisStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ 
        success: false,
        error: 'فشل في جلب الإحصائيات',
        message: error.message 
      });
    }
  });

  // PATCH /api/omq/:id - تحديث تحليل (admin/editor/owner only)
  app.patch("/api/omq/:id", requireAuth, requireAnyPermission('articles.edit_any', 'articles.edit_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Get current analysis
      const analysis = await storage.getDeepAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ 
          success: false,
          error: 'التحليل غير موجود' 
        });
      }
      
      // Check permissions
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // If user only has edit_own permission, check ownership
      if (!userPermissions.includes('articles.edit_any') && analysis.createdBy !== userId) {
        return res.status(403).json({ 
          success: false,
          error: 'غير مصرح لك بتعديل هذا التحليل' 
        });
      }
      
      // Validate update data (only allow certain fields)
      const updateSchema = z.object({
        title: z.string().min(3).optional(),
        topic: z.string().min(10).optional(),
        description: z.string().optional(),
        status: z.enum(['draft', 'completed', 'published', 'archived']).optional(),
        categoryId: z.string().uuid().optional(),
        keywords: z.array(z.string()).optional(),
      });
      
      const validation = updateSchema.safeParse(updates);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false,
          error: 'بيانات غير صالحة',
          details: validation.error.errors 
        });
      }
      
      // Update analysis
      const updated = await storage.updateDeepAnalysis(id, validation.data);
      
      // Log activity
      await storage.logActivity({
        userId,
        action: 'update',
        entityType: 'deep_analysis',
        entityId: id,
        oldValue: analysis,
        newValue: updated,
      });
      
      res.json({
        success: true,
        message: 'تم تحديث التحليل بنجاح',
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating analysis:', error);
      res.status(500).json({ 
        success: false,
        error: 'فشل في تحديث التحليل',
        message: error.message 
      });
    }
  });

  // ============================================
  // TASK MANAGEMENT SYSTEM API ENDPOINTS
  // ============================================

  // GET /api/tasks - Get tasks list with filters
  app.get("/api/tasks", taskLimiter, requireAuth, requireAnyPermission('tasks.view_all', 'tasks.view_own'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      const {
        status,
        priority,
        assignedToId,
        createdById,
        department,
        parentTaskId,
        search,
        page = "1",
        limit = "20"
      } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Build base filters
      // Normalize parentTaskId: 'null', '', undefined → null
      let normalizedParentTaskId: string | null | undefined;
      if (parentTaskId === 'null' || parentTaskId === '' || parentTaskId === undefined) {
        normalizedParentTaskId = null;
      } else {
        normalizedParentTaskId = parentTaskId as string;
      }
      
      const filters: any = {
        status: status as string,
        priority: priority as string,
        department: department as string,
        parentTaskId: normalizedParentTaskId,
        search: search as string,
        limit: limitNum,
        offset,
      };
      
      // SECURITY: Handle permission-based filtering
      if (!userPermissions.includes('tasks.view_all')) {
        // User has view_own: ALWAYS filter by their ID, ignore query params
        filters.userIdForOwn = userId;
        // Ignore createdById/assignedToId from query to prevent privilege escalation
      } else {
        // User has view_all: Allow explicit filters
        if (assignedToId) {
          filters.assignedToId = assignedToId as string;
        }
        
        if (createdById) {
          filters.createdById = createdById as string;
        }
      }
      
      const result = await storage.getTasks(filters);
      
      res.json({
        tasks: result.tasks,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      });
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'فشل في جلب المهام' });
    }
  });

  // POST /api/tasks - Create new task
  app.post("/api/tasks", taskLimiter, requireAuth, requirePermission('tasks.create'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Validate request body FIRST (before date conversion)
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        createdById: userId,
      });
      
      // THEN convert date strings to Date objects for Drizzle timestamp columns
      const processedData: any = {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate as string) : null,
      };
      
      const task = await storage.createTask(processedData);
      
      // Log activity
      await storage.logTaskActivity({
        taskId: task.id,
        userId,
        action: 'task_created',
        changes: { description: 'تم إنشاء المهمة' },
      });
      
      res.status(201).json(task);
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'بيانات غير صالحة', details: error.errors });
      }
      res.status(500).json({ error: 'فشل في إنشاء المهمة' });
    }
  });

  // GET /api/tasks/statistics - Get task statistics
  app.get("/api/tasks/statistics", taskLimiter, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // SECURITY: Apply same filter as getTasks
      // If user has view_all, get all stats; otherwise get stats for tasks created OR assigned to user
      const stats = await storage.getTaskStatistics(
        userPermissions.includes('tasks.view_all') ? undefined : userId
      );
      
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching task statistics:', error);
      res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
    }
  });

  // GET /api/tasks/:id - Get task details
  app.get("/api/tasks/:id", taskLimiter, requireAuth, requireAnyPermission('tasks.view_all', 'tasks.view_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      const task = await storage.getTaskWithDetails(id);
      if (!task) {
        return res.status(404).json({ error: 'المهمة غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.view_all')) {
        if (task.createdById !== userId && task.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بعرض هذه المهمة' });
        }
      }
      
      res.json(task);
    } catch (error: any) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'فشل في جلب المهمة' });
    }
  });

  // PATCH /api/tasks/:id - Update task
  app.patch("/api/tasks/:id", taskLimiter, requireAuth, requireAnyPermission('tasks.edit_any', 'tasks.edit_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'المهمة غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (task.createdById !== userId && task.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه المهمة' });
        }
      }
      
      // Store old task snapshot before update
      const oldTask = { ...task };
      
      // Validate PATCH body with partial schema
      const updateSchema = insertTaskSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      // Convert validated date strings to Date objects
      const processedBody: any = { ...validatedData };
      
      if (validatedData.dueDate) {
        const parsedDate = new Date(validatedData.dueDate as string);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: 'تاريخ الاستحقاق غير صالح' });
        }
        processedBody.dueDate = parsedDate;
      }
      
      const updatedTask = await storage.updateTask(id, processedBody);
      
      // Log activity with before/after values
      await storage.logTaskActivity({
        taskId: id,
        userId,
        action: 'task_updated',
        changes: {
          field: 'multiple',
          oldValue: { ...oldTask },
          newValue: { ...updatedTask },
          description: 'تم تحديث المهمة',
        },
      });
      
      res.json(updatedTask);
    } catch (error: any) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'فشل في تحديث المهمة' });
    }
  });

  // PATCH /api/tasks/:id/status - Update task status
  app.patch("/api/tasks/:id/status", taskLimiter, requireAuth, requireAnyPermission('tasks.edit_any', 'tasks.edit_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // Validate status
      const statusSchema = z.object({
        status: z.enum(['todo', 'in_progress', 'review', 'completed', 'archived']),
      });
      statusSchema.parse({ status });
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'المهمة غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (task.createdById !== userId && task.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه المهمة' });
        }
      }
      
      // Store old task snapshot before update
      const oldTask = { ...task };
      
      const updates: any = { status };
      if (status === 'completed') {
        updates.completedAt = new Date();
        updates.progress = 100;
      }
      
      const updatedTask = await storage.updateTask(id, updates);
      
      // Log activity with full before/after values
      await storage.logTaskActivity({
        taskId: id,
        userId,
        action: 'status_changed',
        changes: {
          field: 'multiple',
          oldValue: { ...oldTask },
          newValue: { ...updatedTask },
          description: `تم تغيير الحالة من ${task.status} إلى ${status}`,
        },
      });
      
      res.json(updatedTask);
    } catch (error: any) {
      console.error('Error updating task status:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'حالة غير صالحة' });
      }
      res.status(500).json({ error: 'فشل في تحديث حالة المهمة' });
    }
  });

  // DELETE /api/tasks/:id - Delete task
  app.delete("/api/tasks/:id", taskLimiter, requireAuth, requireAnyPermission('tasks.delete_any', 'tasks.delete_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'المهمة غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.delete_any')) {
        if (task.createdById !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بحذف هذه المهمة' });
        }
      }
      
      await storage.deleteTask(id);
      
      res.json({ success: true, message: 'تم حذف المهمة بنجاح' });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'فشل في حذف المهمة' });
    }
  });

  // POST /api/tasks/:id/subtasks - Create subtask
  app.post("/api/tasks/:id/subtasks", taskLimiter, requireAuth, requireAnyPermission('tasks.edit_any', 'tasks.edit_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'المهمة غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (task.createdById !== userId && task.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه المهمة' });
        }
      }
      
      const validatedData = insertSubtaskSchema.parse({
        ...req.body,
        taskId: id,
      });
      
      const subtask = await storage.createSubtask(validatedData);
      
      // Log activity
      await storage.logTaskActivity({
        taskId: id,
        userId,
        action: 'subtask_created',
        changes: { description: `تم إضافة مهمة فرعية: ${subtask.title}` },
      });
      
      res.status(201).json(subtask);
    } catch (error: any) {
      console.error('Error creating subtask:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'بيانات غير صالحة' });
      }
      res.status(500).json({ error: 'فشل في إضافة المهمة الفرعية' });
    }
  });

  // PATCH /api/subtasks/:id - Update subtask
  app.patch("/api/subtasks/:id", taskLimiter, requireAuth, requireAnyPermission('tasks.edit_any', 'tasks.edit_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // Get subtask to find parent task
      const subtask = await storage.getSubtaskById(id);
      if (!subtask) {
        return res.status(404).json({ error: 'المهمة الفرعية غير موجودة' });
      }
      
      // Get parent task to check ownership
      const parentTask = await storage.getTaskById(subtask.taskId);
      if (!parentTask) {
        return res.status(404).json({ error: 'المهمة الأصلية غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (parentTask.createdById !== userId && parentTask.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه المهمة' });
        }
      }
      
      // Store old subtask snapshot before update
      const oldSubtask = { ...subtask };
      
      const updatedSubtask = await storage.updateSubtask(id, req.body);
      
      // Log activity with before/after values
      await storage.logTaskActivity({
        taskId: parentTask.id,
        userId,
        action: 'subtask_updated',
        changes: {
          field: 'multiple',
          oldValue: { ...oldSubtask },
          newValue: { ...updatedSubtask },
          description: `تم تحديث المهمة الفرعية: ${subtask.title}`,
        },
      });
      
      res.json(updatedSubtask);
    } catch (error: any) {
      console.error('Error updating subtask:', error);
      res.status(500).json({ error: 'فشل في تحديث المهمة الفرعية' });
    }
  });

  // PATCH /api/subtasks/:id/toggle - Toggle subtask completion
  app.patch("/api/subtasks/:id/toggle", taskLimiter, requireAuth, requireAnyPermission('tasks.edit_any', 'tasks.edit_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // Get subtask to find parent task
      const oldSubtask = await storage.getSubtaskById(id);
      if (!oldSubtask) {
        return res.status(404).json({ error: 'المهمة الفرعية غير موجودة' });
      }
      
      // Get parent task to check ownership
      const parentTask = await storage.getTaskById(oldSubtask.taskId);
      if (!parentTask) {
        return res.status(404).json({ error: 'المهمة الأصلية غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (parentTask.createdById !== userId && parentTask.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه المهمة' });
        }
      }
      
      const subtask = await storage.toggleSubtaskComplete(id, userId);
      
      // Log activity with before/after values
      await storage.logTaskActivity({
        taskId: parentTask.id,
        userId,
        action: 'subtask_toggled',
        changes: {
          field: 'completed',
          oldValue: { ...oldSubtask },
          newValue: { ...subtask },
          description: `تم ${subtask.isCompleted ? 'إكمال' : 'إلغاء إكمال'} المهمة الفرعية: ${subtask.title}`,
        },
      });
      
      res.json(subtask);
    } catch (error: any) {
      console.error('Error toggling subtask:', error);
      res.status(500).json({ error: 'فشل في تحديث حالة المهمة الفرعية' });
    }
  });

  // DELETE /api/subtasks/:id - Delete subtask
  app.delete("/api/subtasks/:id", taskLimiter, requireAuth, requireAnyPermission('tasks.edit_any', 'tasks.edit_own'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // Get subtask to find parent task
      const subtask = await storage.getSubtaskById(id);
      if (!subtask) {
        return res.status(404).json({ error: 'المهمة الفرعية غير موجودة' });
      }
      
      // Get parent task to check ownership
      const parentTask = await storage.getTaskById(subtask.taskId);
      if (!parentTask) {
        return res.status(404).json({ error: 'المهمة الأصلية غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (parentTask.createdById !== userId && parentTask.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه المهمة' });
        }
      }
      
      await storage.deleteSubtask(id);
      
      res.json({ success: true, message: 'تم حذف المهمة الفرعية بنجاح' });
    } catch (error: any) {
      console.error('Error deleting subtask:', error);
      res.status(500).json({ error: 'فشل في حذف المهمة الفرعية' });
    }
  });

  // GET /api/tasks/:id/comments - Get task comments
  app.get("/api/tasks/:id/comments", taskLimiter, requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const comments = await storage.getTaskComments(id);
      
      res.json(comments);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'فشل في جلب التعليقات' });
    }
  });

  // POST /api/tasks/:id/comments - Create comment
  app.post("/api/tasks/:id/comments", taskLimiter, requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // Get parent task to check ownership
      const parentTask = await storage.getTaskById(id);
      if (!parentTask) {
        return res.status(404).json({ error: 'المهمة غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.view_all')) {
        if (parentTask.createdById !== userId && parentTask.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بالتعليق على هذه المهمة' });
        }
      }
      
      const validatedData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: id,
        userId,
      });
      
      const comment = await storage.createTaskComment(validatedData);
      
      // Log activity
      await storage.logTaskActivity({
        taskId: id,
        userId,
        action: 'comment_added',
        changes: { description: 'تم إضافة تعليق' },
      });
      
      res.status(201).json(comment);
    } catch (error: any) {
      console.error('Error creating comment:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'بيانات غير صالحة' });
      }
      res.status(500).json({ error: 'فشل في إضافة التعليق' });
    }
  });

  // DELETE /api/task-comments/:id - Delete comment
  app.delete("/api/task-comments/:id", taskLimiter, requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // Get comment to find parent task
      const comment = await storage.getTaskCommentById(id);
      if (!comment) {
        return res.status(404).json({ error: 'التعليق غير موجود' });
      }
      
      // Get parent task to check ownership
      const parentTask = await storage.getTaskById(comment.taskId);
      if (!parentTask) {
        return res.status(404).json({ error: 'المهمة الأصلية غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (parentTask.createdById !== userId && parentTask.assignedToId !== userId && comment.userId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بحذف هذا التعليق' });
        }
      }
      
      await storage.deleteTaskComment(id);
      
      res.json({ success: true, message: 'تم حذف التعليق بنجاح' });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'فشل في حذف التعليق' });
    }
  });

  // GET /api/tasks/:id/attachments - Get task attachments
  app.get("/api/tasks/:id/attachments", taskLimiter, requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const attachments = await storage.getTaskAttachments(id);
      
      res.json(attachments);
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      res.status(500).json({ error: 'فشل في جلب المرفقات' });
    }
  });

  // POST /api/tasks/:id/attachments - Upload attachment
  app.post("/api/tasks/:id/attachments", taskLimiter, requireAuth, upload.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'لم يتم رفع ملف' });
      }
      
      // Get parent task to check ownership
      const parentTask = await storage.getTaskById(id);
      if (!parentTask) {
        return res.status(404).json({ error: 'المهمة غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (parentTask.createdById !== userId && parentTask.assignedToId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بإضافة مرفقات لهذه المهمة' });
        }
      }
      
      // TODO: Upload to object storage and get URL
      const fileUrl = `https://placeholder.com/${file.originalname}`;
      
      const validatedData = insertTaskAttachmentSchema.parse({
        taskId: id,
        userId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        fileType: file.mimetype,
      });
      
      const attachment = await storage.createTaskAttachment(validatedData);
      
      // Log activity
      await storage.logTaskActivity({
        taskId: id,
        userId,
        action: 'attachment_added',
        changes: { description: `تم رفع ملف: ${file.originalname}` },
      });
      
      res.status(201).json(attachment);
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      res.status(500).json({ error: 'فشل في رفع الملف' });
    }
  });

  // DELETE /api/task-attachments/:id - Delete attachment
  app.delete("/api/task-attachments/:id", taskLimiter, requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const userPermissions = await storage.getUserPermissions(userId);
      
      // Get attachment to find parent task
      const attachment = await storage.getTaskAttachmentById(id);
      if (!attachment) {
        return res.status(404).json({ error: 'المرفق غير موجود' });
      }
      
      // Get parent task to check ownership
      const parentTask = await storage.getTaskById(attachment.taskId);
      if (!parentTask) {
        return res.status(404).json({ error: 'المهمة الأصلية غير موجودة' });
      }
      
      // Check permissions
      if (!userPermissions.includes('tasks.edit_any')) {
        if (parentTask.createdById !== userId && parentTask.assignedToId !== userId && attachment.userId !== userId) {
          return res.status(403).json({ error: 'غير مصرح لك بحذف هذا المرفق' });
        }
      }
      
      await storage.deleteTaskAttachment(id);
      
      res.json({ success: true, message: 'تم حذف المرفق بنجاح' });
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ error: 'فشل في حذف المرفق' });
    }
  });

  // GET /api/tasks/:id/activity - Get task activity log
  app.get("/api/tasks/:id/activity", taskLimiter, requireAuth, async (req, res) => {
    try {
      const { id} = req.params;
      
      const activity = await storage.getTaskActivity(id);
      
      res.json(activity);
    } catch (error: any) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ error: 'فشل في جلب سجل النشاط' });
    }
  });

  // ============================================================
  // EMAIL AGENT ROUTES
  // ============================================================

  // Mount the email agent webhook routes
  app.use("/api/email-agent", emailAgentRoutes);

  // GET /api/email-agent/senders - List trusted senders (admin only)
  app.get("/api/email-agent/senders", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const senders = await storage.getTrustedSenders();
      res.json(senders);
    } catch (error: any) {
      console.error('Error fetching trusted senders:', error);
      res.status(500).json({ error: 'فشل في جلب المرسلين الموثوقين' });
    }
  });

  // POST /api/email-agent/senders - Add trusted sender (admin only)
  app.post("/api/email-agent/senders", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { email, name, language, autoPublish, reporterUserId, defaultCategory, status, token } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: 'البريد الإلكتروني والاسم مطلوبان' });
      }

      const existingSender = await storage.getTrustedSenderByEmail(email);
      if (existingSender) {
        return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
      }

      const finalToken = token || Array.from({ length: 32 }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');

      const sender = await storage.createTrustedSender({
        email,
        name,
        token: finalToken,
        status: status || 'active',
        language: language || 'ar',
        autoPublish: autoPublish !== false,
        reporterUserId: reporterUserId || undefined,
        defaultCategory: defaultCategory || undefined,
      }, userId);

      await logActivity({
        userId,
        action: 'email_sender_created',
        entityType: 'trusted_email_sender',
        entityId: sender.id,
      });

      res.status(201).json(sender);
    } catch (error: any) {
      console.error('Error creating trusted sender:', error);
      res.status(500).json({ error: 'فشل في إضافة المرسل الموثوق' });
    }
  });

  // PATCH /api/email-agent/senders/:id - Update sender (admin only)
  app.patch("/api/email-agent/senders/:id", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const updates = req.body;

      const sender = await storage.getTrustedSenderById(id);
      if (!sender) {
        return res.status(404).json({ error: 'المرسل غير موجود' });
      }

      const updated = await storage.updateTrustedSender(id, updates);

      await logActivity({
        userId,
        action: 'email_sender_updated',
        entityType: 'trusted_email_sender',
        entityId: id,
      });

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating trusted sender:', error);
      res.status(500).json({ error: 'فشل في تحديث المرسل الموثوق' });
    }
  });

  // DELETE /api/email-agent/senders/:id - Delete sender (admin only)
  app.delete("/api/email-agent/senders/:id", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;

      const sender = await storage.getTrustedSenderById(id);
      if (!sender) {
        return res.status(404).json({ error: 'المرسل غير موجود' });
      }

      await storage.deleteTrustedSender(id);

      await logActivity({
        userId,
        action: 'email_sender_deleted',
        entityType: 'trusted_email_sender',
        entityId: id,
      });

      res.json({ success: true, message: 'تم حذف المرسل الموثوق بنجاح' });
    } catch (error: any) {
      console.error('Error deleting trusted sender:', error);
      res.status(500).json({ error: 'فشل في حذف المرسل الموثوق' });
    }
  });

  // GET /api/email-agent/logs - List webhook logs (admin only)
  app.get("/api/email-agent/logs", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const { status, trustedSenderId, page = "1", limit = "50" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await storage.getEmailWebhookLogs({
        status: status as string,
        trustedSenderId: trustedSenderId as string,
        limit: limitNum,
        offset,
      });

      res.json({
        logs: result.logs,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      });
    } catch (error: any) {
      console.error('Error fetching email webhook logs:', error);
      res.status(500).json({ error: 'فشل في جلب سجلات البريد الإلكتروني' });
    }
  });

  // GET /api/email-agent/stats - Get daily statistics (admin only)
  app.get("/api/email-agent/stats", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      const stats = await storage.getEmailAgentStats(targetDate);

      res.json(stats || {
        date: targetDate,
        emailsReceived: 0,
        emailsPublished: 0,
        emailsDrafted: 0,
        emailsRejected: 0,
        emailsFailed: 0,
        arabicCount: 0,
        englishCount: 0,
        urduCount: 0,
      });
    } catch (error: any) {
      console.error('Error fetching email agent stats:', error);
      res.status(500).json({ error: 'فشل في جلب إحصائيات البريد الإلكتروني' });
    }
  });

  // DELETE /api/email-agent/logs/:id - Delete single webhook log (admin only)
  app.delete("/api/email-agent/logs/:id", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteEmailWebhookLog(id);
      
      res.json({ success: true, message: 'تم حذف السجل بنجاح' });
    } catch (error: any) {
      console.error('Error deleting webhook log:', error);
      res.status(500).json({ error: 'فشل في حذف السجل' });
    }
  });

  // POST /api/email-agent/logs/bulk-delete - Delete multiple webhook logs (admin only)
  app.post("/api/email-agent/logs/bulk-delete", requireAuth, requirePermission('admin.manage_settings'), async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'يجب تحديد معرفات السجلات للحذف' });
      }
      
      await storage.deleteEmailWebhookLogs(ids);
      
      res.json({ 
        success: true, 
        message: `تم حذف ${ids.length} سجل بنجاح`,
        deleted: ids.length
      });
    } catch (error: any) {
      console.error('Error bulk deleting webhook logs:', error);
      res.status(500).json({ error: 'فشل في حذف السجلات' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
