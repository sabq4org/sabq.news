import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Sparkles, AlertCircle, RefreshCw, Bot, Zap, BarChart3, FileText, Laptop, Mic } from "lucide-react";
import { Link, useSearch, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { motion } from "framer-motion";
import { ViewsCount } from "@/components/ViewsCount";

interface IFoxArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null; // Correct field name matching backend
  image?: string | null; // Legacy fallback (optional)
  publishedAt: Date | string | null;
  categoryId: string;
  views: number | null;
  commentsCount: number | null;
  reactionsCount: number | null;
  category: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string | null;
    color: string | null;
    icon: string | null;
  } | null;
}

// iFox category definitions
const IFOX_CATEGORIES = [
  { slug: 'ai-news', nameAr: 'آي سبق - أخبار AI', icon: Sparkles },
  { slug: 'ai-insights', nameAr: 'آي عمق - تحليلات', icon: BarChart3 },
  { slug: 'ai-opinions', nameAr: 'آي رأي - آراء', icon: FileText },
  { slug: 'ai-tools', nameAr: 'آي تطبيق - أدوات', icon: Laptop },
  { slug: 'ai-voice', nameAr: 'آي صوت - بودكاست', icon: Mic },
];

export default function IFoxArticles() {
  const [retryCount, setRetryCount] = useState(0);
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  
  // Read category from URL query params
  const categoryFromUrl = new URLSearchParams(searchParams).get('category') || 'all';
  const categoryFilter = categoryFromUrl;

  // Fetch current user
  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Build query params for API
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (categoryFilter && categoryFilter !== 'all') {
      params.append('categorySlug', categoryFilter);
    }
    return params.toString();
  };

  // Fetch iFox articles with category filter
  const { 
    data: articles = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<IFoxArticle[]>({
    queryKey: ['/api/ifox/articles', categoryFilter],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const url = `/api/ifox/articles${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch articles');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const handleRetry = () => {
    refetch();
  };

  // Handle category change
  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug === 'all') {
      setLocation('/ifox');
    } else {
      setLocation(`/ifox?category=${categorySlug}`);
    }
  };

  // Format excerpt to max 150 chars
  const formatExcerpt = (excerpt: string | null) => {
    if (!excerpt) return "";
    return excerpt.length > 150 ? excerpt.slice(0, 150) + "..." : excerpt;
  };

  // Format published date
  const formatPublishedDate = (publishedAt: Date | string | null) => {
    if (!publishedAt) return null;
    return formatDistanceToNow(new Date(publishedAt), {
      addSuffix: true,
      locale: arSA,
    });
  };

  // Get category color classes
  const getCategoryColorClass = (color: string | null) => {
    if (!color) return "bg-primary/20 text-primary border-primary/50";
    
    // Handle hex colors by converting to tailwind classes
    const colorMap: Record<string, string> = {
      "#3b82f6": "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50",
      "#8b5cf6": "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/50",
      "#10b981": "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50",
      "#f59e0b": "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50",
      "#ef4444": "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50",
      "#ec4899": "bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/50",
    };
    
    return colorMap[color] || "bg-primary/20 text-primary border-primary/50";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Bot className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
              data-testid="text-page-title"
            >
              iFox - مقالات الذكاء الاصطناعي
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-page-subtitle">
              مقالات مختارة ومُنشأة بواسطة الذكاء الاصطناعي لتقديم أفضل المحتوى التقني والإخباري
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>محتوى ذكي • تحديثات مستمرة • جودة عالية</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {/* All Categories Tab */}
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('all')}
              className="gap-2 whitespace-nowrap"
              data-testid="button-category-all"
            >
              <Bot className="h-4 w-4" />
              جميع الفئات
            </Button>

            {/* Individual Category Tabs */}
            {IFOX_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = categoryFilter === category.slug;
              return (
                <Button
                  key={category.slug}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(category.slug)}
                  className="gap-2 whitespace-nowrap"
                  data-testid={`button-category-${category.slug}`}
                >
                  <Icon className="h-4 w-4" />
                  {category.nameAr}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 md:py-12">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden" data-testid={`skeleton-card-${i}`}>
                <Skeleton className="h-44 sm:h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4" data-testid="error-state">
            <div className="rounded-full bg-destructive/10 p-6">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-center">حدث خطأ في تحميل المقالات</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error instanceof Error ? error.message : "فشل في جلب مقالات iFox. يرجى المحاولة مرة أخرى."}
            </p>
            <Button 
              onClick={handleRetry} 
              className="gap-2"
              data-testid="button-retry"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4" data-testid="empty-state">
            <div className="rounded-full bg-muted p-6">
              <Bot className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-center">لا توجد مقالات متاحة</h2>
            <p className="text-muted-foreground text-center max-w-md">
              لم يتم العثور على مقالات من iFox حالياً. تحقق لاحقاً للحصول على محتوى جديد.
            </p>
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && !isError && articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {articles.map((article, index) => {
              const timeAgo = formatPublishedDate(article.publishedAt);
              const categoryColorClass = getCategoryColorClass(article.category?.color || null);
              
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link href={`/article/${article.slug}`}>
                    <Card 
                      className="group hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden transition-all duration-300"
                      data-testid={`card-article-${article.id}`}
                    >
                      {/* Featured Image */}
                      {article.imageUrl && (
                        <div className="relative h-44 sm:h-48 overflow-hidden">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            data-testid={`img-article-${article.id}`}
                          />
                          
                          {/* AI Badge */}
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <Badge 
                              className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 gap-1.5 shadow-md text-xs"
                              data-testid={`badge-ai-${article.id}`}
                            >
                              <Sparkles className="h-3 w-3" />
                              محتوى بالذكاء الاصطناعي
                            </Badge>
                          </div>

                          {/* Category Badge */}
                          {article.category && (
                            <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                              <Badge 
                                className={`${categoryColorClass} border shadow-md text-xs gap-1`}
                                data-testid={`badge-category-${article.id}`}
                              >
                                {article.category.icon && <span>{article.category.icon}</span>}
                                {article.category.nameAr}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Content */}
                      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Title */}
                        <h3 
                          className="text-base sm:text-lg font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors"
                          data-testid={`text-title-${article.id}`}
                        >
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        {article.excerpt && (
                          <p 
                            className="text-sm text-muted-foreground line-clamp-2"
                            data-testid={`text-excerpt-${article.id}`}
                          >
                            {formatExcerpt(article.excerpt)}
                          </p>
                        )}

                        {/* Meta Information */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                          {timeAgo && (
                            <span className="flex items-center gap-1" data-testid={`text-date-${article.id}`}>
                              <Clock className="h-3 w-3" />
                              {timeAgo}
                            </span>
                          )}
                          {article.views !== null && (
                            <ViewsCount 
                              views={article.views}
                              iconClassName="h-3 w-3"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Articles Count */}
        {!isLoading && !isError && articles.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p data-testid="text-articles-count">
              عرض {articles.length} مقالة من مقالات iFox
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
