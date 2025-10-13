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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid md:grid-cols-5 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
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
    <div className="space-y-4" data-testid="ai-insights-block">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold" data-testid="insights-title">
            مؤشرات الأسبوع
          </h2>
          <p className="text-xs text-muted-foreground" data-testid="insights-subtitle">
            نظرة ذكية على تفاعل القراء خلال آخر 7 أيام
          </p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid md:grid-cols-5 sm:grid-cols-2 gap-3">
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
                className={`${insight.bgColor} border border-gray-200 dark:border-gray-800 rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all group ${
                  insight.article ? "hover-elevate" : "opacity-60"
                }`}
                data-testid={`insight-card-${insight.testId}`}
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-9 h-9 mb-2">
                  <IconComponent className={`h-6 w-6 ${insight.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="font-bold text-base mb-1.5 leading-tight" data-testid={`insight-title-${insight.testId}`}>
                  {insight.title}
                </h3>

                {/* Subtitle */}
                <p className="text-xs text-muted-foreground mb-2 min-h-[28px] line-clamp-2" data-testid={`insight-subtitle-${insight.testId}`}>
                  {insight.subtitle}
                </p>

                {/* Trend */}
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium" data-testid={`insight-trend-${insight.testId}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{insight.trend}</span>
                </div>

                {/* Article Title (on hover) */}
                {insight.article && (
                  <p className="mt-2 text-xs text-foreground/80 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`insight-article-${insight.testId}`}>
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
