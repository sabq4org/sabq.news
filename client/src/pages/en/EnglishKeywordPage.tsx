import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { enUS } from 'date-fns/locale';
import { ArticleCard } from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "lucide-react";
import type { EnArticle } from "@shared/schema";
import { EnglishLayout } from "@/components/en/EnglishLayout";

export default function EnglishKeywordPage() {
  const params = useParams();
  const keyword = decodeURIComponent(params.keyword || "");

  const { data: user } = useQuery<{ id: string; firstName?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: articles, isLoading } = useQuery<EnArticle[]>({
    queryKey: ["/api/en/keyword", keyword],
    queryFn: async () => {
      const res = await fetch(`/api/en/keyword/${encodeURIComponent(keyword)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });

  return (
    <EnglishLayout>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Tag className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-keyword-title">
              {keyword}
            </h1>
          </div>
          {!isLoading && articles && (
            <p className="text-muted-foreground" data-testid="text-articles-count">
              {articles.length} {articles.length === 1 ? "article" : "articles"}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && articles && articles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article as any}
                variant="grid"
                dir="ltr"
                locale={enUS}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && articles && articles.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2" data-testid="text-no-articles">
              No Articles Found
            </h2>
            <p className="text-muted-foreground">
              We couldn't find any articles with the keyword "{keyword}"
            </p>
          </div>
        )}
      </main>
    </EnglishLayout>
  );
}
