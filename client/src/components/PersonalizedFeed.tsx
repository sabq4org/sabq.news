import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, MessageSquare } from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

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
        <Newspaper className="h-6 w-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold" data-testid="heading-personalized-feed">
          {title}
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        نشر كل الأخبار المضافة مرتبة من الأحدث إلى الأقدم
      </p>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y">
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
                      data-testid={`link-article-${article.id}`}
                    >
                      <div className="p-4 hover-elevate active-elevate-2 transition-all">
                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden">
                            {article.imageUrl ? (
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
                            )}
                            {/* Number Badge */}
                            <div className="absolute bottom-1 left-1">
                              <Badge 
                                variant="secondary" 
                                className="h-5 px-1.5 text-xs font-bold bg-background/90 backdrop-blur-sm"
                              >
                                {index + 1}
                              </Badge>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Category */}
                            {article.category && (
                              <Badge 
                                variant="outline" 
                                className="text-xs h-5"
                                data-testid={`badge-article-category-${article.id}`}
                              >
                                {article.category.icon} {article.category.nameAr}
                              </Badge>
                            )}

                            {/* Title */}
                            <h4 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors" data-testid={`text-article-title-${article.id}`}>
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
    </section>
  );
}
