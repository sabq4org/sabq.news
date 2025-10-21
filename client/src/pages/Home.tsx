import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AIInsightsBlock } from "@/components/AIInsightsBlock";
import { TrendingKeywords } from "@/components/TrendingKeywords";
import { FollowedKeywordsBlock } from "@/components/FollowedKeywordsBlock";
import { SmartSummaryBlock } from "@/components/SmartSummaryBlock";
import { PersonalizedFeed } from "@/components/PersonalizedFeed";
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
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 flex-1">
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
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <div className="text-center py-20">
            <p className="text-destructive text-lg mb-4">
              حدث خطأ في تحميل الصفحة الرئيسية
            </p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "خطأ غير معروف"}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!homepage) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              لا توجد بيانات متاحة حالياً
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header user={user} />

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 flex-1">
        {homepage.hero && homepage.hero.length > 0 && (
          <div className="mb-20">
            <HeroCarousel articles={homepage.hero} />
          </div>
        )}

        {/* AI Insights Block */}
        <AIInsightsBlock />

        {/* Smart Summary Block - Only for authenticated users */}
        {user && <SmartSummaryBlock />}

        {homepage.forYou && homepage.forYou.length > 0 && (
          <PersonalizedFeed 
            articles={homepage.forYou}
            title="جميع الأخبار"
            showReason={false}
          />
        )}

        <div className="space-y-8">
          {homepage.deepDive && homepage.deepDive.length > 0 && (
            <DeepDiveSection articles={homepage.deepDive} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {homepage.trending && homepage.trending.length > 0 && (
              <TrendingTopics topics={homepage.trending} />
            )}
            <TrendingKeywords />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
