import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBadgeProps {
  onClick?: () => void;
}

export function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        data-testid="button-notifications"
        className="relative"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </Button>
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs"
          data-testid="badge-notification-count"
        >
          {unreadCount > 99 ? '99+' : unreadCount.toLocaleString('en-US')}
        </Badge>
      )}
    </div>
  );
}
