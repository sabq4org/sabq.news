import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { chatWebSocket } from '@/lib/chat-websocket';
import { useToast } from '@/hooks/use-toast';

export interface ChatNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  channelId?: string | null;
  messageId?: string | null;
  metadata?: any;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

export function useNotifications() {
  const queryClientInstance = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery<ChatNotification[]>({
    queryKey: ['/api/chat/notifications'],
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/chat/notifications/unread-count'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!chatWebSocket) return;

    const unsubscribe = chatWebSocket.on('notification', (data: any) => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/chat/notifications'] });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/chat/notifications/unread-count'] });

      toast({
        title: data.notification.title,
        description: data.notification.body,
      });
    });

    return unsubscribe;
  }, [queryClientInstance, toast]);

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/chat/notifications/${notificationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/chat/notifications'] });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/chat/notifications/unread-count'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () =>
      apiRequest('/api/chat/notifications/mark-all-read', { method: 'POST' }),
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/chat/notifications'] });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/chat/notifications/unread-count'] });
    },
  });

  return {
    notifications: notifications || [],
    unreadCount: unreadCountData?.count || 0,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
