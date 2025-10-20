import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Heart, 
  MessageCircle, 
  Bookmark,
  Sparkles 
} from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import { Link } from "wouter";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import FollowStoryButton from "./FollowStoryButton";

interface ArticleCardProps {
  article: ArticleWithDetails;
  variant?: "grid" | "featured" | "list";
  onReact?: (articleId: string) => void;
  onBookmark?: (articleId: string) => void;
}

export function ArticleCard({ 
  article, 
  variant = "grid",
  onReact,
  onBookmark 
}: ArticleCardProps) {
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { 
        addSuffix: true, 
        locale: arSA 
      })
    : null;

  if (variant === "featured") {
    return (
      <Link href={`/article/${article.slug}`} data-testid={`link-article-${article.id}`}>
        <Card className="group overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 border-0 shadow-lg">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-wrap gap-2">
              {article.category && (
                <Badge variant="default" className="shadow-lg text-xs sm:text-sm" data-testid={`badge-category-${article.id}`}>
                  {article.category.icon} {article.category.nameAr}
                </Badge>
              )}
              {article.aiGenerated && (
                <Badge variant="secondary" className="shadow-lg gap-1 text-xs sm:text-sm" data-testid={`badge-ai-${article.id}`}>
                  <Sparkles className="h-3 w-3" />
                  ذكاء اصطناعي
                </Badge>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight" data-testid={`text-title-${article.id}`}>
                {article.title}
              </h2>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/80 flex-wrap">
                {article.author && (
                  <span className="font-medium">
                    {article.author.firstName} {article.author.lastName}
                  </span>
                )}
                {timeAgo && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    {timeAgo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Card className="group hover-elevate active-elevate-2 transition-all">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Link href={`/article/${article.slug}`} className="flex-shrink-0" data-testid={`link-article-${article.id}`}>
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-32 h-32 object-cover object-center rounded-md"
                  loading="lazy"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-md" />
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                {article.category && (
                  <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${article.id}`}>
                    {article.category.nameAr}
                  </Badge>
                )}
                {article.aiGenerated && (
                  <Badge variant="outline" className="text-xs gap-1" data-testid={`badge-ai-${article.id}`}>
                    <Sparkles className="h-3 w-3" />
                  </Badge>
                )}
              </div>

              <Link href={`/article/${article.slug}`}>
                <h3 className="text-lg font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-title-${article.id}`}>
                  {article.title}
                </h3>
              </Link>

              {article.storyId && article.storyTitle && (
                <div className="mb-3" onClick={(e) => e.preventDefault()}>
                  <FollowStoryButton 
                    storyId={article.storyId} 
                    storyTitle={article.storyTitle}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {timeAgo && <span>{timeAgo}</span>}
                  <ViewsCount 
                    views={article.views || 0}
                    iconClassName="h-3 w-3"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 hover-elevate"
                    onClick={(e) => {
                      e.preventDefault();
                      onReact?.(article.id);
                    }}
                    data-testid={`button-react-${article.id}`}
                  >
                    <Heart className={`h-4 w-4 ${article.hasReacted ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-xs">{article.reactionsCount || 0}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 hover-elevate"
                    onClick={(e) => {
                      e.preventDefault();
                      onBookmark?.(article.id);
                    }}
                    data-testid={`button-bookmark-${article.id}`}
                  >
                    <Bookmark className={`h-4 w-4 ${article.isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <Card className="group overflow-hidden hover-elevate active-elevate-2 transition-all" data-testid={`card-article-${article.id}`}>
      <Link href={`/article/${article.slug}`}>
        <div className="relative aspect-[16/9] overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {article.category && (
            <Badge 
              variant="default" 
              className="absolute top-3 right-3 shadow-md" 
              data-testid={`badge-category-${article.id}`}
            >
              {article.category.icon} {article.category.nameAr}
            </Badge>
          )}
          {article.aiGenerated && (
            <Badge 
              variant="secondary" 
              className="absolute top-3 left-3 shadow-md gap-1" 
              data-testid={`badge-ai-${article.id}`}
            >
              <Sparkles className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/article/${article.slug}`}>
          <h3 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors" data-testid={`text-title-${article.id}`}>
            {article.title}
          </h3>
        </Link>

        {article.storyId && article.storyTitle && (
          <div className="mb-3" onClick={(e) => e.preventDefault()}>
            <FollowStoryButton 
              storyId={article.storyId} 
              storyTitle={article.storyTitle}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover-elevate"
              onClick={(e) => {
                e.preventDefault();
                onReact?.(article.id);
              }}
              data-testid={`button-react-${article.id}`}
            >
              <Heart className={`h-4 w-4 ${article.hasReacted ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover-elevate"
              onClick={(e) => {
                e.preventDefault();
                onBookmark?.(article.id);
              }}
              data-testid={`button-bookmark-${article.id}`}
            >
              <Bookmark className={`h-4 w-4 ${article.isBookmarked ? 'fill-current' : ''}`} />
            </Button>

            <Link href={`/article/${article.slug}#comments`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover-elevate"
                onClick={(e) => e.stopPropagation()}
                data-testid={`button-comments-${article.id}`}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
