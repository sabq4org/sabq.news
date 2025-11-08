import { motion } from "framer-motion";
import { Link } from "wouter";
import { BrainCircuit, Home, Sparkles, Search, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-primary/20 to-slate-950 text-foreground dark:text-white text-center px-6 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * dimensions.width,
              y: Math.random() * dimensions.height,
            }}
            animate={{
              y: [null, Math.random() * dimensions.height],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center space-y-6 relative z-10"
      >
        {/* AI Brain Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <BrainCircuit className="w-20 h-20 text-primary animate-pulse" data-testid="icon-brain-404" />
        </motion.div>

        {/* 404 Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h1 className="text-7xl font-bold text-primary" data-testid="text-404-title">404</h1>
          <h2 className="text-3xl font-semibold" data-testid="text-page-not-found">الصفحة المفقودة</h2>
        </motion.div>

        {/* AI Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-md space-y-3"
        >
          <p className="text-lg text-foreground/80 dark:text-gray-300 flex items-center justify-center gap-2" data-testid="text-404-message">
            <Bot className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">الذكاء الاصطناعي يقول:</span>
          </p>
          <p className="text-base text-muted-foreground dark:text-gray-400 leading-relaxed">
            يبدو أنك دخلت في <span className="text-primary">ثقب أسود رقمي</span>! 
            لكن لا تقلق، الذكاء الاصطناعي لسبق يحاول الآن إعادة توجيهك إلى المسار الصحيح...
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 mt-8"
        >
          <Button
            size="lg"
            className="flex items-center gap-2 text-base px-6"
            data-testid="button-home-404"
            asChild
          >
            <Link href="/">
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="flex items-center gap-2 text-base px-6 border-primary/40"
            data-testid="button-search-404"
            asChild
          >
            <Link href="/ar/search">
              <Search className="w-5 h-5" />
              البحث في الموقع
            </Link>
          </Button>
        </motion.div>

        {/* Fun Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 space-y-3"
        >
          <p className="text-sm text-muted-foreground dark:text-gray-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            اقتراحات ذكية من المساعد الرقمي
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              data-testid="link-news-404"
              asChild
            >
              <Link href="/ar/news">الأخبار</Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              data-testid="link-categories-404"
              asChild
            >
              <Link href="/ar/categories">الأقسام</Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              data-testid="link-mirqab-404"
              asChild
            >
              <Link href="/ar/mirqab">مرقاب</Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              data-testid="link-opinion-404"
              asChild
            >
              <Link href="/ar/opinion">الرأي</Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Badge */}
      <motion.div
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mt-16 text-sm text-muted-foreground dark:text-gray-600 relative z-10 flex items-center gap-2"
        data-testid="text-footer-404"
      >
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-primary font-semibold">سبق الذكية</span> — حتى الصفحات المفقودة عندنا عندها شخصية
      </motion.div>
    </div>
  );
}
