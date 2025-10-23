// RBAC Constants - Roles and Permissions Definitions
// هذا الملف يحتوي على تعريفات الأدوار والصلاحيات المستخدمة في النظام

export const ROLE_NAMES = {
  SYSTEM_ADMIN: "system_admin",
  ADMIN: "admin",
  EDITOR: "editor",
  REPORTER: "reporter",
  COMMENTS_MODERATOR: "comments_moderator",
  MEDIA_MANAGER: "media_manager",
  READER: "reader",
} as const;

export const ROLE_LABELS_AR = {
  [ROLE_NAMES.SYSTEM_ADMIN]: "مدير النظام",
  [ROLE_NAMES.ADMIN]: "مسؤول",
  [ROLE_NAMES.EDITOR]: "محرر",
  [ROLE_NAMES.REPORTER]: "مراسل",
  [ROLE_NAMES.COMMENTS_MODERATOR]: "مشرف تعليقات",
  [ROLE_NAMES.MEDIA_MANAGER]: "مدير وسائط",
  [ROLE_NAMES.READER]: "قارئ",
} as const;

export const ROLE_LABELS_EN = {
  [ROLE_NAMES.SYSTEM_ADMIN]: "System Admin",
  [ROLE_NAMES.ADMIN]: "Admin",
  [ROLE_NAMES.EDITOR]: "Editor",
  [ROLE_NAMES.REPORTER]: "Reporter",
  [ROLE_NAMES.COMMENTS_MODERATOR]: "Comments Moderator",
  [ROLE_NAMES.MEDIA_MANAGER]: "Media Manager",
  [ROLE_NAMES.READER]: "Reader",
} as const;

export const ROLE_DESCRIPTIONS_AR = {
  [ROLE_NAMES.SYSTEM_ADMIN]: "صلاحيات كاملة على النظام",
  [ROLE_NAMES.ADMIN]: "إدارة المستخدمين والموافقات التحريرية والإعدادات العامة",
  [ROLE_NAMES.EDITOR]: "إنشاء وتحرير ونشر المحتوى وإدارة الوسائط والتصنيفات",
  [ROLE_NAMES.REPORTER]: "إنشاء وتحرير المقالات الخاصة فقط دون صلاحيات النشر، مع إمكانية رفع الوسائط ومتابعة التعليقات والإحصائيات على مقالاته",
  [ROLE_NAMES.COMMENTS_MODERATOR]: "إدارة التعليقات: الموافقة والرفض والحظر",
  [ROLE_NAMES.MEDIA_MANAGER]: "إدارة المكتبة الإعلامية والألبومات",
  [ROLE_NAMES.READER]: "مستخدم عادي بدون صلاحيات تحريرية",
} as const;

// Permission codes mapping to roles
export const PERMISSION_CODES = {
  // Articles
  ARTICLES_VIEW: "articles.view",
  ARTICLES_CREATE: "articles.create",
  ARTICLES_EDIT_OWN: "articles.edit_own",
  ARTICLES_EDIT_ANY: "articles.edit_any",
  ARTICLES_PUBLISH: "articles.publish",
  ARTICLES_UNPUBLISH: "articles.unpublish",
  ARTICLES_DELETE: "articles.delete",
  ARTICLES_ARCHIVE: "articles.archive",
  ARTICLES_FEATURE: "articles.feature",

  // Categories
  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",

  // Users
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_SUSPEND: "users.suspend",
  USERS_BAN: "users.ban",
  USERS_CHANGE_ROLE: "users.change_role",

  // Comments
  COMMENTS_VIEW: "comments.view",
  COMMENTS_VIEW_OWN: "comments.view_own",
  COMMENTS_CREATE: "comments.create",
  COMMENTS_APPROVE: "comments.approve",
  COMMENTS_REJECT: "comments.reject",
  COMMENTS_DELETE: "comments.delete",
  COMMENTS_BAN_USER: "comments.ban_user",

  // Media
  MEDIA_VIEW: "media.view",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_EDIT: "media.edit",
  MEDIA_DELETE: "media.delete",

  // Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",

  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_VIEW_OWN: "analytics.view_own",
  
  // Tags
  TAGS_VIEW: "tags.view",
  TAGS_CREATE: "tags.create",
  TAGS_UPDATE: "tags.update",
  TAGS_DELETE: "tags.delete",
  
  // System
  SYSTEM_VIEW_AUDIT: "system.view_audit",
} as const;

// Role to permissions mapping (for UI display)
export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  [ROLE_NAMES.SYSTEM_ADMIN]: ["*"], // All permissions
  
  [ROLE_NAMES.ADMIN]: [
    PERMISSION_CODES.USERS_VIEW,
    PERMISSION_CODES.USERS_CREATE,
    PERMISSION_CODES.USERS_UPDATE,
    PERMISSION_CODES.USERS_DELETE,
    PERMISSION_CODES.USERS_SUSPEND,
    PERMISSION_CODES.USERS_BAN,
    PERMISSION_CODES.USERS_CHANGE_ROLE,
    PERMISSION_CODES.ARTICLES_VIEW,
    PERMISSION_CODES.ARTICLES_PUBLISH,
    PERMISSION_CODES.ARTICLES_EDIT_ANY,
    PERMISSION_CODES.ARTICLES_DELETE,
    PERMISSION_CODES.COMMENTS_VIEW,
    PERMISSION_CODES.COMMENTS_APPROVE,
    PERMISSION_CODES.MEDIA_VIEW,
    PERMISSION_CODES.MEDIA_UPLOAD,
    PERMISSION_CODES.SETTINGS_VIEW,
    PERMISSION_CODES.SETTINGS_UPDATE,
    PERMISSION_CODES.ANALYTICS_VIEW,
    PERMISSION_CODES.SYSTEM_VIEW_AUDIT,
  ],
  
  [ROLE_NAMES.EDITOR]: [
    PERMISSION_CODES.ARTICLES_VIEW,
    PERMISSION_CODES.ARTICLES_CREATE,
    PERMISSION_CODES.ARTICLES_EDIT_ANY,
    PERMISSION_CODES.ARTICLES_PUBLISH,
    PERMISSION_CODES.ARTICLES_UNPUBLISH,
    PERMISSION_CODES.ARTICLES_FEATURE,
    PERMISSION_CODES.MEDIA_VIEW,
    PERMISSION_CODES.MEDIA_UPLOAD,
    PERMISSION_CODES.MEDIA_EDIT,
    PERMISSION_CODES.CATEGORIES_VIEW,
    PERMISSION_CODES.CATEGORIES_CREATE,
    PERMISSION_CODES.CATEGORIES_UPDATE,
    PERMISSION_CODES.ANALYTICS_VIEW,
  ],
  
  [ROLE_NAMES.REPORTER]: [
    PERMISSION_CODES.ARTICLES_VIEW,
    PERMISSION_CODES.ARTICLES_CREATE,
    PERMISSION_CODES.ARTICLES_EDIT_OWN,
    PERMISSION_CODES.MEDIA_VIEW,
    PERMISSION_CODES.MEDIA_UPLOAD,
    PERMISSION_CODES.COMMENTS_VIEW_OWN, // عرض التعليقات على مقالاته فقط
    PERMISSION_CODES.ANALYTICS_VIEW_OWN, // عرض إحصائيات مقالاته فقط
  ],
  
  [ROLE_NAMES.COMMENTS_MODERATOR]: [
    PERMISSION_CODES.COMMENTS_VIEW,
    PERMISSION_CODES.COMMENTS_APPROVE,
    PERMISSION_CODES.COMMENTS_REJECT,
    PERMISSION_CODES.COMMENTS_DELETE,
    PERMISSION_CODES.COMMENTS_BAN_USER,
  ],
  
  [ROLE_NAMES.MEDIA_MANAGER]: [
    PERMISSION_CODES.MEDIA_VIEW,
    PERMISSION_CODES.MEDIA_UPLOAD,
    PERMISSION_CODES.MEDIA_EDIT,
    PERMISSION_CODES.MEDIA_DELETE,
  ],
  
  [ROLE_NAMES.READER]: [],
};

// Permission labels in Arabic for UI display
export const PERMISSION_LABELS_AR: Record<string, string> = {
  [PERMISSION_CODES.ARTICLES_VIEW]: "عرض المقالات",
  [PERMISSION_CODES.ARTICLES_CREATE]: "إنشاء المقالات",
  [PERMISSION_CODES.ARTICLES_EDIT_OWN]: "تعديل المقالات الخاصة",
  [PERMISSION_CODES.ARTICLES_EDIT_ANY]: "تعديل أي مقال",
  [PERMISSION_CODES.ARTICLES_PUBLISH]: "نشر المقالات",
  [PERMISSION_CODES.ARTICLES_UNPUBLISH]: "إلغاء نشر المقالات",
  [PERMISSION_CODES.ARTICLES_DELETE]: "حذف المقالات",
  [PERMISSION_CODES.ARTICLES_ARCHIVE]: "أرشفة المقالات",
  [PERMISSION_CODES.ARTICLES_FEATURE]: "تمييز المقالات",

  [PERMISSION_CODES.CATEGORIES_VIEW]: "عرض التصنيفات",
  [PERMISSION_CODES.CATEGORIES_CREATE]: "إنشاء التصنيفات",
  [PERMISSION_CODES.CATEGORIES_UPDATE]: "تعديل التصنيفات",
  [PERMISSION_CODES.CATEGORIES_DELETE]: "حذف التصنيفات",

  [PERMISSION_CODES.USERS_VIEW]: "عرض المستخدمين",
  [PERMISSION_CODES.USERS_CREATE]: "إنشاء المستخدمين",
  [PERMISSION_CODES.USERS_UPDATE]: "تعديل المستخدمين",
  [PERMISSION_CODES.USERS_DELETE]: "حذف المستخدمين",
  [PERMISSION_CODES.USERS_SUSPEND]: "تعليق المستخدمين",
  [PERMISSION_CODES.USERS_BAN]: "حظر المستخدمين",
  [PERMISSION_CODES.USERS_CHANGE_ROLE]: "تغيير أدوار المستخدمين",

  [PERMISSION_CODES.COMMENTS_VIEW]: "عرض جميع التعليقات",
  [PERMISSION_CODES.COMMENTS_VIEW_OWN]: "عرض التعليقات على مقالاتي",
  [PERMISSION_CODES.COMMENTS_CREATE]: "إنشاء التعليقات",
  [PERMISSION_CODES.COMMENTS_APPROVE]: "الموافقة على التعليقات",
  [PERMISSION_CODES.COMMENTS_REJECT]: "رفض التعليقات",
  [PERMISSION_CODES.COMMENTS_DELETE]: "حذف التعليقات",
  [PERMISSION_CODES.COMMENTS_BAN_USER]: "حظر المستخدمين من التعليق",

  [PERMISSION_CODES.MEDIA_VIEW]: "عرض الوسائط",
  [PERMISSION_CODES.MEDIA_UPLOAD]: "رفع الوسائط",
  [PERMISSION_CODES.MEDIA_EDIT]: "تعديل الوسائط",
  [PERMISSION_CODES.MEDIA_DELETE]: "حذف الوسائط",

  [PERMISSION_CODES.SETTINGS_VIEW]: "عرض الإعدادات",
  [PERMISSION_CODES.SETTINGS_UPDATE]: "تحديث الإعدادات",

  [PERMISSION_CODES.ANALYTICS_VIEW]: "عرض جميع التحليلات",
  [PERMISSION_CODES.ANALYTICS_VIEW_OWN]: "عرض التحليلات الخاصة",

  [PERMISSION_CODES.TAGS_VIEW]: "عرض الوسوم",
  [PERMISSION_CODES.TAGS_CREATE]: "إنشاء الوسوم",
  [PERMISSION_CODES.TAGS_UPDATE]: "تعديل الوسوم",
  [PERMISSION_CODES.TAGS_DELETE]: "حذف الوسوم",
  
  [PERMISSION_CODES.SYSTEM_VIEW_AUDIT]: "عرض سجلات النشاط",
};

// Helper function to get all permissions for given roles
export function getPermissionsForRoles(roleNames: string[]): string[] {
  const allPermissions = new Set<string>();
  
  for (const roleName of roleNames) {
    const permissions = ROLE_PERMISSIONS_MAP[roleName] || [];
    
    // If role has wildcard (*), return all permissions
    if (permissions.includes("*")) {
      return Object.values(PERMISSION_CODES);
    }
    
    permissions.forEach(p => allPermissions.add(p));
  }
  
  return Array.from(allPermissions);
}

// Helper function to check if a role can be assigned by another role
export function canAssignRole(assignerRole: string, targetRole: string): boolean {
  // System admin can assign any role
  if (assignerRole === ROLE_NAMES.SYSTEM_ADMIN) {
    return true;
  }
  
  // Admin can assign any role except system_admin
  if (assignerRole === ROLE_NAMES.ADMIN) {
    return targetRole !== ROLE_NAMES.SYSTEM_ADMIN;
  }
  
  // Other roles cannot assign roles
  return false;
}

// Activity log action types
export const ACTIVITY_ACTIONS = {
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  ROLES_UPDATED: "roles_updated",
  STATUS_UPDATED: "status_updated",
  PASSWORD_RESET: "password_reset",
} as const;

export const ACTIVITY_LABELS_AR: Record<string, string> = {
  [ACTIVITY_ACTIONS.USER_CREATED]: "إنشاء مستخدم",
  [ACTIVITY_ACTIONS.USER_UPDATED]: "تحديث مستخدم",
  [ACTIVITY_ACTIONS.USER_DELETED]: "حذف مستخدم",
  [ACTIVITY_ACTIONS.ROLES_UPDATED]: "تحديث الأدوار",
  [ACTIVITY_ACTIONS.STATUS_UPDATED]: "تحديث الحالة",
  [ACTIVITY_ACTIONS.PASSWORD_RESET]: "إعادة تعيين كلمة المرور",
};
