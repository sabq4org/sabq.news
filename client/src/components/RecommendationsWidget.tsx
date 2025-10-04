import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import type { ArticleWithDetails } from "@shared/schema";

interface RecommendationsWidgetProps {
  articles: ArticleWithDetails[];
  title?: string;
  reason?: string;
}

export function RecommendationsWidget({ 
  articles, 
  title = "مقترحات لك",
  reason = "بناءً على قراءاتك السابقة" 
}: RecommendationsWidgetProps) {
  if (articles.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          {reason}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {articles.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <a 
                  className="flex-shrink-0 w-64 group"
                  data-testid={`link-recommendation-${article.id}`}
                >
                  <div className="rounded-lg overflow-hidden hover-elevate active-elevate-2 transition-all">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
                      )}
                      {article.category && (
                        <Badge 
                          variant="default" 
                          className="absolute top-2 right-2 shadow-md text-xs"
                          data-testid={`badge-rec-category-${article.id}`}
                        >
                          {article.category.nameAr}
                        </Badge>
                      )}
                    </div>
                    <div className="p-3 bg-card">
                      <h4 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors" data-testid={`text-rec-title-${article.id}`}>
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {article.views} مشاهدة
                      </p>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
