import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import type { ArticleWithDetails } from "@shared/schema";

interface ContinueReadingArticle extends ArticleWithDetails {
  progress: number;
  lastReadAt: Date;
  reasonText?: string;
  reasonType?: string;
}

interface ContinueReadingResponse {
  articles: ContinueReadingArticle[];
}

export function ContinueReadingWidget() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<ContinueReadingResponse>({
    queryKey: ["/api/personalization/continue-reading"],
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-6" dir="rtl">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const articles = data?.articles || [];

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="py-6" dir="rtl" data-testid="section-continue-reading">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">تابع القراءة</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              data-testid={`link-continue-article-${article.id}`}
            >
              <Card className="group hover-elevate transition-all duration-200 h-full overflow-hidden">
                <CardContent className="p-0">
                  {article.imageUrl && (
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge
                        variant="secondary"
                        className="absolute bottom-2 right-2 bg-primary/90 text-primary-foreground"
                        data-testid={`badge-progress-${article.id}`}
                      >
                        {article.progress}% مقروء
                      </Badge>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <div className="space-y-2">
                      <Progress
                        value={article.progress}
                        className="h-1.5"
                        data-testid={`progress-${article.id}`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(article.lastReadAt), {
                              addSuffix: true,
                              locale: arSA,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <span>أكمل القراءة</span>
                          <ArrowLeft className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
