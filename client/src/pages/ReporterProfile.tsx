import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, ThumbsUp, Clock, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import type { ReporterProfile as ReporterProfileType } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ReporterProfile() {
  const { slug } = useParams<{ slug: string }>();

  const { data: profile, isLoading, error } = useQuery<ReporterProfileType>({
    queryKey: ['/api/reporters', slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
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
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">المراسل غير موجود</p>
          </CardContent>
        </Card>
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
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32" data-testid="avatar-reporter">
                <AvatarImage src={avatarUrl || ''} alt={fullName} />
                <AvatarFallback className="text-2xl">
                  {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-reporter-name">
                    {fullName}
                  </h1>
                  {isVerified && (
                    <CheckCircle2 
                      className="h-6 w-6 text-primary" 
                      data-testid="icon-verified"
                    />
                  )}
                </div>

                {title && (
                  <p className="text-lg text-muted-foreground" data-testid="text-reporter-title">
                    {title}
                  </p>
                )}

                {bio && (
                  <p className="text-base leading-relaxed max-w-3xl" data-testid="text-reporter-bio">
                    {bio}
                  </p>
                )}

                {/* Tags */}
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        data-testid={`badge-tag-${idx}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Badges */}
                {badges && badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {badges.map((badge) => (
                      <Badge 
                        key={badge.key}
                        variant="outline"
                        className="gap-1"
                        data-testid={`badge-achievement-${badge.key}`}
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">المقالات</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-articles">
                  {kpis.totalArticles}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">المشاهدات</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-views">
                  {kpis.totalViews.toLocaleString('ar-SA')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">الإعجابات</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-likes">
                  {kpis.totalLikes.toLocaleString('ar-SA')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">وقت القراءة</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-readtime">
                  {kpis.avgReadTimeMin}
                  <span className="text-base font-normal text-muted-foreground mr-1">د</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">نسبة الإكمال</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold" data-testid="text-kpi-completion">
                  {kpis.avgCompletionRate}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Articles */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold">أحدث المقالات</h2>
            
            {lastArticles && lastArticles.length > 0 ? (
              <div className="space-y-3">
                {lastArticles.map((article) => (
                  <Card key={article.id} className="hover-elevate">
                    <CardContent className="p-4">
                      <Link 
                        href={`/articles/${article.slug}`}
                        data-testid={`link-article-${article.id}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-base leading-snug flex-1">
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

                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {article.publishedAt && formatDistanceToNow(new Date(article.publishedAt), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.views.toLocaleString('ar-SA')}
                            </span>
                            {article.comments > 0 && (
                              <span>{article.comments} تعليق</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  لا توجد مقالات حديثة
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Categories */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">التصنيفات الأكثر كتابة</h2>
            
            {topCategories && topCategories.length > 0 ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  {topCategories.map((cat, idx) => (
                    <div key={idx} className="space-y-2" data-testid={`category-${idx}`}>
                      {idx > 0 && <Separator />}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: cat.color || undefined,
                            color: '#fff'
                          }}
                        >
                          {cat.name}
                        </Badge>
                        <span className="text-sm font-medium">
                          {cat.sharePct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{cat.articles} مقال</span>
                        <span>{cat.views.toLocaleString('ar-SA')} مشاهدة</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  لا توجد بيانات
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Timeline Chart */}
        {timeseries && timeseries.daily && timeseries.daily.length > 0 && (
          <Card>
            <CardHeader className="gap-1">
              <CardTitle>المشاهدات خلال {timeseries.windowDays} يوماً الماضية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeseries.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value as string);
                        return date.toLocaleDateString('ar-SA');
                      }}
                      formatter={(value: number) => [value.toLocaleString('ar-SA'), '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="المشاهدات"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
