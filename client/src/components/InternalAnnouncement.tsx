import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: string;
  channels: string[];
  iconName: string | null;
  actionButtonLabel: string | null;
  actionButtonUrl: string | null;
}

const VIEWED_PREFIX = "announcement_viewed_";
const DISMISSED_PREFIX = "announcement_dismissed_";

export function InternalAnnouncement() {
  const [location, navigate] = useLocation();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [trackedImpressions, setTrackedImpressions] = useState<Set<string>>(new Set());
  const [trackedUniqueViews, setTrackedUniqueViews] = useState<Set<string>>(new Set());

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements/active'],
  });

  const trackMetricMutation = useMutation({
    mutationFn: ({ announcementId, event, channel }: { 
      announcementId: string; 
      event: string;
      channel?: string;
    }) => apiRequest(`/api/announcements/${announcementId}/metrics`, {
      method: 'POST',
      body: JSON.stringify({ event, channel }),
    }),
  });

  useEffect(() => {
    const dismissed = new Set<string>();
    announcements.forEach(ann => {
      const key = `${DISMISSED_PREFIX}${ann.id}`;
      if (localStorage.getItem(key) === 'true') {
        dismissed.add(ann.id);
      }
    });
    setDismissedIds(dismissed);
  }, [announcements]);

  useEffect(() => {
    announcements.forEach(ann => {
      if (dismissedIds.has(ann.id)) return;

      if (!trackedImpressions.has(ann.id)) {
        trackMetricMutation.mutate({ 
          announcementId: ann.id, 
          event: 'impression',
          channel: getCurrentChannel(),
        });
        setTrackedImpressions(prev => new Set([...prev, ann.id]));
      }

      const uniqueViewKey = `${VIEWED_PREFIX}${ann.id}`;
      const hasViewedInSession = sessionStorage.getItem(uniqueViewKey);
      
      if (!hasViewedInSession && !trackedUniqueViews.has(ann.id)) {
        const timer = setTimeout(() => {
          trackMetricMutation.mutate({ 
            announcementId: ann.id, 
            event: 'unique_view',
            channel: getCurrentChannel(),
          });
          sessionStorage.setItem(uniqueViewKey, 'true');
          setTrackedUniqueViews(prev => new Set([...prev, ann.id]));
        }, 3000);

        return () => clearTimeout(timer);
      }
    });
  }, [announcements, dismissedIds, trackedImpressions, trackedUniqueViews]);

  const getCurrentChannel = () => {
    if (location.startsWith('/dashboard')) return 'dashboard';
    return 'web';
  };

  const handleDismiss = (announcementId: string) => {
    trackMetricMutation.mutate({ 
      announcementId, 
      event: 'dismiss',
      channel: getCurrentChannel(),
    });
    
    localStorage.setItem(`${DISMISSED_PREFIX}${announcementId}`, 'true');
    setDismissedIds(prev => new Set([...prev, announcementId]));
  };

  const handleActionClick = (announcement: Announcement) => {
    if (announcement.actionButtonUrl) {
      trackMetricMutation.mutate({ 
        announcementId: announcement.id, 
        event: 'click',
        channel: getCurrentChannel(),
      });

      if (announcement.actionButtonUrl.startsWith('http')) {
        window.open(announcement.actionButtonUrl, '_blank');
      } else {
        navigate(announcement.actionButtonUrl);
      }
    }
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      critical: {
        bg: "bg-red-500/10 dark:bg-red-500/20",
        border: "border-red-500",
        text: "text-red-700 dark:text-red-300",
        icon: "text-red-500",
      },
      high: {
        bg: "bg-orange-500/10 dark:bg-orange-500/20",
        border: "border-orange-500",
        text: "text-orange-700 dark:text-orange-300",
        icon: "text-orange-500",
      },
      medium: {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        border: "border-blue-500",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-500",
      },
      low: {
        bg: "bg-gray-500/10 dark:bg-gray-500/20",
        border: "border-gray-500",
        text: "text-gray-700 dark:text-gray-300",
        icon: "text-gray-500",
      },
    };
    return configs[priority] || configs.medium;
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    if (!Icon) return null;
    return Icon;
  };

  const currentChannel = getCurrentChannel();
  
  const visibleAnnouncements = announcements.filter(ann => {
    if (dismissedIds.has(ann.id)) return false;
    
    if (!ann.channels.includes('all') && !ann.channels.includes(currentChannel)) {
      return false;
    }
    
    return true;
  });

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-0" dir="rtl">
      {visibleAnnouncements.map((announcement) => {
        const config = getPriorityConfig(announcement.priority);
        const Icon = getIcon(announcement.iconName);

        return (
          <div
            key={announcement.id}
            className={cn(
              "w-full border-b-2 transition-all duration-300",
              config.bg,
              config.border
            )}
            data-testid={`banner-announcement-${announcement.id}`}
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className={cn("flex-shrink-0", config.icon)}>
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", config.text)}>
                    <span className="font-bold">{announcement.title}</span>
                    {announcement.message && (
                      <span className="mr-2">
                        {announcement.message.replace(/<[^>]*>/g, '').substring(0, 150)}
                      </span>
                    )}
                  </p>
                </div>
                
                {announcement.actionButtonLabel && announcement.actionButtonUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleActionClick(announcement)}
                    className={cn("flex-shrink-0", config.text)}
                    data-testid={`button-action-${announcement.id}`}
                  >
                    {announcement.actionButtonLabel}
                  </Button>
                )}
                
                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className={cn(
                    "flex-shrink-0 p-1 rounded-md transition-colors hover-elevate",
                    config.text
                  )}
                  aria-label="إغلاق الإعلان"
                  data-testid={`button-close-${announcement.id}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
