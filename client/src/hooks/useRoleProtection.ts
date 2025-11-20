import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useRoleProtection(requiredRole: string) {
  const { data: user, isLoading } = useQuery({ 
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== requiredRole)) {
      toast({ 
        variant: "destructive",
        title: "غير مصرح", 
        description: "ليس لديك صلاحية لعرض هذه الصفحة" 
      });
      navigate('/');
    }
  }, [user, isLoading, requiredRole, navigate, toast]);

  return { user, isLoading };
}
