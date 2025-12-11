import { TrendingUp, TrendingDown, Minus, Eye, Heart, AlertCircle, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ExecutiveSummary, MetricWithComparison } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface ExecutiveSummaryBarProps {
  data?: ExecutiveSummary;
  isLoading?: boolean;
}

function MetricPill({ metric }: { metric: MetricWithComparison }) {
  const isPositive = metric.status === 'positive';
  const isNegative = metric.status === 'negative';
  
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const colorClass = isPositive 
    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
    : isNegative 
    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' 
    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '';
  
  return (
    <div 
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClass}`}
      data-testid={`metric-pill-${metric.label}`}
    >
      <Icon className="h-4 w-4 shrink-0" data-testid={`icon-${metric.label}`} />
      <span className="font-medium text-sm whitespace-nowrap" data-testid={`text-${metric.label}-value`}>
        {metric.label}
      </span>
      <span className="text-sm font-bold" data-testid={`text-${metric.label}-change`}>
        {arrow} {Math.abs(metric.percentChange || 0)}%
      </span>
      <span className="text-xs opacity-75 whitespace-nowrap" data-testid={`text-${metric.label}-comparison`}>
        {metric.comparisonLabel}
      </span>
    </div>
  );
}

export function ExecutiveSummaryBar({ data, isLoading }: ExecutiveSummaryBarProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border" data-testid="executive-summary-loading">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-36" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div 
      className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-l from-muted/20 via-muted/30 to-muted/20 rounded-lg border"
      data-testid="executive-summary-bar"
    >
      <MetricPill metric={data.engagement} />
      <MetricPill metric={data.reads} />
      
      {data.underperformingCount > 0 && (
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
          data-testid="metric-underperforming"
        >
          <AlertCircle className="h-4 w-4 shrink-0" data-testid="icon-underperforming" />
          <span className="text-sm font-medium" data-testid="text-underperforming-count">
            {data.underperformingCount} مقالات أداءها أقل من المتوقع
          </span>
        </div>
      )}
      
      {data.trendingArticle && (
        <Link href={`/article/${data.trendingArticle.id}`} data-testid="link-trending-article">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
            <Flame className="h-4 w-4 shrink-0 animate-pulse" data-testid="icon-trending" />
            <span className="text-sm font-medium truncate max-w-[200px]" data-testid="text-trending-title">
              ترند: {data.trendingArticle.title}
            </span>
            <Badge variant="secondary" className="text-xs" data-testid="badge-trending-views">
              {data.trendingArticle.views.toLocaleString('ar-SA')} مشاهدة
            </Badge>
          </div>
        </Link>
      )}
    </div>
  );
}
