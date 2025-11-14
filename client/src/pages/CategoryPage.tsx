import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Sparkles,
  Flame,
  Brain,
  Calendar,
  Zap,
  TrendingUp,
  Bot,
  MessageSquare,
  Eye,
  Heart,
  Newspaper,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  FolderX,
  Loader2,
  ArrowRight,
  Home,
  FolderOpen,
} from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Link } from "wouter";
import type { Category, ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { motion } from "framer-motion";
import { CategoryAnalytics } from "@/components/CategoryAnalytics";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

// Helper function to get category type badge
function getCategoryTypeBadge(type?: string) {
  switch (type) {
    case "dynamic":
      return { label: "ديناميكي", icon: <Zap className="h-3 w-3" />, variant: "default" as const };
    case "smart":
      return { label: "ذكي", icon: <Brain className="h-3 w-3" />, variant: "default" as const };
    case "seasonal":
      return { label: "موسمي", icon: <Calendar className="h-3 w-3" />, variant: "secondary" as const };
    default:
      return null;
  }
}

// Helper function to format update interval
function formatUpdateInterval(seconds?: number) {
  if (!seconds) return null;
  if (seconds < 60) return `${seconds} ثانية`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} دقيقة`;
}

// Helper function to estimate reading time
function estimateReadingTime(content?: string): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes || 1;
}

type SortMode = "newest" | "views" | "engagement";
type TimeRange = "today" | "3days" | "7days" | "30days" | "all";
type ArticleTypeFilter = "all" | "breaking" | "new" | "opinion" | "analysis";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  // Filter states
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [articleType, setArticleType] = useState<ArticleTypeFilter>("all");
  const [displayCount, setDisplayCount] = useState(12);

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories/slug", slug],
  });

  const { data: allArticles = [], isLoading: articlesLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/categories", slug, "articles"],
    enabled: !!category,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/categories", slug, "analytics"],
    enabled: !!category,
  });

  // Calculate statistics from articles data
  const statistics = useMemo(() => {
    if (allArticles.length === 0) {
      return {
        totalArticles: 0,
        recentArticles: 0,
        totalViews: 0,
        avgEngagement: 0,
        mostViewed: null,
        latestArticle: null,
      };
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentArticles = allArticles.filter((a) =>
      a.publishedAt && new Date(a.publishedAt) >= oneDayAgo
    );

    const totalViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalEngagement = allArticles.reduce(
      (sum, a) => sum + (a.reactionsCount || 0) + (a.commentsCount || 0),
      0
    );
    const avgEngagement = allArticles.length > 0
      ? Math.round(totalEngagement / allArticles.length)
      : 0;

    const mostViewed = allArticles.reduce(
      (max, a) => ((a.views || 0) > (max?.views || 0) ? a : max),
      allArticles[0]
    );

    const sortedByDate = [...allArticles].sort(
      (a, b) =>
        new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    );
    const latestArticle = sortedByDate[0];

    return {
      totalArticles: allArticles.length,
      recentArticles: recentArticles.length,
      totalViews,
      avgEngagement,
      mostViewed,
      latestArticle,
    };
  }, [allArticles]);

  // Reset displayCount when filters change
  useEffect(() => {
    setDisplayCount(12);
  }, [sortMode, timeRange, articleType]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let filtered = [...allArticles];

    // Time range filter
    if (timeRange !== "all") {
      const now = new Date();
      let cutoffDate: Date;

      switch (timeRange) {
        case "today":
          cutoffDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "3days":
          cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case "7days":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(
        (a) => a.publishedAt && new Date(a.publishedAt) >= cutoffDate
      );
    }

    // Article type filter
    if (articleType !== "all") {
      filtered = filtered.filter((a) => {
        switch (articleType) {
          case "breaking":
            return a.newsType === "breaking";
          case "new":
            return isNewArticle(a.publishedAt);
          case "opinion":
            return a.newsType === "opinion";
          case "analysis":
            return a.newsType === "analysis";
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortMode) {
      case "views":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "engagement":
        filtered.sort(
          (a, b) =>
            (b.reactionsCount || 0) + (b.commentsCount || 0) -
            ((a.reactionsCount || 0) + (a.commentsCount || 0))
        );
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.publishedAt || 0).getTime() -
            new Date(a.publishedAt || 0).getTime()
        );
        break;
    }

    return filtered;
  }, [allArticles, sortMode, timeRange, articleType]);

  // Displayed articles (with pagination)
  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayCount);
  }, [filteredArticles, displayCount]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSortMode("newest");
    setTimeRange("7days");
    setArticleType("all");
    setDisplayCount(12);
  }, []);

  // Load more
  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 12);
  }, []);

  const isSmartCategory = category?.type === "smart" || category?.type === "dynamic" || category?.type === "seasonal";

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-72 w-full mb-8 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">التصنيف غير موجود</h1>
          <p className="text-muted-foreground">لم نتمكن من العثور على هذا التصنيف</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      {/* Enhanced Hero Section - Fixed Height */}
      {category.heroImageUrl ? (
        <div className="relative h-72 overflow-hidden">
          <img
            src={category.heroImageUrl}
            alt={category.nameAr}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 dark:from-black/80 dark:via-black/40 dark:to-transparent" />
          {/* AI Gradient Overlay for Smart Categories */}
          {isSmartCategory && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 mix-blend-overlay" />
          )}
          <div className="absolute inset-0 flex flex-col justify-between">
            {/* Breadcrumb Navigation */}
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 pt-4">
              <nav className="flex items-center gap-2 text-sm text-white/90" data-testid="breadcrumb-navigation">
                <Link href="/">
                  <span className="flex items-center gap-1 hover-elevate px-2 py-1 rounded transition-colors cursor-pointer">
                    <Home className="h-3.5 w-3.5" />
                    الرئيسية
                  </span>
                </Link>
                <ArrowRight className="h-3.5 w-3.5" />
                <Link href="/categories">
                  <span className="hover-elevate px-2 py-1 rounded transition-colors cursor-pointer">
                    التصنيفات
                  </span>
                </Link>
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="font-semibold">{category.nameAr}</span>
              </nav>
            </div>

            {/* Hero Content */}
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {isSmartCategory && (
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </motion.div>
                )}
                {category.icon && (
                  <span className="text-3xl sm:text-4xl">{category.icon}</span>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {category.nameAr}
                </h1>
                {isSmartCategory ? (
                  <motion.div
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Badge
                      className="flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg"
                      data-testid="badge-category-type"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      اختيار ذكي
                    </Badge>
                  </motion.div>
                ) : (
                  getCategoryTypeBadge(category.type) && (
                    <Badge
                      variant={getCategoryTypeBadge(category.type)!.variant}
                      className="flex items-center gap-1 min-h-8 px-3 py-1.5 text-sm"
                      data-testid="badge-category-type"
                    >
                      {getCategoryTypeBadge(category.type)!.icon}
                      {getCategoryTypeBadge(category.type)!.label}
                    </Badge>
                  )
                )}
              </div>
              {category.description && (
                <p className="text-sm sm:text-base md:text-lg text-white/95 max-w-3xl mb-2 sm:mb-3 leading-relaxed">
                  {category.description}
                </p>
              )}
              {/* Smart Category Features */}
              {isSmartCategory && (
                <div className="flex flex-wrap gap-2">
                  {category.features?.realtime && (
                    <Badge
                      variant="secondary"
                      className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-realtime"
                    >
                      <Flame className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">مباشر</span>
                    </Badge>
                  )}
                  {category.features?.trending && (
                    <Badge
                      variant="secondary"
                      className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-trending"
                    >
                      <TrendingUp className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">رائج</span>
                    </Badge>
                  )}
                  {category.features?.ai_powered && (
                    <Badge
                      variant="secondary"
                      className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-ai"
                    >
                      <Bot className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">ذكاء اصطناعي</span>
                    </Badge>
                  )}
                  {category.features?.breaking_news && (
                    <Badge
                      variant="default"
                      className="bg-red-500/95 text-white backdrop-blur-sm min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-breaking"
                    >
                      <Zap className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">عاجل</span>
                    </Badge>
                  )}
                  {category.type === "dynamic" && category.updateInterval && (
                    <Badge
                      variant="secondary"
                      className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5"
                      data-testid="badge-update-interval"
                    >
                      <Clock className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">يتحدث كل {formatUpdateInterval(category.updateInterval)}</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`${
            isSmartCategory
              ? "bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 dark:from-primary/8 dark:via-accent/5 dark:to-primary/3"
              : "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 dark:from-primary/10 dark:to-primary/5"
          } border-b relative overflow-hidden h-72`}
        >
          {/* Animated AI Grid Pattern for Smart Categories */}
          {isSmartCategory && (
            <div className="absolute inset-0 opacity-20 dark:opacity-10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>
          )}
          <div className="container mx-auto px-3 sm:px-6 lg:px-8 h-full flex flex-col justify-between relative z-10">
            {/* Breadcrumb Navigation */}
            <div className="pt-4">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="breadcrumb-navigation">
                <Link href="/">
                  <span className="flex items-center gap-1 hover-elevate px-2 py-1 rounded transition-colors cursor-pointer">
                    <Home className="h-3.5 w-3.5" />
                    الرئيسية
                  </span>
                </Link>
                <ArrowRight className="h-3.5 w-3.5" />
                <Link href="/categories">
                  <span className="hover-elevate px-2 py-1 rounded transition-colors cursor-pointer">
                    التصنيفات
                  </span>
                </Link>
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">{category.nameAr}</span>
              </nav>
            </div>

            {/* Hero Content */}
            <div className="pb-6 sm:pb-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {isSmartCategory && (
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </motion.div>
                )}
                {category.icon && (
                  <span className="text-3xl sm:text-4xl">{category.icon}</span>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  {category.nameAr}
                </h1>
                {isSmartCategory ? (
                  <motion.div
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Badge
                      className="flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg"
                      data-testid="badge-category-type"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      اختيار ذكي
                    </Badge>
                  </motion.div>
                ) : (
                  getCategoryTypeBadge(category.type) && (
                    <Badge
                      variant={getCategoryTypeBadge(category.type)!.variant}
                      className="flex items-center gap-1 min-h-8 px-3 py-1.5 text-sm"
                      data-testid="badge-category-type"
                    >
                      {getCategoryTypeBadge(category.type)!.icon}
                      {getCategoryTypeBadge(category.type)!.label}
                    </Badge>
                  )
                )}
              </div>
              {category.description && (
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mb-2 sm:mb-3 leading-relaxed">
                  {category.description}
                </p>
              )}
              {/* Smart Category Features */}
              {isSmartCategory && (
                <div className="flex flex-wrap gap-2">
                  {category.features?.realtime && (
                    <Badge
                      variant="secondary"
                      className="min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-realtime"
                    >
                      <Flame className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">مباشر</span>
                    </Badge>
                  )}
                  {category.features?.trending && (
                    <Badge
                      variant="secondary"
                      className="min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-trending"
                    >
                      <TrendingUp className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">رائج</span>
                    </Badge>
                  )}
                  {category.features?.ai_powered && (
                    <Badge
                      variant="secondary"
                      className="min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-ai"
                    >
                      <Bot className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">ذكاء اصطناعي</span>
                    </Badge>
                  )}
                  {category.features?.breaking_news && (
                    <Badge
                      variant="default"
                      className="bg-red-600 dark:bg-red-500 text-white min-h-8 px-3 py-1.5"
                      data-testid="badge-feature-breaking"
                    >
                      <Zap className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">عاجل</span>
                    </Badge>
                  )}
                  {category.type === "dynamic" && category.updateInterval && (
                    <Badge
                      variant="secondary"
                      className="min-h-8 px-3 py-1.5"
                      data-testid="badge-update-interval"
                    >
                      <Clock className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">يتحدث كل {formatUpdateInterval(category.updateInterval)}</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Summary Section - ABOVE CategoryAnalytics */}
      {articlesLoading ? (
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Row 1: Category Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Total Articles */}
            <Card className="hover-elevate" data-testid="stat-total-articles">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي المقالات
                </CardTitle>
                <Newspaper className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalArticles.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">مقالة</p>
              </CardContent>
            </Card>

            {/* Recent Articles (24h) */}
            <Card className="hover-elevate" data-testid="stat-recent-articles">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  المقالات الحديثة
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.recentArticles.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">خلال 24 ساعة</p>
              </CardContent>
            </Card>

            {/* Total Views */}
            <Card className="hover-elevate" data-testid="stat-total-views">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  المشاهدات الكلية
                </CardTitle>
                <Eye className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">مشاهدة</p>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Engagement Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Average Engagement */}
            <Card className="hover-elevate" data-testid="stat-avg-engagement">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  معدل التفاعل
                </CardTitle>
                <Heart className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.avgEngagement.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">لكل مقالة</p>
              </CardContent>
            </Card>

            {/* Most Viewed Article */}
            <Card className="hover-elevate" data-testid="stat-most-viewed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  أكثر المقالات مشاهدة
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {statistics.mostViewed ? (
                  <>
                    <Link href={`/article/${statistics.mostViewed.slug}`}>
                      <div className="text-sm font-semibold line-clamp-1 hover:text-primary cursor-pointer mb-1">
                        {statistics.mostViewed.title}
                      </div>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {(statistics.mostViewed.views || 0).toLocaleString()} مشاهدة
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>

            {/* Last Update */}
            <Card className="hover-elevate" data-testid="stat-last-update">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  آخر تحديث
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {statistics.latestArticle?.publishedAt ? (
                  <>
                    <div className="text-lg font-bold">
                      {formatDistanceToNow(new Date(statistics.latestArticle.publishedAt), {
                        addSuffix: true,
                        locale: arSA,
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">آخر مقالة</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Category Analytics (Preserved) */}
      {analyticsLoading ? (
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-sm border border-border/40 dark:border-card-border">
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-24 sm:h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : analytics ? (
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          <CategoryAnalytics analytics={analytics} language="ar" />
        </div>
      ) : null}

      {/* Advanced Filters Bar */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Left Side (RTL): Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" data-testid="option-sort-newest">
                  الأحدث
                </SelectItem>
                <SelectItem value="views" data-testid="option-sort-views">
                  الأكثر مشاهدة
                </SelectItem>
                <SelectItem value="engagement" data-testid="option-sort-engagement">
                  الأكثر تفاعلاً
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right Side: Time and Type Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today" data-testid="option-time-today">
                    اليوم
                  </SelectItem>
                  <SelectItem value="3days" data-testid="option-time-3days">
                    آخر 3 أيام
                  </SelectItem>
                  <SelectItem value="7days" data-testid="option-time-7days">
                    آخر 7 أيام
                  </SelectItem>
                  <SelectItem value="30days" data-testid="option-time-30days">
                    آخر 30 يوم
                  </SelectItem>
                  <SelectItem value="all" data-testid="option-time-all">
                    الكل
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Article Type Filter */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Select value={articleType} onValueChange={(value: ArticleTypeFilter) => setArticleType(value)}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-article-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-type-all">
                    الكل
                  </SelectItem>
                  <SelectItem value="breaking" data-testid="option-type-breaking">
                    عاجل
                  </SelectItem>
                  <SelectItem value="new" data-testid="option-type-new">
                    جديد
                  </SelectItem>
                  <SelectItem value="opinion" data-testid="option-type-opinion">
                    رأي
                  </SelectItem>
                  <SelectItem value="analysis" data-testid="option-type-analysis">
                    تحليل
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filters Indicator */}
        {(sortMode !== "newest" || timeRange !== "7days" || articleType !== "all") && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">الفلاتر النشطة:</span>
            <div className="flex flex-wrap gap-2">
              {sortMode !== "newest" && (
                <Badge variant="secondary" className="text-xs">
                  {sortMode === "views" ? "الأكثر مشاهدة" : "الأكثر تفاعلاً"}
                </Badge>
              )}
              {timeRange !== "7days" && (
                <Badge variant="secondary" className="text-xs">
                  {
                    {
                      today: "اليوم",
                      "3days": "آخر 3 أيام",
                      "30days": "آخر 30 يوم",
                      all: "الكل",
                    }[timeRange]
                  }
                </Badge>
              )}
              {articleType !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {
                    {
                      breaking: "عاجل",
                      new: "جديد",
                      opinion: "رأي",
                      analysis: "تحليل",
                    }[articleType]
                  }
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
              data-testid="button-reset-filters"
            >
              إعادة تعيين
            </Button>
          </div>
        )}
      </div>

      {/* Articles Grid/List */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">
            آخر الأخبار
            {filteredArticles.length > 0 && (
              <Badge variant="secondary" className="mr-2 min-h-7 px-2.5">
                {filteredArticles.length.toLocaleString("en-US")}
              </Badge>
            )}
          </h2>
        </div>

        {articlesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : displayedArticles.length === 0 ? (
          // Enhanced Empty State
          <div className="text-center py-16 sm:py-20" data-testid="empty-state">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <FolderX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">لم نجد مقالات تطابق الفلاتر المحددة</h3>
            <p className="text-muted-foreground mb-6">جرب تغيير الفلاتر أو إعادة تعيينها</p>
            <Button onClick={handleResetFilters} data-testid="button-reset-empty">
              إعادة تعيين الفلاتر
            </Button>
          </div>
        ) : (
          <>
            {/* Enhanced Mobile View: Vertical List */}
            <Card className="overflow-hidden lg:hidden shadow-sm border border-border/40 dark:border-card-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border/30 dark:divide-border/20">
                  {displayedArticles.map((article, index) => {
                    const timeAgo = article.publishedAt
                      ? formatDistanceToNow(new Date(article.publishedAt), {
                          addSuffix: true,
                          locale: arSA,
                        })
                      : null;
                    const readingTime = estimateReadingTime(article.content);
                    const isBreaking = article.newsType === "breaking";
                    const isNew = isNewArticle(article.publishedAt);

                    return (
                      <div key={article.id}>
                        <Link href={`/article/${article.slug}`}>
                          <div
                            className="block group cursor-pointer"
                            data-testid={`link-article-mobile-${article.id}`}
                          >
                            <div
                              className={`p-4 hover-elevate active-elevate-2 transition-all ${
                                isBreaking ? "bg-destructive/5" : ""
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Enhanced Thumbnail */}
                                <div className="relative flex-shrink-0 w-28 h-24 rounded-lg overflow-hidden">
                                  {article.imageUrl ? (
                                    <>
                                      <img
                                        src={article.imageUrl}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                        style={{
                                          objectPosition: (article as any).imageFocalPoint
                                            ? `${(article as any).imageFocalPoint.x}% ${(article as any).imageFocalPoint.y}%`
                                            : "center",
                                        }}
                                      />
                                      {/* Type Icon Overlay */}
                                      {isBreaking && (
                                        <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
                                          <Zap className="h-3 w-3 text-white" />
                                        </div>
                                      )}
                                      {isNew && !isBreaking && (
                                        <div className="absolute top-2 right-2 bg-emerald-600 rounded-full p-1">
                                          <Flame className="h-3 w-3 text-white" />
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  {/* Enhanced Badge */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isBreaking ? (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs h-6 gap-1 font-semibold"
                                        data-testid={`badge-breaking-${article.id}`}
                                      >
                                        <Zap className="h-3 w-3" />
                                        عاجل
                                      </Badge>
                                    ) : isNew ? (
                                      <Badge
                                        className="text-xs h-6 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 font-semibold"
                                        data-testid={`badge-new-${article.id}`}
                                      >
                                        <Flame className="h-3 w-3" />
                                        جديد
                                      </Badge>
                                    ) : article.category ? (
                                      <Badge
                                        className="text-xs h-6 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0"
                                        data-testid={`badge-article-category-${article.id}`}
                                      >
                                        {article.category.nameAr}
                                      </Badge>
                                    ) : null}
                                  </div>

                                  {/* Title */}
                                  <h4
                                    className={`font-bold text-sm line-clamp-2 leading-snug transition-colors ${
                                      isBreaking ? "text-destructive" : "group-hover:text-primary"
                                    }`}
                                    data-testid={`text-article-title-${article.id}`}
                                  >
                                    {article.title}
                                  </h4>

                                  {/* Meta Info */}
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    {timeAgo && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {timeAgo}
                                      </span>
                                    )}
                                    <ViewsCount views={article.views || 0} iconClassName="h-3 w-3" />
                                    {(article.commentsCount ?? 0) > 0 && (
                                      <span className="flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        {article.commentsCount}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {readingTime} دقيقة
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Desktop View: Grid with 4 columns */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedArticles.map((article) => {
                const timeAgo = article.publishedAt
                  ? formatDistanceToNow(new Date(article.publishedAt), {
                      addSuffix: true,
                      locale: arSA,
                    })
                  : null;
                const readingTime = estimateReadingTime(article.content);
                const isBreaking = article.newsType === "breaking";
                const isNew = isNewArticle(article.publishedAt);
                const categoryColor = category.color || "hsl(var(--primary))";

                return (
                  <Link key={article.id} href={`/article/${article.slug}`}>
                    <Card
                      className={`cursor-pointer h-full overflow-hidden shadow-sm border border-border/40 dark:border-card-border hover-elevate active-elevate-2 transition-all border-r-4 ${
                        isBreaking ? "bg-destructive/5" : ""
                      }`}
                      style={{ borderRightColor: categoryColor }}
                      data-testid={`card-article-${article.id}`}
                    >
                      {/* Enhanced Image Section */}
                      {article.imageUrl && (
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            loading="lazy"
                            style={{
                              objectPosition: (article as any).imageFocalPoint
                                ? `${(article as any).imageFocalPoint.x}% ${(article as any).imageFocalPoint.y}%`
                                : "center",
                            }}
                          />
                          {/* Type Icon in Top-Right Corner */}
                          {isBreaking && (
                            <div className="absolute top-3 right-3 bg-red-600 rounded-full p-2 shadow-lg">
                              <Zap className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {isNew && !isBreaking && (
                            <div className="absolute top-3 right-3 bg-emerald-600 rounded-full p-2 shadow-lg">
                              <Flame className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {/* Breaking Badge */}
                          {isBreaking && (
                            <Badge
                              variant="destructive"
                              className="absolute bottom-3 left-3 gap-1"
                              data-testid={`badge-breaking-${article.id}`}
                            >
                              <Zap className="h-3 w-3" />
                              عاجل
                            </Badge>
                          )}
                          {/* New Badge */}
                          {isNew && !isBreaking && (
                            <Badge
                              className="absolute bottom-3 left-3 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
                              data-testid={`badge-new-${article.id}`}
                            >
                              <Flame className="h-3 w-3" />
                              جديد
                            </Badge>
                          )}
                        </div>
                      )}

                      <CardContent className="p-5">
                        {/* Category Badge (if no image) */}
                        {!article.imageUrl && (
                          <div className="mb-3">
                            {isBreaking ? (
                              <Badge
                                variant="destructive"
                                className="gap-1"
                                data-testid={`badge-breaking-${article.id}`}
                              >
                                <Zap className="h-3 w-3" />
                                عاجل
                              </Badge>
                            ) : isNew ? (
                              <Badge
                                className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
                                data-testid={`badge-new-${article.id}`}
                              >
                                <Flame className="h-3 w-3" />
                                جديد
                              </Badge>
                            ) : article.category ? (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                data-testid={`badge-article-category-${article.id}`}
                              >
                                {article.category.nameAr}
                              </Badge>
                            ) : null}
                          </div>
                        )}

                        {/* Title */}
                        <h3
                          className={`font-bold text-base mb-3 line-clamp-2 leading-snug transition-colors ${
                            isBreaking ? "text-destructive" : "hover:text-primary"
                          }`}
                          data-testid={`text-article-title-${article.id}`}
                        >
                          {article.title}
                        </h3>

                        {/* Summary */}
                        {article.aiSummary && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                            {article.aiSummary}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-3">
                          {timeAgo && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo}
                            </span>
                          )}
                          <ViewsCount views={article.views || 0} iconClassName="h-3 w-3" />
                          {(article.commentsCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {article.commentsCount}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readingTime} دقيقة
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Load More Button */}
            {displayedArticles.length < filteredArticles.length && (
              <div className="mt-8 text-center" data-testid="load-more-section">
                <p className="text-sm text-muted-foreground mb-4">
                  عرض {displayedArticles.length} من {filteredArticles.length} مقالة
                  {filteredArticles.length - displayedArticles.length > 0 && (
                    <span className="font-semibold">
                      {" "}• متبقي {filteredArticles.length - displayedArticles.length} مقالة
                    </span>
                  )}
                </p>
                <Button
                  onClick={handleLoadMore}
                  size="lg"
                  className="gap-2"
                  data-testid="button-load-more"
                  disabled={articlesLoading}
                >
                  {articlesLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      تحميل المزيد ({Math.min(12, filteredArticles.length - displayedArticles.length)})
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
