import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Hash, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowKeywordButton } from "@/components/FollowKeywordButton";

interface TrendingKeyword {
  keyword: string;
  count: number;
  category?: string;
}

const getCategoryColor = (category?: string): string => {
  if (!category) return "bg-primary/80 dark:bg-primary/70";
  
  switch (category) {
    case "سياسة":
      return "bg-red-600/90 dark:bg-red-500/80";
    case "اقتصاد":
      return "bg-green-600/90 dark:bg-green-500/80";
    case "رياضة":
      return "bg-blue-600/90 dark:bg-blue-500/80";
    case "تقنية":
      return "bg-purple-600/90 dark:bg-purple-500/80";
    default:
      return "bg-primary/80 dark:bg-primary/70";
  }
};

export function TrendingKeywords() {
  const [, setLocation] = useLocation();

  const { data: keywords, isLoading, error } = useQuery<TrendingKeyword[]>({
    queryKey: ["/api/trending-keywords"],
    refetchInterval: 600000,
  });

  if (isLoading) {
    return (
      <section className="space-y-4" dir="rtl">
        <div className="flex items-center gap-2">
          <Hash className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">الكلمات الأكثر تداولًا</h2>
        </div>
        
        <p className="text-muted-foreground">
          الكلمات الأكثر تداولًا خلال الـ 7 أيام الماضية
        </p>
        
        <div className="flex flex-wrap gap-3 p-6 bg-card rounded-lg border">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" dir="rtl">
        <div className="flex items-center gap-2">
          <Hash className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">الكلمات الأكثر تداولًا</h2>
        </div>
        
        <p className="text-muted-foreground">
          الكلمات الأكثر تداولًا خلال الـ 7 أيام الماضية
        </p>
        
        <div className="flex flex-wrap gap-3 p-6 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">حدث خطأ أثناء تحميل الكلمات المتداولة</p>
        </div>
      </section>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <section className="space-y-4" dir="rtl">
        <div className="flex items-center gap-2">
          <Hash className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">الكلمات الأكثر تداولًا</h2>
        </div>
        
        <p className="text-muted-foreground">
          الكلمات الأكثر تداولًا خلال الـ 7 أيام الماضية
        </p>
        
        <div className="flex flex-wrap gap-3 p-6 bg-card rounded-lg border">
          <div className="flex flex-col items-center justify-center py-4 w-full">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              لا توجد كلمات متداولة حاليًا — تابع آخر الأخبار لمعرفة ما يشغل القراء
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Hash className="h-6 w-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold" data-testid="heading-trending-keywords">
          الكلمات الأكثر تداولًا
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        الكلمات الأكثر تداولًا خلال الـ 7 أيام الماضية
      </p>

      <div className="flex flex-wrap gap-3 p-6 bg-card rounded-lg border">
        {keywords
          .filter((item) => item.keyword && typeof item.keyword === 'string' && item.keyword.trim())
          .map((item) => (
            <motion.div
              key={item.keyword}
              className="flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.button
                onClick={() => setLocation(`/keyword/${encodeURIComponent(item.keyword)}`)}
                className="bg-card hover-elevate active-elevate-2 border px-4 py-2 rounded-full flex items-center gap-2 shadow-sm transition-all duration-200 cursor-pointer text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                data-testid={`trending-keyword-${item.keyword}`}
                aria-label={`الكلمة المفتاحية ${item.keyword} مع ${item.count} ${item.count === 1 ? 'مقال' : 'مقالات'}`}
              >
                <span className="text-primary font-semibold">#{item.keyword}</span>
                <span className="bg-primary/10 px-2 py-0.5 rounded-full text-xs font-semibold text-primary">
                  {item.count}
                </span>
              </motion.button>
              <FollowKeywordButton keyword={item.keyword} variant="ghost" size="icon" />
            </motion.div>
          ))}
      </div>
    </section>
  );
}
