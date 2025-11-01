import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import type { IStorage } from './storage';
import { pool } from './db';
import cookie from 'cookie';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  channelIds?: Set<string>;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'typing_start' | 'typing_stop' | 'message' | 'reaction' | 'read_receipt' | 'ping';
  channelId?: string;
  messageId?: string;
  content?: string;
  emoji?: string;
  data?: any;
}

/**
 * WebSocket Server لنظام الدردشة الفورية
 * يوفر اتصالات real-time مع دعم للقنوات والرسائل والتفاعلات
 */
export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private storage: IStorage;

  constructor(server: any, storage: IStorage) {
    this.storage = storage;
    this.wss = new WebSocketServer({ server, path: '/ws/chat' });
    
    console.log('[WebSocket] Chat WebSocket Server initialized on /ws/chat');
    
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Heartbeat لتنظيف الاتصالات الميتة
    setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log('[WebSocket] Terminating dead connection for user:', ws.userId);
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // كل 30 ثانية
  }

  /**
   * معالجة اتصال WebSocket جديد
   */
  private async handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    console.log('[WebSocket] New connection attempt from:', req.socket.remoteAddress);
    
    try {
      // استخراج userId من session/cookie
      const userId = await this.extractUserIdFromRequest(req);
      
      if (!userId) {
        console.log('[WebSocket] Unauthorized connection - no valid session');
        ws.close(1008, 'Unauthorized');
        return;
      }
      
      console.log('[WebSocket] User authenticated:', userId);
      
      ws.userId = userId;
      ws.channelIds = new Set();
      ws.isAlive = true;
      
      // إضافة المستخدم للقائمة
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);
      
      console.log('[WebSocket] User connected:', userId, '- Total connections:', this.clients.get(userId)!.size);
      
      // إرسال presence update للمستخدمين المتصلين
      this.broadcastPresence(userId, 'online');
      
      // إرسال رسالة ترحيبية
      ws.send(JSON.stringify({
        type: 'connected',
        userId,
        timestamp: new Date().toISOString(),
      }));
      
      // معالجة pong من الـ heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      // معالجة الرسائل الواردة
      ws.on('message', async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          console.log('[WebSocket] Message received from', userId, ':', message.type);
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('[WebSocket] Error processing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'خطأ في معالجة الرسالة',
          }));
        }
      });
      
      // معالجة الأخطاء
      ws.on('error', (error) => {
        console.error('[WebSocket] WebSocket error for user', userId, ':', error);
      });
      
      // معالجة قطع الاتصال
      ws.on('close', () => {
        console.log('[WebSocket] Connection closed for user:', userId);
        this.handleDisconnection(ws);
      });
      
    } catch (error) {
      console.error('[WebSocket] Error handling connection:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * استخراج userId من session cookie
   * يقرأ cookie الـ session ويستعلم عن بيانات المستخدم من قاعدة البيانات
   */
  private async extractUserIdFromRequest(req: IncomingMessage): Promise<string | null> {
    try {
      // قراءة الـ cookies من الـ header
      const cookies = req.headers.cookie;
      if (!cookies) {
        console.log('[WebSocket] No cookies found in request');
        return null;
      }
      
      // تحليل الـ cookies
      const parsedCookies = cookie.parse(cookies);
      
      // البحث عن session cookie (الاسم الافتراضي هو connect.sid)
      const sessionCookie = parsedCookies['connect.sid'];
      if (!sessionCookie) {
        console.log('[WebSocket] No session cookie found');
        return null;
      }
      
      // إزالة التوقيع من الـ session ID (s:sessionId.signature)
      let sessionId = sessionCookie;
      if (sessionId.startsWith('s:')) {
        sessionId = sessionId.slice(2).split('.')[0];
      }
      
      // الاستعلام عن الـ session من قاعدة البيانات
      const result = await pool.query(
        'SELECT sess FROM sessions WHERE sid = $1',
        [sessionId]
      );
      
      if (result.rows.length === 0) {
        console.log('[WebSocket] Session not found in database');
        return null;
      }
      
      // تحليل بيانات الـ session
      const sessionData = result.rows[0].sess;
      
      // استخراج userId من passport session
      const userId = sessionData?.passport?.user;
      
      if (!userId) {
        console.log('[WebSocket] No user ID in session');
        return null;
      }
      
      return userId;
    } catch (error) {
      console.error('[WebSocket] Error extracting user ID from request:', error);
      return null;
    }
  }

  /**
   * معالجة الرسائل الواردة من العميل
   */
  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { type, channelId, messageId, content, emoji } = message;
    
    switch (type) {
      case 'subscribe':
        if (channelId) {
          try {
            // التحقق من العضوية
            const isMember = await this.storage.chatStorage.isMember(channelId, ws.userId!);
            if (isMember) {
              ws.channelIds!.add(channelId);
              console.log('[WebSocket] User', ws.userId, 'subscribed to channel:', channelId);
              ws.send(JSON.stringify({ type: 'subscribed', channelId }));
            } else {
              console.log('[WebSocket] User', ws.userId, 'not a member of channel:', channelId);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'أنت لست عضواً في هذه القناة' 
              }));
            }
          } catch (error) {
            console.error('[WebSocket] Error subscribing to channel:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'خطأ في الاشتراك بالقناة' 
            }));
          }
        }
        break;
        
      case 'unsubscribe':
        if (channelId) {
          ws.channelIds!.delete(channelId);
          console.log('[WebSocket] User', ws.userId, 'unsubscribed from channel:', channelId);
          ws.send(JSON.stringify({ type: 'unsubscribed', channelId }));
        }
        break;
        
      case 'typing_start':
        if (channelId) {
          console.log('[WebSocket] User', ws.userId, 'started typing in channel:', channelId);
          this.broadcastToChannel(channelId, {
            type: 'user_typing',
            userId: ws.userId,
            channelId,
            timestamp: new Date().toISOString(),
          }, ws.userId);
        }
        break;
        
      case 'typing_stop':
        if (channelId) {
          console.log('[WebSocket] User', ws.userId, 'stopped typing in channel:', channelId);
          this.broadcastToChannel(channelId, {
            type: 'user_stopped_typing',
            userId: ws.userId,
            channelId,
            timestamp: new Date().toISOString(),
          }, ws.userId);
        }
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
        
      default:
        console.log('[WebSocket] Unknown message type:', type);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'نوع رسالة غير معروف' 
        }));
    }
  }

  /**
   * معالجة قطع اتصال المستخدم
   */
  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userSockets = this.clients.get(ws.userId);
      if (userSockets) {
        userSockets.delete(ws);
        console.log('[WebSocket] Socket removed for user:', ws.userId, '- Remaining:', userSockets.size);
        
        // إذا لم يعد لدى المستخدم أي اتصالات نشطة
        if (userSockets.size === 0) {
          this.clients.delete(ws.userId);
          console.log('[WebSocket] User fully disconnected:', ws.userId);
          this.broadcastPresence(ws.userId, 'offline');
        }
      }
    }
  }

  // ==========================================
  // Broadcast Methods - طرق البث
  // ==========================================

  /**
   * بث رسالة جديدة لأعضاء القناة
   */
  public broadcastNewMessage(channelId: string, message: any) {
    console.log('[WebSocket] Broadcasting new message to channel:', channelId);
    this.broadcastToChannel(channelId, {
      type: 'new_message',
      channelId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * بث تحديث رسالة لأعضاء القناة
   */
  public broadcastMessageUpdate(channelId: string, messageId: string, content: string) {
    console.log('[WebSocket] Broadcasting message update to channel:', channelId);
    this.broadcastToChannel(channelId, {
      type: 'message_updated',
      channelId,
      messageId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * بث حذف رسالة لأعضاء القناة
   */
  public broadcastMessageDelete(channelId: string, messageId: string) {
    console.log('[WebSocket] Broadcasting message deletion to channel:', channelId);
    this.broadcastToChannel(channelId, {
      type: 'message_deleted',
      channelId,
      messageId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * بث تفاعل جديد لأعضاء القناة
   */
  public broadcastReaction(channelId: string, messageId: string, reaction: any) {
    console.log('[WebSocket] Broadcasting reaction to channel:', channelId);
    this.broadcastToChannel(channelId, {
      type: 'reaction_added',
      channelId,
      messageId,
      reaction,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * بث إشعار قراءة لأعضاء القناة
   */
  public broadcastReadReceipt(channelId: string, messageId: string, userId: string) {
    console.log('[WebSocket] Broadcasting read receipt to channel:', channelId);
    this.broadcastToChannel(channelId, {
      type: 'read_receipt',
      channelId,
      messageId,
      userId,
      timestamp: new Date().toISOString(),
    }, userId); // لا نرسل للمستخدم نفسه
  }

  /**
   * بث حالة الحضور (presence) للمستخدمين
   */
  public broadcastPresence(userId: string, status: 'online' | 'offline' | 'away') {
    console.log('[WebSocket] Broadcasting presence update:', userId, '->', status);
    
    const message = {
      type: 'presence_update',
      userId,
      status,
      timestamp: new Date().toISOString(),
    };
    
    // إرسال لجميع المتصلين
    // في المستقبل: يمكن تحسينه لإرسال فقط للأصدقاء أو أعضاء القنوات المشتركة
    this.wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * بث رسالة لجميع أعضاء القناة (ما عدا المستخدم المستثنى)
   */
  private broadcastToChannel(channelId: string, data: any, excludeUserId?: string) {
    const message = JSON.stringify(data);
    let broadcastCount = 0;
    
    this.wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.channelIds?.has(channelId) &&
        client.userId !== excludeUserId
      ) {
        client.send(message);
        broadcastCount++;
      }
    });
    
    console.log('[WebSocket] Broadcast sent to', broadcastCount, 'clients in channel:', channelId);
  }

  /**
   * إرسال رسالة لمستخدم محدد (جميع اتصالاته)
   */
  public sendToUser(userId: string, data: any) {
    const userSockets = this.clients.get(userId);
    if (userSockets) {
      const message = JSON.stringify(data);
      let sentCount = 0;
      
      userSockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
          sentCount++;
        }
      });
      
      console.log('[WebSocket] Message sent to', sentCount, 'connections for user:', userId);
    } else {
      console.log('[WebSocket] User not connected:', userId);
    }
  }

  /**
   * الحصول على عدد المتصلين
   */
  public getConnectionStats() {
    return {
      totalUsers: this.clients.size,
      totalConnections: this.wss.clients.size,
      activeConnections: Array.from(this.wss.clients).filter(
        (ws: AuthenticatedWebSocket) => ws.readyState === WebSocket.OPEN
      ).length,
    };
  }
}

// Instance singleton للوصول العام
export let chatWebSocket: ChatWebSocketServer | null = null;

/**
 * تهيئة WebSocket server
 */
export function initializeChatWebSocket(server: any, storage: IStorage) {
  console.log('[WebSocket] Initializing Chat WebSocket Server...');
  chatWebSocket = new ChatWebSocketServer(server, storage);
  console.log('[WebSocket] Chat WebSocket Server ready!');
  return chatWebSocket;
}
