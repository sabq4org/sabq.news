import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { NewsCard } from "@/components/lite/NewsCard";
import { Newspaper, Loader2, RefreshCw } from "lucide-react";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: articles = [], isLoading, refetch } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles?status=published&limit=50&orderBy=newest"],
  });

  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleRefresh = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70">جاري تحميل الأخبار...</p>
        </div>
      </div>
    );
  }

  if (sortedArticles.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center" dir="rtl">
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

  return (
    <div 
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-black scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {!detailsOpen && (
        <div className="fixed top-4 right-4 z-50">
          <img 
            src={sabqLogo} 
            alt="سبق" 
            className="h-8 w-auto"
            data-testid="img-sabq-logo"
          />
        </div>
      )}

      {sortedArticles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          onDetailsOpen={() => setDetailsOpen(true)}
          onDetailsClose={() => setDetailsOpen(false)}
        />
      ))}
    </div>
  );
}
