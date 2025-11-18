import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import EmailAgentTab from "@/components/communications/EmailAgentTab";
import WhatsAppTab from "@/components/communications/WhatsAppTab";

interface BadgeStats {
  newMessages: number;
  publishedToday: number;
  rejectedToday: number;
}

export default function CommunicationsManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("email");

  // Fetch WhatsApp badge stats with 30 second polling
  const { data: whatsappStats } = useQuery<BadgeStats>({
    queryKey: ['/api/whatsapp/badge-stats'],
    enabled: !!user && ['admin', 'system_admin', 'manager'].includes(user.role || ''),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch Email badge stats with 30 second polling
  const { data: emailStats } = useQuery<BadgeStats>({
    queryKey: ['/api/email-agent/badge-stats'],
    enabled: !!user && ['admin', 'system_admin', 'manager'].includes(user.role || ''),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8" dir="rtl">
          <div className="text-center py-20">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !['admin', 'system_admin', 'manager'].includes(user.role || '')) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8" dir="rtl">
          <div className="text-center py-20">
            <p className="text-destructive text-lg">
              غير مصرح لك بالوصول إلى هذه الصفحة
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              يتطلب الوصول إلى هذه الصفحة صلاحيات إدارية
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" dir="rtl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
                إدارة قنوات الاتصال
              </h1>
              <p className="text-muted-foreground mt-1">
                إدارة البريد الذكي والواتساب في مكان واحد
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="email" data-testid="tab-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                البريد الذكي
                {emailStats && emailStats.newMessages > 0 && (
                  <Badge variant="default" className="mr-2" data-testid="badge-email-new">
                    {emailStats.newMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="whatsapp" data-testid="tab-whatsapp" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                واتساب
                {whatsappStats && whatsappStats.newMessages > 0 && (
                  <Badge variant="default" className="mr-2" data-testid="badge-whatsapp-new">
                    {whatsappStats.newMessages}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-6 mt-6">
              <EmailAgentTab user={user as any} />
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6 mt-6">
              <WhatsAppTab user={user as any} />
            </TabsContent>
          </Tabs>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
