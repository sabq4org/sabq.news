import { useState, useEffect } from "react";
import { chatWebSocket } from "@/lib/chat-websocket";

type PresenceStatus = 'online' | 'offline' | 'away';

export function usePresence() {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(new Map());

  useEffect(() => {
    const unsubscribe = chatWebSocket.on('presence_update', (data: any) => {
      if (data.userId && data.status) {
        setPresenceMap(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId, data.status);
          return newMap;
        });
      }
    });

    return unsubscribe;
  }, []);

  const getUserPresence = (userId: string): PresenceStatus => {
    return presenceMap.get(userId) || 'offline';
  };

  return {
    getUserPresence,
    presenceMap,
  };
}
