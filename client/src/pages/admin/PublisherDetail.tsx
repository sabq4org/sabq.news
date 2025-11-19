import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PublisherDialog } from "@/components/admin/PublisherDialog";
import { PublisherStatusBadge } from "@/components/admin/PublisherStatusBadge";
import { CreditsAdjustmentForm } from "@/components/admin/CreditsAdjustmentForm";
import { MobileOptimizedKpiCard } from "@/components/MobileOptimizedKpiCard";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function PublisherDetail() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/publishers/:id");
  const publisherId = params?.id;

  const [showEditDialog, setShowEditDialog] = useState(false);

  // RBAC Guard: Admin only
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin' && user.role !== 'system_admin') {
      navigate('/');
      toast({ 
        title: 'غير مصرح', 
        description: 'ليس لديك صلاحية الوصول لهذه الصفحة', 
        variant: 'destructive' 
      });
    }
  }, [user, navigate, toast]);

  if (!user || (user.role !== 'admin' && user.role !== 'system_admin')) {
    return null;
  }

  // Fetch publisher details
  const { data: publisher, isLoading } = useQuery({
    queryKey: ["/api/admin/publishers", publisherId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/publishers/${publisherId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch publisher");
      return response.json();
    },
    enabled: !!publisherId,
  });

  // Fetch credits history
  const { data: creditsData } = useQuery({
    queryKey: ["/api/publisher/credits", publisherId],
    queryFn: async () => {
      const response = await fetch(`/api/publisher/credits?publisherId=${publisherId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch credits");
      return response.json();
    },
    enabled: !!publisherId,
  });

  // Fetch activity logs
  const { data: logsData } = useQuery({
    queryKey: ["/api/publisher/logs", publisherId],
    queryFn: async () => {
      const response = await fetch(`/api/publisher/logs?publisherId=${publisherId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
    enabled: !!publisherId,
  });

  // Fetch articles
  const { data: articlesData } = useQuery({
    queryKey: ["/api/publisher/articles", publisherId],
    queryFn: async () => {
      const response = await fetch(`/api/publisher/articles?publisherId=${publisherId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
    enabled: !!publisherId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 space-y-6" dir="rtl">
          <div className="h-8 bg-muted animate-pulse rounded-md w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!publisher) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6" dir="rtl">
          <div className="text-center py-12">
            <p className="text-lg">الناشر غير موجود</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const credits = creditsData?.credits || [];
  const remainingCredits = creditsData?.remainingCredits || 0;
  const logs = logsData?.logs || [];
  const articles = articlesData?.articles || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/publishers" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="heading-publisher-name">
                {publisher.agencyName}
              </h1>
              <p className="text-muted-foreground">{publisher.contactPersonName}</p>
            </div>
          </div>
          <Button onClick={() => setShowEditDialog(true)} data-testid="button-edit-publisher">
            <Edit className="h-4 w-4 ml-2" />
            تعديل
          </Button>
        </div>

        {/* Publisher Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الناشر</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
              <p className="font-medium" data-testid="text-email">{publisher.email}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">رقم الهاتف</span>
              <p className="font-medium" data-testid="text-phone">{publisher.phone}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">نوع الباقة</span>
              <p className="font-medium" data-testid="text-package">{publisher.packageType}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">الحالة</span>
              <div className="mt-1">
                <PublisherStatusBadge
                  status={publisher.isActive ? "active" : "inactive"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MobileOptimizedKpiCard
            title="إجمالي المقالات"
            value={publisher.totalArticles || 0}
            icon={FileText}
            data-testid="card-total-articles"
          />
          <MobileOptimizedKpiCard
            title="قيد المراجعة"
            value={publisher.pendingArticles || 0}
            icon={Clock}
            variant="warning"
            data-testid="card-pending"
          />
          <MobileOptimizedKpiCard
            title="موافق عليها"
            value={publisher.approvedArticles || 0}
            icon={CheckCircle}
            variant="success"
            data-testid="card-approved"
          />
          <MobileOptimizedKpiCard
            title="مرفوضة"
            value={publisher.rejectedArticles || 0}
            icon={XCircle}
            variant="error"
            data-testid="card-rejected"
          />
          <MobileOptimizedKpiCard
            title="تحتاج تعديل"
            value={publisher.revisionRequiredArticles || 0}
            icon={AlertCircle}
            data-testid="card-needs-revision"
          />
          <MobileOptimizedKpiCard
            title="الرصيد المتبقي"
            value={remainingCredits}
            icon={CreditCard}
            data-testid="card-credits"
          />
        </div>

        {/* Credits Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>سجل النقاط</CardTitle>
            </CardHeader>
            <CardContent>
              {credits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-credits">
                  <p>لا توجد سجلات</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">الباقة</TableHead>
                        <TableHead className="text-right">الملاحظات</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credits.map((credit: any) => (
                        <TableRow key={credit.id} data-testid={`row-credit-${credit.id}`}>
                          <TableCell>
                            <Badge variant="outline">
                              {credit.type === "package_purchase" && "شراء باقة"}
                              {credit.type === "bonus" && "مكافأة"}
                              {credit.type === "deduction" && "خصم"}
                              {credit.type === "adjustment" && "تعديل"}
                            </Badge>
                          </TableCell>
                          <TableCell className={credit.credits < 0 ? "text-destructive" : "text-green-600"}>
                            {credit.credits > 0 ? "+" : ""}{credit.credits}
                          </TableCell>
                          <TableCell>{credit.packageType || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {credit.notes || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDistanceToNow(new Date(credit.createdAt), {
                              locale: ar,
                              addSuffix: true,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إدارة النقاط</CardTitle>
            </CardHeader>
            <CardContent>
              <CreditsAdjustmentForm publisherId={publisherId!} />
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>سجل النشاط</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-logs">
                <p>لا توجد سجلات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any, index: number) => (
                  <div
                    key={log.id}
                    className="flex gap-4 pb-4 border-b last:border-0"
                    data-testid={`row-activity-${index}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {log.action === "created" && "إنشاء"}
                          {log.action === "updated" && "تحديث"}
                          {log.action === "approved" && "موافقة"}
                          {log.action === "rejected" && "رفض"}
                          {log.action === "revision_requested" && "طلب تعديل"}
                          {log.action === "credits_added" && "إضافة نقاط"}
                          {log.action === "credits_deducted" && "خصم نقاط"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            locale: ar,
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Articles List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>المقالات</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/publishers/review" data-testid="button-view-all-articles">
                  عرض جميع المقالات
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-articles">
                <p>لا توجد مقالات</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.slice(0, 10).map((article: any) => (
                      <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                        <TableCell className="font-medium">{article.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              article.publisherStatus === "approved"
                                ? "default"
                                : article.publisherStatus === "rejected"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {article.publisherStatus === "pending" && "قيد المراجعة"}
                            {article.publisherStatus === "approved" && "موافق عليه"}
                            {article.publisherStatus === "rejected" && "مرفوض"}
                            {article.publisherStatus === "revision_required" && "يحتاج تعديل"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(article.createdAt), {
                            locale: ar,
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/articles/${article.id}`}>
                              عرض
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PublisherDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        publisher={publisher}
      />
    </DashboardLayout>
  );
}
