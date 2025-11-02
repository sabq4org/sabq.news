import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  ThumbsUp, 
  Clock, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  FileText,
  Award,
  BarChart3,
  MessageSquare,
  Mail,
  Globe,
  User as UserIcon,
  ChevronLeft,
  Home,
} from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import type { ReporterProfile as ReporterProfileType } from "@shared/schema";
import { 
  LineChart, 
  Line, 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from "framer-motion";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

export default function ReporterProfile() {
  const { slug } = useParams<{ slug: string }>();

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: profile, isLoading, error } = useQuery<ReporterProfileType>({
    queryKey: ['/api/reporters', slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-lg w-1/3"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">المراسل غير موجود</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const {
    fullName,
    title,
    avatarUrl,
    bio,
    isVerified,
    tags,
    kpis,
    lastArticles,
    topCategories,
    timeseries,
    badges,
  } = profile;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <span className="flex items-center gap-1 cursor-pointer" data-testid="breadcrumb-home">
                    <Home className="h-4 w-4" />
                    الرئيسية
                  </span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronLeft className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="breadcrumb-current">
                {fullName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Profile Header Section */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-primary/10" data-testid="avatar-reporter">
                  <AvatarImage src={avatarUrl || ''} alt={fullName} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/5">
                    {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-bold" data-testid="text-reporter-name">
                    {fullName}
                  </h1>
                  {isVerified && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="h-5 w-5" data-testid="icon-verified" />
                      <span className="text-sm font-medium">موثّق</span>
                    </div>
                  )}
                </div>

                {title && (
                  <div className="flex items-center gap-2 text-lg text-muted-foreground">
                    <Award className="h-5 w-5" />
                    <p data-testid="text-reporter-title">{title}</p>
                  </div>
                )}

                {/* Tags */}
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="px-3 py-1"
                        data-testid={`badge-tag-${idx}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Achievements Badges */}
                {badges && badges.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      الإنجازات
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {badges.map((badge) => (
                        <motion.div
                          key={badge.key}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge 
                            variant="outline"
                            className="gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20"
                            data-testid={`badge-achievement-${badge.key}`}
                          >
                            <Award className="h-3.5 w-3.5 text-primary" />
                            {badge.label}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        {bio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                نبذة عن الكاتب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-muted-foreground" data-testid="text-reporter-bio">
                {bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* KPIs Section with Gradients */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover-elevate overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">المقالات</p>
                    <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-articles">
                      {kpis.totalArticles.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover-elevate overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 to-transparent" />
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-1) / 0.1)' }}>
                      <Eye className="h-5 w-5" style={{ color: 'hsl(var(--chart-1))' }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">المشاهدات</p>
                    <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-views">
                      {kpis.totalViews.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover-elevate overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 to-transparent" />
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-2) / 0.1)' }}>
                      <ThumbsUp className="h-5 w-5" style={{ color: 'hsl(var(--chart-2))' }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">الإعجابات</p>
                    <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-likes">
                      {kpis.totalLikes.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover-elevate overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 to-transparent" />
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-3) / 0.1)' }}>
                      <Clock className="h-5 w-5" style={{ color: 'hsl(var(--chart-3))' }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">متوسط وقت القراءة</p>
                    <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-readtime">
                      {kpis.avgReadTimeMin.toLocaleString('en-US')}
                      <span className="text-base font-normal text-muted-foreground mr-1">د</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="hover-elevate overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 to-transparent" />
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-4) / 0.1)' }}>
                      <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--chart-4))' }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">نسبة الإكمال</p>
                    <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-completion">
                      {kpis.avgCompletionRate.toLocaleString('en-US')}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Content Grid - Profile in main column, Stats in sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Latest Articles */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                أحدث المقالات
              </h2>
              <Badge variant="secondary" className="text-sm">
                {lastArticles?.length || 0} مقال
              </Badge>
            </div>
            
            {lastArticles && lastArticles.length > 0 ? (
              <div className="space-y-4">
                {lastArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover-elevate overflow-hidden">
                      <Link href={`/article/${article.slug}`}>
                        <div className="cursor-pointer" data-testid={`link-article-${article.id}`}>
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row gap-4">
                              {/* Article Image */}
                              {article.imageUrl && (
                                <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
                                  <img 
                                    src={article.imageUrl} 
                                    alt={article.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              
                              {/* Article Content */}
                              <div className="flex-1 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-bold text-lg leading-snug flex-1 line-clamp-2">
                                    {article.title}
                                  </h3>
                                  {article.isBreaking && (
                                    <Badge variant="destructive" className="shrink-0">
                                      عاجل
                                    </Badge>
                                  )}
                                </div>

                                {article.category && (
                                  <Badge 
                                    variant="secondary"
                                    style={{ 
                                      backgroundColor: article.category.color || undefined,
                                      color: '#fff'
                                    }}
                                    data-testid={`badge-category-${article.id}`}
                                  >
                                    {article.category.name}
                                  </Badge>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {article.publishedAt && formatDistanceToNow(new Date(article.publishedAt), {
                                      addSuffix: true,
                                      locale: ar,
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Eye className="h-4 w-4" />
                                    {article.views.toLocaleString('en-US')}
                                  </span>
                                  {article.comments > 0 && (
                                    <span className="flex items-center gap-1.5">
                                      <MessageSquare className="h-4 w-4" />
                                      {article.comments.toLocaleString('en-US')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">لا توجد مقالات حديثة</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Top Categories with Pie Chart */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                التصنيفات
              </h2>
            </div>
            
            {topCategories && topCategories.length > 0 ? (
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Pie Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.sharePct}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="sharePct"
                        >
                          {topCategories.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `${value}%`}
                          labelFormatter={(name) => ''}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <Separator />

                  {/* Categories List */}
                  <div className="space-y-3">
                    {topCategories.map((cat, idx) => (
                      <div key={idx} className="space-y-2" data-testid={`category-${idx}`}>
                        {idx > 0 && <Separator />}
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: cat.color || CHART_COLORS[idx % CHART_COLORS.length],
                              color: '#fff'
                            }}
                            className="font-medium"
                          >
                            {cat.name}
                          </Badge>
                          <span className="text-sm font-bold">
                            {cat.sharePct.toLocaleString('en-US')}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {cat.articles.toLocaleString('en-US')} مقال
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {cat.views.toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">لا توجد بيانات</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Timeline Chart */}
        {timeseries && timeseries.daily && timeseries.daily.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                المشاهدات خلال {timeseries.windowDays.toLocaleString('en-US')} يوماً الماضية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeseries.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => value.toLocaleString('en-US')}
                    />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value as string);
                        return date.toLocaleDateString('ar-SA');
                      }}
                      formatter={(value: number) => [value.toLocaleString('en-US'), 'المشاهدات']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="المشاهدات"
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="likes" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={3}
                      name="الإعجابات"
                      dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
