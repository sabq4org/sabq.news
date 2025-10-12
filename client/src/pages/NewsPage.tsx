import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Sparkles } from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Link } from "wouter";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function NewsPage() {
  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: articles = [], isLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles"],
    staleTime: 30000,
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-24" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card 
                  className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden"
                  data-testid={`card-article-${article.id}`}
                >
                  {article.imageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {article.category && (
                        <Badge 
                          variant="default" 
                          className="absolute top-3 right-3 shadow-md" 
                          data-testid={`badge-category-${article.id}`}
                        >
                          {article.category.icon} {article.category.nameAr}
                        </Badge>
                      )}
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
                      className="font-bold text-lg line-clamp-2 text-foreground"
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
                              locale: ar,
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
        )}
      </main>
    </div>
  );
}
