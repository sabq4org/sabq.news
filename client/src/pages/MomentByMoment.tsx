import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Radio,
  Zap,
  Eye,
  MessageSquare,
  Loader2,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

// Utility Functions
function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch {
    return "";
  }
}

// Components
function CompactNewsCard({ item }: { item: LiveUpdate }) {
  return (
    <Link href={`/article/${item.slug}`} data-testid={`link-article-${item.id}`}>
      <Card className="hover-elevate transition-all" data-testid={`card-news-${item.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Thumbnail (optional) */}
            {item.imageUrl && (
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-20 h-20 rounded-lg object-cover shrink-0"
                loading="lazy"
                data-testid={`img-thumbnail-${item.id}`}
              />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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

              <h3 className="font-bold text-base mb-1 line-clamp-2" data-testid={`text-title-${item.id}`}>
                {item.title}
              </h3>

              <p className="text-sm text-muted-foreground line-clamp-1" data-testid={`text-summary-${item.id}`}>
                {item.summary}
              </p>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1" data-testid={`text-views-${item.id}`}>
                  <Eye className="h-3 w-3" />
                  {item.viewsCount}
                </span>
                <span className="flex items-center gap-1" data-testid={`text-comments-${item.id}`}>
                  <MessageSquare className="h-3 w-3" />
                  {item.commentsCount}
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
    <div className="space-y-3" data-testid="skeleton-loading">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-24 mr-auto" />
                </div>
                <Skeleton className="h-5 w-full" />
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
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  const items = data?.pages.flatMap((page) => page.items) || [];

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
    <div className="min-h-screen bg-background" data-testid="page-moment-by-moment">
      {/* Page Header (Hero Section) */}
      <div className="bg-gradient-to-l from-destructive/10 to-primary/10 border-b" data-testid="header-hero">
        <div className="container max-w-6xl px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-destructive rounded-xl" data-testid="icon-live">
              <Radio className="h-8 w-8 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" data-testid="text-page-title">
                لحظة بلحظة
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                آخر الأخبار في الوقت الفعلي
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Status Bar (Sticky) */}
      <div className="sticky top-0 z-20 bg-background border-b py-3 px-6" data-testid="header-status-bar">
        <div className="container max-w-6xl flex items-center justify-between gap-4 flex-wrap">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" data-testid="indicator-live" />
            <span className="text-sm font-medium" data-testid="text-live">مباشر</span>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs" data-testid="badge-last-update">
                <Clock className="h-3 w-3 ml-1" />
                آخر تحديث: {lastUpdate}
              </Badge>
            )}
          </div>

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
        </div>
      </div>

      {/* Breaking Ticker (Horizontal Scrolling) */}
      <BreakingTicker items={breakingNews} />

      {/* Live Feed (Main Content - Compact Cards) */}
      <main className="container max-w-4xl px-6 py-6" data-testid="main-content">
        {isLoading && <CompactSkeleton count={10} />}

        {!isLoading && items.length === 0 && <EmptyState />}

        {!isLoading && items.length > 0 && (
          <div className="space-y-3" data-testid="list-news">
            {items.map((item) => (
              <CompactNewsCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-6 text-center" data-testid="div-load-more">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" data-testid="loader-fetching" />
          )}
          {!hasNextPage && items.length > 0 && (
            <p className="text-sm text-muted-foreground" data-testid="text-no-more">
              لا توجد تحديثات أقدم
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
