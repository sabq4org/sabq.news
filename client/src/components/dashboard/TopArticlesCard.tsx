import { Trophy, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { ArticlePerformance } from "@shared/schema";

interface TopArticlesCardProps {
  articles?: ArticlePerformance[];
  isLoading?: boolean;
  title?: string;
  showUnderperforming?: boolean;
}

function ArticleRow({ article, rank }: { article: ArticlePerformance; rank: number }) {
  const StatusIcon = article.status === 'positive' ? TrendingUp : 
                     article.status === 'negative' ? TrendingDown : Minus;
  
  const statusColors = {
    positive: 'text-green-600 dark:text-green-400',
    neutral: 'text-amber-600 dark:text-amber-400',
    negative: 'text-red-600 dark:text-red-400',
  };

  const rankColors = [
    'bg-amber-500 text-white',
    'bg-slate-400 text-white',
    'bg-amber-700 text-white',
    'bg-muted text-muted-foreground',
    'bg-muted text-muted-foreground',
  ];

  return (
    <Link href={`/dashboard/articles/${article.id}/edit`} data-testid={`link-article-${article.id}`}>
      <div 
        className="flex items-center gap-3 p-3 rounded-lg border hover-elevate transition-all cursor-pointer"
        data-testid={`article-row-${article.id}`}
      >
        <div 
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankColors[rank - 1] || rankColors[4]}`}
          data-testid={`rank-${article.id}`}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" data-testid={`text-article-title-${article.id}`}>
            {article.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-category-${article.id}`}>
                {article.category}
              </Badge>
            )}
            {article.successReason && (
              <span className={`text-xs ${statusColors[article.status]}`} data-testid={`text-reason-${article.id}`}>
                {article.successReason}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusIcon className={`h-4 w-4 ${statusColors[article.status]}`} data-testid={`icon-status-${article.id}`} />
          <div className="text-left">
            <p className="text-sm font-bold" data-testid={`text-views-${article.id}`}>
              {article.views.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground">
              مشاهدة
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TopArticlesCard({ articles, isLoading, title = "أفضل المقالات اليوم", showUnderperforming = false }: TopArticlesCardProps) {
  const Icon = showUnderperforming ? TrendingDown : Trophy;
  const iconColor = showUnderperforming ? "text-amber-500" : "text-amber-500";

  if (isLoading) {
    return (
      <Card data-testid="top-articles-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <Card data-testid="top-articles-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4" data-testid="text-no-articles">
            لا توجد مقالات بعد
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={showUnderperforming ? "underperforming-articles-card" : "top-articles-card"}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" data-testid="title-top-articles">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {articles.map((article, index) => (
          <ArticleRow key={article.id} article={article} rank={index + 1} />
        ))}
      </CardContent>
    </Card>
  );
}
