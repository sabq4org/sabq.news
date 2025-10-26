import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  Edit, 
  Trash2, 
  Archive, 
  Eye, 
  MousePointer, 
  XCircle,
  Users,
  Calendar,
  Radio,
  Target
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";

interface AnnouncementDetails {
  id: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  channels: string[];
  audienceRoles: string[] | null;
  audienceUserIds: string[] | null;
  startAt: string | null;
  endAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  publisher?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Analytics {
  totalImpressions: number;
  uniqueViews: number;
  dismissals: number;
  clicks: number;
  viewsByChannel: { channel: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
}

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: announcement, isLoading } = useQuery<AnnouncementDetails>({
    queryKey: ['/api/announcements', id],
  });

  const { data: analytics, isLoading: isLoadingAnalytics, isError: isErrorAnalytics } = useQuery<Analytics>({
    queryKey: [`/api/announcements/${id}/analytics`],
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: "✅ تم حذف الإعلان بنجاح" });
      setLocation('/dashboard/announcements');
    },
    onError: () => {
      toast({ title: "❌ فشل حذف الإعلان", variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiRequest(`/api/announcements/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: "✅ تم أرشفة الإعلان بنجاح" });
    },
    onError: () => {
      toast({ title: "❌ فشل أرشفة الإعلان", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary" as any, label: "مسودة" },
      scheduled: { variant: "default" as any, label: "مجدول" },
      published: { variant: "default" as any, label: "منشور" },
      expired: { variant: "destructive" as any, label: "منتهي" },
      archived: { variant: "outline" as any, label: "مؤرشف" },
    };
    const config = configs[status] || configs.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      low: { variant: "secondary" as any, label: "منخفض" },
      normal: { variant: "outline" as any, label: "عادي" },
      high: { variant: "destructive" as any, label: "عالي" },
    };
    const config = configs[priority] || configs.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      dashboardBanner: "بانر لوحة التحكم",
      inbox: "صندوق الوارد",
      toast: "إشعار منبثق",
    };
    return labels[channel] || channel;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "مدير النظام",
      editor: "محرر",
      reporter: "مراسل",
      reader: "قارئ",
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!announcement) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">الإعلان غير موجود</p>
          <Button
            onClick={() => setLocation('/dashboard/announcements')}
            className="mt-4"
          >
            العودة للقائمة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/dashboard/announcements')}
              data-testid="button-back"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{announcement.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(announcement.status)}
                {getPriorityBadge(announcement.priority)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation(`/dashboard/announcements/${id}/edit`)}
              data-testid="button-edit"
            >
              <Edit className="ml-2 h-4 w-4" />
              تعديل
            </Button>
            <Button
              variant="outline"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
              data-testid="button-archive"
            >
              <Archive className="ml-2 h-4 w-4" />
              أرشفة
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              data-testid="button-delete"
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoadingAnalytics ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : isErrorAnalytics ? (
            <Card className="col-span-4">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">فشل تحميل الإحصائيات</p>
              </CardContent>
            </Card>
          ) : analytics ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المشاهدات الكلية</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalImpressions.toLocaleString('ar-SA')}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المشاهدات الفريدة</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.uniqueViews.toLocaleString('ar-SA')}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">النقرات</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.clicks.toLocaleString('ar-SA')}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل النقر (CTR)</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.uniqueViews > 0 
                      ? ((analytics.clicks / analytics.uniqueViews) * 100).toFixed(2)
                      : '0.00'}%
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>محتوى الإعلان</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: announcement.message }}
            />
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Targeting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                الاستهداف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">القنوات</h4>
                <div className="flex flex-wrap gap-2">
                  {announcement.channels.map(channel => (
                    <Badge key={channel} variant="outline">
                      {getChannelLabel(channel)}
                    </Badge>
                  ))}
                </div>
              </div>

              {announcement.audienceRoles && announcement.audienceRoles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">الأدوار المستهدفة</h4>
                  <div className="flex flex-wrap gap-2">
                    {announcement.audienceRoles.map(role => (
                      <Badge key={role} variant="secondary">
                        {getRoleLabel(role)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {announcement.audienceUserIds && announcement.audienceUserIds.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">مستخدمون محددون</h4>
                  <p className="text-sm text-muted-foreground">
                    {announcement.audienceUserIds.length} مستخدم
                  </p>
                </div>
              )}

              {!announcement.audienceRoles && !announcement.audienceUserIds && (
                <p className="text-sm text-muted-foreground">
                  متاح لجميع المستخدمين
                </p>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                الجدولة والتواريخ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                <p className="font-medium">
                  {format(new Date(announcement.createdAt), "PPP - p", { locale: ar })}
                </p>
              </div>

              {announcement.publishedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ النشر</p>
                  <p className="font-medium">
                    {format(new Date(announcement.publishedAt), "PPP - p", { locale: ar })}
                  </p>
                </div>
              )}

              {announcement.startAt && (
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ البدء</p>
                  <p className="font-medium">
                    {format(new Date(announcement.startAt), "PPP - p", { locale: ar })}
                  </p>
                </div>
              )}

              {announcement.endAt && (
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                  <p className="font-medium">
                    {format(new Date(announcement.endAt), "PPP - p", { locale: ar })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                معلومات المنشئ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcement.creator && (
                <div>
                  <p className="text-sm text-muted-foreground">أنشأه</p>
                  <p className="font-medium">
                    {announcement.creator.firstName && announcement.creator.lastName
                      ? `${announcement.creator.firstName} ${announcement.creator.lastName}`
                      : announcement.creator.email}
                  </p>
                </div>
              )}

              {announcement.publisher && (
                <div>
                  <p className="text-sm text-muted-foreground">نشره</p>
                  <p className="font-medium">
                    {announcement.publisher.firstName && announcement.publisher.lastName
                      ? `${announcement.publisher.firstName} ${announcement.publisher.lastName}`
                      : announcement.publisher.email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>روابط سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation(`/dashboard/announcements/${id}/versions`)}
                data-testid="button-versions"
              >
                <Radio className="ml-2 h-4 w-4" />
                سجل الإصدارات
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setLocation(`/dashboard/announcements/${id}/analytics`)}
                data-testid="button-full-analytics"
              >
                <Target className="ml-2 h-4 w-4" />
                التحليلات التفصيلية
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الإعلان نهائياً. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
