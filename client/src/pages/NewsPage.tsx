import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { ArticleWithDetails } from "@shared/schema";

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: articles = [], isLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles"],
    staleTime: 30000,
  });

  const formatPublishedDate = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} onSearch={setSearchQuery} />

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-news">
            الأخبار
          </h1>
          <p className="text-muted-foreground">
            جميع الأخبار مرتبة حسب التاريخ
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <Skeleton className="w-full md:w-64 h-48 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              لا توجد أخبار متاحة حالياً
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden" data-testid={`card-article-${article.id}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      {article.imageUrl && (
                        <div className="w-full md:w-64 h-48 md:h-auto relative overflow-hidden">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="space-y-3">
                          {/* Category Badge */}
                          {article.category && (
                            <Badge variant="default" data-testid={`badge-category-${article.id}`}>
                              {article.category.nameAr}
                            </Badge>
                          )}

                          {/* Title */}
                          <h2 className="text-xl md:text-2xl font-bold text-foreground line-clamp-2" data-testid={`heading-article-title-${article.id}`}>
                            {article.title}
                          </h2>

                          {/* AI Summary or Excerpt */}
                          {(article.aiSummary || article.excerpt) && (
                            <p className="text-muted-foreground text-sm line-clamp-3">
                              {article.aiSummary || article.excerpt}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{article.views || 0}</span>
                            </div>
                            {article.publishedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatPublishedDate(article.publishedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
