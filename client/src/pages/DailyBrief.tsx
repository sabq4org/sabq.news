import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sun, Newspaper, RefreshCw, Calendar, Clock, ArrowLeft, Heart } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface DailyBriefCategory {
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  categorySlug: string;
  weight: number;
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    categoryId: string | null;
  }>;
  articleCount: number;
}

interface DailyBriefResponse {
  hasInterests: boolean;
  categories: DailyBriefCategory[];
  totalArticles: number;
  estimatedReadingTime: number;
  dateRange?: {
    from: string;
    to: string;
  };
}

export default function DailyBrief() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: briefData, isLoading, refetch } = useQuery<DailyBriefResponse>({
    queryKey: ["/api/daily-brief"],
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/daily-brief"] });
    refetch();
  };

  const getExcerpt = (content: string, excerpt: string | null) => {
    if (excerpt) return excerpt;
    // Extract first 100 characters from content, removing HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
  };

  const todayInArabic = format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar });

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3" data-testid="text-daily-brief-title">
                <Sun className="h-8 w-8 text-yellow-500" />
                صباح الخير! إليك ملخصك اليومي
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2" data-testid="text-current-date">
                  <Calendar className="h-4 w-4" />
                  <span>{todayInArabic}</span>
                </div>
                {briefData?.estimatedReadingTime && (
                  <div className="flex items-center gap-2" data-testid="text-reading-time">
                    <Clock className="h-4 w-4" />
                    <span>وقت القراءة المتوقع: {briefData.estimatedReadingTime} دقيقة</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              data-testid="button-refresh-brief"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <Separator className="my-4" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-32" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Interests State */}
        {!isLoading && briefData && !briefData.hasInterests && (
          <Card data-testid="card-no-interests">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">يرجى تحديد اهتماماتك أولاً</h2>
              <p className="text-muted-foreground mb-6">
                لكي نتمكن من تقديم ملخص يومي مخصص لك، يرجى اختيار المواضيع التي تهمك
              </p>
              <Button asChild data-testid="button-select-interests">
                <Link href="/select-interests">
                  اختر اهتماماتك
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Brief Content */}
        {!isLoading && briefData?.hasInterests && (
          <div className="space-y-8">
            {briefData.totalArticles === 0 && (
              <Card data-testid="card-no-articles">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Newspaper className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">لا توجد أخبار جديدة</h2>
                  <p className="text-muted-foreground">
                    لم يتم نشر أخبار جديدة في اهتماماتك خلال اليومين الماضيين
                  </p>
                </CardContent>
              </Card>
            )}

            {briefData.categories.map((category) => (
              <Card key={category.categoryId} data-testid={`card-category-${category.categorySlug}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl" data-testid={`text-category-name-${category.categorySlug}`}>
                      {category.categoryNameAr}
                    </CardTitle>
                    <Badge variant="secondary" data-testid={`badge-article-count-${category.categorySlug}`}>
                      {category.articleCount} {category.articleCount === 1 ? 'مقال' : 'مقالات'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.articles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8" data-testid={`text-no-news-${category.categorySlug}`}>
                      لا توجد أخبار جديدة
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {category.articles.map((article) => (
                        <Link 
                          key={article.id} 
                          href={`/article/${article.slug}`}
                          data-testid={`link-article-${article.slug}`}
                        >
                          <Card className="h-full hover-elevate transition-all cursor-pointer">
                            {article.imageUrl && (
                              <div className="aspect-video overflow-hidden rounded-t-md">
                                <img 
                                  src={article.imageUrl} 
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-article-${article.slug}`}
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`text-article-title-${article.slug}`}>
                                {article.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-article-excerpt-${article.slug}`}>
                                {getExcerpt(article.content, article.excerpt)}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
