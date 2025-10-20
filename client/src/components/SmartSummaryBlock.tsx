import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  Sparkles, 
  BookOpen, 
  Percent, 
  Heart, 
  MessageSquare,
  TrendingUp
} from "lucide-react";

interface TodayInsightsData {
  greeting: string;
  metrics: {
    readingTime: number;
    completionRate: number;
    likes: number;
    comments: number;
    articlesRead: number;
  };
  topInterests: string[];
  aiPhrase: string;
  quickSummary: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    green: "text-green-500 bg-green-50 dark:bg-green-950/20",
    pink: "text-pink-500 bg-pink-50 dark:bg-pink-950/20",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
  };

  const colorClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${colorClass} rounded-xl p-3 space-y-2`} data-testid={`metric-${label}`}>
      <div className="flex items-center justify-between">
        <div className={`${color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-green-500' : color === 'pink' ? 'text-pink-500' : 'text-purple-500'}`}>
          {icon}
        </div>
        <TrendingUp className="h-3 w-3 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function SmartSummaryBlock() {
  const { data: insights, isLoading } = useQuery<TodayInsightsData>({
    queryKey: ["/api/ai/insights/today"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <Card 
      className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm border-2 border-primary/10"
      data-testid="card-smart-summary"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex justify-between items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold" data-testid="text-greeting">
            {insights.greeting}
          </h2>
          <p className="text-sm text-muted-foreground">
            رحلتك المعرفية في سبق اليوم باختصار
          </p>
        </div>
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex-shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard
          icon={<BookOpen className="h-5 w-5" />}
          label="وقت القراءة"
          value={`${insights.metrics.readingTime} دقيقة`}
          color="blue"
        />
        <MetricCard
          icon={<Percent className="h-5 w-5" />}
          label="معدل الإكمال"
          value={`${insights.metrics.completionRate}%`}
          color="green"
        />
        <MetricCard
          icon={<Heart className="h-5 w-5" />}
          label="الإعجابات"
          value={insights.metrics.likes}
          color="pink"
        />
        <MetricCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="التعليقات"
          value={insights.metrics.comments}
          color="purple"
        />
      </div>

      {/* Top Interests */}
      {insights.topInterests.length > 0 && (
        <div className="border-t pt-4 mb-4">
          <p className="font-medium text-sm mb-2">اهتماماتك اليوم:</p>
          <div className="flex flex-wrap gap-2">
            {insights.topInterests.map((interest, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border-primary/20"
                data-testid={`interest-${index}`}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* AI Phrase & Summary */}
      <div className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground italic" data-testid="text-ai-phrase">
            الذكاء الاصطناعي يقول: "{insights.aiPhrase}"
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground" data-testid="text-quick-summary">
            {insights.quickSummary}
          </p>
          <Link href="/dashboard/daily-summary">
            <a className="text-sm text-primary font-medium hover:underline whitespace-nowrap" data-testid="link-daily-summary">
              عرض الملخص اليومي
            </a>
          </Link>
        </div>
      </div>
    </Card>
  );
}
