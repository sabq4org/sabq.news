import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { SwipeCard } from "@/components/lite/SwipeCard";
import { 
  Newspaper, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Article, Category, User } from "@shared/schema";
import sabqLogo from "@assets/sabq-logo.png";

type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
};

export default function LiteFeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: articles = [], isLoading, refetch } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles?status=published&limit=50&orderBy=newest"],
  });

  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleDrag = useCallback((offset: number) => {
    if (!isAnimating) {
      setDragOffset(offset);
    }
  }, [isAnimating]);

  const handleDragEnd = useCallback((direction: 'up' | 'down' | 'none') => {
    if (isAnimating) return;

    if (direction === 'up' && currentIndex < sortedArticles.length - 1) {
      setIsAnimating(true);
      const screenHeight = window.innerHeight;
      
      const animate = () => {
        setDragOffset(prev => {
          const next = prev - 80;
          if (next <= -screenHeight) {
            setCurrentIndex(i => i + 1);
            setDragOffset(0);
            setIsAnimating(false);
            return 0;
          }
          requestAnimationFrame(animate);
          return next;
        });
      };
      requestAnimationFrame(animate);
      
    } else if (direction === 'down' && currentIndex > 0) {
      setIsAnimating(true);
      const screenHeight = window.innerHeight;
      
      const animate = () => {
        setDragOffset(prev => {
          const next = prev + 80;
          if (next >= screenHeight) {
            setCurrentIndex(i => i - 1);
            setDragOffset(0);
            setIsAnimating(false);
            return 0;
          }
          requestAnimationFrame(animate);
          return next;
        });
      };
      requestAnimationFrame(animate);
      
    } else {
      setIsAnimating(true);
      const animate = () => {
        setDragOffset(prev => {
          const next = prev * 0.7;
          if (Math.abs(next) < 1) {
            setIsAnimating(false);
            return 0;
          }
          requestAnimationFrame(animate);
          return next;
        });
      };
      requestAnimationFrame(animate);
    }
  }, [isAnimating, currentIndex, sortedArticles.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      handleDragEnd('down');
    }
  }, [currentIndex, isAnimating, handleDragEnd]);

  const goToNext = useCallback(() => {
    if (currentIndex < sortedArticles.length - 1 && !isAnimating) {
      handleDragEnd('up');
    }
  }, [currentIndex, sortedArticles.length, isAnimating, handleDragEnd]);

  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setDragOffset(0);
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        goToNext();
      } else if (e.key === "ArrowDown") {
        goToPrevious();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70">جاري تحميل الأخبار...</p>
        </div>
      </div>
    );
  }

  if (sortedArticles.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Newspaper className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <h2 className="text-xl text-white font-bold mb-2">لا توجد أخبار</h2>
          <p className="text-white/70 mb-6">لم يتم العثور على أخبار حالياً</p>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>
    );
  }

  const currentArticle = sortedArticles[currentIndex];
  const nextArticle = sortedArticles[currentIndex + 1];
  const prevArticle = sortedArticles[currentIndex - 1];

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col" ref={containerRef}>
      <div className="absolute top-4 right-4 z-20">
        <img 
          src={sabqLogo} 
          alt="سبق" 
          className="h-8 w-auto"
          data-testid="img-sabq-logo"
        />
      </div>

      <div className="flex-1 relative">
        {prevArticle && (
          <SwipeCard
            key={`prev-${prevArticle.id}`}
            article={prevArticle}
            onSwipeUp={() => {}}
            onSwipeDown={() => {}}
            position="previous"
            canGoBack={false}
            dragOffset={dragOffset}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          />
        )}

        {nextArticle && (
          <SwipeCard
            key={`next-${nextArticle.id}`}
            article={nextArticle}
            onSwipeUp={() => {}}
            onSwipeDown={() => {}}
            position="next"
            canGoBack={false}
            dragOffset={dragOffset}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          />
        )}

        <SwipeCard
          key={`current-${currentArticle.id}`}
          article={currentArticle}
          onSwipeUp={() => {}}
          onSwipeDown={() => {}}
          position="current"
          canGoBack={currentIndex > 0}
          dragOffset={dragOffset}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />

        {currentIndex >= sortedArticles.length - 1 && dragOffset < -50 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20" dir="rtl">
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Newspaper className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl text-white font-bold mb-2">أحسنت!</h2>
              <p className="text-white/70 mb-6">
                لقد قرأت {sortedArticles.length} خبراً
              </p>
              <Button onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                تحديث الأخبار
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
