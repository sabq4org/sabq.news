import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, hasRole, isStaff } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
  requireRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireStaff = false,
  requireRoles = [],
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      setLocation(redirectTo);
      return;
    }

    // Check staff requirement
    if (requireStaff && !isStaff(user)) {
      setLocation("/");
      return;
    }

    // Check specific role requirements
    if (requireRoles.length > 0 && !hasRole(user, ...requireRoles)) {
      setLocation("/");
      return;
    }
  }, [user, isLoading, isAuthenticated, requireStaff, requireRoles, redirectTo, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - don't render children
  if (!isAuthenticated || !user) {
    return null;
  }

  // Staff check failed
  if (requireStaff && !isStaff(user)) {
    return null;
  }

  // Role check failed
  if (requireRoles.length > 0 && !hasRole(user, ...requireRoles)) {
    return null;
  }

  // All checks passed - render children
  return <>{children}</>;
}
