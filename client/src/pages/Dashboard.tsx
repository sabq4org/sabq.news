import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth, hasRole } from "@/hooks/useAuth";
import {
  FileText,
  Users,
  MessageSquare,
  FolderTree,
  FlaskConical,
  Heart,
  TrendingUp,
  Clock,
  Eye,
  Archive,
  FileEdit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdminDashboardStats {
  articles: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalViews: number;
  };
  users: {
    total: number;
    emailVerified: number;
    active24h: number;
    newThisWeek: number;
  };
  comments: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  categories: {
    total: number;
  };
  abTests: {
    total: number;
    running: number;
  };
  reactions: {
    total: number;
  };
  recentArticles: Array<{
    id: string;
    title: string;
    status: string;
    views: number;
    createdAt: string;
    author?: {
      firstName?: string;
      lastName?: string;
      email: string;
    };
  }>;
  recentComments: Array<{
    id: string;
    content: string;
    status: string;
    createdAt: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email: string;
    };
  }>;
  topArticles: Array<{
    id: string;
    title: string;
    views: number;
    createdAt: string;
    category?: {
      nameAr: string;
    };
  }>;
}

export default function Dashboard() {
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      published: "default",
      draft: "secondary",
      pending: "outline",
      approved: "default",
      rejected: "destructive",
      archived: "outline",
    };
    const labels: Record<string, string> = {
      published: "منشور",
      draft: "مسودة",
      pending: "قيد المراجعة",
      approved: "موافق عليه",
      rejected: "مرفوض",
      archived: "مؤرشف",
    };
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Chart colors
  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  // Prepare chart data
  const articleChartData = stats ? [
    { name: "منشور", value: stats.articles.published, color: COLORS[0] },
    { name: "مسودة", value: stats.articles.draft, color: COLORS[1] },
    { name: "مؤرشف", value: stats.articles.archived, color: COLORS[2] },
  ] : [];

  const commentChartData = stats ? [
    { name: "موافق", value: stats.comments.approved, color: COLORS[0] },
    { name: "قيد المراجعة", value: stats.comments.pending, color: COLORS[1] },
    { name: "مرفوض", value: stats.comments.rejected, color: COLORS[2] },
  ] : [];

  if (isUserLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has permission to view admin dashboard
  const allowedRoles = ["system_admin", "admin", "editor"];
  if (!user.role || !allowedRoles.includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full" data-testid="card-unauthorized">
            <CardHeader>
              <CardTitle className="text-center text-destructive" data-testid="heading-unauthorized">
                غير مصرح
              </CardTitle>
              <CardDescription className="text-center" data-testid="text-unauthorized-description">
                لا تملك صلاحية الوصول إلى لوحة التحكم الرئيسية.
                <br />
                هذه الصفحة متاحة فقط للمحررين والمسؤولين.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild data-testid="button-back-home">
                <Link href="/">العودة للرئيسية</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
            لوحة التحكم الرئيسية
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-dashboard-subtitle">
            إحصائيات شاملة لجميع أقسام المنصة
          </p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Articles Stats */}
          <Card data-testid="card-articles-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المقالات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" data-testid="icon-articles" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-articles-total">
                    {stats?.articles.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-articles-breakdown">
                    {stats?.articles.published || 0} منشور · {stats?.articles.draft || 0} مسودة
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Users Stats */}
          <Card data-testid="card-users-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" data-testid="icon-users" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-users-total">
                    {stats?.users.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-users-breakdown">
                    {stats?.users.active24h || 0} نشط اليوم · {stats?.users.newThisWeek || 0} جديد هذا الأسبوع
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Comments Stats */}
          <Card data-testid="card-comments-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التعليقات</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" data-testid="icon-comments" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-comments-total">
                    {stats?.comments.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-comments-breakdown">
                    {stats?.comments.pending || 0} قيد المراجعة · {stats?.comments.approved || 0} موافق عليه
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Views Stats */}
          <Card data-testid="card-views-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المشاهدات الكلية</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" data-testid="icon-views" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-views-total">
                    {stats?.articles.totalViews.toLocaleString('ar-EG') || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-views-description">
                    إجمالي مشاهدات المقالات
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-categories-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التصنيفات</CardTitle>
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-categories-total">
                  {stats?.categories.total || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-abtests-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اختبارات A/B</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-abtests-total">
                    {stats?.abTests.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-abtests-running">
                    {stats?.abTests.running || 0} قيد التشغيل
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-reactions-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعجابات</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-reactions-total">
                  {stats?.reactions.total.toLocaleString('ar-EG') || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Articles Distribution */}
          <Card data-testid="card-articles-chart">
            <CardHeader>
              <CardTitle>توزيع المقالات</CardTitle>
              <CardDescription>حسب الحالة</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={articleChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {articleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Comments Distribution */}
          <Card data-testid="card-comments-chart">
            <CardHeader>
              <CardTitle>توزيع التعليقات</CardTitle>
              <CardDescription>حسب الحالة</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={commentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Articles */}
          <Card data-testid="card-recent-articles">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>أحدث المقالات</CardTitle>
                <CardDescription>آخر 5 مقالات تم إنشاؤها</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" data-testid="button-view-all-articles">
                <Link href="/dashboard/articles">عرض الكل</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : stats?.recentArticles && stats.recentArticles.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover-elevate transition-all"
                      data-testid={`recent-article-${article.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate text-sm" data-testid={`text-article-title-${article.id}`}>
                            {article.title}
                          </h4>
                          {getStatusBadge(article.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(article.createdAt), {
                              addSuffix: true,
                              locale: arSA,
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-recent-articles">
                  لا توجد مقالات حديثة
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card data-testid="card-recent-comments">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>أحدث التعليقات</CardTitle>
                <CardDescription>آخر 5 تعليقات</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" data-testid="button-view-all-comments">
                <Link href="/dashboard/comments">عرض الكل</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : stats?.recentComments && stats.recentComments.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover-elevate transition-all"
                      data-testid={`recent-comment-${comment.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm truncate" data-testid={`text-comment-content-${comment.id}`}>
                            {comment.content.substring(0, 80)}...
                          </p>
                          {getStatusBadge(comment.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {comment.user?.firstName || comment.user?.email || "مستخدم"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: arSA,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-recent-comments">
                  لا توجد تعليقات حديثة
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Articles */}
        <Card data-testid="card-top-articles">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  أكثر المقالات مشاهدة
                </CardTitle>
                <CardDescription>أفضل 5 مقالات من حيث عدد المشاهدات</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.topArticles && stats.topArticles.length > 0 ? (
              <div className="space-y-4">
                {stats.topArticles.map((article, index) => (
                  <div
                    key={article.id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover-elevate transition-all"
                    data-testid={`top-article-${article.id}`}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm mb-1" data-testid={`text-top-article-title-${article.id}`}>
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {article.category && (
                          <Badge variant="outline" className="text-xs">
                            {article.category.nameAr}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views.toLocaleString('ar-EG')} مشاهدة
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-top-articles">
                لا توجد مقالات
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
