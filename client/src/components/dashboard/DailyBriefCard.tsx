import { Sun, Moon, TrendingUp, AlertTriangle, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useState } from "react";
import type { DailyBrief, Insight } from "@shared/schema";

interface DailyBriefCardProps {
  data?: DailyBrief;
  isLoading?: boolean;
}

function InsightItem({ insight }: { insight: Insight }) {
  const isOpportunity = insight.type === 'opportunity';
  const Icon = isOpportunity ? TrendingUp : AlertTriangle;
  const colorClass = isOpportunity
    ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400';

  return (
    <div 
      className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
      data-testid={`insight-${insight.id}`}
    >
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} data-testid={`icon-insight-${insight.id}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" data-testid={`text-insight-title-${insight.id}`}>
          {insight.title}
        </p>
        <p className="text-xs text-muted-foreground" data-testid={`text-insight-desc-${insight.id}`}>
          {insight.description}
        </p>
      </div>
      {insight.actionUrl && (
        <Link href={insight.actionUrl} data-testid={`link-insight-${insight.id}`}>
          <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
            تنفيذ
          </Button>
        </Link>
      )}
    </div>
  );
}

export function DailyBriefCard({ data, isLoading }: DailyBriefCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hour = new Date().getHours();
  const TimeIcon = hour < 18 ? Sun : Moon;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20" data-testid="daily-brief-loading">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card 
      className="bg-gradient-to-br from-primary/5 via-background to-accent/10 border-primary/20 shadow-sm"
      data-testid="daily-brief-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <TimeIcon className="h-5 w-5 text-primary" data-testid="icon-time" />
            </div>
            <div>
              <CardTitle className="text-lg" data-testid="text-greeting">
                {data.greeting} ☕
              </CardTitle>
              <p className="text-xs text-muted-foreground" data-testid="text-date">
                {data.date}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-brief"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-2">
          <p className="text-sm font-medium p-3 rounded-lg bg-muted/50 border" data-testid="text-summary">
            {data.summary}
          </p>

          {data.opportunities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-green-600 dark:text-green-400" data-testid="title-opportunities">
                <TrendingUp className="h-4 w-4" />
                فرص المحتوى ({data.opportunities.length})
              </h4>
              {data.opportunities.map((opp) => (
                <InsightItem key={opp.id} insight={opp} />
              ))}
            </div>
          )}

          {data.risks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400" data-testid="title-risks">
                <AlertTriangle className="h-4 w-4" />
                تحذيرات ({data.risks.length})
              </h4>
              {data.risks.map((risk) => (
                <InsightItem key={risk.id} insight={risk} />
              ))}
            </div>
          )}

          {data.boostCandidate && (
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2">
                <Rocket className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" data-testid="icon-boost" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300" data-testid="text-boost-title">
                    مقال يستحق الدفع
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 truncate" data-testid="text-boost-article">
                    "{data.boostCandidate.title}"
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400" data-testid="text-boost-reason">
                    {data.boostCandidate.reason}
                  </p>
                </div>
                <Link href={`/dashboard/articles/${data.boostCandidate.articleId}`} data-testid="link-boost">
                  <Button size="sm" variant="outline" className="shrink-0 text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50">
                    ادفع
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
