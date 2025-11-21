import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IFoxStatusCards } from "@/components/admin/ifox/IFoxStatusCards";
import { IFoxSidebar } from "@/components/admin/ifox/IFoxSidebar";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Brain,
  Plus,
  Image,
  Calendar,
  BarChart3,
  TrendingUp,
  Sparkles,
  Zap,
  Eye,
  Clock,
  FileText,
  ArrowUpRight,
  Cpu,
  Activity,
  Layers
} from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  Line,
  LineChart,
} from "recharts";

interface DashboardStats {
  published: number;
  scheduled: number;
  draft: number;
  archived: number;
  todayViews: number;
  weeklyGrowth: number;
  totalEngagement: number;
  averageReadTime: string;
}

interface RecentArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  views: number;
  engagement: number;
  aiScore: number;
}

interface PublishingActivity {
  date: string;
  articles: number;
  views: number;
  engagement: number;
}

// Mock data for development
const mockStats: DashboardStats = {
  published: 1247,
  scheduled: 38,
  draft: 92,
  archived: 520,
  todayViews: 45320,
  weeklyGrowth: 18.5,
  totalEngagement: 89234,
  averageReadTime: "4:32"
};

const mockRecentArticles: RecentArticle[] = [
  {
    id: "1",
    title: "تطورات جديدة في نماذج GPT-5: ما يمكن توقعه",
    category: "AI News",
    author: "محمد العلي",
    publishedAt: "2024-01-15T10:30:00Z",
    views: 12450,
    engagement: 89,
    aiScore: 95
  },
  {
    id: "2",
    title: "أفضل أدوات الذكاء الاصطناعي للمطورين في 2024",
    category: "AI Tools",
    author: "سارة أحمد",
    publishedAt: "2024-01-15T09:15:00Z",
    views: 8920,
    engagement: 76,
    aiScore: 88
  },
  {
    id: "3",
    title: "دورة تدريبية: تعلم بناء نماذج ML من الصفر",
    category: "AI Academy",
    author: "عبدالله الحربي",
    publishedAt: "2024-01-14T14:45:00Z",
    views: 6780,
    engagement: 92,
    aiScore: 91
  },
  {
    id: "4",
    title: "مجتمع AI السعودي ينظم هاكاثون للذكاء الاصطناعي",
    category: "AI Community",
    author: "فاطمة الزهراء",
    publishedAt: "2024-01-14T11:00:00Z",
    views: 5430,
    engagement: 84,
    aiScore: 86
  },
  {
    id: "5",
    title: "رؤى جديدة: كيف يغير AI مستقبل الأعمال",
    category: "AI Insights",
    author: "خالد المنصور",
    publishedAt: "2024-01-13T16:20:00Z",
    views: 9870,
    engagement: 81,
    aiScore: 93
  }
];

const mockActivityData: PublishingActivity[] = [
  { date: "الأحد", articles: 12, views: 4500, engagement: 320 },
  { date: "الإثنين", articles: 18, views: 6800, engagement: 450 },
  { date: "الثلاثاء", articles: 15, views: 5200, engagement: 380 },
  { date: "الأربعاء", articles: 22, views: 8900, engagement: 620 },
  { date: "الخميس", articles: 19, views: 7200, engagement: 510 },
  { date: "الجمعة", articles: 25, views: 9800, engagement: 680 },
  { date: "السبت", articles: 21, views: 8100, engagement: 590 }
];

export default function IFoxDashboard() {
  useRoleProtection('admin');
  const [activeStatus, setActiveStatus] = useState<"published" | "scheduled" | "draft" | "archived">("published");

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/ifox/articles/stats"],
    queryFn: async () => {
      // Using mock data for now
      return mockStats;
    }
  });

  // Fetch recent articles
  const { data: recentArticles, isLoading: articlesLoading } = useQuery<RecentArticle[]>({
    queryKey: ["/api/admin/ifox/articles", { limit: 5 }],
    queryFn: async () => {
      // Using mock data for now
      return mockRecentArticles;
    }
  });

  // Fetch activity data
  const { data: activityData } = useQuery<PublishingActivity[]>({
    queryKey: ["/api/admin/ifox/analytics/summary"],
    queryFn: async () => {
      // Using mock data for now
      return mockActivityData;
    }
  });

  const quickActions = [
    {
      title: "إنشاء مقال جديد",
      icon: Plus,
      href: "/dashboard/admin/ifox/articles/new",
      color: "from-violet-500 to-purple-600",
      description: "ابدأ بإنشاء محتوى AI جديد"
    },
    {
      title: "إدارة الوسائط",
      icon: Image,
      href: "/dashboard/admin/ifox/media",
      color: "from-blue-500 to-cyan-600",
      description: "تنظيم الصور والفيديوهات"
    },
    {
      title: "جدولة المحتوى",
      icon: Calendar,
      href: "/dashboard/admin/ifox/schedule",
      color: "from-amber-500 to-orange-600",
      description: "خطط لنشر المحتوى"
    },
    {
      title: "التحليلات",
      icon: BarChart3,
      href: "/dashboard/admin/ifox/analytics",
      color: "from-green-500 to-emerald-600",
      description: "تتبع أداء المحتوى"
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      {/* Sidebar */}
      <IFoxSidebar className="hidden lg:block" />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent" data-testid="text-page-title">
                    لوحة تحكم آي فوكس
                  </h1>
                  <p className="text-white/60" data-testid="text-page-description">
                    بوابة إدارة المحتوى الذكي
                  </p>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Card className="bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">المشاهدات اليوم</p>
                        <p className="text-2xl font-bold text-white">
                          {stats?.todayViews.toLocaleString('ar-SA') || '0'}
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-violet-400 opacity-50" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">+12.5%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">التفاعل الكلي</p>
                        <p className="text-2xl font-bold text-white">
                          {stats?.totalEngagement.toLocaleString('ar-SA') || '0'}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-400 opacity-50" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">+{stats?.weeklyGrowth || 0}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">متوسط وقت القراءة</p>
                        <p className="text-2xl font-bold text-white">
                          {stats?.averageReadTime || '0:00'}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-amber-400 opacity-50" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">+8.2%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">AI Score</p>
                        <p className="text-2xl font-bold text-white">92</p>
                      </div>
                      <Cpu className="w-8 h-8 text-green-400 opacity-50" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-white/60">ممتاز</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Status Cards */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <IFoxStatusCards
                metrics={{
                  published: stats?.published || 0,
                  scheduled: stats?.scheduled || 0,
                  draft: stats?.draft || 0,
                  archived: stats?.archived || 0
                }}
                activeStatus={activeStatus}
                onSelect={setActiveStatus}
                loading={statsLoading}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.title}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href={action.href}>
                      <Card 
                        className="cursor-pointer bg-gradient-to-br from-white/10 to-white/5 border-white/10 backdrop-blur-lg hover:from-white/15 hover:to-white/10 transition-all duration-300"
                        data-testid={`quick-action-${action.title}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-white/40" />
                          </div>
                          <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                          <p className="text-xs text-white/60">{action.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Charts and Recent Articles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Publishing Activity Chart */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/10 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="w-5 h-5 text-violet-400" />
                      نشاط النشر آخر 7 أيام
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      عدد المقالات المنشورة والمشاهدات
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.5)"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: 'white' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="articles" 
                          stroke="#8b5cf6" 
                          fillOpacity={1} 
                          fill="url(#colorArticles)"
                          name="المقالات"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stroke="#06b6d4" 
                          fillOpacity={1} 
                          fill="url(#colorViews)"
                          name="المشاهدات"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Articles */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/10 backdrop-blur-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <FileText className="w-5 h-5 text-violet-400" />
                        آخر المقالات المنشورة
                      </CardTitle>
                      <Link href="/dashboard/admin/ifox/articles">
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                          عرض الكل
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {articlesLoading ? (
                        <div className="text-center py-8 text-white/60">جاري التحميل...</div>
                      ) : recentArticles?.map((article) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                          data-testid={`recent-article-${article.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-white mb-1 line-clamp-1">
                                {article.title}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-white/60">
                                <span>{article.author}</span>
                                <span>•</span>
                                <span>{format(new Date(article.publishedAt), 'dd MMM', { locale: ar })}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {article.views.toLocaleString('ar-SA')}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              className={`
                                px-2 py-0.5 text-xs
                                ${article.aiScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                                  article.aiScore >= 80 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                                  'bg-gradient-to-r from-amber-500 to-orange-600'}
                                text-white border-0
                              `}
                            >
                              AI {article.aiScore}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs text-violet-400 border-violet-400/30">
                              {article.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-white/40">
                              <Activity className="w-3 h-3" />
                              <span>{article.engagement}%</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center gap-8 py-6"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-white/60">AI Performance: 92%</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                <span className="text-sm text-white/60">Neural Network: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-white/60">Processing: Optimal</span>
              </div>
            </motion.div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}