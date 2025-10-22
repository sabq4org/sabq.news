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
  if (!user) {
    console.log('🔴 hasRole: user is null/undefined');
    return false;
  }
  const userRoles = user.roles || [user.role].filter(Boolean);
  const result = rolesToCheck.some(roleToCheck => userRoles.includes(roleToCheck));
  
  console.log('🔍 hasRole check:', {
    userEmail: (user as any).email,
    userRoles,
    rolesToCheck,
    result
  });
  
  return result;
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
