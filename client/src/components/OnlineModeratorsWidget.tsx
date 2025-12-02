import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Circle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { useEffect, useState } from "react";

interface OnlineModerator {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  jobTitle: string | null;
  lastActivityAt: string | null;
  isOnline: boolean;
}

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  superadmin: "المدير العام",
  editor: "محرر",
  chief_editor: "رئيس التحرير",
  moderator: "مشرف",
  system_admin: "مدير تقني",
  reporter: "مراسل",
  comments_moderator: "مشرف التعليقات",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  superadmin: "bg-red-500/10 text-red-600 dark:text-red-400",
  editor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  chief_editor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  moderator: "bg-green-500/10 text-green-600 dark:text-green-400",
  system_admin: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  reporter: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  comments_moderator: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export function OnlineModeratorsWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: moderators, isLoading } = useQuery<OnlineModerator[]>({
    queryKey: ["/api/admin/online-moderators"],
    refetchInterval: 30000,
    staleTime: 15000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const onlineModerators = moderators?.filter(m => m.isOnline) || [];
  const offlineModerators = moderators?.filter(m => !m.isOnline).slice(0, 3) || [];

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (mod: OnlineModerator) => {
    if (mod.firstName && mod.lastName) {
      return `${mod.firstName} ${mod.lastName}`;
    }
    if (mod.firstName) {
      return mod.firstName;
    }
    return mod.email.split("@")[0];
  };

  const getTimeSinceLogin = (lastActivityAt: string | null) => {
    if (!lastActivityAt) return "غير محدد";
    try {
      return formatDistanceToNow(new Date(lastActivityAt), { 
        locale: arSA, 
        addSuffix: true 
      });
    } catch {
      return "غير محدد";
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="card-online-moderators-loading">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المشرفون المتصلون</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-online-moderators">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">المشرفون المتصلون</CardTitle>
          {onlineModerators.length > 0 && (
            <Badge variant="secondary" className="text-xs" data-testid="badge-online-count">
              {onlineModerators.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">مباشر</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {onlineModerators.length === 0 && offlineModerators.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm" data-testid="text-no-moderators">
            لا يوجد مشرفون متصلون حالياً
          </div>
        ) : (
          <>
            {onlineModerators.map((mod) => (
              <div 
                key={mod.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30"
                data-testid={`moderator-online-${mod.id}`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-green-500">
                    <AvatarImage src={mod.profileImageUrl || undefined} alt={getDisplayName(mod)} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(mod.firstName, mod.lastName, mod.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Circle 
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500 border-2 border-background rounded-full" 
                    data-testid="indicator-online"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate" data-testid={`text-name-${mod.id}`}>
                      {getDisplayName(mod)}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${roleColors[mod.role] || ""}`}
                      data-testid={`badge-role-${mod.id}`}
                    >
                      {mod.jobTitle || roleLabels[mod.role] || mod.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span data-testid={`text-time-${mod.id}`}>
                      نشط {getTimeSinceLogin(mod.lastActivityAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {offlineModerators.length > 0 && onlineModerators.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-muted-foreground mb-2">آخر نشاط</p>
              </div>
            )}

            {offlineModerators.map((mod) => (
              <div 
                key={mod.id} 
                className="flex items-center gap-3 p-2 rounded-lg opacity-60"
                data-testid={`moderator-offline-${mod.id}`}
              >
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={mod.profileImageUrl || undefined} alt={getDisplayName(mod)} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      {getInitials(mod.firstName, mod.lastName, mod.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Circle 
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-gray-400 text-gray-400 border-2 border-background rounded-full" 
                    data-testid="indicator-offline"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" data-testid={`text-name-${mod.id}`}>
                    {getDisplayName(mod)}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-time-${mod.id}`}>
                    {getTimeSinceLogin(mod.lastActivityAt)}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
