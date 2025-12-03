import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, Tag, MessageSquare, Flame, Zap, Sparkles, Eye, BarChart3,
  Bell, BellOff, Filter, SortDesc, Newspaper, FileText,
  PenTool, Hash
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails } from "@shared/schema";
import { Header } from "@/components/Header";
import { OptimizedImage } from "@/components/OptimizedImage";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

type SortOption = 'newest' | 'oldest' | 'views' | 'comments';
type FilterOption = 'all' | 'news' | 'opinion' | 'analysis' | 'infographic';

export default function KeywordPage() {
  const params = useParams();
  const keyword = decodeURIComponent(params.keyword || "");
  const { toast } = useToast();
  
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: articles, isLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/keyword", keyword],
    queryFn: async () => {
      const res = await fetch(`/api/keyword/${encodeURIComponent(keyword)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });

  const { data: followedKeywords } = useQuery<any[]>({
    queryKey: ["/api/keywords/followed"],
    enabled: !!user,
  });

  const isFollowing = useMemo(() => {
    if (!followedKeywords) return false;
    return followedKeywords.some(f => 
      f.tag?.nameAr?.toLowerCase() === keyword.toLowerCase() ||
      f.tag?.slug === keyword.toLowerCase().replace(/\s+/g, '-')
    );
  }, [followedKeywords, keyword]);

  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/keywords/follow", {
        method: "POST",
        body: JSON.stringify({ keyword }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/followed"] });
      toast({ title: "تمت المتابعة", description: `أنت الآن تتابع "${keyword}"` });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const followed = followedKeywords?.find(f => 
        f.tag?.nameAr?.toLowerCase() === keyword.toLowerCase()
      );
      if (followed?.tagId) {
        return apiRequest(`/api/keywords/unfollow/${followed.tagId}`, {
          method: "DELETE",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/followed"] });
      toast({ title: "تم إلغاء المتابعة" });
    },
  });

  const stats = useMemo(() => {
    if (!articles) return { total: 0, views: 0, latest: null, breaking: 0 };
    return {
      total: articles.length,
      views: articles.reduce((sum, a) => sum + (a.views || 0), 0),
      latest: articles.length > 0 ? articles[0].publishedAt : null,
      breaking: articles.filter(a => a.newsType === 'breaking').length,
    };
  }, [articles]);

  const filteredAndSortedArticles = useMemo(() => {
    if (!articles) return [];
    
    let result = [...articles];
    
    if (filterBy !== 'all') {
      result = result.filter(a => a.articleType === filterBy);
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'comments':
          return (b.commentsCount || 0) - (a.commentsCount || 0);
        case 'newest':
        default:
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      }
    });
    
    return result;
  }, [articles, sortBy, filterBy]);

  const articleTypeCounts = useMemo(() => {
    if (!articles) return {};
    return articles.reduce((acc, a) => {
      const type = a.articleType || 'news';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [articles]);

  const filterLabels: Record<FilterOption, { label: string; icon: typeof Newspaper }> = {
    all: { label: 'الكل', icon: Filter },
    news: { label: 'أخبار', icon: Newspaper },
    opinion: { label: 'رأي', icon: PenTool },
    analysis: { label: 'تحليل', icon: FileText },
    infographic: { label: 'إنفوجرافيك', icon: BarChart3 },
  };

  const sortLabels: Record<SortOption, string> = {
    newest: 'الأحدث',
    oldest: 'الأقدم',
    views: 'الأكثر مشاهدة',
    comments: 'الأكثر تعليقاً',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header user={user} />

      <main className="flex-1">
        {/* Hero Section - Mobile Optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-32 md:w-64 h-32 md:h-64 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="container mx-auto px-4 py-6 md:py-12 lg:py-16 relative">
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Keyword Header with Follow Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20 flex-shrink-0">
                    <Hash className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">كلمة مفتاحية</p>
                    <h1 className="text-xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent truncate" data-testid="text-keyword-title">
                      {keyword}
                    </h1>
                  </div>
                </div>
                
                {/* Follow Button - Compact on Mobile */}
                {user && (
                  <Button
                    size="default"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className="gap-1.5 md:gap-2 flex-shrink-0 text-sm md:text-base"
                    data-testid="button-follow-keyword"
                  >
                    {isFollowing ? (
                      <>
                        <BellOff className="h-4 w-4" />
                        <span className="hidden sm:inline">إلغاء المتابعة</span>
                        <span className="sm:hidden">إلغاء</span>
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        <span>متابعة</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Stats - Horizontal Scroll on Mobile */}
              {!isLoading && (
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide snap-x snap-mandatory">
                  <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full md:rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 flex-shrink-0 snap-start">
                    <Newspaper className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    <span className="text-sm md:text-lg font-bold">{stats.total}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">مقال</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full md:rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 flex-shrink-0 snap-start">
                    <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
                    <span className="text-sm md:text-lg font-bold">{stats.views.toLocaleString('ar-SA')}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">مشاهدة</span>
                  </div>
                  {stats.breaking > 0 && (
                    <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full md:rounded-lg bg-destructive/10 backdrop-blur-sm border border-destructive/20 flex-shrink-0 snap-start">
                      <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                      <span className="text-sm md:text-lg font-bold text-destructive">{stats.breaking}</span>
                      <span className="text-xs md:text-sm text-destructive/80">عاجل</span>
                    </div>
                  )}
                  {stats.latest && (
                    <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full md:rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 flex-shrink-0 snap-start">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                      <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                        آخر تحديث: {formatDistanceToNow(new Date(stats.latest), { addSuffix: true, locale: arSA })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Sort Bar - Mobile Optimized */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 py-2.5 md:py-3">
            <div className="flex items-center justify-between gap-2 md:gap-3">
              {/* Filter Pills - Horizontal Scroll with Snap */}
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex items-center gap-1.5 md:gap-2 snap-x snap-mandatory">
                  {(Object.keys(filterLabels) as FilterOption[]).map((filter) => {
                    const { label, icon: Icon } = filterLabels[filter];
                    const count = filter === 'all' ? stats.total : (articleTypeCounts[filter] || 0);
                    if (filter !== 'all' && count === 0) return null;
                    
                    return (
                      <Button
                        key={filter}
                        size="sm"
                        variant={filterBy === filter ? "default" : "outline"}
                        onClick={() => setFilterBy(filter)}
                        className="gap-1 md:gap-1.5 whitespace-nowrap flex-shrink-0 snap-start h-8 md:h-9 px-2 md:px-3 text-[11px] md:text-sm min-w-[44px]"
                        data-testid={`button-filter-${filter}`}
                      >
                        <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        {label}
                        {count > 0 && (
                          <Badge variant="secondary" className="mr-0.5 md:mr-1 h-4 md:h-5 px-1 md:px-1.5 text-[10px] md:text-xs">
                            {count}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Dropdown - Compact on Mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 md:gap-2 flex-shrink-0 h-8 md:h-9 px-2.5 md:px-3" data-testid="button-sort">
                    <SortDesc className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline text-xs md:text-sm">{sortLabels[sortBy]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuLabel className="text-xs md:text-sm">ترتيب حسب</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
                    <DropdownMenuItem
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`text-xs md:text-sm ${sortBy === sort ? "bg-accent" : ""}`}
                      data-testid={`menu-sort-${sort}`}
                    >
                      {sortLabels[sort]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 md:py-8">
          {/* Loading State - Mobile Optimized */}
          {isLoading && (
            <div className="space-y-4 md:space-y-8">
              <Skeleton className="aspect-[16/9] md:aspect-[21/9] w-full rounded-xl md:rounded-2xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <CardContent className="p-3 md:p-4 space-y-2">
                      <Skeleton className="h-4 md:h-5 w-16 md:w-20" />
                      <Skeleton className="h-4 md:h-5 w-full" />
                      <Skeleton className="h-3 md:h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Articles Grid - Single Column on Mobile, Progressive on Larger Screens */}
          {!isLoading && filteredAndSortedArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
              {filteredAndSortedArticles.map((article, index) => {
                const timeAgo = article.publishedAt
                  ? formatDistanceToNow(new Date(article.publishedAt), {
                      addSuffix: true,
                      locale: arSA,
                    })
                  : null;
                
                const isInfographic = article.articleType === 'infographic';

                return (
                  <Link key={article.id} href={`/article/${article.slug}`}>
                    <Card 
                      className={`cursor-pointer h-full overflow-hidden hover-elevate group transition-all ${
                        article.newsType === "breaking" ? "ring-2 ring-destructive/50" : ""
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      data-testid={`card-article-${article.id}`}
                    >
                      {/* Image Container - Adjusted for Mobile */}
                      <div className={`relative overflow-hidden bg-muted ${
                        isInfographic ? 'aspect-[3/4]' : 'aspect-[16/9] sm:aspect-[16/10]'
                      }`}>
                        {article.imageUrl ? (
                          <OptimizedImage
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            preferSize={isInfographic ? "large" : "medium"}
                            priority={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5">
                            {isInfographic ? (
                              <BarChart3 className="h-12 w-12 md:h-16 md:w-16 text-primary/30" />
                            ) : (
                              <Newspaper className="h-10 w-10 md:h-12 md:w-12 text-primary/20" />
                            )}
                          </div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Top Badges - Smaller on Mobile */}
                        <div className="absolute top-2 md:top-3 right-2 md:right-3 flex flex-wrap gap-1.5 md:gap-2">
                          {article.newsType === "breaking" && (
                            <Badge 
                              variant="destructive" 
                              className="gap-0.5 md:gap-1 shadow-lg text-[10px] md:text-xs h-5 md:h-auto px-1.5 md:px-2" 
                              data-testid={`badge-breaking-${article.id}`}
                            >
                              <Zap className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              عاجل
                            </Badge>
                          )}
                          {isNewArticle(article.publishedAt) && article.newsType !== "breaking" && (
                            <Badge 
                              className="gap-0.5 md:gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg text-[10px] md:text-xs h-5 md:h-auto px-1.5 md:px-2" 
                              data-testid={`badge-new-${article.id}`}
                            >
                              <Flame className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              جديد
                            </Badge>
                          )}
                          {isInfographic && (
                            <Badge 
                              className="gap-0.5 md:gap-1 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg text-[10px] md:text-xs h-5 md:h-auto px-1.5 md:px-2"
                              data-testid={`badge-infographic-${article.id}`}
                            >
                              <BarChart3 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              إنفوجرافيك
                            </Badge>
                          )}
                        </div>
                        
                        {/* AI Badge */}
                        {article.aiSummary && (
                          <div className="absolute top-2 md:top-3 left-2 md:left-3">
                            <Badge className="bg-primary/90 text-primary-foreground shadow-lg text-[10px] md:text-xs h-5 md:h-auto px-1.5 md:px-2">
                              <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 ml-0.5 md:ml-1" />
                              AI
                            </Badge>
                          </div>
                        )}
                        
                        {/* Bottom Stats Overlay - Adjusted for Mobile */}
                        <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 left-2 md:left-3 flex items-center justify-between text-white/90 text-[10px] md:text-xs">
                          <div className="flex items-center gap-2 md:gap-3">
                            {(article.views || 0) > 0 && (
                              <span className="flex items-center gap-0.5 md:gap-1">
                                <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                {(article.views || 0).toLocaleString('ar-SA')}
                              </span>
                            )}
                            {(article.commentsCount ?? 0) > 0 && (
                              <span className="flex items-center gap-0.5 md:gap-1">
                                <MessageSquare className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                {article.commentsCount}
                              </span>
                            )}
                          </div>
                          {timeAgo && (
                            <span className="flex items-center gap-0.5 md:gap-1 bg-black/30 backdrop-blur-sm rounded-full px-1.5 md:px-2 py-0.5">
                              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span className="truncate max-w-[80px] md:max-w-none">{timeAgo}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Content - Mobile Optimized Spacing */}
                      <CardContent className="p-3 md:p-4 space-y-1.5 md:space-y-2">
                        {/* Category */}
                        {article.category && (
                          <Badge 
                            variant="secondary"
                            className="text-[10px] md:text-xs h-5 md:h-auto"
                            data-testid={`badge-category-${article.id}`}
                          >
                            {article.category.nameAr}
                          </Badge>
                        )}
                        
                        {/* Title - Larger and More Readable on Mobile */}
                        <h3 
                          className={`font-bold text-sm sm:text-base md:text-lg line-clamp-2 leading-snug md:leading-normal transition-colors ${
                            article.newsType === "breaking"
                              ? "text-destructive"
                              : "group-hover:text-primary"
                          }`}
                          data-testid={`text-article-title-${article.id}`}
                        >
                          {article.title}
                        </h3>
                        
                        {/* Excerpt - Hidden on very small screens, visible on larger */}
                        {!isInfographic && article.excerpt && (
                          <p className="hidden sm:block text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredAndSortedArticles.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Tag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3" data-testid="text-no-articles">
                {filterBy !== 'all' ? 'لا توجد نتائج' : 'لا توجد مقالات'}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {filterBy !== 'all' 
                  ? `لم نجد مقالات من نوع "${filterLabels[filterBy].label}" للكلمة المفتاحية "${keyword}"`
                  : `لم نجد أي مقالات تحتوي على الكلمة المفتاحية "${keyword}"`
                }
              </p>
              {filterBy !== 'all' && (
                <Button variant="outline" onClick={() => setFilterBy('all')}>
                  عرض جميع المقالات
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
