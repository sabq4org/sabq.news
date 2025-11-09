import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Tag, MessageSquare, Flame, Zap, Sparkles } from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails } from "@shared/schema";
import { Header } from "@/components/Header";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

export default function KeywordPage() {
  const params = useParams();
  const keyword = decodeURIComponent(params.keyword || "");

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: articles, isLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/keyword", keyword],
    queryFn: async () => {
      const res = await fetch(`/api/keyword/${encodeURIComponent(keyword)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Tag className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-keyword-title">
              {keyword}
            </h1>
          </div>
          {!isLoading && articles && (
            <p className="text-muted-foreground" data-testid="text-articles-count">
              {articles.length} {articles.length === 1 ? "مقال" : "مقالات"}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Articles - Matching PersonalizedFeed Design */}
        {!isLoading && articles && articles.length > 0 && (
          <>
            {/* Mobile View: Vertical List */}
            <Card className="overflow-hidden lg:hidden border-0 dark:border dark:border-card-border">
              <CardContent className="p-0">
                <div className="dark:divide-y">
                  {articles.map((article) => {
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
                                  {article.imageUrl ? (
                                    <img
                                      src={article.imageUrl}
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

            {/* Desktop View: Grid with 4 columns */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card 
                    className={`cursor-pointer h-full overflow-hidden border-0 dark:border dark:border-card-border ${
                      article.newsType === "breaking" ? "bg-destructive/5" : ""
                    }`}
                    data-testid={`card-article-${article.id}`}
                  >
                    {article.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.imageUrl}
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
          </>
        )}

        {/* Empty State */}
        {!isLoading && articles && articles.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2" data-testid="text-no-articles">
              لا توجد مقالات
            </h2>
            <p className="text-muted-foreground">
              لم نجد أي مقالات تحتوي على الكلمة المفتاحية "{keyword}"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
