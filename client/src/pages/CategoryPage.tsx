import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles } from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Link } from "wouter";
import type { Category, ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories/slug", slug],
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/categories", slug, "articles"],
    enabled: !!category,
  });

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full mb-8 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">التصنيف غير موجود</h1>
          <p className="text-muted-foreground">لم نتمكن من العثور على هذا التصنيف</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      {/* Hero Section */}
      {category.heroImageUrl ? (
        <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          <img
            src={category.heroImageUrl}
            alt={category.nameAr}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="flex items-center gap-3 mb-4">
                {category.icon && (
                  <span className="text-4xl">{category.icon}</span>
                )}
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {category.nameAr}
                </h1>
              </div>
              {category.description && (
                <p className="text-lg text-white/90 max-w-3xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              {category.icon && (
                <span className="text-4xl">{category.icon}</span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {category.nameAr}
              </h1>
            </div>
            {category.description && (
              <p className="text-lg text-muted-foreground max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            آخر الأخبار
            {articles.length > 0 && (
              <Badge variant="secondary" className="mr-2">
                {articles.length}
              </Badge>
            )}
          </h2>
        </div>

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
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              لا توجد مقالات في هذا التصنيف حالياً
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card 
                  className="group hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden"
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
                            <Sparkles className="h-3 w-3 mr-1" />
                            ذكاء اصطناعي
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
        )}
      </div>
    </div>
  );
}
