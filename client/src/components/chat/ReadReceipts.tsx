import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadReceipt {
  userId: string;
  userName: string;
  userAvatar?: string;
  readAt: Date;
}

interface ReadReceiptsProps {
  messageId: string;
  readCount?: number;
  children?: React.ReactNode;
}

function formatReadTime(date: Date): string {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ar,
    });
  } catch {
    return new Date(date).toLocaleDateString('ar-SA');
  }
}

export function ReadReceipts({ messageId, readCount, children }: ReadReceiptsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: receipts, isLoading } = useQuery<ReadReceipt[]>({
    queryKey: ["/api/chat/messages", messageId, "read-receipts"],
    enabled: isOpen,
  });

  const trigger = children || (
    <button
      className={cn(
        "inline-flex items-center gap-0.5 text-xs transition-colors hover-elevate",
        readCount && readCount > 0 ? "text-primary" : "text-muted-foreground"
      )}
      data-testid={`read-receipts-trigger-${messageId}`}
    >
      <CheckCheck className="h-3 w-3" />
      {readCount !== undefined && readCount > 0 && (
        <span>{readCount.toLocaleString('en-US')}</span>
      )}
    </button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        side="top"
        data-testid={`read-receipts-popover-${messageId}`}
      >
        <div className="space-y-3" dir="rtl">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">قُرئت بواسطة</h4>
            {receipts && receipts.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {receipts.length.toLocaleString('en-US')}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3" data-testid="read-receipts-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : receipts && receipts.length > 0 ? (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3" data-testid="read-receipts-list">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.userId}
                    className="flex items-center gap-3"
                    data-testid={`read-receipt-${receipt.userId}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={receipt.userAvatar} />
                      <AvatarFallback>{receipt.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {receipt.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatReadTime(receipt.readAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div
              className="text-center py-6 text-sm text-muted-foreground"
              data-testid="read-receipts-empty"
            >
              لم يقرأ أحد هذه الرسالة بعد
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
