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
  Waves,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Activity,
  BarChart3,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-0 z-10 bg-gradient-to-l from-background via-primary/5 to-background backdrop-blur-sm border-b border-primary/10 py-4 px-6 mb-4"
      data-testid={`header-${label}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
        <h2 className="text-xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
          {label}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
      </div>
    </motion.div>
  );
}

function TimelineItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || Newspaper;
  const typeLabel = activityLabels[activity.type] || activity.type;
  const isUrgent = activity.importance === "urgent";
  const isHighPriority = activity.importance === "high";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative pr-10 group"
      data-testid={`timeline-item-${activity.id}`}
    >
      {/* Enhanced Timeline line with gradient */}
      {!isLast && (
        <div className="absolute right-[19px] top-16 h-full w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
      )}

      {/* Enhanced Timeline dot with pulse animation */}
      <motion.div
        className={cn(
          "absolute right-4 top-7 h-5 w-5 rounded-full border-2 border-background shadow-lg",
          isUrgent && "bg-gradient-to-br from-red-500 to-red-600",
          isHighPriority && !isUrgent && "bg-gradient-to-br from-orange-500 to-orange-600",
          !isUrgent && !isHighPriority && "bg-gradient-to-br from-primary to-primary/60"
        )}
        animate={isUrgent ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {isUrgent && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{
              scale: [1, 2, 2],
              opacity: [0.5, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </motion.div>

      <Card className="hover-elevate mb-6 overflow-hidden border-l-4 border-l-transparent hover:border-l-primary/50 transition-all duration-300" data-testid={`card-activity-${activity.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Enhanced Icon with glow effect */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-xl shrink-0 shadow-lg",
                isUrgent && "bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-600",
                isHighPriority && !isUrgent && "bg-gradient-to-br from-orange-500/20 to-orange-500/10 text-orange-600",
                !isUrgent && !isHighPriority && "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
              )}
            >
              {isUrgent && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-red-500/20"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              <IconComponent className="h-6 w-6 relative z-10" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant={isUrgent ? "destructive" : "secondary"}
                    className={cn(
                      "font-semibold",
                      !isUrgent && "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/20"
                    )}
                    data-testid={`badge-type-${activity.id}`}
                  >
                    {typeLabel}
                  </Badge>
                  {isUrgent && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Badge variant="destructive" className="text-xs gap-1" data-testid={`badge-urgent-${activity.id}`}>
                        <Zap className="h-3 w-3" />
                        عاجل
                      </Badge>
                    </motion.div>
                  )}
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap bg-muted/50 px-3 py-1.5 rounded-full" data-testid={`text-time-${activity.id}`}>
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
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mb-3 p-2 bg-muted/30 rounded-lg w-fit"
                >
                  <Avatar className="h-7 w-7 border-2 border-primary/20">
                    <AvatarImage src={activity.actor.avatarUrl} alt={activity.actor.name} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold">
                      {activity.actor.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium" data-testid={`text-actor-${activity.id}`}>
                    {activity.actor.name}
                  </span>
                </motion.div>
              )}

              {/* Enhanced Summary with gradient background */}
              <div className="mb-4 p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border/50">
                <p className="text-sm leading-relaxed" data-testid={`text-summary-${activity.id}`}>
                  {activity.summary}
                </p>
              </div>

              {/* Target Title (if available) */}
              {activity.target?.title && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4 p-3 bg-gradient-to-l from-primary/5 to-transparent rounded-lg border-r-2 border-primary/30"
                >
                  <p className="text-sm font-medium text-muted-foreground flex items-start gap-2">
                    <Newspaper className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span className="line-clamp-2">{activity.target.title}</span>
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                {activity.target?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="hover-elevate gap-2"
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
                    <Button variant="ghost" size="sm" className="hover-elevate" data-testid={`button-more-${activity.id}`}>
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
    </motion.div>
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
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
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
    <div className="sticky top-0 z-20 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-primary/10 py-5 px-6 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Enhanced Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            type="text"
            placeholder="ابحث في الأنشطة..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="pr-10 border-primary/20 focus:border-primary/50 bg-gradient-to-l from-primary/5 to-transparent"
            data-testid="input-search"
          />
        </div>

        {/* Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="hover-elevate gap-2" data-testid="button-filter-types">
              <Activity className="h-4 w-4" />
              نوع النشاط
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="mr-2 bg-primary text-primary-foreground">
                  {selectedTypes.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                اختر نوع النشاط
              </h4>
              {activityTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover-elevate active-elevate-2 border border-transparent hover:border-primary/20"
                  data-testid={`checkbox-type-${type.value}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeToggle(type.value)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="hover-elevate gap-2" data-testid="button-filter-date">
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
                  className="w-full mt-2 hover-elevate"
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
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Badge variant="outline" className="gap-2 border-green-500/30 bg-green-500/10 text-green-600" data-testid="button-live-updates">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-green-500"
            />
            تحديثات مباشرة
          </Badge>
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4"
      data-testid="empty-state"
    >
      <div className="text-center max-w-md">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
            <Waves className="h-12 w-12 text-primary" />
          </div>
        </motion.div>
        <h3 className="text-3xl font-bold mb-3 bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent" data-testid="text-empty-title">
          لا جديد حتى الآن
        </h3>
        <p className="text-muted-foreground text-lg" data-testid="text-empty-description">
          تابعنا؛ التحديثات تصل لحظياً ✨
        </p>
      </div>
    </motion.div>
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
      {/* Enhanced Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-primary/10 overflow-hidden"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--primary) / 0.1) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
          <div className="flex items-start gap-6">
            {/* Animated Icon */}
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl shadow-lg"
            >
              <Radio className="h-10 w-10 text-primary" />
            </motion.div>

            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2"
                data-testid="text-page-title"
              >
                لحظة بلحظة
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg flex items-center gap-2"
                data-testid="text-page-subtitle"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                تابع كل جديد بالموقع في الوقت الفعلي مع تحليلات ذكية مدعومة بالذكاء الاصطناعي
              </motion.p>
            </div>

            {/* Live Stats Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden md:block"
            >
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">الحالة</p>
                      <p className="text-sm font-bold text-green-600">مباشر الآن</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-b from-background via-muted/10 to-background">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
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
