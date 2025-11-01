import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, User, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OpinionArticle {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  imageUrl?: string;
  publishedAt?: string;
  views: number;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    bio?: string;
  };
  category?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
    color?: string;
    icon?: string;
  };
}

interface RelatedOpinionsSectionProps {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  excludeArticleId?: string;
  limit?: number;
}

function OpinionCard({ article, categoryColor }: { article: OpinionArticle; categoryColor?: string }) {
  const authorName = article.author
    ? `${article.author.firstName || ""} ${article.author.lastName || ""}`.trim() || "كاتب"
    : "كاتب";

  return (
    <Link href={`/opinion/${article.slug}`}>
      <Card 
        className="h-full hover-elevate active-elevate-2 overflow-hidden group"
        data-testid={`related-opinion-${article.id}`}
      >
        <CardContent className="p-5 space-y-4">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            {article.author?.profileImageUrl ? (
              <img
                src={article.author.profileImageUrl}
                alt={authorName}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-offset-2"
                style={{ ['--tw-ring-color' as any]: categoryColor || 'var(--primary)' }}
              />
            ) : (
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center ring-2 ring-offset-2"
                style={{ 
                  backgroundColor: categoryColor ? `${categoryColor}20` : 'var(--muted)',
                  ['--tw-ring-color' as any]: categoryColor || 'var(--primary)'
                }}
              >
                <User className="h-6 w-6" style={{ color: categoryColor || 'var(--muted-foreground)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{authorName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>مقال رأي</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
            {article.publishedAt && (
              <span>
                {formatDistanceToNow(new Date(article.publishedAt), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            )}
            <div className="flex items-center gap-1">
              <span>{article.views.toLocaleString('en-US')}</span>
              <span>مشاهدة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function HorizontalCarousel({ 
  articles, 
  categoryColor 
}: { 
  articles: OpinionArticle[]; 
  categoryColor?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    if (direction === 'left') {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-[380px] lg:w-[420px] snap-start"
          >
            <OpinionCard article={article} categoryColor={categoryColor} />
          </motion.div>
        ))}
      </div>

      {/* Navigation Arrows - Show on hover or focus */}
      {articles.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background border-2 border-border shadow-lg flex items-center justify-center hover-elevate active-elevate-2 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            data-testid="carousel-next"
            aria-label="التالي"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background border-2 border-border shadow-lg flex items-center justify-center hover-elevate active-elevate-2 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            data-testid="carousel-prev"
            aria-label="السابق"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-4 md:gap-6 overflow-x-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-[380px] lg:w-[420px] space-y-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RelatedOpinionsSection({
  categoryId,
  categoryName,
  categoryColor,
  excludeArticleId,
  limit = 5,
}: RelatedOpinionsSectionProps) {
  const { data, isLoading } = useQuery<{ articles: OpinionArticle[]; total: number }>({
    queryKey: ["/api/opinion/related/category", categoryId, { excludeId: excludeArticleId, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(excludeArticleId && { excludeId: excludeArticleId }),
      });
      const res = await fetch(`/api/opinion/related/category/${categoryId}?${params}`, {
        credentials: "include",
      });
      if (!res.ok) return { articles: [], total: 0 };
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <section className="py-8" dir="rtl">
        <LoadingSkeleton />
      </section>
    );
  }

  if (!data || data.articles.length === 0) {
    return null;
  }

  return (
    <section className="py-8" dir="rtl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-1 h-8 rounded-full"
              style={{ backgroundColor: categoryColor || 'var(--primary)' }}
            />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6" style={{ color: categoryColor }} />
                مقالات رأي مرتبطة
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                من تصنيف "{categoryName}"
              </p>
            </div>
          </div>
          <Link href={`/opinion?category=${categoryId}`}>
            <Button 
              variant="ghost" 
              className="gap-2 hidden md:flex" 
              data-testid="button-view-more-opinions"
            >
              عرض المزيد
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Horizontal Carousel - All Sizes */}
        <HorizontalCarousel articles={data.articles} categoryColor={categoryColor} />
      </div>
    </section>
  );
}
