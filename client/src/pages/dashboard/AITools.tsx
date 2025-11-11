import { DashboardLayout } from "@/components/DashboardLayout";
import { SmartHeadlineComparison } from "@/components/SmartHeadlineComparison";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AITools() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">الأدوات الذكية</h1>
          <p className="text-muted-foreground">
            استخدم نماذج الذكاء الاصطناعي المتقدمة لتحسين محتواك
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>300+ نموذج AI متاح</CardTitle>
            </div>
            <CardDescription>
              GPT-5، Claude Opus 4.1، Gemini 2.5 Pro، وأكثر من 300 نموذج ذكاء اصطناعي جاهز للاستخدام
            </CardDescription>
          </CardHeader>
        </Card>

        <SmartHeadlineComparison />
      </div>
    </DashboardLayout>
  );
}
