export interface ChatWebSocketMessage {
  type: 'connected' | 'new_message' | 'message_updated' | 'message_deleted' | 
        'reaction_added' | 'user_typing' | 'user_stopped_typing' | 
        'presence_update' | 'read_receipt' | 'subscribed' | 'unsubscribed' | 'pong';
  channelId?: string;
  messageId?: string;
  userId?: string;
  message?: any;
  content?: string;
  reaction?: any;
  status?: 'online' | 'offline' | 'away';
  timestamp?: string;
}

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number = 1000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private subscribedChannels: Set<string> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('[ChatWS] Connected');
      this.reconnectAttempts = 0;
      this.reconnectTimeout = 1000;
      
      this.subscribedChannels.forEach(channelId => {
        this.subscribe(channelId);
      });
      
      this.emit('connected', {});
      this.startHeartbeat();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data: ChatWebSocketMessage = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (error) {
        console.error('[ChatWS] Parse error:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('[ChatWS] Error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('[ChatWS] Disconnected');
      this.stopHeartbeat();
      this.emit('disconnected', {});
      this.reconnect();
    };
  }
  
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[ChatWS] Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`[ChatWS] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, this.reconnectTimeout);
    
    this.reconnectTimeout = Math.min(this.reconnectTimeout * 2, 30000);
  }
  
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  subscribe(channelId: string) {
    this.subscribedChannels.add(channelId);
    this.send({ type: 'subscribe', channelId });
  }
  
  unsubscribe(channelId: string) {
    this.subscribedChannels.delete(channelId);
    this.send({ type: 'unsubscribe', channelId });
  }
  
  sendTypingStart(channelId: string) {
    this.send({ type: 'typing_start', channelId });
  }
  
  sendTypingStop(channelId: string) {
    this.send({ type: 'typing_stop', channelId });
  }
  
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
  
  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ChatWS] Listener error:', error);
      }
    });
  }
}

export const chatWebSocket = new ChatWebSocketClient();
