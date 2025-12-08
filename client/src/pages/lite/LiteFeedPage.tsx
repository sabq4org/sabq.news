import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { SwipeCard } from "@/components/lite/SwipeCard";
import { 
  Newspaper, 
  Loader2,
  RefreshCw,
  ArrowRight,
  Eye,
  Type,
  Waves,
  BookOpen,
  X,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccessibility } from "@/contexts/AccessibilityContext";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const animationRef = useRef<number | null>(null);
  
  const {
    settings,
    setFontSize,
    setHighContrast,
    setReduceMotion,
    setReadingMode,
  } = useAccessibility();

  const fontSizeOptions = [
    { value: "normal", label: "عادي" },
    { value: "large", label: "كبير" },
    { value: "x-large", label: "كبير جداً" },
  ];

  const { data: articles = [], isLoading, refetch } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles?status=published&limit=50&orderBy=newest"],
  });

  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleDragStart = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const handleDragMove = useCallback((offset: number) => {
    if (!isAnimating) {
      // Prevent scrolling up at first card or down at last card
      if (currentIndex === 0 && offset > 0) {
        setDragOffset(offset * 0.3); // Resistance effect
      } else if (currentIndex >= sortedArticles.length - 1 && offset < 0) {
        setDragOffset(offset * 0.3); // Resistance effect
      } else {
        setDragOffset(offset);
      }
    }
  }, [isAnimating, currentIndex, sortedArticles.length]);

  const handleDragEnd = useCallback(() => {
    if (isAnimating) return;

    const threshold = 80;
    const screenHeight = window.innerHeight;

    // Swipe up to next
    if (dragOffset < -threshold && currentIndex < sortedArticles.length - 1) {
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
      
    // Swipe down to previous
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
      
    // Snap back
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
  }, [isAnimating, dragOffset, currentIndex, sortedArticles.length]);

  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setDragOffset(0);
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      
      if (e.key === "ArrowUp" && currentIndex < sortedArticles.length - 1) {
        setDragOffset(-100);
        setTimeout(() => handleDragEnd(), 10);
      } else if (e.key === "ArrowDown" && currentIndex > 0) {
        setDragOffset(100);
        setTimeout(() => handleDragEnd(), 10);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, sortedArticles.length, isAnimating, handleDragEnd]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-3 flex items-center justify-between">
        {/* Left side - Back button & Quick Browse indicator */}
        <div className="flex items-center gap-1">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-white/10 text-white/90 hover:bg-white/20 h-9 w-9"
              data-testid="button-back-to-classic"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-white/10 text-white/90 hover:bg-white/20 h-9 w-9"
            onClick={() => setMenuOpen(true)}
            data-testid="button-lite-menu"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side - Logo */}
        <img 
          src={sabqLogo} 
          alt="سبق" 
          className="h-8 w-auto"
          data-testid="img-sabq-logo"
        />
      </div>

      {/* Sidebar Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50" dir="rtl">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-0 right-0 h-full w-72 bg-zinc-900 shadow-2xl">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">القائمة</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                onClick={() => setMenuOpen(false)}
                data-testid="button-close-lite-menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Menu Content - Accessibility Settings */}
            <div className="p-4 space-y-6">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Eye className="h-4 w-4" />
                <span>إعدادات الوصول</span>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-white/60" />
                  <Label className="text-white text-sm">حجم الخط</Label>
                </div>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value) => setFontSize(value as "normal" | "large" | "x-large")}
                >
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-white/60" />
                  <Label className="text-white text-sm">تباين عالي</Label>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={setHighContrast}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-white/60" />
                  <Label className="text-white text-sm">تقليل الحركة</Label>
                </div>
                <Switch
                  checked={settings.reduceMotion}
                  onCheckedChange={setReduceMotion}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Reading Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-white/60" />
                  <Label className="text-white text-sm">وضع القراءة</Label>
                </div>
                <Switch
                  checked={settings.readingMode}
                  onCheckedChange={setReadingMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            {/* Back to Main Site Link */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <Button 
                  variant="outline" 
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  الموقع الرئيسي
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        {prevArticle && (
          <SwipeCard
            key={`prev-${prevArticle.id}`}
            article={prevArticle}
            position="previous"
            canGoBack={false}
            dragOffset={dragOffset}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        )}

        {nextArticle && (
          <SwipeCard
            key={`next-${nextArticle.id}`}
            article={nextArticle}
            position="next"
            canGoBack={false}
            dragOffset={dragOffset}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        )}

        <SwipeCard
          key={`current-${currentArticle.id}`}
          article={currentArticle}
          position="current"
          canGoBack={currentIndex > 0}
          dragOffset={dragOffset}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />

        {currentIndex >= sortedArticles.length - 1 && dragOffset < -100 && (
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
