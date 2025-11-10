import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Clock, 
  Heart, 
  MessageCircle, 
  Bookmark,
  Sparkles,
  Brain,
  TrendingUp,
  Eye
} from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import { Link } from "wouter";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import FollowStoryButton from "./FollowStoryButton";
import { OptimizedImage } from "./OptimizedImage";

interface ArticleCardProps {
  article: ArticleWithDetails;
  variant?: "grid" | "featured" | "list" | "compact";
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

  const getObjectPosition = () => {
    const focalPoint = (article as any).imageFocalPoint;
    return focalPoint ? `${focalPoint.x}% ${focalPoint.y}%` : 'center';
  };

  // Convert gs:// URLs to proxy URLs for display
  const getDisplayImageUrl = () => {
    if (!article.imageUrl) return null;
    
    // If it's a gs:// URL, it needs to be proxied
    // We'll extract the media ID from usedIn or create a proxy URL
    // For now, return as-is since gs:// URLs should be stored in database
    // and will be handled by backend proxy
    if (article.imageUrl.startsWith('gs://')) {
      // gs:// URLs should not be in articles anymore after our fix
      // But if they are, we can't convert without media ID
      console.warn('[ArticleCard] Found gs:// URL in article, this should not happen:', article.imageUrl);
      return article.imageUrl; // Will fail to load, but better than crashing
    }
    
    return article.imageUrl;
  };

  const displayImageUrl = getDisplayImageUrl();

  // Smart AI Indicator
  const getAIInsight = () => {
    if (article.aiGenerated) return { icon: Brain, text: "محتوى مُنشأ بالذكاء الاصطناعي" };
    if ((article.reactionsCount || 0) > 100) return { icon: TrendingUp, text: "تفاعل عالي من القراء" };
    if ((article.views || 0) > 500) return { icon: Eye, text: "الأكثر مشاهدة" };
    return null;
  };

  const aiInsight = getAIInsight();

  if (variant === "featured") {
    return (
      <Link href={`/article/${article.slug}`} data-testid={`link-article-${article.id}`}>
        <Card className="group overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 !border-0 !bg-transparent">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden">
            {displayImageUrl ? (
              <OptimizedImage
                src={displayImageUrl}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                objectPosition={getObjectPosition()}
                priority={true}
                fallbackGradient="from-primary/20 via-accent/20 to-primary/10"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-wrap gap-2">
              {article.category && (
                <Badge 
                  className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-200 border-0 text-xs sm:text-sm shadow-md" 
                  data-testid={`badge-category-${article.id}`}
                >
                  {article.category.nameAr}
                </Badge>
              )}
            </div>

            {aiInsight && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                      <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 gap-1.5 shadow-lg">
                        <aiInsight.icon className="h-3.5 w-3.5" />
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{aiInsight.text}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

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

  if (variant === "compact") {
    return (
      <Link href={`/article/${article.slug}`} data-testid={`link-article-${article.id}`}>
        <Card className="group overflow-hidden rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 !border-0 !bg-transparent">
          <CardContent className="p-3">
            <div className="flex items-start gap-2 mb-2">
              {article.category && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0.5 border-primary/20 text-primary"
                  data-testid={`badge-category-${article.id}`}
                >
                  {article.category.nameAr}
                </Badge>
              )}
              {aiInsight && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-primary/20">
                        <aiInsight.icon className="h-2.5 w-2.5 text-primary" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{aiInsight.text}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2" data-testid={`text-title-${article.id}`}>
              {article.title}
            </h3>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              {timeAgo && <span>{timeAgo}</span>}
              <ViewsCount 
                views={article.views || 0}
                iconClassName="h-2.5 w-2.5"
              />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Card className="group rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 !border-0 !bg-transparent">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Link href={`/article/${article.slug}`} className="flex-shrink-0" data-testid={`link-article-${article.id}`}>
              <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                {displayImageUrl ? (
                  <OptimizedImage
                    src={displayImageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    objectPosition={getObjectPosition()}
                    priority={false}
                    fallbackGradient="from-primary/10 to-accent/10"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
                )}
                {article.category && (
                  <div className="absolute bottom-2 right-2">
                    <Badge 
                      className="bg-primary/90 backdrop-blur-sm text-white border-0 text-[10px] px-2 py-0.5"
                      data-testid={`badge-category-${article.id}`}
                    >
                      {article.category.nameAr}
                    </Badge>
                  </div>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                {aiInsight && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs gap-1 border-primary/20" data-testid={`badge-ai-${article.id}`}>
                          <aiInsight.icon className="h-3 w-3 text-primary" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{aiInsight.text}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <Link href={`/article/${article.slug}`}>
                <h3 className="text-[17px] font-semibold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors" data-testid={`text-title-${article.id}`}>
                  {article.title}
                </h3>
              </Link>

              {article.aiSummary && (
                <p className="text-sm text-[#475569] line-clamp-2 mb-3 leading-relaxed">
                  {article.aiSummary}
                </p>
              )}

              {article.storyId && article.storyTitle && (
                <div className="mb-3" onClick={(e) => e.preventDefault()}>
                  <FollowStoryButton 
                    storyId={article.storyId} 
                    storyTitle={article.storyTitle}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-slate-500">
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
                    <span className="text-xs">{(article.reactionsCount || 0).toLocaleString('en-US')}</span>
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

  // Grid variant (default) - Professional News Card
  return (
    <Card className="group overflow-hidden rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 !border-0 !bg-transparent" data-testid={`card-article-${article.id}`}>
      <CardContent className="p-0">
        <Link href={`/article/${article.slug}`} data-testid={`link-article-${article.id}`}>
          <div className="relative aspect-[16/9] overflow-hidden">
            {displayImageUrl ? (
              <OptimizedImage
                src={displayImageUrl}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                objectPosition={getObjectPosition()}
                priority={false}
                fallbackGradient="from-primary/10 to-accent/10"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
            )}
            
            <div className="absolute top-3 right-3 flex flex-wrap gap-2">
              {article.category && (
                <Badge 
                  className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-200 border-0 text-xs shadow-md"
                  data-testid={`badge-category-${article.id}`}
                >
                  {article.category.nameAr}
                </Badge>
              )}
              {aiInsight && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 gap-1.5 shadow-lg">
                        <aiInsight.icon className="h-3.5 w-3.5" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{aiInsight.text}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/article/${article.slug}`}>
            <h3 className="text-[17px] font-semibold mb-2 line-clamp-2 leading-snug text-[#0F172A] dark:text-foreground group-hover:text-primary transition-colors" data-testid={`text-title-${article.id}`}>
              {article.title}
            </h3>
          </Link>

        {article.aiSummary && (
          <p className="text-sm text-[#475569] dark:text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {article.aiSummary}
          </p>
        )}

        {article.storyId && article.storyTitle && (
          <div className="mb-3" onClick={(e) => e.preventDefault()}>
            <FollowStoryButton 
              storyId={article.storyId} 
              storyTitle={article.storyTitle}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-muted-foreground">
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
      </div>
      </CardContent>
    </Card>
  );
}
