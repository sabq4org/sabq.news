import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Tag, MessageSquare, Flame, Zap, Sparkles, Eye, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails } from "@shared/schema";
import { Header } from "@/components/Header";
import { OptimizedImage } from "@/components/OptimizedImage";

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
            <div className="p-2 rounded-lg bg-primary/10">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-keyword-title">
                {keyword}
              </h1>
              {!isLoading && articles && (
                <p className="text-sm text-muted-foreground" data-testid="text-articles-count">
                  {articles.length} {articles.length === 1 ? "مقال" : "مقالات"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/10] w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Articles Grid - Image Focused */}
        {!isLoading && articles && articles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((article) => {
              const timeAgo = article.publishedAt
                ? formatDistanceToNow(new Date(article.publishedAt), {
                    addSuffix: true,
                    locale: arSA,
                  })
                : null;
              
              const isInfographic = article.articleType === 'infographic';

              return (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card 
                    className={`cursor-pointer h-full overflow-hidden hover-elevate group transition-all ${
                      article.newsType === "breaking" ? "ring-2 ring-destructive/50" : ""
                    }`}
                    data-testid={`card-article-${article.id}`}
                  >
                    {/* Image Container - Large and Prominent */}
                    <div className={`relative overflow-hidden bg-muted ${
                      isInfographic ? 'aspect-[3/4]' : 'aspect-[16/10]'
                    }`}>
                      {article.imageUrl ? (
                        <OptimizedImage
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          preferSize={isInfographic ? "large" : "medium"}
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5">
                          {isInfographic ? (
                            <BarChart3 className="h-16 w-16 text-primary/30" />
                          ) : (
                            <div className="text-4xl text-primary/20">📰</div>
                          )}
                        </div>
                      )}
                      
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 right-3 flex flex-wrap gap-2">
                        {article.newsType === "breaking" && (
                          <Badge 
                            variant="destructive" 
                            className="gap-1 shadow-lg" 
                            data-testid={`badge-breaking-${article.id}`}
                          >
                            <Zap className="h-3 w-3" />
                            عاجل
                          </Badge>
                        )}
                        {isNewArticle(article.publishedAt) && article.newsType !== "breaking" && (
                          <Badge 
                            className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg" 
                            data-testid={`badge-new-${article.id}`}
                          >
                            <Flame className="h-3 w-3" />
                            جديد
                          </Badge>
                        )}
                        {isInfographic && (
                          <Badge 
                            className="gap-1 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg"
                            data-testid={`badge-infographic-${article.id}`}
                          >
                            <BarChart3 className="h-3 w-3" />
                            إنفوجرافيك
                          </Badge>
                        )}
                      </div>
                      
                      {/* AI Badge */}
                      {article.aiSummary && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary/90 text-primary-foreground shadow-lg">
                            <Sparkles className="h-3 w-3 ml-1" />
                            AI
                          </Badge>
                        </div>
                      )}
                      
                      {/* Bottom Stats Overlay */}
                      <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white/90 text-xs">
                        <div className="flex items-center gap-3">
                          {(article.views || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {(article.views || 0).toLocaleString('ar-SA')}
                            </span>
                          )}
                          {(article.commentsCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {article.commentsCount}
                            </span>
                          )}
                        </div>
                        {timeAgo && (
                          <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <CardContent className="p-4 space-y-2">
                      {/* Category */}
                      {article.category && (
                        <Badge 
                          variant="secondary"
                          className="text-xs"
                          data-testid={`badge-category-${article.id}`}
                        >
                          {article.category.icon} {article.category.nameAr}
                        </Badge>
                      )}
                      
                      {/* Title */}
                      <h3 
                        className={`font-bold text-base line-clamp-2 leading-snug transition-colors ${
                          article.newsType === "breaking"
                            ? "text-destructive"
                            : "group-hover:text-primary"
                        }`}
                        data-testid={`text-article-title-${article.id}`}
                      >
                        {article.title}
                      </h3>
                      
                      {/* Excerpt - Only for non-infographics */}
                      {!isInfographic && article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && articles && articles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Tag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-no-articles">
              لا توجد مقالات
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              لم نجد أي مقالات تحتوي على الكلمة المفتاحية "{keyword}"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
