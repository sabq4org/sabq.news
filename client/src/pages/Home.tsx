import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { NavigationBar } from "@/components/NavigationBar";
import { Footer } from "@/components/Footer";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AIRecommendationsCarousel } from "@/components/AIRecommendationsCarousel";
import { AIInsightsBlock } from "@/components/AIInsightsBlock";
import { ShortsHomeBlock } from "@/components/ShortsHomeBlock";
import { TrendingKeywords } from "@/components/TrendingKeywords";
import { FollowedKeywordsBlock } from "@/components/FollowedKeywordsBlock";
import { SmartSummaryBlock } from "@/components/SmartSummaryBlock";
import { PersonalizedFeed } from "@/components/PersonalizedFeed";
import { DeepDiveSection } from "@/components/DeepDiveSection";
import { TrendingTopics } from "@/components/TrendingTopics";
import { MirqabHomeSection } from "@/components/MirqabHomeSection";
import { SmartNewsBlock } from "@/components/SmartNewsBlock";
import { QuadCategoriesBlock } from "@/components/QuadCategoriesBlock";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Play, Headphones } from "lucide-react";
import type { ArticleWithDetails, SmartBlock, AudioNewsBrief } from "@shared/schema";

function AudioBriefsSection() {
  const [selectedBrief, setSelectedBrief] = useState<AudioNewsBrief | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { data: briefs, isLoading } = useQuery<AudioNewsBrief[]>({
    queryKey: ['/api/audio-briefs/published'],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  if (!briefs || briefs.length === 0) return null;
  
  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Headphones className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">الأخبار الصوتية</h2>
            <p className="text-sm text-muted-foreground mt-1">
              نشرات صوتية يومية من فريق سبق الإخباري
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {briefs.map((brief, index) => (
            <div
              key={brief.id}
              className="group relative p-6 bg-card border rounded-2xl hover-elevate cursor-pointer transition-all"
              onClick={() => setSelectedBrief(brief)}
              onMouseEnter={() => setActiveIndex(index)}
              data-testid={`audio-brief-${brief.id}`}
            >
              {/* Waveform Animation */}
              <div className="absolute top-4 left-4 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className="w-1 bg-primary rounded-full transition-all"
                    style={{
                      height: activeIndex === index ? `${Math.random() * 20 + 10}px` : '12px',
                      animation: activeIndex === index ? `pulse ${Math.random() * 0.5 + 0.5}s ease-in-out infinite` : 'none',
                    }}
                  />
                ))}
              </div>

              <div className="flex items-start gap-3 mt-8">
                <Button
                  size="icon"
                  variant="default"
                  className="shrink-0 group-hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBrief(brief);
                  }}
                  data-testid={`button-play-${brief.id}`}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2 mb-2">{brief.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {brief.content}
                  </p>
                  {brief.duration && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{Math.floor(brief.duration / 60)}:{(brief.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedBrief && (
        <Dialog open={!!selectedBrief} onOpenChange={() => setSelectedBrief(null)}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{selectedBrief.title}</h2>
              </div>
              <p className="text-muted-foreground">{selectedBrief.content}</p>
              <AudioPlayer
                newsletterId={selectedBrief.id}
                audioUrl={selectedBrief.audioUrl!}
                title={selectedBrief.title}
                duration={selectedBrief.duration || undefined}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

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
  });

  const { data: blocksAboveAllNews } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks', 'above_all_news'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'above_all_news' });
      const res = await fetch(`/api/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: blocksBetweenAllAndMurqap } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks', 'between_all_and_murqap'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'between_all_and_murqap' });
      const res = await fetch(`/api/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: blocksAboveFooter } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks', 'above_footer'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'above_footer' });
      const res = await fetch(`/api/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header user={user} />
        <NavigationBar />
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
        <NavigationBar />
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
        <NavigationBar />
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
      <NavigationBar />

      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* Hero Section */}
          {homepage.hero && homepage.hero.length > 0 && (
            <div className="mb-12">
              <HeroCarousel articles={homepage.hero} />
            </div>
          )}

          {/* Smart Blocks: below_featured */}
          {blocksBelowFeatured && blocksBelowFeatured.map((block) => (
            <SmartNewsBlock key={block.id} config={block} />
          ))}
        </div>

        {/* AI Recommendations Carousel */}
        <AIRecommendationsCarousel />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 py-8">
          {/* Placeholder for more content */}
        </div>

        {/* Visual Separator + AI Section with soft gradient background */}
        <div className="section-separator"></div>
        <div className="bg-ai-gradient-soft py-12">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Smart Summary Block (صباح الخير) - Only for authenticated users */}
            {user && (
              <div className="scroll-fade-in">
                <SmartSummaryBlock />
              </div>
            )}

            {/* AI Insights Block (مؤشرات الأسبوع) */}
            <div className="scroll-fade-in">
              <AIInsightsBlock />
            </div>

            {/* Shorts Home Block (سبق قصير) */}
            <div className="scroll-fade-in">
              <ShortsHomeBlock />
            </div>
          </div>
        </div>

        {/* Visual Separator */}
        <div className="section-separator"></div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 py-12">
          {/* Smart Blocks: above_all_news */}
          {blocksAboveAllNews && blocksAboveAllNews.map((block) => (
            <SmartNewsBlock key={block.id} config={block} />
          ))}

          {/* All News Section */}
          {homepage.forYou && homepage.forYou.length > 0 && (
            <div className="scroll-fade-in">
              <PersonalizedFeed 
                articles={homepage.forYou}
                title="جميع الأخبار"
                showReason={false}
              />
            </div>
          )}

          {/* Quad Categories Block */}
          <div className="scroll-fade-in">
            <QuadCategoriesBlock />
          </div>
        </div>

        {/* Visual Separator */}
        <div className="section-separator"></div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 py-12">
          {/* Smart Blocks: between_all_and_murqap */}
          {blocksBetweenAllAndMurqap && blocksBetweenAllAndMurqap.map((block) => (
            <SmartNewsBlock key={block.id} config={block} />
          ))}

          {/* Mirqab Section - Future Forecasting */}
          <div className="scroll-fade-in">
            <MirqabHomeSection />
          </div>

          <div className="space-y-8">
            {homepage.deepDive && homepage.deepDive.length > 0 && (
              <div className="scroll-fade-in">
                <DeepDiveSection articles={homepage.deepDive} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {homepage.trending && homepage.trending.length > 0 && (
                <div className="scroll-fade-in">
                  <TrendingTopics topics={homepage.trending} />
                </div>
              )}
              <div className="scroll-fade-in">
                <TrendingKeywords />
              </div>
            </div>
          </div>

          {/* Smart Blocks: above_footer */}
          {blocksAboveFooter && blocksAboveFooter.map((block) => (
            <SmartNewsBlock key={block.id} config={block} />
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
