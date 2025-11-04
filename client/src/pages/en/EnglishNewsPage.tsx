import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { EnglishNewsAnalyticsHero } from "@/components/en/EnglishNewsAnalyticsHero";
import { EnglishAIInsightsPanel } from "@/components/en/EnglishAIInsightsPanel";
import { EnglishSmartFilterBar } from "@/components/en/EnglishSmartFilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Clock, Eye } from "lucide-react";
import { Link } from "wouter";
import type { EnArticle, EnCategory } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const ARTICLES_PER_PAGE = 20;

type TimeRange = 'today' | 'week' | 'month' | 'all';
type Mood = 'all' | 'trending' | 'calm' | 'hot';

export default function EnglishNewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [mood, setMood] = useState<Mood>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: user } = useQuery<{ id: string; firstName?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/en/news/analytics"],
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery<EnCategory[]>({
    queryKey: ["/api/en/categories"],
  });

  // Fetch articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery<EnArticle[]>({
    queryKey: ["/api/en/articles"],
  });

  // Filter articles based on selected filters
  const filteredArticles = articles.filter((article) => {
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

    // Filter by mood
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

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <EnglishLayout>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" data-testid="heading-news">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Smart News
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover the latest news with AI-powered analytics and insights
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
          <EnglishNewsAnalyticsHero analytics={analytics} />
        ) : null}

        {/* AI Insights Panel */}
        {analytics?.aiInsights && (
          <EnglishAIInsightsPanel insights={analytics.aiInsights} />
        )}

        {/* Smart Filter Bar */}
        <EnglishSmartFilterBar
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
          categories={categories.map(c => ({ id: c.id, name: c.name, icon: c.icon || undefined }))}
        />

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {currentArticles.length} of {filteredArticles.length} articles
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
              Clear Filters
            </Button>
          )}
        </div>

        {/* Articles Grid - Professional Layout */}
        {articlesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden rounded-xl">
                <Skeleton className="w-full aspect-[4/3]" />
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
              No articles match the selected filters
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
              Show All Articles
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentArticles.map((article) => (
                <Link key={article.id} href={`/en/article/${article.slug}`}>
                  <Card 
                    className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden"
                    data-testid={`card-article-${article.id}`}
                  >
                    {article.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-lg font-bold line-clamp-2 hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {article.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                          </div>
                        )}
                        {article.views !== undefined && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.views.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      {article.isFeatured && (
                        <Badge variant="default" className="text-xs">Featured</Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    scrollToTop();
                  }}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                  aria-label="Previous page"
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
                      onClick={() => {
                        setCurrentPage(page as number);
                        scrollToTop();
                      }}
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
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    scrollToTop();
                  }}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </EnglishLayout>
  );
}
