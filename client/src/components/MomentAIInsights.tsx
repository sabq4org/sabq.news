import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Users, 
  MessageCircle,
  BarChart3,
  Activity,
  Brain,
  Lightbulb,
  Target,
  Flame,
  Clock,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIInsightsData {
  dailySummary: string;
  topTopics: Array<{ name: string; score: number }>;
  activityTrend: string;
  userEngagement: {
    activeUsers: number;
    totalComments: number;
    totalReactions: number;
  };
  keyHighlights: string[];
}

function InsightSkeleton() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
      <CardHeader>
        <Skeleton className="h-7 w-56" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Summary Skeleton */}
        <div className="p-5 bg-card rounded-xl">
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>

        {/* Topics Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MomentAIInsights() {
  const { data, isLoading } = useQuery<AIInsightsData>({
    queryKey: ["/api/moment/ai-insights"],
  });

  if (isLoading) {
    return <InsightSkeleton />;
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative shadow-xl"
        data-testid="card-ai-insights"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--primary) / 0.2) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <CardHeader className="relative z-10 pb-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="flex items-center gap-3 flex-wrap">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl"
              >
                <Brain className="h-6 w-6 text-primary" />
              </motion.div>
              <div className="flex-1">
                <span className="text-2xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                  نبض اللحظة
                </span>
                <p className="text-sm text-muted-foreground font-normal mt-0.5">
                  تحليل ذكي مدعوم بالذكاء الاصطناعي
                </p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge variant="outline" className="gap-2 border-green-500/30 bg-green-500/10 text-green-600 px-3 py-1">
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-green-500"
                  />
                  <Activity className="h-4 w-4" />
                  حي
                </Badge>
              </motion.div>
            </CardTitle>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* AI Summary - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 bg-gradient-to-br from-card via-card to-card/50 rounded-xl border-2 border-primary/20 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary via-primary/50 to-primary" />
            <div className="flex items-start gap-3 mb-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="p-2 bg-primary/10 rounded-lg shrink-0"
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  الملخص الذكي
                  <Badge variant="secondary" className="text-xs">
                    AI
                  </Badge>
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90" data-testid="text-ai-summary">
                  {data.dailySummary}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Live Statistics - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-3 bg-blue-500/20 rounded-xl"
                >
                  <Users className="h-6 w-6 text-blue-600" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    المستخدمون النشطون
                  </p>
                  <motion.p
                    key={data.userEngagement.activeUsers}
                    initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1, color: "inherit" }}
                    className="text-3xl font-bold text-blue-600"
                    data-testid="stat-active-users"
                  >
                    {data.userEngagement.activeUsers.toLocaleString('ar-SA')}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ 
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-3 bg-green-500/20 rounded-xl"
                >
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    التعليقات اليوم
                  </p>
                  <motion.p
                    key={data.userEngagement.totalComments}
                    initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1, color: "inherit" }}
                    className="text-3xl font-bold text-green-600"
                    data-testid="stat-comments"
                  >
                    {data.userEngagement.totalComments.toLocaleString('ar-SA')}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-5 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-3 bg-red-500/20 rounded-xl"
                >
                  <Zap className="h-6 w-6 text-red-600" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    التفاعلات
                  </p>
                  <motion.p
                    key={data.userEngagement.totalReactions}
                    initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1, color: "inherit" }}
                    className="text-3xl font-bold text-red-600"
                    data-testid="stat-reactions"
                  >
                    {data.userEngagement.totalReactions.toLocaleString('ar-SA')}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Top Trending Topics - Enhanced */}
          {data.topTopics && data.topTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-5 bg-gradient-to-br from-card/50 to-card rounded-xl border border-border/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-2 bg-orange-500/10 rounded-lg"
                >
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    المواضيع الأكثر نشاطاً الآن
                    <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600">
                      <Flame className="h-3 w-3 ml-1" />
                      ترند
                    </Badge>
                  </h4>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {data.topTopics.map((topic, index) => (
                    <motion.div
                      key={topic.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "cursor-pointer hover-elevate px-4 py-2 gap-2 text-sm font-medium shadow-sm",
                          index === 0 && "bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-orange-700 border-orange-500/30",
                          index === 1 && "bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-700 border-blue-500/30",
                          index === 2 && "bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-700 border-green-500/30"
                        )}
                        data-testid={`badge-trending-${index}`}
                      >
                        {index === 0 && <Flame className="h-4 w-4 text-orange-600" />}
                        {topic.name}
                        <span className="mr-2 text-xs opacity-50">•</span>
                        <div className="flex items-center gap-1 bg-background/50 px-2 py-0.5 rounded-full">
                          <BarChart3 className="h-3 w-3" />
                          <span className="font-bold">{topic.score}</span>
                        </div>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Key Highlights - Enhanced */}
          {data.keyHighlights && data.keyHighlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-5 bg-gradient-to-br from-card/50 to-card rounded-xl border border-border/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="p-2 bg-purple-500/10 rounded-lg"
                >
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                </motion.div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  أبرز الأحداث
                  <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600">
                    <Target className="h-3 w-3 ml-1" />
                    {data.keyHighlights.length}
                  </Badge>
                </h4>
              </div>
              <ul className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {data.keyHighlights.map((highlight, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-gradient-to-l from-muted/30 to-transparent rounded-lg hover-elevate"
                      data-testid={`highlight-${index}`}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                        }}
                        className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-primary/50 mt-2 shrink-0"
                      />
                      <span className="text-sm leading-relaxed">{highlight}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          )}

          {/* Activity Trend - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-5 bg-gradient-to-l from-primary/10 to-primary/5 rounded-xl border-r-4 border-primary shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
            <div className="flex items-start gap-3">
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-2 bg-primary/20 rounded-lg shrink-0"
              >
                <Activity className="h-5 w-5 text-primary" />
              </motion.div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  اتجاه النشاط
                </p>
                <p className="text-sm font-medium leading-relaxed" data-testid="text-activity-trend">
                  {data.activityTrend}
                </p>
              </div>
            </div>
          </motion.div>

          {/* AI Attribution */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Brain className="h-4 w-4 text-primary" />
            </motion.div>
            <span>تحليل تلقائي بواسطة الذكاء الاصطناعي - يتم التحديث كل دقيقة</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
