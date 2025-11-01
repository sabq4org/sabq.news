import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Hash,
  MessageSquarePlus,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PresenceIndicator } from "./PresenceIndicator";
import { usePresence } from "@/hooks/usePresence";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  displayName?: string;
  type: "channel" | "direct";
  isPinned?: boolean;
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
  onPin,
  onDelete,
  userPresence,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
  onPin: () => void;
  onDelete: () => void;
  userPresence?: 'online' | 'offline' | 'away';
}) {
  const hasOnlineMembers = (channel.membersOnline || 0) > 0;
  const displayName = channel.displayName || channel.name;

  return (
    <div className="relative group" dir="rtl">
      <button
        onClick={onClick}
        className={cn(
          "w-full p-3 rounded-md text-right transition-colors hover-elevate active-elevate-2",
          isActive && "bg-accent"
        )}
        data-testid={`channel-item-${channel.id}`}
      >
        <div className="flex items-start gap-3 flex-row-reverse">
          <div className="relative">
            {channel.type === "direct" ? (
              <>
                <Avatar className="h-10 w-10" data-testid={`avatar-${channel.id}`}>
                  <AvatarImage src={channel.avatarUrl} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                {userPresence && (
                  <div className="absolute bottom-0 right-0" data-testid={`presence-${channel.id}`}>
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
                  <div className="absolute bottom-0 right-0" data-testid={`presence-${channel.id}`}>
                    <PresenceIndicator status="online" size="sm" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {channel.isPinned && (
                  <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" data-testid={`pin-icon-${channel.id}`} />
                )}
                <span
                  className="font-medium text-sm truncate"
                  data-testid={`channel-name-${channel.id}`}
                >
                  {displayName}
                </span>
              </div>
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

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-menu-${channel.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" data-testid={`menu-content-${channel.id}`}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              data-testid={`menu-pin-${channel.id}`}
            >
              {channel.isPinned ? (
                <>
                  <PinOff className="ml-2 h-4 w-4" />
                  إلغاء التثبيت
                </>
              ) : (
                <>
                  <Pin className="ml-2 h-4 w-4" />
                  تثبيت
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
              data-testid={`menu-delete-${channel.id}`}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف المحادثة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
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
  const { toast } = useToast();

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/chat/channels"],
  });

  const pinMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return await apiRequest(`/api/chat/channels/${channelId}/pin`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة التثبيت",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة التثبيت",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return await apiRequest(`/api/chat/channels/${channelId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المحادثة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المحادثة",
        variant: "destructive",
      });
    },
  });

  const filteredChannels = channels?.filter((channel) => {
    const searchName = channel.displayName || channel.name;
    return searchName.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
                onPin={() => pinMutation.mutate(channel.id)}
                onDelete={() => deleteMutation.mutate(channel.id)}
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
