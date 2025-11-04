import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Eye, Heart, Bookmark, Sparkles } from "lucide-react";
import type { EnArticle } from "@shared/schema";

export default function EnglishArticleDetail() {
  const params = useParams<{ slug: string }>();
  
  const { data: article, isLoading } = useQuery<EnArticle>({
    queryKey: [`/api/en/articles/${params.slug}`],
    enabled: !!params.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="ltr">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-24 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="ltr">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist.
          </p>
          <Link href="/en">
            <Button data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/en">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <Link href="/ar">
              <Button variant="outline" size="sm" data-testid="button-switch-arabic">
                عربي
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 leading-tight" data-testid="text-article-title">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl text-muted-foreground" data-testid="text-article-subtitle">
              {article.subtitle}
            </p>
          )}
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-6 mb-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {article.publishedAt ? (
              <time dateTime={article.publishedAt.toString()} data-testid="text-publish-date">
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            ) : (
              <span>Draft</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span data-testid="text-views">{article.views || 0} views</span>
          </div>
        </div>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto"
              data-testid="img-article-cover"
            />
          </div>
        )}

        {/* AI Summary */}
        {(article.smartSummary || article.aiSummary) && (
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Quick Summary
              </h3>
              <p className="text-sm leading-relaxed" data-testid="text-ai-summary">
                {article.smartSummary || article.aiSummary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Article Content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert mb-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
          data-testid="text-article-content"
        />

        {/* Action Buttons */}
        <div className="flex gap-3 border-t pt-6">
          <Button variant="outline" size="sm" data-testid="button-like">
            <Heart className="w-4 h-4 mr-2" /> Like
          </Button>
          <Button variant="outline" size="sm" data-testid="button-bookmark">
            <Bookmark className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>

        {/* Keywords */}
        {article.seo?.keywords && article.seo.keywords.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.seo.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  data-testid={`tag-${index}`}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

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
