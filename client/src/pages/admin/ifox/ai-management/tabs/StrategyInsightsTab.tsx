import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function StrategyInsightsTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          <CardTitle>التوصيات الاستراتيجية</CardTitle>
        </div>
        <CardDescription>
          توصيات ذكية لتحسين المحتوى
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة التوصيات قريباً
        </div>
      </CardContent>
    </Card>
  );
}
