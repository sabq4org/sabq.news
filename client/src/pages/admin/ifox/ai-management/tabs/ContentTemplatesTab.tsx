import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookTemplate } from "lucide-react";

export default function ContentTemplatesTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookTemplate className="w-5 h-5" />
          <CardTitle>مكتبة القوالب</CardTitle>
        </div>
        <CardDescription>
          إدارة قوالب المحتوى الجاهزة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة مكتبة القوالب قريباً
        </div>
      </CardContent>
    </Card>
  );
}
