import { useState, useEffect, useRef } from "react";
import { chatWebSocket } from "@/lib/chat-websocket";

interface TypingUser {
  id: string;
  name: string;
}

export function useChannelTyping(channelId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!channelId) {
      setTypingUsers([]);
      return;
    }

    const timeouts = timeoutsRef.current;

    const unsubTyping = chatWebSocket.on('user_typing', (data: any) => {
      if (data.channelId !== channelId) return;

      const userId = data.userId;
      const userName = data.userName || 'مستخدم';

      setTypingUsers(prev => {
        if (prev.some(u => u.id === userId)) return prev;
        return [...prev, { id: userId, name: userName }];
      });

      const existingTimeout = timeouts.get(userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeout = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.id !== userId));
        timeouts.delete(userId);
      }, 5000);

      timeouts.set(userId, timeout);
    });

    const unsubStopped = chatWebSocket.on('user_stopped_typing', (data: any) => {
      if (data.channelId !== channelId) return;

      const userId = data.userId;
      setTypingUsers(prev => prev.filter(u => u.id !== userId));

      const timeout = timeouts.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(userId);
      }
    });

    return () => {
      unsubTyping();
      unsubStopped();
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [channelId]);

  return typingUsers;
}
