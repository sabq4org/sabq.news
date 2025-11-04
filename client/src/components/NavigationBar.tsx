import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Category } from "@shared/schema";

export function NavigationBar() {
  const [location] = useLocation();
  const { data: coreCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories/smart", "core", "active"],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "core", status: "active" });
      const res = await fetch(`/api/categories/smart?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  return (
    <div className="w-full border-b bg-background hidden md:block">
      {/* Core Categories - Desktop Only */}
      {coreCategories.length > 0 && (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-6 lg:px-8">
            <ScrollArea className="w-full whitespace-nowrap">
              <nav className="flex items-center gap-6 py-0" dir="rtl">
                {coreCategories.map((category) => {
                  const isActive = location === `/category/${category.slug}`;
                  return (
                    <Link 
                      key={category.id} 
                      href={`/category/${category.slug}`}
                      data-testid={`link-nav-core-${category.slug}`}
                    >
                      <div className={`
                        group relative py-4 cursor-pointer transition-colors duration-200
                        ${isActive 
                          ? 'text-foreground font-semibold' 
                          : 'text-muted-foreground hover:text-foreground font-medium'
                        }
                      `}>
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span className="text-lg opacity-80">{category.icon}</span>
                          )}
                          <span className="text-sm tracking-wide">{category.nameAr}</span>
                        </div>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                        
                        {/* Hover indicator */}
                        {!isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>
              <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
