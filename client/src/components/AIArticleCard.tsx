import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Heart, 
  MessageCircle, 
  Bookmark,
  Sparkles,
  Zap,
  TrendingUp,
  Star,
  Brain
} from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import { Link } from "wouter";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import FollowStoryButton from "./FollowStoryButton";
import { motion } from "framer-motion";

interface AIArticleCardProps {
  article: ArticleWithDetails;
  aiScore?: number; // 0-1 score indicating AI confidence
  selectionReason?: "breaking" | "trending" | "featured" | "recommended";
  variant?: "grid" | "featured" | "list";
  onReact?: (articleId: string) => void;
  onBookmark?: (articleId: string) => void;
}

// Get reason badge based on selection reason
function getReasonBadge(reason?: string) {
  switch (reason) {
    case "breaking":
      return { label: "عاجل", icon: <Zap className="h-3 w-3" />, color: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50" };
    case "trending":
      return { label: "رائج", icon: <TrendingUp className="h-3 w-3" />, color: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50" };
    case "featured":
      return { label: "مميز", icon: <Star className="h-3 w-3" />, color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50" };
    case "recommended":
      return { label: "موصى به", icon: <Brain className="h-3 w-3" />, color: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50" };
    default:
      return null;
  }
}

export function AIArticleCard({ 
  article, 
  aiScore = 0.85,
  selectionReason,
  variant = "grid",
  onReact,
  onBookmark 
}: AIArticleCardProps) {
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { 
        addSuffix: true, 
        locale: arSA 
      })
    : null;

  const reasonBadge = getReasonBadge(selectionReason);
  const scorePercentage = Math.round(aiScore * 100);

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href={`/article/${article.slug}`} data-testid={`link-article-${article.id}`}>
          <Card className="group overflow-hidden border-2 border-primary/30 dark:border-primary/20 relative bg-gradient-to-br from-primary/5 via-background to-accent/5">
            {/* AI Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" style={{ padding: '2px' }}>
              <div className="absolute inset-[2px] bg-card rounded-lg" />
            </div>
            
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
                {/* AI Badge */}
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 gap-1.5 text-xs sm:text-sm shadow-lg" data-testid={`badge-ai-${article.id}`}>
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  اختيار ذكي
                </Badge>
                
                {reasonBadge && (
                  <Badge className={`${reasonBadge.color} border gap-1 text-xs sm:text-sm backdrop-blur-sm`} data-testid={`badge-reason-${article.id}`}>
                    {reasonBadge.icon}
                    {reasonBadge.label}
                  </Badge>
                )}
              </div>

              {/* AI Score Indicator */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                <div className="bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
                  <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                  <span className="text-xs sm:text-sm font-bold text-white">{scorePercentage}%</span>
                </div>
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
      </motion.div>
    );
  }

  // Grid variant (default) - AI Enhanced with Mobile Optimization
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card 
        className="group border-2 border-primary/20 dark:border-primary/10 relative h-full bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col md:flex-col" 
        data-testid={`card-ai-article-${article.id}`}
      >
        <div className="relative z-10 flex flex-col md:flex-col h-full">
          <Link href={`/article/${article.slug}`}>
            {/* Mobile: Smaller Image | Desktop: Standard */}
            <div className="relative aspect-[2/1] sm:aspect-[16/9] overflow-hidden">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Compact AI Badge for Mobile */}
              <Badge 
                className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 gap-1 shadow-lg text-xs px-2" 
                data-testid={`badge-ai-${article.id}`}
              >
                <Sparkles className="h-3 w-3" />
                <span>AI</span>
              </Badge>

              {/* Compact Reason Badge */}
              {reasonBadge && (
                <Badge 
                  className={`absolute top-2 sm:top-3 left-2 sm:left-3 ${reasonBadge.color} border gap-1 backdrop-blur-sm text-xs px-2`}
                  data-testid={`badge-reason-${article.id}`}
                >
                  <span>{reasonBadge.label}</span>
                </Badge>
              )}
            </div>
          </Link>

          <CardContent className="p-3 sm:p-4 relative flex-1 flex flex-col">
            {/* Compact AI Score Bar */}
            <div className="mb-2 sm:mb-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-primary">
                <Brain className="h-3 w-3" />
                <span>{scorePercentage}%</span>
              </div>
            </div>

            <Link href={`/article/${article.slug}`}>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors" data-testid={`text-title-${article.id}`}>
                {article.title}
              </h3>
            </Link>

            {article.storyId && article.storyTitle && (
              <div className="mb-2 sm:mb-3 hidden sm:block" onClick={(e) => e.preventDefault()}>
                <FollowStoryButton 
                  storyId={article.storyId} 
                  storyTitle={article.storyTitle}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-primary/10 mt-auto">
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                {timeAgo && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo}</span>
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
                  className="max-sm:hidden"
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
                    className="max-sm:hidden"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`button-comments-${article.id}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
