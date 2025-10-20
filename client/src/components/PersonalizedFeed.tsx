import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock } from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface PersonalizedFeedProps {
  articles: ArticleWithDetails[];
  title?: string;
  showReason?: boolean;
}

export function PersonalizedFeed({ articles, title = "جميع الأخبار", showReason = false }: PersonalizedFeedProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold" data-testid="heading-personalized-feed">
          {title}
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        نشر كل الأخبار المضافة مرتبة من الأحدث إلى الأقدم
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => (
          <Link key={article.id} href={`/article/${article.slug}`}>
            <Card 
              className="cursor-pointer h-full overflow-hidden border border-card-border"
              data-testid={`card-article-${article.id}`}
            >
              {article.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  {article.category && (
                    <Badge 
                      variant="default" 
                      className="absolute top-3 right-3" 
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
    </section>
  );
}
