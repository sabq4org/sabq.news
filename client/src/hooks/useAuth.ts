// Reference: javascript_log_in_with_replit blueprint
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string; // Primary role (first role for backward compatibility)
  roles?: string[]; // All user roles from RBAC system
  firstName?: string;
  lastName?: string;
  isProfileComplete?: boolean;
  profileImageUrl?: string;
};

// Helper function to check if user has any of the specified roles
// Accepts any user object with role/roles properties
export function hasRole(user: { role?: string; roles?: string[] } | null | undefined, ...rolesToCheck: string[]): boolean {
  if (!user) return false;
  const userRoles = user.roles || [user.role].filter(Boolean);
  return rolesToCheck.some(roleToCheck => userRoles.includes(roleToCheck));
}

// Check if user is staff (has any role beyond reader)
export function isStaff(user: User | null | undefined): boolean {
  return hasRole(user, 'super_admin', 'admin', 'editor', 'reporter', 'opinion_author', 'moderator', 'content_creator');
}

// Role hierarchy for redirection priority (higher index = higher priority)
const ROLE_HIERARCHY = [
  'reader',           // 0 - lowest priority
  'content_creator',  // 1
  'moderator',        // 2
  'opinion_author',   // 3
  'reporter',         // 4
  'editor',           // 5
  'admin',            // 6
  'super_admin',      // 7 - highest priority
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

  const logout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    queryClient.clear();
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isError,
    isError,
    logout,
  };
}
