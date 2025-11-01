import { useState } from "react";
import {
  Reply,
  Edit,
  Trash2,
  Pin,
  File,
  Download,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ThreadView } from "./ThreadView";

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
      id: string;
      type: "image" | "file";
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
  };
  channelId: string;
  currentUserId: string;
  onReply: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${kb.toFixed(1)} KB`;
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

export function MessageBubble({
  message,
  channelId,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const isOwnMessage = message.senderId === currentUserId;

  return (
    <div
      className={cn(
        "group relative",
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
            <div className="space-y-2" data-testid={`attachments-${message.id}`}>
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="border rounded-lg overflow-hidden"
                  data-testid={`attachment-${attachment.id}`}
                >
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full max-h-64 object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted">
                      <File className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid={`download-${attachment.id}`}
                      >
                        <a href={attachment.url} download={attachment.name}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
}
