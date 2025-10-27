import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Brain, Sparkles } from "lucide-react";
import type { ArticleWithDetails } from "@shared/schema";

// AI recommendation reasons
const getRecommendationReason = (index: number): string => {
  const reasons = [
    "بناءً على اهتماماتك",
    "قد يعجبك هذا",
    "مختار خصيصاً لك",
    "مواضيع مشابهة",
    "الأكثر قراءة في مجالك",
    "يتناسب مع اهتماماتك",
  ];
  return reasons[index % reasons.length];
};

export function MoreFromSabq() {
  const { data: personalFeed, isLoading } = useQuery<{
    articles: ArticleWithDetails[];
  }>({
    queryKey: ["/api/personal-feed"],
    retry: false,
  });

  const articles = personalFeed?.articles || [];

  if (!isLoading && articles.length === 0) {
    return null;
  }

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1, 9);

  return (
    <section className="py-12 border-t border-border" data-testid="section-personalized">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-xl rounded-full" />
            <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl">
              <Brain className="h-5 w-5 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">محتوى مخصص لك</h2>
        </div>

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-4" />
              <div className="h-6 bg-muted rounded w-3/4" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Featured Article - Left Side */}
            {featuredArticle && (
              <Link href={`/news/${featuredArticle.slug}`}>
                <div 
                  className="group cursor-pointer"
                  data-testid={`featured-article-${featuredArticle.id}`}
                >
                  {/* Image */}
                  {featuredArticle.imageUrl && (
                    <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                      <img
                        src={featuredArticle.imageUrl}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {featuredArticle.title}
                  </h3>

                  {/* AI Reason */}
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-purple-600 dark:text-purple-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{getRecommendationReason(0)}</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Article List - Right Side */}
            <div className="space-y-0 border-r border-border pr-4" dir="rtl">
              {otherArticles.map((article, index) => (
                <Link key={article.id} href={`/news/${article.slug}`}>
                  <div 
                    className="group py-4 border-b border-border last:border-b-0 cursor-pointer"
                    data-testid={`list-article-${article.id}`}
                  >
                    {/* Title */}
                    <h4 className="font-semibold leading-snug mb-1.5 group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>

                    {/* AI Reason - subtle */}
                    <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>{getRecommendationReason(index + 1)}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
