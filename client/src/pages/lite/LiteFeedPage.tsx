import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "@/components/lite/SwipeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Newspaper, 
  Bookmark, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Article, Category, User } from "@shared/schema";

type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
};

export default function LiteFeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  const { data: articles = [], isLoading, refetch, isFetching } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles", { status: "published", limit: 50, orderBy: "newest" }],
  });

  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleSwipeLeft = useCallback(() => {
    if (currentIndex < sortedArticles.length - 1) {
      const currentArticle = sortedArticles[currentIndex];
      if (currentArticle) {
        setViewedIds(prev => new Set(prev).add(currentArticle.id));
      }
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, sortedArticles]);

  const handleSwipeRight = useCallback(() => {
    if (currentIndex < sortedArticles.length - 1) {
      const currentArticle = sortedArticles[currentIndex];
      if (currentArticle) {
        setViewedIds(prev => new Set(prev).add(currentArticle.id));
      }
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, sortedArticles]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < sortedArticles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, sortedArticles.length]);

  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setViewedIds(new Set());
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToNext();
      } else if (e.key === "ArrowRight") {
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

  const visibleArticles = sortedArticles.slice(currentIndex, currentIndex + 2);
  const progress = ((currentIndex + 1) / sortedArticles.length) * 100;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="popLayout">
          {visibleArticles.map((article, index) => (
            <SwipeCard
              key={article.id}
              article={article}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isTop={index === 0}
            />
          ))}
        </AnimatePresence>

        {currentIndex >= sortedArticles.length - 1 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20" dir="rtl">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🎉</div>
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

      <div className="bg-black/90 backdrop-blur-sm border-t border-white/10 px-4 py-3 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/">
            <button 
              className="p-3 text-white/70 hover:text-white transition-colors"
              data-testid="nav-home"
            >
              <Newspaper className="h-6 w-6" />
            </button>
          </Link>
          
          <button 
            className="p-3 text-white/70 hover:text-white transition-colors"
            data-testid="nav-bookmarks"
          >
            <Bookmark className="h-6 w-6" />
          </button>
          
          <button 
            className="p-3 text-white/70 hover:text-white transition-colors"
            data-testid="nav-share"
          >
            <Share2 className="h-6 w-6" />
          </button>
          
          <button 
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="p-3 text-white/70 hover:text-white transition-colors disabled:opacity-30"
            data-testid="nav-previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button 
            onClick={goToNext}
            disabled={currentIndex >= sortedArticles.length - 1}
            className="p-3 text-white/70 hover:text-white transition-colors disabled:opacity-30"
            data-testid="nav-next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center mt-2">
          <span className="text-white/50 text-xs">
            {currentIndex + 1} / {sortedArticles.length}
          </span>
        </div>
      </div>
    </div>
  );
}
