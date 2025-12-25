import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  useAdvertiserProfile, 
  useAdvertiserAds, 
  useAdvertiserStats,
  useAdvertiserLogout 
} from "@/hooks/useAdvertiser";
import { 
  Plus, 
  FileText, 
  Eye, 
  MousePointerClick, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  LogOut,
  BarChart3,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import sabqLogo from "@assets/sabq-logo.png";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending_approval: { label: "قيد المراجعة", variant: "secondary", icon: Clock },
  active: { label: "نشط", variant: "default", icon: CheckCircle },
  paused: { label: "متوقف", variant: "outline", icon: Pause },
  rejected: { label: "مرفوض", variant: "destructive", icon: XCircle },
  completed: { label: "مكتمل", variant: "secondary", icon: CheckCircle },
  expired: { label: "منتهي", variant: "outline", icon: Clock },
};

function StatCard({ title, value, icon: Icon, loading }: { title: string; value: string | number; icon: any; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold" data-testid={`stat-${title.replace(/\s/g, '-')}`}>{value}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdvertiserPortalDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading, error: profileError } = useAdvertiserProfile();
  const { data: ads, isLoading: adsLoading } = useAdvertiserAds();
  const { data: stats, isLoading: statsLoading } = useAdvertiserStats();
  const logoutMutation = useAdvertiserLogout();

  useEffect(() => {
    document.title = "لوحة تحكم المعلن - سبق";
  }, []);

  useEffect(() => {
    if (profileError && !profileLoading) {
      navigate("/advertise/login");
    }
  }, [profileError, profileLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً!",
      });
      navigate("/advertise/login");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const toArabicNumerals = (num: number | string) => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
  };

  const formatNumber = (num: number) => {
    return toArabicNumerals(num.toLocaleString('en-US'));
  };

  const formatCurrency = (amount: number) => {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return toArabicNumerals(formatted) + ' ر.س';
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return toArabicNumerals("0") + "%";
    const ctr = ((clicks / impressions) * 100).toFixed(2);
    return toArabicNumerals(ctr) + "%";
  };

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <img 
                  src={sabqLogo} 
                  alt="سبق" 
                  className="h-8"
                  data-testid="img-logo"
                />
              </Link>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">منصة المعلنين</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="text-user-name">
                مرحباً، {profile.name}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
                className="gap-2"
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">لوحة التحكم</h1>
            <p className="text-muted-foreground">مراقبة وإدارة إعلاناتك</p>
          </div>
          <div className="flex gap-2">
            <Link href="/advertise">
              <Button variant="outline" className="gap-2" data-testid="link-advertise-home">
                <ArrowLeft className="h-4 w-4" />
                الرئيسية
              </Button>
            </Link>
            <Link href="/advertise/create">
              <Button className="gap-2" data-testid="button-create-ad">
                <Plus className="h-4 w-4" />
                إنشاء إعلان جديد
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="إجمالي الإعلانات" 
            value={formatNumber(stats?.totalAds ?? 0)} 
            icon={FileText}
            loading={statsLoading}
          />
          <StatCard 
            title="الإعلانات النشطة" 
            value={formatNumber(stats?.activeAds ?? 0)} 
            icon={CheckCircle}
            loading={statsLoading}
          />
          <StatCard 
            title="إجمالي المشاهدات" 
            value={formatNumber(stats?.totalImpressions ?? 0)} 
            icon={Eye}
            loading={statsLoading}
          />
          <StatCard 
            title="إجمالي النقرات" 
            value={formatNumber(stats?.totalClicks ?? 0)} 
            icon={MousePointerClick}
            loading={statsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ملخص الأداء
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">إعلانات قيد المراجعة</span>
                {statsLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <Badge variant="secondary" data-testid="stat-pending">{formatNumber(stats?.pendingAds ?? 0)}</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">إجمالي التكلفة</span>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <span className="font-semibold" data-testid="stat-cost">
                    {formatCurrency(stats?.totalCost ?? 0)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">معدل النقر (CTR)</span>
                {statsLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <span className="font-semibold" data-testid="stat-ctr">
                    {calculateCTR(stats?.totalClicks ?? 0, stats?.totalImpressions ?? 0)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>إعلاناتي</CardTitle>
          </CardHeader>
          <CardContent>
            {adsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : ads && ads.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">المشاهدات</TableHead>
                      <TableHead className="text-center">النقرات</TableHead>
                      <TableHead className="text-center">CTR</TableHead>
                      <TableHead className="text-center">التكلفة</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => {
                      const status = statusConfig[ad.status] || statusConfig.pending_approval;
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={ad.id} data-testid={`row-ad-${ad.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {ad.imageUrl && (
                                <img 
                                  src={ad.imageUrl} 
                                  alt={ad.title}
                                  className="w-12 h-8 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium line-clamp-1">{ad.title}</p>
                                {ad.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1" data-testid={`badge-status-${ad.id}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{formatNumber(ad.impressions)}</TableCell>
                          <TableCell className="text-center">{formatNumber(ad.clicks)}</TableCell>
                          <TableCell className="text-center">{calculateCTR(ad.clicks, ad.impressions)}</TableCell>
                          <TableCell className="text-center">{formatCurrency(ad.totalCost || 0)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {toArabicNumerals(format(new Date(ad.createdAt), 'dd/MM/yyyy', { locale: ar }))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد إعلانات بعد</h3>
                <p className="text-muted-foreground mb-4">
                  ابدأ بإنشاء إعلانك الأول للوصول إلى جمهورك المستهدف
                </p>
                <Link href="/advertise/create">
                  <Button data-testid="button-create-first-ad">
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء إعلان جديد
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
