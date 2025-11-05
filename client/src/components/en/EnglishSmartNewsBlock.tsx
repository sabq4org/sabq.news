import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { EnSmartBlock } from "@shared/schema";

interface ArticleResult {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  imageUrl?: string | null;
  category?: {
    name: string;
    slug: string;
    color: string | null;
  } | null;
}

interface EnglishSmartNewsBlockProps {
  config: EnSmartBlock;
}

export function EnglishSmartNewsBlock({ config }: EnglishSmartNewsBlockProps) {
  const { data: articles, isLoading } = useQuery<ArticleResult[]>({
    queryKey: ['/api/en/smart-blocks/query/articles', config.keyword, config.limitCount],
    queryFn: async () => {
      const params = new URLSearchParams({
        keyword: config.keyword,
        limit: config.limitCount.toString(),
      });
      const res = await fetch(`/api/en/smart-blocks/query/articles?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data = await res.json();
      return data.items || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid={`smart-block-loading-${config.id}`}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className={config.layoutStyle === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={config.layoutStyle === 'list' ? 'h-32' : 'h-48'} />
          ))}
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div 
        className="text-center py-8 text-muted-foreground"
        data-testid={`smart-block-empty-${config.id}`}
      >
        <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No articles available for "{config.title}"</p>
      </div>
    );
  }

  return (
    <section className="space-y-4" data-testid={`smart-block-${config.id}`}>
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center justify-center w-6 h-6 rounded-full"
          style={{ backgroundColor: config.color }}
        >
          <Tag className="h-3.5 w-3.5 text-white" />
        </div>
        <h2 
          className="text-2xl md:text-3xl font-bold" 
          style={{ color: config.color }}
          data-testid={`heading-smart-block-${config.id}`}
        >
          {config.title}
        </h2>
      </div>

      {config.layoutStyle === 'grid' && <GridLayout articles={articles} blockId={config.id} />}
      {config.layoutStyle === 'list' && <ListLayout articles={articles} blockId={config.id} />}
      {config.layoutStyle === 'featured' && <FeaturedLayout articles={articles} blockId={config.id} />}
    </section>
  );
}

function GridLayout({ articles, blockId }: { articles: ArticleResult[]; blockId: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {articles.map((article) => {
        const timeAgo = article.publishedAt
          ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
          : null;

        return (
          <Link key={article.id} href={`/en/article/${article.slug}`}>
            <Card className="hover-elevate active-elevate-2 h-full cursor-pointer overflow-hidden group" data-testid={`card-smart-article-${article.id}`}>
              {article.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                {article.category && (
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: article.category.color || undefined,
                      color: article.category.color || undefined,
                    }}
                    data-testid={`badge-smart-article-category-${article.id}`}
                  >
                    {article.category.name}
                  </Badge>
                )}
                <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-smart-article-title-${article.id}`}>
                  {article.title}
                </h3>
                {timeAgo && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function ListLayout({ articles, blockId }: { articles: ArticleResult[]; blockId: string }) {
  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const timeAgo = article.publishedAt
          ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
          : null;

        return (
          <Link key={article.id} href={`/en/article/${article.slug}`}>
            <Card className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden group" data-testid={`card-list-smart-article-${article.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {article.imageUrl && (
                    <div className="relative flex-shrink-0 w-32 h-24 rounded overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    {article.category && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: article.category.color || undefined,
                          color: article.category.color || undefined,
                        }}
                      >
                        {article.category.name}
                      </Badge>
                    )}
                    <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {timeAgo && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function FeaturedLayout({ articles, blockId }: { articles: ArticleResult[]; blockId: string }) {
  if (articles.length === 0) return null;

  const featured = articles[0];
  const others = articles.slice(1);
  const featuredTimeAgo = featured.publishedAt
    ? formatDistanceToNow(new Date(featured.publishedAt), { addSuffix: true })
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Link href={`/en/article/${featured.slug}`}>
        <Card className="hover-elevate active-elevate-2 h-full cursor-pointer overflow-hidden group" data-testid={`card-featured-smart-article-${featured.id}`}>
          {featured.imageUrl && (
            <div className="relative h-64 overflow-hidden">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          <CardContent className="p-6 space-y-3">
            {featured.category && (
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: featured.category.color || undefined,
                  color: featured.category.color || undefined,
                }}
              >
                {featured.category.name}
              </Badge>
            )}
            <h3 className="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors">
              {featured.title}
            </h3>
            {featuredTimeAgo && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {featuredTimeAgo}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      <div className="space-y-3">
        {others.map((article) => {
          const timeAgo = article.publishedAt
            ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
            : null;

          return (
            <Link key={article.id} href={`/en/article/${article.slug}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden group" data-testid={`card-small-smart-article-${article.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {article.imageUrl && (
                      <div className="relative flex-shrink-0 w-24 h-20 rounded overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      {timeAgo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
