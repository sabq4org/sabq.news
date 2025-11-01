import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatWebSocket } from '@/lib/chat-websocket';

export function useChatMessages(channelId: string | null) {
  const queryClient = useQueryClient();
  
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['/api/chat/channels', channelId, 'messages'],
    enabled: !!channelId,
  });
  
  useEffect(() => {
    if (!channelId) return;
    
    chatWebSocket.subscribe(channelId);
    
    const unsubNewMessage = chatWebSocket.on('new_message', (data) => {
      if (data.channelId === channelId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/channels', channelId, 'messages'] });
      }
    });
    
    const unsubUpdated = chatWebSocket.on('message_updated', (data) => {
      if (data.channelId === channelId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/channels', channelId, 'messages'] });
      }
    });
    
    const unsubDeleted = chatWebSocket.on('message_deleted', (data) => {
      if (data.channelId === channelId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/channels', channelId, 'messages'] });
      }
    });
    
    return () => {
      chatWebSocket.unsubscribe(channelId);
      unsubNewMessage();
      unsubUpdated();
      unsubDeleted();
    };
  }, [channelId, queryClient]);
  
  return { messages, isLoading, error };
}
