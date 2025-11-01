import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatPane } from "@/components/chat/ChatPane";
import { NewChatDialog } from "@/components/chat/NewChatDialog";
import { NewChannelDialog } from "@/components/chat/NewChannelDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";

interface Channel {
  id: string;
  name: string;
  type: "channel" | "direct";
}

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth({ redirectToLogin: true });
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>();
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newChannelDialogOpen, setNewChannelDialogOpen] = useState(false);

  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/chat/channels"],
    enabled: !!user,
  });

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  const handleNewChat = () => {
    console.log("New chat clicked");
    setNewChatDialogOpen(true);
  };

  const handleNewChannel = () => {
    console.log("New channel clicked");
    setNewChannelDialogOpen(true);
  };

  const handleChannelCreated = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  const handleBackToChannels = () => {
    setSelectedChannelId(undefined);
  };

  const handleSearchClick = () => {
    console.log("Search clicked");
  };

  const handleSettingsClick = () => {
    console.log("Settings clicked");
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="loading-state">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)]" dir="rtl">
        <NewChatDialog
          open={newChatDialogOpen}
          onOpenChange={setNewChatDialogOpen}
          onChannelCreated={handleChannelCreated}
        />
        <NewChannelDialog
          open={newChannelDialogOpen}
          onOpenChange={setNewChannelDialogOpen}
          onChannelCreated={handleChannelCreated}
        />
        <div className="flex h-full" data-testid="chat-container">
          <div
            className={`
              w-full md:w-80 h-full
              ${selectedChannelId ? 'hidden md:block' : 'block'}
            `}
            data-testid="chat-sidebar-container"
          >
            <ChatSidebar
              currentChannelId={selectedChannelId}
              onChannelSelect={handleChannelSelect}
              onNewChat={handleNewChat}
              onNewChannel={handleNewChannel}
            />
          </div>

          <div
            className={`
              flex-1 h-full border-r
              ${selectedChannelId ? 'block' : 'hidden md:block'}
            `}
            data-testid="chat-pane-container"
          >
            {selectedChannelId ? (
              <div className="h-full flex flex-col">
                <div className="md:hidden border-b p-3 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToChannels}
                    data-testid="button-back-to-channels"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <span className="font-semibold">العودة للقنوات</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatPane
                    channelId={selectedChannelId}
                    currentUserId={user.id}
                    onSearchClick={handleSearchClick}
                    onSettingsClick={handleSettingsClick}
                  />
                </div>
              </div>
            ) : (
              <div
                className="h-full flex items-center justify-center text-center p-8"
                data-testid="empty-chat-state"
              >
                <div>
                  <p className="text-muted-foreground">اختر محادثة لبدء الدردشة</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    أو أنشئ محادثة جديدة من القائمة الجانبية
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
