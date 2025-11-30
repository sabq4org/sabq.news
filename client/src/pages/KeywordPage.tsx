import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, Tag, MessageSquare, Flame, Zap, Sparkles, Eye, BarChart3,
  TrendingUp, Bell, BellOff, Filter, SortDesc, Newspaper, FileText,
  PenTool, Calendar, ChevronLeft, Hash, Users, Activity, ArrowUpRight
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
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

  const featuredArticle = filteredAndSortedArticles[0];
  const gridArticles = filteredAndSortedArticles.slice(1);

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
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Keyword Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20">
                    <Hash className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">كلمة مفتاحية</p>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent" data-testid="text-keyword-title">
                      {keyword}
                    </h1>
                  </div>
                </div>
                
                {/* Stats Grid */}
                {!isLoading && (
                  <div className="flex flex-wrap gap-4 mt-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
                      <Newspaper className="h-4 w-4 text-primary" />
                      <span className="text-lg font-bold">{stats.total}</span>
                      <span className="text-sm text-muted-foreground">مقال</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-lg font-bold">{stats.views.toLocaleString('ar-SA')}</span>
                      <span className="text-sm text-muted-foreground">مشاهدة</span>
                    </div>
                    {stats.breaking > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 backdrop-blur-sm border border-destructive/20">
                        <Zap className="h-4 w-4 text-destructive" />
                        <span className="text-lg font-bold text-destructive">{stats.breaking}</span>
                        <span className="text-sm text-destructive/80">عاجل</span>
                      </div>
                    )}
                    {stats.latest && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          آخر تحديث: {formatDistanceToNow(new Date(stats.latest), { addSuffix: true, locale: arSA })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Follow Button */}
              {user && (
                <div className="flex-shrink-0">
                  <Button
                    size="lg"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className="gap-2 min-w-[140px]"
                    data-testid="button-follow-keyword"
                  >
                    {isFollowing ? (
                      <>
                        <BellOff className="h-4 w-4" />
                        إلغاء المتابعة
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        متابعة
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
                      className="gap-1.5 whitespace-nowrap"
                      data-testid={`button-filter-${filter}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                      {count > 0 && (
                        <Badge variant="secondary" className="mr-1 h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-sort">
                    <SortDesc className="h-4 w-4" />
                    {sortLabels[sortBy]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>ترتيب حسب</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
                    <DropdownMenuItem
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={sortBy === sort ? "bg-accent" : ""}
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

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-8">
              <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Featured Article */}
          {!isLoading && featuredArticle && (
            <div className="mb-8">
              <Link href={`/article/${featuredArticle.slug}`}>
                <Card 
                  className="overflow-hidden hover-elevate group cursor-pointer"
                  data-testid={`card-featured-${featuredArticle.id}`}
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[400px] overflow-hidden bg-muted">
                      {featuredArticle.imageUrl ? (
                        <OptimizedImage
                          src={featuredArticle.imageUrl}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          preferSize="large"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5">
                          <Newspaper className="h-20 w-20 text-primary/20" />
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-4 right-4 flex flex-wrap gap-2">
                        {featuredArticle.newsType === "breaking" && (
                          <Badge variant="destructive" className="gap-1 shadow-lg">
                            <Zap className="h-3 w-3" />
                            عاجل
                          </Badge>
                        )}
                        {isNewArticle(featuredArticle.publishedAt) && featuredArticle.newsType !== "breaking" && (
                          <Badge className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg">
                            <Flame className="h-3 w-3" />
                            جديد
                          </Badge>
                        )}
                        <Badge className="gap-1 bg-primary/90 text-primary-foreground shadow-lg">
                          <TrendingUp className="h-3 w-3" />
                          مميز
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      {featuredArticle.category && (
                        <Badge variant="outline" className="w-fit mb-4" data-testid={`badge-category-${featuredArticle.id}`}>
                          {featuredArticle.category.nameAr}
                        </Badge>
                      )}
                      
                      <h2 
                        className={`text-2xl md:text-3xl font-bold mb-4 leading-tight transition-colors ${
                          featuredArticle.newsType === "breaking"
                            ? "text-destructive"
                            : "group-hover:text-primary"
                        }`}
                        data-testid={`text-featured-title`}
                      >
                        {featuredArticle.title}
                      </h2>
                      
                      {featuredArticle.excerpt && (
                        <p className="text-muted-foreground text-lg mb-6 line-clamp-3">
                          {featuredArticle.excerpt}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {featuredArticle.publishedAt && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(featuredArticle.publishedAt), 'dd MMMM yyyy', { locale: arSA })}
                          </span>
                        )}
                        {(featuredArticle.views || 0) > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-4 w-4" />
                            {(featuredArticle.views || 0).toLocaleString('ar-SA')} مشاهدة
                          </span>
                        )}
                        {(featuredArticle.commentsCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            {featuredArticle.commentsCount} تعليق
                          </span>
                        )}
                      </div>

                      <Button variant="outline" className="w-fit mt-6 gap-2 group/btn">
                        اقرأ المزيد
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          )}

          {/* Articles Grid */}
          {!isLoading && gridArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {gridArticles.map((article, index) => {
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
                      {/* Image Container */}
                      <div className={`relative overflow-hidden bg-muted ${
                        isInfographic ? 'aspect-[3/4]' : 'aspect-[16/10]'
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
                              <BarChart3 className="h-16 w-16 text-primary/30" />
                            ) : (
                              <Newspaper className="h-12 w-12 text-primary/20" />
                            )}
                          </div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Top Badges */}
                        <div className="absolute top-3 right-3 flex flex-wrap gap-2">
                          {article.newsType === "breaking" && (
                            <Badge 
                              variant="destructive" 
                              className="gap-1 shadow-lg" 
                              data-testid={`badge-breaking-${article.id}`}
                            >
                              <Zap className="h-3 w-3" />
                              عاجل
                            </Badge>
                          )}
                          {isNewArticle(article.publishedAt) && article.newsType !== "breaking" && (
                            <Badge 
                              className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg" 
                              data-testid={`badge-new-${article.id}`}
                            >
                              <Flame className="h-3 w-3" />
                              جديد
                            </Badge>
                          )}
                          {isInfographic && (
                            <Badge 
                              className="gap-1 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg"
                              data-testid={`badge-infographic-${article.id}`}
                            >
                              <BarChart3 className="h-3 w-3" />
                              إنفوجرافيك
                            </Badge>
                          )}
                        </div>
                        
                        {/* AI Badge */}
                        {article.aiSummary && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-primary/90 text-primary-foreground shadow-lg">
                              <Sparkles className="h-3 w-3 ml-1" />
                              AI
                            </Badge>
                          </div>
                        )}
                        
                        {/* Bottom Stats Overlay */}
                        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white/90 text-xs">
                          <div className="flex items-center gap-3">
                            {(article.views || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {(article.views || 0).toLocaleString('ar-SA')}
                              </span>
                            )}
                            {(article.commentsCount ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {article.commentsCount}
                              </span>
                            )}
                          </div>
                          {timeAgo && (
                            <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                              <Clock className="h-3 w-3" />
                              {timeAgo}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <CardContent className="p-4 space-y-2">
                        {/* Category */}
                        {article.category && (
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                            data-testid={`badge-category-${article.id}`}
                          >
                            {article.category.nameAr}
                          </Badge>
                        )}
                        
                        {/* Title */}
                        <h3 
                          className={`font-bold text-base line-clamp-2 leading-snug transition-colors ${
                            article.newsType === "breaking"
                              ? "text-destructive"
                              : "group-hover:text-primary"
                          }`}
                          data-testid={`text-article-title-${article.id}`}
                        >
                          {article.title}
                        </h3>
                        
                        {/* Excerpt - Only for non-infographics */}
                        {!isInfographic && article.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
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
