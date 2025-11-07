import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Tag, User, Eye, Flame, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { EnSmartBlock } from "@shared/schema";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const now = new Date();
  const published = new Date(publishedAt);
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

interface ArticleResult {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  imageUrl?: string | null;
  excerpt?: string | null;
  newsType?: string | null;
  views?: number;
  category?: {
    name: string;
    slug: string;
    color: string | null;
    icon?: string | null;
  } | null;
  author?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    bio: string | null;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {articles.map((article) => {
        const timeAgo = article.publishedAt
          ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
          : null;

        return (
          <Link key={article.id} href={`/en/article/${article.slug}`}>
            <Card 
              className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden"
              data-testid={`card-article-${article.id}`}
            >
              {article.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <h3 className="text-lg font-bold line-clamp-2 hover:text-primary transition-colors">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {timeAgo && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo}</span>
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
                    <div className="flex flex-col gap-1">
                      {article.author && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="font-medium">
                            {article.author.firstName && article.author.lastName
                              ? `${article.author.firstName} ${article.author.lastName}`
                              : article.author.email}
                          </span>
                        </div>
                      )}
                      {timeAgo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </div>
                      )}
                    </div>
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
            <div className="flex flex-col gap-2">
              {featured.author && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {featured.author.firstName && featured.author.lastName
                      ? `${featured.author.firstName} ${featured.author.lastName}`
                      : featured.author.email}
                  </span>
                </div>
              )}
              {featuredTimeAgo && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {featuredTimeAgo}
                </div>
              )}
            </div>
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
                      <div className="flex flex-col gap-1">
                        {article.author && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="font-medium">
                              {article.author.firstName && article.author.lastName
                                ? `${article.author.firstName} ${article.author.lastName}`
                                : article.author.email}
                            </span>
                          </div>
                        )}
                        {timeAgo && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                          </div>
                        )}
                      </div>
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
