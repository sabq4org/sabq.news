import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  Clock, 
  MessageSquare, 
  Zap, 
  Flame, 
  ChevronLeft, 
  RefreshCw,
  TrendingUp,
  Heart,
  Bookmark,
  Eye,
  Brain
} from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

interface PersonalizedArticle {
  id: string;
  article: {
    id: string;
    title: string;
    excerpt: string | null;
    imageUrl: string | null;
    thumbnailUrl?: string | null;
    publishedAt: Date | string | null;
    slug: string;
    views?: number;
    commentsCount?: number;
    newsType?: string;
    isAiGeneratedThumbnail?: boolean;
    isAiGeneratedImage?: boolean;
    category?: {
      nameAr: string | null;
      slug: string | null;
    };
  };
  reason: string;
  reasonText: string;
  score: number;
}

interface TopInterest {
  categoryId: string;
  categoryName: string;
  articleCount: number;
  engagementScore: number;
}

const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

const getReasonIcon = (reason: string) => {
  switch (reason) {
    case 'liked_similar':
      return <Heart className="h-3 w-3" />;
    case 'saved_similar':
      return <Bookmark className="h-3 w-3" />;
    case 'category_interest':
      return <TrendingUp className="h-3 w-3" />;
    case 'reading_pattern':
      return <Eye className="h-3 w-3" />;
    case 'trending_match':
      return <Flame className="h-3 w-3" />;
    default:
      return <Sparkles className="h-3 w-3" />;
  }
};

export function ForYouSection() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: recommendationsData, isLoading: isLoadingRecs, refetch: refetchRecs } = useQuery<{ recommendations: PersonalizedArticle[] }>({
    queryKey: ['/api/recommendations/personalized', refreshKey],
    enabled: !!user,
  });

  const { data: interestsData } = useQuery<{ interests: TopInterest[] }>({
    queryKey: ['/api/personalization/top-interests'],
    enabled: !!user,
  });

  const recommendations = recommendationsData?.recommendations || [];
  const topInterests = interestsData?.interests || [];

  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1);
    await refetchRecs();
  }, [refetchRecs]);

  if (!user) {
    return null;
  }

  if (isLoadingRecs) {
    return (
      <section className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold">مقترحات لك</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" dir="rtl" data-testid="section-for-you">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold" data-testid="heading-for-you">
            مقترحات لك
          </h2>
          <Badge variant="secondary" className="text-xs">
            {recommendations.length} مقالات
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {topInterests.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>اهتماماتك:</span>
              {topInterests.slice(0, 3).map((interest, idx) => (
                <Badge key={interest.categoryId} variant="outline" className="text-xs h-5">
                  {interest.categoryName}
                </Badge>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 gap-1"
            data-testid="button-refresh-recommendations"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.slice(0, 6).map((rec) => {
          const article = rec.article;
          const timeAgo = article.publishedAt
            ? formatDistanceToNow(new Date(article.publishedAt), {
                addSuffix: true,
                locale: arSA,
              })
            : null;

          return (
            <Link key={rec.id || article.id} href={`/article/${article.slug}`}>
              <Card 
                className="cursor-pointer h-full overflow-hidden border-0 dark:border dark:border-card-border group hover-elevate active-elevate-2 transition-all"
                data-testid={`card-recommendation-${article.id}`}
              >
                {(article.imageUrl || article.thumbnailUrl) && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={article.thumbnailUrl ?? article.imageUrl ?? ''}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <div className="flex items-center gap-1.5 text-white/90 text-xs">
                        {getReasonIcon(rec.reason)}
                        <span>{rec.reasonText}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(article.isAiGeneratedThumbnail || article.isAiGeneratedImage) && (
                      <Badge className="text-xs h-5 gap-1 bg-purple-500/90 hover:bg-purple-600 text-white border-0">
                        الصورة
                        <Brain className="h-2.5 w-2.5" aria-hidden="true" />
                      </Badge>
                    )}

                    {article.newsType === "breaking" ? (
                      <Badge variant="destructive" className="text-xs h-5 gap-1">
                        <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                        عاجل
                      </Badge>
                    ) : isNewArticle(article.publishedAt) ? (
                      <Badge className="text-xs h-5 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600">
                        <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                        جديد
                      </Badge>
                    ) : article.category?.nameAr ? (
                      <Badge className="text-xs h-5 bg-muted text-muted-foreground border-0">
                        {article.category.nameAr}
                      </Badge>
                    ) : null}

                    {!article.imageUrl && !article.thumbnailUrl && (
                      <Badge variant="outline" className="text-xs h-5 gap-1 text-primary border-primary/30">
                        {getReasonIcon(rec.reason)}
                        {rec.reasonText}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 
                    className={`font-bold text-base line-clamp-2 transition-colors ${
                      article.newsType === "breaking"
                        ? "text-destructive"
                        : "group-hover:text-primary"
                    }`}
                    data-testid={`text-recommendation-title-${article.id}`}
                  >
                    {article.title}
                  </h3>
                  
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    {timeAgo && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                      </div>
                    )}
                    
                    {article.views !== undefined && (
                      <ViewsCount 
                        views={article.views}
                        iconClassName="h-3 w-3"
                      />
                    )}

                    {(article.commentsCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {article.commentsCount}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {recommendations.length > 6 && (
        <div className="flex justify-center pt-2">
          <Link href="/explore">
            <Button variant="outline" className="gap-2" data-testid="button-view-more-recommendations">
              عرض المزيد من المقترحات
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
