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
import mascotImage from "@assets/sabq_ai_mascot_1_1_1763712965053.png";
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

export default function IFoxDashboard() {
  useRoleProtection('admin');
  const [activeStatus, setActiveStatus] = useState<"published" | "scheduled" | "draft" | "archived">("published");

  // Fetch statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/ifox/articles/stats"]
  });

  // Fetch recent articles
  const { data: recentArticles, isLoading: articlesLoading, error: articlesError } = useQuery<RecentArticle[]>({
    queryKey: ["/api/admin/ifox/articles?limit=5&sort=publishedAt"]
  });

  // Fetch activity data
  const { data: activityData, error: analyticsError } = useQuery<PublishingActivity[]>({
    queryKey: ["/api/admin/ifox/analytics/summary"]
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
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950" dir="rtl">
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
              <div className="flex items-center justify-between gap-3">
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
                        background: "radial-gradient(circle, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.6))",
                      }}
                    />
                    <img 
                      src={mascotImage} 
                      alt="iFox AI Mascot" 
                      className="w-20 h-20 relative z-10 drop-shadow-2xl"
                    />
                    {/* Eyes Glow Effect */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
                      animate={{
                        boxShadow: [
                          "0 0 10px rgba(34, 197, 94, 0.3)",
                          "0 0 25px rgba(34, 197, 94, 0.6)",
                          "0 0 10px rgba(34, 197, 94, 0.3)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent" data-testid="text-page-title">
                      لوحة تحكم آي فوكس
                    </h1>
                    <p className="text-gray-100 text-lg" data-testid="text-page-description">
                      بوابة إدارة المحتوى الذكي
                    </p>
                  </div>
                </div>
                {/* AI Status Indicator */}
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-green-400"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      boxShadow: [
                        "0 0 5px rgba(34, 197, 94, 0.5)",
                        "0 0 15px rgba(34, 197, 94, 1)",
                        "0 0 5px rgba(34, 197, 94, 0.5)",
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="text-xs font-medium text-green-400">AI Online</span>
                  <Sparkles className="w-3 h-3 text-green-400" />
                </motion.div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Card className="bg-gradient-to-br from-violet-500/40 to-purple-500/30 border-violet-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">المشاهدات اليوم</p>
                        <p className="text-2xl font-bold text-white">
                          {stats?.todayViews.toLocaleString('ar-SA') || '0'}
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-violet-200" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-300" />
                      <span className="text-xs font-semibold text-green-300">+12.5%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/40 to-cyan-500/30 border-cyan-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">التفاعل الكلي</p>
                        <p className="text-2xl font-bold text-white">
                          {stats?.totalEngagement.toLocaleString('ar-SA') || '0'}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-cyan-200" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-300" />
                      <span className="text-xs font-semibold text-green-300">+{stats?.weeklyGrowth || 0}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/40 to-orange-500/30 border-orange-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">متوسط وقت القراءة</p>
                        <p className="text-2xl font-bold text-white">
                          {stats?.averageReadTime || '0:00'}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-amber-200" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-300" />
                      <span className="text-xs font-semibold text-green-300">+8.2%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/40 to-emerald-500/30 border-emerald-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">AI Score</p>
                        <p className="text-2xl font-bold text-white">92</p>
                      </div>
                      <Cpu className="w-8 h-8 text-emerald-200" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-semibold text-white">ممتاز</span>
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
                        className="cursor-pointer bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg hover:from-slate-800/90 hover:to-slate-900/70 hover:border-white/40 transition-all duration-300"
                        data-testid={`quick-action-${action.title}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-200" />
                          </div>
                          <h3 className="font-bold text-white mb-1">{action.title}</h3>
                          <p className="text-xs text-gray-100">{action.description}</p>
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
                <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white font-bold">
                      <Activity className="w-5 h-5 text-violet-300" />
                      نشاط النشر آخر 7 أيام
                    </CardTitle>
                    <CardDescription className="text-gray-100">
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
                          stroke="rgba(255,255,255,0.7)"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.7)"
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
                <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white font-bold">
                        <FileText className="w-5 h-5 text-violet-300" />
                        آخر المقالات المنشورة
                      </CardTitle>
                      <Link href="/dashboard/admin/ifox/articles">
                        <Button variant="ghost" size="sm" className="text-gray-100 hover:text-white">
                          عرض الكل
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {articlesLoading ? (
                        <div className="text-center py-8 text-gray-100">جاري التحميل...</div>
                      ) : recentArticles?.map((article) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer border border-white/20 hover:border-white/30"
                          data-testid={`recent-article-${article.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                                {article.title}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-gray-100">
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
                            <Badge variant="outline" className="text-xs text-violet-300 border-violet-400/40">
                              {article.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-100">
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
                <span className="text-sm text-gray-200">AI Performance: 92%</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                <span className="text-sm text-gray-200">Neural Network: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-gray-200">Processing: Optimal</span>
              </div>
            </motion.div>
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar */}
      <IFoxSidebar className="hidden lg:block" />
    </div>
  );
}