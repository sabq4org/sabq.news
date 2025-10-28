import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Users, 
  MessageCircle,
  BarChart3,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

interface AIInsightsData {
  dailySummary: string;
  topTopics: Array<{ name: string; score: number }>;
  activityTrend: string;
  userEngagement: {
    activeUsers: number;
    totalComments: number;
    totalReactions: number;
  };
  keyHighlights: string[];
}

export function MomentAIInsights() {
  const { data, isLoading } = useQuery<AIInsightsData>({
    queryKey: ["/api/moment/ai-insights"],
  });

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden"
        data-testid="card-ai-insights"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>نبض اللحظة - ملخص ذكي</span>
            <Badge variant="secondary" className="mr-auto">
              <Activity className="h-3 w-3 ml-1" />
              حي
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Summary */}
          <div className="p-4 bg-card rounded-lg border border-primary/10">
            <p className="text-sm leading-relaxed text-muted-foreground" data-testid="text-ai-summary">
              {data.dailySummary}
            </p>
          </div>

          {/* Live Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المستخدمون النشطون</p>
                  <p className="text-2xl font-bold" data-testid="stat-active-users">
                    {data.userEngagement.activeUsers}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">التعليقات اليوم</p>
                  <p className="text-2xl font-bold" data-testid="stat-comments">
                    {data.userEngagement.totalComments}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Zap className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">التفاعلات</p>
                  <p className="text-2xl font-bold" data-testid="stat-reactions">
                    {data.userEngagement.totalReactions}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Top Trending Topics */}
          {data.topTopics && data.topTopics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">المواضيع الأكثر نشاطاً الآن</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.topTopics.map((topic, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover-elevate"
                    data-testid={`badge-trending-${index}`}
                  >
                    {topic.name}
                    <span className="mr-2 text-xs opacity-70">•</span>
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {topic.score}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Key Highlights */}
          {data.keyHighlights && data.keyHighlights.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3">أبرز الأحداث</h4>
              <ul className="space-y-2">
                {data.keyHighlights.map((highlight, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                    data-testid={`highlight-${index}`}
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Activity Trend */}
          <div className="p-3 bg-muted/50 rounded-lg border-r-4 border-primary">
            <p className="text-xs font-medium text-primary mb-1">اتجاه النشاط</p>
            <p className="text-sm" data-testid="text-activity-trend">
              {data.activityTrend}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
