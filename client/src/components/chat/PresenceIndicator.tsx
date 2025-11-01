import { Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  status: 'online' | 'offline' | 'away';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  online: {
    color: 'bg-green-500',
    label: 'متصل',
  },
  offline: {
    color: 'bg-gray-400',
    label: 'غير متصل',
  },
  away: {
    color: 'bg-yellow-500',
    label: 'بعيد',
  },
};

const sizeConfig = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function PresenceIndicator({
  status,
  size = 'md',
  showLabel = false,
}: PresenceIndicatorProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  if (showLabel) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5"
        data-testid={`presence-badge-${status}`}
      >
        <Circle className={cn(sizeClass, config.color, "fill-current")} />
        <span className="text-xs">{config.label}</span>
      </Badge>
    );
  }

  return (
    <Circle
      className={cn(sizeClass, config.color, "fill-current")}
      data-testid={`presence-dot-${status}`}
    />
  );
}
