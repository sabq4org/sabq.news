import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type OpinionArticle = {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  imageUrl?: string;
  publishedAt?: string;
  views: number;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  category?: {
    id: string;
    nameAr: string;
    icon?: string;
  };
};

export function OpinionArticlesBlock() {
  const { data: articles, isLoading } = useQuery<{ articles: OpinionArticle[]; total: number }>({
    queryKey: ["/api/opinion", { page: 1, limit: 6 }],
    queryFn: async () => {
      const res = await fetch("/api/opinion?page=1&limit=6", {
        credentials: "include",
      });
      if (!res.ok) return { articles: [], total: 0 };
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <section className="py-8" dir="rtl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">مقالات الرأي</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm border border-border dark:border-card-border">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-5 bg-muted rounded w-full"></div>
                  <div className="h-5 bg-muted rounded w-4/5"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!articles || articles.articles.length === 0) {
    return null;
  }

  return (
    <section className="py-8" dir="rtl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">مقالات الرأي</h2>
          </div>
          <Link href="/opinion">
            <Button variant="ghost" className="gap-2" data-testid="button-view-all-opinions">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {articles.articles.map((article) => {
            const authorName = article.author
              ? `${article.author.firstName || ""} ${article.author.lastName || ""}`.trim() || "كاتب"
              : "كاتب";

            return (
              <Link key={article.id} href={`/opinion/${article.slug}`}>
                <Card className="h-full hover-elevate active-elevate-2 overflow-hidden shadow-sm border border-border dark:border-card-border" data-testid={`opinion-card-${article.id}`}>
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        رأي
                      </Badge>
                      {article.category && (
                        <Badge variant="secondary">
                          {article.category.icon} {article.category.nameAr}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold line-clamp-2 leading-tight">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground pt-2 border-t border-border dark:border-border/60">
                      <div className="flex items-center gap-2">
                        {article.author?.profileImageUrl ? (
                          <img
                            src={article.author.profileImageUrl}
                            alt={authorName}
                            className="h-6 w-6 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                        <span className="font-medium">{authorName}</span>
                      </div>
                      {article.publishedAt && (
                        <span>
                          {formatDistanceToNow(new Date(article.publishedAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
