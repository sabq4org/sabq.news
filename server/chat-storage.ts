import { db } from "./db";
import { eq, and, or, desc, asc, sql, gte, lte, isNull, ilike, inArray } from "drizzle-orm";
import {
  chatChannels,
  chatMembers,
  chatMessages,
  chatAttachments,
  chatReactions,
  chatMentions,
  chatReadReceipts,
  chatPinnedMessages,
  chatModerationLogs,
  chatRetentionPolicies,
  chatNotifications,
  users,
  type ChatChannel,
  type ChatMember,
  type ChatMessage,
  type ChatAttachment,
  type ChatReaction,
  type ChatMention,
  type ChatReadReceipt,
  type ChatPinnedMessage,
  type ChatModerationLog,
  type ChatRetentionPolicy,
  type ChatNotification,
  type InsertChatChannel,
  type UpdateChatChannel,
  type InsertChatMember,
  type UpdateChatMember,
  type InsertChatMessage,
  type UpdateChatMessage,
  type InsertChatAttachment,
  type InsertChatReaction,
  type InsertChatMention,
  type InsertChatModerationLog,
  type InsertChatNotification,
  type InsertChatRetentionPolicy,
  type ChatChannelWithDetails,
  type ChatMessageWithDetails,
  type ChatMemberWithDetails,
} from "@shared/schema";

// Type aliases للتوافق مع المواصفات
export type SelectChatChannel = ChatChannel;
export type SelectChatMember = ChatMember;
export type SelectChatMessage = ChatMessage;
export type SelectChatAttachment = ChatAttachment;
export type SelectChatReaction = ChatReaction;
export type SelectChatMention = ChatMention;
export type SelectChatReadReceipt = ChatReadReceipt;
export type SelectChatPinnedMessage = ChatPinnedMessage;
export type SelectChatModerationLog = ChatModerationLog;
export type SelectChatRetentionPolicy = ChatRetentionPolicy;

/**
 * واجهة Storage Layer لنظام الدردشة
 * توفر عمليات CRUD كاملة لإدارة القنوات والرسائل والأعضاء
 */
export interface IChatStorage {
  // ==========================================
  // Channels Management - إدارة القنوات
  // ==========================================
  
  /**
   * إنشاء قناة دردشة جديدة
   * @param channel بيانات القناة الجديدة
   * @returns القناة المُنشأة
   */
  createChannel(channel: InsertChatChannel): Promise<SelectChatChannel>;
  
  /**
   * الحصول على قناة بواسطة المعرف
   * @param channelId معرف القناة
   * @returns القناة أو null
   */
  getChannelById(channelId: string): Promise<SelectChatChannel | null>;
  
  /**
   * الحصول على جميع قنوات المستخدم
   * @param userId معرف المستخدم
   * @returns قائمة القنوات
   */
  getChannelsByUserId(userId: string): Promise<SelectChatChannel[]>;
  
  /**
   * تحديث بيانات القناة
   * @param channelId معرف القناة
   * @param data البيانات المُحدثة
   * @returns القناة المُحدثة
   */
  updateChannel(channelId: string, data: UpdateChatChannel): Promise<SelectChatChannel>;
  
  /**
   * حذف القناة نهائياً
   * @param channelId معرف القناة
   */
  deleteChannel(channelId: string): Promise<void>;
  
  /**
   * أرشفة القناة (soft delete)
   * @param channelId معرف القناة
   */
  archiveChannel(channelId: string): Promise<void>;
  
  // ==========================================
  // Members Management - إدارة الأعضاء
  // ==========================================
  
  /**
   * إضافة عضو جديد للقناة
   * @param member بيانات العضو
   * @returns العضو المُضاف
   */
  addMember(member: InsertChatMember): Promise<SelectChatMember>;
  
  /**
   * إزالة عضو من القناة
   * @param channelId معرف القناة
   * @param userId معرف المستخدم
   */
  removeMember(channelId: string, userId: string): Promise<void>;
  
  /**
   * تحديث دور العضو في القناة
   * @param channelId معرف القناة
   * @param userId معرف المستخدم
   * @param role الدور الجديد
   * @returns العضو المُحدث
   */
  updateMemberRole(channelId: string, userId: string, role: string): Promise<SelectChatMember>;
  
  /**
   * الحصول على أعضاء القناة
   * @param channelId معرف القناة
   * @returns قائمة الأعضاء
   */
  getChannelMembers(channelId: string): Promise<SelectChatMember[]>;
  
  /**
   * التحقق من عضوية المستخدم في القناة
   * @param channelId معرف القناة
   * @param userId معرف المستخدم
   * @returns true إذا كان عضواً
   */
  isMember(channelId: string, userId: string): Promise<boolean>;
  
  // ==========================================
  // Messages Management - إدارة الرسائل
  // ==========================================
  
  /**
   * إنشاء رسالة جديدة
   * @param message بيانات الرسالة
   * @returns الرسالة المُنشأة
   */
  createMessage(message: InsertChatMessage): Promise<SelectChatMessage>;
  
  /**
   * الحصول على رسالة بواسطة المعرف
   * @param messageId معرف الرسالة
   * @returns الرسالة أو null
   */
  getMessageById(messageId: string): Promise<SelectChatMessage | null>;
  
  /**
   * الحصول على رسائل القناة مع خيارات التصفح
   * @param channelId معرف القناة
   * @param options خيارات التصفح (limit, before, after)
   * @returns قائمة الرسائل
   */
  getChannelMessages(channelId: string, options: { 
    limit?: number; 
    before?: string; 
    after?: string;
  }): Promise<SelectChatMessage[]>;
  
  /**
   * تحديث محتوى الرسالة
   * @param messageId معرف الرسالة
   * @param content المحتوى الجديد
   * @returns الرسالة المُحدثة
   */
  updateMessage(messageId: string, content: string): Promise<SelectChatMessage>;
  
  /**
   * حذف الرسالة (soft delete)
   * @param messageId معرف الرسالة
   * @param deletedBy معرف من قام بالحذف
   */
  deleteMessage(messageId: string, deletedBy: string): Promise<void>;
  
  /**
   * تثبيت رسالة في القناة
   * @param messageId معرف الرسالة
   * @param pinnedBy معرف من قام بالتثبيت
   */
  pinMessage(messageId: string, pinnedBy: string): Promise<void>;
  
  /**
   * إلغاء تثبيت رسالة
   * @param messageId معرف الرسالة
   */
  unpinMessage(messageId: string): Promise<void>;
  
  // ==========================================
  // Threads - المحادثات الفرعية
  // ==========================================
  
  /**
   * الحصول على الردود على رسالة معينة
   * @param parentMessageId معرف الرسالة الأصلية
   * @returns قائمة الردود
   */
  getThreadMessages(parentMessageId: string): Promise<SelectChatMessage[]>;
  
  // ==========================================
  // Reactions - التفاعلات
  // ==========================================
  
  /**
   * إضافة تفاعل على رسالة
   * @param reaction بيانات التفاعل
   * @returns التفاعل المُضاف
   */
  addReaction(reaction: InsertChatReaction): Promise<SelectChatReaction>;
  
  /**
   * إزالة تفاعل من رسالة
   * @param messageId معرف الرسالة
   * @param userId معرف المستخدم
   * @param emoji الرمز التعبيري
   */
  removeReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  
  /**
   * الحصول على تفاعلات الرسالة
   * @param messageId معرف الرسالة
   * @returns قائمة التفاعلات
   */
  getMessageReactions(messageId: string): Promise<SelectChatReaction[]>;
  
  // ==========================================
  // Mentions - الإشارات
  // ==========================================
  
  /**
   * إنشاء إشارة لمستخدم
   * @param mention بيانات الإشارة
   * @returns الإشارة المُنشأة
   */
  createMention(mention: InsertChatMention): Promise<SelectChatMention>;
  
  /**
   * الحصول على إشارات المستخدم
   * @param userId معرف المستخدم
   * @param options خيارات التصفية
   * @returns قائمة الإشارات
   */
  getUserMentions(userId: string, options: { unreadOnly?: boolean }): Promise<SelectChatMention[]>;
  
  // ==========================================
  // Read Receipts - إيصالات القراءة
  // ==========================================
  
  /**
   * تعليم رسالة كمقروءة
   * @param messageId معرف الرسالة
   * @param userId معرف المستخدم
   */
  markAsRead(messageId: string, userId: string): Promise<void>;
  
  /**
   * تحديث آخر رسالة مقروءة في القناة
   * @param channelId معرف القناة
   * @param userId معرف المستخدم
   * @param messageId معرف الرسالة
   */
  updateChannelRead(channelId: string, userId: string, messageId: string): Promise<void>;
  
  /**
   * الحصول على عدد الرسائل غير المقروءة
   * @param channelId معرف القناة
   * @param userId معرف المستخدم
   * @returns عدد الرسائل غير المقروءة
   */
  getUnreadCount(channelId: string, userId: string): Promise<number>;
  
  // ==========================================
  // Attachments - المرفقات
  // ==========================================
  
  /**
   * إنشاء مرفق للرسالة
   * @param attachment بيانات المرفق
   * @returns المرفق المُنشأ
   */
  createAttachment(attachment: InsertChatAttachment): Promise<SelectChatAttachment>;
  
  /**
   * الحصول على مرفقات الرسالة
   * @param messageId معرف الرسالة
   * @returns قائمة المرفقات
   */
  getMessageAttachments(messageId: string): Promise<SelectChatAttachment[]>;
  
  // ==========================================
  // Search - البحث
  // ==========================================
  
  /**
   * البحث في الرسائل
   * @param query نص البحث
   * @param options خيارات البحث
   * @returns قائمة الرسائل المطابقة
   */
  searchMessages(query: string, options: { 
    channelId?: string; 
    userId?: string; 
    hasMedia?: boolean;
  }): Promise<SelectChatMessage[]>;
  
  // ==========================================
  // Moderation - الإشراف
  // ==========================================
  
  /**
   * تسجيل عملية إشرافية
   * @param log بيانات السجل
   * @returns السجل المُنشأ
   */
  logModeration(log: InsertChatModerationLog): Promise<SelectChatModerationLog>;
  
  /**
   * الحصول على سجلات الإشراف للقناة
   * @param channelId معرف القناة
   * @returns قائمة السجلات
   */
  getModerationLogs(channelId: string): Promise<SelectChatModerationLog[]>;
  
  // ==========================================
  // Retention - سياسات الاحتفاظ
  // ==========================================
  
  /**
   * إنشاء سياسة احتفاظ
   * @param policy بيانات السياسة
   * @returns السياسة المُنشأة
   */
  createRetentionPolicy(policy: InsertChatRetentionPolicy): Promise<SelectChatRetentionPolicy>;
  
  /**
   * تطبيق سياسات الاحتفاظ وحذف الرسائل القديمة
   */
  applyRetentionPolicies(): Promise<void>;
  
  // ==========================================
  // Notifications - الإشعارات
  // ==========================================
  
  /**
   * إنشاء إشعار جديد
   * @param notification بيانات الإشعار
   * @returns الإشعار المُنشأ
   */
  createNotification(notification: any): Promise<any>;
  
  /**
   * الحصول على إشعارات المستخدم
   * @param userId معرف المستخدم
   * @param unreadOnly فلترة غير المقروءة فقط
   * @returns قائمة الإشعارات
   */
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<any[]>;
  
  /**
   * تمييز إشعار كمقروء
   * @param notificationId معرف الإشعار
   */
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  /**
   * تمييز جميع إشعارات المستخدم كمقروءة
   * @param userId معرف المستخدم
   */
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  /**
   * الحصول على عدد الإشعارات غير المقروءة
   * @param userId معرف المستخدم
   * @returns عدد الإشعارات غير المقروءة
   */
  getUnreadNotificationsCount(userId: string): Promise<number>;
  
  /**
   * حذف إشعار
   * @param notificationId معرف الإشعار
   */
  deleteNotification(notificationId: string): Promise<void>;
}

/**
 * تطبيق Storage Layer لنظام الدردشة باستخدام Drizzle ORM
 * يوفر عمليات قاعدة بيانات فعالة وآمنة مع إدارة الصلاحيات
 */
export class DbChatStorage implements IChatStorage {
  
  // ==========================================
  // Channels Management - إدارة القنوات
  // ==========================================
  
  async createChannel(channel: InsertChatChannel): Promise<SelectChatChannel> {
    const [newChannel] = await db
      .insert(chatChannels)
      .values([channel as any])
      .returning();
    
    if (!newChannel) {
      throw new Error("فشل إنشاء القناة");
    }
    
    // إضافة المنشئ كعضو بدور owner تلقائياً
    await this.addMember({
      channelId: newChannel.id,
      userId: channel.createdBy,
      role: "owner",
      canPost: true,
      canInvite: true,
      notificationPreference: 'all',
    });
    
    return newChannel;
  }
  
  async getChannelById(channelId: string): Promise<SelectChatChannel | null> {
    const [channel] = await db
      .select()
      .from(chatChannels)
      .where(
        and(
          eq(chatChannels.id, channelId),
          eq(chatChannels.status, "active")
        )
      )
      .limit(1);
    
    return channel || null;
  }
  
  async getChannelsByUserId(userId: string): Promise<SelectChatChannel[]> {
    const results = await db
      .select({
        channel: chatChannels,
      })
      .from(chatChannels)
      .innerJoin(chatMembers, eq(chatChannels.id, chatMembers.channelId))
      .where(
        and(
          eq(chatMembers.userId, userId),
          eq(chatChannels.status, "active")
        )
      )
      .orderBy(desc(chatChannels.updatedAt));
    
    return results.map(r => r.channel);
  }
  
  async updateChannel(channelId: string, data: UpdateChatChannel): Promise<SelectChatChannel> {
    const [updated] = await db
      .update(chatChannels)
      .set({
        ...data as any,
        updatedAt: new Date(),
      })
      .where(eq(chatChannels.id, channelId))
      .returning();
    
    if (!updated) {
      throw new Error("القناة غير موجودة");
    }
    
    return updated;
  }
  
  async deleteChannel(channelId: string): Promise<void> {
    await db
      .update(chatChannels)
      .set({
        status: "deleted",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chatChannels.id, channelId));
  }
  
  async archiveChannel(channelId: string): Promise<void> {
    await db
      .update(chatChannels)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chatChannels.id, channelId));
  }
  
  // ==========================================
  // Members Management - إدارة الأعضاء
  // ==========================================
  
  async addMember(member: InsertChatMember): Promise<SelectChatMember> {
    // التحقق من وجود القناة
    const channel = await this.getChannelById(member.channelId);
    if (!channel) {
      throw new Error("القناة غير موجودة");
    }
    
    const [newMember] = await db
      .insert(chatMembers)
      .values(member)
      .returning();
    
    if (!newMember) {
      throw new Error("فشل إضافة العضو");
    }
    
    // تحديث عدد الأعضاء في metadata القناة
    await db
      .update(chatChannels)
      .set({
        metadata: sql`jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{memberCount}',
          (COALESCE((metadata->>'memberCount')::int, 0) + 1)::text::jsonb
        )`,
        updatedAt: new Date(),
      })
      .where(eq(chatChannels.id, member.channelId));
    
    return newMember;
  }
  
  async removeMember(channelId: string, userId: string): Promise<void> {
    const result = await db
      .delete(chatMembers)
      .where(
        and(
          eq(chatMembers.channelId, channelId),
          eq(chatMembers.userId, userId)
        )
      )
      .returning();
    
    if (result.length > 0) {
      // تحديث عدد الأعضاء
      await db
        .update(chatChannels)
        .set({
          metadata: sql`jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{memberCount}',
            GREATEST((COALESCE((metadata->>'memberCount')::int, 1) - 1), 0)::text::jsonb
          )`,
          updatedAt: new Date(),
        })
        .where(eq(chatChannels.id, channelId));
    }
  }
  
  async updateMemberRole(channelId: string, userId: string, role: string): Promise<SelectChatMember> {
    const [updated] = await db
      .update(chatMembers)
      .set({ role })
      .where(
        and(
          eq(chatMembers.channelId, channelId),
          eq(chatMembers.userId, userId)
        )
      )
      .returning();
    
    if (!updated) {
      throw new Error("العضو غير موجود");
    }
    
    return updated;
  }
  
  async getChannelMembers(channelId: string): Promise<SelectChatMember[]> {
    return await db
      .select()
      .from(chatMembers)
      .where(eq(chatMembers.channelId, channelId))
      .orderBy(asc(chatMembers.joinedAt));
  }
  
  async isMember(channelId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(chatMembers)
      .where(
        and(
          eq(chatMembers.channelId, channelId),
          eq(chatMembers.userId, userId)
        )
      )
      .limit(1);
    
    return !!member;
  }
  
  // ==========================================
  // Messages Management - إدارة الرسائل
  // ==========================================
  
  async createMessage(message: InsertChatMessage): Promise<SelectChatMessage> {
    // التحقق من عضوية المستخدم
    const isMemberResult = await this.isMember(message.channelId, message.userId);
    if (!isMemberResult) {
      throw new Error("المستخدم ليس عضواً في القناة");
    }
    
    const [newMessage] = await db
      .insert(chatMessages)
      .values([message as any])
      .returning();
    
    if (!newMessage) {
      throw new Error("فشل إنشاء الرسالة");
    }
    
    // تحديث آخر نشاط في القناة
    await db
      .update(chatChannels)
      .set({
        metadata: sql`jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{lastActivity}',
          to_jsonb(${new Date().toISOString()}::text)
        )`,
        updatedAt: new Date(),
      })
      .where(eq(chatChannels.id, message.channelId));
    
    return newMessage;
  }
  
  async getMessageById(messageId: string): Promise<SelectChatMessage | null> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.id, messageId),
          eq(chatMessages.isDeleted, false)
        )
      )
      .limit(1);
    
    return message || null;
  }
  
  async getChannelMessages(
    channelId: string, 
    options: { limit?: number; before?: string; after?: string }
  ): Promise<SelectChatMessage[]> {
    const { limit = 50, before, after } = options;
    
    let conditions = [
      eq(chatMessages.channelId, channelId),
      eq(chatMessages.isDeleted, false),
    ];
    
    if (before) {
      const [beforeMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, before))
        .limit(1);
      
      if (beforeMessage) {
        conditions.push(sql`${chatMessages.createdAt} < ${beforeMessage.createdAt}`);
      }
    }
    
    if (after) {
      const [afterMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, after))
        .limit(1);
      
      if (afterMessage) {
        conditions.push(sql`${chatMessages.createdAt} > ${afterMessage.createdAt}`);
      }
    }
    
    return await db
      .select()
      .from(chatMessages)
      .where(and(...conditions))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }
  
  async updateMessage(messageId: string, content: string): Promise<SelectChatMessage> {
    // الحصول على الرسالة الحالية لحفظ التاريخ
    const currentMessage = await this.getMessageById(messageId);
    if (!currentMessage) {
      throw new Error("الرسالة غير موجودة");
    }
    
    const editHistory = currentMessage.metadata?.editHistory || [];
    editHistory.push({
      content: currentMessage.content,
      editedAt: new Date().toISOString(),
    });
    
    const [updated] = await db
      .update(chatMessages)
      .set({
        content,
        isEdited: true,
        editedAt: new Date(),
        metadata: {
          ...currentMessage.metadata,
          editHistory,
        },
      })
      .where(eq(chatMessages.id, messageId))
      .returning();
    
    if (!updated) {
      throw new Error("فشل تحديث الرسالة");
    }
    
    return updated;
  }
  
  async deleteMessage(messageId: string, deletedBy: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      })
      .where(eq(chatMessages.id, messageId));
  }
  
  async pinMessage(messageId: string, pinnedBy: string): Promise<void> {
    return db.transaction(async (tx) => {
      // تحديث الرسالة
      const [message] = await tx
        .update(chatMessages)
        .set({
          isPinned: true,
          pinnedBy,
          pinnedAt: new Date(),
        })
        .where(eq(chatMessages.id, messageId))
        .returning();
      
      if (!message) {
        throw new Error("الرسالة غير موجودة");
      }
      
      // إضافة إلى جدول الرسائل المثبتة
      await tx
        .insert(chatPinnedMessages)
        .values({
          channelId: message.channelId,
          messageId,
          pinnedBy,
        })
        .onConflictDoNothing();
      
      // تحديث عدد الرسائل المثبتة
      await tx
        .update(chatChannels)
        .set({
          metadata: sql`jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{pinnedCount}',
            (COALESCE((metadata->>'pinnedCount')::int, 0) + 1)::text::jsonb
          )`,
          updatedAt: new Date(),
        })
        .where(eq(chatChannels.id, message.channelId));
    });
  }
  
  async unpinMessage(messageId: string): Promise<void> {
    return db.transaction(async (tx) => {
      const [message] = await tx
        .update(chatMessages)
        .set({
          isPinned: false,
          pinnedBy: null,
          pinnedAt: null,
        })
        .where(eq(chatMessages.id, messageId))
        .returning();
      
      if (!message) {
        throw new Error("الرسالة غير موجودة");
      }
      
      await tx
        .delete(chatPinnedMessages)
        .where(eq(chatPinnedMessages.messageId, messageId));
      
      await tx
        .update(chatChannels)
        .set({
          metadata: sql`jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{pinnedCount}',
            GREATEST((COALESCE((metadata->>'pinnedCount')::int, 1) - 1), 0)::text::jsonb
          )`,
          updatedAt: new Date(),
        })
        .where(eq(chatChannels.id, message.channelId));
    });
  }
  
  // ==========================================
  // Threads - المحادثات الفرعية
  // ==========================================
  
  async getThreadMessages(parentMessageId: string): Promise<SelectChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.parentMessageId, parentMessageId),
          eq(chatMessages.isDeleted, false)
        )
      )
      .orderBy(asc(chatMessages.createdAt));
  }
  
  // ==========================================
  // Reactions - التفاعلات
  // ==========================================
  
  async addReaction(reaction: InsertChatReaction): Promise<SelectChatReaction> {
    const [newReaction] = await db
      .insert(chatReactions)
      .values(reaction)
      .onConflictDoNothing()
      .returning();
    
    if (!newReaction) {
      // التفاعل موجود مسبقاً
      const [existing] = await db
        .select()
        .from(chatReactions)
        .where(
          and(
            eq(chatReactions.messageId, reaction.messageId),
            eq(chatReactions.userId, reaction.userId),
            eq(chatReactions.emoji, reaction.emoji)
          )
        )
        .limit(1);
      
      return existing!;
    }
    
    // تحديث عداد التفاعلات في metadata الرسالة
    await db
      .update(chatMessages)
      .set({
        metadata: sql`jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{reactionCount}',
          (COALESCE((metadata->>'reactionCount')::int, 0) + 1)::text::jsonb
        )`,
      })
      .where(eq(chatMessages.id, reaction.messageId));
    
    return newReaction;
  }
  
  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const result = await db
      .delete(chatReactions)
      .where(
        and(
          eq(chatReactions.messageId, messageId),
          eq(chatReactions.userId, userId),
          eq(chatReactions.emoji, emoji)
        )
      )
      .returning();
    
    if (result.length > 0) {
      await db
        .update(chatMessages)
        .set({
          metadata: sql`jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{reactionCount}',
            GREATEST((COALESCE((metadata->>'reactionCount')::int, 1) - 1), 0)::text::jsonb
          )`,
        })
        .where(eq(chatMessages.id, messageId));
    }
  }
  
  async getMessageReactions(messageId: string): Promise<SelectChatReaction[]> {
    return await db
      .select()
      .from(chatReactions)
      .where(eq(chatReactions.messageId, messageId))
      .orderBy(asc(chatReactions.createdAt));
  }
  
  // ==========================================
  // Mentions - الإشارات
  // ==========================================
  
  async createMention(mention: InsertChatMention): Promise<SelectChatMention> {
    const [newMention] = await db
      .insert(chatMentions)
      .values(mention)
      .returning();
    
    if (!newMention) {
      throw new Error("فشل إنشاء الإشارة");
    }
    
    return newMention;
  }
  
  async getUserMentions(
    userId: string, 
    options: { unreadOnly?: boolean } = {}
  ): Promise<SelectChatMention[]> {
    const { unreadOnly = false } = options;
    
    let conditions = [eq(chatMentions.mentionedUserId, userId)];
    
    if (unreadOnly) {
      // الإشارات غير المقروءة فقط
      conditions.push(
        sql`NOT EXISTS (
          SELECT 1 FROM ${chatReadReceipts}
          WHERE ${chatReadReceipts.messageId} = ${chatMentions.messageId}
          AND ${chatReadReceipts.userId} = ${userId}
        )`
      );
    }
    
    return await db
      .select()
      .from(chatMentions)
      .where(and(...conditions))
      .orderBy(desc(chatMentions.createdAt));
  }
  
  // ==========================================
  // Read Receipts - إيصالات القراءة
  // ==========================================
  
  async markAsRead(messageId: string, userId: string): Promise<void> {
    await db
      .insert(chatReadReceipts)
      .values({ messageId, userId })
      .onConflictDoNothing();
  }
  
  async updateChannelRead(channelId: string, userId: string, messageId: string): Promise<void> {
    await db
      .update(chatMembers)
      .set({
        lastReadMessageId: messageId,
        lastReadAt: new Date(),
      })
      .where(
        and(
          eq(chatMembers.channelId, channelId),
          eq(chatMembers.userId, userId)
        )
      );
  }
  
  async getUnreadCount(channelId: string, userId: string): Promise<number> {
    // الحصول على آخر رسالة مقروءة
    const [member] = await db
      .select()
      .from(chatMembers)
      .where(
        and(
          eq(chatMembers.channelId, channelId),
          eq(chatMembers.userId, userId)
        )
      )
      .limit(1);
    
    if (!member) {
      return 0;
    }
    
    let conditions = [
      eq(chatMessages.channelId, channelId),
      eq(chatMessages.isDeleted, false),
    ];
    
    if (member.lastReadMessageId) {
      const [lastReadMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, member.lastReadMessageId))
        .limit(1);
      
      if (lastReadMessage) {
        conditions.push(sql`${chatMessages.createdAt} > ${lastReadMessage.createdAt}`);
      }
    }
    
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(and(...conditions));
    
    return result?.count || 0;
  }

  async getMessageReadReceipts(messageId: string): Promise<Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    readAt: Date;
  }>> {
    const receipts = await db
      .select({
        userId: chatReadReceipts.userId,
        userName: users.firstName,
        userAvatar: users.profileImageUrl,
        readAt: chatReadReceipts.readAt,
      })
      .from(chatReadReceipts)
      .innerJoin(users, eq(users.id, chatReadReceipts.userId))
      .where(eq(chatReadReceipts.messageId, messageId))
      .orderBy(desc(chatReadReceipts.readAt));
    
    return receipts.map(r => ({
      userId: r.userId,
      userName: r.userName || 'مستخدم',
      userAvatar: r.userAvatar || undefined,
      readAt: r.readAt,
    }));
  }
  
  // ==========================================
  // Attachments - المرفقات
  // ==========================================
  
  async createAttachment(attachment: InsertChatAttachment): Promise<SelectChatAttachment> {
    const [newAttachment] = await db
      .insert(chatAttachments)
      .values([attachment as any])
      .returning();
    
    if (!newAttachment) {
      throw new Error("فشل إضافة المرفق");
    }
    
    return newAttachment;
  }
  
  async getMessageAttachments(messageId: string): Promise<SelectChatAttachment[]> {
    return await db
      .select()
      .from(chatAttachments)
      .where(eq(chatAttachments.messageId, messageId))
      .orderBy(asc(chatAttachments.uploadedAt));
  }
  
  // ==========================================
  // Search - البحث
  // ==========================================
  
  async searchMessages(
    query: string, 
    options: { channelId?: string; userId?: string; hasMedia?: boolean } = {}
  ): Promise<SelectChatMessage[]> {
    const { channelId, userId, hasMedia } = options;
    
    let conditions = [
      eq(chatMessages.isDeleted, false),
      ilike(chatMessages.content, `%${query}%`),
    ];
    
    if (channelId) {
      conditions.push(eq(chatMessages.channelId, channelId));
    }
    
    if (userId) {
      conditions.push(eq(chatMessages.userId, userId));
    }
    
    if (hasMedia) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${chatAttachments}
          WHERE ${chatAttachments.messageId} = ${chatMessages.id}
        )`
      );
    }
    
    return await db
      .select()
      .from(chatMessages)
      .where(and(...conditions))
      .orderBy(desc(chatMessages.createdAt))
      .limit(100);
  }
  
  // ==========================================
  // Moderation - الإشراف
  // ==========================================
  
  async logModeration(log: InsertChatModerationLog): Promise<SelectChatModerationLog> {
    const [newLog] = await db
      .insert(chatModerationLogs)
      .values([log as any])
      .returning();
    
    if (!newLog) {
      throw new Error("فشل تسجيل عملية الإشراف");
    }
    
    return newLog;
  }
  
  async getModerationLogs(channelId: string): Promise<SelectChatModerationLog[]> {
    return await db
      .select()
      .from(chatModerationLogs)
      .where(eq(chatModerationLogs.channelId, channelId))
      .orderBy(desc(chatModerationLogs.createdAt));
  }
  
  // ==========================================
  // Retention - سياسات الاحتفاظ
  // ==========================================
  
  async createRetentionPolicy(policy: InsertChatRetentionPolicy): Promise<SelectChatRetentionPolicy> {
    const [newPolicy] = await db
      .insert(chatRetentionPolicies)
      .values(policy)
      .returning();
    
    if (!newPolicy) {
      throw new Error("فشل إنشاء سياسة الاحتفاظ");
    }
    
    return newPolicy;
  }
  
  async applyRetentionPolicies(): Promise<void> {
    // الحصول على جميع السياسات المفعلة
    const policies = await db
      .select()
      .from(chatRetentionPolicies)
      .where(eq(chatRetentionPolicies.isEnabled, true));
    
    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
      
      let conditions = [
        sql`${chatMessages.createdAt} < ${cutoffDate}`,
        eq(chatMessages.isDeleted, false),
      ];
      
      if (policy.channelId) {
        conditions.push(eq(chatMessages.channelId, policy.channelId));
      }
      
      // حذف الرسائل القديمة (soft delete)
      await db
        .update(chatMessages)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: null, // حذف تلقائي
        })
        .where(and(...conditions));
    }
  }

  // ==========================================
  // Pinned Messages - الرسائل المثبتة
  // ==========================================
  
  async getPinnedMessages(channelId: string): Promise<SelectChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.channelId, channelId),
        eq(chatMessages.isPinned, true),
        eq(chatMessages.isDeleted, false)
      ))
      .orderBy(desc(chatMessages.pinnedAt));
  }
  
  // ==========================================
  // Notifications - الإشعارات
  // ==========================================
  
  async createNotification(notification: InsertChatNotification): Promise<ChatNotification> {
    const [newNotification] = await db
      .insert(chatNotifications)
      .values(notification)
      .returning();
    
    if (!newNotification) {
      throw new Error("فشل إنشاء الإشعار");
    }
    
    return newNotification;
  }
  
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<ChatNotification[]> {
    const conditions = [eq(chatNotifications.userId, userId)];
    
    if (unreadOnly) {
      conditions.push(eq(chatNotifications.isRead, false));
    }
    
    return await db
      .select()
      .from(chatNotifications)
      .where(and(...conditions))
      .orderBy(desc(chatNotifications.createdAt))
      .limit(50);
  }
  
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(chatNotifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(eq(chatNotifications.id, notificationId));
  }
  
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(chatNotifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(and(
        eq(chatNotifications.userId, userId),
        eq(chatNotifications.isRead, false)
      ));
  }
  
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatNotifications)
      .where(and(
        eq(chatNotifications.userId, userId),
        eq(chatNotifications.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }
  
  async deleteNotification(notificationId: string): Promise<void> {
    await db
      .delete(chatNotifications)
      .where(eq(chatNotifications.id, notificationId));
  }
}
