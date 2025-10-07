import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Eye, Heart, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails } from "@shared/schema";
import { Header } from "@/components/Header";

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && articles && articles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const timeAgo = article.publishedAt
                ? formatDistanceToNow(new Date(article.publishedAt), {
                    addSuffix: true,
                    locale: arSA,
                  })
                : null;

              return (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card className="group cursor-pointer h-full hover-elevate active-elevate-2 transition-all duration-300" data-testid={`card-article-${article.slug}`}>
                    <CardContent className="p-0">
                      {article.imageUrl && (
                        <div className="relative aspect-video overflow-hidden rounded-t-lg">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            data-testid={`img-article-${article.slug}`}
                          />
                        </div>
                      )}

                      <div className="p-6 space-y-4">
                        {article.category && (
                          <Badge variant="secondary" className="text-xs" data-testid="badge-category">
                            {article.category.nameAr}
                          </Badge>
                        )}

                        <h2 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors" data-testid="text-article-title">
                          {article.title}
                        </h2>

                        {article.excerpt && (
                          <p className="text-muted-foreground line-clamp-2 text-sm" data-testid="text-article-excerpt">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {timeAgo && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {article.reactionsCount || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
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
