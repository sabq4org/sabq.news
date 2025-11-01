import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./MessageBubble";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentChannelId: string;
  currentUserId: string;
  onMessageClick: (messageId: string) => void;
}

interface SearchFilters {
  query: string;
  channelId?: string;
  userId?: string;
  hasMedia?: boolean;
}

export function SearchDialog({
  open,
  onOpenChange,
  currentChannelId,
  currentUserId,
  onMessageClick,
}: SearchDialogProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    channelId: currentChannelId,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/chat/search", filters],
    enabled: open && filters.query.length >= 2,
  });

  const { data: channels } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/chat/channels"],
    enabled: open,
  });

  const { data: members } = useQuery<Array<{ userId: string; userName: string }>>({
    queryKey: ["/api/chat/channels", currentChannelId, "members"],
    enabled: open && showFilters,
  });

  const handleSearch = (query: string) => {
    setFilters({ ...filters, query });
  };

  const handleMessageClick = (messageId: string) => {
    onMessageClick(messageId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] p-0" dir="rtl">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle data-testid="search-dialog-title">
            البحث في الرسائل
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث في الرسائل..."
                value={filters.query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10"
                data-testid="input-search"
              />
              {filters.query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => handleSearch("")}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30" data-testid="filters-container">
              <div className="space-y-2">
                <Label htmlFor="channel-filter">القناة</Label>
                <Select
                  value={filters.channelId || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, channelId: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger id="channel-filter" data-testid="select-channel">
                    <SelectValue placeholder="جميع القنوات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع القنوات</SelectItem>
                    {channels?.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-filter">المستخدم</Label>
                <Select
                  value={filters.userId || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, userId: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger id="user-filter" data-testid="select-user">
                    <SelectValue placeholder="جميع المستخدمين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستخدمين</SelectItem>
                    {members?.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse col-span-2">
                <Checkbox
                  id="has-media"
                  checked={filters.hasMedia || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasMedia: checked as boolean })
                  }
                  data-testid="checkbox-has-media"
                />
                <Label htmlFor="has-media" className="cursor-pointer">
                  الرسائل التي تحتوي على ملفات فقط
                </Label>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-6">
          {isLoading && filters.query.length >= 2 ? (
            <div className="space-y-4 py-4" data-testid="loading-state">
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
          ) : !filters.query || filters.query.length < 2 ? (
            <div
              className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground"
              data-testid="empty-search"
            >
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">ابدأ بكتابة كلمة للبحث</p>
              <p className="text-xs mt-1">يجب أن يحتوي البحث على حرفين على الأقل</p>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4 py-4" data-testid="search-results">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message.id)}
                  className="cursor-pointer hover-elevate rounded-lg p-2 transition-colors"
                  data-testid={`search-result-${message.id}`}
                >
                  <MessageBubble
                    message={{
                      ...message,
                      timestamp: new Date(message.createdAt),
                      senderId: message.userId,
                      senderName: message.userName || "مستخدم",
                      senderAvatar: message.userAvatar,
                    }}
                    channelId={message.channelId}
                    currentUserId={currentUserId}
                    onReply={() => {}}
                    onReact={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground"
              data-testid="no-results"
            >
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">لا توجد نتائج</p>
              <p className="text-xs mt-1">جرب تغيير كلمات البحث أو الفلاتر</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
