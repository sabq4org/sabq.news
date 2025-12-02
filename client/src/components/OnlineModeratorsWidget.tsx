import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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

  const formatLastActivity = (lastActivityAt: string | null) => {
    if (!lastActivityAt) return "غير محدد";
    try {
      return formatDistanceToNow(new Date(lastActivityAt), { locale: arSA, addSuffix: true });
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
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-online-moderators">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">المشرفون المتصلون</CardTitle>
        <div className="flex items-center gap-2">
          {onlineModerators.length > 0 && (
            <Badge variant="secondary" className="text-xs" data-testid="badge-online-count">
              {onlineModerators.length} متصل
            </Badge>
          )}
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {onlineModerators.length === 0 && offlineModerators.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground" data-testid="text-no-moderators">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا يوجد مشرفون متصلون</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-1">
              {/* Online Moderators */}
              {onlineModerators.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover-elevate"
                  data-testid={`moderator-online-${mod.id}`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mod.profileImageUrl || undefined} alt={getDisplayName(mod)} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(mod.firstName, mod.lastName, mod.email)}
                      </AvatarFallback>
                    </Avatar>
                    <Circle 
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-green-500 text-green-500 bg-background rounded-full"
                      data-testid="indicator-online"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-name-${mod.id}`}>
                      {getDisplayName(mod)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mod.jobTitle || roleLabels[mod.role] || mod.role}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 shrink-0">
                    متصل
                  </Badge>
                </div>
              ))}

              {/* Separator if both online and offline exist */}
              {onlineModerators.length > 0 && offlineModerators.length > 0 && (
                <div className="border-t my-2" />
              )}

              {/* Offline Moderators */}
              {offlineModerators.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 p-2 rounded-lg opacity-60 hover:opacity-80 transition-opacity"
                  data-testid={`moderator-offline-${mod.id}`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mod.profileImageUrl || undefined} alt={getDisplayName(mod)} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                        {getInitials(mod.firstName, mod.lastName, mod.email)}
                      </AvatarFallback>
                    </Avatar>
                    <Circle 
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-gray-400 text-gray-400 bg-background rounded-full"
                      data-testid="indicator-offline"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-muted-foreground" data-testid={`text-name-${mod.id}`}>
                      {getDisplayName(mod)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatLastActivity(mod.lastActivityAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
