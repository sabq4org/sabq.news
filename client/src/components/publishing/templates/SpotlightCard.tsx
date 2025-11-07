import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, MessageSquare, BookOpen, Flame } from "lucide-react";
import type { SpotlightTemplateProps } from "@/lib/publishing/types";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { ViewsCount } from "@/components/ViewsCount";

// Helper function to check if article is new (published within last 3 hours)
const isNewArticle = (publishedAt: Date | string | null | undefined) => {
  if (!publishedAt) return false;
  const published = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 3;
};

export default function SpotlightCard({
  item,
  accent = "hsl(var(--primary))",
  className,
  onView,
}: SpotlightTemplateProps) {
  if (!item) return null;

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`group overflow-hidden rounded-2xl border bg-card shadow-lg hover-elevate active-elevate-2 transition-all ${className || ""}`}
      dir="rtl"
      role="article"
      aria-label={item.title}
      data-testid="template-spotlight-card"
    >
      {/* Image */}
      {item.image && (
        <Link href={`/${item.slug}`}>
          <a onClick={onView}>
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {item.newsType === "breaking" && (
                <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm">
                  عاجل
                </div>
              )}
              {isNewArticle(item.publishedAt) && item.newsType !== "breaking" && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  جديد
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </a>
        </Link>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        {item.category && (
          <div className="mb-3">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: item.category.color || accent }}
            >
              {item.category.name}
            </span>
          </div>
        )}

        {/* Title */}
        <Link href={`/${item.slug}`}>
          <a onClick={onView}>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 line-clamp-3 hover:underline decoration-2 underline-offset-4">
              {item.title}
            </h2>
          </a>
        </Link>

        {/* Excerpt */}
        {item.excerpt && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {item.excerpt}
          </p>
        )}

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-b my-4">
          {typeof item.views === "number" && (
            <ViewsCount 
              views={item.views}
              iconClassName="w-4 h-4"
            />
          )}
          {typeof item.commentsCount === "number" && (
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{item.commentsCount.toLocaleString("ar")}</span>
              <span className="text-muted-foreground text-xs">تعليق</span>
            </div>
          )}
          {typeof item.readingTime === "number" && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{item.readingTime}</span>
              <span className="text-muted-foreground text-xs">دقيقة</span>
            </div>
          )}
          {item.publishedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: ar })}
              </span>
            </div>
          )}
        </div>

        {/* Author/Reporter */}
        {(item.author || item.reporter) && (
          <div className="flex items-center gap-3">
            {(item.reporter || item.author)?.avatar && (
              <img
                src={(item.reporter || item.author)!.avatar!}
                alt={(item.reporter || item.author)!.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {(item.reporter || item.author)?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.reporter ? "مراسل" : "كاتب"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
