import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Hash,
  Share2,
  TrendingUp,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails } from "@shared/schema";
import { useLocation } from "wouter";

interface ArticleMetaSidebarProps {
  article: ArticleWithDetails;
  wordCount?: number;
  readingTime?: number;
}

export function ArticleMetaSidebar({ article, wordCount = 0, readingTime = 0 }: ArticleMetaSidebarProps) {
  const [, setLocation] = useLocation();

  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: arSA,
      })
    : null;

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Card className="sticky top-24">
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          معلومات المقال
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Reading Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              وقت القراءة
            </span>
            <span className="font-medium" data-testid="text-reading-time">
              {readingTime} دقيقة
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              عدد الكلمات
            </span>
            <span className="font-medium" data-testid="text-word-count">
              {wordCount.toLocaleString("en-US")}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              تاريخ النشر
            </span>
            <span className="font-medium text-xs" data-testid="text-published-date">
              {publishedDate}
            </span>
          </div>

          {timeAgo && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                منذ
              </span>
              <span className="font-medium text-xs">
                {timeAgo}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Engagement Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              المشاهدات
            </span>
            <span className="font-medium" data-testid="text-views-count">
              {(article.views || 0).toLocaleString("en-US")}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              الإعجابات
            </span>
            <span className="font-medium" data-testid="text-reactions-count">
              {(article.reactionsCount || 0).toLocaleString("en-US")}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              التعليقات
            </span>
            <span className="font-medium" data-testid="text-comments-count">
              {(article.commentsCount || 0).toLocaleString("en-US")}
            </span>
          </div>
        </div>

        {/* Keywords */}
        {article.seo?.keywords && article.seo.keywords.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>الكلمات المفتاحية</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.seo.keywords.slice(0, 5).map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover-elevate text-xs"
                    onClick={() => setLocation(`/keyword/${encodeURIComponent(keyword)}`)}
                    data-testid={`badge-keyword-${index}`}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Category & Type */}
        {article.category && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>التصنيف</span>
              </div>
              <Badge variant="default" className="text-sm">
                {article.category.icon} {article.category.nameAr}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
