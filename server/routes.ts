// Reference: javascript_object_storage blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { getObjectAclPolicy } from "./objectAcl";
import { summarizeArticle, generateTitle } from "./openai";
import { importFromRssFeed } from "./rssImporter";
import { requireAuth, requirePermission, logActivity, getUserPermissions } from "./rbac";
import { db } from "./db";
import { eq, and, or, desc, ilike, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import passport from "passport";
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
        console.log("✅ Login successful:", user.email);
        res.json({ message: "تم تسجيل الدخول بنجاح", user: { id: user.id, email: user.email } });
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
          isProfileComplete: !!(firstName && lastName),
        })
        .returning();

      res.status(201).json({ 
        message: "تم إنشاء الحساب بنجاح", 
        user: { id: newUser.id, email: newUser.email } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "خطأ في إنشاء الحساب" });
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
      if (!req.isAuthenticated() || !req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's role from RBAC system
      const userRolesResult = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId))
        .limit(1);

      const role = userRolesResult.length > 0 ? userRolesResult[0].roleName : "reader";

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

      const parsed = insertArticleSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: parsed.error.flatten(),
        });
      }

      const [newArticle] = await db
        .insert(articles)
        .values({
          ...parsed.data,
          authorId,
        } as any)
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
        userId ? storage.getRecommendations(userId) : storage.getBreakingNews(6),
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

      const parsed = insertArticleSchema.safeParse({
        ...req.body,
        authorId: userId,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid article data", errors: parsed.error });
      }

      const article = await storage.createArticle(parsed.data);
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

      const updated = await storage.updateArticle(req.params.id, req.body);
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
      const articles = await storage.getArticles({ status: "published" });
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
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting article image:", error);
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

  // ============================================================
  // INTEREST & PERSONALIZATION ROUTES
  // ============================================================

  app.get("/api/interests", async (req, res) => {
    try {
      const interests = await storage.getAllInterests();
      res.json(interests);
    } catch (error) {
      console.error("Error fetching interests:", error);
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  });

  app.get("/api/user/interests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const interests = await storage.getUserInterests(userId);
      res.json(interests);
    } catch (error) {
      console.error("Error fetching user interests:", error);
      res.status(500).json({ message: "Failed to fetch user interests" });
    }
  });

  app.post("/api/user/interests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { interestIds } = req.body;

      if (!Array.isArray(interestIds) || interestIds.length < 3 || interestIds.length > 5) {
        return res.status(400).json({ 
          message: "يجب اختيار من 3 إلى 5 اهتمامات" 
        });
      }

      const allInterests = await storage.getAllInterests();
      const validInterestIds = allInterests.map(i => i.id);
      const invalidIds = interestIds.filter(id => !validInterestIds.includes(id));
      
      if (invalidIds.length > 0) {
        return res.status(400).json({ 
          message: "بعض الاهتمامات المحددة غير صحيحة" 
        });
      }

      await storage.setUserInterests(userId, interestIds);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting user interests:", error);
      res.status(500).json({ message: "Failed to set user interests" });
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

  const httpServer = createServer(app);
  return httpServer;
}
