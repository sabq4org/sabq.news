import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, TrendingUp, BarChart3 } from "lucide-react";

interface NewsStats {
  totalNews: number;
  todayNews: number;
  topViewedThisWeek: {
    article: any;
    views: number;
  };
  averageViews: number;
}

export function NewsStatsCards() {
  const { data: stats, isLoading } = useQuery<NewsStats>({
    queryKey: ["/api/news/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statsData = [
    {
      icon: Newspaper,
      label: "إجمالي الأخبار",
      value: (stats.totalNews ?? 0).toLocaleString('en-US'),
      color: "text-primary",
      bg: "bg-primary/10",
      testId: "stat-total-news"
    },
    {
      icon: Calendar,
      label: "أخبار اليوم",
      value: (stats.todayNews ?? 0).toLocaleString('en-US'),
      color: "text-green-600 dark:text-green-500",
      bg: "bg-green-500/10",
      testId: "stat-today-news"
    },
    {
      icon: TrendingUp,
      label: "الأكثر مشاهدة (أسبوعياً)",
      value: (stats.topViewedThisWeek.views ?? 0).toLocaleString('en-US'),
      color: "text-blue-600 dark:text-blue-500",
      bg: "bg-blue-500/10",
      testId: "stat-top-viewed"
    },
    {
      icon: BarChart3,
      label: "متوسط المشاهدات",
      value: (stats.averageViews ?? 0).toLocaleString('en-US'),
      color: "text-orange-600 dark:text-orange-500",
      bg: "bg-orange-500/10",
      testId: "stat-avg-views"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="news-stats-cards">
      {statsData.map((stat) => (
        <Card key={stat.testId} className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground" data-testid={`${stat.testId}-value`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
