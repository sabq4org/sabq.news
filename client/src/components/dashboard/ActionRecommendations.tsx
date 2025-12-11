import { Edit3, Clock, Share2, Megaphone, MessageSquare, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { ActionRecommendation } from "@shared/schema";

const iconMap: Record<string, any> = {
  Edit3: Edit3,
  Clock: Clock,
  Share2: Share2,
  Megaphone: Megaphone,
  MessageSquare: MessageSquare,
  AlertTriangle: AlertTriangle,
};

interface ActionRecommendationsProps {
  recommendations?: ActionRecommendation[];
  isLoading?: boolean;
}

function RecommendationCard({ rec }: { rec: ActionRecommendation }) {
  const Icon = iconMap[rec.icon] || AlertTriangle;
  
  const priorityColors = {
    high: 'border-r-red-500',
    medium: 'border-r-amber-500',
    low: 'border-r-green-500',
  };

  const priorityLabels = {
    high: 'عاجل',
    medium: 'متوسط',
    low: 'منخفض',
  };

  const priorityBadgeVariants = {
    high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  };

  return (
    <div 
      className={`p-3 border rounded-lg border-r-4 ${priorityColors[rec.priority]} hover-elevate transition-all bg-card`}
      data-testid={`recommendation-${rec.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Icon className="h-4 w-4" data-testid={`icon-rec-${rec.id}`} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm" data-testid={`text-rec-title-${rec.id}`}>
              {rec.title}
            </h4>
            <Badge 
              variant="secondary" 
              className={`text-xs ${priorityBadgeVariants[rec.priority]}`}
              data-testid={`badge-rec-priority-${rec.id}`}
            >
              {priorityLabels[rec.priority]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1" data-testid={`text-rec-desc-${rec.id}`}>
            {rec.description}
          </p>
          {rec.articleTitle && (
            <p className="text-sm font-medium text-primary truncate" data-testid={`text-rec-article-${rec.id}`}>
              "{rec.articleTitle}"
            </p>
          )}
          {rec.metric && (
            <Badge variant="outline" className="text-xs" data-testid={`badge-rec-metric-${rec.id}`}>
              {rec.metric}
            </Badge>
          )}
        </div>
        {rec.actionUrl && (
          <Link href={rec.actionUrl} data-testid={`link-rec-action-${rec.id}`}>
            <Button size="sm" variant="outline" className="shrink-0">
              نفّذ
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function ActionRecommendations({ recommendations, isLoading }: ActionRecommendationsProps) {
  if (isLoading) {
    return (
      <Card data-testid="recommendations-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            ماذا أفعل الآن؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card data-testid="recommendations-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            ماذا أفعل الآن؟
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4" data-testid="text-no-recommendations">
            لا توجد توصيات حالياً - كل شيء يسير على ما يرام! ✨
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="recommendations-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" data-testid="title-recommendations">
          <Megaphone className="h-5 w-5 text-primary" />
          ماذا أفعل الآن؟
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} />
        ))}
      </CardContent>
    </Card>
  );
}
