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
  X,
  BellRing,
} from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatDistanceToNow, formatDistance } from "date-fns";
import { arSA } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

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

// Get time-based greeting key
function getTimeBasedGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetings.morning";
  if (hour < 18) return "dashboard.greetings.afternoon";
  return "dashboard.greetings.evening";
}

// Get random motivational quote key (changes on each visit)
function getRandomMotivationalQuoteKey(): string {
  const randomIndex = Math.floor(Math.random() * 10) + 1;
  return `dashboard.motivationalQuotes.quote${randomIndex}`;
}

function Dashboard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard/stats", language],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
  });

  // Get greeting key (memoized to avoid recalculation during re-renders)
  const greetingKey = useMemo(() => getTimeBasedGreetingKey(), []);
  
  // Get a fresh random quote key on each render to ensure it changes on every visit
  const motivationalQuoteKey = getRandomMotivationalQuoteKey();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      published: "default",
      draft: "secondary",
      pending: "outline",
      approved: "default",
      rejected: "destructive",
      archived: "outline",
    };
    const statusKey = `dashboard.status.${status}`;
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
        {t(statusKey)}
      </Badge>
    );
  };

  // Chart colors
  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  // Prepare chart data
  const articleChartData = stats ? [
    { name: t('dashboard.status.published'), value: stats.articles.published, color: COLORS[0] },
    { name: t('dashboard.status.draft'), value: stats.articles.draft, color: COLORS[1] },
    { name: t('dashboard.status.archived'), value: stats.articles.archived, color: COLORS[2] },
  ] : [];

  const commentChartData = stats ? [
    { name: t('dashboard.status.approved'), value: stats.comments.approved, color: COLORS[0] },
    { name: t('dashboard.status.pending'), value: stats.comments.pending, color: COLORS[1] },
    { name: t('dashboard.status.rejected'), value: stats.comments.rejected, color: COLORS[2] },
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
        <Card className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border-primary/20 shadow-sm shadow-indigo-50 dark:shadow-none" data-testid="card-welcome">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" data-testid="icon-sparkles" />
                    <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md animate-pulse"></div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-primary to-accent-foreground bg-clip-text text-transparent" data-testid="text-greeting">
                    {t(greetingKey)} يا {user?.firstName || user?.email?.split('@')[0] || t('dashboard.greetings.dear')}
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl" data-testid="text-motivational-quote">
                  {t(motivationalQuoteKey)}
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

        {/* Urgent Reminder Banner */}
        <UrgentReminderBanner />

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Articles Stats */}
          <Card className="shadow-sm shadow-indigo-50 dark:shadow-none hover-elevate transition-all" data-testid="card-articles-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.articles')}</CardTitle>
              <div className="p-2 rounded-md bg-accent-blue/30">
                <FileText className="h-4 w-4 text-primary" data-testid="icon-articles" />
              </div>
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
                    {stats?.articles.published || 0} {t('dashboard.stats.publishedCount')} · {stats?.articles.draft || 0} {t('dashboard.stats.draftCount')} · {stats?.articles.scheduled || 0} {t('dashboard.stats.scheduledCount')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Users Stats */}
          <Card className="shadow-sm shadow-indigo-50 dark:shadow-none hover-elevate transition-all" data-testid="card-users-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.users')}</CardTitle>
              <div className="p-2 rounded-md bg-accent-purple/30">
                <Users className="h-4 w-4 text-accent-foreground" data-testid="icon-users" />
              </div>
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
                    {stats?.users.active24h || 0} {t('dashboard.stats.activeTodayCount')} · {stats?.users.newThisWeek || 0} {t('dashboard.stats.newThisWeekCount')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Comments Stats */}
          <Card className="shadow-sm shadow-indigo-50 dark:shadow-none hover-elevate transition-all" data-testid="card-comments-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.comments')}</CardTitle>
              <div className="p-2 rounded-md bg-accent-green/30">
                <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" data-testid="icon-comments" />
              </div>
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
                    {stats?.comments.pending || 0} {t('dashboard.stats.pendingCount')} · {stats?.comments.approved || 0} {t('dashboard.stats.approvedCount')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Views Stats */}
          <Card className="shadow-sm shadow-indigo-50 dark:shadow-none hover-elevate transition-all" data-testid="card-views-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalViews')}</CardTitle>
              <div className="p-2 rounded-md bg-accent-blue/30">
                <Eye className="h-4 w-4 text-primary" data-testid="icon-views" />
              </div>
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
                    {t('dashboard.stats.totalViewsDescription')}
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
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.viewsToday')}</CardTitle>
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
                    {t('dashboard.stats.newViewsToday')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-active-today-stats" className="border-l-4 border-l-chart-2/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.activeToday')}</CardTitle>
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
                    {t('dashboard.stats.activeVisitorNow')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-reads-today-stats" className="border-l-4 border-l-chart-3/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.readsToday')}</CardTitle>
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
                    {t('dashboard.stats.ofTotal', { total: stats?.engagement.totalReads || 0 })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-engagement-today-stats" className="border-l-4 border-l-chart-4/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.engagementToday')}</CardTitle>
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
                    {t('dashboard.stats.ofTotal', { total: stats?.reactions.total || 0 })}
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
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.categories')}</CardTitle>
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
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.abTests')}</CardTitle>
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
                    {t('dashboard.stats.runningTests', { count: stats?.abTests.running || 0 })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-avg-time-stats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.avgReadTime')}</CardTitle>
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
                    {t('dashboard.stats.timePerArticle')}
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
              <CardTitle>{t('dashboard.charts.articlesDistribution')}</CardTitle>
              <CardDescription>{t('dashboard.charts.byStatus')}</CardDescription>
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
              <CardTitle>{t('dashboard.charts.commentsDistribution')}</CardTitle>
              <CardDescription>{t('dashboard.charts.byStatus')}</CardDescription>
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
                <CardTitle>{t('dashboard.recentArticles.title')}</CardTitle>
                <CardDescription>{t('dashboard.recentArticles.description')}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" data-testid="button-view-all-articles">
                <Link href="/dashboard/articles">{t('dashboard.recentArticles.viewAll')}</Link>
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
                  {t('dashboard.recentArticles.noArticles')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card data-testid="card-recent-comments">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.recentComments.title')}</CardTitle>
                <CardDescription>{t('dashboard.recentComments.description')}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" data-testid="button-view-all-comments">
                <Link href="/dashboard/comments">{t('dashboard.recentComments.viewAll')}</Link>
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
                            {comment.user?.firstName || comment.user?.email || t('dashboard.recentComments.user')}
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
                  {t('dashboard.recentComments.noComments')}
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
                  {t('dashboard.topArticles.title')}
                </CardTitle>
                <CardDescription>{t('dashboard.topArticles.description')}</CardDescription>
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
                          <span>{t('dashboard.stats.viewsLabel')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-top-articles">
                {t('dashboard.topArticles.noArticles')}
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
  const { t } = useTranslation();
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
          {t('dashboard.reminders.title')}
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
                      {(() => {
                        const reminderDate = new Date(reminder.reminderTime);
                        const now = new Date();
                        if (reminderDate > now) {
                          return `${t('dashboard.reminders.after')} ${formatDistance(reminderDate, now, { locale: arSA })}`;
                        } else {
                          return formatDistanceToNow(reminderDate, {
                            addSuffix: true,
                            locale: arSA,
                          });
                        }
                      })()}
                    </span>
                    <Badge variant="outline" data-testid={`badge-reminder-channel-${reminder.id}`}>
                      {t(`dashboard.reminders.channels.${reminder.channelType}`) || reminder.channelType}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-reminders">
            {t('dashboard.reminders.noReminders')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Widget: Upcoming Tasks
function UpcomingTasksWidget() {
  const { t } = useTranslation();
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
          {t('dashboard.tasks.title')}
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
                      {t(`dashboard.tasks.roles.${task.role}`) || task.role}
                    </Badge>
                    <Badge 
                      variant={task.status === 'pending' ? 'outline' : 'default'}
                      data-testid={`badge-task-status-${task.id}`}
                    >
                      {t(`dashboard.tasks.statuses.${task.status}`) || task.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-tasks">
            {t('dashboard.tasks.noTasks')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Component: Urgent Reminder Banner
function UrgentReminderBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  
  const { data: reminders, isLoading } = useQuery<Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    reminderTime: string;
    channelType: string;
  }>>({
    queryKey: ["/api/calendar/upcoming-reminders"],
  });

  // Filter reminders that are within 1 hour
  const urgentReminders = useMemo(() => {
    if (!reminders) return [];
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderTime);
      return reminderDate >= now && reminderDate <= oneHourFromNow;
    });
  }, [reminders]);

  if (isLoading || dismissed || urgentReminders.length === 0) {
    return null;
  }

  const reminder = urgentReminders[0];
  const reminderDate = new Date(reminder.reminderTime);
  const now = new Date();
  const minutesUntil = Math.floor((reminderDate.getTime() - now.getTime()) / (1000 * 60));

  return (
    <div 
      className="relative bg-gradient-to-r from-blue-50/80 via-blue-50/50 to-blue-50/80 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-blue-950/30 border-r-4 border-r-blue-400 rounded-lg p-4 shadow-sm"
      data-testid="banner-urgent-reminder"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" data-testid="icon-bell-ring" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100" data-testid="text-banner-title">
                  {t('dashboard.reminders.urgentTitle')}
                </h3>
                <Badge 
                  variant="outline" 
                  className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700"
                  data-testid="badge-urgent-time"
                >
                  {minutesUntil > 0 ? t('dashboard.reminders.urgentMinutes', { minutes: minutesUntil }) : t('dashboard.reminders.urgentNow')}
                </Badge>
              </div>
              
              <Link href={`/calendar/${reminder.eventId}`} data-testid="link-reminder-event">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2 hover:underline" data-testid="text-banner-event">
                  {reminder.eventTitle}
                </p>
              </Link>
              
              <div className="flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {reminderDate.toLocaleString('ar-SA', { 
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="text-blue-500 dark:text-blue-400">•</span>
                <span>
                  {t(`dashboard.reminders.channels.${reminder.channelType}`) || reminder.channelType}
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              data-testid="button-dismiss-banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {urgentReminders.length > 1 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2" data-testid="text-more-reminders">
              {t('dashboard.reminders.moreReminders', { count: urgentReminders.length - 1 })}
            </p>
          )}
        </div>
      </div>
    </div>
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
