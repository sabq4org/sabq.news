import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Flame, MessageSquare, Zap, Heart, Brain, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightArticle {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string;
}

interface AIInsightsData {
  mostViewed: {
    article: InsightArticle | null;
    count: number;
    trend: string;
  };
  mostCommented: {
    article: InsightArticle | null;
    count: number;
    trend: string;
  };
  mostControversial: {
    article: InsightArticle | null;
    trend: string;
    aiAnalysis: string;
  };
  mostPositive: {
    article: InsightArticle | null;
    positiveRate: string;
    trend: string;
  };
  aiPick: {
    article: InsightArticle | null;
    engagementScore: number;
    forecast: string;
  };
}

export function AIInsightsBlock() {
  const { data: insights, isLoading } = useQuery<AIInsightsData>({
    queryKey: ["/api/ai-insights"],
    refetchInterval: 6 * 60 * 60 * 1000, // Refresh every 6 hours
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const insightsData = [
    {
      icon: Flame,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      title: "الأكثر تداولاً",
      subtitle: `${insights.mostViewed.count.toLocaleString('ar-SA')} قراءة`,
      trend: insights.mostViewed.trend,
      article: insights.mostViewed.article,
      testId: "most-viewed",
    },
    {
      icon: MessageSquare,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      title: "الأكثر تعليقاً",
      subtitle: `${insights.mostCommented.count} تعليق`,
      trend: insights.mostCommented.trend,
      article: insights.mostCommented.article,
      testId: "most-commented",
    },
    {
      icon: Zap,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      title: "يثير الجدل",
      subtitle: insights.mostControversial.aiAnalysis,
      trend: insights.mostControversial.trend,
      article: insights.mostControversial.article,
      testId: "most-controversial",
    },
    {
      icon: Heart,
      iconColor: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      title: "الأكثر إعجاباً",
      subtitle: `${insights.mostPositive.positiveRate} تفاعل إيجابي`,
      trend: insights.mostPositive.trend,
      article: insights.mostPositive.article,
      testId: "most-positive",
    },
    {
      icon: Brain,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      title: "اختيار الذكاء الاصطناعي",
      subtitle: insights.aiPick.forecast,
      trend: "AI Forecast",
      article: insights.aiPick.article,
      testId: "ai-pick",
    },
  ];

  return (
    <div className="space-y-3" data-testid="ai-insights-block">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
          <Brain className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold" data-testid="insights-title">
            مؤشرات الأسبوع
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground" data-testid="insights-subtitle">
            نظرة ذكية على تفاعل القراء
          </p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {insightsData.map((insight, index) => {
          const IconComponent = insight.icon;
          const articleLink = insight.article ? `/article/${insight.article.slug}` : "#";
          
          return (
            <Link 
              key={index} 
              href={articleLink}
              className={insight.article ? "cursor-pointer" : "cursor-default pointer-events-none"}
            >
              <div
                className={`${insight.bgColor} border border-gray-200 dark:border-gray-800 rounded-xl p-2.5 sm:p-3 group flex flex-col min-h-[140px] sm:min-h-[160px] ${
                  insight.article ? "" : "opacity-60"
                }`}
                data-testid={`insight-card-${insight.testId}`}
              >
                {/* Icon and Title Row */}
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
                    <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${insight.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base leading-tight" data-testid={`insight-title-${insight.testId}`}>
                      {insight.title}
                    </h3>
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2 min-h-[20px] sm:min-h-[24px] line-clamp-2" data-testid={`insight-subtitle-${insight.testId}`}>
                  {insight.subtitle}
                </p>

                {/* Trend */}
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium mb-2" data-testid={`insight-trend-${insight.testId}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">{insight.trend}</span>
                </div>

                {/* Article Title - Always visible */}
                {insight.article && (
                  <p className="mt-auto pt-2 text-xs text-foreground/80 line-clamp-2 border-t border-gray-200 dark:border-gray-700" data-testid={`insight-article-${insight.testId}`}>
                    {insight.article.title}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
