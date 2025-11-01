import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { ThreadSummary } from "./ThreadSummary";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
  replyCount?: number;
}

interface ThreadViewProps {
  messageId: string;
  channelId: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThreadView({
  messageId,
  channelId,
  currentUserId,
  open,
  onOpenChange,
}: ThreadViewProps) {
  const { toast } = useToast();
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const { data: parentMessage, isLoading: isLoadingParent } = useQuery<Message>({
    queryKey: ["/api/chat/messages", messageId],
    enabled: open,
  });

  const { data: replies = [], isLoading: isLoadingReplies } = useQuery<Message[]>({
    queryKey: ["/api/chat/messages", messageId, "replies"],
    enabled: open,
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({
      content,
      attachments,
    }: {
      content: string;
      attachments?: File[];
    }) => {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("parentMessageId", messageId);
      formData.append("channelId", channelId);

      if (attachments) {
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to send reply");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/messages", messageId, "replies"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/channels", channelId, "messages"],
      });
      setReplyToId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل إرسال الرد",
        variant: "destructive",
      });
    },
  });

  const handleSendReply = (content: string, attachments?: File[]) => {
    sendReplyMutation.mutate({ content, attachments });
  };

  const handleReply = (msgId: string) => {
    setReplyToId(msgId);
  };

  const handleReact = (msgId: string, emoji: string) => {
    console.log("React to message:", msgId, emoji);
  };

  const handleEdit = (msgId: string) => {
    console.log("Edit message:", msgId);
  };

  const handleDelete = (msgId: string) => {
    console.log("Delete message:", msgId);
  };

  const isLoading = isLoadingParent || isLoadingReplies;
  const replyCount = replies.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl h-[80vh] flex flex-col p-0"
        data-testid="thread-view"
        dir="rtl"
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="thread-title">
              محادثة ({replyCount.toLocaleString("en-US")} {replyCount === 1 ? "رد" : "ردود"})
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-thread"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground" data-testid="text-loading">
              جاري التحميل...
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6" data-testid="thread-messages">
              <div className="space-y-6 py-4">
                {parentMessage && (
                  <>
                    <div
                      className="bg-muted/30 rounded-lg p-4 border-r-4 border-primary"
                      data-testid="parent-message"
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-3">
                        الرسالة الأصلية
                      </p>
                      <MessageBubble
                        message={parentMessage}
                        channelId={channelId}
                        currentUserId={currentUserId}
                        onReply={handleReply}
                        onReact={handleReact}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>

                    <Separator />

                    <ThreadSummary messageId={messageId} />

                    {replies.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4" data-testid="thread-replies">
                          <p className="text-xs font-medium text-muted-foreground">
                            الردود ({replyCount.toLocaleString("en-US")})
                          </p>
                          {replies.map((reply) => (
                            <MessageBubble
                              key={reply.id}
                              message={reply}
                              channelId={channelId}
                              currentUserId={currentUserId}
                              onReply={handleReply}
                              onReact={handleReact}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="border-t px-6 py-4" data-testid="thread-composer">
              <MessageComposer
                onSend={handleSendReply}
                channelId={channelId}
                placeholder="اكتب ردك..."
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
