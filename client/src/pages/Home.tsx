import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { CategoryPills } from "@/components/CategoryPills";
import { ArticleCard } from "@/components/ArticleCard";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleWithDetails, Category } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles", selectedCategory, searchQuery],
  });

  const { data: featuredArticle } = useQuery<ArticleWithDetails>({
    queryKey: ["/api/articles/featured"],
  });

  const { data: recommendations = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
  });

  const handleReact = async (articleId: string) => {
    // Will be implemented in integration phase
    console.log("React to article:", articleId);
  };

  const handleBookmark = async (articleId: string) => {
    // Will be implemented in integration phase
    console.log("Bookmark article:", articleId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onSearch={setSearchQuery} />
      
      {!categoriesLoading && categories.length > 0 && (
        <CategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Article */}
        {!searchQuery && !selectedCategory && (
          <section className="mb-12">
            {featuredArticle ? (
              <ArticleCard
                article={featuredArticle}
                variant="featured"
                onReact={handleReact}
                onBookmark={handleBookmark}
              />
            ) : (
              <Skeleton className="w-full aspect-[21/9] rounded-lg" />
            )}
          </section>
        )}

        {/* Recommendations for logged in users */}
        {user && recommendations.length > 0 && !searchQuery && (
          <section className="mb-12">
            <RecommendationsWidget articles={recommendations} />
          </section>
        )}

        {/* Latest News Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {searchQuery 
                ? `نتائج البحث: "${searchQuery}"`
                : selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.nameAr || "الأخبار"
                : "أحدث الأخبار"
              }
            </h2>
          </div>

          {articlesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="w-full aspect-[16/9] rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="grid"
                  onReact={handleReact}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">
                {searchQuery 
                  ? "لم يتم العثور على نتائج لبحثك"
                  : "لا توجد أخبار متاحة حالياً"
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-primary hover:underline"
                >
                  مسح البحث
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
