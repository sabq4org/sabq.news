import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MessageSquare,
  Eye,
  Flame,
  Zap,
  Sparkles,
  Bookmark,
  Share2,
  BookOpen,
  Brain,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails } from "@shared/schema";
import { useState } from "react";
import { InfographicBadge, InfographicBadgeIcon } from "./InfographicBadge";

type ViewMode = 'grid' | 'list' | 'compact';

interface NewsArticleCardProps {
  article: ArticleWithDetails;
  viewMode: ViewMode;
}

const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

const getReadingTime = (content?: string) => {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export function NewsArticleCard({ article, viewMode }: NewsArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: arSA,
      })
    : null;

  const readingTime = getReadingTime(article.content);

  const categoryName = article.category?.nameAr || 'أخبار';
  const ariaLabel = `مقال: ${article.title}${article.newsType === "breaking" ? ' - عاجل' : ''} - ${categoryName}${timeAgo ? ` - ${timeAgo}` : ''}`;

  if (viewMode === 'grid') {
    return (
      <Card
        className="cursor-pointer h-full overflow-hidden hover-elevate transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`card-article-grid-${article.id}`}
        role="article"
        aria-label={ariaLabel}
      >
        <Link href={`/article/${article.slug}`}>
          <div className="block">
            {(article.imageUrl || article.thumbnailUrl) && (
              <div className="relative h-56 overflow-hidden">
                <img
                  src={article.thumbnailUrl ?? article.imageUrl ?? ''}
                  alt={article.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isHovered ? 'scale-110' : 'scale-100'
                  }`}
                  loading="lazy"
                  style={{
                    objectPosition: article.imageFocalPoint
                      ? `${article.imageFocalPoint.x}% ${article.imageFocalPoint.y}%`
                      : 'center'
                  }}
                />

                {isHovered && (
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 backdrop-blur-sm bg-background/90"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      data-testid={`button-bookmark-${article.id}`}
                      aria-label={`حفظ المقال: ${article.title}`}
                    >
                      <Bookmark className="h-4 w-4 ml-2" aria-hidden="true" />
                      حفظ
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 backdrop-blur-sm bg-background/90"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      data-testid={`button-share-${article.id}`}
                      aria-label={`مشاركة المقال: ${article.title}`}
                    >
                      <Share2 className="h-4 w-4 ml-2" aria-hidden="true" />
                      مشاركة
                    </Button>
                  </div>
                )}
              </div>
            )}

            <CardContent className="p-5 space-y-3">
              {/* Badges above title */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* AI Generated Thumbnail Badge */}
                {article.isAiGeneratedThumbnail && (
                  <Badge className="text-xs h-5 gap-1 bg-purple-500/90 hover:bg-purple-600 text-white border-0" data-testid={`badge-ai-thumbnail-${article.id}`}>
                    الصورة
                    <Brain className="h-2.5 w-2.5" aria-hidden="true" />
                  </Badge>
                )}

                {/* Content Type Badge */}
                {article.newsType === "breaking" ? (
                  <Badge variant="destructive" className="text-xs h-5 gap-1" data-testid={`badge-content-type-${article.id}`}>
                    <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                    عاجل
                  </Badge>
                ) : isNewArticle(article.publishedAt) ? (
                  <Badge className="text-xs h-5 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600" data-testid={`badge-content-type-${article.id}`}>
                    <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                    جديد
                  </Badge>
                ) : article.articleType === 'infographic' ? (
                  <Badge className="text-xs h-5 bg-muted text-muted-foreground border-0" data-testid={`badge-content-type-${article.id}`}>
                    إنفوجرافيك
                  </Badge>
                ) : article.category ? (
                  <Badge className="text-xs h-5 bg-muted text-muted-foreground border-0" data-testid={`badge-content-type-${article.id}`}>
                    {article.category.nameAr}
                  </Badge>
                ) : null}
              </div>

              <h3
                className={`font-bold text-lg line-clamp-2 leading-snug ${
                  article.newsType === "breaking"
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {article.title}
              </h3>

              {article.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                {timeAgo && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {timeAgo}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  {(article.views || 0).toLocaleString('en-US')}
                </div>
                {(article.commentsCount ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" aria-hidden="true" />
                    {(article.commentsCount ?? 0).toLocaleString('en-US')}
                  </div>
                )}
                {readingTime > 0 && (
                  <div className="flex items-center gap-1 mr-auto">
                    <BookOpen className="h-3 w-3" aria-hidden="true" />
                    {readingTime} د
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Link>
      </Card>
    );
  }

  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer hover-elevate transition-all" data-testid={`card-article-list-${article.id}`} role="article" aria-label={ariaLabel}>
        <Link href={`/article/${article.slug}`}>
          <div className="block">
            <CardContent className="p-0">
              <div className="flex gap-5 p-5">
                {(article.imageUrl || article.thumbnailUrl) && (
                  <div className="relative flex-shrink-0 w-64 h-40 rounded-lg overflow-hidden">
                    <img
                      src={article.thumbnailUrl ?? article.imageUrl ?? ''}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      style={{
                        objectPosition: article.imageFocalPoint
                          ? `${article.imageFocalPoint.x}% ${article.imageFocalPoint.y}%`
                          : 'center'
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  {/* Badges above title */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* AI Generated Thumbnail Badge */}
                    {article.isAiGeneratedThumbnail && (
                      <Badge className="text-xs h-5 gap-1 bg-purple-500/90 hover:bg-purple-600 text-white border-0" data-testid={`badge-ai-thumbnail-${article.id}`}>
                        الصورة
                        <Brain className="h-2.5 w-2.5" aria-hidden="true" />
                      </Badge>
                    )}

                    {/* Content Type Badge */}
                    {article.newsType === "breaking" ? (
                      <Badge variant="destructive" className="text-xs h-5 gap-1" data-testid={`badge-content-type-${article.id}`}>
                        <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                        عاجل
                      </Badge>
                    ) : isNewArticle(article.publishedAt) ? (
                      <Badge className="text-xs h-5 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600" data-testid={`badge-content-type-${article.id}`}>
                        <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                        جديد
                      </Badge>
                    ) : article.articleType === 'infographic' ? (
                      <Badge className="text-xs h-5 bg-muted text-muted-foreground border-0" data-testid={`badge-content-type-${article.id}`}>
                        إنفوجرافيك
                      </Badge>
                    ) : article.category ? (
                      <Badge className="text-xs h-5 bg-muted text-muted-foreground border-0" data-testid={`badge-content-type-${article.id}`}>
                        {article.category.nameAr}
                      </Badge>
                    ) : null}
                  </div>

                  <h3
                    className={`font-bold text-xl line-clamp-2 ${
                      article.newsType === "breaking"
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {timeAgo && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {timeAgo}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      {(article.views || 0).toLocaleString('en-US')} مشاهدة
                    </div>
                    {(article.commentsCount ?? 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        {(article.commentsCount ?? 0).toLocaleString('en-US')} تعليق
                      </div>
                    )}
                    {readingTime > 0 && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        {readingTime} دقائق قراءة
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => e.preventDefault()}
                      data-testid={`button-bookmark-${article.id}`}
                      aria-label={`حفظ المقال: ${article.title}`}
                    >
                      <Bookmark className="h-4 w-4 ml-2" aria-hidden="true" />
                      حفظ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => e.preventDefault()}
                      data-testid={`button-share-${article.id}`}
                      aria-label={`مشاركة المقال: ${article.title}`}
                    >
                      <Share2 className="h-4 w-4 ml-2" aria-hidden="true" />
                      مشاركة
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Link>
      </Card>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div className="border-b last:border-b-0 hover-elevate" data-testid={`card-article-compact-${article.id}`} role="article" aria-label={ariaLabel}>
        <Link href={`/article/${article.slug}`}>
          <div className="block p-4">
            <div className="flex gap-3">
              {(article.imageUrl || article.thumbnailUrl) && (
                <div className="relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden">
                  <img
                    src={article.thumbnailUrl ?? article.imageUrl ?? ''}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    style={{
                      objectPosition: article.imageFocalPoint
                        ? `${article.imageFocalPoint.x}% ${article.imageFocalPoint.y}%`
                        : 'center'
                    }}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-2">
                {/* Badges moved above title */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* AI Generated Thumbnail Badge */}
                  {article.isAiGeneratedThumbnail && (
                    <Badge className="text-xs h-5 gap-1 bg-purple-500/90 hover:bg-purple-600 text-white border-0" data-testid={`badge-ai-thumbnail-${article.id}`}>
                      الصورة
                      <Brain className="h-2.5 w-2.5" aria-hidden="true" />
                    </Badge>
                  )}

                  {/* Content Type Badge */}
                  {article.newsType === "breaking" ? (
                    <Badge variant="destructive" className="text-xs h-5 gap-1" data-testid={`badge-content-type-${article.id}`}>
                      <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                      عاجل
                    </Badge>
                  ) : isNewArticle(article.publishedAt) ? (
                    <Badge className="text-xs h-5 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600" data-testid={`badge-content-type-${article.id}`}>
                      <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                      جديد
                    </Badge>
                  ) : article.articleType === 'infographic' ? (
                    <Badge className="text-xs h-5 bg-muted text-muted-foreground border-0" data-testid={`badge-content-type-${article.id}`}>
                      إنفوجرافيك
                    </Badge>
                  ) : article.category ? (
                    <Badge className="text-xs h-5 bg-muted text-muted-foreground border-0" data-testid={`badge-content-type-${article.id}`}>
                      {article.category.nameAr}
                    </Badge>
                  ) : null}
                </div>

                <h4
                  className={`font-bold text-sm line-clamp-2 leading-snug ${
                    article.newsType === "breaking"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {article.title}
                </h4>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {timeAgo && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {timeAgo}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    {(article.views || 0).toLocaleString('en-US')}
                  </span>
                  {(article.commentsCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" aria-hidden="true" />
                      {(article.commentsCount ?? 0).toLocaleString('en-US')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return null;
}
