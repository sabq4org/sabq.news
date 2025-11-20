import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Brain, 
  Newspaper, 
  ChartBar, 
  MessageSquare, 
  Wrench, 
  Mic, 
  GraduationCap, 
  Users,
  TrendingUp,
  Sparkles,
  Activity,
  Bot,
  Zap,
  Globe,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIHeader from "@/components/ai/AIHeader";
import AIAnimatedLogo from "@/components/ai/AIAnimatedLogo";
import AINewsCard from "@/components/ai/AINewsCard";
import AITrendsWidget from "@/components/ai/AITrendsWidget";
import { Article } from "@/../../shared/schema";

const categories = [
  { 
    slug: "ai-news", 
    icon: Newspaper, 
    nameAr: "آي سبق", 
    nameEn: "AI News",
    color: "#22C55E",
    description: "أخبار عاجلة وانفرادات حصرية"
  },
  { 
    slug: "ai-insights", 
    icon: ChartBar, 
    nameAr: "آي عمق", 
    nameEn: "AI Insights",
    color: "#8B5CF6",
    description: "تحليلات وتقارير استقصائية"
  },
  { 
    slug: "ai-opinions", 
    icon: MessageSquare, 
    nameAr: "آي رأي", 
    nameEn: "AI Opinions",
    color: "#F59E0B",
    description: "مقالات خبراء ونقاشات"
  },
  { 
    slug: "ai-tools", 
    icon: Wrench, 
    nameAr: "آي تطبيق", 
    nameEn: "AI Tools",
    color: "#EF4444",
    description: "مراجعات أدوات وتطبيقات"
  },
  { 
    slug: "ai-voice", 
    icon: Mic, 
    nameAr: "آي صوت", 
    nameEn: "AI Voice",
    color: "#EC4899",
    description: "بودكاست وفيديوهات"
  },
  { 
    slug: "ai-academy", 
    icon: GraduationCap, 
    nameAr: "آي أكاديمي", 
    nameEn: "AI Academy",
    color: "#10B981",
    description: "دورات تعليمية مبسطة"
  },
  { 
    slug: "ai-community", 
    icon: Users, 
    nameAr: "آي تواصل", 
    nameEn: "AI Community",
    color: "#6366F1",
    description: "مجتمع المبدعين"
  }
];

export default function AIHomePage() {
  const [activeTab, setActiveTab] = useState("latest");

  // Fetch latest AI articles
  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/ai-category"],
    enabled: true
  });

  // Fetch AI trends
  const { data: trends = [] } = useQuery({
    queryKey: ["/api/ai/trends"],
    enabled: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-10 -right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Header */}
      <AIHeader />

      {/* Hero Section */}
      <section className="relative px-4 py-12 md:py-20">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <AIAnimatedLogo />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                آي فوكس
              </span>
              {" "}
              <span className="text-gray-300">|</span>
              {" "}
              <span className="text-2xl md:text-4xl text-gray-400">iFox AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              بوابتك المتخصصة لعالم الذكاء الاصطناعي - أخبار، تحليلات، وأدوات عملية
            </p>

            {/* Live Indicator */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400">متابعة حية لآخر التطورات</span>
              </div>
            </div>
          </motion.div>

          {/* Category Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-12"
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href={`/ai/${category.slug}`}>
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 transition-all cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div 
                        className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <category.icon className="w-6 h-6" style={{ color: category.color }} />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{category.nameAr}</h3>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
            <TabsList className="bg-slate-900/50 border border-slate-800">
              <TabsTrigger value="latest" className="data-[state=active]:bg-slate-800">
                <Sparkles className="w-4 h-4 mr-2" />
                الأحدث
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-slate-800">
                <TrendingUp className="w-4 h-4 mr-2" />
                الأكثر رواجاً
              </TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-slate-800">
                <Zap className="w-4 h-4 mr-2" />
                المميز
              </TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="mt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-500" />
                    آخر الأخبار والتطورات
                  </h2>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                      </div>
                    ) : articles.length > 0 ? (
                      articles.slice(0, 5).map((article) => (
                        <AINewsCard key={article.id} article={article} />
                      ))
                    ) : (
                      <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-8 text-center">
                          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                          <p className="text-gray-400">لا توجد مقالات متاحة حالياً في قسم AI</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <AITrendsWidget trends={trends} />
                  
                  {/* Quick Stats */}
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-purple-500" />
                        إحصائيات سريعة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">مقالات اليوم</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          42
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">أدوات جديدة</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          7
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">تحليلات عميقة</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          15
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Newsletter CTA */}
                  <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-slate-700">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2">
                        نشرة AI اليومية
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        احصل على ملخص يومي لأهم تطورات الذكاء الاصطناعي
                      </p>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        اشترك الآن
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trending">
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">قسم الأكثر رواجاً قيد التطوير</p>
              </div>
            </TabsContent>

            <TabsContent value="featured">
              <div className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">قسم المحتوى المميز قيد التطوير</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}