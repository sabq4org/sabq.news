import { useEffect, useRef, useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth, parseISO, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Newspaper,
  Edit3,
  AlertTriangle,
  MessageSquare,
  Heart,
  Bookmark,
  FolderPlus,
  Tag,
  UserPlus,
  ShieldCheck,
  Eye,
  MoreVertical,
  Search,
  Calendar as CalendarIcon,
  Radio,
  X,
  Clock,
  Zap,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { MomentAIInsights } from "@/components/MomentAIInsights";

// Types
interface Activity {
  id: string;
  type: string;
  occurredAt: string;
  actor?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  target?: {
    id: string;
    kind: string;
    title: string;
    slug?: string;
    url?: string;
    imageUrl?: string;
  };
  importance: string;
  summary: string;
}

interface ActivitiesResponse {
  items: Activity[];
  nextCursor: string | null;
}

interface ActivityGroup {
  label: string;
  items: Activity[];
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Constants
const activityIcons = {
  article_published: Newspaper,
  article_updated: Edit3,
  breaking_news: AlertTriangle,
  comment_added: MessageSquare,
  reaction_added: Heart,
  bookmark_added: Bookmark,
  category_created: FolderPlus,
  tag_created: Tag,
  user_registered: UserPlus,
  role_changed: ShieldCheck,
};

const activityLabels: Record<string, string> = {
  article_published: "نشر خبر",
  article_updated: "تحديث خبر",
  breaking_news: "خبر عاجل",
  comment_added: "إضافة تعليق",
  reaction_added: "تفاعل",
  bookmark_added: "إشارة مرجعية",
  category_created: "إضافة تصنيف",
  tag_created: "إضافة وسم",
  user_registered: "مستخدم جديد",
  role_changed: "تغيير صلاحية",
};

const activityTypes = [
  { value: "article_published", label: "نشر خبر" },
  { value: "article_updated", label: "تحديث خبر" },
  { value: "breaking_news", label: "خبر عاجل" },
  { value: "comment_added", label: "إضافة تعليق" },
  { value: "reaction_added", label: "تفاعل" },
  { value: "bookmark_added", label: "إشارة مرجعية" },
  { value: "category_created", label: "إضافة تصنيف" },
  { value: "tag_created", label: "إضافة وسم" },
  { value: "user_registered", label: "مستخدم جديد" },
  { value: "role_changed", label: "تغيير صلاحية" },
];

// Utility Functions
function groupActivitiesByDate(activities: Activity[]): ActivityGroup[] {
  const now = new Date();
  const groups: ActivityGroup[] = [];

  const todayItems: Activity[] = [];
  const yesterdayItems: Activity[] = [];
  const thisWeekItems: Activity[] = [];
  const thisMonthItems: Activity[] = [];
  const olderItems: Activity[] = [];

  activities.forEach((activity) => {
    const activityDate = parseISO(activity.occurredAt);

    if (isToday(activityDate)) {
      todayItems.push(activity);
    } else if (isYesterday(activityDate)) {
      yesterdayItems.push(activity);
    } else if (isThisWeek(activityDate, { locale: ar })) {
      thisWeekItems.push(activity);
    } else if (isThisMonth(activityDate)) {
      thisMonthItems.push(activity);
    } else {
      olderItems.push(activity);
    }
  });

  if (todayItems.length > 0) groups.push({ label: "اليوم", items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: "أمس", items: yesterdayItems });
  if (thisWeekItems.length > 0) groups.push({ label: "آخر 7 أيام", items: thisWeekItems });
  if (thisMonthItems.length > 0) groups.push({ label: "الشهر الحالي", items: thisMonthItems });
  if (olderItems.length > 0) groups.push({ label: "أقدم", items: olderItems });

  return groups;
}

function getRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  return formatDistanceToNow(date, { addSuffix: true, locale: ar });
}

function getAbsoluteTime(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, "EEEE، d MMMM yyyy - HH:mm", { locale: ar });
}

// Components
function DateGroupHeader({ label }: { label: string }) {
  return (
    <div
      className="sticky top-0 z-10 bg-background border-b py-3 px-6 mb-4"
      data-testid={`header-${label}`}
    >
      <h2 className="text-lg font-bold text-foreground">
        {label}
      </h2>
    </div>
  );
}

function TimelineItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || Newspaper;
  const typeLabel = activityLabels[activity.type] || activity.type;
  const isUrgent = activity.importance === "urgent";
  const isHighPriority = activity.importance === "high";

  return (
    <div
      className="relative pr-10 group"
      data-testid={`timeline-item-${activity.id}`}
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute right-[19px] top-16 h-full w-0.5 bg-border" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          "absolute right-4 top-7 h-5 w-5 rounded-full border-2 border-background",
          isUrgent && "bg-destructive",
          isHighPriority && !isUrgent && "bg-orange-500",
          !isUrgent && !isHighPriority && "bg-primary"
        )}
      />

      <Card className="hover-elevate mb-6" data-testid={`card-activity-${activity.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg shrink-0",
                isUrgent && "bg-destructive/10 text-destructive",
                isHighPriority && !isUrgent && "bg-orange-500/10 text-orange-600",
                !isUrgent && !isHighPriority && "bg-primary/10 text-primary"
              )}
            >
              <IconComponent className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant={isUrgent ? "destructive" : "secondary"}
                    data-testid={`badge-type-${activity.id}`}
                  >
                    {typeLabel}
                  </Badge>
                  {isUrgent && (
                    <Badge variant="destructive" className="text-xs gap-1" data-testid={`badge-urgent-${activity.id}`}>
                      <Zap className="h-3 w-3" />
                      عاجل
                    </Badge>
                  )}
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-time-${activity.id}`}>
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(activity.occurredAt)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getAbsoluteTime(activity.occurredAt)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Actor */}
              {activity.actor && (
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={activity.actor.avatarUrl} alt={activity.actor.name} />
                    <AvatarFallback className="text-xs">
                      {activity.actor.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium" data-testid={`text-actor-${activity.id}`}>
                    {activity.actor.name}
                  </span>
                </div>
              )}

              {/* Summary */}
              <div className="mb-3">
                <p className="text-sm leading-relaxed" data-testid={`text-summary-${activity.id}`}>
                  {activity.summary}
                </p>
              </div>

              {/* Target Title */}
              {activity.target?.title && (
                <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground flex items-start gap-2">
                    <Newspaper className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{activity.target.title}</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                {activity.target?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-2"
                    data-testid={`button-view-${activity.id}`}
                  >
                    <a href={activity.target.url}>
                      <Eye className="h-4 w-4" />
                      عرض التفاصيل
                    </a>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid={`button-more-${activity.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`menu-share-${activity.id}`}>
                      مشاركة
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid={`menu-hide-${activity.id}`}>
                      إخفاء
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="relative pr-10">
          {i < 4 && <div className="absolute right-[19px] top-16 h-full w-0.5 bg-border" />}
          <div className="absolute right-4 top-7 h-5 w-5 rounded-full bg-muted" />
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

function FiltersBar({
  selectedTypes,
  onTypesChange,
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchChange,
}: {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [debouncedSearch, onSearchChange]);

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const clearDateRange = () => {
    onDateRangeChange({ from: undefined, to: undefined });
  };

  return (
    <div className="sticky top-0 z-20 bg-background border-b py-4 px-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث في الأنشطة..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="pr-10"
            data-testid="input-search"
          />
        </div>

        {/* Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-filter-types">
              <Activity className="h-4 w-4" />
              نوع النشاط
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {selectedTypes.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-3">اختر نوع النشاط</h4>
              {activityTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover-elevate"
                  data-testid={`checkbox-type-${type.value}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeToggle(type.value)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-filter-date">
              <CalendarIcon className="h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ar })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ar })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ar })
                )
              ) : (
                "المدى الزمني"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) =>
                  onDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  })
                }
                locale={ar}
                numberOfMonths={2}
              />
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="w-full mt-2"
                  data-testid="button-clear-date"
                >
                  <X className="h-4 w-4 ml-2" />
                  مسح التاريخ
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Live Updates Indicator */}
        <Badge variant="outline" className="gap-2 border-green-500/50 text-green-600" data-testid="button-live-updates">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          مباشر
        </Badge>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-4"
      data-testid="empty-state"
    >
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
            <Radio className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2" data-testid="text-empty-title">
          لا توجد أنشطة حالياً
        </h3>
        <p className="text-muted-foreground" data-testid="text-empty-description">
          تابعنا للحصول على آخر التحديثات
        </p>
      </div>
    </div>
  );
}

// Main Component
export default function MomentByMoment() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const types = searchParams.get("types");
    return types ? types.split(",") : [];
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    return {
      from: from ? parseISO(from) : undefined,
      to: to ? parseISO(to) : undefined,
    };
  });

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTypes.length > 0) params.set("types", selectedTypes.join(","));
    if (dateRange.from) params.set("from", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) params.set("to", format(dateRange.to, "yyyy-MM-dd"));
    if (searchQuery) params.set("q", searchQuery);

    const newSearch = params.toString();
    const currentPath = location.split("?")[0];
    setLocation(newSearch ? `${currentPath}?${newSearch}` : currentPath, { replace: true });
  }, [selectedTypes, dateRange, searchQuery, location, setLocation]);

  // Build API query params
  const apiParams = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedTypes.length > 0) params.set("type", selectedTypes.join(","));
    if (dateRange.from) params.set("from", startOfDay(dateRange.from).toISOString());
    if (dateRange.to) params.set("to", endOfDay(dateRange.to).toISOString());
    return params.toString();
  }, [selectedTypes, dateRange]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ActivitiesResponse>({
    queryKey: ["/api/activities", apiParams],
    queryFn: async ({ pageParam }) => {
      const url = `/api/activities?${apiParams}${pageParam ? `&cursor=${pageParam}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  // Flatten and filter activities
  const allActivities = useMemo(() => {
    const items = data?.pages.flatMap((page) => page.items) || [];
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (activity) =>
        activity.summary.toLowerCase().includes(query) ||
        activity.target?.title.toLowerCase().includes(query) ||
        activity.actor?.name.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const groupedActivities = useMemo(
    () => groupActivitiesByDate(allActivities),
    [allActivities]
  );

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Page Header */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Radio className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-1" data-testid="text-page-title">
                لحظة بلحظة
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                تابع آخر الأنشطة والتحديثات في الوقت الفعلي
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-background">
        <div className="container mx-auto px-6 py-6 max-w-6xl">
          <MomentAIInsights />
        </div>
      </div>

      {/* Filters Bar */}
      <FiltersBar
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {isLoading && <TimelineSkeleton />}

        {isError && (
          <div className="text-center py-16" data-testid="error-state">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-destructive font-semibold text-lg">حدث خطأ أثناء تحميل الأنشطة</p>
            <p className="text-muted-foreground mt-2">يرجى المحاولة مرة أخرى</p>
          </div>
        )}

        {!isLoading && !isError && groupedActivities.length === 0 && <EmptyState />}

        {!isLoading && !isError && groupedActivities.length > 0 && (
          <AnimatePresence mode="wait">
            {groupedActivities.map((group, groupIndex) => (
              <div key={group.label}>
                <DateGroupHeader label={group.label} />
                <div className="space-y-0">
                  {group.items.map((activity, itemIndex) => {
                    const isLastInGroup = itemIndex === group.items.length - 1;
                    const isLastGroup = groupIndex === groupedActivities.length - 1;
                    const isLast = isLastInGroup && isLastGroup && !hasNextPage;
                    return (
                      <TimelineItem
                        key={activity.id}
                        activity={activity}
                        isLast={isLast}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </AnimatePresence>
        )}

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="py-6">
          {isFetchingNextPage && <TimelineSkeleton />}
        </div>
      </main>
    </div>
  );
}
