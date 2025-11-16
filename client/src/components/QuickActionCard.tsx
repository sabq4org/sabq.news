import { memo, KeyboardEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useLocation } from "wouter";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;  // e.g., "text-emerald-600 dark:text-emerald-400"
  iconBgColor: string;  // e.g., "bg-emerald-50 dark:bg-emerald-950"
  href?: string;  // Navigation link
  onClick?: () => void;  // Click handler
  testId?: string;
  className?: string;
}

const QuickActionCardComponent = ({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  href,
  onClick,
  testId,
  className,
}: QuickActionCardProps) => {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      setLocation(href);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        "hover-elevate active-elevate-2 transition-all cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      data-testid={testId}
    >
      <CardContent className="p-4 sm:p-5 md:p-6">
        {/* Icon Container */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon Circle */}
          <div
            className={cn(
              "flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center",
              iconBgColor
            )}
          >
            <Icon className={cn("h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8", iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2 truncate">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const QuickActionCard = memo(QuickActionCardComponent);
