import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function QualityChecksTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <CardTitle>فحوصات الجودة</CardTitle>
        </div>
        <CardDescription>
          مراقبة جودة المحتوى المُولد
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة لوحة الجودة قريباً
        </div>
      </CardContent>
    </Card>
  );
}
