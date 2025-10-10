import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Eye } from "lucide-react";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface PersonalizedFeedProps {
  articles: ArticleWithDetails[];
  title?: string;
  showReason?: boolean;
}

export function PersonalizedFeed({ articles, title = "لك خصيصًا", showReason = true }: PersonalizedFeedProps) {
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
        مقالات مختارة بعناية بناءً على اهتماماتك وتفضيلاتك
      </p>

      <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:space-y-0">
        {articles.map((article) => (
          <Link key={article.id} href={`/article/${article.slug}`}>
            <Card 
              className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden"
              data-testid={`card-article-${article.id}`}
            >
              {/* Mobile: Horizontal Layout */}
              <div className="md:hidden flex gap-3 p-3">
                {article.imageUrl && (
                  <div className="relative flex-shrink-0">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-24 h-24 object-cover object-center rounded-md"
                    />
                    {article.aiSummary && (
                      <div className="absolute top-1 left-1">
                        <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs px-1 py-0">
                          <Sparkles className="h-2 w-2 ml-0.5" />
                          AI
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex-1 min-w-0 space-y-2">
                  {article.category && (
                    <Badge variant="outline" className="text-xs" data-testid={`badge-category-${article.id}`}>
                      {article.category.nameAr}
                    </Badge>
                  )}
                  
                  <h3 
                    className="font-bold text-sm line-clamp-2 text-foreground"
                    data-testid={`text-article-title-${article.id}`}
                  >
                    {article.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {article.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {formatDistanceToNow(new Date(article.publishedAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Vertical Layout */}
              <div className="hidden md:block">
                {article.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    {article.aiSummary && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                          <Sparkles className="h-3 w-3 ml-1" />
                          ذكاء اصطناعي
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                <CardContent className="p-4 space-y-3">
                  {article.category && (
                    <Badge variant="outline" data-testid={`badge-category-${article.id}`}>
                      {article.category.nameAr}
                    </Badge>
                  )}
                  
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
                    
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.views || 0}</span>
                    </div>
                  </div>

                  {showReason && article.category && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground italic">
                        موصى به لأنك تهتم بـ {article.category.nameAr}
                      </p>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
