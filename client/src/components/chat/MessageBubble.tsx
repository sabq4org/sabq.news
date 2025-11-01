import { useState, useRef, useEffect, forwardRef } from "react";
import {
  Reply,
  Edit,
  Trash2,
  Pin,
  MessageSquare,
  Check,
  CheckCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ThreadView } from "./ThreadView";
import { AttachmentPreview } from "./AttachmentPreview";
import { ReadReceipts } from "./ReadReceipts";
import { SmartReplies } from "./SmartReplies";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    contentType: "text" | "rich_text";
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    timestamp: Date;
    attachments?: Array<{
      id?: string;
      type: 'image' | 'video' | 'audio' | 'document' | 'file';
      url: string;
      name: string;
      size?: number;
    }>;
    reactions?: Array<{
      emoji: string;
      userIds: string[];
      count: number;
    }>;
    isPinned?: boolean;
    isEdited?: boolean;
    replyCount?: number;
    mentions?: string[];
    replyTo?: {
      id: string;
      senderName: string;
      content: string;
    };
    readCount?: number;
    isRead?: boolean;
  };
  channelId: string;
  currentUserId: string;
  onReply: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  onRegisterRef?: (messageId: string, element: HTMLDivElement | null) => void;
  onReplySelect?: (reply: string) => void;
}

function formatMessageTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes.toLocaleString("en-US")} دقيقة`;
  if (hours < 24) return `منذ ${hours.toLocaleString("en-US")} ساعة`;
  if (days < 7) return `منذ ${days.toLocaleString("en-US")} يوم`;
  return date.toLocaleDateString("ar-SA");
}


function renderContentWithMentions(content: string, mentions?: string[]) {
  if (!mentions || mentions.length === 0) {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  }

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    const username = match[1];
    if (mentions.includes(username)) {
      parts.push(
        <Badge
          key={match.index}
          variant="secondary"
          className="mx-1 text-xs"
          data-testid={`mention-${username}`}
        >
          @{username}
        </Badge>
      );
    } else {
      parts.push(match[0]);
    }
    
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <div className="text-sm whitespace-pre-wrap">{parts}</div>;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(({
  message,
  channelId,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onMarkAsRead,
  onRegisterRef,
  onReplySelect,
}, ref) => {
  const [showActions, setShowActions] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const isOwnMessage = message.senderId === currentUserId;
  const internalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = (typeof ref === 'function' ? null : ref?.current) || internalRef.current;
    if (!element || isOwnMessage || !onMarkAsRead) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !message.isRead) {
            onMarkAsRead(message.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [message.id, message.isRead, isOwnMessage, onMarkAsRead, ref]);

  useEffect(() => {
    const element = (typeof ref === 'function' ? null : ref?.current) || internalRef.current;
    if (onRegisterRef) {
      onRegisterRef(message.id, element);
    }
  }, [message.id, onRegisterRef, ref]);

  return (
    <div
      ref={ref || internalRef}
      className={cn(
        "group relative rounded-lg transition-colors",
        isOwnMessage && "flex justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`message-${message.id}`}
    >
      <div className={cn("flex gap-3 max-w-[80%]", isOwnMessage && "flex-row-reverse")}>
        <Avatar className="h-10 w-10" data-testid={`avatar-${message.id}`}>
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="font-medium text-sm"
              data-testid={`sender-name-${message.id}`}
            >
              {message.senderName}
            </span>
            <span
              className="text-xs text-muted-foreground"
              data-testid={`timestamp-${message.id}`}
            >
              {formatMessageTime(new Date(message.timestamp))}
            </span>
            {message.isPinned && (
              <Pin
                className="h-3 w-3 text-muted-foreground"
                data-testid={`pinned-${message.id}`}
              />
            )}
            {message.isEdited && (
              <span
                className="text-xs text-muted-foreground italic"
                data-testid={`edited-${message.id}`}
              >
                (معدلة)
              </span>
            )}
          </div>

          {message.replyTo && (
            <div
              className="p-2 border-r-2 border-primary bg-muted/50 rounded text-sm"
              data-testid={`reply-to-${message.id}`}
            >
              <p className="font-medium text-xs text-muted-foreground">
                رد على {message.replyTo.senderName}
              </p>
              <p className="text-xs truncate">{message.replyTo.content}</p>
            </div>
          )}

          <div
            className={cn(
              "rounded-lg p-3",
              isOwnMessage
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
            data-testid={`content-${message.id}`}
          >
            {message.contentType === "rich_text" ? (
              <div
                dangerouslySetInnerHTML={{ __html: message.content }}
                className="prose prose-sm max-w-none"
              />
            ) : (
              renderContentWithMentions(message.content, message.mentions)
            )}
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <AttachmentPreview
              attachments={message.attachments}
              variant="full"
            />
          )}

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1" data-testid={`reactions-${message.id}`}>
              {message.reactions.map((reaction, idx) => {
                const hasReacted = reaction.userIds.includes(currentUserId);
                return (
                  <Badge
                    key={idx}
                    variant={hasReacted ? "default" : "secondary"}
                    className="cursor-pointer hover-elevate gap-1"
                    onClick={() => onReact(message.id, reaction.emoji)}
                    data-testid={`reaction-${message.id}-${idx}`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="mr-1">
                      {reaction.count.toLocaleString("en-US")}
                    </span>
                  </Badge>
                );
              })}
            </div>
          )}

          {isOwnMessage && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {message.readCount !== undefined && message.readCount > 0 ? (
                <ReadReceipts messageId={message.id} readCount={message.readCount}>
                  <div
                    className="flex items-center gap-0.5 cursor-pointer hover-elevate"
                    data-testid={`message-read-status-${message.id}`}
                  >
                    <CheckCheck className="h-3 w-3 text-primary" />
                    {message.readCount > 0 && (
                      <span className="text-primary">
                        {message.readCount.toLocaleString("en-US")}
                      </span>
                    )}
                  </div>
                </ReadReceipts>
              ) : (
                <div
                  className="flex items-center gap-0.5"
                  data-testid={`message-sent-status-${message.id}`}
                >
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          )}

          {showActions && (
            <div
              className="flex items-center gap-1 mt-2"
              data-testid={`actions-${message.id}`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(message.id)}
                data-testid={`button-reply-${message.id}`}
              >
                <Reply className="h-3 w-3 ml-1" />
                رد
              </Button>
              {message.replyCount !== undefined && message.replyCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThread(true)}
                  data-testid={`button-view-thread-${message.id}`}
                >
                  <MessageSquare className="h-3 w-3 ml-1" />
                  {message.replyCount.toLocaleString("en-US")} {message.replyCount === 1 ? "رد" : "ردود"}
                </Button>
              )}
              <ReactionPicker
                messageId={message.id}
                channelId={channelId}
                onReactionSelect={(emoji) => onReact(message.id, emoji)}
              />
              {isOwnMessage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(message.id)}
                    data-testid={`button-edit-${message.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(message.id)}
                    data-testid={`button-delete-${message.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}

          {!isOwnMessage && onReplySelect && (
            <div className="mt-2">
              <SmartReplies
                messageContent={message.content}
                onReplySelect={onReplySelect}
              />
            </div>
          )}
        </div>
      </div>

      {showThread && (
        <ThreadView
          messageId={message.id}
          channelId={channelId}
          currentUserId={currentUserId}
          open={showThread}
          onOpenChange={setShowThread}
        />
      )}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
