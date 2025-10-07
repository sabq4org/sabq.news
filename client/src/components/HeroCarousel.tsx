import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, TrendingUp, Bell, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface HeroCarouselProps {
  articles: ArticleWithDetails[];
}

export function HeroCarousel({ articles }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: "rtl" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

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

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-card" dir="rtl">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {articles.map((article) => (
            <div key={article.id} className="relative min-w-0 flex-[0_0_100%]">
              <Link href={`/article/${article.slug}`}>
                <div className="relative h-[300px] md:h-[500px] cursor-pointer group flex flex-row">
                  {/* Image - 65% of width */}
                  <div className="w-[65%] md:w-1/2 h-full relative overflow-hidden">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>

                  {/* Content - 35% of width */}
                  <div className="w-[35%] md:w-1/2 h-full bg-card flex flex-col justify-center p-3 md:p-8 lg:p-12">
                    <div className="space-y-4">
                      {article.category && (
                        <Badge 
                          variant="default" 
                          data-testid={`badge-category-${article.id}`}
                        >
                          {article.category.nameAr}
                        </Badge>
                      )}
                      
                      <h1 
                        className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground line-clamp-3"
                        data-testid={`heading-hero-title-${article.id}`}
                      >
                        {article.title}
                      </h1>
                      
                      {article.aiSummary && (
                        <p className="text-muted-foreground text-sm md:text-base line-clamp-3">
                          {article.aiSummary}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{article.views || 0}</span>
                        </div>
                        {article.publishedAt && (
                          <span>{formatPublishedDate(article.publishedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {articles.length > 1 && (
        <>
          <Button
            size="icon"
            variant="outline"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hover-elevate active-elevate-2"
            onClick={scrollNext}
            data-testid="button-carousel-next"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hover-elevate active-elevate-2"
            onClick={scrollPrev}
            data-testid="button-carousel-prev"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {articles.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
                data-testid={`button-carousel-dot-${index}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
