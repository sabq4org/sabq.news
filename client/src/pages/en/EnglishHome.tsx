import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, Eye, Star, TrendingUp, User } from "lucide-react";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { EnglishHeroCarousel } from "@/components/en/EnglishHeroCarousel";
import { EnglishQuadCategoriesBlock } from "@/components/en/EnglishQuadCategoriesBlock";
import { EnglishSmartNewsBlock } from "@/components/en/EnglishSmartNewsBlock";
import type { EnArticle, EnSmartBlock } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function EnglishHome() {
  const { data: articles = [], isLoading: articlesLoading } = useQuery<EnArticle[]>({
    queryKey: ["/api/en/articles"],
  });

  // Fetch smart blocks for different placements
  const { data: blocksBelowFeatured } = useQuery<EnSmartBlock[]>({
    queryKey: ['/api/en/smart-blocks', 'below_featured'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'below_featured' });
      const res = await fetch(`/api/en/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: blocksAboveAllNews } = useQuery<EnSmartBlock[]>({
    queryKey: ['/api/en/smart-blocks', 'above_all_news'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'above_all_news' });
      const res = await fetch(`/api/en/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: blocksBetweenAllAndMurqap } = useQuery<EnSmartBlock[]>({
    queryKey: ['/api/en/smart-blocks', 'between_all_and_murqap'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'between_all_and_murqap' });
      const res = await fetch(`/api/en/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: blocksAboveFooter } = useQuery<EnSmartBlock[]>({
    queryKey: ['/api/en/smart-blocks', 'above_footer'],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', placement: 'above_footer' });
      const res = await fetch(`/api/en/smart-blocks?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return await res.json();
    },
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
        {/* Featured News and Latest Articles in Container */}
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

          {/* Smart Blocks: below_featured */}
          {blocksBelowFeatured && blocksBelowFeatured.map((block) => (
            <EnglishSmartNewsBlock key={block.id} config={block} />
          ))}

          {/* Smart Blocks: above_all_news */}
          {blocksAboveAllNews && blocksAboveAllNews.map((block) => (
            <EnglishSmartNewsBlock key={block.id} config={block} />
          ))}

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
                        <div className="flex flex-col gap-2 pt-2 border-t">
                          {article.author && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="font-medium" data-testid={`text-author-${article.id}`}>
                                {article.author.firstName && article.author.lastName
                                  ? `${article.author.firstName} ${article.author.lastName}`
                                  : article.author.email}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Smart Blocks: between_all_and_murqap */}
          {blocksBetweenAllAndMurqap && blocksBetweenAllAndMurqap.map((block) => (
            <EnglishSmartNewsBlock key={block.id} config={block} />
          ))}

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

          {/* Smart Blocks: above_footer */}
          {blocksAboveFooter && blocksAboveFooter.map((block) => (
            <EnglishSmartNewsBlock key={block.id} config={block} />
          ))}
        </div>

        {/* Quad Categories Block - Full Width Outside Container */}
        <div className="scroll-fade-in">
          <EnglishQuadCategoriesBlock />
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
