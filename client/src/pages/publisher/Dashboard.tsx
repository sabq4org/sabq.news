import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coins,
  Plus,
  Activity as ActivityIcon,
  FileEdit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type DashboardStats = {
  articles: {
    pending: number;
    approved: number;
    rejected: number;
    needsRevision: number;
    total: number;
  };
};

type CreditInfo = {
  remainingCredits: number;
  totalCredits: number;
  expiryDate: string | null;
};

type ActivityLog = {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
};

export default function PublisherDashboard() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // RBAC Guard: Publisher only
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'publisher') {
      navigate('/');
      toast({ 
        title: 'غير مصرح', 
        description: 'هذه الصفحة للناشرين فقط', 
        variant: 'destructive' 
      });
    }
  }, [user, navigate, toast]);

  if (!user || user.role !== 'publisher') {
    return null;
  }

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ["/api/publisher/dashboard"],
    enabled: !!user,
  });

  const { data: credits, isLoading: creditsLoading, error: creditsError } = useQuery<CreditInfo>({
    queryKey: ["/api/publisher/credits"],
    enabled: !!user,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/publisher/logs"],
    select: (data: ActivityLog[]) => data.slice(0, 5),
    enabled: !!user,
  });

  if (statsError || creditsError) {
    toast({
      title: "خطأ",
      description: "فشل تحميل بيانات لوحة التحكم",
      variant: "destructive",
    });
  }

  const kpiCards = [
    {
      title: "قيد الانتظار",
      value: stats?.articles.pending ?? 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      testId: "card-pending-articles",
    },
    {
      title: "موافق عليها",
      value: stats?.articles.approved ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      testId: "card-approved-articles",
    },
    {
      title: "مرفوضة",
      value: stats?.articles.rejected ?? 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      testId: "card-rejected-articles",
    },
    {
      title: "تحتاج مراجعة",
      value: stats?.articles.needsRevision ?? 0,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      testId: "card-needs-revision-articles",
    },
  ];

  const quickLinks = [
    {
      title: "إرسال مقال جديد",
      description: "ابدأ بكتابة مقال جديد",
      icon: Plus,
      href: "/publisher/submit",
      testId: "link-submit-new-article",
    },
    {
      title: "مقالاتي",
      description: "عرض وإدارة مقالاتك",
      icon: FileText,
      href: "/publisher/articles",
      testId: "link-view-articles",
    },
    {
      title: "سجل النشاط",
      description: "تتبع نشاطاتك",
      icon: ActivityIcon,
      href: "/publisher/activity",
      testId: "link-view-activity",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
            لوحة التحكم
          </h1>
          <p className="text-muted-foreground mt-1">
            مرحباً {user?.firstName || user?.email}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpiCards.map((card) => (
            <Card key={card.title} data-testid={card.testId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-md ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Credits Card */}
      <Card data-testid="card-credits">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            النقاط المتبقية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold" data-testid="text-remaining-credits">
                  {credits?.remainingCredits ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  من {credits?.totalCredits ?? 0} نقطة
                </span>
              </div>
              {credits?.expiryDate && (
                <p className="text-sm text-muted-foreground">
                  تنتهي في:{" "}
                  {new Date(credits.expiryDate).toLocaleDateString("ar-SA")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-activity">
              لا توجد أنشطة حديثة
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                  data-testid={`activity-${activity.id}`}
                >
                  <ActivityIcon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.actionType}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <Link href="/publisher/activity">
                <Button variant="ghost" className="w-full mt-2" data-testid="link-view-all-activity">
                  عرض الكل
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.title} href={link.href}>
            <Card
              className="cursor-pointer hover-elevate transition-all"
              data-testid={link.testId}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{link.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
