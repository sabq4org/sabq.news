import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function PerformanceAnalyticsTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <CardTitle>تحليلات الأداء</CardTitle>
        </div>
        <CardDescription>
          مقارنة أداء المحتوى AI vs البشري
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة لوحة التحليلات قريباً
        </div>
      </CardContent>
    </Card>
  );
}
