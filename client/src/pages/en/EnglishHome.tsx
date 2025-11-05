import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { enUS } from 'date-fns/locale';
import { ArticleCard } from "@/components/ArticleCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Star, TrendingUp } from "lucide-react";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { EnglishHeroCarousel } from "@/components/en/EnglishHeroCarousel";
import type { EnArticle } from "@shared/schema";

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

          {/* Latest Articles Section */}
          {regularArticles.length > 0 && (
            <section className="scroll-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold">Latest News</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {regularArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article as any}
                    variant="grid"
                    dir="ltr"
                    locale={enUS}
                  />
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
