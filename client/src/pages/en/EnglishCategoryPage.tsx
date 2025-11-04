import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Newspaper } from "lucide-react";
import { Link } from "wouter";
import type { EnCategory, EnArticle } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function EnglishCategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: user } = useQuery<{ id: string; firstName?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: category, isLoading: categoryLoading } = useQuery<EnCategory>({
    queryKey: ["/api/en/categories/slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/en/categories/slug/${slug}`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch category");
      return res.json();
    },
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery<EnArticle[]>({
    queryKey: ["/api/en/categories", slug, "articles"],
    queryFn: async () => {
      if (!category) return [];
      const res = await fetch(`/api/en/categories/${category.id}/articles`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
    enabled: !!category,
  });

  if (categoryLoading) {
    return (
      <EnglishLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full mb-8 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </EnglishLayout>
    );
  }

  if (!category) {
    return (
      <EnglishLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground">We couldn't find this category</p>
        </div>
      </EnglishLayout>
    );
  }

  return (
    <EnglishLayout>

      {/* Hero Section */}
      {category.imageUrl ? (
        <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 dark:from-black/80 dark:via-black/40 dark:to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-3xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <Newspaper className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                {category.name}
              </h1>
            </div>
            {category.description && (
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Articles Yet</h2>
            <p className="text-muted-foreground">
              There are no articles in this category at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/en/articles/${article.slug}`}>
                <Card 
                  className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden group"
                  data-testid={`card-article-${article.id}`}
                >
                  {article.mainImageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.mainImageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {article.isFeatured && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="default">Featured</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
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
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </EnglishLayout>
  );
}
