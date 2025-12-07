import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Clock, Eye, Share2, Bookmark, ChevronDown } from "lucide-react";
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
  const [exitY, setExitY] = useState<number>(0);
  const y = useMotionValue(0);
  const scale = useTransform(y, [-200, 0], [0.95, 1]);
  const opacity = useTransform(y, [-300, -150, 0], [0, 0.8, 1]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 80;
      const swipeVelocity = 400;

      if (info.offset.y < -swipeThreshold || info.velocity.y < -swipeVelocity) {
        setExitY(-800);
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
        className={`absolute inset-0 cursor-grab active:cursor-grabbing ${isTop ? 'z-10' : 'z-0'}`}
        style={{ y, scale, opacity }}
        drag={isTop ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        initial={{ scale: isTop ? 1 : 0.9, y: isTop ? 0 : 40, opacity: isTop ? 1 : 0.5 }}
        animate={{ 
          scale: isTop ? 1 : 0.9, 
          y: exitY || (isTop ? 0 : 40),
          opacity: isTop ? 1 : 0.5
        }}
        exit={{ y: exitY || -800, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        data-testid={`swipe-card-${article.id}`}
      >
        <div className="h-full w-full overflow-hidden bg-black">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6 pb-24" dir="rtl">
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

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              className="text-white/30 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: isTop ? 1 : 0 }}
            >
              <ChevronDown className="h-8 w-8 mx-auto rotate-180 animate-bounce" />
              <span className="text-xs">اسحب للأعلى</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
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
