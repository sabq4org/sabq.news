// Reference: javascript_object_storage blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { getObjectAclPolicy } from "./objectAcl";
import { summarizeArticle, generateTitle, chatWithAssistant, analyzeCredibility } from "./openai";
import { importFromRssFeed } from "./rssImporter";
import { requireAuth, requirePermission, requireRole, logActivity, getUserPermissions } from "./rbac";
import { createNotification } from "./notificationEngine";
import { notificationBus } from "./notificationBus";
import { sendArticleNotification } from "./notificationService";
import { vectorizeArticle } from "./embeddingsService";
import { trackUserEvent } from "./eventTrackingService";
import { db } from "./db";
import { eq, and, or, desc, ilike, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import passport from "passport";
import multer from "multer";
import { randomUUID } from "crypto";
import { 
  users, 
  roles, 
  userRoles, 
  articles, 
  categories, 
  comments,
  rssFeeds,
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
  tags,
  articleTags,
  recommendationLog,
  recommendationMetrics,
  userEvents,
  readingHistory,
} from "@shared/schema";
import {
  insertArticleSchema,
  updateArticleSchema,
  insertCategorySchema,
  insertCommentSchema,
  insertRssFeedSchema,
  updateUserSchema,
  adminUpdateUserSchema,
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
  app.post("/api/login", (req, res, next) => {
    console.log("🔐 Login attempt:", { email: req.body?.email, hasPassword: !!req.body?.password });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("❌ Login error:", err);
        return res.status(500).json({ message: "خطأ في الخادم" });
      }
      if (!user) {
        console.log("❌ Login failed:", info?.message);
        return res.status(401).json({ message: info?.message || "فشل تسجيل الدخول" });
      }
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

  // Register
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

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

      // Auto-login after registration
      req.logIn(newUser, (err) => {
        if (err) {
          console.error("❌ Session creation error after registration:", err);
          return res.status(500).json({ message: "تم إنشاء الحساب ولكن فشل تسجيل الدخول التلقائي" });
        }
        
        console.log("✅ User registered and logged in:", newUser.email);
        res.status(201).json({ 
          message: "تم إنشاء الحساب بنجاح", 
          user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName } 
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "خطأ في إنشاء الحساب" });
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

      // Get user's role from RBAC system, fallback to user.role from users table
      const userRolesResult = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId))
        .limit(1);

      // Use RBAC role if exists, otherwise use user.role from users table
      const role = userRolesResult.length > 0 
        ? userRolesResult[0].roleName 
        : (user.role || "reader");

      res.json({ ...user, role });
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

  app.post("/api/profile/upload-avatar", isAuthenticated, avatarUpload.single('avatar'), async (req: any, res) => {
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

      // Extract bucket ID from PRIVATE_OBJECT_DIR environment variable
      // Format: /objects/<bucket-id>/.private
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      const bucketId = privateObjectDir.split('/').filter(Boolean)[1];

      if (!bucketId) {
        throw new Error('Bucket ID not found in PRIVATE_OBJECT_DIR');
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const objectId = randomUUID();
      
      // Build object path (simple, no complex directory structure)
      const objectPath = `uploads/avatars/${objectId}.${fileExtension}`;

      console.log("[Avatar Upload] Uploading to bucket:", bucketId, "path:", objectPath);

      // Upload file directly to GCS with public access
      const { objectStorageClient } = await import('./objectStorage');
      const bucket = objectStorageClient.bucket(bucketId);
      const file = bucket.file(objectPath);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        predefinedAcl: 'publicRead', // Make it public directly
      });

      console.log("[Avatar Upload] File uploaded successfully with public access");

      // Build public URL manually
      const publicUrl = `https://storage.googleapis.com/${bucketId}/${objectPath}`;

      console.log("[Avatar Upload] Public URL:", publicUrl);

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
  // CATEGORY ROUTES (CMS Module 1)
  // ============================================================

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
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

      const articles = await storage.getArticles({ 
        categoryId: category.id,
        status: "published"
      });
      res.json(articles);
    } catch (error) {
      console.error("Error fetching category articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
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

  // ============================================================
  // USERS MANAGEMENT ROUTES
  // ============================================================

  // Get all roles (for admin dropdown)
  app.get("/api/roles", requireAuth, async (req: any, res) => {
    try {
      const allRoles = await db.select().from(roles).orderBy(roles.name);
      res.json(allRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Get all users with filtering (admin only)
  app.get("/api/admin/users", requireAuth, requirePermission("users.view"), async (req: any, res) => {
    try {
      const { search, roleId, status } = req.query;

      let query = db
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
        .$dynamic();

      // Apply filters
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          )
        );
      }
      if (roleId) {
        conditions.push(eq(roles.id, roleId));
      }
      if (status) {
        conditions.push(eq(users.status, status));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const userList = await query.orderBy(desc(users.createdAt));

      res.json(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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
          bio: users.bio,
          phoneNumber: users.phoneNumber,
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
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
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

      // Update user status if provided
      if (parsed.data.status !== undefined) {
        await db
          .update(users)
          .set({ status: parsed.data.status })
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
    } catch (error) {
      console.error("Error updating user:", error);
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

      query = query.orderBy(desc(articles.updatedAt));

      const results = await query;

      const formattedArticles = results.map((row) => ({
        ...row.article,
        category: row.category,
        author: row.author,
      }));

      res.json(formattedArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get article by ID for editing (admin only)
  app.get("/api/admin/articles/:id", requireAuth, requirePermission("articles.view"), async (req: any, res) => {
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

      res.json({
        ...result.article,
        category: result.category,
        author: result.author,
      });
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Create new article
  app.post("/api/admin/articles", requireAuth, requirePermission("articles.create"), async (req: any, res) => {
    try {
      const authorId = req.user?.id;
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

      // Add publishedAt automatically if status is published and publishedAt is not set
      const articleData: any = {
        ...parsed.data,
        authorId,
      };
      
      if (articleData.status === 'published' && !articleData.publishedAt) {
        articleData.publishedAt = new Date();
      }

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

      // If status is being changed to published, check publish permission
      if (parsed.data.status === "published" && existingArticle.status !== "published") {
        const canPublish = userPermissions.includes("articles.publish");
        if (!canPublish) {
          return res.status(403).json({ message: "You don't have permission to publish articles" });
        }
      }

      // Convert publishedAt string to Date if provided
      const updateData: any = { ...parsed.data };
      if (updateData.publishedAt) {
        updateData.publishedAt = new Date(updateData.publishedAt);
      }
      // Set publishedAt when publishing if not already set
      if (parsed.data.status === "published" && !existingArticle.publishedAt && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }
      // Convert empty categoryId to null
      if (updateData.categoryId === "") {
        updateData.categoryId = null;
      }

      const [updatedArticle] = await db
        .update(articles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, articleId))
        .returning();

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

  // ============================================================
  // HOMEPAGE ROUTE
  // ============================================================

  app.get("/api/homepage", async (req: any, res) => {
    try {
      const userId = req.user?.id;

      const [
        heroArticles,
        personalizedArticles,
        breakingNews,
        editorPicks,
        deepDiveArticles,
        trendingTopics,
      ] = await Promise.all([
        storage.getHeroArticles(),
        storage.getAllPublishedArticles(16),
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
  // AI INSIGHTS ROUTE
  // ============================================================

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
      const article = await storage.getArticleBySlug(req.params.slug, userId);

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

  app.get("/api/articles/:slug/comments", async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const comments = await storage.getCommentsByArticle(article.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.get("/api/articles/:slug/related", async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
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

  app.post("/api/articles/:id/react", isAuthenticated, async (req: any, res) => {
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
      }

      res.json(result);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  app.post("/api/articles/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await storage.toggleBookmark(req.params.id, userId);
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

  app.post("/api/articles/:slug/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const article = await storage.getArticleBySlug(req.params.slug);

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

      const article = await storage.getArticleById(req.params.id);

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

      // Send notifications if article is published
      console.log(`🔍 [DASHBOARD CREATE] Article created with status: ${article.status}`);
      console.log(`🔍 [DASHBOARD CREATE] Article ID: ${article.id}, Title: ${article.title}`);
      
      if (article.status === "published") {
        console.log(`🔔 [DASHBOARD CREATE] Article is PUBLISHED - sending notifications...`);
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
      } else {
        console.log(`⏸️ [DASHBOARD CREATE] Article is NOT published (status: ${article.status}) - skipping notifications`);
      }

      res.json(article);
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

      // Convert publishedAt from ISO string to Date if present
      const articleData = { ...req.body };
      if (articleData.publishedAt && typeof articleData.publishedAt === 'string') {
        articleData.publishedAt = new Date(articleData.publishedAt);
      }

      const updated = await storage.updateArticle(req.params.id, articleData);

      // Trigger notification if article was just published
      console.log(`🔍 [DASHBOARD UPDATE] Article updated - Old status: ${article.status}, New status: ${updated.status}`);
      console.log(`🔍 [DASHBOARD UPDATE] Article ID: ${updated.id}, Title: ${updated.title}`);
      
      if (updated.status === "published" && article.status !== "published") {
        console.log(`🔔 [DASHBOARD UPDATE] Status changed to PUBLISHED - sending notifications...`);
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
        } catch (notificationError) {
          console.error("❌ [DASHBOARD UPDATE] Error creating notification:", notificationError);
          // Don't fail the update operation if notification fails
        }
      } else {
        console.log(`⏸️ [DASHBOARD UPDATE] No notification sent - Status unchanged or not published`);
      }

      res.json(updated);
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

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const titles = await generateTitle(content);
      res.json({ titles });
    } catch (error) {
      console.error("Error generating titles:", error);
      res.status(500).json({ message: "Failed to generate titles" });
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

  // AI Chat Assistant (Public)
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
          categoryNameAr: categories.nameAr,
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(eq(articles.status, "published"))
        .orderBy(desc(articles.publishedAt))
        .limit(10);

      const articlesForContext = recentArticles.map(article => ({
        title: article.title,
        summary: article.summary || undefined,
        categoryNameAr: article.categoryNameAr || undefined,
      }));

      const aiResponse = await chatWithAssistant(message, articlesForContext);
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "فشل في معالجة الرسالة" });
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


  app.post("/api/behavior/log", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
        "interest_update"
      ];

      if (!eventType || !validEventTypes.includes(eventType)) {
        return res.status(400).json({ 
          message: "Invalid eventType" 
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

      // إضافة نقاط ولاء بناءً على نوع السلوك
      try {
        let loyaltyPoints = 0;
        let action = "";
        
        const meta = sanitizedMetadata as Record<string, any>;
        
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

  app.get("/api/themes/active", async (req, res) => {
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
      
      const notifications = await db
        .select()
        .from(notificationsInbox)
        .where(eq(notificationsInbox.userId, userId))
        .orderBy(desc(notificationsInbox.createdAt))
        .limit(limit);

      // Get unread count
      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notificationsInbox)
        .where(
          and(
            eq(notificationsInbox.userId, userId),
            eq(notificationsInbox.read, false)
          )
        );

      res.json({
        notifications,
        unreadCount: Number(unreadResult?.count || 0),
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
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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

  // Get personalized recommendations for user
  app.get("/api/recommendations/personalized", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const { getPersonalizedRecommendations } = await import('./similarityEngine');
      const recommendations = await getPersonalizedRecommendations(userId, limit);

      res.json({ recommendations });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "فشل في جلب التوصيات" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
