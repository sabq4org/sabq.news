import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { SmartBlock } from "@shared/schema";

interface ArticleResult {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  imageUrl?: string | null;
  category?: {
    nameAr: string;
    slug: string;
    color: string | null;
  } | null;
}

interface SmartNewsBlockProps {
  config: SmartBlock;
}

export function SmartNewsBlock({ config }: SmartNewsBlockProps) {
  const { data: articles, isLoading } = useQuery<ArticleResult[]>({
    queryKey: ['/api/smart-blocks/query/articles', config.keyword, config.limitCount],
    queryFn: async () => {
      const params = new URLSearchParams({
        keyword: config.keyword,
        limit: config.limitCount.toString(),
      });
      const res = await fetch(`/api/smart-blocks/query/articles?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data = await res.json();
      return data.items || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4" dir="rtl" data-testid={`smart-block-loading-${config.id}`}>
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
        dir="rtl"
        data-testid={`smart-block-empty-${config.id}`}
      >
        <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>لا توجد مقالات متاحة لـ "{config.title}"</p>
      </div>
    );
  }

  return (
    <section className="space-y-4" dir="rtl" data-testid={`smart-block-${config.id}`}>
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
    <>
      <Card className="overflow-hidden lg:hidden" data-testid={`smart-block-mobile-card-${blockId}`}>
        <CardContent className="p-0">
          <div className="divide-y">
            {articles.map((article) => {
              const timeAgo = article.publishedAt
                ? formatDistanceToNow(new Date(article.publishedAt), {
                    addSuffix: true,
                    locale: arSA,
                  })
                : null;

              return (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <div 
                    className="block group cursor-pointer"
                    data-testid={`link-smart-article-mobile-${article.id}`}
                  >
                    <div className="p-4 hover-elevate active-elevate-2 transition-all">
                      <div className="flex gap-3">
                        {article.imageUrl && (
                          <div className="relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden">
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-2">
                          {article.category && (
                            <Badge 
                              variant="outline" 
                              className="text-xs h-5"
                              style={{ 
                                borderColor: article.category.color || undefined,
                                color: article.category.color || undefined,
                              }}
                              data-testid={`badge-smart-article-category-${article.id}`}
                            >
                              {article.category.nameAr}
                            </Badge>
                          )}

                          <h4 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors" data-testid={`text-smart-article-title-${article.id}`}>
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
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => {
          const timeAgo = article.publishedAt
            ? formatDistanceToNow(new Date(article.publishedAt), {
                addSuffix: true,
                locale: arSA,
              })
            : null;

          return (
            <Link key={article.id} href={`/article/${article.slug}`}>
              <Card 
                className="cursor-pointer h-full overflow-hidden border border-card-border hover-elevate active-elevate-2"
                data-testid={`card-smart-article-${article.id}`}
              >
                {article.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                )}
                
                <CardContent className="p-4 space-y-3">
                  {article.category && (
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: article.category.color || undefined,
                        color: article.category.color || undefined,
                      }}
                      data-testid={`badge-smart-article-category-desktop-${article.id}`}
                    >
                      {article.category.nameAr}
                    </Badge>
                  )}

                  <h3 className="font-bold text-lg line-clamp-2 leading-snug" data-testid={`text-smart-article-title-desktop-${article.id}`}>
                    {article.title}
                  </h3>

                  {timeAgo && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {timeAgo}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ListLayout({ articles, blockId }: { articles: ArticleResult[]; blockId: string }) {
  return (
    <div className="space-y-4" data-testid={`smart-block-list-${blockId}`}>
      {articles.map((article) => {
        const timeAgo = article.publishedAt
          ? formatDistanceToNow(new Date(article.publishedAt), {
              addSuffix: true,
              locale: arSA,
            })
          : null;

        return (
          <Link key={article.id} href={`/article/${article.slug}`}>
            <Card 
              className="cursor-pointer overflow-hidden hover-elevate active-elevate-2"
              data-testid={`card-smart-article-list-${article.id}`}
            >
              <CardContent className="p-0">
                <div className="flex gap-4 p-4 md:gap-6 md:p-6">
                  {article.imageUrl && (
                    <div className="relative flex-shrink-0 w-32 h-24 md:w-48 md:h-36 rounded-lg overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-3">
                    {article.category && (
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: article.category.color || undefined,
                          color: article.category.color || undefined,
                        }}
                        data-testid={`badge-smart-article-list-category-${article.id}`}
                      >
                        {article.category.nameAr}
                      </Badge>
                    )}

                    <h3 className="font-bold text-xl md:text-2xl line-clamp-2 leading-snug hover:text-primary transition-colors" data-testid={`text-smart-article-list-title-${article.id}`}>
                      {article.title}
                    </h3>

                    {timeAgo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
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

  const [featured, ...rest] = articles;
  const featuredTimeAgo = featured.publishedAt
    ? formatDistanceToNow(new Date(featured.publishedAt), {
        addSuffix: true,
        locale: arSA,
      })
    : null;

  return (
    <div className="space-y-6" data-testid={`smart-block-featured-${blockId}`}>
      <Link href={`/article/${featured.slug}`}>
        <Card 
          className="cursor-pointer overflow-hidden hover-elevate active-elevate-2"
          data-testid={`card-smart-article-featured-main-${featured.id}`}
        >
          {featured.imageUrl && (
            <div className="relative h-64 md:h-96 overflow-hidden">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                loading="lazy"
              />
            </div>
          )}
          
          <CardContent className="p-6 space-y-4">
            {featured.category && (
              <Badge 
                variant="outline"
                className="text-base"
                style={{ 
                  borderColor: featured.category.color || undefined,
                  color: featured.category.color || undefined,
                }}
                data-testid={`badge-smart-article-featured-category-${featured.id}`}
              >
                {featured.category.nameAr}
              </Badge>
            )}

            <h3 className="font-bold text-2xl md:text-4xl leading-snug hover:text-primary transition-colors" data-testid={`text-smart-article-featured-title-${featured.id}`}>
              {featured.title}
            </h3>

            {featuredTimeAgo && (
              <div className="flex items-center gap-2 text-base text-muted-foreground">
                <Clock className="h-5 w-5" />
                {featuredTimeAgo}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rest.slice(0, 3).map((article) => {
            const timeAgo = article.publishedAt
              ? formatDistanceToNow(new Date(article.publishedAt), {
                  addSuffix: true,
                  locale: arSA,
                })
              : null;

            return (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card 
                  className="cursor-pointer h-full overflow-hidden hover-elevate active-elevate-2"
                  data-testid={`card-smart-article-featured-${article.id}`}
                >
                  {article.imageUrl && (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-4 space-y-3">
                    {article.category && (
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: article.category.color || undefined,
                          color: article.category.color || undefined,
                        }}
                        data-testid={`badge-smart-article-featured-sub-category-${article.id}`}
                      >
                        {article.category.nameAr}
                      </Badge>
                    )}

                    <h4 className="font-bold text-base line-clamp-2 leading-snug" data-testid={`text-smart-article-featured-sub-title-${article.id}`}>
                      {article.title}
                    </h4>

                    {timeAgo && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {timeAgo}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
