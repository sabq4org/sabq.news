import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth, hasRole } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  CalendarDays,
  Award,
  Star,
  Bell,
  Heart,
  MessageCircle,
  Bookmark,
  ChevronLeft,
  Sparkles,
  Target,
  BarChart3,
  Fingerprint,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
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

const MOTIVATIONAL_QUOTES = [
  "كل إنجاز عظيم كان في البداية مجرد فكرة",
  "النجاح هو حصيلة جهود صغيرة تتراكم يوماً بعد يوم",
  "ابدأ من حيث أنت، واستخدم ما لديك، وافعل ما تستطيع",
  "الطموح هو بوصلة النجاح",
  "كل يوم هو فرصة جديدة للتميز",
  "العمل الجاد يهزم الموهبة عندما لا تعمل الموهبة بجد",
  "النجاح ليس نهائياً والفشل ليس قاتلاً",
  "الإتقان ليس فعلاً بل عادة",
  "الفرص لا تأتي، بل تُصنع",
  "كن التغيير الذي تريد أن تراه",
];

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الخير";
}

function getRandomMotivationalQuote(): string {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[randomIndex];
}

function getHijriDate(): string {
  try {
    const today = new Date();
    const hijriDate = today.toLocaleDateString('ar-SA-u-ca-islamic', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return hijriDate;
  } catch {
    return "";
  }
}

function getGregorianDate(): string {
  return new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const QUICK_ACTIONS = [
  {
    id: "dashboard",
    title: "لوحة التحكم",
    icon: LayoutDashboard,
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    href: "/",
  },
  {
    id: "employees",
    title: "الموظفين",
    icon: Users,
    color: "bg-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    href: "/admin/users",
  },
  {
    id: "projects",
    title: "المشاريع",
    icon: FolderKanban,
    color: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    href: "/articles",
  },
  {
    id: "attendance",
    title: "الحضور",
    icon: Clock,
    color: "bg-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    href: "/calendar",
  },
  {
    id: "vacations",
    title: "الإجازات",
    icon: CalendarDays,
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    href: "/calendar",
  },
  {
    id: "appreciation",
    title: "التقدير",
    icon: Award,
    color: "bg-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    href: "/",
  },
];

const FEATURES = [
  {
    id: "project-management",
    title: "إدارة المشاريع",
    description: "تابع المشاريع والمهام باسلوب مهني ومتة المتقدم",
    icon: Target,
    color: "text-purple-500",
  },
  {
    id: "evaluation-system",
    title: "نظام التقييم",
    description: "تقييم الأداء والمكافآت بشكل احترافي",
    icon: BarChart3,
    color: "text-yellow-500",
  },
  {
    id: "smart-attendance",
    title: "الحضور الذكي",
    description: "تسجيل الحضور بتقنية GPS والموقع الجغرافي",
    icon: Fingerprint,
    color: "text-green-500",
  },
  {
    id: "appreciation-wall",
    title: "جدار التقدير",
    description: "احتفل بإنجازات زملائك وشاركهم النجاح",
    icon: ThumbsUp,
    color: "text-pink-500",
  },
];

const ANNOUNCEMENTS = [
  {
    id: "1",
    title: "تحديث تجريبي",
    description: "هذا نموذج تجريبي فقط",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  {
    id: "2",
    title: "معاً نحو إنجازات جديدة!",
    description: "الإدارة الألكترونية تسعى دائماً للتطوير",
    color: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-700",
  },
];

function Dashboard() {
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
  });

  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const motivationalQuote = getRandomMotivationalQuote();
  const hijriDate = useMemo(() => getHijriDate(), []);
  const gregorianDate = useMemo(() => getGregorianDate(), []);

  if (isUserLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const userName = user?.firstName || user?.email?.split('@')[0] || "المستخدم";
  const notificationCount = stats?.comments?.pending || 23;

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Hero Section */}
        <div 
          className="relative rounded-2xl overflow-hidden bg-gradient-to-l from-blue-100 via-blue-50 to-white dark:from-blue-950/40 dark:via-blue-950/20 dark:to-background p-6 md:p-8"
          data-testid="section-hero"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Right Side - Greeting */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  data-testid="text-greeting"
                >
                  {greeting}، {userName}
                </h1>
                <p 
                  className="text-muted-foreground mt-2 flex items-center gap-2"
                  data-testid="text-date"
                >
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  {gregorianDate}
                </p>
              </div>

              {/* Motivational Quote Box */}
              <div 
                className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50 max-w-md"
                data-testid="box-quote"
              >
                <p className="text-muted-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <span data-testid="text-quote">" {motivationalQuote} "</span>
                </p>
              </div>
            </div>

            {/* Left Side - Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 gap-2"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4" />
                <span>{notificationCount} إشعار جديد</span>
              </Button>
              <Link href="/">
                <Button
                  className="w-full gap-2"
                  data-testid="button-dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>لوحة التحكم</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div 
          className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4"
          data-testid="section-quick-actions"
        >
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.id} href={action.href}>
              <Card 
                className="hover-elevate transition-all cursor-pointer h-full"
                data-testid={`card-action-${action.id}`}
              >
                <CardContent className="flex flex-col items-center justify-center p-4 gap-3">
                  <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Explore Features */}
          <div className="space-y-6">
            {/* Explore Features Section */}
            <Card data-testid="section-features">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  استكشف المزايا
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover-elevate transition-all cursor-pointer"
                    data-testid={`feature-${feature.id}`}
                  >
                    <div className={`mt-1 ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Announcements */}
          <div className="space-y-6">
            {/* Pinned Announcements */}
            <Card data-testid="section-pinned-announcements">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  إعلانات مثبتة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-xl p-4 border-r-4 border-r-primary">
                  <h4 className="font-semibold mb-2" data-testid="text-welcome-title">
                    نرحب بزملائنا الجدد في سبق
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-welcome-message">
                    يسرّ إدارة صحيفة سبق أن ترحب بانضمام الزملاء الجدد إلى فريق العمل. متمنين لهم رحلة مهنية مليئة بالإنجازات والإبداع. نحن نثق أن نجاح سبق يقوم على رؤى...
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-muted-foreground">
                    <button 
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      data-testid="button-like"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      data-testid="button-comment"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <span className="text-xs">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* News Wall */}
            <Card data-testid="section-news-wall">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  جدار الإعلانات والأخبار
                </CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all">
                  عرض الكل
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ANNOUNCEMENTS.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`${announcement.color} ${announcement.borderColor} border rounded-xl p-4 hover-elevate transition-all cursor-pointer`}
                    data-testid={`announcement-${announcement.id}`}
                  >
                    <Badge variant="secondary" className="mb-2">
                      {announcement.title}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {announcement.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics Section - Preserved from original */}
        {hasRole(user, "admin", "system_admin", "editor") && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-stats-title">
              <BarChart3 className="h-5 w-5 text-primary" />
              الإحصائيات السريعة
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Articles Stats */}
              <Card className="hover-elevate transition-all" data-testid="card-articles-stats">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المقالات</CardTitle>
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/50">
                    <FolderKanban className="h-4 w-4 text-blue-500" />
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
                        {stats?.articles.published || 0} منشور · {stats?.articles.draft || 0} مسودة
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Users Stats */}
              <Card className="hover-elevate transition-all" data-testid="card-users-stats">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-950/50">
                    <Users className="h-4 w-4 text-orange-500" />
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
                        {stats?.users.active24h || 0} نشط اليوم
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Comments Stats */}
              <Card className="hover-elevate transition-all" data-testid="card-comments-stats">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">التعليقات</CardTitle>
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-950/50">
                    <MessageCircle className="h-4 w-4 text-green-500" />
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
                        {stats?.comments.pending || 0} قيد المراجعة
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Views Stats */}
              <Card className="hover-elevate transition-all" data-testid="card-views-stats">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المشاهدات</CardTitle>
                  <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-950/50">
                    <BarChart3 className="h-4 w-4 text-pink-500" />
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
                      <p className="text-xs text-muted-foreground" data-testid="text-views-today">
                        {stats?.articles.viewsToday || 0} اليوم
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute requireStaff={true}>
      <Dashboard />
    </ProtectedRoute>
  );
}
