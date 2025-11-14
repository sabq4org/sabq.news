import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { MobileOptimizedKpiCard } from "@/components/MobileOptimizedKpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, ThumbsUp, Clock, TrendingUp, Calendar, CheckCircle2, FileText, Target, UserPlus, UserCheck, Users, Heart, Zap, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import type { ReporterProfile as ReporterProfileType } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function ReporterProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: profile, isLoading, error } = useQuery<ReporterProfileType>({
    queryKey: ['/api/reporters', slug],
    enabled: !!slug,
  });

  // Check if current user follows this reporter
  const { data: isFollowingData, isLoading: isLoadingIsFollowing } = useQuery<{
    isFollowing: boolean;
  }>({
    queryKey: ["/api/social/is-following", profile?.id],
    enabled: !!profile?.id && !!user,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Reporter ID not available");
      return apiRequest("/api/social/follow", {
        method: "POST",
        body: JSON.stringify({ followingId: profile.id }),
      });
    },
    onSuccess: () => {
      if (!profile?.id) return;
      queryClient.invalidateQueries({ queryKey: ["/api/social/is-following", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/followers", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تمت المتابعة",
        description: "أصبحت تتابع هذا المحرر",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشلت عملية المتابعة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Reporter ID not available");
      return apiRequest(`/api/social/unfollow/${profile.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      if (!profile?.id) return;
      queryClient.invalidateQueries({ queryKey: ["/api/social/is-following", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/followers", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تم إلغاء المتابعة",
        description: "لم تعد تتابع هذا المحرر",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشلت عملية إلغاء المتابعة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
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
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
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
    id: reporterId,
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

  // Check if viewing own profile
  const isOwnProfile = user?.id === reporterId;
  const isFollowing = isFollowingData?.isFollowing || false;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      {/* Statistics Cards Section - Moved to top */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <MobileOptimizedKpiCard
            label="المقالات"
            value={(kpis.totalArticles ?? 0).toLocaleString('en-US')}
            icon={FileText}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
            testId="text-kpi-articles"
          />
          
          <MobileOptimizedKpiCard
            label="المشاهدات"
            value={(kpis.totalViews ?? 0).toLocaleString('en-US')}
            icon={Eye}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/10"
            testId="text-kpi-views"
          />
          
          <MobileOptimizedKpiCard
            label="الإعجابات"
            value={(kpis.totalLikes ?? 0).toLocaleString('en-US')}
            icon={Heart}
            iconColor="text-red-500"
            iconBgColor="bg-red-500/10"
            testId="text-kpi-likes"
          />
          
          <MobileOptimizedKpiCard
            label="وقت القراءة"
            value={(kpis.avgReadTimeMin ?? 0).toLocaleString('en-US')}
            suffix="د"
            icon={Clock}
            iconColor="text-orange-500"
            iconBgColor="bg-orange-500/10"
            testId="text-kpi-readtime"
          />
          
          <MobileOptimizedKpiCard
            label="نسبة الإكمال"
            value={(kpis.avgCompletionRate ?? 0).toLocaleString('en-US')}
            suffix="%"
            icon={Target}
            iconColor="text-green-500"
            iconBgColor="bg-green-500/10"
            testId="text-kpi-completion"
          />
          
          <MobileOptimizedKpiCard
            label="المتابعون"
            value={(kpis.followers ?? 0).toLocaleString('en-US')}
            icon={Users}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/10"
            testId="text-kpi-followers"
          />
        </div>
      </div>

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden py-12"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--primary) / 0.02) 100%)'
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-36 w-36 md:h-40 md:w-40 border-2 border-background shadow-xl" data-testid="avatar-reporter">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="text-2xl">
                {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-right space-y-3">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-reporter-name">{fullName}</h1>
                {isVerified && <CheckCircle2 className="h-6 w-6 text-primary" data-testid="icon-verified" />}
              </div>
              {title && <p className="text-lg md:text-xl text-muted-foreground" data-testid="text-reporter-title">{title}</p>}
              {bio && <p className="text-base max-w-3xl" data-testid="text-reporter-bio">{bio}</p>}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {tags.map((tag, idx) => <Badge key={idx} variant="secondary" data-testid={`badge-tag-${idx}`}>{tag}</Badge>)}
                </div>
              )}
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {badges.map((badge) => <Badge key={badge.key} variant="outline" data-testid={`badge-achievement-${badge.key}`}>{badge.label}</Badge>)}
                </div>
              )}
              
              {/* Follow Button */}
              {user && !isOwnProfile && (
                <div className="flex justify-center md:justify-start pt-2">
                  {isFollowing ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => unfollowMutation.mutate()}
                      disabled={unfollowMutation.isPending || isLoadingIsFollowing}
                      className="gap-3"
                      data-testid="button-unfollow-reporter"
                    >
                      <UserCheck className="h-5 w-5" />
                      إلغاء المتابعة
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending || isLoadingIsFollowing}
                      className="gap-3"
                      data-testid="button-follow-reporter"
                    >
                      <UserPlus className="h-5 w-5" />
                      متابعة
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Articles */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">أحدث المقالات</h2>
              <Badge variant="secondary" className="text-sm">
                {lastArticles?.length ?? 0} مقال
              </Badge>
            </div>
            
            {lastArticles && lastArticles.length > 0 ? (
              <div className="space-y-3">
                {lastArticles.map((article) => (
                  <Card key={article.id} className="hover-elevate transition-all">
                    <CardContent className="p-6">
                      <Link 
                        href={`/article/${article.slug}`}
                        data-testid={`link-article-${article.id}`}
                      >
                        <div className="space-y-4">
                          {/* Header with title and breaking badge */}
                          <div className="flex items-start gap-3">
                            <h3 className="font-bold text-lg leading-snug flex-1">
                              {article.title}
                            </h3>
                            {article.isBreaking && (
                              <Badge variant="destructive" className="shrink-0 gap-1">
                                <Zap className="h-3 w-3" />
                                عاجل
                              </Badge>
                            )}
                          </div>

                          {/* Category badge */}
                          {article.category && (
                            <div>
                              <Badge 
                                variant="secondary"
                                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0"
                                data-testid={`badge-category-${article.id}`}
                              >
                                {article.category.name}
                              </Badge>
                            </div>
                          )}

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                            {article.publishedAt && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(new Date(article.publishedAt), {
                                  addSuffix: true,
                                  locale: ar,
                                })}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Eye className="h-4 w-4" />
                              {(article.views ?? 0).toLocaleString('en-US')} مشاهدة
                            </span>
                            {(article.comments ?? 0) > 0 && (
                              <span className="flex items-center gap-1.5">
                                <MessageSquare className="h-4 w-4" />
                                {(article.comments ?? 0).toLocaleString('en-US')} تعليق
                              </span>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">التصنيفات الأكثر كتابة</h2>
              <Badge variant="secondary" className="text-sm">
                أعلى {topCategories?.length ?? 0}
              </Badge>
            </div>
            
            {topCategories && topCategories.length > 0 ? (
              <div className="space-y-3">
                {topCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-3 p-4 rounded-lg hover-elevate transition-all" data-testid={`category-${idx}`}>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0"
                      >
                        {cat.name}
                      </Badge>
                      <span className="text-lg font-bold text-primary">
                        {cat.sharePct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {(cat.articles ?? 0).toLocaleString('en-US')} مقال
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        {(cat.views ?? 0).toLocaleString('en-US')} مشاهدة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
            <CardHeader className="gap-2 pb-4">
              <CardTitle className="text-2xl">المشاهدات خلال {timeseries.windowDays} يوماً الماضية</CardTitle>
              <p className="text-sm text-muted-foreground">
                إجمالي المشاهدات في الفترة المحددة
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
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
                      formatter={(value: number) => [value, '']}
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
