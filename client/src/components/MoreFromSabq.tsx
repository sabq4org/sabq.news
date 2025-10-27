import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  Star, 
  Zap, 
  TrendingUp, 
  Brain,
  ChevronRight,
  Clock,
  Eye
} from "lucide-react";
import type { ArticleWithDetails } from "@shared/schema";

interface TabConfig {
  id: 'featured' | 'breaking' | 'mirqab' | 'personalized';
  label: string;
  icon: any;
  gradient: string;
  badgeColor: string;
}

const TABS: TabConfig[] = [
  {
    id: 'featured',
    label: 'مميز',
    icon: Star,
    gradient: 'from-amber-500/10 to-orange-500/10',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
  },
  {
    id: 'breaking',
    label: 'عاجل',
    icon: Zap,
    gradient: 'from-red-500/10 to-pink-500/10',
    badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
  },
  {
    id: 'mirqab',
    label: 'المرقاب',
    icon: TrendingUp,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
  },
  {
    id: 'personalized',
    label: 'مقترح لك',
    icon: Brain,
    gradient: 'from-purple-500/10 to-indigo-500/10',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
  }
];

const AUTO_ROTATE_INTERVAL = 10000; // 10 seconds

export function MoreFromSabq() {
  const [activeTab, setActiveTab] = useState<TabConfig['id']>('featured');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Fetch homepage data
  const { data: homepage } = useQuery<{
    breaking: ArticleWithDetails[];
    editorPicks: ArticleWithDetails[];
  }>({
    queryKey: ["/api/homepage"],
    staleTime: 60000,
  });

  // Fetch personalized feed (only for authenticated users)
  const { data: personalFeed, error: personalFeedError } = useQuery<{
    articles: ArticleWithDetails[];
  }>({
    queryKey: ["/api/personal-feed"],
    retry: false,
    enabled: true, // Will return 401 for guests, but that's handled
  });

  // Fetch Mirqab data
  const { data: mirqabData, isLoading: mirqabLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/mirqab/next-stories"],
  });

  // Check if user is authenticated (personal feed returns 401 if not)
  const isAuthenticated = personalFeed !== undefined && !personalFeedError;

  // Auto-rotate featured article
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      const currentData = getCurrentTabData();
      if (currentData && currentData.length > 1) {
        setFeaturedIndex((prev) => (prev + 1) % currentData.length);
      }
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [activeTab, autoRotate, homepage, personalFeed, mirqabData]);

  // Get available tabs (hide personalized if not authenticated)
  const availableTabs = TABS.filter(tab => {
    if (tab.id === 'personalized' && !isAuthenticated) {
      return false;
    }
    return true;
  });

  // Get data for current tab
  const getCurrentTabData = (): ArticleWithDetails[] => {
    switch (activeTab) {
      case 'featured':
        return homepage?.editorPicks || [];
      case 'breaking':
        return homepage?.breaking || [];
      case 'mirqab':
        return mirqabData || [];
      case 'personalized':
        return personalFeed?.articles || [];
      default:
        return [];
    }
  };

  const currentData = getCurrentTabData();
  
  // Reset to first available tab if current tab has no data
  useEffect(() => {
    if (currentData.length === 0 && availableTabs.length > 0) {
      const firstAvailableTab = availableTabs.find(tab => {
        const tabData = tab.id === 'featured' ? homepage?.editorPicks :
                       tab.id === 'breaking' ? homepage?.breaking :
                       tab.id === 'mirqab' ? mirqabData :
                       tab.id === 'personalized' ? personalFeed?.articles : [];
        return (tabData || []).length > 0;
      });
      
      if (firstAvailableTab && firstAvailableTab.id !== activeTab) {
        setActiveTab(firstAvailableTab.id);
        setFeaturedIndex(0);
      }
    }
  }, [activeTab, availableTabs, currentData.length, homepage, mirqabData, personalFeed]);

  // Reset featured index if it's out of bounds
  useEffect(() => {
    if (featuredIndex >= currentData.length && currentData.length > 0) {
      setFeaturedIndex(0);
    }
  }, [featuredIndex, currentData.length]);

  const featuredArticle = currentData[featuredIndex];
  const sideArticles = currentData.slice(0, 6).filter((_, i) => i !== featuredIndex);

  // Get current tab config
  const currentTab = TABS.find(t => t.id === activeTab)!;

  // Show loading state if homepage is still loading
  if (!homepage && !mirqabData) {
    return null;
  }

  // Hide section if no data available in any tab
  const hasAnyData = 
    (homepage?.editorPicks && homepage.editorPicks.length > 0) ||
    (homepage?.breaking && homepage.breaking.length > 0) ||
    (mirqabData && mirqabData.length > 0) ||
    (isAuthenticated && personalFeed?.articles && personalFeed.articles.length > 0);

  if (!hasAnyData) {
    return null;
  }

  // If current tab has no data, show empty state for that tab only
  const hasCurrentTabData = currentData && currentData.length > 0;

  const handleTabChange = (tabId: TabConfig['id']) => {
    setActiveTab(tabId);
    setFeaturedIndex(0);
    setAutoRotate(true);
  };

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/20" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
            <h2 className="text-3xl font-bold">محتوى مخصص لك</h2>
          </div>
          
          {/* Auto-rotate indicator */}
          {autoRotate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Clock className="h-3 w-3 animate-pulse" />
              <span>تحديث تلقائي</span>
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTabChange(tab.id)}
                className={`shrink-0 gap-2 ${!isActive && 'hover-elevate'}`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content Grid */}
        {!hasCurrentTabData ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              لا توجد محتويات متاحة في هذا القسم حالياً
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Featured Article - Large */}
            <AnimatePresence mode="wait">
              {featuredArticle && (
              <motion.div
                key={`${activeTab}-${featuredIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <Link href={`/news/${featuredArticle.slug}`}>
                  <Card 
                    className={`relative h-full overflow-hidden hover-elevate active-elevate-2 cursor-pointer bg-gradient-to-br ${currentTab.gradient} border-0`}
                    onMouseEnter={() => setAutoRotate(false)}
                    onMouseLeave={() => setAutoRotate(true)}
                    data-testid={`featured-article-${featuredArticle.id}`}
                  >
                    {/* Image */}
                    {featuredArticle.imageUrl && (
                      <div className="relative h-64 lg:h-80 overflow-hidden">
                        <img
                          src={featuredArticle.imageUrl}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Category Badge */}
                        {featuredArticle.category && (
                          <Badge 
                            className={`absolute top-4 right-4 ${currentTab.badgeColor} backdrop-blur-sm`}
                          >
                            {featuredArticle.category.nameAr}
                          </Badge>
                        )}

                        {/* Views */}
                        {featuredArticle.views > 0 && (
                          <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white/90 text-xs backdrop-blur-sm bg-black/30 px-2 py-1 rounded-full">
                            <Eye className="h-3 w-3" />
                            <span>{featuredArticle.views.toLocaleString('ar-EG')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 space-y-3">
                      <h3 className="text-2xl font-bold line-clamp-2 leading-tight">
                        {featuredArticle.title}
                      </h3>
                      
                      {featuredArticle.excerpt && (
                        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                          {featuredArticle.excerpt}
                        </p>
                      )}

                      {/* AI Insight (for personalized tab) */}
                      {activeTab === 'personalized' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-l from-purple-500/10 to-indigo-500/10 border border-purple-500/20"
                        >
                          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">
                              اقتراح ذكي
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-300">
                              مختار خصيصاً بناءً على اهتماماتك في {featuredArticle.category?.nameAr || 'الأخبار'}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Read More Link */}
                      <div className="flex items-center gap-2 text-primary font-medium text-sm pt-2">
                        <span>اقرأ المزيد</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Card>
                </Link>

                {/* Progress Indicators */}
                {currentData.length > 1 && (
                  <div className="flex gap-2 mt-4 justify-center">
                    {currentData.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFeaturedIndex(index);
                          setAutoRotate(false);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          index === featuredIndex
                            ? 'w-8 bg-primary'
                            : 'w-1.5 bg-border hover-elevate'
                        }`}
                        data-testid={`indicator-${index}`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Side Articles - Compact List */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {sideArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/news/${article.slug}`}>
                    <Card 
                      className="p-4 hover-elevate active-elevate-2 cursor-pointer border-border/50"
                      data-testid={`side-article-${article.id}`}
                    >
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {article.imageUrl && (
                          <div className="relative w-24 h-20 shrink-0 rounded-md overflow-hidden">
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-semibold line-clamp-2 text-sm leading-snug">
                            {article.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {article.category && (
                              <span className="shrink-0">{article.category.nameAr}</span>
                            )}
                            {article.views > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{article.views.toLocaleString('ar-EG')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* View All Button */}
            {currentData.length > 6 && (
              <Button
                variant="outline"
                className="w-full gap-2"
                asChild
              >
                <Link href={`/${activeTab === 'mirqab' ? 'mirqab' : 'category/' + (currentData[0]?.category?.slug || '')}`}>
                  <span>عرض المزيد من {currentTab.label}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
