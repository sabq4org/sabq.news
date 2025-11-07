import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

export default function CampaignEditor() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "إنشاء حملة جديدة - لوحة تحكم الإعلانات";
  }, []);

  return (
    <DashboardLayout>

      <div className="container mx-auto p-6" dir="rtl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard/ads/campaigns")}
            className="mb-4"
            data-testid="button-back-to-campaigns"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة إلى الحملات
          </Button>
          <h1 className="text-3xl font-bold">إنشاء حملة جديدة</h1>
          <p className="text-muted-foreground mt-2">
            قم بإنشاء حملة إعلانية جديدة للوصول إلى جمهورك المستهدف
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>نموذج الحملة الإعلانية</CardTitle>
            <CardDescription>
              سيتم إضافة نموذج إنشاء الحملة في التحديث القادم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                النموذج قيد التطوير...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
