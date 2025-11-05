import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, Eye, Star, TrendingUp } from "lucide-react";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { EnglishHeroCarousel } from "@/components/en/EnglishHeroCarousel";
import { EnglishQuadCategoriesBlock } from "@/components/en/EnglishQuadCategoriesBlock";
import type { EnArticle } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function EnglishHome() {
  const { data: articles = [], isLoading: articlesLoading } = useQuery<EnArticle[]>({
    queryKey: ["/api/en/articles"],
  });

  // Separate featured and regular articles
  const featuredArticles = articles.filter(article => article.isFeatured && article.status === "published");
  const regularArticles = articles.filter(article => !article.isFeatured && article.status === "published");

  if (articlesLoading) {
    return (
      <EnglishLayout>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </EnglishLayout>
    );
  }

  return (
    <EnglishLayout>
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          
          {/* Featured News Carousel */}
          {featuredArticles.length > 0 && (
            <section className="scroll-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                <h2 className="text-2xl md:text-3xl font-bold">Featured News</h2>
              </div>

              <EnglishHeroCarousel articles={featuredArticles} />
            </section>
          )}

          {/* Quad Categories Block - Full Width */}
          <div className="scroll-fade-in">
            <EnglishQuadCategoriesBlock />
          </div>

          {/* Latest Articles Section */}
          {regularArticles.length > 0 && (
            <section className="scroll-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold">Latest News</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {regularArticles.map((article) => (
                  <Link key={article.id} href={`/en/article/${article.slug}`}>
                    <Card className="hover-elevate active-elevate-2 h-full cursor-pointer overflow-hidden group" data-testid={`card-article-${article.id}`}>
                      {article.imageUrl && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
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
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{(article.views || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {articles.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No articles available yet.</p>
              <Link href="/en/dashboard">
                <Button data-testid="button-create-article">
                  Create First Article <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Sabq Smart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </EnglishLayout>
  );
}
