import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Clock, Eye, Share2, Bookmark, ChevronDown, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { Article, Category, User } from "@shared/schema";

type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
};

interface SwipeCardProps {
  article: ArticleWithDetails;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  isTop: boolean;
  canGoBack: boolean;
}

export function SwipeCard({ article, onSwipeUp, onSwipeDown, isTop, canGoBack }: SwipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-300, 0, 300], [0.3, 1, 0.3]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 80;
      const swipeVelocity = 400;

      if (info.offset.y < -swipeThreshold || info.velocity.y < -swipeVelocity) {
        onSwipeUp();
      } else if ((info.offset.y > swipeThreshold || info.velocity.y > swipeVelocity) && canGoBack) {
        onSwipeDown();
      }
    },
    [onSwipeUp, onSwipeDown, canGoBack]
  );

  const imageUrl = article.imageUrl || article.thumbnailUrl;
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : new Date();
  const smartSummary = article.aiSummary || article.excerpt;
  
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: false, locale: arSA });

  return (
    <>
      <motion.div
        className={`absolute inset-0 ${isTop ? 'z-10' : 'z-0'}`}
        style={{ y: isTop ? y : 0, opacity: isTop ? opacity : 0.4 }}
        drag={isTop ? "y" : false}
        dragConstraints={{ top: -200, bottom: canGoBack ? 200 : 50 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        initial={{ opacity: isTop ? 1 : 0 }}
        animate={{ opacity: isTop ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0 }}
        data-testid={`swipe-card-${article.id}`}
      >
        <div className="h-full w-full overflow-hidden bg-black touch-pan-y">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
          )}
          
          <div className="absolute inset-x-0 top-[35%] bottom-0 bg-gradient-to-b from-transparent via-black/80 to-black" />

          <div className="absolute inset-x-0 top-[42%] bottom-0 px-5" dir="rtl">
            <div className="flex items-center gap-2 mb-3">
              {article.category && (
                <span 
                  className="px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: article.category.color || 'hsl(var(--primary))' }}
                  data-testid="badge-category"
                >
                  {article.category.nameAr}
                </span>
              )}
              <span className="text-white/60 text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>

            <h1 
              className="text-[26px] font-bold text-white leading-[1.4] mb-4"
              data-testid="text-article-title"
            >
              {article.title}
            </h1>

            {smartSummary && (
              <p className="text-white/75 text-[15px] leading-relaxed mb-6 line-clamp-4">
                {smartSummary}
              </p>
            )}

            <Button
              onClick={() => setShowDetails(true)}
              className="bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border-0 rounded-full px-8 py-3 text-base"
              data-testid="button-read-details"
            >
              اقرأ التفاصيل
            </Button>
          </div>

          {isTop && (
            <div className="absolute bottom-24 left-5 flex items-center gap-2 text-white/50">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">اسحب</span>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            dir="rtl"
          >
            <div className="h-full overflow-y-auto">
              {imageUrl && (
                <div className="relative h-72 sm:h-96">
                  <img
                    src={imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  
                  <button
                    onClick={() => setShowDetails(false)}
                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"
                    data-testid="button-close-details"
                  >
                    <ChevronDown className="h-6 w-6" />
                  </button>

                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <button 
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white"
                      data-testid="button-share"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button 
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white"
                      data-testid="button-bookmark"
                    >
                      <Bookmark className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 -mt-8 relative">
                <div className="flex items-center gap-3 mb-4">
                  {article.category && (
                    <span 
                      className="px-3 py-1.5 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: article.category.color || 'hsl(var(--primary))' }}
                    >
                      {article.category.nameAr}
                    </span>
                  )}
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(publishedDate, { addSuffix: true, locale: arSA })}
                  </span>
                  {article.views !== undefined && (
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {article.views.toLocaleString('ar-EG')}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-4">
                  {article.title}
                </h1>

                {article.author && (
                  <p className="text-muted-foreground text-sm mb-6">
                    بقلم: {article.author.firstName} {article.author.lastName}
                  </p>
                )}

                <div 
                  className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content || smartSummary || '' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
