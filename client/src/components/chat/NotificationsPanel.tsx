import { useNotifications, ChatNotification } from '@/hooks/useNotifications';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCheck, MessageSquare, AtSign, Reply, Heart, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLocation } from 'wouter';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-4 w-4" />;
    case 'mention':
      return <AtSign className="h-4 w-4" />;
    case 'reply':
      return <Reply className="h-4 w-4" />;
    case 'reaction':
      return <Heart className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [, setLocation] = useLocation();

  const handleNotificationClick = async (notification: ChatNotification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }

    if (notification.channelId && notification.messageId) {
      setLocation(`/chat/${notification.channelId}?messageId=${notification.messageId}`);
      onOpenChange(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[400px] sm:w-[540px]" data-testid="sheet-notifications">
        <SheetHeader>
          <SheetTitle>الإشعارات</SheetTitle>
          <SheetDescription>
            إشعارات الدردشة والرسائل الجديدة
          </SheetDescription>
        </SheetHeader>

        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllAsRead.isPending || notifications.filter(n => !n.isRead).length === 0}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 ml-2" />
            تمييز الكل كمقروء
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32" data-testid="loading-notifications">
              <div className="text-sm text-muted-foreground">جاري التحميل...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center" data-testid="empty-notifications">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-right h-auto py-3 px-3 hover-elevate ${
                      !notification.isRead ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`mt-1 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                          <h4 className="text-sm font-semibold">{notification.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.body}
                        </p>
                        {notification.metadata?.senderName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            من: {notification.metadata.senderName}
                          </p>
                        )}
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" data-testid={`unread-indicator-${notification.id}`} />
                      )}
                    </div>
                  </Button>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
