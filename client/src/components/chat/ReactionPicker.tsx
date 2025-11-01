import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "✅", "❌"];

interface ReactionPickerProps {
  messageId: string;
  channelId: string;
  trigger?: React.ReactNode;
  onReactionSelect?: (emoji: string) => void;
}

export function ReactionPicker({
  messageId,
  channelId,
  trigger,
  onReactionSelect,
}: ReactionPickerProps) {
  const { toast } = useToast();

  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest(`/api/chat/messages/${messageId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
    },
    onSuccess: (_, emoji) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/channels", channelId, "messages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/messages", messageId, "replies"],
      });
      onReactionSelect?.(emoji);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل إضافة التفاعل",
        variant: "destructive",
      });
    },
  });

  const handleReactionClick = (emoji: string) => {
    addReactionMutation.mutate(emoji);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            data-testid="button-open-reaction-picker"
          >
            تفاعل
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        data-testid="reaction-picker"
        dir="rtl"
      >
        <div className="grid grid-cols-4 gap-1">
          {REACTION_EMOJIS.map((emoji, index) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 w-10 text-2xl hover-elevate",
                addReactionMutation.isPending && "opacity-50 pointer-events-none"
              )}
              onClick={() => handleReactionClick(emoji)}
              data-testid={`reaction-emoji-${index}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
