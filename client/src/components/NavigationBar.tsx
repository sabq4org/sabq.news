import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@shared/schema";

export function NavigationBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { data: coreCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories/smart", "core", "active"],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "core", status: "active" });
      const res = await fetch(`/api/categories/smart?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: smartCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories/smart", "smart-dynamic-seasonal", "active"],
    queryFn: async () => {
      const res = await fetch(`/api/categories/smart?status=active`, { credentials: "include" });
      if (!res.ok) return [];
      const categories = await res.json();
      return categories.filter((c: Category) => 
        c.type === "smart" || c.type === "dynamic" || c.type === "seasonal"
      );
    },
  });

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Hide when scrolling down past 100px
          if (currentScrollY > 100) {
            setIsScrolled(true);
          } else {
            setIsScrolled(false);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full border-b bg-background sticky top-16 z-40 shadow-sm">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8">
        {/* Primary Navigation - Core Categories */}
        {coreCategories.length > 0 && (
          <div className="border-b border-border/50">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 sm:gap-2 py-2 sm:py-2.5" dir="rtl">
                {coreCategories.map((category) => (
                  <Link key={category.id} href={`/category/${category.slug}`}>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover-elevate active-elevate-2 h-8 sm:min-h-9 px-2.5 sm:px-4 text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all duration-200 whitespace-nowrap"
                      data-testid={`badge-nav-core-${category.slug}`}
                    >
                      {category.icon && <span className="text-base sm:text-lg">{category.icon}</span>}
                      <span>{category.nameAr}</span>
                    </Badge>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>
        )}

        {/* Smart Navigation - Smart/Dynamic/Seasonal Categories */}
        {smartCategories.length > 0 && (
          <div 
            className={cn(
              "bg-gradient-to-l from-primary/15 via-primary/8 to-accent/10 dark:from-primary/8 dark:via-primary/5 dark:to-accent/5",
              "transition-all duration-300 ease-in-out overflow-hidden",
              isScrolled ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
            )}
            data-scrolled={isScrolled}
            data-testid="nav-smart-categories-container"
          >
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 sm:gap-2 py-2 sm:py-2.5" dir="rtl">
                <div className="flex items-center gap-1.5 px-2 sm:px-3 text-xs font-semibold text-foreground/70 dark:text-muted-foreground whitespace-nowrap">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="max-sm:hidden">ذكي</span>
                  <span className="sr-only sm:hidden">تصنيفات ذكية</span>
                </div>
                {smartCategories.map((category) => (
                  <Link key={category.id} href={`/category/${category.slug}`}>
                    <Badge
                      className="cursor-pointer hover-elevate active-elevate-2 h-8 sm:min-h-8 px-2.5 sm:px-3 text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all duration-200 whitespace-nowrap bg-gradient-to-l from-purple-500/90 to-pink-500/90 dark:from-purple-500/80 dark:to-pink-500/80 text-white border-0 shadow-sm"
                      data-testid={`badge-nav-smart-${category.slug}`}
                    >
                      {category.icon && <span className="text-sm sm:text-base">{category.icon}</span>}
                      <span>{category.nameAr}</span>
                    </Badge>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
