import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SmartRepliesProps {
  messageContent: string;
  onReplySelect: (reply: string) => void;
}

export function SmartReplies({ messageContent, onReplySelect }: SmartRepliesProps) {
  const [replies, setReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleGetReplies = async () => {
    if (replies.length > 0) {
      setIsOpen(!isOpen);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/ai/suggest-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messageContent }),
      });

      if (!response.ok) {
        throw new Error('فشل الحصول على الردود');
      }

      const data = await response.json();
      setReplies(data.replies || []);
      setIsOpen(true);
    } catch (error) {
      console.error('خطأ في اقتراح الردود:', error);
      toast({
        title: "خطأ",
        description: "فشل الحصول على الردود الذكية. يرجى المحاولة لاحقاً",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyClick = (reply: string) => {
    onReplySelect(reply);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2" data-testid="smart-replies">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGetReplies}
        disabled={isLoading}
        data-testid="button-smart-replies"
      >
        <MessageSquare className="h-3 w-3 ml-1" />
        {isLoading ? "جاري التحميل..." : "ردود ذكية"}
      </Button>

      {isOpen && replies.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="replies-list">
          {replies.map((reply, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover-elevate text-sm py-2 px-3"
              onClick={() => handleReplyClick(reply)}
              data-testid={`reply-option-${index}`}
            >
              {reply}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
