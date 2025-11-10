import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UrduLayout } from "@/components/ur/UrduLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Clock, Eye, Star, Sparkles } from "lucide-react";
import { Link } from "wouter";
import type { UrArticle } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

const ARTICLES_PER_PAGE = 12;

export default function UrduFeaturedPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Ensure RTL direction is applied for Urdu content
  useEffect(() => {
    const previousDir = document.documentElement.dir;
    const previousLang = document.documentElement.lang;
    
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ur";
    
    // Cleanup: restore previous values when unmounting
    return () => {
      document.documentElement.dir = previousDir || "ltr";
      document.documentElement.lang = previousLang || "en";
    };
  }, []);

  const { data: user } = useQuery<{ id: string; firstName?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch featured articles
  const { data: articles = [], isLoading } = useQuery<UrArticle[]>({
    queryKey: ["/api/ur/articles", { featured: true }],
    queryFn: async () => {
      const response = await fetch("/api/ur/articles?featured=true");
      if (!response.ok) {
        throw new Error("Failed to fetch featured articles");
      }
      return response.json();
    },
  });

  // Calculate pagination
  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const currentArticles = articles.slice(startIndex, endIndex);

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
    <UrduLayout>
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-10 w-10 text-primary fill-primary" />
            <h1 className="text-4xl md:text-5xl font-bold" data-testid="heading-featured">
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                نمایاں خبریں
              </span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            ہماری سب سے اہم اور نمایاں خبریں دریافت کریں
          </p>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {currentArticles.length} میں سے {articles.length} نمایاں مضامین دکھا رہے ہیں
          </p>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full mb-4" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentArticles.length === 0 ? (
          <div className="text-center py-20">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              کوئی نمایاں مضامین دستیاب نہیں
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              جلد ہی نئی نمایاں خبروں کے لیے واپس آئیں
            </p>
            <Link href="/ur">
              <Button data-testid="button-back-home">
                واپس ہوم پر
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentArticles.map((article) => (
              <Link key={article.id} href={`/ur/article/${article.slug}`}>
                <Card className="h-full hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-0">
                    {/* Article Image */}
                    {article.imageUrl && (
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-48 object-cover"
                          data-testid={`img-article-${article.id}`}
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                            <Star className="h-3 w-3 ml-1 fill-current" />
                            نمایاں
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Article Content */}
                    <div className="p-5 space-y-3">
                      {/* Category Badge */}
                      {article.categoryId && (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${article.id}`}>
                          {article.categoryId}
                        </Badge>
                      )}

                      {/* Title */}
                      <h3 className="font-bold text-lg leading-tight line-clamp-2" data-testid={`text-title-${article.id}`}>
                        {article.title}
                      </h3>

                      {/* Excerpt or AI Summary */}
                      {(article.excerpt || article.aiSummary) && (
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-excerpt-${article.id}`}>
                          {article.excerpt || article.aiSummary}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        {article.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <time dateTime={article.publishedAt.toString()}>
                              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: arSA })}
                            </time>
                          </div>
                        )}
                        {article.views !== undefined && article.views !== null && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{article.views}</span>
                          </div>
                        )}
                        {article.aiGenerated && (
                          <div className="flex items-center gap-1 text-primary">
                            <Sparkles className="w-3 h-3" />
                            <span>AI</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(currentPage - 1);
                scrollToTop();
              }}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              <ChevronRight className="h-4 w-4" />
              پچھلا
            </Button>

            <div className="flex gap-1">
              {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                  <Button
                    key={index}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCurrentPage(page);
                      scrollToTop();
                    }}
                    className="min-w-[40px]"
                    data-testid={`button-page-${page}`}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-2 py-1 text-muted-foreground">
                    {page}
                  </span>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(currentPage + 1);
                scrollToTop();
              }}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              اگلا
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </UrduLayout>
  );
}
