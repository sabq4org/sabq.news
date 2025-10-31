import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import type { ArticleWithDetails } from "@shared/schema";

export function AIRecommendationsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: recommendations, isLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/recommendations/ai"],
    retry: false,
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">مقترحات من الذكاء الاصطناعي</h2>
          </div>
          <div className="h-64 bg-card rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">مقترحات من الذكاء الاصطناعي</h2>
              <p className="text-sm text-muted-foreground mt-1">
                قصص منتقاة خصيصاً لك بناءً على اهتماماتك
              </p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border p-12 text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              لا توجد توصيات متاحة حالياً
            </p>
            <p className="text-sm text-muted-foreground/70">
              تفاعل مع المزيد من المقالات للحصول على توصيات مخصصة
            </p>
          </div>
        </div>
      </section>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? recommendations.length - 1 : prev - 1
    );
  };

  const currentArticle = recommendations[currentIndex];

  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5" dir="rtl" data-testid="ai-recommendations-carousel">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">مقترحات من الذكاء الاصطناعي</h2>
              <p className="text-sm text-muted-foreground mt-1">
                قصص منتقاة خصيصاً لك بناءً على اهتماماتك
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            مدعوم بالذكاء الاصطناعي
          </Badge>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Content */}
          <div className="relative overflow-hidden rounded-2xl bg-card border shadow-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-6 p-8"
              >
                {/* Image */}
                <Link href={`/article/${currentArticle.id}`}>
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden group cursor-pointer">
                    {currentArticle.imageUrl ? (
                      <img
                        src={currentArticle.imageUrl}
                        alt={currentArticle.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>

                {/* Content */}
                <div className="flex flex-col justify-center">
                  {/* Category */}
                  {currentArticle.category && (
                    <Link href={`/category/${currentArticle.category.slug}`}>
                      <Badge 
                        variant="outline" 
                        className="mb-4 w-fit hover:bg-primary/10 hover:border-primary/30 transition-colors"
                        data-testid={`ai-rec-category-${currentArticle.category.slug}`}
                      >
                        {currentArticle.category.nameAr}
                      </Badge>
                    </Link>
                  )}

                  {/* Title */}
                  <Link href={`/article/${currentArticle.id}`}>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 hover:text-primary transition-colors cursor-pointer leading-snug">
                      {currentArticle.title}
                    </h3>
                  </Link>

                  {/* Summary */}
                  {currentArticle.aiSummary && (
                    <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                      {currentArticle.aiSummary}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="flex items-center gap-4">
                    <Link href={`/article/${currentArticle.id}`}>
                      <Button 
                        variant="default" 
                        className="gap-2"
                        data-testid={`ai-rec-read-${currentArticle.id}`}
                      >
                        اقرأ المزيد
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    {/* Indicators */}
                    <div className="flex gap-2">
                      {recommendations.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentIndex 
                              ? "w-8 bg-primary" 
                              : "w-2 bg-muted hover:bg-muted-foreground/30"
                          }`}
                          data-testid={`ai-rec-indicator-${idx}`}
                          aria-label={`الانتقال إلى المقالة ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <Button
            size="icon"
            variant="outline"
            onClick={prevSlide}
            className="absolute top-1/2 -translate-y-1/2 right-4 bg-card/95 backdrop-blur-sm hover:bg-card shadow-lg hidden md:flex"
            data-testid="ai-rec-prev"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={nextSlide}
            className="absolute top-1/2 -translate-y-1/2 left-4 bg-card/95 backdrop-blur-sm hover:bg-card shadow-lg hidden md:flex"
            data-testid="ai-rec-next"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex justify-center gap-3 mt-6 md:hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={prevSlide}
            data-testid="ai-rec-prev-mobile"
          >
            <ChevronRight className="h-4 w-4 ml-1" />
            السابق
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={nextSlide}
            data-testid="ai-rec-next-mobile"
          >
            التالي
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
