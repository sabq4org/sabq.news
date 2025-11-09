import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, Flame, Brain, Calendar, Zap, TrendingUp, Bot, MessageSquare } from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { Link } from "wouter";
import type { Category, ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { motion } from "framer-motion";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

// Helper function to get category type badge
function getCategoryTypeBadge(type?: string) {
  switch (type) {
    case "dynamic":
      return { label: "ديناميكي", icon: <Zap className="h-3 w-3" />, variant: "default" as const };
    case "smart":
      return { label: "ذكي", icon: <Brain className="h-3 w-3" />, variant: "default" as const };
    case "seasonal":
      return { label: "موسمي", icon: <Calendar className="h-3 w-3" />, variant: "secondary" as const };
    default:
      return null;
  }
}

// Helper function to format update interval
function formatUpdateInterval(seconds?: number) {
  if (!seconds) return null;
  if (seconds < 60) return `${seconds} ثانية`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} دقيقة`;
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories/slug", slug],
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/categories", slug, "articles"],
    enabled: !!category,
  });

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full mb-8 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">التصنيف غير موجود</h1>
          <p className="text-muted-foreground">لم نتمكن من العثور على هذا التصنيف</p>
        </div>
      </div>
    );
  }

  // Check if this is a smart category (AI-powered)
  const isSmartCategory = category.type === "smart" || category.type === "dynamic" || category.type === "seasonal";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      {/* Hero Section */}
      {category.heroImageUrl ? (
        <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
          <img
            src={category.heroImageUrl}
            alt={category.nameAr}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for both themes - stronger on light mode */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 dark:from-black/80 dark:via-black/40 dark:to-transparent" />
          {/* AI Gradient Overlay for Smart Categories */}
          {isSmartCategory && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 mix-blend-overlay" />
          )}
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {isSmartCategory && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </motion.div>
                )}
                {category.icon && (
                  <span className="text-3xl sm:text-4xl">{category.icon}</span>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {category.nameAr}
                </h1>
                {isSmartCategory ? (
                  <Badge 
                    className="flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg"
                    data-testid="badge-category-type"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    اختيار ذكي
                  </Badge>
                ) : getCategoryTypeBadge(category.type) && (
                  <Badge 
                    variant={getCategoryTypeBadge(category.type)!.variant}
                    className="flex items-center gap-1 min-h-8 px-3 py-1.5 text-sm"
                    data-testid="badge-category-type"
                  >
                    {getCategoryTypeBadge(category.type)!.icon}
                    {getCategoryTypeBadge(category.type)!.label}
                  </Badge>
                )}
              </div>
              {category.description && (
                <p className="text-sm sm:text-base md:text-lg text-white/95 max-w-3xl mb-2 sm:mb-3 leading-relaxed">
                  {category.description}
                </p>
              )}
              {/* Smart Category Features */}
              {isSmartCategory && (
                <div className="flex flex-wrap gap-2">
                  {category.features?.realtime && (
                    <Badge variant="secondary" className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5" data-testid="badge-feature-realtime">
                      <Flame className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">مباشر</span>
                    </Badge>
                  )}
                  {category.features?.trending && (
                    <Badge variant="secondary" className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5" data-testid="badge-feature-trending">
                      <TrendingUp className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">رائج</span>
                    </Badge>
                  )}
                  {category.features?.ai_powered && (
                    <Badge variant="secondary" className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5" data-testid="badge-feature-ai">
                      <Bot className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">ذكاء اصطناعي</span>
                    </Badge>
                  )}
                  {category.features?.breaking_news && (
                    <Badge variant="default" className="bg-red-500/95 text-white backdrop-blur-sm min-h-8 px-3 py-1.5" data-testid="badge-feature-breaking">
                      <Zap className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">عاجل</span>
                    </Badge>
                  )}
                  {category.type === "dynamic" && category.updateInterval && (
                    <Badge variant="secondary" className="bg-white/30 dark:bg-white/20 text-white backdrop-blur-sm min-h-8 px-3 py-1.5" data-testid="badge-update-interval">
                      <Clock className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-sm">يتحدث كل {formatUpdateInterval(category.updateInterval)}</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`${isSmartCategory ? 'bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 dark:from-primary/8 dark:via-accent/5 dark:to-primary/3' : 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 dark:from-primary/10 dark:to-primary/5'} border-b relative overflow-hidden`}>
          {/* Animated AI Grid Pattern for Smart Categories */}
          {isSmartCategory && (
            <div className="absolute inset-0 opacity-20 dark:opacity-10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>
          )}
          <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              {isSmartCategory && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </motion.div>
              )}
              {category.icon && (
                <span className="text-3xl sm:text-4xl">{category.icon}</span>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                {category.nameAr}
              </h1>
              {isSmartCategory ? (
                <Badge 
                  className="flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg"
                  data-testid="badge-category-type"
                >
                  <Brain className="h-3.5 w-3.5" />
                  اختيار ذكي
                </Badge>
              ) : getCategoryTypeBadge(category.type) && (
                <Badge 
                  variant={getCategoryTypeBadge(category.type)!.variant}
                  className="flex items-center gap-1 min-h-8 px-3 py-1.5 text-sm"
                  data-testid="badge-category-type"
                >
                  {getCategoryTypeBadge(category.type)!.icon}
                  {getCategoryTypeBadge(category.type)!.label}
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mb-2 sm:mb-3 leading-relaxed">
                {category.description}
              </p>
            )}
            {/* Smart Category Features */}
            {(category.type === "dynamic" || category.type === "smart" || category.type === "seasonal") && (
              <div className="flex flex-wrap gap-2">
                {category.features?.realtime && (
                  <Badge variant="secondary" className="min-h-8 px-3 py-1.5" data-testid="badge-feature-realtime">
                    <Flame className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="text-sm">مباشر</span>
                  </Badge>
                )}
                {category.features?.trending && (
                  <Badge variant="secondary" className="min-h-8 px-3 py-1.5" data-testid="badge-feature-trending">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="text-sm">رائج</span>
                  </Badge>
                )}
                {category.features?.ai_powered && (
                  <Badge variant="secondary" className="min-h-8 px-3 py-1.5" data-testid="badge-feature-ai">
                    <Bot className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="text-sm">ذكاء اصطناعي</span>
                  </Badge>
                )}
                {category.features?.breaking_news && (
                  <Badge variant="default" className="bg-red-600 dark:bg-red-500 text-white min-h-8 px-3 py-1.5" data-testid="badge-feature-breaking">
                    <Zap className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="text-sm">عاجل</span>
                  </Badge>
                )}
                {category.type === "dynamic" && category.updateInterval && (
                  <Badge variant="secondary" className="min-h-8 px-3 py-1.5" data-testid="badge-update-interval">
                    <Clock className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="text-sm">يتحدث كل {formatUpdateInterval(category.updateInterval)}</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">
            آخر الأخبار
            {articles.length > 0 && (
              <Badge variant="secondary" className="mr-2 min-h-7 px-2.5">
                {articles.length.toLocaleString('en-US')}
              </Badge>
            )}
          </h2>
        </div>

        {articlesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-muted-foreground text-base sm:text-lg">
              لا توجد مقالات في هذا التصنيف حالياً
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Vertical List */}
            <Card className="overflow-hidden lg:hidden border-0 dark:border dark:border-card-border">
              <CardContent className="p-0">
                <div className="dark:divide-y">
                  {articles.map((article) => {
                    const timeAgo = article.publishedAt
                      ? formatDistanceToNow(new Date(article.publishedAt), {
                          addSuffix: true,
                          locale: arSA,
                        })
                      : null;

                    return (
                      <div key={article.id}>
                        <Link href={`/article/${article.slug}`}>
                          <div 
                            className="block group cursor-pointer"
                            data-testid={`link-article-mobile-${article.id}`}
                          >
                            <div className={`p-4 hover-elevate active-elevate-2 transition-all ${
                              article.newsType === "breaking" ? "bg-destructive/5" : ""
                            }`}>
                              <div className="flex gap-3">
                                {/* Image */}
                                <div className="relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden">
                                  {article.imageUrl ? (
                                    <img
                                      src={article.imageUrl}
                                      alt={article.title}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                      loading="lazy"
                                      style={{
                                        objectPosition: (article as any).imageFocalPoint
                                          ? `${(article as any).imageFocalPoint.x}% ${(article as any).imageFocalPoint.y}%`
                                          : 'center'
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  {/* Breaking/Featured/Category Badge */}
                                  {article.newsType === "breaking" ? (
                                    <Badge 
                                      variant="destructive" 
                                      className="text-xs h-5 gap-1"
                                      data-testid={`badge-breaking-${article.id}`}
                                    >
                                      <Zap className="h-3 w-3" />
                                      عاجل
                                    </Badge>
                                  ) : isNewArticle(article.publishedAt) ? (
                                    <Badge 
                                      className="text-xs h-5 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
                                      data-testid={`badge-new-${article.id}`}
                                    >
                                      <Flame className="h-3 w-3" />
                                      جديد
                                    </Badge>
                                  ) : article.category ? (
                                    <Badge 
                                      className="text-xs h-5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0"
                                      data-testid={`badge-article-category-${article.id}`}
                                    >
                                      {article.category.nameAr}
                                    </Badge>
                                  ) : null}

                                  {/* Title */}
                                  <h4 className={`font-bold text-sm line-clamp-2 leading-snug transition-colors ${
                                    article.newsType === "breaking"
                                      ? "text-destructive"
                                      : "group-hover:text-primary"
                                  }`} data-testid={`text-article-title-${article.id}`}>
                                    {article.title}
                                  </h4>

                                  {/* Meta Info */}
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    {timeAgo && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {timeAgo}
                                      </span>
                                    )}
                                    <ViewsCount 
                                      views={article.views || 0}
                                      iconClassName="h-3 w-3"
                                    />
                                    {(article.commentsCount ?? 0) > 0 && (
                                      <span className="flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        {article.commentsCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Desktop View: Grid with 4 columns */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card 
                    className={`cursor-pointer h-full overflow-hidden border-0 dark:border dark:border-card-border ${
                      article.newsType === "breaking" ? "bg-destructive/5" : ""
                    }`}
                    data-testid={`card-article-${article.id}`}
                  >
                    {article.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          style={{
                            objectPosition: (article as any).imageFocalPoint
                              ? `${(article as any).imageFocalPoint.x}% ${(article as any).imageFocalPoint.y}%`
                              : 'center'
                          }}
                        />
                        {article.newsType === "breaking" ? (
                          <Badge 
                            variant="destructive" 
                            className="absolute top-3 right-3 gap-1" 
                            data-testid={`badge-breaking-${article.id}`}
                          >
                            <Zap className="h-3 w-3" />
                            عاجل
                          </Badge>
                        ) : isNewArticle(article.publishedAt) ? (
                          <Badge 
                            className="absolute top-3 right-3 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600" 
                            data-testid={`badge-new-${article.id}`}
                          >
                            <Flame className="h-3 w-3" />
                            جديد
                          </Badge>
                        ) : article.category ? (
                          <Badge 
                            className="absolute top-3 right-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0" 
                            data-testid={`badge-category-${article.id}`}
                          >
                            {article.category.nameAr}
                          </Badge>
                        ) : null}
                        {article.aiSummary && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                              <Sparkles className="h-3 w-3 ml-1" />
                              ذكاء اصطناعي
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CardContent className="p-4 space-y-3">
                      <h3 
                        className={`font-bold text-lg line-clamp-2 ${
                          article.newsType === "breaking"
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                        data-testid={`text-article-title-${article.id}`}
                      >
                        {article.title}
                      </h3>
                      
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        {article.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(article.publishedAt), {
                                addSuffix: true,
                                locale: arSA,
                              })}
                            </span>
                          </div>
                        )}
                        
                        <ViewsCount 
                          views={article.views || 0}
                          iconClassName="h-3 w-3"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
