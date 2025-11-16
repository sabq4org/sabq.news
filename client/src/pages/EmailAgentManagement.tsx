import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmailAgentStats, type EmailAgentStatsData } from "@/components/EmailAgentStats";
import { TrustedSendersTable } from "@/components/TrustedSendersTable";
import { AddSenderDialog } from "@/components/AddSenderDialog";
import { WebhookLogsTable } from "@/components/WebhookLogsTable";
import { EmailDetailsModal } from "@/components/EmailDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Mail, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { TrustedEmailSender, EmailWebhookLog } from "@shared/schema";

interface SenderFormValues {
  email: string;
  name: string;
  language: "ar" | "en" | "ur";
  autoPublish: boolean;
  defaultCategory?: string;
  status: "active" | "suspended" | "revoked";
  token?: string;
}

export default function EmailAgentManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSender, setEditingSender] = useState<TrustedEmailSender | null>(null);
  const [selectedLog, setSelectedLog] = useState<EmailWebhookLog | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logsStatusFilter, setLogsStatusFilter] = useState<string>("all");

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery<EmailAgentStatsData>({
    queryKey: ['/api/email-agent/stats'],
  });

  // Fetch trusted senders
  const {
    data: senders,
    isLoading: sendersLoading,
    refetch: refetchSenders,
  } = useQuery<TrustedEmailSender[]>({
    queryKey: ['/api/email-agent/senders'],
  });

  // Fetch webhook logs
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery<{ logs: EmailWebhookLog[]; total: number }>({
    queryKey: ['/api/email-agent/logs', logsPage, logsStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(logsPage),
        limit: '50',
      });
      if (logsStatusFilter !== 'all') {
        params.append('status', logsStatusFilter);
      }
      const res = await fetch(`/api/email-agent/logs?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('فشل في تحميل سجلات البريد');
      return await res.json();
    },
  });

  // Create sender mutation
  const createSenderMutation = useMutation({
    mutationFn: async (values: SenderFormValues) => {
      return await apiRequest('/api/email-agent/senders', {
        method: 'POST',
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-agent/senders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-agent/stats'] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المرسل الموثوق بنجاح",
      });
      setAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المرسل الموثوق",
        variant: "destructive",
      });
    },
  });

  // Update sender mutation
  const updateSenderMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<SenderFormValues>;
    }) => {
      return await apiRequest(`/api/email-agent/senders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-agent/senders'] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المرسل الموثوق بنجاح",
      });
      setEditingSender(null);
      setAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المرسل الموثوق",
        variant: "destructive",
      });
    },
  });

  // Delete sender mutation
  const deleteSenderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/email-agent/senders/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-agent/senders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email-agent/stats'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المرسل الموثوق بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المرسل الموثوق",
        variant: "destructive",
      });
    },
  });

  const handleAddSender = () => {
    setEditingSender(null);
    setAddDialogOpen(true);
  };

  const handleEditSender = (sender: TrustedEmailSender) => {
    setEditingSender(sender);
    setAddDialogOpen(true);
  };

  const handleSubmitSender = async (values: SenderFormValues) => {
    if (editingSender) {
      await updateSenderMutation.mutateAsync({
        id: editingSender.id,
        values,
      });
    } else {
      await createSenderMutation.mutateAsync(values);
    }
  };

  const handleDeleteSender = (senderId: string) => {
    deleteSenderMutation.mutate(senderId);
  };

  const handleToggleSenderStatus = (
    senderId: string,
    newStatus: "active" | "suspended"
  ) => {
    updateSenderMutation.mutate({
      id: senderId,
      values: { status: newStatus },
    });
  };

  const handleLogClick = (log: EmailWebhookLog) => {
    setSelectedLog(log);
  };

  const handleStatusFilter = (status: string) => {
    setLogsStatusFilter(status);
    setLogsPage(1); // Reset to first page when filtering
  };

  // Check permissions (requires admin.manage_settings)
  // For simplicity, we'll check if user has admin or system_admin role
  if (!user || (user.role !== 'admin' && user.role !== 'system_admin')) {
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">إدارة نظام البريد الذكي</h1>
            <p className="text-muted-foreground mt-1">
              إدارة المرسلين الموثوقين ومراقبة سجلات البريد الوارد
            </p>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              إحصائيات اليوم
            </CardTitle>
            <CardDescription>
              ملخص نشاط البريد الإلكتروني لهذا اليوم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailAgentStats data={stats} isLoading={statsLoading} />
          </CardContent>
        </Card>

        <Separator />

        {/* Trusted Senders Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  المرسلون الموثوقون
                </CardTitle>
                <CardDescription>
                  إدارة عناوين البريد الإلكتروني المصرح لها بالنشر التلقائي
                </CardDescription>
              </div>
              <Button
                onClick={handleAddSender}
                data-testid="button-add-sender"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة مرسل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TrustedSendersTable
              senders={senders}
              isLoading={sendersLoading}
              onEdit={handleEditSender}
              onDelete={handleDeleteSender}
              onToggleStatus={handleToggleSenderStatus}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Email Webhook Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              سجلات البريد الوارد
            </CardTitle>
            <CardDescription>
              جميع الرسائل المستلمة وحالة معالجتها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookLogsTable
              logs={logsData?.logs}
              isLoading={logsLoading}
              totalCount={logsData?.total || 0}
              currentPage={logsPage}
              pageSize={50}
              onPageChange={setLogsPage}
              onStatusFilter={handleStatusFilter}
              onRowClick={handleLogClick}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AddSenderDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={handleSubmitSender}
          editingSender={editingSender}
          isSubmitting={
            createSenderMutation.isPending || updateSenderMutation.isPending
          }
        />

        <EmailDetailsModal
          open={!!selectedLog}
          onOpenChange={(open) => !open && setSelectedLog(null)}
          log={selectedLog}
        />
      </div>
    </DashboardLayout>
  );
}
