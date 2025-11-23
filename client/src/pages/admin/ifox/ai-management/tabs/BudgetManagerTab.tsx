import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function BudgetManagerTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          <CardTitle>إدارة الميزانية</CardTitle>
        </div>
        <CardDescription>
          تتبع تكاليف APIs والميزانية
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة لوحة الميزانية قريباً
        </div>
      </CardContent>
    </Card>
  );
}
