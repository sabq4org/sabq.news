import { memo, KeyboardEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileOptimizedKpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  suffix?: string;
  prefix?: string;
  testId?: string;
  className?: string;
  ariaLive?: boolean;
  onClick?: () => void;
}

const MobileOptimizedKpiCardComponent = ({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  suffix,
  prefix,
  testId,
  className,
  ariaLive = false,
  onClick,
}: MobileOptimizedKpiCardProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    
    // Handle Enter and Space keys (standard button behavior)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();  // Prevent scroll on Space
      onClick();
    }
  };

  return (
    <Card 
      className={cn(
        "hover-elevate transition-all",
        onClick && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )} 
      data-testid={testId}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick && className?.includes('ring-2') ? true : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <p 
              className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate" 
              data-testid={testId ? `${testId}-label` : undefined}
            >
              {label}
            </p>
            <h3 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold break-words" 
              data-testid={testId ? `${testId}-value` : undefined}
              role={ariaLive ? "status" : undefined}
              aria-live={ariaLive ? "polite" : undefined}
            >
              {prefix}
              {value}
              {suffix && (
                <span className="text-sm sm:text-base font-normal text-muted-foreground mr-1">
                  {suffix}
                </span>
              )}
            </h3>
          </div>
          <div className="flex-shrink-0">
            <div 
              className={cn(
                "h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center",
                iconBgColor
              )}
            >
              <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5", iconColor)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MobileOptimizedKpiCard = memo(MobileOptimizedKpiCardComponent);
