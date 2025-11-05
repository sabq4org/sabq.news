import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Clock, Eye, Heart, MessageCircle, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { ElementType } from "react";

interface AiInsights {
  avgReadTime: number;
  totalReads: number;
  totalReactions: number;
  totalComments: number;
  totalViews: number;
  engagementRate: number;
  completionRate: number;
  totalInteractions: number;
}

interface AiArticleStatsProps {
  slug: string;
}

function formatReadTime(seconds: number): string {
  if (seconds === 0) return "لا توجد بيانات";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (minutes === 0) {
    return `${secs} ثانية`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')} دقيقة`;
}

function StatItem({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  delay = 0
}: { 
  icon: ElementType; 
  label: string; 
  value: string | number; 
  subtext?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-start gap-3 p-3 rounded-lg hover-elevate active-elevate-2 bg-card/50 dark:bg-card/30"
      data-testid={`stat-${label}`}
    >
      <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-lg font-bold text-foreground">{value}</div>
        {subtext && (
          <div className="text-xs text-muted-foreground/80 mt-1">{subtext}</div>
        )}
      </div>
    </motion.div>
  );
}

export function AiArticleStats({ slug }: AiArticleStatsProps) {
  const { data: insights, isLoading } = useQuery<AiInsights>({
    queryKey: ["/api/articles", slug, "ai-insights"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="p-4 rounded-2xl" data-testid="ai-stats-loading">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!insights) return null;

  // Generate engagement trend data for visualization
  const engagementData = [
    { 
      name: 'المشاهدات', 
      value: insights.totalViews,
      percentage: 100 
    },
    { 
      name: 'القراءات', 
      value: insights.totalReads,
      percentage: insights.totalViews > 0 ? Math.round((insights.totalReads / insights.totalViews) * 100) : 0
    },
    { 
      name: 'الإكمال', 
      value: Math.round((insights.totalReads * insights.completionRate) / 100),
      percentage: insights.completionRate
    },
    { 
      name: 'التفاعل', 
      value: insights.totalInteractions,
      percentage: insights.totalViews > 0 ? Math.round((insights.totalInteractions / insights.totalViews) * 100) : 0
    }
  ];

  return (
    <Card className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-card/95 to-card dark:from-card/90 dark:to-card/80" data-testid="ai-stats-panel">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground" data-testid="ai-stats-title">
              إحصائيات الذكاء الاصطناعي
            </h3>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Sparkles className="w-3 h-3" />
            <span>محدّثة لحظيًا</span>
          </motion.div>
        </div>

        {/* Interactive Chart - Engagement Funnel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/15"
        >
          <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            قمع التفاعل
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart 
              data={engagementData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  direction: 'rtl'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: number, name: string) => {
                  const item = engagementData.find(d => d.name === name);
                  return [`${value.toLocaleString('ar-SA')} (${item?.percentage}%)`, name];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#colorEngagement)" 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            يوضح الرسم البياني رحلة القارئ من المشاهدة إلى التفاعل
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatItem
            icon={Clock}
            label="متوسط زمن القراءة"
            value={formatReadTime(insights.avgReadTime)}
            subtext={`${insights.totalReads} قارئ`}
            delay={0.2}
          />
          
          <StatItem
            icon={TrendingUp}
            label="نسبة إكمال القراءة"
            value={`${insights.completionRate}%`}
            subtext={insights.completionRate >= 70 ? "ممتاز" : insights.completionRate >= 50 ? "جيد" : "متوسط"}
            delay={0.25}
          />
          
          <StatItem
            icon={Eye}
            label="إجمالي المشاهدات"
            value={insights.totalViews.toLocaleString("ar-SA")}
            delay={0.3}
          />
          
          <StatItem
            icon={Heart}
            label="التفاعلات"
            value={insights.totalInteractions.toLocaleString("ar-SA")}
            subtext={`${insights.totalReactions} إعجاب، ${insights.totalComments} تعليق`}
            delay={0.35}
          />
        </div>

        {/* Engagement Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-4 p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">معدل التفاعل</span>
            </div>
            <div className="text-xl font-bold text-primary">
              {insights.engagementRate.toFixed(2)}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {insights.engagementRate >= 0.5 
              ? "تفاعل ممتاز من القراء" 
              : insights.engagementRate >= 0.2 
              ? "تفاعل جيد" 
              : "تفاعل محدود"}
          </div>
        </motion.div>

        {/* AI Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-4 pt-4 border-t border-border/50"
        >
          <div className="flex items-center gap-2 justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground">
              مدعوم بتحليلات الذكاء الاصطناعي
            </span>
          </div>
        </motion.div>
      </motion.div>
    </Card>
  );
}
