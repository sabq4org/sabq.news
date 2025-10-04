// Reference: javascript_log_in_with_replit blueprint
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  isProfileComplete?: boolean;
};

export function useAuth(options?: { redirectToLogin?: boolean }) {
  const redirectToLogin = options?.redirectToLogin ?? false;

  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (redirectToLogin && !isLoading && (isError || !user)) {
      window.location.href = "/api/login";
    }
  }, [user, isLoading, isError, redirectToLogin]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isError,
    isError,
  };
}
