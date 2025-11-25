import { useRef, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Brain, Zap, Flame, MessageSquare } from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

interface PersonalizedRecommendationCardProps {
  article: ArticleWithDetails;
  reason?: string;
  recommendationId?: string;
  onDisplay?: (articleId: string, recommendationId?: string) => void;
  onArticleClick?: (articleId: string, recommendationId?: string) => void;
}

export function PersonalizedRecommendationCard({
  article,
  reason = "مخصص لك",
  recommendationId,
  onDisplay,
  onArticleClick,
}: PersonalizedRecommendationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !onDisplay) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onDisplay(article.id, recommendationId);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [article.id, recommendationId, onDisplay]);

  const handleClick = () => {
    if (onArticleClick) {
      onArticleClick(article.id, recommendationId);
    }
  };

  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: arSA,
      })
    : null;

  return (
    <div ref={cardRef} dir="rtl" className="col-span-full lg:col-span-2">
      <Link href={`/article/${article.slug}`}>
        <Card
          onClick={handleClick}
          className="group cursor-pointer overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 hover:border-primary/40 transition-all duration-300"
          data-testid={`card-recommendation-${article.id}`}
        >
          <div className="flex flex-col lg:flex-row">
            {(article.imageUrl || (article as any).thumbnailUrl) && (
              <div className="relative lg:w-2/5 h-48 lg:h-auto overflow-hidden">
                <img
                  src={(article as any).thumbnailUrl ?? article.imageUrl ?? ''}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  style={{
                    objectPosition: (article as any).imageFocalPoint
                      ? `${(article as any).imageFocalPoint.x}% ${(article as any).imageFocalPoint.y}%`
                      : 'center'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-l" />
              </div>
            )}

            <CardContent className="flex-1 p-5 lg:p-6 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className="text-xs h-6 gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 text-primary-foreground border-0 shadow-sm"
                  data-testid={`badge-recommendation-${article.id}`}
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {reason}
                </Badge>

                {(article as any).thumbnailUrl && (
                  <Badge className="text-xs h-6 gap-1 bg-purple-500/90 hover:bg-purple-600 text-white border-0">
                    الصورة
                    <Brain className="h-3 w-3" aria-hidden="true" />
                  </Badge>
                )}

                {article.newsType === "breaking" ? (
                  <Badge variant="destructive" className="text-xs h-6 gap-1">
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    عاجل
                  </Badge>
                ) : isNewArticle(article.publishedAt) ? (
                  <Badge className="text-xs h-6 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600">
                    <Flame className="h-3 w-3" aria-hidden="true" />
                    جديد
                  </Badge>
                ) : article.category ? (
                  <Badge className="text-xs h-6 bg-muted text-muted-foreground border-0">
                    {article.category.nameAr}
                  </Badge>
                ) : null}
              </div>

              <h3
                className={`font-bold text-lg lg:text-xl line-clamp-2 transition-colors ${
                  article.newsType === "breaking"
                    ? "text-destructive"
                    : "group-hover:text-primary"
                }`}
                data-testid={`text-recommendation-title-${article.id}`}
              >
                {article.title}
              </h3>

              {article.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 lg:line-clamp-3">
                  {article.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                {timeAgo && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </span>
                )}
                <ViewsCount views={article.views || 0} iconClassName="h-3 w-3" />
                {(article.commentsCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {article.commentsCount}
                  </span>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    </div>
  );
}
