import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Clock, MessageSquare, Sparkles, Zap, Star, Flame, Loader2, ChevronDown } from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

interface PersonalizedFeedProps {
  articles: ArticleWithDetails[];
  title?: string;
  showReason?: boolean;
}

export function PersonalizedFeed({ articles: initialArticles, title = "جميع الأخبار", showReason = false }: PersonalizedFeedProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialArticles.length);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    setIsLoading(true);
    setError(null); // مسح الخطأ السابق
    
    try {
      const response = await fetch(
        `/api/homepage?limit=4&offset=${offset}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('فشل تحميل المزيد من الأخبار');
      }
      
      const data = await response.json();
      const newArticles = data.forYou || [];
      
      if (newArticles.length === 0) {
        setHasMore(false); // فقط هنا نخفي الزر (لا توجد أخبار متبقية)
      } else {
        setArticles([...articles, ...newArticles]);
        setOffset(offset + 4);
        
        if (newArticles.length < 4) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء التحميل');
      // ✅ لا نضع hasMore = false هنا! نبقيه true لإمكانية retry
    } finally {
      setIsLoading(false);
    }
  };

  if (!articles || articles.length === 0) return null;

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Newspaper className="h-6 w-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold" data-testid="heading-personalized-feed">
          {title}
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        نشر كل الأخبار المضافة مرتبة من الأحدث إلى الأقدم
      </p>

      {/* Mobile View: Vertical List (like RecommendationsWidget) */}
      <Card className="overflow-hidden lg:hidden border-0 dark:border dark:border-card-border">
        <CardContent className="p-0">
          <div className="dark:divide-y">
            {articles.map((article, index) => {
              const timeAgo = article.publishedAt
                ? formatDistanceToNow(new Date(article.publishedAt), {
                    addSuffix: true,
                    locale: arSA,
                  })
                : null;

              return (
                <div key={article.id}>
                  <Link href={`/article/${article.slug}`}>
                    <div 
                      className="block group cursor-pointer"
                      data-testid={`link-article-mobile-${article.id}`}
                    >
                      <div className={`p-4 hover-elevate active-elevate-2 transition-all ${
                        article.newsType === "breaking" ? "bg-destructive/5" : ""
                      }`}>
                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden">
                            {(article.imageUrl || article.thumbnailUrl) ? (
                              <img
                                src={article.thumbnailUrl ?? article.imageUrl ?? ''}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                                style={{
                                  objectPosition: (article as any).imageFocalPoint
                                    ? `${(article as any).imageFocalPoint.x}% ${(article as any).imageFocalPoint.y}%`
                                    : 'center'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Breaking/Featured/Category Badge */}
                            {article.newsType === "breaking" ? (
                              <Badge 
                                variant="destructive" 
                                className="text-xs h-5 gap-1"
                                data-testid={`badge-breaking-${article.id}`}
                              >
                                <Zap className="h-3 w-3" />
                                عاجل
                              </Badge>
                            ) : isNewArticle(article.publishedAt) ? (
                              <Badge 
                                className="text-xs h-5 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
                                data-testid={`badge-new-${article.id}`}
                              >
                                <Flame className="h-3 w-3" />
                                جديد
                              </Badge>
                            ) : article.category ? (
                              <Badge 
                                className="text-xs h-5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0"
                                data-testid={`badge-article-category-${article.id}`}
                              >
                                {article.category.nameAr}
                              </Badge>
                            ) : null}

                            {/* Title */}
                            <h4 className={`font-bold text-sm line-clamp-2 leading-snug transition-colors ${
                              article.newsType === "breaking"
                                ? "text-destructive"
                                : "group-hover:text-primary"
                            }`} data-testid={`text-article-title-${article.id}`}>
                              {article.title}
                            </h4>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {timeAgo && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {timeAgo}
                                </span>
                              )}
                              <ViewsCount 
                                views={article.views || 0}
                                iconClassName="h-3 w-3"
                              />
                              {(article.commentsCount ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {article.commentsCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Desktop View: Grid with 4 columns (original design) */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => (
          <Link key={article.id} href={`/article/${article.slug}`}>
            <Card 
              className={`cursor-pointer h-full overflow-hidden border-0 dark:border dark:border-card-border ${
                article.newsType === "breaking" ? "bg-destructive/5" : ""
              }`}
              data-testid={`card-article-${article.id}`}
            >
              {(article.imageUrl || article.thumbnailUrl) && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.thumbnailUrl ?? article.imageUrl ?? ''}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    style={{
                      objectPosition: (article as any).imageFocalPoint
                        ? `${(article as any).imageFocalPoint.x}% ${(article as any).imageFocalPoint.y}%`
                        : 'center'
                    }}
                  />
                  {article.newsType === "breaking" ? (
                    <Badge 
                      variant="destructive" 
                      className="absolute top-3 right-3 gap-1" 
                      data-testid={`badge-breaking-${article.id}`}
                    >
                      <Zap className="h-3 w-3" />
                      عاجل
                    </Badge>
                  ) : isNewArticle(article.publishedAt) ? (
                    <Badge 
                      className="absolute top-3 right-3 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600" 
                      data-testid={`badge-new-${article.id}`}
                    >
                      <Flame className="h-3 w-3" />
                      جديد
                    </Badge>
                  ) : article.category ? (
                    <Badge 
                      className="absolute top-3 right-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0" 
                      data-testid={`badge-category-${article.id}`}
                    >
                      {article.category.nameAr}
                    </Badge>
                  ) : null}
                  {article.aiSummary && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                        <Sparkles className="h-3 w-3 ml-1" />
                        ذكاء اصطناعي
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              
              <CardContent className="p-4 space-y-3">
                
                <h3 
                  className={`font-bold text-lg line-clamp-2 ${
                    article.newsType === "breaking"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                  data-testid={`text-article-title-${article.id}`}
                >
                  {article.title}
                </h3>
                
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  {article.publishedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(article.publishedAt), {
                          addSuffix: true,
                          locale: arSA,
                        })}
                      </span>
                    </div>
                  )}
                  
                  <ViewsCount 
                    views={article.views || 0}
                    iconClassName="h-3 w-3"
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* زر "المزيد من الأخبار" */}
      {hasMore && (
        <div className="flex flex-col items-center gap-3 pt-6">
          {/* Error Message */}
          {error && (
            <div 
              className="text-destructive text-sm text-center bg-destructive/10 px-4 py-2 rounded-md"
              data-testid="error-load-more"
            >
              {error}
            </div>
          )}
          
          {/* Load More Button */}
          <Button
            onClick={loadMore}
            disabled={isLoading}
            size="lg"
            className="gap-2 min-w-[200px]"
            data-testid="button-load-more-news"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري التحميل...
              </>
            ) : error ? (
              <>
                <ChevronDown className="h-5 w-5" />
                إعادة المحاولة
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5" />
                المزيد من الأخبار
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
