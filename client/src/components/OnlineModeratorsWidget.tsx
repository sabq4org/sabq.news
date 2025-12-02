import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, Circle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
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

export function OnlineModeratorsWidget() {
  const { data: moderators, isLoading } = useQuery<OnlineModerator[]>({
    queryKey: ["/api/admin/online-moderators"],
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const onlineModerators = moderators?.filter(m => m.isOnline) || [];
  const offlineModerators = moderators?.filter(m => !m.isOnline).slice(0, 5) || [];
  const allModerators = [...onlineModerators, ...offlineModerators];

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

  const getShortName = (mod: OnlineModerator) => {
    if (mod.firstName) {
      return mod.firstName;
    }
    return mod.email.split("@")[0].slice(0, 8);
  };

  const formatLastActivity = (lastActivityAt: string | null) => {
    if (!lastActivityAt) return "غير محدد";
    try {
      const date = new Date(lastActivityAt);
      const formattedDate = format(date, "dd/MM/yyyy", { locale: arSA });
      const formattedTime = format(date, "hh:mm a", { locale: arSA });
      const timeAgo = formatDistanceToNow(date, { locale: arSA, addSuffix: true });
      return `${formattedDate} - ${formattedTime}\n(${timeAgo})`;
    } catch {
      return "غير محدد";
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="card-online-moderators-loading">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المشرفون</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-online-moderators">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">المشرفون</CardTitle>
          {onlineModerators.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0" data-testid="badge-online-count">
              {onlineModerators.length} متصل
            </Badge>
          )}
        </div>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {allModerators.length === 0 ? (
          <div className="text-center py-3 text-muted-foreground text-sm" data-testid="text-no-moderators">
            لا يوجد مشرفون
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allModerators.map((mod) => (
              <Tooltip key={mod.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                      border cursor-default transition-colors
                      ${mod.isOnline 
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" 
                        : "bg-muted/50 border-border text-muted-foreground"
                      }
                    `}
                    data-testid={`moderator-${mod.isOnline ? 'online' : 'offline'}-${mod.id}`}
                  >
                    <Circle 
                      className={`h-2 w-2 ${
                        mod.isOnline 
                          ? "fill-green-500 text-green-500" 
                          : "fill-gray-400 text-gray-400"
                      }`}
                      data-testid={`indicator-${mod.isOnline ? 'online' : 'offline'}`}
                    />
                    <span className="max-w-[80px] truncate" data-testid={`text-name-${mod.id}`}>
                      {getShortName(mod)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="text-right"
                  data-testid={`tooltip-${mod.id}`}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{getDisplayName(mod)}</p>
                    <p className="text-xs text-muted-foreground">
                      {mod.jobTitle || roleLabels[mod.role] || mod.role}
                    </p>
                    <div className="border-t pt-1 mt-1">
                      <p className="text-xs">
                        {mod.isOnline ? (
                          <span className="text-green-600 dark:text-green-400">متصل الآن</span>
                        ) : (
                          <>
                            <span className="text-muted-foreground">آخر ظهور:</span>
                            <br />
                            <span className="whitespace-pre-line">{formatLastActivity(mod.lastActivityAt)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
