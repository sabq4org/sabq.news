import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@shared/schema";

export function NavigationBar() {
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
        <div className="sticky top-16 z-40 bg-background border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-3 sm:px-6 lg:px-8">
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
        </div>
      )}
    </div>
  );
}
