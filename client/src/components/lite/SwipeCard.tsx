import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Eye, Share2, Bookmark, ChevronDown, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { Article, Category, User } from "@shared/schema";

type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
};

function getOptimizedImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  if (url.includes('/public-objects/')) {
    const pathMatch = url.match(/\/public-objects\/(.+)/);
    if (pathMatch) {
      const imagePath = pathMatch[1];
      return `/api/images/optimize?path=${encodeURIComponent(imagePath)}&w=1080&q=70&f=webp`;
    }
  }
  
  return url;
}

interface SwipeCardProps {
  article: ArticleWithDetails;
  position: 'current' | 'next' | 'previous';
  canGoBack: boolean;
  dragOffset: number;
  onDragStart: () => void;
  onDragMove: (offset: number) => void;
  onDragEnd: (velocity: number) => void;
}

export function SwipeCard({ 
  article, 
  position, 
  canGoBack, 
  dragOffset,
  onDragStart,
  onDragMove,
  onDragEnd 
}: SwipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (position !== 'current') return;
    startYRef.current = e.touches[0].clientY;
    lastYRef.current = e.touches[0].clientY;
    lastTimeRef.current = Date.now();
    isDraggingRef.current = true;
    onDragStart();
  }, [position, onDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || position !== 'current') return;
    const currentY = e.touches[0].clientY;
    const offset = currentY - startYRef.current;
    lastYRef.current = currentY;
    lastTimeRef.current = Date.now();
    onDragMove(offset);
  }, [position, onDragMove]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || position !== 'current') return;
    isDraggingRef.current = false;
    const velocity = 0;
    onDragEnd(velocity);
  }, [position, onDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (position !== 'current') return;
    startYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    lastTimeRef.current = Date.now();
    isDraggingRef.current = true;
    onDragStart();
  }, [position, onDragStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || position !== 'current') return;
      const currentY = e.clientY;
      const offset = currentY - startYRef.current;
      lastYRef.current = currentY;
      lastTimeRef.current = Date.now();
      onDragMove(offset);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current || position !== 'current') return;
      isDraggingRef.current = false;
      onDragEnd(0);
    };

    if (position === 'current') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, onDragMove, onDragEnd]);

  const imageUrl = useMemo(() => {
    // Prefer pre-optimized Lite image if available
    if (article.liteOptimizedImageUrl) {
      return article.liteOptimizedImageUrl;
    }
    // Fall back to on-demand optimization
    const rawImageUrl = article.imageUrl || article.thumbnailUrl;
    return getOptimizedImageUrl(rawImageUrl);
  }, [article.liteOptimizedImageUrl, article.imageUrl, article.thumbnailUrl]);
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : new Date();
  const smartSummary = article.aiSummary || article.excerpt;
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: false, locale: arSA });

  const getTransformY = () => {
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    if (position === 'current') {
      return dragOffset;
    } else if (position === 'next') {
      // Next card starts at bottom (100%), moves up as current is dragged up
      const baseOffset = screenHeight;
      const movement = Math.min(0, dragOffset); // Only respond to upward drag
      return baseOffset + movement;
    } else if (position === 'previous') {
      // Previous card starts at top (-100%), moves down as current is dragged down
      const baseOffset = -screenHeight;
      const movement = Math.max(0, dragOffset); // Only respond to downward drag
      return baseOffset + movement;
    }
    return 0;
  };

  const transformY = getTransformY();

  return (
    <>
      <div
        className="absolute inset-0 select-none"
        style={{ 
          transform: `translateY(${transformY}px)`,
          zIndex: position === 'current' ? 10 : 5,
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        data-testid={`swipe-card-${article.id}`}
      >
        <div className="h-full w-full overflow-hidden bg-black relative">
          {imageUrl ? (
            <div className="absolute top-0 left-0 right-0 h-[45%]">
              <img
                src={imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center center' }}
                draggable={false}
              />
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,1) 100%)' 
                }} 
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
          )}

          <div className="absolute inset-x-0 top-[42%] bottom-0 px-5" dir="rtl">
            <div className="flex items-center gap-2 mb-3">
              {article.newsType === 'breaking' && (
                <span 
                  className="px-3 py-1 rounded-full text-white text-sm font-bold flex items-center gap-1 bg-red-600"
                  data-testid="badge-breaking"
                >
                  <Zap className="h-3 w-3" />
                  عاجل
                </span>
              )}
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

            <button
              onClick={() => setShowDetails(true)}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/80 font-medium rounded-full px-8 py-3 text-base transition-colors"
              data-testid="button-read-details"
            >
              اقرأ التفاصيل
            </button>
          </div>
        </div>
      </div>

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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                
                <button
                  onClick={() => setShowDetails(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"
                  data-testid="button-close-details"
                >
                  <ChevronDown className="h-6 w-6" />
                </button>

                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button 
                    className="p-3 bg-black/40 backdrop-blur-sm rounded-full text-white/90"
                    data-testid="button-share"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-3 bg-black/40 backdrop-blur-sm rounded-full text-white/90"
                    data-testid="button-bookmark"
                  >
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 mt-2 relative">
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
    </>
  );
}
