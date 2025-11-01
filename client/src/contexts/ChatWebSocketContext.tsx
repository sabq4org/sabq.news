import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { chatWebSocket } from '@/lib/chat-websocket';

interface ChatWebSocketContextValue {
  isConnected: boolean;
  subscribe: (channelId: string) => void;
  unsubscribe: (channelId: string) => void;
  sendTypingStart: (channelId: string) => void;
  sendTypingStop: (channelId: string) => void;
}

const ChatWebSocketContext = createContext<ChatWebSocketContextValue | null>(null);

export function ChatWebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    chatWebSocket.connect();
    
    const unsubConnected = chatWebSocket.on('connected', () => {
      setIsConnected(true);
    });
    
    const unsubDisconnected = chatWebSocket.on('disconnected', () => {
      setIsConnected(false);
    });
    
    return () => {
      unsubConnected();
      unsubDisconnected();
      chatWebSocket.disconnect();
    };
  }, []);
  
  return (
    <ChatWebSocketContext.Provider
      value={{
        isConnected,
        subscribe: chatWebSocket.subscribe.bind(chatWebSocket),
        unsubscribe: chatWebSocket.unsubscribe.bind(chatWebSocket),
        sendTypingStart: chatWebSocket.sendTypingStart.bind(chatWebSocket),
        sendTypingStop: chatWebSocket.sendTypingStop.bind(chatWebSocket),
      }}
    >
      {children}
    </ChatWebSocketContext.Provider>
  );
}

export function useChatWebSocket() {
  const context = useContext(ChatWebSocketContext);
  if (!context) {
    throw new Error('useChatWebSocket must be used within ChatWebSocketProvider');
  }
  return context;
}
