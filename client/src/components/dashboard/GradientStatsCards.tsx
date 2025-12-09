import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Wallet, TrendingUp, Clock, DollarSign, Users, FileText, Eye, MessageSquare } from "lucide-react";

interface GradientStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  gradient: "green" | "orange" | "blue" | "purple";
}

export function GradientStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  gradient 
}: GradientStatCardProps) {
  const gradientClass = `gradient-card-${gradient}`;
  
  return (
    <div 
      className={`${gradientClass} rounded-2xl p-4 md:p-5 transition-all hover:shadow-md`}
      data-testid={`gradient-card-${gradient}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-sm font-medium text-foreground/70">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-white/50 dark:bg-white/10">
            <Icon className="h-4 w-4 text-foreground/60" />
          </div>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-foreground" data-testid={`gradient-value-${gradient}`}>
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </div>
      {subtitle && (
        <p className="text-xs text-foreground/60 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

interface MonthlyEntitlementsSectionProps {
  totalViews?: number;
  totalArticles?: number;
  todayViews?: number;
  isLoading?: boolean;
}

export function MonthlyEntitlementsSection({ 
  totalViews = 0, 
  totalArticles = 0, 
  todayViews = 0,
  isLoading = false 
}: MonthlyEntitlementsSectionProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            الإحصائيات الشهرية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            <div className="h-24 bg-muted rounded-2xl" />
            <div className="h-24 bg-muted rounded-2xl" />
            <div className="h-24 bg-muted rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl" data-testid="card-monthly-entitlements">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          الإحصائيات الشهرية
        </CardTitle>
        <span className="text-sm text-muted-foreground">تفاصيل الأداء والإنجازات</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GradientStatCard
            title="خارج الدوام (إضافي)"
            value={todayViews}
            subtitle="مشاهدة اليوم"
            icon={TrendingUp}
            gradient="green"
          />
          <GradientStatCard
            title="إجمالي المقالات"
            value={totalArticles}
            subtitle="مقال منشور"
            icon={FileText}
            gradient="orange"
          />
          <GradientStatCard
            title="الراتب"
            value={totalViews}
            subtitle="إجمالي المشاهدات"
            icon={Eye}
            gradient="blue"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickStatsRowProps {
  stats: Array<{
    label: string;
    value: number | string;
    icon?: LucideIcon;
  }>;
}

export function QuickStatsRow({ stats }: QuickStatsRowProps) {
  return (
    <Card className="rounded-2xl" data-testid="card-quick-stats">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          إحصائيات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              data-testid={`quick-stat-${index}`}
            >
              {stat.icon && (
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              )}
              <div className="text-2xl font-bold text-foreground">
                {typeof stat.value === 'number' ? stat.value.toLocaleString('en-US') : stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface BalanceWidgetProps {
  title: string;
  icon: LucideIcon;
  items: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
}

export function BalanceWidget({ title, icon: Icon, items }: BalanceWidgetProps) {
  return (
    <Card className="rounded-2xl" data-testid={`balance-widget-${title}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className={`text-lg font-bold ${item.color || 'text-foreground'}`}>
                {typeof item.value === 'number' ? item.value.toLocaleString('en-US') : item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
