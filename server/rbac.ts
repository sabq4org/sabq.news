// RBAC (Role-Based Access Control) middleware and utilities
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, roles, permissions, rolePermissions, userRoles } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Type definitions
export type PermissionCode = string; // e.g., "articles.create"

// Check if a user has a specific permission using efficient JOIN
export async function userHasPermission(
  userId: string,
  permissionCode: PermissionCode
): Promise<boolean> {
  try {
    // Use a single JOIN query to check permission
    const result = await db
      .select({ permissionCode: permissions.code })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(permissions.code, permissionCode)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

// Get all permissions for a user using efficient JOIN
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    // Use a single JOIN query to get all permissions
    const result = await db
      .select({ permissionCode: permissions.code })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    // Remove duplicates and return permission codes
    const uniquePermissions = Array.from(new Set(result.map(r => r.permissionCode)));
    return uniquePermissions;
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

// Middleware: Require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Middleware: Require specific permission
export function requirePermission(permissionCode: PermissionCode) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hasPermission = await userHasPermission(userId, permissionCode);

    if (!hasPermission) {
      return res.status(403).json({ 
        message: "Forbidden - Insufficient permissions",
        required: permissionCode 
      });
    }

    next();
  };
}

// Middleware: Require one of multiple permissions (OR logic)
export function requireAnyPermission(...permissionCodes: PermissionCode[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has any of the required permissions
    const checks = await Promise.all(
      permissionCodes.map(code => userHasPermission(userId, code))
    );

    const hasAnyPermission = checks.some(result => result === true);

    if (!hasAnyPermission) {
      return res.status(403).json({ 
        message: "Forbidden - Insufficient permissions",
        required: permissionCodes 
      });
    }

    next();
  };
}

// Middleware: Require all permissions (AND logic)
export function requireAllPermissions(...permissionCodes: PermissionCode[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has all required permissions
    const checks = await Promise.all(
      permissionCodes.map(code => userHasPermission(userId, code))
    );

    const hasAllPermissions = checks.every(result => result === true);

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        message: "Forbidden - Insufficient permissions",
        required: permissionCodes 
      });
    }

    next();
  };
}

// Middleware: Require specific role(s)
export function requireRole(...roleNames: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user's roles from RBAC system
    const userRolesResult = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const userRoleNames = userRolesResult.map(r => r.roleName);

    // Fallback: Check user.role from users table if no RBAC roles
    if (userRoleNames.length === 0) {
      const { users } = await import("@shared/schema");
      const [user] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (user?.role) {
        userRoleNames.push(user.role);
      }
    }

    // Check if user has any of the required roles
    const hasRole = roleNames.some(roleName => userRoleNames.includes(roleName));

    if (!hasRole) {
      return res.status(403).json({ 
        message: "Forbidden - Insufficient permissions",
        required: roleNames 
      });
    }

    next();
  };
}

// Helper: Log activity to activity_logs table
export async function logActivity(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    reason?: string;
  };
}) {
  const { activityLogs } = await import("@shared/schema");
  
  try {
    await db.insert(activityLogs).values({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue || null,
      newValue: params.newValue || null,
      metadata: params.metadata || null,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
