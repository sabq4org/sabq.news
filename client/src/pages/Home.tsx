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
import { MirqabHomeSection } from "@/components/MirqabHomeSection";
import { SmartNewsBlock } from "@/components/SmartNewsBlock";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleWithDetails, SmartBlock } from "@shared/schema";

interface HomepageData {
  hero: ArticleWithDetails[];
  forYou: ArticleWithDetails[];
  breaking: ArticleWithDetails[];
  editorPicks: ArticleWithDetails[];
  deepDive: ArticleWithDetails[];
  trending: Array<{ topic: string; count: number; views: number; articles: number; comments: number }>;
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

  // Fetch smart blocks for each placement
  const { data: blocksBelowFeatured } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks', 'below_featured'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'below_featured' });
      const res = await fetch(`/api/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: blocksAboveAllNews } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks', 'above_all_news'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'above_all_news' });
      const res = await fetch(`/api/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: blocksBetweenAllAndMurqap } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks', 'between_all_and_murqap'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'between_all_and_murqap' });
      const res = await fetch(`/api/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: blocksAboveFooter } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks', 'above_footer'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'above_footer' });
      const res = await fetch(`/api/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
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

        {/* Smart Blocks: below_featured */}
        {blocksBelowFeatured && blocksBelowFeatured.map((block) => (
          <SmartNewsBlock key={block.id} config={block} />
        ))}

        {/* AI Insights Block */}
        <AIInsightsBlock />

        {/* Smart Summary Block - Only for authenticated users */}
        {user && <SmartSummaryBlock />}

        {/* Smart Blocks: above_all_news */}
        {blocksAboveAllNews && blocksAboveAllNews.map((block) => (
          <SmartNewsBlock key={block.id} config={block} />
        ))}

        {homepage.forYou && homepage.forYou.length > 0 && (
          <PersonalizedFeed 
            articles={homepage.forYou}
            title="جميع الأخبار"
            showReason={false}
          />
        )}

        {/* Smart Blocks: between_all_and_murqap */}
        {blocksBetweenAllAndMurqap && blocksBetweenAllAndMurqap.map((block) => (
          <SmartNewsBlock key={block.id} config={block} />
        ))}

        {/* Mirqab Section - Future Forecasting */}
        <MirqabHomeSection />

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

        {/* Smart Blocks: above_footer */}
        {blocksAboveFooter && blocksAboveFooter.map((block) => (
          <SmartNewsBlock key={block.id} config={block} />
        ))}
      </main>
      
      <Footer />
    </div>
  );
}
