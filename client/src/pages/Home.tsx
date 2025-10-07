import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { PersonalizedFeed } from "@/components/PersonalizedFeed";
import { BreakingNews } from "@/components/BreakingNews";
import { DeepDiveSection } from "@/components/DeepDiveSection";
import { TrendingTopics } from "@/components/TrendingTopics";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleWithDetails } from "@shared/schema";

interface HomepageData {
  hero: ArticleWithDetails[];
  forYou: ArticleWithDetails[];
  breaking: ArticleWithDetails[];
  editorPicks: ArticleWithDetails[];
  deepDive: ArticleWithDetails[];
  trending: Array<{ topic: string; count: number }>;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: homepage, isLoading, error } = useQuery<HomepageData>({
    queryKey: ["/api/homepage"],
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 3,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} onSearch={setSearchQuery} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <Skeleton className="w-full h-[400px] md:h-[500px] rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} onSearch={setSearchQuery} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-destructive text-lg mb-4">
              حدث خطأ في تحميل الصفحة الرئيسية
            </p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "خطأ غير معروف"}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!homepage) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} onSearch={setSearchQuery} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              لا توجد بيانات متاحة حالياً
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} onSearch={setSearchQuery} />

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {homepage.hero && homepage.hero.length > 0 && (
          <HeroCarousel articles={homepage.hero} />
        )}

        {homepage.forYou && homepage.forYou.length > 0 && (
          <PersonalizedFeed 
            articles={homepage.forYou}
            title={user ? "لك خصيصًا" : "مختارات لك"}
            showReason={!!user}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {homepage.breaking && homepage.breaking.length > 0 && (
              <BreakingNews articles={homepage.breaking} />
            )}

            {homepage.deepDive && homepage.deepDive.length > 0 && (
              <DeepDiveSection articles={homepage.deepDive} />
            )}
          </div>

          <div className="space-y-8">
            {homepage.editorPicks && homepage.editorPicks.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold" data-testid="heading-editor-picks">
                  مختارات المحررين
                </h2>
                <div className="space-y-4">
                  {homepage.editorPicks.map((article) => (
                    <a
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="block p-4 bg-card rounded-lg border hover-elevate active-elevate-2"
                      data-testid={`card-editor-pick-${article.id}`}
                    >
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      {article.category && (
                        <span className="text-xs text-muted-foreground">
                          {article.category.nameAr}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {homepage.trending && homepage.trending.length > 0 && (
              <TrendingTopics topics={homepage.trending} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
