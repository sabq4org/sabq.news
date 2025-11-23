import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function EditorialCalendarTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <CardTitle>التقويم التحريري</CardTitle>
        </div>
        <CardDescription>
          جدولة ونشر المحتوى التلقائي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة التقويم قريباً
        </div>
      </CardContent>
    </Card>
  );
}
