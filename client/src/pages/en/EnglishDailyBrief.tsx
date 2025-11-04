import { useQuery } from "@tanstack/react-query";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Sun, 
  RefreshCw, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Heart,
  BookOpen,
  Bookmark,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Eye,
  Brain,
  Search,
  Zap,
  Crosshair,
  BarChart3,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailySummary {
  personalizedGreeting: {
    userName: string;
    articlesReadToday: number;
    readingTimeMinutes: number;
    topCategories: string[];
    readingMood: string;
  };
  metrics: {
    articlesRead: number;
    readingTimeMinutes: number;
    completionRate: number;
    articlesBookmarked: number;
    articlesLiked: number;
    commentsPosted: number;
    percentChangeFromYesterday: number;
  };
  interestAnalysis: {
    topCategories: Array<{ name: string; count: number }>;
    topicsThatCatchAttention: string[];
    suggestedArticles: Array<{
      id: string;
      title: string;
      slug: string;
      categoryName: string;
    }>;
  };
  timeActivity: {
    hourlyBreakdown: Array<{ hour: number; count: number }>;
    peakReadingTime: number;
    lowActivityPeriod: number;
    aiSuggestion: string;
  };
  aiInsights: {
    readingMood: string;
    dailyGoal: string;
    focusScore: number;
  };
  generatedAt: string;
}

export default function EnglishDailyBrief() {
  const { data: summary, isLoading, error, refetch } = useQuery<DailySummary>({
    queryKey: ["/api/ai/daily-summary"],
    retry: false,
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/ai/daily-summary"] });
    refetch();
  };

  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getMoodIcon = (mood: string) => {
    const normalizedMood = mood.toLowerCase();
    if (normalizedMood.includes("analytical") || normalizedMood.includes("تحليلي")) 
      return <Brain className="h-12 w-12 text-primary" />;
    if (normalizedMood.includes("curious") || normalizedMood.includes("فضولي")) 
      return <Search className="h-12 w-12 text-primary" />;
    if (normalizedMood.includes("fast") || normalizedMood.includes("سريع")) 
      return <Zap className="h-12 w-12 text-primary" />;
    if (normalizedMood.includes("critical") || normalizedMood.includes("نقدي")) 
      return <Crosshair className="h-12 w-12 text-primary" />;
    return <BookOpen className="h-12 w-12 text-primary" />;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  if (error) {
    return (
      <EnglishLayout>
        <main className="min-h-screen bg-background py-8">
          <div className="container max-w-6xl mx-auto px-4">
            <Card data-testid="card-no-activity">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2" data-testid="text-no-activity-title">
                  Not Enough Data
                </h2>
                <p className="text-muted-foreground mb-6" data-testid="text-no-activity-description">
                  We couldn't find any reading activity in the last 24 hours
                </p>
                <Button asChild data-testid="button-explore-news">
                  <Link href="/en/news">
                    Explore News
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </EnglishLayout>
    );
  }

  return (
    <EnglishLayout>
      <main className="min-h-screen bg-background py-8">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3" data-testid="text-daily-brief-title">
                  <Sun className="h-8 w-8 text-yellow-500" />
                  {isLoading ? "Loading..." : `${getGreeting()}, ${summary?.personalizedGreeting.userName || ""}!`}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2" data-testid="text-current-date">
                    <Calendar className="h-4 w-4" />
                    <span>{todayFormatted}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                data-testid="button-refresh-brief"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <Separator className="my-4" />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6" data-testid="loading-state">
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
              </Card>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && summary && (
            <>
              {/* Metrics Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card data-testid="card-articles-read">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Articles Read</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.metrics.articlesRead}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      {getChangeIcon(summary.metrics.percentChangeFromYesterday)}
                      <span className="ml-1">
                        {summary.metrics.percentChangeFromYesterday > 0 ? '+' : ''}
                        {summary.metrics.percentChangeFromYesterday}% from yesterday
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-reading-time">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.metrics.readingTimeMinutes} min</div>
                    <Progress value={summary.metrics.completionRate} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.metrics.completionRate}% completion rate
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-interactions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Interactions</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold">{summary.metrics.articlesLiked}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-semibold">{summary.metrics.articlesBookmarked}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold">{summary.metrics.commentsPosted}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights */}
              {summary.aiInsights && (
                <Card className="mb-8" data-testid="card-ai-insights">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-4">
                      {getMoodIcon(summary.aiInsights.readingMood)}
                      <h3 className="font-semibold mt-3 mb-1">Reading Mood</h3>
                      <p className="text-sm text-muted-foreground">{summary.aiInsights.readingMood}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                      <Lightbulb className="h-12 w-12 text-primary" />
                      <h3 className="font-semibold mt-3 mb-1">Daily Goal</h3>
                      <p className="text-sm text-muted-foreground">{summary.aiInsights.dailyGoal}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                      <BarChart3 className="h-12 w-12 text-primary" />
                      <h3 className="font-semibold mt-3 mb-1">Focus Score</h3>
                      <p className="text-2xl font-bold text-primary">{summary.aiInsights.focusScore}/100</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Articles */}
              {summary.interestAnalysis?.suggestedArticles?.length > 0 && (
                <Card data-testid="card-suggested-articles">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Recommended for You
                    </CardTitle>
                    <CardDescription>
                      Based on your reading habits and interests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summary.interestAnalysis.suggestedArticles.map((article) => (
                        <Link key={article.id} href={`/en/article/${article.slug}`}>
                          <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer">
                            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium mb-1 line-clamp-2">{article.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {article.categoryName}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </EnglishLayout>
  );
}
