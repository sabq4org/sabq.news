import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, TrendingUp, Bell, Zap, Star, Flame } from "lucide-react";
import { ViewsCount } from "./ViewsCount";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

interface HeroCarouselProps {
  articles: ArticleWithDetails[];
}

export function HeroCarousel({ articles }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    direction: "rtl"
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => {
      clearInterval(interval);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!articles || articles.length === 0) return null;

  const formatPublishedDate = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  const getObjectPosition = (article: any) => {
    const focalPoint = article.imageFocalPoint;
    return focalPoint ? `${focalPoint.x}% ${focalPoint.y}%` : 'center';
  };

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-lg bg-card" dir="rtl">
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {articles.map((article) => (
            <article key={article.id} className="embla__slide relative flex-shrink-0 flex-grow-0" style={{ flexBasis: '100%' }} role="article" aria-label={article.title}>
              <Link href={`/article/${article.slug}`} aria-label={`اقرأ المقال: ${article.title}`}>
                {/* Mobile: Vertical Layout */}
                <div className="md:hidden relative cursor-pointer group">
                  {/* Image */}
                  {(article.thumbnailUrl ?? article.imageUrl) && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={(article.thumbnailUrl ?? article.imageUrl) || ""}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: getObjectPosition(article) }}
                        loading="eager"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className={`p-4 rounded-b-lg ${
                    article.newsType === "breaking" 
                      ? "bg-destructive/10" 
                      : "bg-card"
                  }`}>
                    <div className="space-y-3">
                      {article.newsType === "breaking" ? (
                        <Badge 
                          variant="destructive" 
                          className="w-fit text-xs gap-1"
                          data-testid={`badge-breaking-${article.id}`}
                        >
                          <Zap className="h-3 w-3" />
                          عاجل
                        </Badge>
                      ) : isNewArticle(article.publishedAt) ? (
                        <Badge 
                          className="w-fit bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 text-xs gap-1"
                          data-testid={`badge-new-${article.id}`}
                        >
                          <Flame className="h-3 w-3" />
                          جديد
                        </Badge>
                      ) : article.category && (
                        <Badge 
                          variant="default" 
                          className="w-fit text-xs"
                          data-testid={`badge-category-${article.id}`}
                        >
                          {article.category.nameAr}
                        </Badge>
                      )}
                      
                      <h1 
                        className={`text-lg font-bold line-clamp-2 ${
                          article.newsType === "breaking"
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                        data-testid={`heading-hero-title-${article.id}`}
                      >
                        {article.title}
                      </h1>
                      
                      {article.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <ViewsCount 
                          views={article.views || 0}
                          iconClassName="h-3 w-3"
                        />
                        {article.publishedAt && (
                          <span className="text-xs">{formatPublishedDate(article.publishedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Horizontal Layout */}
                <div className="hidden md:block relative h-[400px] cursor-pointer group">
                  <div className="flex flex-row h-full">
                    {/* Image - 50% of width */}
                    <div className="w-1/2 h-full relative overflow-hidden">
                      {(article.thumbnailUrl ?? article.imageUrl) ? (
                        <img
                          src={(article.thumbnailUrl ?? article.imageUrl) || ""}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: getObjectPosition(article) }}
                          loading="eager"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                    </div>

                    {/* Content - 50% of width */}
                    <div className={`w-1/2 h-full flex flex-col justify-center p-8 lg:p-12 ${
                      article.newsType === "breaking" 
                        ? "bg-destructive/10" 
                        : "bg-card"
                    }`}>
                      <div className="space-y-4">
                        {article.newsType === "breaking" ? (
                          <Badge 
                            variant="destructive" 
                            className="w-fit gap-1"
                            data-testid={`badge-breaking-${article.id}`}
                          >
                            <Zap className="h-3 w-3" />
                            عاجل
                          </Badge>
                        ) : isNewArticle(article.publishedAt) ? (
                          <Badge 
                            className="w-fit bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 gap-1"
                            data-testid={`badge-new-${article.id}`}
                          >
                            <Flame className="h-3 w-3" />
                            جديد
                          </Badge>
                        ) : article.category && (
                          <Badge 
                            variant="default" 
                            data-testid={`badge-category-${article.id}`}
                          >
                            {article.category.nameAr}
                          </Badge>
                        )}
                        
                        <h1 
                          className={`text-3xl lg:text-4xl font-bold line-clamp-3 ${
                            article.newsType === "breaking"
                              ? "text-destructive"
                              : "text-foreground"
                          }`}
                          data-testid={`heading-hero-title-${article.id}`}
                        >
                          {article.title}
                        </h1>
                        
                        {article.excerpt && (
                          <p className="text-muted-foreground text-base line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                          <ViewsCount 
                            views={article.views || 0}
                            iconClassName="h-4 w-4"
                          />
                          {article.publishedAt && (
                            <span>{formatPublishedDate(article.publishedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>

    {articles.length > 1 && (
        <div className="mt-4 flex gap-2 justify-center w-full px-4">
          {articles.slice(0, 3).map((article, index) => (
            <button
              key={index}
              className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-md overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-border"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              data-testid={`button-carousel-thumbnail-${index}`}
            >
              {(article.thumbnailUrl ?? article.imageUrl) ? (
                <img
                  src={(article.thumbnailUrl ?? article.imageUrl) || ""}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: getObjectPosition(article) }}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
