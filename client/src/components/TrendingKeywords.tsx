import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Hash, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="rounded-xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">الكلمات الأكثر تداولًا</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">الكلمات الأكثر تداولًا</h2>
        </div>
        <p className="text-sm text-muted-foreground">حدث خطأ أثناء تحميل الكلمات المتداولة</p>
      </div>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">الكلمات الأكثر تداولًا</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-4">
          <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            لا توجد كلمات متداولة حاليًا — تابع آخر الأخبار لمعرفة ما يشغل القراء
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Hash className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">الكلمات الأكثر تداولًا</h2>
      </div>
      
      <div className="flex flex-wrap gap-2" dir="rtl">
        {keywords.map((item) => (
          <motion.button
            key={item.keyword}
            onClick={() => setLocation(`/keyword/${encodeURIComponent(item.keyword)}`)}
            className={`${getCategoryColor(item.category)} text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-sm transition-all duration-200 cursor-pointer border-0 text-sm font-medium`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            data-testid={`trending-keyword-${item.keyword}`}
            aria-label={`الكلمة المفتاحية ${item.keyword} مع ${item.count} ${item.count === 1 ? 'مقال' : 'مقالات'}`}
          >
            <span>#{item.keyword}</span>
            <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold">
              {item.count}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
