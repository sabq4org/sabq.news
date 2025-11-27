import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { MobileOptimizedKpiCard } from "@/components/MobileOptimizedKpiCard";
import { NavigationBar } from "@/components/NavigationBar";
import { Footer } from "@/components/Footer";
import { HeroCarousel } from "@/components/HeroCarousel";
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
import { IFoxHomeBlock } from "@/components/IFoxHomeBlock";
import { OpinionArticlesBlock } from "@/components/OpinionArticlesBlock";
import { MuqtarabHomeBlock } from "@/components/MuqtarabHomeBlock";
import { AdSlot } from "@/components/AdSlot";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AudioPlayer } from "@/components/AudioPlayer";
import { HomeAudioWidget } from "@/components/HomeAudioWidget";
import { Play, Headphones, Newspaper, Eye, TrendingUp, MessageSquare, Rss } from "lucide-react";
import { Link } from "wouter";
import type { ArticleWithDetails, SmartBlock, AudioNewsBrief, AudioNewsletter } from "@shared/schema";
import type { User } from "@/hooks/useAuth";

// New Audio Newsletter Section
function AudioNewsletterSection() {
  const [selectedNewsletter, setSelectedNewsletter] = useState<AudioNewsletter | null>(null);
  
  const { data: newsletters } = useQuery<AudioNewsletter[]>({
    queryKey: ['/api/audio-newsletters/public'],
    queryFn: async () => {
      const res = await fetch('/api/audio-newsletters/public?limit=3&status=published');
      if (!res.ok) throw new Error('Failed to fetch newsletters');
      const data = await res.json();
      return data.newsletters || [];
    }
  });
  
  if (!newsletters || newsletters.length === 0) return null;
  
  return (
    <section className="py-8 bg-gradient-to-l from-primary/5 to-accent/5" dir="rtl">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Headphones className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">النشرات الصوتية</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/audio-newsletters">
              <Button variant="outline" size="sm" data-testid="button-view-all-newsletters">
                عرض الكل
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/rss/audio-newsletters', '_blank')}
              data-testid="button-podcast-rss"
            >
              <Rss className="h-4 w-4 ml-2" />
              Podcast RSS
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {newsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className="p-4 bg-card border rounded-lg hover-elevate cursor-pointer"
              onClick={() => setSelectedNewsletter(newsletter)}
              data-testid={`audio-newsletter-${newsletter.id}`}
            >
              <div className="flex items-start gap-3">
                <Button
                  size="icon"
                  variant="default"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNewsletter(newsletter);
                  }}
                  data-testid={`button-play-${newsletter.id}`}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2 mb-1">{newsletter.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {newsletter.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {newsletter.duration && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {Math.floor(newsletter.duration / 60)}:{(newsletter.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                    {newsletter.listenCount > 0 && (
                      <span>{newsletter.listenCount} استماع</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedNewsletter && (
        <Dialog open={!!selectedNewsletter} onOpenChange={() => setSelectedNewsletter(null)}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{selectedNewsletter.title}</h2>
              <p className="text-muted-foreground">{selectedNewsletter.description}</p>
              <AudioPlayer
                newsletterId={selectedNewsletter.id}
                audioUrl={selectedNewsletter.audioUrl!}
                title={selectedNewsletter.title}
                duration={selectedNewsletter.duration || undefined}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

function AudioBriefsSection() {
  const [selectedBrief, setSelectedBrief] = useState<AudioNewsBrief | null>(null);
  
  const { data: briefs } = useQuery<AudioNewsBrief[]>({
    queryKey: ['/api/audio-briefs/published'],
  });
  
  if (!briefs || briefs.length === 0) return null;
  
  return (
    <section className="py-8 bg-gradient-to-l from-primary/5 to-accent/5" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Headphones className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">الأخبار الصوتية</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {briefs.map((brief) => (
            <div
              key={brief.id}
              className="p-4 bg-card border rounded-lg hover-elevate cursor-pointer"
              onClick={() => setSelectedBrief(brief)}
              data-testid={`audio-brief-${brief.id}`}
            >
              <div className="flex items-start gap-3">
                <Button
                  size="icon"
                  variant="default"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBrief(brief);
                  }}
                  data-testid={`button-play-${brief.id}`}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2 mb-1">{brief.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {brief.content}
                  </p>
                  {brief.duration && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.floor(brief.duration / 60)}:{(brief.duration % 60).toString().padStart(2, '0')}
                    </p>
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
              <h2 className="text-xl font-bold">{selectedBrief.title}</h2>
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
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: homepage, isLoading, error, refetch: refetchHomepage } = useQuery<HomepageData>({
    queryKey: ["/api/homepage"],
    staleTime: 15 * 1000, // Data becomes stale after 15 seconds
    refetchInterval: 20 * 1000, // Auto-refresh every 20 seconds for breaking news
  });

  // Listen for SSE cache invalidation events (for instant breaking news updates)
  useEffect(() => {
    console.log('[SSE] Connecting to cache invalidation stream...');
    const eventSource = new EventSource('/api/cache-invalidation/stream');
    
    eventSource.onopen = () => {
      console.log('[SSE] Connected to cache invalidation stream');
    };
    
    eventSource.onmessage = (event) => {
      console.log('[SSE] Received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'cache_invalidated' && data.patterns?.some((p: string) => p.includes('homepage') || p.includes('breaking') || p.includes('blocks'))) {
          console.log('[SSE] Homepage cache invalidated, refetching...');
          refetchHomepage();
        }
      } catch (e) {
        // Ignore parse errors (heartbeat messages)
      }
    };

    eventSource.onerror = (err) => {
      console.log('[SSE] Connection error, will reconnect...', err);
    };

    return () => {
      console.log('[SSE] Closing connection');
      eventSource.close();
    };
  }, [refetchHomepage]);

  // Fetch homepage statistics
  const { data: stats } = useQuery<{
    totalArticles: number;
    todayArticles: number;
    totalViews: number;
    activeUsers: number;
  }>({
    queryKey: ["/api/homepage/stats"],
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
        <Header user={user || undefined} />
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
        <Header user={user || undefined} />
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
        <Header user={user || undefined} />
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
      <Header user={user || undefined} />
      <NavigationBar />

      <main className="flex-1">
        {/* Statistics Cards Section - Compact Single Row */}
        {stats && (
          <div className="bg-muted/30 border-b">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="grid grid-cols-4 gap-2">
                <MobileOptimizedKpiCard
                  label="إجمالي المقالات"
                  value={(stats.totalArticles ?? 0).toLocaleString('en-US')}
                  icon={Newspaper}
                  iconColor="text-primary"
                  iconBgColor="bg-primary/10"
                  testId="card-stat-total-articles"
                  className="compact"
                />
                
                <MobileOptimizedKpiCard
                  label="مقالات اليوم"
                  value={(stats.todayArticles ?? 0).toLocaleString('en-US')}
                  icon={TrendingUp}
                  iconColor="text-green-500"
                  iconBgColor="bg-green-500/10"
                  testId="card-stat-today-articles"
                  className="compact"
                />
                
                <MobileOptimizedKpiCard
                  label="إجمالي المشاهدات"
                  value={(stats.totalViews ?? 0).toLocaleString('en-US')}
                  icon={Eye}
                  iconColor="text-blue-500"
                  iconBgColor="bg-blue-500/10"
                  testId="card-stat-total-views"
                  className="compact"
                />
                
                <MobileOptimizedKpiCard
                  label="المستخدمون النشطون"
                  value={(stats.activeUsers ?? 0).toLocaleString('en-US')}
                  icon={MessageSquare}
                  iconColor="text-orange-500"
                  iconBgColor="bg-orange-500/10"
                  testId="card-stat-active-users"
                  className="compact"
                />
              </div>
            </div>
          </div>
        )}

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Hero Section */}
          {homepage.hero && homepage.hero.length > 0 && (
            <div className="mb-8">
              <HeroCarousel articles={homepage.hero} />
            </div>
          )}

          {/* Ad Banner Slot - Below Featured News */}
          <div className="mb-8">
            <AdSlot slotId="header-banner" className="w-full" />
          </div>

          {/* Smart Blocks: below_featured */}
          {blocksBelowFeatured && blocksBelowFeatured.map((block) => (
            <SmartNewsBlock key={block.id} config={block} />
          ))}
        </div>

        {/* AI Section with soft gradient background */}
        <div className="bg-ai-gradient-soft py-8">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Smart Summary Block (صباح الخير) - Shows personalized content for logged-in users, promotional content for guests */}
            <div className="scroll-fade-in">
              <SmartSummaryBlock />
            </div>

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

        {/* Audio Newsletter Section */}
        <AudioNewsletterSection />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
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
        </div>

        {/* Quad Categories Block - Full Width */}
        <div className="scroll-fade-in">
          <QuadCategoriesBlock />
        </div>

        {/* iFox AI Block - Full Width */}
        <div className="scroll-fade-in">
          <IFoxHomeBlock />
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
          {/* Opinion Articles Block */}
          <div className="scroll-fade-in">
            <OpinionArticlesBlock />
          </div>

          {/* Muqtarab Block */}
          <div className="scroll-fade-in">
            <MuqtarabHomeBlock />
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
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

      {/* Floating Audio Widget */}
      <HomeAudioWidget />
    </div>
  );
}
