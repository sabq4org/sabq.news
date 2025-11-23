import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AiPreferencesTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle>إعدادات الذكاء الاصطناعي</CardTitle>
        </div>
        <CardDescription>
          تخصيص إعدادات توليد المحتوى بالذكاء الاصطناعي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة واجهة الإعدادات قريباً
        </div>
      </CardContent>
    </Card>
  );
}
