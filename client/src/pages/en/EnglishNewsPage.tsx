import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnglishLayout } from "@/components/en/EnglishLayout";
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

  return (
    <EnglishLayout>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-news">
            Latest News
          </h1>
          <p className="text-muted-foreground">
            Stay updated with the latest news and updates
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Time Range Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center mr-2">Time:</span>
            {(['all', 'today', 'week', 'month'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setTimeRange(range);
                  setCurrentPage(1);
                }}
                data-testid={`button-time-${range}`}
              >
                {range === 'all' ? 'All Time' : range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
              </Button>
            ))}
          </div>

          {/* Mood Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center mr-2">Show:</span>
            {(['all', 'hot', 'trending', 'calm'] as Mood[]).map((m) => (
              <Button
                key={m}
                variant={mood === m ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMood(m);
                  setCurrentPage(1);
                }}
                data-testid={`button-mood-${m}`}
              >
                {m === 'all' ? 'All News' : m === 'hot' ? 'Featured' : m === 'trending' ? 'Trending' : 'Regular'}
              </Button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center mr-2">Category:</span>
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              data-testid="button-category-all"
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No articles found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    scrollToTop();
                  }}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((page, idx) => (
                  typeof page === 'number' ? (
                    <Button
                      key={idx}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(page);
                        scrollToTop();
                      }}
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={idx} className="px-2 text-muted-foreground">
                      {page}
                    </span>
                  )
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    scrollToTop();
                  }}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
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
