import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SwipeCard } from "@/components/lite/SwipeCard";
import { AdCard } from "@/components/lite/AdCard";
import { 
  Newspaper, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Article, Category, User } from "@shared/schema";
import sabqLogo from "@assets/sabq-logo.png";

type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
};

type AdData = {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  ctaText?: string;
  linkUrl?: string;
  advertiser?: string;
  impressionId?: string;
};

type FeedItem = 
  | { type: 'article'; data: ArticleWithDetails }
  | { type: 'ad'; data: AdData };

type LiteFeedAdsResponse = {
  ads: AdData[];
  fallback: boolean;
};

import alArabiyaOudAd from "@assets/Screenshot_2025-12-08_at_11.44.21_AM_1765183713294.png";

const FALLBACK_ADS: AdData[] = [
  {
    id: "fallback-ad-1",
    imageUrl: alArabiyaOudAd,
    title: "عبق الشرق الأصيل",
    description: "العربية للعود - Al-Arabiya Oud",
    ctaText: "تسوق الآن",
    linkUrl: "https://www.arabianoud.com",
    advertiser: "العربية للعود"
  }
];

export default function LiteFeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const viewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const { user, isAuthenticated } = useAuth();

  const { data: articles = [], isLoading, refetch } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles?status=published&limit=50&orderBy=newest"],
  });

  const { data: personalizedData } = useQuery<{ articles: ArticleWithDetails[] }>({
    queryKey: ["/api/personal-feed"],
    enabled: isAuthenticated,
  });

  const personalizedArticleIds = useMemo(() => {
    if (!personalizedData?.articles) return new Set<string>();
    return new Set(personalizedData.articles.map(a => a.id));
  }, [personalizedData]);

  const { data: adsResponse } = useQuery<LiteFeedAdsResponse>({
    queryKey: ["/api/ads/lite-feed"],
  });

  const activeAds = useMemo(() => {
    let ads = FALLBACK_ADS;
    if (adsResponse?.ads && adsResponse.ads.length > 0 && !adsResponse.fallback) {
      ads = adsResponse.ads;
    }
    // Shuffle ads randomly for varied display
    const shuffled = [...ads];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [adsResponse]);

  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const feedItems: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];
    let adIndex = 0;
    
    sortedArticles.forEach((article, index) => {
      items.push({ type: 'article', data: article });
      
      if ((index + 1) % 4 === 0 && index < sortedArticles.length - 1) {
        const ad = activeAds[adIndex % activeAds.length];
        items.push({ type: 'ad', data: ad });
        adIndex++;
      }
    });
    
    return items;
  }, [sortedArticles, activeAds]);

  const handleDragStart = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const handleDragMove = useCallback((offset: number) => {
    if (!isAnimating) {
      if (currentIndex === 0 && offset > 0) {
        setDragOffset(offset * 0.3);
      } else if (currentIndex >= feedItems.length - 1 && offset < 0) {
        setDragOffset(offset * 0.3);
      } else {
        setDragOffset(offset);
      }
    }
  }, [isAnimating, currentIndex, feedItems.length]);

  const handleDragEnd = useCallback(() => {
    if (isAnimating) return;

    const threshold = 80;
    const screenHeight = window.innerHeight;

    if (dragOffset < -threshold && currentIndex < feedItems.length - 1) {
      setIsAnimating(true);
      
      const animateOut = () => {
        setDragOffset(prev => {
          const next = prev - 60;
          if (next <= -screenHeight) {
            setCurrentIndex(i => i + 1);
            setDragOffset(0);
            setIsAnimating(false);
            return 0;
          }
          animationRef.current = requestAnimationFrame(animateOut);
          return next;
        });
      };
      animationRef.current = requestAnimationFrame(animateOut);
      
    } else if (dragOffset > threshold && currentIndex > 0) {
      setIsAnimating(true);
      
      const animateOut = () => {
        setDragOffset(prev => {
          const next = prev + 60;
          if (next >= screenHeight) {
            setCurrentIndex(i => i - 1);
            setDragOffset(0);
            setIsAnimating(false);
            return 0;
          }
          animationRef.current = requestAnimationFrame(animateOut);
          return next;
        });
      };
      animationRef.current = requestAnimationFrame(animateOut);
      
    } else {
      setIsAnimating(true);
      
      const animateBack = () => {
        setDragOffset(prev => {
          const next = prev * 0.8;
          if (Math.abs(next) < 2) {
            setIsAnimating(false);
            return 0;
          }
          animationRef.current = requestAnimationFrame(animateBack);
          return next;
        });
      };
      animationRef.current = requestAnimationFrame(animateBack);
    }
  }, [isAnimating, dragOffset, currentIndex, feedItems.length]);

  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setDragOffset(0);
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      
      if (e.key === "ArrowUp" && currentIndex < feedItems.length - 1) {
        setDragOffset(-100);
        setTimeout(() => handleDragEnd(), 10);
      } else if (e.key === "ArrowDown" && currentIndex > 0) {
        setDragOffset(100);
        setTimeout(() => handleDragEnd(), 10);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, feedItems.length, isAnimating, handleDragEnd]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (feedItems.length === 0) return;
    
    const currentItem = feedItems[currentIndex];
    if (!currentItem || currentItem.type !== 'article') return;
    
    const currentArticleId = currentItem.data.id;
    
    if (viewDebounceRef.current) {
      clearTimeout(viewDebounceRef.current);
    }
    
    viewDebounceRef.current = setTimeout(() => {
      apiRequest(`/api/articles/${currentArticleId}/view`, {
        method: "POST",
      }).catch(() => {});
    }, 500);
    
    return () => {
      if (viewDebounceRef.current) {
        clearTimeout(viewDebounceRef.current);
      }
    };
  }, [currentIndex, feedItems]);

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

  const currentItem = feedItems[currentIndex];
  const nextItem = feedItems[currentIndex + 1];
  const prevItem = feedItems[currentIndex - 1];

  const renderFeedItem = (item: FeedItem, position: 'current' | 'next' | 'previous', key: string) => {
    if (item.type === 'article') {
      const isPersonalized = isAuthenticated && personalizedArticleIds.has(item.data.id);
      return (
        <SwipeCard
          key={key}
          article={item.data}
          position={position}
          canGoBack={position === 'current' && currentIndex > 0}
          dragOffset={dragOffset}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          isPersonalized={isPersonalized}
        />
      );
    } else {
      return (
        <AdCard
          key={key}
          ad={item.data}
          position={position}
          dragOffset={dragOffset}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      );
    }
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      <div className="absolute top-4 right-4 z-20">
        <img 
          src={sabqLogo} 
          alt="سبق" 
          className="h-8 w-auto"
          data-testid="img-sabq-logo"
        />
      </div>

      <div className="flex-1 relative">
        {prevItem && renderFeedItem(prevItem, 'previous', `prev-${prevItem.type}-${prevItem.data.id}`)}

        {nextItem && renderFeedItem(nextItem, 'next', `next-${nextItem.type}-${nextItem.data.id}`)}

        {currentItem && renderFeedItem(currentItem, 'current', `current-${currentItem.type}-${currentItem.data.id}`)}

        {currentIndex >= feedItems.length - 1 && dragOffset < -100 && (
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
