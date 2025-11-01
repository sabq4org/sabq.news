import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ThreadSummaryProps {
  messageId: string;
}

export function ThreadSummary({ messageId }: ThreadSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        throw new Error('فشل التلخيص');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('خطأ في التلخيص:', error);
      toast({
        title: "خطأ",
        description: "فشل تلخيص المحادثة. يرجى المحاولة لاحقاً",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="thread-summary">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSummarize}
        disabled={isLoading}
        className="w-full"
        data-testid="button-summarize"
      >
        <Sparkles className="h-4 w-4 ml-2" />
        {isLoading ? "جاري التلخيص..." : "تلخيص المحادثة"}
      </Button>

      {summary && (
        <Card data-testid="summary-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              ملخص المحادثة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap" data-testid="summary-content">
              {summary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
