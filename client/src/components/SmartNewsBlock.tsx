import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";
import type { SmartBlock, ArticleWithDetails } from "@shared/schema";
import { ArticleCard } from "@/components/ArticleCard";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" data-testid={`smart-block-grid-${blockId}`}>
      {articles.map((article) => (
        <ArticleCard 
          key={article.id}
          article={article as unknown as ArticleWithDetails}
          variant="grid"
        />
      ))}
    </div>
  );
}

function ListLayout({ articles, blockId }: { articles: ArticleResult[]; blockId: string }) {
  return (
    <div className="space-y-3" data-testid={`smart-block-list-${blockId}`}>
      {articles.map((article) => (
        <ArticleCard 
          key={article.id}
          article={article as unknown as ArticleWithDetails}
          variant="list"
        />
      ))}
    </div>
  );
}

function FeaturedLayout({ articles, blockId }: { articles: ArticleResult[]; blockId: string }) {
  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;
  const sideArticles = rest.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2" data-testid={`smart-block-featured-${blockId}`}>
      <div className="lg:col-span-3">
        <ArticleCard 
          article={featured as unknown as ArticleWithDetails}
          variant="featured"
        />
      </div>

      {sideArticles.length > 0 && (
        <div className="lg:col-span-2 grid grid-cols-2 gap-2">
          {sideArticles.map((article) => (
            <div key={article.id} className="col-span-2 lg:col-span-1">
              <ArticleCard 
                article={article as unknown as ArticleWithDetails}
                variant="featured"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
