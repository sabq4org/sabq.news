import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth, hasRole } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
  Sparkles,
  Bell,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";

interface AdminDashboardStats {
  articles: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    scheduled: number;
    totalViews: number;
    viewsToday: number;
  };
  users: {
    total: number;
    emailVerified: number;
    active24h: number;
    newThisWeek: number;
    activeToday: number;
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
    todayCount: number;
  };
  engagement: {
    averageTimeOnSite: number;
    totalReads: number;
    readsToday: number;
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

// Motivational quotes in Arabic
const MOTIVATIONAL_QUOTES = [
  "يوم جديد، إنجاز جديد ✨… خلنا نبدأ بقوّة يا بطل!",
  "ابدأ يومك بحماس، فكل فكرة منك تصنع فرقاً في سبق 💪",
  "صباح الذكاء والإبداع… أنت محور التميّز اليوم! 🚀",
  "تذكّر: الجودة تبدأ من التفاصيل الصغيرة 👀",
  "وجودك يصنع الأثر، ونتائجك تُلهم الفريق 🌟",
  "كل مقال تكتبه اليوم… بصمة تُضاف لتاريخ سبق 🖋️",
  "كن النسخة الأفضل من نفسك في كل مهمة 🔥",
  "الإتقان ما هو خيار… هو أسلوب حياة في سبق 👑",
  "ابدع كأنك تصنع خبراً يُقرأ لأول مرة 💡",
  "كل ضغطة زر منك تُحدث فرقاً في تجربة آلاف القراء 🌍",
];

// Get time-based greeting
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الخير";
}

// Get random motivational quote (changes on each visit)
function getRandomMotivationalQuote(): string {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[randomIndex];
}

function Dashboard() {
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
  });

  // Get greeting (memoized to avoid recalculation during re-renders)
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  
  // Get a fresh random quote on each render to ensure it changes on every visit
  const motivationalQuote = getRandomMotivationalQuote();

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Allow access to dashboard for all staff roles
  // The nav system will automatically filter menu items based on role permissions

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section with Greeting */}
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20" data-testid="card-welcome">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" data-testid="icon-sparkles" />
                  <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-greeting">
                    {greeting} يا {user?.firstName || user?.email?.split('@')[0] || "عزيزي"}
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl" data-testid="text-motivational-quote">
                  {motivationalQuote}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span data-testid="text-current-time">
                    {new Date().toLocaleString('ar-SA', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                    {stats?.articles.published || 0} منشور · {stats?.articles.draft || 0} مسودة · {stats?.articles.scheduled || 0} مجدولة
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
                    {stats?.articles.totalViews || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-views-description">
                    إجمالي مشاهدات المقالات
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card data-testid="card-views-today-stats" className="border-l-4 border-l-primary/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المشاهدات اليوم</CardTitle>
              <Activity className="h-4 w-4 text-primary" data-testid="icon-views-today" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary" data-testid="text-views-today">
                    {stats?.articles.viewsToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-views-today-description">
                    مشاهدة جديدة اليوم
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-active-today-stats" className="border-l-4 border-l-chart-2/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القراء النشطون اليوم</CardTitle>
              <Users className="h-4 w-4 text-chart-2" data-testid="icon-active-today" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-chart-2" data-testid="text-active-today">
                    {stats?.users.activeToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-active-today-description">
                    زائر نشط حالياً
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-reads-today-stats" className="border-l-4 border-l-chart-3/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القراءات اليوم</CardTitle>
              <FileText className="h-4 w-4 text-chart-3" data-testid="icon-reads-today" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-chart-3" data-testid="text-reads-today">
                    {stats?.engagement.readsToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-reads-today-description">
                    من {stats?.engagement.totalReads || 0} إجمالي
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-engagement-today-stats" className="border-l-4 border-l-chart-4/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التفاعل اليوم</CardTitle>
              <Heart className="h-4 w-4 text-chart-4" data-testid="icon-engagement-today" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-chart-4" data-testid="text-engagement-today">
                    {stats?.reactions.todayCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-engagement-today-description">
                    من {stats?.reactions.total || 0} إجمالي
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

          <Card data-testid="card-avg-time-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط وقت القراءة</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-avg-time">
                    {Math.floor((stats?.engagement.averageTimeOnSite || 0) / 60)}:{String((stats?.engagement.averageTimeOnSite || 0) % 60).padStart(2, '0')}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-avg-time-description">
                    دقيقة:ثانية لكل مقال
                  </p>
                </>
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
                          <ViewsCount 
                            views={article.views}
                            iconClassName="h-3 w-3"
                          />
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

        {/* Upcoming Reminders and Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-reminders-tasks">
          <UpcomingRemindersWidget />
          <UpcomingTasksWidget />
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
                          <ViewsCount 
                            views={article.views}
                            iconClassName="h-3 w-3"
                          />
                          <span>مشاهدة</span>
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

// Widget: Upcoming Reminders
function UpcomingRemindersWidget() {
  const { data: reminders, isLoading } = useQuery<Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    reminderTime: string;
    channelType: string;
  }>>({
    queryKey: ["/api/calendar/upcoming-reminders"],
  });

  return (
    <Card data-testid="card-upcoming-reminders">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" data-testid="icon-reminders" />
          التذكيرات القادمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" data-testid={`skeleton-reminder-${i}`} />
            ))}
          </div>
        ) : reminders && reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-3 border rounded-lg hover-elevate transition-all"
                data-testid={`reminder-item-${reminder.id}`}
              >
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium text-sm" data-testid={`text-reminder-title-${reminder.id}`}>
                    {reminder.eventTitle}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-reminder-time-${reminder.id}`}>
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(reminder.reminderTime), {
                        addSuffix: true,
                        locale: arSA,
                      })}
                    </span>
                    <Badge variant="outline" data-testid={`badge-reminder-channel-${reminder.id}`}>
                      {reminder.channelType === 'email' ? 'بريد إلكتروني' : 
                       reminder.channelType === 'sms' ? 'رسالة نصية' :
                       reminder.channelType === 'push' ? 'إشعار' : 
                       reminder.channelType}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-reminders">
            لا توجد تذكيرات قادمة
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Widget: Upcoming Tasks
function UpcomingTasksWidget() {
  const { data: tasks, isLoading } = useQuery<Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    role: string;
    status: string;
  }>>({
    queryKey: ["/api/calendar/my-assignments"],
    queryFn: async () => {
      const response = await fetch("/api/calendar/my-assignments?status=pending");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });

  return (
    <Card data-testid="card-upcoming-tasks">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" data-testid="icon-tasks" />
          المهام القادمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" data-testid={`skeleton-task-${i}`} />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 border rounded-lg hover-elevate transition-all"
                data-testid={`task-item-${task.id}`}
              >
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium text-sm" data-testid={`text-task-title-${task.id}`}>
                    {task.eventTitle}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" data-testid={`badge-task-role-${task.id}`}>
                      {task.role === 'coordinator' ? 'منسق' :
                       task.role === 'reporter' ? 'مراسل' :
                       task.role === 'photographer' ? 'مصور' :
                       task.role === 'editor' ? 'محرر' :
                       task.role}
                    </Badge>
                    <Badge 
                      variant={task.status === 'pending' ? 'outline' : 'default'}
                      data-testid={`badge-task-status-${task.id}`}
                    >
                      {task.status === 'pending' ? 'معلق' :
                       task.status === 'in_progress' ? 'قيد التنفيذ' :
                       task.status === 'completed' ? 'مكتمل' :
                       task.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-tasks">
            لا توجد مهام قادمة
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Wrap with Protected Route for staff-only access
export default function ProtectedDashboard() {
  return (
    <ProtectedRoute requireStaff={true}>
      <Dashboard />
    </ProtectedRoute>
  );
}
