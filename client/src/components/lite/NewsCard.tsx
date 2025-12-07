import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Clock, ChevronDown, Share2, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import type { Article, Category, User } from "@shared/schema";

type ArticleWithDetails = Article & {
  category?: Category;
  author?: User;
  commentsCount?: number;
  reactionsCount?: number;
};

interface NewsCardProps {
  article: ArticleWithDetails;
  onDetailsOpen?: () => void;
  onDetailsClose?: () => void;
}

function getOptimizedImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  if (url.includes('/public-objects/')) {
    const pathMatch = url.match(/\/public-objects\/(.+)/);
    if (pathMatch) {
      const imagePath = pathMatch[1];
      return `/api/images/optimize?path=${encodeURIComponent(imagePath)}&w=1080&q=70&f=webp`;
    }
  }
  
  return url;
}

export function NewsCard({ article, onDetailsOpen, onDetailsClose }: NewsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const rawImageUrl = article.imageUrl || article.thumbnailUrl;
  const imageUrl = useMemo(() => getOptimizedImageUrl(rawImageUrl), [rawImageUrl]);
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : new Date();
  const smartSummary = article.aiSummary || article.excerpt;
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: false, locale: arSA });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      onDetailsOpen?.();
    } else {
      onDetailsClose?.();
    }
  };

  return (
    <div 
      className="relative w-full h-full snap-start overflow-hidden bg-black text-white shrink-0"
      style={{ height: '100dvh' }}
      dir="rtl"
      data-testid={`news-card-${article.id}`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          draggable={false}
        />
      )}

      <div 
        className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90"
      />

      <div className="absolute inset-x-0 bottom-0 p-6 pb-12 flex flex-col items-start gap-4 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 text-xs font-medium text-white/70"
        >
          {article.category && (
            <span 
              className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10"
              data-testid="badge-category"
            >
              {article.category.nameAr}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-4xl font-bold leading-tight tracking-tight text-right w-full"
          data-testid="text-article-title"
        >
          {article.title}
        </motion.h1>

        {smartSummary && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-lg text-gray-300 leading-relaxed max-w-[90%] text-right w-full line-clamp-3"
          >
            {smartSummary}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="w-full flex items-center justify-between mt-4"
        >
          <Drawer open={isOpen} onOpenChange={handleOpenChange}>
            <DrawerTrigger asChild>
              <button
                className="text-black bg-white hover:bg-white/90 border-none rounded-full px-6 py-3 font-bold text-base transition-colors"
                data-testid="button-read-details"
              >
                اقرأ التفاصيل
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-[92vh] bg-black border-t border-white/10 text-white rounded-t-3xl">
              <div className="relative h-full overflow-y-auto pt-14 pb-20">
                <button
                  onClick={() => handleOpenChange(false)}
                  className="absolute top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white/20 backdrop-blur-md w-10 h-10 flex items-center justify-center"
                  data-testid="button-close-details"
                >
                  <ChevronDown className="w-7 h-7 text-white" />
                </button>

                {imageUrl && (
                  <div className="h-[40vh] w-full">
                    <img
                      src={imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 mb-4">
                    {article.category && (
                      <span 
                        className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-sm"
                      >
                        {article.category.nameAr}
                      </span>
                    )}
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(publishedDate, { addSuffix: true, locale: arSA })}
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold text-white leading-tight mb-4">
                    {article.title}
                  </h1>

                  {article.author && (
                    <p className="text-white/60 text-sm mb-6">
                      بقلم: {article.author.firstName} {article.author.lastName}
                    </p>
                  )}

                  <div 
                    className="text-lg leading-relaxed text-gray-300 font-light prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content || smartSummary || '' }}
                  />
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 flex items-center justify-center gap-4">
                  <button 
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10"
                    data-testid="button-share"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10"
                    data-testid="button-bookmark"
                  >
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <div className="flex flex-col items-center gap-1 animate-bounce text-white/50">
            <ChevronDown className="w-6 h-6" />
            <span className="text-[10px] uppercase tracking-widest opacity-60">اسحب</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
