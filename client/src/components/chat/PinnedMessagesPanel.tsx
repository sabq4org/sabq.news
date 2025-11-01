import { useQuery, useMutation } from "@tanstack/react-query";
import { Pin, PinOff, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./MessageBubble";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PinnedMessagesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  currentUserId: string;
  isAdmin?: boolean;
  onMessageClick: (messageId: string) => void;
}

export function PinnedMessagesPanel({
  open,
  onOpenChange,
  channelId,
  currentUserId,
  isAdmin = false,
  onMessageClick,
}: PinnedMessagesPanelProps) {
  const { toast } = useToast();

  const { data: pinnedMessages, isLoading } = useQuery({
    queryKey: ["/api/chat/channels", channelId, "pinned-messages"],
    enabled: open,
  });

  const unpinMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest(`/api/chat/messages/${messageId}/unpin`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/channels", channelId, "pinned-messages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/messages", channelId],
      });
      toast({
        title: "تم إلغاء التثبيت",
        description: "تم إلغاء تثبيت الرسالة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل إلغاء تثبيت الرسالة",
        variant: "destructive",
      });
    },
  });

  const handleUnpin = (messageId: string) => {
    unpinMutation.mutate(messageId);
  };

  const handleMessageClick = (messageId: string) => {
    onMessageClick(messageId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2" data-testid="pinned-panel-title">
            <Pin className="h-5 w-5" />
            الرسائل المثبتة
            {pinnedMessages && pinnedMessages.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({pinnedMessages.length.toLocaleString("en-US")})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          {isLoading ? (
            <div className="space-y-4" data-testid="loading-state">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : pinnedMessages && pinnedMessages.length > 0 ? (
            <div className="space-y-6" data-testid="pinned-messages-list">
              {pinnedMessages.map((message: any, index: number) => (
                <div
                  key={message.id}
                  className="relative border-b last:border-b-0 pb-6 last:pb-0"
                  data-testid={`pinned-message-${message.id}`}
                >
                  <div
                    onClick={() => handleMessageClick(message.id)}
                    className="cursor-pointer hover-elevate rounded-lg p-2 transition-colors"
                  >
                    <MessageBubble
                      message={{
                        ...message,
                        timestamp: new Date(message.createdAt),
                        senderId: message.userId,
                        senderName: message.userName || "مستخدم",
                        senderAvatar: message.userAvatar,
                      }}
                      channelId={channelId}
                      currentUserId={currentUserId}
                      onReply={() => {}}
                      onReact={() => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnpin(message.id)}
                        disabled={unpinMutation.isPending}
                        className="gap-2"
                        data-testid={`button-unpin-${message.id}`}
                      >
                        {unpinMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <PinOff className="h-3 w-3" />
                        )}
                        إلغاء التثبيت
                      </Button>
                    </div>
                  )}

                  {message.pinnedAt && (
                    <div className="text-xs text-muted-foreground mt-2">
                      تم التثبيت في {new Date(message.pinnedAt).toLocaleDateString("ar-SA")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground"
              data-testid="empty-state"
            >
              <Pin className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">لا توجد رسائل مثبتة</p>
              <p className="text-xs mt-1">يمكن للمشرفين تثبيت الرسائل المهمة</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
