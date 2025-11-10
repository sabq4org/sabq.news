import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Eye, Clock, Flame } from "lucide-react";
import type { UrArticle } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

interface UrduHeroCarouselProps {
  articles: UrArticle[];
}

export function UrduHeroCarousel({ articles }: UrduHeroCarouselProps) {
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
    return new Intl.DateTimeFormat("ur-PK", {
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
      <div className="relative w-full overflow-hidden rounded-lg bg-card">
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {articles.map((article) => (
              <div key={article.id} className="embla__slide relative flex-shrink-0 flex-grow-0" style={{ flexBasis: '100%' }}>
              <Link href={`/ur/article/${article.slug}`}>
                {/* Mobile: Vertical Layout */}
                <div className="md:hidden relative cursor-pointer group">
                  {/* Image */}
                  {article.imageUrl && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={article.imageUrl}
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
                          تازہ خبر
                        </Badge>
                      ) : isNewArticle(article.publishedAt) ? (
                        <Badge 
                          className="w-fit bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 text-xs gap-1"
                          data-testid={`badge-new-${article.id}`}
                        >
                          <Flame className="h-3 w-3" />
                          نیا
                        </Badge>
                      ) : (
                        <Badge 
                          variant="default" 
                          className="w-fit text-xs"
                          data-testid={`badge-category-${article.id}`}
                        >
                          خبریں
                        </Badge>
                      )}
                      
                      <h2 className="text-xl font-bold line-clamp-3 text-foreground" data-testid={`text-title-${article.id}`}>
                        {article.title}
                      </h2>
                      
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-summary-${article.id}`}>
                          {article.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatPublishedDate(article.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Horizontal Layout */}
                <div className="hidden md:block relative h-96 cursor-pointer group">
                  {article.imageUrl && (
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ objectPosition: getObjectPosition(article) }}
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="max-w-3xl space-y-4">
                      {article.newsType === "breaking" ? (
                        <Badge 
                          variant="destructive" 
                          className="w-fit gap-1.5 text-sm"
                          data-testid={`badge-breaking-desktop-${article.id}`}
                        >
                          <Zap className="h-4 w-4" />
                          تازہ خبر
                        </Badge>
                      ) : isNewArticle(article.publishedAt) ? (
                        <Badge 
                          className="w-fit bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 gap-1.5 text-sm"
                          data-testid={`badge-new-desktop-${article.id}`}
                        >
                          <Flame className="h-4 w-4" />
                          نیا
                        </Badge>
                      ) : (
                        <Badge 
                          variant="secondary" 
                          className="w-fit bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm text-sm"
                          data-testid={`badge-category-desktop-${article.id}`}
                        >
                          خبریں
                        </Badge>
                      )}
                      
                      <h2 className="text-4xl md:text-5xl font-bold line-clamp-2 drop-shadow-lg" data-testid={`text-title-desktop-${article.id}`}>
                        {article.title}
                      </h2>
                      
                      {article.excerpt && (
                        <p className="text-lg md:text-xl text-white/90 line-clamp-2 drop-shadow" data-testid={`text-summary-desktop-${article.id}`}>
                          {article.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatPublishedDate(article.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carousel Dots */}
      {articles.length > 1 && (
        <div className="flex justify-center gap-2 mt-4" data-testid="carousel-dots">
          {articles.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`${index + 1} نمبر سلائیڈ پر جائیں`}
              data-testid={`button-dot-${index}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
