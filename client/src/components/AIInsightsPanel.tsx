import { motion } from "framer-motion";
import { Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AIInsights {
  dailySummary: string;
  topTopics: Array<{ name: string; score: number }>;
  activityTrend: string;
  keyHighlights: string[];
}

interface AIInsightsPanelProps {
  insights: AIInsights;
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                رؤى ذكية من AI
                <Badge variant="secondary" className="text-xs">
                  تحديث مباشر
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                تحليلات وأنماط مستنتجة من البيانات
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activity Trend */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">حالة النشاط</p>
              <p className="text-sm text-muted-foreground" data-testid="text-activity-trend">
                {insights.activityTrend}
              </p>
            </div>
          </div>

          {/* Key Highlights */}
          {insights.keyHighlights && insights.keyHighlights.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3">أبرز النقاط:</p>
              <div className="space-y-2">
                {insights.keyHighlights.map((highlight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3 p-2 rounded-lg hover-elevate"
                    data-testid={`highlight-${index}`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{highlight}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Summary */}
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground italic" data-testid="text-daily-summary">
              "{insights.dailySummary}"
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
