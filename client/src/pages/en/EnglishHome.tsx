import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, Eye } from "lucide-react";
import type { EnArticle, EnCategory } from "@shared/schema";

export default function EnglishHome() {
  const { data: articles, isLoading: articlesLoading } = useQuery<EnArticle[]>({
    queryKey: ["/api/en/articles"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<EnCategory[]>({
    queryKey: ["/api/en/categories"],
  });

  if (articlesLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sabq Smart</h1>
              <p className="text-sm text-muted-foreground mt-1">English Edition</p>
            </div>
            <div className="flex gap-2">
              <Link href="/ar">
                <Button variant="outline" data-testid="button-switch-arabic">
                  عربي
                </Button>
              </Link>
              <Link href="/login">
                <Button data-testid="button-login">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                size="sm"
                className="whitespace-nowrap"
                data-testid={`button-category-${category.slug}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles?.map((article) => (
            <Link key={article.id} href={`/en/articles/${article.slug}`}>
              <Card className="hover-elevate h-full transition-all cursor-pointer" data-testid={`card-article-${article.id}`}>
                {article.imageUrl && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-lg">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Draft"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {(!articles || articles.length === 0) && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No articles available yet.</p>
            <Link href="/dashboard">
              <Button data-testid="button-create-article">
                Create First Article <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Sabq Smart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
