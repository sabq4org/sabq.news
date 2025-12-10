import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth, hasRole } from "@/hooks/useAuth";
import {
  FileText,
  Users,
  MessageSquare,
  FolderTree,
  Heart,
  LayoutDashboard,
  Bell,
  Calendar,
  Quote,
  Star,
  Bot,
  Headphones,
  Brain,
  Image,
  ChevronLeft,
  Mail,
  Hash,
  Briefcase,
  ArrowUpRight,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Array<{ id: string }>;
  unreadCount: number;
}

const MOTIVATIONAL_QUOTES = [
  "كل إنجاز عظيم كان في البداية مجرد فكرة",
  "النجاح ليس نهاية الطريق، بل رحلة مستمرة",
  "الإبداع يبدأ من حيث تنتهي منطقة الراحة",
  "التميز ليس فعلاً، بل عادة نمارسها كل يوم",
  "كل خطوة صغيرة تقربك من هدفك الكبير",
  "الجودة تبدأ من التفاصيل الصغيرة",
  "وجودك يصنع الأثر، ونتائجك تُلهم الفريق",
  "الإتقان ليس خياراً، بل أسلوب حياة",
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

function getGregorianDate(): string {
  return new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getHijriDate(): string {
  try {
    return new Date().toLocaleDateString('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

const quickActions = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    href: '/dashboard',
    bgColor: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
  },
  {
    id: 'users',
    label: 'المستخدمين',
    icon: Users,
    href: '/dashboard/ifox/users',
    bgColor: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
  },
  {
    id: 'articles',
    label: 'المقالات',
    icon: FileText,
    href: '/dashboard/articles',
    bgColor: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
  },
  {
    id: 'comments',
    label: 'التعليقات',
    icon: MessageSquare,
    href: '/dashboard/ai-moderation',
    bgColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
  },
  {
    id: 'categories',
    label: 'الفئات',
    icon: FolderTree,
    href: '/dashboard/categories',
    bgColor: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
  },
  {
    id: 'reactions',
    label: 'التفاعلات',
    icon: Heart,
    href: '/dashboard/reactions',
    bgColor: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-600',
  },
];

const featureCards = [
  {
    id: 'ai-tools',
    title: 'أدوات الذكاء الاصطناعي',
    description: 'تحرير وتحسين المحتوى باستخدام الذكاء الاصطناعي',
    href: '/dashboard/ai',
    icon: Bot,
  },
  {
    id: 'audio-newsletters',
    title: 'النشرات الصوتية',
    description: 'تحويل المقالات إلى محتوى صوتي تفاعلي',
    href: '/dashboard/audio-newsletters',
    icon: Headphones,
  },
  {
    id: 'deep-analysis',
    title: 'التحليل العميق',
    description: 'تحليلات متقدمة ورؤى ذكية للمحتوى',
    href: '/dashboard/ai/deep',
    icon: Brain,
  },
  {
    id: 'media-library',
    title: 'مكتبة الوسائط',
    description: 'إدارة الصور والفيديوهات والملفات',
    href: '/dashboard/media',
    icon: Image,
  },
];

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  superadmin: "المدير العام",
  system_admin: "مدير تقني",
  editor: "محرر",
  chief_editor: "رئيس التحرير",
  moderator: "مشرف",
  reporter: "مراسل",
  comments_moderator: "مشرف التعليقات",
  content_manager: "مدير المحتوى",
  opinion_author: "كاتب رأي",
  publisher: "ناشر",
  author: "كاتب",
};

function Dashboard() {
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
  });

  const { data: notificationsData } = useQuery<NotificationsResponse>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications?limit=5&read=false", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements/active'],
    enabled: !!user,
  });

  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const motivationalQuote = useMemo(() => getRandomMotivationalQuote(), []);
  const gregorianDate = useMemo(() => getGregorianDate(), []);
  const hijriDate = useMemo(() => getHijriDate(), []);

  const unreadCount = notificationsData?.unreadCount || 0;
  const pinnedAnnouncements = announcements?.slice(0, 3) || [];

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.email?.split('@')[0] || 'المستخدم';
  };

  const getRoleLabel = () => {
    const role = user?.role || 'user';
    return roleLabels[role] || role;
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  if (isUserLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Hero Header */}
          <div 
            className="relative rounded-xl p-6 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #e8f4fc 0%, #d6e9f8 50%, #c4ddf5 100%)',
            }}
            data-testid="hero-header"
          >
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-3">
                  {/* Greeting */}
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800" data-testid="text-greeting">
                    {greeting}، {getUserDisplayName()}
                  </h1>
                  
                  {/* Date */}
                  <div className="flex items-center gap-2 text-gray-600" data-testid="text-date">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{gregorianDate}</span>
                    {hijriDate && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span className="text-sm">{hijriDate}</span>
                      </>
                    )}
                  </div>

                  {/* Motivational Quote */}
                  <div 
                    className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3 max-w-md border border-white/80"
                    data-testid="motivational-quote-box"
                  >
                    <Quote className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 leading-relaxed" data-testid="text-motivational-quote">
                      "{motivationalQuote}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-3">
                  {/* Notifications Badge */}
                  <Link href="/notifications">
                    <Button 
                      variant="outline" 
                      className="bg-white/80 hover:bg-white border-gray-200 gap-2"
                      data-testid="button-notifications"
                    >
                      <Bell className="h-4 w-4" />
                      <span>{unreadCount} إشعار جديد</span>
                    </Button>
                  </Link>

                  {/* CTA Button */}
                  <Link href="/dashboard/articles">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      data-testid="button-go-to-publishing"
                    >
                      الذهاب للوحة النشر
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - 6 Circular Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4" data-testid="quick-actions-grid">
            {quickActions.map((action) => (
              <Link key={action.id} href={action.href}>
                <div 
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                  data-testid={`quick-action-${action.id}`}
                >
                  <div 
                    className={`w-16 h-16 rounded-full ${action.bgColor} ${action.hoverColor} transition-all flex items-center justify-center shadow-lg group-hover:scale-110`}
                  >
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Explore Features */}
            <Card className="border-gray-200" data-testid="card-explore-features">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-amber-500" />
                  استكشف المزايا
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {featureCards.map((feature) => (
                  <Link key={feature.id} href={feature.href}>
                    <div 
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                      data-testid={`feature-card-${feature.id}`}
                    >
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Pinned Announcements */}
            <Card className="border-gray-200" data-testid="card-pinned-announcements">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-amber-500" />
                  إعلانات مثبتة
                </CardTitle>
                <Link href="/dashboard/announcements">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-announcements">
                    عرض الكل
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {pinnedAnnouncements.length > 0 ? (
                  <div className="space-y-3">
                    {pinnedAnnouncements.map((announcement) => (
                      <Link key={announcement.id} href={`/dashboard/announcements/${announcement.id}`}>
                        <div 
                          className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          data-testid={`announcement-${announcement.id}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-1 h-full bg-blue-500 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {announcement.title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {announcement.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-announcements">
                    <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">لا توجد إعلانات مثبتة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Announcements and News Wall */}
          <Card className="border-gray-200" data-testid="card-news-wall">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-blue-500" />
                جدار الإعلانات والأخبار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sample News Cards with different colors */}
                <div 
                  className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  data-testid="news-card-1"
                >
                  <Badge className="bg-amber-500 text-white mb-2">تحديث تجريبي</Badge>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    هنا مضمون الخبر الأول مع وصف مختصر للتحديث أو الميزة الجديدة
                  </p>
                </div>
                
                <div 
                  className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  data-testid="news-card-2"
                >
                  <Badge className="bg-green-500 text-white mb-2">معاً نحو إنجازات جديدة!</Badge>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    الأهداف الأولية لهذا الربع قد تم تحقيقها بنجاح
                  </p>
                </div>

                <div 
                  className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                  data-testid="news-card-3"
                >
                  <Badge className="bg-blue-500 text-white mb-2">ميزة جديدة</Badge>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    تم إطلاق نظام التحليل الذكي للمحتوى
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* User Profile Card */}
          <Card className="border-gray-200" data-testid="card-user-profile">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserDisplayName()} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100" data-testid="text-user-name">
                  {getUserDisplayName()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2" data-testid="text-user-role">
                  {getRoleLabel()}
                </p>
                <Badge variant="outline" className="text-xs" data-testid="badge-user-status">
                  official
                </Badge>
              </div>

              {/* User Quick Info */}
              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">رقم الهوية</p>
                    <p className="text-gray-900 dark:text-gray-100" data-testid="text-user-id">
                      {user?.id?.slice(0, 10) || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">القسم</p>
                    <p className="text-gray-900 dark:text-gray-100" data-testid="text-user-department">
                      {user?.department || 'إدارة الذكاء الاصطناعي'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">البريد الإلكتروني</p>
                    <p className="text-gray-900 dark:text-gray-100 truncate" data-testid="text-user-email">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-gray-200" data-testid="card-quick-stats">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid="stat-articles"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">المقالات</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {stats?.articles.total || 0}
                    </span>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid="stat-users"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">المستخدمين</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {stats?.users.total || 0}
                    </span>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid="stat-comments"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">التعليقات</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {stats?.comments.total || 0}
                    </span>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid="stat-reactions"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">التفاعلات</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {stats?.reactions.total || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
