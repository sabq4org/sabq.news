import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PresenceIndicator } from "./PresenceIndicator";
import { usePresence } from "@/hooks/usePresence";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
}

export function NewChatDialog({
  open,
  onOpenChange,
  onChannelCreated,
}: NewChatDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { getUserPresence } = usePresence();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/chat/users"],
    enabled: open,
  });

  const createChannelMutation = useMutation({
    mutationFn: async (recipientUserId: string) => {
      if (!currentUser) throw new Error("User not authenticated");
      
      return await apiRequest("/api/chat/channels", {
        method: "POST",
        body: JSON.stringify({
          type: "direct",
          createdBy: currentUser.id,
          isPrivate: true,
          metadata: { recipientUserId },
        }),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels"] });
      toast({
        title: "تم إنشاء المحادثة",
        description: "تم بدء المحادثة الجديدة بنجاح",
      });
      onOpenChange(false);
      setSearchQuery("");
      if (onChannelCreated) {
        onChannelCreated(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في إنشاء المحادثة",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleUserSelect = (userId: string) => {
    createChannelMutation.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl" data-testid="new-chat-dialog">
        <DialogHeader>
          <DialogTitle>محادثة جديدة</DialogTitle>
          <DialogDescription>
            اختر مستخدماً لبدء محادثة مباشرة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              data-testid="input-search-user"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-users-found">
                <p>لا يوجد مستخدمون</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => {
                  const userPresence = getUserPresence(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      disabled={createChannelMutation.isPending}
                      className="w-full flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid={`user-item-${user.id}`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profileImageUrl} />
                          <AvatarFallback>
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {userPresence && (
                          <div className="absolute bottom-0 left-0">
                            <PresenceIndicator status={userPresence} size="sm" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-right">
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSearchQuery("");
              }}
              disabled={createChannelMutation.isPending}
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
