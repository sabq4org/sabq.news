import { useQuery } from "@tanstack/react-query";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Eye, Heart, Bookmark, FileText } from "lucide-react";
import { Link } from "wouter";
import type { EnCategory } from "@shared/schema";

interface EnCategoryWithStats extends EnCategory {
  articleCount: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
}

export default function EnglishCategoriesPage() {
  const { data: user } = useQuery<{ id: string; firstName?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: categories = [], isLoading } = useQuery<EnCategoryWithStats[]>({
    queryKey: ["/api/en/categories", "withStats"],
    queryFn: async () => {
      const res = await fetch("/api/en/categories?withStats=true", { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  return (
    <EnglishLayout>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-categories">
            Categories
          </h1>
          <p className="text-muted-foreground">
            Explore all news categories
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
              No categories available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories
              .filter((cat) => cat.status === "active")
              .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
              .map((category) => (
                <Link key={category.id} href={`/en/category/${category.slug}`}>
                  <Card 
                    className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden group"
                    data-testid={`card-category-${category.id}`}
                  >
                    {/* Hero Image */}
                    {category.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                    )}

                    {/* No Image - Show Icon with Gradient */}
                    {!category.imageUrl && (
                      <div 
                        className="relative h-48 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5"
                      >
                        <Newspaper className="h-16 w-16 text-primary" />
                      </div>
                    )}
                    
                    <CardContent className="p-6 space-y-4">
                      {/* Category Name */}
                      <div className="flex items-center gap-3">
                        <h3 
                          className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors flex-1"
                          data-testid={`text-category-name-${category.id}`}
                        >
                          {category.name}
                        </h3>
                      </div>

                      {/* Description */}
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1" title="Articles">
                          <FileText className="h-4 w-4" />
                          <span>{category.articleCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Views">
                          <Eye className="h-4 w-4" />
                          <span>{(category.totalViews || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Likes">
                          <Heart className="h-4 w-4" />
                          <span>{category.totalLikes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Bookmarks">
                          <Bookmark className="h-4 w-4" />
                          <span>{category.totalBookmarks || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </main>
    </EnglishLayout>
  );
}
