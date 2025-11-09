import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Target, 
  Sparkles, 
  Flame, 
  Eye, 
  Clock,
  Zap,
  LogIn 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

type TrendMode = 'daily' | 'personalized' | 'predictive';

interface TrendingArticle {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  imageUrl?: string | null;
  newsType?: string | null;
  views?: number;
  rank?: number;
  trendScore?: number;
  trendReason?: string;
  category?: {
    nameAr: string;
    slug: string;
    color: string | null;
    icon?: string | null;
  } | null;
  imageFocalPoint?: {
    x: number;
    y: number;
  } | null;
}

interface TrendingData {
  articles: TrendingArticle[];
  requiresAuth?: boolean;
}

const modes = [
  { value: 'daily' as TrendMode, label: 'النبض اليومي', icon: TrendingUp },
  { value: 'personalized' as TrendMode, label: 'توصيات شخصية', icon: Target },
  { value: 'predictive' as TrendMode, label: 'التنبؤ بالاتجاهات', icon: Sparkles },
];

function TrendingArticleCard({ article, index }: { article: TrendingArticle; index: number }) {
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: arSA,
      })
    : null;

  return (
    <Link href={`/article/${article.slug}`} data-testid={`link-trending-${article.id}`}>
      <Card 
        className={`hover-elevate active-elevate-2 h-full cursor-pointer overflow-hidden group border-0 dark:border dark:border-card-border ${
          article.newsType === "breaking" ? "bg-destructive/5" : ""
        }`}
        data-testid={`card-trending-${article.id}`}
      >
        {article.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              style={{
                objectPosition: article.imageFocalPoint
                  ? `${article.imageFocalPoint.x}% ${article.imageFocalPoint.y}%`
                  : 'center'
              }}
            />
            
            {/* Rank Badge */}
            {article.rank && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                #{article.rank}
              </div>
            )}

            {/* Breaking Badge */}
            {article.newsType === "breaking" && (
              <Badge 
                variant="destructive" 
                className="absolute bottom-3 right-3 gap-1"
                data-testid={`badge-trending-breaking-${article.id}`}
              >
                <Zap className="h-3 w-3" />
                عاجل
              </Badge>
            )}
          </div>
        )}

        <CardContent className="p-4 space-y-3">
          {/* Category */}
          {article.category && (
            <Badge 
              variant="outline" 
              className="text-xs"
              data-testid={`badge-trending-category-${article.id}`}
            >
              {article.category.icon} {article.category.nameAr}
            </Badge>
          )}

          {/* Title */}
          <h3 
            className={`font-bold text-base line-clamp-2 transition-colors ${
              article.newsType === "breaking"
                ? "text-destructive"
                : "group-hover:text-primary"
            }`}
            data-testid={`text-trending-title-${article.id}`}
          >
            {article.title}
          </h3>

          {/* Trend Reason */}
          {article.trendReason && (
            <p className="text-xs text-muted-foreground line-clamp-2 flex items-start gap-1">
              <TrendingUp className="h-3 w-3 flex-shrink-0 mt-0.5 text-primary" />
              <span>{article.trendReason}</span>
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {timeAgo && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              )}
              {article.views !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.views.toLocaleString('ar-SA')}
                </span>
              )}
            </div>
            {article.trendScore && (
              <Badge variant="secondary" className="text-xs">
                {article.trendScore}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" dir="rtl">
      {/* Header Skeleton */}
      <div className="grid grid-cols-[auto,1fr] gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Mode Buttons Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ mode }: { mode: TrendMode }) {
  if (mode === 'personalized') {
    return (
      <div 
        className="text-center py-12 space-y-4" 
        dir="rtl"
        data-testid="empty-state-personalized"
      >
        <LogIn className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
        <div>
          <h3 className="text-lg font-semibold mb-2">سجّل الدخول لرؤية التوصيات الشخصية</h3>
          <p className="text-sm text-muted-foreground">
            احصل على مقالات مخصصة بناءً على اهتماماتك وقراءاتك السابقة
          </p>
        </div>
        <Link href="/login" data-testid="link-trending-login">
          <Button>
            <LogIn className="h-4 w-4 ml-2" />
            تسجيل الدخول
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="text-center py-12 space-y-4" 
      dir="rtl"
      data-testid="empty-state-general"
    >
      <Flame className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
      <div>
        <h3 className="text-lg font-semibold mb-2">لا توجد مقالات رائجة حالياً</h3>
        <p className="text-sm text-muted-foreground">
          تحقق مرة أخرى لاحقاً للحصول على أحدث المقالات الشائعة
        </p>
      </div>
    </div>
  );
}

export function TrendingSection() {
  const [mode, setMode] = useState<TrendMode>('daily');

  const { data, isLoading } = useQuery<TrendingData>({
    queryKey: ['/api/trends', mode],
    queryFn: async () => {
      const res = await fetch(`/api/trends?mode=${mode}&limit=10`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch trending articles');
      return res.json();
    },
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const articles = data?.articles || [];
  const showEmptyState = articles.length === 0 || data?.requiresAuth;

  const getModeTitle = () => {
    switch (mode) {
      case 'daily':
        return 'النبض اليومي';
      case 'personalized':
        return 'توصيات شخصية';
      case 'predictive':
        return 'التنبؤ بالاتجاهات';
    }
  };

  return (
    <section className="space-y-4" dir="rtl" data-testid="section-trending">
      {/* Header: Icon Pill + Title */}
      <div className="grid grid-cols-[auto,1fr] gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
          <Flame className="h-3.5 w-3.5 text-white" />
        </div>
        <h2 
          className="text-2xl md:text-3xl font-bold text-primary"
          data-testid="heading-trending"
        >
          {getModeTitle()}
        </h2>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 flex-wrap">
        {modes.map((m) => (
          <Button
            key={m.value}
            variant={mode === m.value ? "default" : "outline"}
            onClick={() => setMode(m.value)}
            className="gap-2"
            data-testid={`button-mode-${m.value}`}
          >
            <m.icon className="h-4 w-4" />
            {m.label}
          </Button>
        ))}
      </div>

      {/* Articles Grid or Empty State */}
      {showEmptyState ? (
        <EmptyState mode={mode} />
      ) : (
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <TrendingArticleCard article={article} index={index} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
