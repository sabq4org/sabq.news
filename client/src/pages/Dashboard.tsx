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
  Eye,
  Clock,
  TrendingUp,
  Sparkles,
  Bell,
  Calendar,
  ClipboardList,
  X,
  BellRing,
  PenSquare,
  FileEdit,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OnlineModeratorsWidget } from "@/components/OnlineModeratorsWidget";
import { formatDistanceToNow, formatDistance } from "date-fns";
import { arSA } from "date-fns/locale";
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

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  return "مساء الخير";
}

function Dashboard() {
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
  });

  const { data: decisionInsights, isLoading: isInsightsLoading } = useQuery<DecisionDashboardResponse>({
    queryKey: ["/api/dashboard/decision-insights"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
    staleTime: 5 * 60 * 1000,
  });

  const greeting = useMemo(() => getTimeBasedGreeting(), []);

  if (isUserLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header Section - Clean & Minimal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(224,30%,18%)] dark:text-foreground" style={{ fontFamily: 'Cairo, sans-serif' }} data-testid="text-greeting">
              {greeting}، {user?.firstName || user?.email?.split('@')[0] || "عزيزي"}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1" data-testid="text-current-date">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Cards Row - 4 Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Views Card */}
          <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="stat-card-views">
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Eye className="h-5 w-5 text-[hsl(224,65%,40%)]" data-testid="icon-views" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-views-value">
                      {(stats?.articles.totalViews || 0).toLocaleString('ar-SA')}
                    </p>
                    <p className="text-sm text-muted-foreground">مشاهدات</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Articles Card */}
          <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="stat-card-articles">
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <FileText className="h-5 w-5 text-[hsl(224,65%,40%)]" data-testid="icon-articles" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-articles-value">
                      {stats?.articles.total || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">مقالات</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="stat-card-users">
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Users className="h-5 w-5 text-[hsl(224,65%,40%)]" data-testid="icon-users" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-users-value">
                      {stats?.users.total || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">مستخدمون</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Card */}
          <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="stat-card-comments">
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <MessageSquare className="h-5 w-5 text-[hsl(224,65%,40%)]" data-testid="icon-comments" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-comments-value">
                      {stats?.comments.total || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">تعليقات</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        {user?.role !== 'comments_moderator' && (
          <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="card-quick-actions">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/article/new" data-testid="quick-action-create-news">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-white dark:bg-card hover-elevate active-elevate-2 cursor-pointer transition-all">
                    <PenSquare className="h-5 w-5 text-[hsl(224,65%,40%)]" />
                    <span className="text-sm font-medium">إنشاء خبر</span>
                  </div>
                </Link>
                <Link href="/dashboard/article/new" data-testid="quick-action-add-article">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-white dark:bg-card hover-elevate active-elevate-2 cursor-pointer transition-all">
                    <FileEdit className="h-5 w-5 text-[hsl(224,65%,40%)]" />
                    <span className="text-sm font-medium">إضافة مقال</span>
                  </div>
                </Link>
                <Link href="/dashboard/ai/deep" data-testid="quick-action-create-report">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-white dark:bg-card hover-elevate active-elevate-2 cursor-pointer transition-all">
                    <BarChart3 className="h-5 w-5 text-[hsl(224,65%,40%)]" />
                    <span className="text-sm font-medium">إنشاء تقرير</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts/Announcements Card */}
        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30 rounded-xl shadow-sm" data-testid="card-announcements">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" data-testid="icon-announcements" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                مرحباً بك في لوحة التحكم الجديدة! استكشف الميزات المحدّثة لإدارة المحتوى بكفاءة أعلى.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary Bar */}
        <ExecutiveSummaryBar data={decisionInsights?.executiveSummary} isLoading={isInsightsLoading} />

        {/* Decision Intelligence Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DailyBriefCard data={decisionInsights?.dailyBrief} isLoading={isInsightsLoading} />
          <ActionRecommendations recommendations={decisionInsights?.actionRecommendations} isLoading={isInsightsLoading} />
          <TeamActivityCard data={decisionInsights?.teamActivity} isLoading={isInsightsLoading} />
        </div>

        {/* Top Articles Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopArticlesCard articles={decisionInsights?.topArticles} isLoading={isInsightsLoading} title="أفضل المقالات اليوم" />
          <TopArticlesCard articles={decisionInsights?.underperformingArticles} isLoading={isInsightsLoading} title="مقالات تحتاج مراجعة" showUnderperforming />
        </div>

        {/* Online Moderators & Additional Stats - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OnlineModeratorsWidget />
          
          {/* Today's Activity Stats */}
          <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="card-today-activity">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[hsl(224,65%,40%)]" />
                نشاط اليوم
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-lg font-bold text-foreground">{stats?.articles.viewsToday || 0}</p>
                    <p className="text-xs text-muted-foreground">مشاهدات اليوم</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-lg font-bold text-foreground">{stats?.users.activeToday || 0}</p>
                    <p className="text-xs text-muted-foreground">مستخدم نشط</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-lg font-bold text-foreground">{stats?.engagement.readsToday || 0}</p>
                    <p className="text-xs text-muted-foreground">قراءات</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-lg font-bold text-foreground">{stats?.reactions.todayCount || 0}</p>
                    <p className="text-xs text-muted-foreground">تفاعلات</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders and Tasks - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="grid-reminders-tasks">
          <UpcomingRemindersWidget />
          <UpcomingTasksWidget />
        </div>
      </div>
    </DashboardLayout>
  );
}

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
    <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="card-upcoming-reminders">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4 text-[hsl(224,65%,40%)]" data-testid="icon-reminders" />
          التذكيرات القادمة
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
                className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30 hover-elevate transition-all"
                data-testid={`reminder-item-${reminder.id}`}
              >
                <h4 className="font-medium text-sm mb-2" data-testid={`text-reminder-title-${reminder.id}`}>
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
                  <Badge variant="outline" className="text-xs" data-testid={`badge-reminder-channel-${reminder.id}`}>
                    {reminder.channelType === 'IN_APP' ? 'داخل التطبيق' :
                     reminder.channelType === 'EMAIL' ? 'بريد إلكتروني' : 
                     reminder.channelType === 'WHATSAPP' ? 'واتساب' :
                     reminder.channelType === 'SLACK' ? 'سلاك' : 
                     reminder.channelType}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6 text-sm" data-testid="text-no-reminders">
            لا توجد تذكيرات قادمة
          </p>
        )}
      </CardContent>
    </Card>
  );
}

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
    <Card className="bg-white dark:bg-card rounded-xl shadow-sm border" data-testid="card-upcoming-tasks">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[hsl(224,65%,40%)]" data-testid="icon-tasks" />
          المهام القادمة
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
                className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30 hover-elevate transition-all"
                data-testid={`task-item-${task.id}`}
              >
                <h4 className="font-medium text-sm mb-2" data-testid={`text-task-title-${task.id}`}>
                  {task.eventTitle}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs" data-testid={`badge-task-role-${task.id}`}>
                    {task.role === 'coordinator' ? 'منسق' :
                     task.role === 'reporter' ? 'مراسل' :
                     task.role === 'photographer' ? 'مصور' :
                     task.role === 'editor' ? 'محرر' :
                     task.role}
                  </Badge>
                  <Badge 
                    variant={task.status === 'pending' ? 'outline' : 'default'}
                    className="text-xs"
                    data-testid={`badge-task-status-${task.id}`}
                  >
                    {task.status === 'pending' ? 'معلق' :
                     task.status === 'in_progress' ? 'قيد التنفيذ' :
                     task.status === 'completed' ? 'مكتمل' :
                     task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6 text-sm" data-testid="text-no-tasks">
            لا توجد مهام قادمة
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute requireStaff={true}>
      <Dashboard />
    </ProtectedRoute>
  );
}
