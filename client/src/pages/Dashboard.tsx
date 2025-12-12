import { useQuery } from "@tanstack/react-query";
import { ExecutiveSummaryBar } from "@/components/dashboard/ExecutiveSummaryBar";
import { ActionRecommendations } from "@/components/dashboard/ActionRecommendations";
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard";
import { TeamActivityCard } from "@/components/dashboard/TeamActivityCard";
import { TopArticlesCard } from "@/components/dashboard/TopArticlesCard";
import type { DecisionDashboardResponse } from "@shared/schema";
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
  Headphones,
  Brain,
  Building2,
  Image,
  Bot,
  Blocks,
  HardDrive,
} from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { QuickActionsSection } from "@/components/QuickActionsSection";
import { OnlineModeratorsWidget } from "@/components/OnlineModeratorsWidget";
import { formatDistanceToNow, formatDistance } from "date-fns";
import { arSA } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo, useState } from "react";

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
  audioNewsletters?: {
    total: number;
    published: number;
    totalListens: number;
  };
  deepAnalyses?: {
    total: number;
    published: number;
  };
  publishers?: {
    total: number;
    active: number;
  };
  mediaLibrary?: {
    totalFiles: number;
    totalSize: number;
  };
  aiTasks?: {
    total: number;
    pending: number;
    completed: number;
  };
  aiImages?: {
    total: number;
    thisWeek: number;
  };
  smartBlocks?: {
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

  // Decision Dashboard Insights - Smart AI-powered dashboard
  const { data: decisionInsights, isLoading: isInsightsLoading } = useQuery<DecisionDashboardResponse>({
    queryKey: ["/api/dashboard/decision-insights"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  
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
      <div className="space-y-4">
        {/* Hero Section: Welcome + Executive Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          {/* Welcome Card - Compact */}
          <Card className="xl:col-span-8 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border-primary/20" data-testid="card-welcome">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" data-testid="icon-sparkles" />
                  <h2 className="text-xl font-bold bg-gradient-to-l from-primary to-accent-foreground bg-clip-text text-transparent" data-testid="text-greeting">
                    {greeting} يا {user?.firstName || user?.email?.split('@')[0] || "عزيزي"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span data-testid="text-current-time">
                    {new Date().toLocaleString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1" data-testid="text-motivational-quote">
                {motivationalQuote}
              </p>
            </CardContent>
          </Card>
          
          {/* Urgent Reminder - Inline */}
          <div className="xl:col-span-4">
            <UrgentReminderBanner />
          </div>
        </div>

        {/* Executive Summary Bar - Full Width */}
        <ExecutiveSummaryBar data={decisionInsights?.executiveSummary} isLoading={isInsightsLoading} />

        {/* Decision Intelligence Grid - 3 columns on large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <DailyBriefCard data={decisionInsights?.dailyBrief} isLoading={isInsightsLoading} />
          <ActionRecommendations recommendations={decisionInsights?.actionRecommendations} isLoading={isInsightsLoading} />
          <TeamActivityCard data={decisionInsights?.teamActivity} isLoading={isInsightsLoading} />
        </div>

        {/* Top Articles Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TopArticlesCard articles={decisionInsights?.topArticles} isLoading={isInsightsLoading} title="أفضل المقالات اليوم" />
          <TopArticlesCard articles={decisionInsights?.underperformingArticles} isLoading={isInsightsLoading} title="مقالات تحتاج مراجعة" showUnderperforming />
        </div>

        {/* Quick Actions + Stats Combined Row */}
        {user?.role !== 'comments_moderator' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
            <div className="xl:col-span-5">
              <QuickActionsSection />
            </div>
            <div className="xl:col-span-2">
              <OnlineModeratorsWidget />
            </div>
            <div className="xl:col-span-5 h-full">
              {/* Main Stats Inline */}
              <Card data-testid="card-main-stats" className="border-l-4 border-l-primary/50 h-full">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2" data-testid="title-main-stats">
                    <Activity className="h-4 w-4 text-primary" />
                    الإحصائيات الرئيسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  {isLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-24" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs" data-testid="card-articles-stats">
                        <FileText className="h-3 w-3 shrink-0" data-testid="icon-articles" />
                        <span className="font-medium" data-testid="text-articles-total">{stats?.articles.total || 0}</span>
                        <span className="text-blue-600/70 dark:text-blue-400/70">مقال</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-xs" data-testid="card-users-stats">
                        <Users className="h-3 w-3 shrink-0" data-testid="icon-users" />
                        <span className="font-medium" data-testid="text-users-total">{stats?.users.total || 0}</span>
                        <span className="text-purple-600/70 dark:text-purple-400/70">مستخدم</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs" data-testid="card-comments-stats">
                        <MessageSquare className="h-3 w-3 shrink-0" data-testid="icon-comments" />
                        <span className="font-medium" data-testid="text-comments-total">{stats?.comments.total || 0}</span>
                        <span className="text-green-600/70 dark:text-green-400/70">تعليق</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs" data-testid="card-views-stats">
                        <Eye className="h-3 w-3 shrink-0" data-testid="icon-views" />
                        <span className="font-medium" data-testid="text-views-total">{(stats?.articles.totalViews || 0).toLocaleString('ar-SA')}</span>
                        <span className="text-amber-600/70 dark:text-amber-400/70">مشاهدة</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* All Stats in 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Today's Activity */}
          <Card data-testid="card-today-activity" className="border-l-4 border-l-chart-2/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2" data-testid="title-today-activity">
                <TrendingUp className="h-3 w-3 text-chart-2" />
                نشاط اليوم
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              {isLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-primary/10 text-primary border-primary/30 text-xs" data-testid="card-views-today-stats">
                    <Activity className="h-3 w-3" data-testid="icon-views-today" />
                    <span className="font-bold" data-testid="text-views-today">{stats?.articles.viewsToday || 0}</span>
                    <span className="text-[10px] opacity-70" data-testid="text-views-today-description">مشاهدة</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-chart-2/10 text-chart-2 border-chart-2/30 text-xs" data-testid="card-active-today-stats">
                    <Users className="h-3 w-3" data-testid="icon-active-today" />
                    <span className="font-bold" data-testid="text-active-today">{stats?.users.activeToday || 0}</span>
                    <span className="text-[10px] opacity-70" data-testid="text-active-today-description">نشط</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-chart-3/10 text-chart-3 border-chart-3/30 text-xs" data-testid="card-reads-today-stats">
                    <FileText className="h-3 w-3" data-testid="icon-reads-today" />
                    <span className="font-bold" data-testid="text-reads-today">{stats?.engagement.readsToday || 0}</span>
                    <span className="text-[10px] opacity-70" data-testid="text-reads-today-description">قراءة</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-chart-4/10 text-chart-4 border-chart-4/30 text-xs" data-testid="card-engagement-today-stats">
                    <Heart className="h-3 w-3" data-testid="icon-engagement-today" />
                    <span className="font-bold" data-testid="text-engagement-today">{stats?.reactions.todayCount || 0}</span>
                    <span className="text-[10px] opacity-70" data-testid="text-engagement-today-description">تفاعل</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary Stats */}
          <Card data-testid="card-secondary-stats" className="border-l-4 border-l-muted-foreground/30">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2" data-testid="title-secondary-stats">
                <FolderTree className="h-3 w-3 text-muted-foreground" />
                إحصائيات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              {isLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-muted/50 text-xs" data-testid="card-categories-stats">
                    <FolderTree className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium" data-testid="text-categories-total">{stats?.categories.total || 0}</span>
                    <span className="text-[10px] text-muted-foreground">تصنيف</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-muted/50 text-xs" data-testid="card-abtests-stats">
                    <FlaskConical className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium" data-testid="text-abtests-total">{stats?.abTests.total || 0}</span>
                    <span className="text-[10px] text-muted-foreground">اختبار</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-muted/50 text-xs" data-testid="card-avg-time-stats">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium" data-testid="text-avg-time">
                      {(stats?.engagement.averageTimeOnSite || 0) > 0 ? `${Math.floor((stats?.engagement.averageTimeOnSite || 0) / 60)}:${String((stats?.engagement.averageTimeOnSite || 0) % 60).padStart(2, '0')}` : '-'}
                    </span>
                    <span className="text-[10px] text-muted-foreground" data-testid="text-avg-time-description">متوسط</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Services */}
          <Card data-testid="card-platform-services" className="border-l-4 border-l-purple-500/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2" data-testid="title-platform-services">
                <Headphones className="h-3 w-3 text-purple-500" />
                خدمات المنصة
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              {isLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-xs" data-testid="card-audio-newsletters-stats">
                    <Headphones className="h-3 w-3" data-testid="icon-audio-newsletters" />
                    <span className="font-medium" data-testid="text-audio-newsletters-total">{stats?.audioNewsletters?.total || 0}</span>
                    <span className="text-[10px] opacity-70">نشرة</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs" data-testid="card-deep-analyses-stats">
                    <Brain className="h-3 w-3" data-testid="icon-deep-analyses" />
                    <span className="font-medium" data-testid="text-deep-analyses-total">{stats?.deepAnalyses?.total || 0}</span>
                    <span className="text-[10px] opacity-70">تحليل</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs" data-testid="card-publishers-stats">
                    <Building2 className="h-3 w-3" data-testid="icon-publishers" />
                    <span className="font-medium" data-testid="text-publishers-total">{stats?.publishers?.total || 0}</span>
                    <span className="text-[10px] opacity-70">ناشر</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 text-xs" data-testid="card-media-library-stats">
                    <HardDrive className="h-3 w-3" data-testid="icon-media-library" />
                    <span className="font-medium" data-testid="text-media-library-total">{stats?.mediaLibrary?.totalFiles || 0}</span>
                    <span className="text-[10px] opacity-70">ملف</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card data-testid="card-ai-features" className="border-l-4 border-l-emerald-500/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2" data-testid="title-ai-features">
                <Bot className="h-3 w-3 text-emerald-500" />
                الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              {isLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs" data-testid="card-ai-tasks-stats">
                    <Bot className="h-3 w-3" data-testid="icon-ai-tasks" />
                    <span className="font-medium" data-testid="text-ai-tasks-total">{stats?.aiTasks?.total || 0}</span>
                    <span className="text-[10px] opacity-70">مهمة</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 text-xs" data-testid="card-ai-images-stats">
                    <Image className="h-3 w-3" data-testid="icon-ai-images" />
                    <span className="font-medium" data-testid="text-ai-images-total">{stats?.aiImages?.total || 0}</span>
                    <span className="text-[10px] opacity-70">صورة</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 text-xs" data-testid="card-smart-blocks-stats">
                    <Blocks className="h-3 w-3" data-testid="icon-smart-blocks" />
                    <span className="font-medium" data-testid="text-smart-blocks-total">{stats?.smartBlocks?.total || 0}</span>
                    <span className="text-[10px] opacity-70">قالب</span>
                  </div>
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
                <Link href="/dashboard/ai-moderation">الرقابة الذكية</Link>
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

        {/* Upcoming Reminders and Tasks - 2 columns on all screens */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6" data-testid="grid-reminders-tasks">
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
                      {(() => {
                        const reminderDate = new Date(reminder.reminderTime);
                        const now = new Date();
                        if (reminderDate > now) {
                          return `بعد ${formatDistance(reminderDate, now, { locale: arSA })}`;
                        } else {
                          return formatDistanceToNow(reminderDate, {
                            addSuffix: true,
                            locale: arSA,
                          });
                        }
                      })()}
                    </span>
                    <Badge variant="outline" data-testid={`badge-reminder-channel-${reminder.id}`}>
                      {reminder.channelType === 'IN_APP' ? 'داخل التطبيق' :
                       reminder.channelType === 'EMAIL' ? 'بريد إلكتروني' : 
                       reminder.channelType === 'WHATSAPP' ? 'واتساب' :
                       reminder.channelType === 'SLACK' ? 'سلاك' : 
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

// Component: Urgent Reminder Banner
function UrgentReminderBanner() {
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
                  تذكير قريب جداً
                </h3>
                <Badge 
                  variant="outline" 
                  className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700"
                  data-testid="badge-urgent-time"
                >
                  {minutesUntil > 0 ? `بعد ${minutesUntil} دقيقة` : 'الآن'}
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
                  {reminder.channelType === 'IN_APP' ? 'داخل التطبيق' :
                   reminder.channelType === 'EMAIL' ? 'بريد إلكتروني' : 
                   reminder.channelType === 'WHATSAPP' ? 'واتساب' :
                   reminder.channelType === 'SLACK' ? 'سلاك' : 
                   reminder.channelType}
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
              + {urgentReminders.length - 1} تذكير آخر قريب
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
