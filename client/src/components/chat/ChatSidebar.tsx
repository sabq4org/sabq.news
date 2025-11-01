import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Hash,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PresenceIndicator } from "./PresenceIndicator";
import { usePresence } from "@/hooks/usePresence";

interface Channel {
  id: string;
  name: string;
  type: "channel" | "direct";
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderName: string;
  };
  membersOnline?: number;
  totalMembers?: number;
  avatarUrl?: string;
  userId?: string;
}

interface ChatSidebarProps {
  currentChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  onNewChat: () => void;
  onNewChannel: () => void;
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

function ChannelItem({
  channel,
  isActive,
  onClick,
  userPresence,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
  userPresence?: 'online' | 'offline' | 'away';
}) {
  const hasOnlineMembers = (channel.membersOnline || 0) > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-md text-right transition-colors hover-elevate active-elevate-2",
        isActive && "bg-accent"
      )}
      data-testid={`channel-item-${channel.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          {channel.type === "direct" ? (
            <>
              <Avatar className="h-10 w-10" data-testid={`avatar-${channel.id}`}>
                <AvatarImage src={channel.avatarUrl} />
                <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {userPresence && (
                <div className="absolute bottom-0 left-0" data-testid={`presence-${channel.id}`}>
                  <PresenceIndicator status={userPresence} size="sm" />
                </div>
              )}
            </>
          ) : (
            <div
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
              data-testid={`channel-icon-${channel.id}`}
            >
              <Hash className="h-5 w-5 text-muted-foreground" />
              {hasOnlineMembers && (
                <div className="absolute bottom-0 left-0" data-testid={`presence-${channel.id}`}>
                  <PresenceIndicator status="online" size="sm" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className="font-medium text-sm truncate"
              data-testid={`channel-name-${channel.id}`}
            >
              {channel.name}
            </span>
            {channel.unreadCount > 0 && (
              <Badge
                variant="default"
                className="rounded-full h-5 min-w-5 px-1.5 text-xs"
                data-testid={`unread-badge-${channel.id}`}
              >
                {channel.unreadCount.toLocaleString("en-US")}
              </Badge>
            )}
          </div>

          {channel.lastMessage && (
            <div className="flex items-center justify-between gap-2">
              <p
                className="text-xs text-muted-foreground truncate"
                data-testid={`last-message-${channel.id}`}
              >
                {channel.lastMessage.content}
              </p>
              <span
                className="text-xs text-muted-foreground whitespace-nowrap"
                data-testid={`last-message-time-${channel.id}`}
              >
                {formatMessageTime(new Date(channel.lastMessage.timestamp))}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function ChatSidebar({
  currentChannelId,
  onChannelSelect,
  onNewChat,
  onNewChannel,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { getUserPresence } = usePresence();

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/chat/channels"],
  });

  const filteredChannels = channels?.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background border-l" dir="rtl">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={onNewChat}
            variant="default"
            size="sm"
            className="flex-1"
            data-testid="button-new-chat"
          >
            <MessageSquarePlus className="h-4 w-4 ml-2" />
            محادثة جديدة
          </Button>
          <Button
            onClick={onNewChannel}
            variant="outline"
            size="icon"
            data-testid="button-new-channel"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المحادثات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
            data-testid="input-search-channels"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1" data-testid="channels-list">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2" data-testid={`skeleton-${i}`}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredChannels && filteredChannels.length > 0 ? (
            filteredChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === currentChannelId}
                onClick={() => onChannelSelect(channel.id)}
                userPresence={channel.userId ? getUserPresence(channel.userId) : undefined}
              />
            ))
          ) : (
            <div
              className="p-8 text-center text-muted-foreground"
              data-testid="empty-state"
            >
              <MessageSquarePlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? "لا توجد نتائج" : "لا توجد محادثات"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
