import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, TrendingUp, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import type { ArticleWithDetails } from "@shared/schema";

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

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-card" dir="rtl">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {articles.map((article) => (
            <div key={article.id} className="relative min-w-0 flex-[0_0_100%]">
              <Link href={`/article/${article.slug}`}>
                <div className="relative h-[400px] md:h-[500px] cursor-pointer group">
                  {article.imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                  )}
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  
                  <div className="absolute bottom-0 right-0 left-0 p-6 md:p-12 z-20">
                    <div className="max-w-4xl">
                      {article.category && (
                        <Badge 
                          variant="default" 
                          className="mb-4"
                          data-testid={`badge-category-${article.id}`}
                        >
                          {article.category.nameAr}
                        </Badge>
                      )}
                      
                      <h1 
                        className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 line-clamp-3"
                        data-testid={`heading-hero-title-${article.id}`}
                      >
                        {article.title}
                      </h1>
                      
                      {article.excerpt && (
                        <p className="text-white/90 text-base md:text-lg mb-6 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {article.aiSummary && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                            data-testid={`button-listen-${article.id}`}
                          >
                            <Volume2 className="h-4 w-4 ml-2" />
                            استماع
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                          data-testid={`button-analysis-${article.id}`}
                        >
                          <TrendingUp className="h-4 w-4 ml-2" />
                          تحليل
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                          data-testid={`button-follow-${article.id}`}
                        >
                          <Bell className="h-4 w-4 ml-2" />
                          تابع
                        </Button>
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
            onClick={scrollNext}
            data-testid="button-carousel-next"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
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
