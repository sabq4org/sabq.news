// Reference: javascript_log_in_with_replit blueprint
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string; // Primary role (first role for backward compatibility)
  roles?: string[]; // All user roles from RBAC system
  firstName?: string;
  lastName?: string;
  isProfileComplete?: boolean;
};

// Helper function to check if user has any of the specified roles
// Accepts any user object with role/roles properties
export function hasRole(user: { role?: string; roles?: string[] } | null | undefined, ...rolesToCheck: string[]): boolean {
  if (!user) return false;
  const userRoles = user.roles || [user.role].filter(Boolean);
  return rolesToCheck.some(roleToCheck => userRoles.includes(roleToCheck));
}

// Check if user is staff (has any role beyond reader)
// This checks both predefined roles and any RBAC role that isn't 'reader'
export function isStaff(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check for predefined staff roles
  const predefinedStaffRoles = [
    'super_admin', 'superadmin', 'admin', 'system_admin',
    'editor', 'chief_editor', 'reporter', 'writer',
    'opinion_author', 'moderator', 'content_creator', 
    'comments_moderator', 'content_manager', 'publisher'
  ];
  
  if (hasRole(user, ...predefinedStaffRoles)) {
    return true;
  }
  
  // If user has ANY RBAC role(s) beyond just 'reader', consider them staff
  // This allows custom roles created through the RBAC system to access dashboard
  const userRoles = user.roles || [user.role].filter(Boolean);
  const nonReaderRoles = userRoles.filter(role => role && role !== 'reader');
  
  return nonReaderRoles.length > 0;
}

// Role hierarchy for redirection priority (higher index = higher priority)
const ROLE_HIERARCHY = [
  'reader',             // 0 - lowest priority
  'content_creator',    // 1
  'comments_moderator', // 2 - مشرف التعليقات
  'moderator',          // 3
  'opinion_author',     // 4
  'reporter',           // 5
  'editor',             // 6
  'admin',              // 7
  'super_admin',        // 8 - highest priority
];

// Get the highest role based on hierarchy
export function getHighestRole(user: User | null | undefined): string {
  if (!user) return 'reader';
  
  const userRoles = user.roles || [user.role].filter(Boolean);
  let highestRole = 'reader';
  let highestPriority = -1;

  for (const role of userRoles) {
    if (!role) continue;
    const priority = ROLE_HIERARCHY.indexOf(role);
    if (priority > highestPriority) {
      highestPriority = priority;
      highestRole = role;
    }
  }

  return highestRole;
}

// Get default redirect path based on user's highest role
export function getDefaultRedirectPath(user: User | null | undefined): string {
  if (!user) return '/';
  
  // Comments moderator goes directly to AI moderation dashboard
  if (hasRole(user, 'comments_moderator')) {
    return '/dashboard/ai-moderation';
  }
  
  // Staff members go to dashboard
  if (isStaff(user)) {
    return '/dashboard';
  }
  
  // Regular readers go to home
  return '/';
}

export function useAuth(options?: { redirectToLogin?: boolean }) {
  const redirectToLogin = options?.redirectToLogin ?? false;

  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (redirectToLogin && !isLoading && (isError || !user)) {
      window.location.href = "/login";
    }
  }, [user, isLoading, isError, redirectToLogin]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isError,
    isError,
  };
}
