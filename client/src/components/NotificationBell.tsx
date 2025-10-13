import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, AlertCircle, Star, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  deeplink: string | null;
  read: boolean;
  metadata: {
    articleId?: string;
    imageUrl?: string;
  } | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ["/api/me/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/me/notifications?limit=20", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
  });

  // SSE connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    console.log("📡 Connecting to notification stream...");

    const eventSource = new EventSource("/api/notifications/stream", {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log("📡 SSE connection established");
    };

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log("📩 New notification received:", notification);

        // Invalidate queries to refresh notifications
        queryClient.invalidateQueries({ queryKey: ["/api/me/notifications"] });

        // Show toast for breaking news only
        if (notification.type === "BreakingNews") {
          toast({
            title: notification.title,
            description: notification.body,
            variant: "destructive",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("📡 SSE connection error:", error);
      eventSource.close();
      
      // Retry connection after 5 seconds
      setTimeout(() => {
        console.log("📡 Retrying SSE connection...");
        if (eventSourceRef.current === eventSource) {
          const newEventSource = new EventSource("/api/notifications/stream", {
            withCredentials: true,
          });
          eventSourceRef.current = newEventSource;
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;

    return () => {
      console.log("📡 Closing SSE connection");
      eventSource.close();
    };
  }, [user, toast]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/me/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/me/notifications/read-all", {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    setOpen(false);
  };

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96"
        align="end"
        data-testid="popover-notifications"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" data-testid="text-notifications-title">
            الإشعارات
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        <Separator className="mb-2" />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mb-2 opacity-50" />
            <p data-testid="text-no-notifications">لا توجد إشعارات</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id}>
                  {notification.deeplink ? (
                    <Link href={notification.deeplink}>
                      <a
                        onClick={() => handleNotificationClick(notification)}
                        className={`block p-3 rounded-lg hover-elevate active-elevate-2 transition-all ${
                          !notification.read
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-card"
                        }`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <NotificationContent notification={notification} />
                      </a>
                    </Link>
                  ) : (
                    <div
                      className={`p-3 rounded-lg ${
                        !notification.read
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-card"
                      }`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <NotificationContent notification={notification} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <>
            <Separator className="my-2" />
            <Link href="/notifications">
              <a
                className="block text-center text-sm text-primary hover:underline py-2"
                onClick={() => setOpen(false)}
                data-testid="link-view-all-notifications"
              >
                عرض كل الإشعارات
              </a>
            </Link>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationContent({ notification }: { notification: Notification }) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BreakingNews: "عاجل",
      ArticlePublished: "جديد",
      FeaturedArticle: "مميز",
      InterestMatch: "قد يهمك",
      LikedStoryUpdate: "تحديث",
      MostReadTodayForYou: "الأكثر قراءة",
    };
    return labels[type] || type;
  };

  const getTypeBadgeVariant = (type: string): "destructive" | "default" | "secondary" => {
    if (type === "BreakingNews") return "destructive";
    if (type === "FeaturedArticle" || type === "InterestMatch") return "default";
    return "secondary";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      BreakingNews: <AlertCircle className="h-4 w-4" />,
      FeaturedArticle: <Star className="h-4 w-4" />,
      ArticlePublished: <Newspaper className="h-4 w-4" />,
      InterestMatch: <Bell className="h-4 w-4" />,
    };
    return icons[type] || <Bell className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1">
          {getTypeIcon(notification.type)}
          <Badge variant={getTypeBadgeVariant(notification.type)}>
            {getTypeLabel(notification.type)}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: arSA,
          })}
        </span>
      </div>
      <h4 className="font-semibold text-sm">{notification.title}</h4>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {notification.body}
      </p>
    </div>
  );
}
