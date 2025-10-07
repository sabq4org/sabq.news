import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper } from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

interface CategoryWithCount extends Category {
  articleCount?: number;
}

export default function CategoriesListPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 60000,
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} onSearch={setSearchQuery} />

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-categories">
            التصنيفات
          </h1>
          <p className="text-muted-foreground">
            استكشف جميع تصنيفات الأخبار
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              لا توجد تصنيفات متاحة حالياً
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories
              .filter((cat) => cat.status === "active")
              .map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <Card 
                    className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden group"
                    data-testid={`card-category-${category.id}`}
                  >
                    {/* Hero Image */}
                    {category.heroImageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={category.heroImageUrl}
                          alt={category.nameAr}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {category.icon && (
                          <div className="absolute top-4 right-4 text-4xl">
                            {category.icon}
                          </div>
                        )}
                      </div>
                    )}

                    {/* No Image - Show Icon with Gradient */}
                    {!category.heroImageUrl && (
                      <div 
                        className="relative h-48 flex items-center justify-center"
                        style={{
                          background: category.color 
                            ? `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`
                            : 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 100%)'
                        }}
                      >
                        <div className="text-6xl" style={{ color: category.color || 'hsl(var(--primary))' }}>
                          {category.icon || '📰'}
                        </div>
                      </div>
                    )}
                    
                    <CardContent className="p-6 space-y-3">
                      {/* Category Name */}
                      <h3 
                        className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors"
                        data-testid={`text-category-name-${category.id}`}
                      >
                        {category.nameAr}
                      </h3>
                      
                      {/* Description */}
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      {/* English Name Badge */}
                      {category.nameEn && (
                        <Badge variant="outline" className="mt-2">
                          {category.nameEn}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
