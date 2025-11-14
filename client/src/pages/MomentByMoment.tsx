import { useEffect, useRef, useState, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow, parseISO, startOfDay, subDays, subHours, differenceInMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Radio,
  Zap,
  Eye,
  MessageSquare,
  Loader2,
  Clock,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";

// Types
interface LiveUpdate {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  isBreaking: boolean;
  categoryId: string;
  categoryNameAr: string;
  categoryColor?: string;
  viewsCount: number;
  commentsCount: number;
  summary: string;
}

interface LiveUpdatesResponse {
  items: LiveUpdate[];
  nextCursor: string | null;
}

interface BreakingNewsResponse {
  items: LiveUpdate[];
}

interface Category {
  id: string;
  nameAr: string;
  slug: string;
  color?: string;
  status: string;
  type: string;
}

type TimeRange = "1h" | "3h" | "today" | "yesterday" | "7d";

// Utility Functions
function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch {
    return "";
  }
}

function isNewUpdate(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    return differenceInMinutes(now, date) <= 5;
  } catch {
    return false;
  }
}

function getTimeRangeDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "1h":
      return subHours(now, 1);
    case "3h":
      return subHours(now, 3);
    case "today":
      return startOfDay(now);
    case "yesterday":
      return startOfDay(subDays(now, 1));
    case "7d":
      return subDays(now, 7);
    default:
      return startOfDay(now);
  }
}

// Components
function StatisticsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="skeleton-statistics">
      {[1, 2, 3, 4].map((i) => (
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
  );
}

interface StatisticsCardsProps {
  items: LiveUpdate[];
}

function StatisticsCards({ items }: StatisticsCardsProps) {
  const statistics = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);

    // Total updates today
    const todayUpdates = items.filter((item) => {
      try {
        const publishedDate = parseISO(item.publishedAt);
        return publishedDate >= todayStart;
      } catch {
        return false;
      }
    });

    // Breaking news count
    const breakingCount = items.filter((item) => item.isBreaking).length;

    // Most active category
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.categoryNameAr] = (acc[item.categoryNameAr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveCategory = Object.entries(categoryCounts).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Average update frequency (in minutes)
    let avgFrequency = 0;
    if (todayUpdates.length > 1) {
      const sortedUpdates = todayUpdates.sort(
        (a, b) => parseISO(b.publishedAt).getTime() - parseISO(a.publishedAt).getTime()
      );
      const totalMinutes = differenceInMinutes(
        parseISO(sortedUpdates[0].publishedAt),
        parseISO(sortedUpdates[sortedUpdates.length - 1].publishedAt)
      );
      avgFrequency = Math.round(totalMinutes / (todayUpdates.length - 1));
    }

    return {
      todayTotal: todayUpdates.length,
      breakingCount,
      mostActiveCategory: mostActiveCategory ? mostActiveCategory[0] : "لا يوجد",
      avgFrequency,
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Live Updates Today */}
      <Card className="hover-elevate" data-testid="stat-today-updates">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            تحديثات اليوم
          </CardTitle>
          <Radio className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.todayTotal}</div>
          <p className="text-xs text-muted-foreground mt-1">تحديث مباشر</p>
        </CardContent>
      </Card>

      {/* Breaking News Count */}
      <Card className="hover-elevate" data-testid="stat-breaking-count">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            الأخبار العاجلة
          </CardTitle>
          <Zap className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.breakingCount}</div>
          <p className="text-xs text-muted-foreground mt-1">خبر عاجل</p>
        </CardContent>
      </Card>

      {/* Most Active Category */}
      <Card className="hover-elevate" data-testid="stat-active-category">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            الأكثر نشاطاً
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold line-clamp-1">{statistics.mostActiveCategory}</div>
          <p className="text-xs text-muted-foreground mt-1">تصنيف</p>
        </CardContent>
      </Card>

      {/* Average Update Frequency */}
      <Card className="hover-elevate" data-testid="stat-avg-frequency">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            معدل التحديث
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.avgFrequency > 0 ? statistics.avgFrequency : "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {statistics.avgFrequency > 0 ? "دقيقة" : "غير متوفر"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface CompactNewsCardProps {
  item: LiveUpdate;
}

function CompactNewsCard({ item }: CompactNewsCardProps) {
  const isNew = isNewUpdate(item.publishedAt);
  const categoryColor = item.categoryColor || "hsl(var(--primary))";

  return (
    <Link href={`/article/${item.slug}`} data-testid={`link-article-${item.id}`}>
      <Card 
        className="hover-elevate active-elevate-2 transition-all border-r-4" 
        style={{ borderRightColor: categoryColor }}
        data-testid={`card-news-${item.id}`}
      >
        <CardContent className="p-5">
          <div className="flex gap-4">
            {/* Thumbnail (optional) */}
            {item.imageUrl && (
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-24 h-24 rounded-lg object-cover shrink-0"
                loading="lazy"
                data-testid={`img-thumbnail-${item.id}`}
              />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isNew && (
                  <Badge variant="default" className="text-xs gap-1 bg-green-600" data-testid={`badge-new-${item.id}`}>
                    جديد
                  </Badge>
                )}
                {item.isBreaking && (
                  <Badge variant="destructive" className="text-xs gap-1" data-testid={`badge-breaking-${item.id}`}>
                    <Zap className="h-3 w-3" />
                    عاجل
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${item.id}`}>
                  {item.categoryNameAr}
                </Badge>
                <span className="text-xs text-muted-foreground mr-auto" data-testid={`text-time-${item.id}`}>
                  {formatRelativeTime(item.publishedAt)}
                </span>
              </div>

              <h3 className="font-bold text-base mb-2 line-clamp-2 leading-snug" data-testid={`text-title-${item.id}`}>
                {item.title}
              </h3>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3" data-testid={`text-summary-${item.id}`}>
                {item.summary}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1" data-testid={`text-views-${item.id}`}>
                  <Eye className="h-3 w-3" />
                  {item.viewsCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1" data-testid={`text-comments-${item.id}`}>
                  <MessageSquare className="h-3 w-3" />
                  {item.commentsCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CompactSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-4" data-testid="skeleton-loading">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-r-4 border-r-muted">
          <CardContent className="p-5">
            <div className="flex gap-4">
              <Skeleton className="w-24 h-24 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-24 mr-auto" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12" data-testid="empty-state">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Radio className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">لا توجد أخبار حالياً</h3>
      <p className="text-sm text-muted-foreground">
        سنعلمك فور وصول أخبار جديدة
      </p>
    </div>
  );
}

function BreakingTicker({ items }: { items: LiveUpdate[] }) {
  if (items.length === 0) return null;

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className="bg-destructive/10 border-b py-3 overflow-hidden" data-testid="breaking-ticker">
      <div className="container max-w-6xl px-6">
        <div className="flex items-center gap-4">
          <Badge variant="destructive" className="shrink-0" data-testid="badge-breaking-ticker">
            <Zap className="h-3 w-3 ml-1" />
            عاجل
          </Badge>
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-marquee">
              {duplicatedItems.map((item, index) => (
                <Link 
                  key={`${item.id}-${index}`}
                  href={`/article/${item.slug}`}
                  className="text-sm font-medium hover:underline whitespace-nowrap"
                  data-testid={`link-breaking-${item.id}-${index}`}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function MomentByMoment() {
  const [filter, setFilter] = useState<"all" | "breaking">("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch categories
  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const activeCategories = categoriesData.filter(
    (cat) => cat.status === "active" && cat.type === "core"
  );

  // Fetch breaking news (ticker)
  const { data: breakingData } = useQuery<BreakingNewsResponse>({
    queryKey: ["/api/live/breaking"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const breakingNews = breakingData?.items || [];

  // Fetch live updates with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<LiveUpdatesResponse>({
    queryKey: ["/api/live/updates", filter],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (filter !== "all") {
        params.set("filter", filter);
      }
      if (pageParam) {
        params.set("cursor", pageParam as string);
      }

      const res = await fetch(`/api/live/updates?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const allItems = data?.pages.flatMap((page) => page.items) || [];

  // Filter items by time range and category
  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // Filter by time range
    if (timeRange !== "today") {
      const rangeDate = getTimeRangeDate(timeRange);
      filtered = filtered.filter((item) => {
        try {
          const publishedDate = parseISO(item.publishedAt);
          return publishedDate >= rangeDate;
        } catch {
          return false;
        }
      });
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.categoryId === categoryFilter);
    }

    return filtered;
  }, [allItems, timeRange, categoryFilter]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/live/updates"] });
    queryClient.invalidateQueries({ queryKey: ["/api/live/breaking"] });
    refetch();
  };

  // Auto-refresh and update last update time
  useEffect(() => {
    const updateTime = () => {
      setLastUpdate(new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      }));
    };

    updateTime();

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/live/updates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live/breaking"] });
      updateTime();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="min-h-screen bg-background" dir="rtl" data-testid="page-moment-by-moment">
      {/* Enhanced Hero Section */}
      <div className="bg-gradient-to-l from-red-500/10 via-orange-500/10 to-primary/10 border-b" data-testid="header-hero">
        <div className="container max-w-6xl px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-destructive rounded-xl" data-testid="icon-live">
              <Radio className="h-8 w-8 text-destructive-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold" data-testid="text-page-title">
                  لحظة بلحظة
                </h1>
                <Badge variant="destructive" className="animate-pulse" data-testid="badge-live">
                  LIVE
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg" data-testid="text-page-subtitle">
                متابعة مباشرة للأخبار العاجلة والتحديثات اللحظية
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Breaking Ticker (Horizontal Scrolling) */}
      <BreakingTicker items={breakingNews} />

      {/* Statistics Summary Section */}
      <div className="container max-w-6xl px-6 py-6">
        {isLoading ? (
          <StatisticsSkeleton />
        ) : (
          <StatisticsCards items={allItems} />
        )}
      </div>

      {/* Enhanced Live Status Bar (Sticky) */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm py-4 px-6" data-testid="header-status-bar">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" data-testid="indicator-live" />
                <span className="text-sm font-medium" data-testid="text-live">مباشر</span>
              </div>
              
              {lastUpdate && (
                <Badge variant="outline" className="text-xs" data-testid="badge-last-update">
                  <Clock className="h-3 w-3 ml-1" />
                  آخر تحديث: {lastUpdate}
                </Badge>
              )}

              <Badge variant="secondary" className="text-xs" data-testid="badge-items-count">
                {filteredItems.length} تحديث
              </Badge>
            </div>

            {/* Manual Refresh Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Button 
                variant={filter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("all")}
                data-testid="button-filter-all"
              >
                كل التحديثات
              </Button>
              <Button 
                variant={filter === "breaking" ? "destructive" : "outline"} 
                size="sm"
                onClick={() => setFilter("breaking")}
                data-testid="button-filter-breaking"
              >
                <Zap className="h-3 w-3 ml-1" />
                عاجل فقط
              </Button>
            </div>

            {/* Time Range Filter */}
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]" data-testid="select-time-range">
                <Clock className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h" data-testid="option-1h">آخر ساعة</SelectItem>
                <SelectItem value="3h" data-testid="option-3h">آخر 3 ساعات</SelectItem>
                <SelectItem value="today" data-testid="option-today">اليوم</SelectItem>
                <SelectItem value="yesterday" data-testid="option-yesterday">الأمس</SelectItem>
                <SelectItem value="7d" data-testid="option-7d">آخر 7 أيام</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-category">
                <FolderOpen className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-all-categories">كل التصنيفات</SelectItem>
                {activeCategories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id}
                    data-testid={`option-category-${category.id}`}
                  >
                    {category.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Live Feed (Main Content - Enhanced Cards) */}
      <main className="container max-w-4xl px-6 py-6" data-testid="main-content">
        {isLoading && <CompactSkeleton count={10} />}

        {!isLoading && filteredItems.length === 0 && <EmptyState />}

        {!isLoading && filteredItems.length > 0 && (
          <div className="space-y-4" data-testid="list-news">
            {filteredItems.map((item) => (
              <CompactNewsCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-6 text-center" data-testid="div-load-more">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" data-testid="loader-fetching" />
          )}
          {!hasNextPage && filteredItems.length > 0 && (
            <p className="text-sm text-muted-foreground" data-testid="text-no-more">
              لا توجد تحديثات أقدم
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
