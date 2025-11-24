import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { IFoxLayout } from "@/components/admin/ifox/IFoxLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import mascotImage from "@assets/sabq_ai_mascot_1_1_1763712965053.png";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Clock,
  Users,
  Sparkles,
  Brain,
  Cpu,
  Zap,
  Activity,
  Calendar,
  FileText,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts";

interface AnalyticsOverview {
  totalViews: number;
  viewsGrowth: number;
  totalEngagement: number;
  engagementGrowth: number;
  totalArticles: number;
  articlesGrowth: number;
  averageAIScore: number;
  aiScoreGrowth: number;
  readTime: string;
  readTimeGrowth: number;
  activeUsers: number;
  usersGrowth: number;
}

interface TimeSeriesData {
  date: string;
  views: number;
  engagement: number;
  articles: number;
  aiScore: number;
}

interface CategoryPerformance {
  category: string;
  categoryAr: string;
  views: number;
  engagement: number;
  articles: number;
  avgAIScore: number;
  growth: number;
}

interface TopArticle {
  id: string;
  title: string;
  category: string;
  views: number;
  engagement: number;
  aiScore: number;
  publishedAt: string;
}

interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

const COLORS = {
  primary: 'hsl(var(--ifox-accent-primary))',
  secondary: 'hsl(var(--ifox-info))',
  accent: 'hsl(var(--ifox-warning))',
  success: 'hsl(var(--ifox-success))',
  warning: 'hsl(var(--ifox-warning))',
  danger: 'hsl(var(--ifox-error))',
  purple: 'hsl(var(--ifox-accent-primary))',
  pink: 'hsl(var(--ifox-accent-secondary))',
  blue: 'hsl(var(--ifox-info))',
  green: 'hsl(var(--ifox-success))',
};

const categoryColors: Record<string, string> = {
  'ai-news': COLORS.purple,
  'ai-insights': COLORS.blue,
  'ai-opinions': COLORS.pink,
  'ai-tools': COLORS.accent,
  'ai-voice': COLORS.secondary,
  'ai-academy': COLORS.warning,
  'ai-community': COLORS.green,
};

export default function IFoxAnalytics() {
  useRoleProtection('admin');
  
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/admin/ifox/analytics/overview", timeRange]
  });

  // Fetch time series data
  const { data: timeSeriesData = [] } = useQuery<TimeSeriesData[]>({
    queryKey: ["/api/admin/ifox/analytics/timeseries", timeRange]
  });

  // Fetch category performance
  const { data: categoryPerformance = [] } = useQuery<CategoryPerformance[]>({
    queryKey: ["/api/admin/ifox/analytics/categories", timeRange]
  });

  // Fetch top articles
  const { data: topArticles = [] } = useQuery<TopArticle[]>({
    queryKey: ["/api/admin/ifox/analytics/top-articles", timeRange]
  });

  // Fetch engagement metrics
  const { data: engagementMetrics } = useQuery<EngagementMetrics>({
    queryKey: ["/api/admin/ifox/analytics/engagement", timeRange]
  });

  const MetricCard = ({ title, value, growth, icon: Icon, color, suffix = "" }: any) => (
    <Card className="bg-[hsl(var(--ifox-surface-primary)/.8)] border-[hsl(var(--ifox-surface-overlay))] backdrop-blur-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-[0_10px_15px_hsl(var(--ifox-surface-overlay)/.1)]`}>
            <Icon className="w-6 h-6 text-[hsl(var(--ifox-text-primary))]" />
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            growth >= 0 ? 'bg-[hsl(var(--ifox-success)/.2)] text-[hsl(var(--ifox-success))]' : 'bg-[hsl(var(--ifox-error)/.2)] text-[hsl(var(--ifox-error))]'
          }`}>
            {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-bold">{Math.abs(growth)}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-[hsl(var(--ifox-text-secondary))] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[hsl(var(--ifox-text-primary))]">
            {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
            {suffix && <span className="text-lg text-[hsl(var(--ifox-text-secondary))] mr-1">{suffix}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <IFoxLayout>
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Animated AI Mascot */}
                <motion.div
                  className="relative"
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl opacity-60"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background: "radial-gradient(circle, hsl(var(--ifox-accent-glow) / 0.6), hsl(var(--ifox-accent-glow-secondary) / 0.6))",
                    }}
                  />
                  <img 
                    src={mascotImage} 
                    alt="iFox AI Mascot" 
                    className="w-16 h-16 relative z-10"
                    style={{ filter: 'drop-shadow(0 25px 50px hsl(var(--ifox-surface-overlay) / 0.2))' }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--ifox-accent-primary)/1)] to-[hsl(var(--ifox-accent-secondary)/1)] bg-clip-text text-transparent" data-testid="text-page-title">
                    تحليلات آي فوكس
                  </h1>
                  <p className="text-[hsl(var(--ifox-text-primary))] text-lg" data-testid="text-page-description">
                    مقاييس الأداء والإحصائيات الذكية
                  </p>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                  <SelectTrigger className="w-[180px] bg-[hsl(var(--ifox-surface-muted)/.7)] border-[hsl(var(--ifox-surface-overlay))] text-[hsl(var(--ifox-text-primary))]" data-testid="select-time-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">آخر 7 أيام</SelectItem>
                    <SelectItem value="30d">آخر 30 يوم</SelectItem>
                    <SelectItem value="90d">آخر 90 يوم</SelectItem>
                    <SelectItem value="1y">آخر سنة</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* AI Status */}
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--ifox-success)/.2)] to-[hsl(var(--ifox-success)/.2)] border border-[hsl(var(--ifox-success)/.3)]"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[hsl(var(--ifox-success))]"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      boxShadow: [
                        "0 0 5px hsl(var(--ifox-success-glow) / 0.5)",
                        "0 0 15px hsl(var(--ifox-success))",
                        "0 0 5px hsl(var(--ifox-success-glow) / 0.5)",
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-[hsl(var(--ifox-success))]">AI Analytics</span>
                  <Brain className="w-3 h-3 text-[hsl(var(--ifox-success))]" />
                </motion.div>
              </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            >
              <MetricCard
                title="إجمالي المشاهدات"
                value={overview?.totalViews || 0}
                growth={overview?.viewsGrowth || 0}
                icon={Eye}
                color="from-[hsl(var(--ifox-accent-primary)/1)] to-[hsl(var(--ifox-accent-secondary)/1)]"
              />
              <MetricCard
                title="التفاعل"
                value={overview?.totalEngagement || 0}
                growth={overview?.engagementGrowth || 0}
                icon={Heart}
                color="from-[hsl(var(--ifox-error)/1)] to-[hsl(var(--ifox-error-muted)/1)]"
              />
              <MetricCard
                title="المقالات"
                value={overview?.totalArticles || 0}
                growth={overview?.articlesGrowth || 0}
                icon={FileText}
                color="from-[hsl(var(--ifox-info)/1)] to-[hsl(var(--ifox-info-muted)/1)]"
              />
              <MetricCard
                title="AI Score"
                value={overview?.averageAIScore || 0}
                growth={overview?.aiScoreGrowth || 0}
                icon={Cpu}
                color="from-[hsl(var(--ifox-success)/1)] to-[hsl(var(--ifox-success-muted)/1)]"
              />
              <MetricCard
                title="وقت القراءة"
                value={overview?.readTime || "0:00"}
                growth={overview?.readTimeGrowth || 0}
                icon={Clock}
                color="from-[hsl(var(--ifox-warning)/1)] to-[hsl(var(--ifox-warning-muted)/1)]"
              />
              <MetricCard
                title="المستخدمون"
                value={overview?.activeUsers || 0}
                growth={overview?.usersGrowth || 0}
                icon={Users}
                color="from-[hsl(var(--ifox-accent-primary)/1)] to-[hsl(var(--ifox-accent-secondary)/1)]"
              />
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Over Time */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-[hsl(var(--ifox-surface-primary)/.8)] border-[hsl(var(--ifox-surface-overlay))] backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[hsl(var(--ifox-text-primary))]">
                      <Activity className="w-5 h-5 text-[hsl(var(--ifox-accent-primary))]" />
                      الأداء عبر الزمن
                    </CardTitle>
                    <CardDescription className="text-[hsl(var(--ifox-text-primary))]">
                      المشاهدات والتفاعل خلال الفترة المحددة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={timeSeriesData}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ifox-neutral) / 0.1)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--ifox-text-secondary))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--ifox-text-secondary))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--ifox-surface-muted) / 0.9)',
                            border: '1px solid hsl(var(--ifox-surface-overlay))',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: 'white' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke={COLORS.purple}
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          name="المشاهدات"
                        />
                        <Area
                          type="monotone"
                          dataKey="engagement"
                          stroke={COLORS.secondary}
                          fillOpacity={1}
                          fill="url(#colorEngagement)"
                          name="التفاعل"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Score Trend */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-[hsl(var(--ifox-surface-primary)/.8)] border-[hsl(var(--ifox-surface-overlay))] backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[hsl(var(--ifox-text-primary))]">
                      <Brain className="w-5 h-5 text-[hsl(var(--ifox-success))]" />
                      تطور AI Score
                    </CardTitle>
                    <CardDescription className="text-[hsl(var(--ifox-text-primary))]">
                      جودة المحتوى المدعوم بالذكاء الاصطناعي
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ifox-neutral) / 0.1)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--ifox-text-secondary))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--ifox-text-secondary))"
                          domain={[0, 100]}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--ifox-surface-muted) / 0.9)',
                            border: '1px solid hsl(var(--ifox-surface-overlay))',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: 'white' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="aiScore"
                          stroke={COLORS.green}
                          strokeWidth={3}
                          dot={{ fill: COLORS.green, r: 4 }}
                          name="AI Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Category Performance & Top Articles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Performance */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-[hsl(var(--ifox-surface-primary)/.8)] border-[hsl(var(--ifox-surface-overlay))] backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[hsl(var(--ifox-text-primary))]">
                      <Layers className="w-5 h-5 text-[hsl(var(--ifox-info))]" />
                      أداء الفئات
                    </CardTitle>
                    <CardDescription className="text-[hsl(var(--ifox-text-primary))]">
                      مقارنة أداء فئات المحتوى المختلفة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ifox-neutral) / 0.1)" />
                        <XAxis 
                          dataKey="categoryAr" 
                          stroke="hsl(var(--ifox-text-secondary))"
                          style={{ fontSize: '11px' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="hsl(var(--ifox-text-secondary))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--ifox-surface-muted) / 0.9)',
                            border: '1px solid hsl(var(--ifox-surface-overlay))',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: 'white' }}
                        />
                        <Bar dataKey="views" fill={COLORS.purple} name="المشاهدات" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="engagement" fill={COLORS.secondary} name="التفاعل" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Articles */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-[hsl(var(--ifox-surface-primary)/.8)] border-[hsl(var(--ifox-surface-overlay))] backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[hsl(var(--ifox-text-primary))]">
                      <Award className="w-5 h-5 text-[hsl(var(--ifox-warning))]" />
                      أفضل المقالات
                    </CardTitle>
                    <CardDescription className="text-[hsl(var(--ifox-text-primary))]">
                      المقالات الأكثر أداءً خلال الفترة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topArticles.slice(0, 5).map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="p-3 rounded-lg bg-[hsl(var(--ifox-surface-muted)/.7)] hover:bg-[hsl(var(--ifox-surface-overlay)/.6)] transition-all cursor-pointer border border-[hsl(var(--ifox-surface-overlay))]"
                          data-testid={`top-article-${article.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-gradient-to-br from-[hsl(var(--ifox-warning))] to-[hsl(var(--ifox-warning-muted))] text-slate-900' :
                              index === 1 ? 'bg-gradient-to-br from-[hsl(var(--ifox-neutral))] to-[hsl(var(--ifox-neutral-muted))] text-slate-900' :
                              index === 2 ? 'bg-gradient-to-br from-[hsl(var(--ifox-warning))] to-[hsl(var(--ifox-warning-muted))] text-[hsl(var(--ifox-text-primary))]' :
                              'bg-[hsl(var(--ifox-surface-overlay)/.5)] text-[hsl(var(--ifox-text-primary))]'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-[hsl(var(--ifox-text-primary))] mb-1 line-clamp-1">
                                {article.title}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-[hsl(var(--ifox-text-primary))]">
                                <Badge variant="outline" className="text-xs text-[hsl(var(--ifox-accent-primary))] border-[hsl(var(--ifox-accent-primary)/.4)]">
                                  {article.category}
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {article.views.toLocaleString('ar-SA')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {article.engagement}%
                                </span>
                              </div>
                            </div>
                            <Badge 
                              className={`
                                px-2 py-0.5 text-xs
                                ${article.aiScore >= 90 ? 'bg-gradient-to-r from-[hsl(var(--ifox-success))] to-[hsl(var(--ifox-success-muted))]' : 
                                  article.aiScore >= 80 ? 'bg-gradient-to-r from-[hsl(var(--ifox-info))] to-[hsl(var(--ifox-info-muted))]' :
                                  'bg-gradient-to-r from-[hsl(var(--ifox-warning))] to-[hsl(var(--ifox-warning-muted))]'}
                                text-[hsl(var(--ifox-text-primary))] border-0
                              `}
                            >
                              {article.aiScore}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Engagement Breakdown */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-[hsl(var(--ifox-surface-primary)/.8)] border-[hsl(var(--ifox-surface-overlay))] backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[hsl(var(--ifox-text-primary))]">
                    <Target className="w-5 h-5 text-[hsl(var(--ifox-error))]" />
                    تفصيل التفاعل
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--ifox-text-primary))]">
                    توزيع أنواع التفاعل مع المحتوى
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--ifox-error)/.2)] to-[hsl(var(--ifox-error)/.2)] border border-[hsl(var(--ifox-error)/.3)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[hsl(var(--ifox-error)/.3)]">
                          <Heart className="w-5 h-5 text-[hsl(var(--ifox-error))]" />
                        </div>
                        <div>
                          <p className="text-xs text-[hsl(var(--ifox-text-primary))]">الإعجابات</p>
                          <p className="text-2xl font-bold text-[hsl(var(--ifox-text-primary))]">
                            {engagementMetrics?.likes.toLocaleString('ar-SA') || '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--ifox-info)/.2)] to-[hsl(var(--ifox-info)/.2)] border border-[hsl(var(--ifox-info)/.3)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[hsl(var(--ifox-info)/.3)]">
                          <MessageSquare className="w-5 h-5 text-[hsl(var(--ifox-info))]" />
                        </div>
                        <div>
                          <p className="text-xs text-[hsl(var(--ifox-text-primary))]">التعليقات</p>
                          <p className="text-2xl font-bold text-[hsl(var(--ifox-text-primary))]">
                            {engagementMetrics?.comments.toLocaleString('ar-SA') || '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--ifox-success)/.2)] to-[hsl(var(--ifox-success)/.2)] border border-[hsl(var(--ifox-success)/.3)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[hsl(var(--ifox-success)/.3)]">
                          <Share2 className="w-5 h-5 text-[hsl(var(--ifox-success))]" />
                        </div>
                        <div>
                          <p className="text-xs text-[hsl(var(--ifox-text-primary))]">المشاركات</p>
                          <p className="text-2xl font-bold text-[hsl(var(--ifox-text-primary))]">
                            {engagementMetrics?.shares.toLocaleString('ar-SA') || '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--ifox-warning)/.2)] to-[hsl(var(--ifox-warning)/.2)] border border-[hsl(var(--ifox-warning)/.3)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[hsl(var(--ifox-warning)/.3)]">
                          <FileText className="w-5 h-5 text-[hsl(var(--ifox-warning))]" />
                        </div>
                        <div>
                          <p className="text-xs text-[hsl(var(--ifox-text-primary))]">الحفظ</p>
                          <p className="text-2xl font-bold text-[hsl(var(--ifox-text-primary))]">
                            {engagementMetrics?.bookmarks.toLocaleString('ar-SA') || '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center justify-center gap-8 py-6"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[hsl(var(--ifox-warning))]" />
                <span className="text-sm text-[hsl(var(--ifox-text-primary))]">Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[hsl(var(--ifox-accent-primary))]" />
                <span className="text-sm text-[hsl(var(--ifox-text-primary))]">AI-Powered Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[hsl(var(--ifox-info))]" />
                <span className="text-sm text-[hsl(var(--ifox-text-primary))]">Advanced Metrics</span>
              </div>
            </motion.div>
        </div>
      </ScrollArea>
    </IFoxLayout>
  );
}
