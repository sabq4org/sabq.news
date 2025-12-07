import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Clock, Eye, Share2, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
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
  isTop: boolean;
}

export function SwipeCard({ article, onSwipeUp, isTop }: SwipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-300, 0], [0.3, 1]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 100;
      const swipeVelocity = 500;

      if (info.offset.y < -swipeThreshold || info.velocity.y < -swipeVelocity) {
        onSwipeUp();
      }
    },
    [onSwipeUp]
  );

  const imageUrl = article.imageUrl || article.thumbnailUrl;
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : new Date();
  const smartSummary = article.aiSummary || article.excerpt;

  return (
    <>
      <motion.div
        className={`absolute inset-0 ${isTop ? 'z-10' : 'z-0'}`}
        style={{ y: isTop ? y : 0, opacity: isTop ? opacity : 0.4 }}
        drag={isTop ? "y" : false}
        dragConstraints={{ top: -200, bottom: 50 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        initial={{ y: isTop ? 0 : 100, opacity: isTop ? 1 : 0 }}
        animate={{ 
          y: 0,
          opacity: isTop ? 1 : 0.4,
          scale: isTop ? 1 : 0.92
        }}
        exit={{ 
          y: -window.innerHeight,
          opacity: 0,
          transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
        }}
        transition={{ 
          type: "tween",
          duration: 0.4,
          ease: [0.32, 0.72, 0, 1]
        }}
        data-testid={`swipe-card-${article.id}`}
      >
        <div className="h-full w-full overflow-hidden bg-black touch-pan-y">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6 pb-8" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              {article.category && (
                <span 
                  className="px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: article.category.color || 'hsl(var(--primary))' }}
                  data-testid="badge-category"
                >
                  {article.category.nameAr}
                </span>
              )}
              <span className="text-white/70 text-sm flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(publishedDate, { addSuffix: false, locale: arSA })}
              </span>
            </div>

            <h1 
              className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4"
              data-testid="text-article-title"
            >
              {article.title}
            </h1>

            {smartSummary && (
              <p className="text-white/80 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
                {smartSummary}
              </p>
            )}

            <Button
              onClick={() => setShowDetails(true)}
              className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 rounded-full py-3"
              data-testid="button-read-details"
            >
              اقرأ التفاصيل
            </Button>
          </div>

          {isTop && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none">
              <motion.div
                className="text-white/40 text-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <ChevronUp className="h-8 w-8 mx-auto" />
              </motion.div>
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
