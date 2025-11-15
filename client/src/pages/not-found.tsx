import { motion } from "framer-motion";
import { Link } from "wouter";
import { BrainCircuit, Home, Sparkles, Search, Bot, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface TrendingArticle {
  articleId: string;
  title: string;
  score: number;
}

interface TrendingResponse {
  trending: TrendingArticle[];
}

export default function NotFound() {
  const { data, isLoading } = useQuery<TrendingResponse>({
    queryKey: ['/api/recommendations/trending'],
    queryFn: async () => {
      const response = await fetch('/api/recommendations/trending?limit=4');
      if (!response.ok) throw new Error('Failed to fetch trending articles');
      return response.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const trendingArticles = data?.trending || [];
  const hasTrendingArticles = trendingArticles.length > 0;

  const fallbackLinks = [
    { href: "/news", label: "الأخبار", testId: "link-news-404" },
    { href: "/categories", label: "الأقسام", testId: "link-categories-404" },
    { href: "/mirqab", label: "مرقاب", testId: "link-mirqab-404" },
    { href: "/opinion", label: "الرأي", testId: "link-opinion-404" },
  ];

  return (
    <div 
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center gradient-404-animate text-white text-center px-6 py-12 relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center space-y-8 relative z-10 max-w-4xl w-full"
      >
        {/* AI Brain Icon */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative">
            <BrainCircuit 
              className="w-24 h-24 text-primary drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]" 
              data-testid="icon-brain-404" 
              aria-hidden="true"
            />
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        {/* 404 Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h1 
            className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent" 
            data-testid="text-404-title"
            role="heading"
            aria-level={1}
          >
            404
          </h1>
          <h2 
            className="text-3xl md:text-4xl font-bold text-white" 
            data-testid="text-page-not-found"
            role="heading"
            aria-level={2}
          >
            الصفحة المفقودة
          </h2>
        </motion.div>

        {/* AI Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl space-y-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <p className="text-xl font-semibold text-white flex items-center justify-center gap-3" data-testid="text-404-message">
            <Bot className="w-6 h-6 text-primary" aria-hidden="true" />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              الذكاء الاصطناعي يقول:
            </span>
          </p>
          <p className="text-base md:text-lg text-gray-200 leading-relaxed">
            يبدو أنك دخلت في <span className="text-primary font-bold">ثقب أسود رقمي</span>! 
            لكن لا تقلق، نظام سبق الذكي سيساعدك على إيجاد طريقك...
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 mt-4"
        >
          <Button
            size="lg"
            className="flex items-center gap-2 text-base px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
            data-testid="button-home-404"
            aria-label="العودة إلى الصفحة الرئيسية"
            asChild
          >
            <Link href="/">
              <Home className="w-5 h-5" aria-hidden="true" />
              العودة للرئيسية
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="flex items-center gap-2 text-base px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            data-testid="button-chatbot-404"
            aria-label="اسأل المساعد الذكي للحصول على المساعدة"
            asChild
          >
            <Link href="/chatbot">
              <Bot className="w-5 h-5" aria-hidden="true" />
              اسأل المساعد الذكي
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="flex items-center gap-2 text-base px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            data-testid="button-search-404"
            aria-label="البحث في الموقع عن المحتوى"
            asChild
          >
            <Link href="/search">
              <Search className="w-5 h-5" aria-hidden="true" />
              البحث في الموقع
            </Link>
          </Button>
        </motion.div>

        {/* Smart Suggestions - Trending Articles or Fallback */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-base font-semibold text-white flex items-center justify-center gap-2 mb-6">
              {hasTrendingArticles ? (
                <>
                  <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span className="text-primary">المقالات الرائجة الآن</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span className="text-primary">اقتراحات ذكية من المساعد الرقمي</span>
                </>
              )}
            </p>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="h-12 w-full bg-white/10 rounded-lg" 
                    data-testid={`skeleton-trending-${i}`}
                  />
                ))}
              </div>
            ) : hasTrendingArticles ? (
              <div className="space-y-3">
                {trendingArticles.slice(0, 4).map((article, index) => (
                  <motion.div
                    key={article.articleId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-right h-auto py-3 px-4 text-white hover:bg-white/10 rounded-lg"
                      data-testid={`link-trending-${article.articleId}`}
                      aria-label={`اقرأ المقال: ${article.title}`}
                      asChild
                    >
                      <Link href={`/articles/${article.articleId}`}>
                        <div className="flex items-center gap-3 w-full">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm font-medium line-clamp-1">
                            {article.title}
                          </span>
                          <TrendingUp className="w-4 h-4 text-primary/60 flex-shrink-0" aria-hidden="true" />
                        </div>
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {fallbackLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm px-5 py-2 text-white hover:bg-white/10 rounded-lg"
                      data-testid={link.testId}
                      aria-label={`انتقل إلى ${link.label}`}
                      asChild
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Badge */}
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mt-12 text-sm text-gray-400 relative z-10 flex items-center gap-2"
        data-testid="text-footer-404"
        role="contentinfo"
      >
        <Bot className="w-4 h-4 text-primary" aria-hidden="true" />
        <span>
          <span className="text-primary font-bold">سبق الذكية</span> 
          <span className="mx-1">—</span>
          حتى الصفحات المفقودة عندنا عندها شخصية
        </span>
      </motion.div>
    </div>
  );
}
