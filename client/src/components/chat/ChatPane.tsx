import { useRef, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Pin, Settings, Users, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import { SearchDialog } from "./SearchDialog";
import { PinnedMessagesPanel } from "./PinnedMessagesPanel";
import { useChannelTyping } from "@/hooks/useChannelTyping";
import { useMessageScroll } from "@/hooks/useMessageScroll";

interface Message {
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
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
}

interface Channel {
  id: string;
  name: string;
  memberCount: number;
  type: "channel" | "direct";
}

interface ChatPaneProps {
  channelId: string;
  currentUserId: string;
  onSearchClick: () => void;
  onSettingsClick: () => void;
}

export function ChatPane({
  channelId,
  currentUserId,
  onSearchClick,
  onSettingsClick,
}: ChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false);
  const typingUsers = useChannelTyping(channelId);
  const { scrollToMessage, registerMessage } = useMessageScroll();

  const { data: channel, isLoading: channelLoading } = useQuery<Channel>({
    queryKey: ["/api/chat/channels", channelId],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/chat/channels/${channelId}/messages`, page],
  });

  const { data: pinnedMessages } = useQuery<Message[]>({
    queryKey: ["/api/chat/channels", channelId, "pinned-messages"],
  });

  const pinnedCount = pinnedMessages?.length || 0;
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; attachments?: any[]; mentions?: string[] }) => {
      console.log("🚀 Mutation starting:", {
        channelId,
        content: data.content,
        url: `/api/chat/channels/${channelId}/messages`
      });
      
      const result = await apiRequest(`/api/chat/channels/${channelId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: data.content,
          contentType: "text",
          attachments: data.attachments || [],
          mentions: data.mentions || [],
        }),
      });
      
      console.log("✅ Mutation success:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ onSuccess callback:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/chat/channels/${channelId}/messages`] });
    },
    onError: (error: any) => {
      console.error("❌ Mutation error:", error);
      toast({
        title: "فشل إرسال الرسالة",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current && page === 1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, page]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMore && !messagesLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSendMessage = (content: string, attachments?: any[], mentions?: string[]) => {
    console.log("Send message:", content, attachments, mentions);
    console.log("Mutation state:", {
      isPending: sendMessageMutation.isPending,
      isError: sendMessageMutation.isError,
      error: sendMessageMutation.error
    });
    sendMessageMutation.mutate({ content, attachments, mentions });
    console.log("Mutation called");
  };

  const handleReply = (messageId: string) => {
    console.log("Reply to:", messageId);
  };

  const handleReact = (messageId: string, emoji: string) => {
    console.log("React:", messageId, emoji);
  };

  const handleEdit = (messageId: string) => {
    console.log("Edit:", messageId);
  };

  const handleDelete = (messageId: string) => {
    console.log("Delete:", messageId);
  };

  if (channelLoading) {
    return (
      <div className="flex flex-col h-full" dir="rtl">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      <div
        className="border-b p-4 flex items-center justify-between gap-4"
        data-testid="chat-header"
      >
        <div className="flex items-center gap-3">
          <div>
            <h2
              className="font-semibold text-lg"
              data-testid="channel-name"
            >
              {channel?.name}
            </h2>
            {channel?.type === "channel" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span data-testid="member-count">
                  {channel.memberCount.toLocaleString("en-US")} أعضاء
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPinnedPanelOpen(true)}
              data-testid="button-pin"
            >
              <Pin className="h-4 w-4" />
            </Button>
            {pinnedCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -left-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                data-testid="pinned-count-badge"
              >
                {pinnedCount.toLocaleString("en-US")}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-4 space-y-4"
          data-testid="messages-container"
        >
          {messagesLoading && page > 1 && (
            <div className="flex justify-center py-2" data-testid="loading-more">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                ref={(el) => registerMessage(message.id, el)}
                message={message}
                channelId={channelId}
                currentUserId={currentUserId}
                onReply={handleReply}
                onReact={handleReact}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            !messagesLoading && (
              <div
                className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground"
                data-testid="empty-messages"
              >
                <p className="text-sm">لا توجد رسائل بعد</p>
                <p className="text-xs mt-2">ابدأ المحادثة بإرسال أول رسالة</p>
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {typingUsers.length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      <div className="border-t p-4" data-testid="message-composer-container">
        <MessageComposer onSend={handleSendMessage} channelId={channelId} />
      </div>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        currentChannelId={channelId}
        currentUserId={currentUserId}
        onMessageClick={scrollToMessage}
      />

      <PinnedMessagesPanel
        open={pinnedPanelOpen}
        onOpenChange={setPinnedPanelOpen}
        channelId={channelId}
        currentUserId={currentUserId}
        isAdmin={false}
        onMessageClick={scrollToMessage}
      />
    </div>
  );
}
