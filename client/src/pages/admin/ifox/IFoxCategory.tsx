import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { IFoxLayout } from "@/components/admin/ifox/IFoxLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import mascotImage from "@assets/sabq_ai_mascot_1_1_1763712965053.png";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  FileText,
  Clock,
  Sparkles,
  Brain,
  MessageSquare,
  Cpu,
  GraduationCap,
  Users,
  Lightbulb,
  ArrowUpRight,
  Activity
} from "lucide-react";

interface IFoxCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  icon: string;
  color: string;
  articlesCount: number;
  publishedCount: number;
  draftCount: number;
  totalViews: number;
  avgAIScore: number;
  status: "active" | "inactive";
  createdAt: string;
}

const categoryIcons: Record<string, any> = {
  "sparkles": Sparkles,
  "brain": Brain,
  "message-square": MessageSquare,
  "cpu": Cpu,
  "graduation-cap": GraduationCap,
  "users": Users,
  "lightbulb": Lightbulb,
};

const categoryColors: Record<string, string> = {
  "ifox-ai": "from-violet-500 to-purple-600",
  "ai-news": "from-blue-500 to-cyan-600",
  "ai-voice": "from-pink-500 to-rose-600",
  "ai-tools": "from-amber-500 to-orange-600",
  "ai-academy": "from-green-500 to-emerald-600",
  "ai-community": "from-indigo-500 to-purple-600",
  "ai-insights": "from-teal-500 to-cyan-600",
  "ai-opinions": "from-red-500 to-pink-600",
};

export default function IFoxCategory() {
  useRoleProtection('admin');
  const { toast } = useToast();
  const params = useParams();
  const categorySlug = params.slug;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "articles" | "views" | "aiScore">("articles");

  // Fetch all iFox categories
  const { data: categories = [], isLoading } = useQuery<IFoxCategory[]>({
    queryKey: ["/api/admin/ifox/categories"]
  });

  // Filter and sort categories
  const filteredCategories = categories
    .filter(cat => {
      if (statusFilter !== "all" && cat.status !== statusFilter) return false;
      if (searchQuery && !cat.nameAr.includes(searchQuery) && !cat.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.nameAr.localeCompare(b.nameAr, 'ar');
        case "articles":
          return b.articlesCount - a.articlesCount;
        case "views":
          return b.totalViews - a.totalViews;
        case "aiScore":
          return b.avgAIScore - a.avgAIScore;
        default:
          return 0;
      }
    });

  // Toggle category status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) => {
      return await apiRequest(`/api/admin/ifox/categories/${id}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/categories"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الفئة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث حالة الفئة",
        variant: "destructive"
      });
    }
  });

  const handleToggleStatus = (category: IFoxCategory) => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({ id: category.id, status: newStatus });
  };

  // Calculate total stats
  const totalStats = {
    categories: categories.length,
    activeCategories: categories.filter(c => c.status === "active").length,
    totalArticles: categories.reduce((sum, c) => sum + c.articlesCount, 0),
    totalViews: categories.reduce((sum, c) => sum + c.totalViews, 0),
    avgAIScore: categories.length > 0 
      ? Math.round(categories.reduce((sum, c) => sum + c.avgAIScore, 0) / categories.length)
      : 0,
  };

  const CategoryCard = ({ category }: { category: IFoxCategory }) => {
    const IconComponent = categoryIcons[category.icon] || Layers;
    const colorGradient = categoryColors[category.slug] || "from-gray-500 to-gray-600";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg hover:border-white/40 transition-all cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${colorGradient} shadow-lg`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={category.status === "active" ? "default" : "secondary"}
                  className={category.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}
                >
                  {category.status === "active" ? "نشط" : "معطل"}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleStatus(category)}
                  className="hover:bg-slate-700/50"
                  data-testid={`button-toggle-${category.id}`}
                >
                  {category.status === "active" ? (
                    <Eye className="w-4 h-4 text-green-300" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-[hsl(var(--ifox-text-secondary))]" />
                  )}
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">{category.nameAr}</h3>
              <p className="text-sm text-[hsl(var(--ifox-text-primary))]">{category.nameEn}</p>
              {category.description && (
                <p className="text-xs text-[hsl(var(--ifox-text-primary))] mt-2 line-clamp-2">{category.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-[hsl(var(--ifox-text-primary))] mb-1">المقالات</p>
                <p className="text-2xl font-bold text-white">{category.articlesCount.toLocaleString('ar-SA')}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-green-300">{category.publishedCount} منشور</span>
                  <span className="text-xs text-[hsl(var(--ifox-text-primary))]">• {category.draftCount} مسودة</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-[hsl(var(--ifox-text-primary))] mb-1">المشاهدات</p>
                <p className="text-2xl font-bold text-white">{category.totalViews.toLocaleString('ar-SA')}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-300" />
                  <span className="text-xs text-green-300">+12.5%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/20">
              <div className="flex items-center gap-2">
                <Badge 
                  className={`
                    px-2 py-0.5 text-xs
                    ${category.avgAIScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                      category.avgAIScore >= 80 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                      'bg-gradient-to-r from-amber-500 to-orange-600'}
                    text-white border-0
                  `}
                >
                  AI {category.avgAIScore}
                </Badge>
              </div>
              <Link href={`/dashboard/admin/ifox/articles?category=${category.slug}`}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-violet-300 hover:text-violet-200 hover:bg-slate-700/50"
                  data-testid={`button-view-articles-${category.id}`}
                >
                  عرض المقالات
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <IFoxLayout>
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
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
                      className="w-16 h-16 relative z-10 drop-shadow-2xl"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent" data-testid="text-page-title">
                      فئات آي فوكس
                    </h1>
                    <p className="text-[hsl(var(--ifox-text-primary))] text-lg" data-testid="text-page-description">
                      إدارة فئات المحتوى الذكي
                    </p>
                  </div>
                </div>

                {/* AI Status */}
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
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
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-green-400">{totalStats.activeCategories} فئة نشطة</span>
                  <Layers className="w-3 h-3 text-green-400" />
                </motion.div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-violet-500/40 to-purple-500/30 border-violet-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">إجمالي الفئات</p>
                        <p className="text-2xl font-bold text-white">{totalStats.categories}</p>
                      </div>
                      <Layers className="w-8 h-8 text-violet-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/40 to-cyan-500/30 border-cyan-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">المقالات الكلية</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalArticles.toLocaleString('ar-SA')}</p>
                      </div>
                      <FileText className="w-8 h-8 text-cyan-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/40 to-orange-500/30 border-orange-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">إجمالي المشاهدات</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalViews.toLocaleString('ar-SA')}</p>
                      </div>
                      <Eye className="w-8 h-8 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/40 to-emerald-500/30 border-emerald-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">متوسط AI Score</p>
                        <p className="text-2xl font-bold text-white">{totalStats.avgAIScore}</p>
                      </div>
                      <Brain className="w-8 h-8 text-emerald-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500/40 to-rose-500/30 border-rose-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">الفئات النشطة</p>
                        <p className="text-2xl font-bold text-white">{totalStats.activeCategories}</p>
                      </div>
                      <Activity className="w-8 h-8 text-rose-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--ifox-text-secondary))]" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث في الفئات..."
                        className="pr-10 bg-slate-800/50 border-white/20 text-white"
                        data-testid="input-search"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                      <SelectTrigger className="w-full md:w-[180px] bg-slate-800/50 border-white/20 text-white" data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">معطل</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="w-full md:w-[180px] bg-slate-800/50 border-white/20 text-white" data-testid="select-sort-by">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="articles">الأكثر مقالات</SelectItem>
                        <SelectItem value="views">الأكثر مشاهدة</SelectItem>
                        <SelectItem value="aiScore">الأعلى AI Score</SelectItem>
                        <SelectItem value="name">الاسم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Categories Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-[hsl(var(--ifox-text-primary))]">جاري التحميل...</p>
                </div>
              ) : filteredCategories.length === 0 ? (
                <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg">
                  <CardContent className="p-12 text-center">
                    <Layers className="w-16 h-16 text-[hsl(var(--ifox-text-secondary))] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد فئات</h3>
                    <p className="text-[hsl(var(--ifox-text-primary))]">لم يتم العثور على فئات مطابقة للبحث</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CategoryCard category={category} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </ScrollArea>
      </div>
    </IFoxLayout>
  );
}
