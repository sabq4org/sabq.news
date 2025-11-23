import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow } from "lucide-react";

export default function WorkflowRulesTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          <CardTitle>قواعد سير العمل</CardTitle>
        </div>
        <CardDescription>
          تكوين القواعد التلقائية لسير العمل
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قيد التطوير - سيتم إضافة إدارة القواعد قريباً
        </div>
      </CardContent>
    </Card>
  );
}
