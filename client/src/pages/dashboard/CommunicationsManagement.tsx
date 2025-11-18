import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import EmailAgentTab from "@/components/communications/EmailAgentTab";
import WhatsAppTab from "@/components/communications/WhatsAppTab";

export default function CommunicationsManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("email");

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
              </TabsTrigger>
              <TabsTrigger value="whatsapp" data-testid="tab-whatsapp" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                واتساب
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-6 mt-6">
              <EmailAgentTab user={user} />
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6 mt-6">
              <WhatsAppTab user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
