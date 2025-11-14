import { memo } from "react";
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
}: MobileOptimizedKpiCardProps) => {
  return (
    <Card 
      className={cn("hover-elevate transition-all", className)} 
      data-testid={testId}
    >
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <p 
              className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 truncate" 
              data-testid={testId ? `${testId}-label` : undefined}
            >
              {label}
            </p>
            <h3 
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold break-words" 
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
                "h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center",
                iconBgColor
              )}
            >
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6", iconColor)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MobileOptimizedKpiCard = memo(MobileOptimizedKpiCardComponent);
