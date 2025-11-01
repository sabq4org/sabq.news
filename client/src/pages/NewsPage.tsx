import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsAnalyticsHero } from "@/components/NewsAnalyticsHero";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { SmartFilterBar } from "@/components/SmartFilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Link } from "wouter";
import type { ArticleWithDetails, Category } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const ARTICLES_PER_PAGE = 20;

type TimeRange = 'today' | 'week' | 'month' | 'all';
type Mood = 'all' | 'trending' | 'calm' | 'hot';

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [mood, setMood] = useState<Mood>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/news/analytics"],
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles"],
  });

  // Filter articles based on selected filters
  const filteredArticles = articles.filter((article) => {
    // Exclude opinion articles
    if (article.articleType === 'opinion') return false;

    // Filter by time range
    if (timeRange !== 'all' && article.publishedAt) {
      const now = new Date();
      const publishedDate = new Date(article.publishedAt);
      const daysDiff = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (timeRange) {
        case 'today':
          if (daysDiff > 0) return false;
          break;
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
      }
    }

    // Filter by mood (simplified - can be enhanced with AI)
    if (mood !== 'all') {
      switch (mood) {
        case 'trending':
          if ((article.views || 0) < 100) return false;
          break;
        case 'hot':
          if (!article.isFeatured) return false;
          break;
        case 'calm':
          if (article.isFeatured) return false;
          break;
      }
    }

    // Filter by category
    if (selectedCategory !== 'all' && article.categoryId !== selectedCategory) {
      return false;
    }

    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop();
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header user={user} />

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" data-testid="heading-news">
            <span className="bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
              الأخبار الذكية
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            اكتشف آخر الأخبار مع تحليلات وإحصائيات ذكية مدعومة بالذكاء الاصطناعي
          </p>
        </div>

        {/* Analytics Hero Section */}
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics ? (
          <NewsAnalyticsHero analytics={analytics} />
        ) : null}

        {/* AI Insights Panel */}
        {analytics?.aiInsights && (
          <AIInsightsPanel insights={analytics.aiInsights} />
        )}

        {/* Smart Filter Bar */}
        <SmartFilterBar
          onTimeRangeChange={(range) => {
            setTimeRange(range);
            handleFilterChange();
          }}
          onMoodChange={(newMood) => {
            setMood(newMood);
            handleFilterChange();
          }}
          onCategoryChange={(categoryId) => {
            setSelectedCategory(categoryId);
            handleFilterChange();
          }}
          categories={categories.map(c => ({ id: c.id, nameAr: c.nameAr, icon: c.icon || undefined }))}
        />

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {currentArticles.length} من {filteredArticles.length} خبر
          </p>
          {(timeRange !== 'all' || mood !== 'all' || selectedCategory !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTimeRange('all');
                setMood('all');
                setSelectedCategory('all');
                handleFilterChange();
              }}
              data-testid="button-clear-filters"
            >
              مسح الفلاتر
            </Button>
          )}
        </div>

        {/* Articles Grid */}
        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-2">
              لا توجد أخبار تطابق الفلاتر المحددة
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setTimeRange('all');
                setMood('all');
                setSelectedCategory('all');
                handleFilterChange();
              }}
            >
              عرض جميع الأخبار
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentArticles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card 
                    className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden group"
                    data-testid={`card-article-${article.id}`}
                  >
                    {article.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {article.category && (
                          <Badge 
                            variant="default" 
                            className="absolute top-3 right-3 shadow-md" 
                            data-testid={`badge-category-${article.id}`}
                          >
                            {article.category.icon} {article.category.nameAr}
                          </Badge>
                        )}
                        {article.aiSummary && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                              <Sparkles className="h-3 w-3 ml-1" />
                              AI
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CardContent className="p-4 space-y-3">
                      <h3 
                        className="font-bold text-lg line-clamp-2 text-foreground"
                        data-testid={`text-article-title-${article.id}`}
                      >
                        {article.title}
                      </h3>
                      
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        {article.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(article.publishedAt), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          </div>
                        )}
                        
                        <ViewsCount 
                          views={article.views || 0}
                          iconClassName="h-3 w-3"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2" dir="ltr">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                  aria-label="الصفحة السابقة"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(page as number)}
                      data-testid={`button-page-${page}`}
                      className="min-w-9"
                    >
                      {page}
                    </Button>
                  )
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                  aria-label="الصفحة التالية"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
