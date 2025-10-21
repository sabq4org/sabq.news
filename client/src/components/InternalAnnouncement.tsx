import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementData {
  message: string;
  type: "info" | "success" | "warning" | "danger";
  isActive: boolean;
  expiresAt?: string | null;
}

const DISMISSED_KEY = "dismissed-announcement";

export function InternalAnnouncement() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const { data: announcement } = useQuery<AnnouncementData>({
    queryKey: ["/api/system/announcement"],
  });

  useEffect(() => {
    if (announcement?.isActive && announcement?.message) {
      // التحقق من تاريخ الانتهاء
      if (announcement.expiresAt) {
        const expiryDate = new Date(announcement.expiresAt);
        const now = new Date();
        
        if (now > expiryDate) {
          // الإعلان منتهي الصلاحية
          setIsDismissed(true);
          return;
        }
      }
      
      const dismissedTimestamp = localStorage.getItem(DISMISSED_KEY);
      const announcementId = `${announcement.message}-${announcement.type}`;
      
      if (dismissedTimestamp !== announcementId) {
        setIsDismissed(false);
        setTimeout(() => setIsVisible(true), 100);
      } else {
        setIsDismissed(true);
      }
    }
  }, [announcement]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDismissed(true);
      if (announcement) {
        const announcementId = `${announcement.message}-${announcement.type}`;
        localStorage.setItem(DISMISSED_KEY, announcementId);
      }
    }, 300);
  };

  if (!announcement?.isActive || !announcement?.message || isDismissed) {
    return null;
  }

  const typeConfig = {
    info: {
      icon: Info,
      bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
      borderClass: "border-blue-500",
      textClass: "text-blue-700 dark:text-blue-300",
      iconClass: "text-blue-500",
    },
    success: {
      icon: CheckCircle,
      bgClass: "bg-green-500/10 dark:bg-green-500/20",
      borderClass: "border-green-500",
      textClass: "text-green-700 dark:text-green-300",
      iconClass: "text-green-500",
    },
    warning: {
      icon: AlertTriangle,
      bgClass: "bg-yellow-500/10 dark:bg-yellow-500/20",
      borderClass: "border-yellow-500",
      textClass: "text-yellow-700 dark:text-yellow-300",
      iconClass: "text-yellow-500",
    },
    danger: {
      icon: AlertCircle,
      bgClass: "bg-red-500/10 dark:bg-red-500/20",
      borderClass: "border-red-500",
      textClass: "text-red-700 dark:text-red-300",
      iconClass: "text-red-500",
    },
  };

  const config = typeConfig[announcement.type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        "w-full border-b-2 transition-all duration-300 ease-out",
        config.bgClass,
        config.borderClass,
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
      data-testid="banner-announcement"
      dir="rtl"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex-shrink-0", config.iconClass)}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          <p className={cn("flex-1 text-sm font-medium", config.textClass)} data-testid="text-announcement-message">
            {announcement.message}
          </p>
          
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded-md transition-colors hover-elevate",
              config.textClass
            )}
            aria-label="إغلاق الإعلان"
            data-testid="button-close-announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
