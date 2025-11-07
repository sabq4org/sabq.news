import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { ArrowRight } from "lucide-react";

export default function CampaignDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const campaignId = params.id;

  useEffect(() => {
    document.title = "تفاصيل الحملة - لوحة تحكم الإعلانات";
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
          <h1 className="text-3xl font-bold">تفاصيل الحملة</h1>
          <p className="text-muted-foreground mt-2">
            معرف الحملة: {campaignId}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الحملة</CardTitle>
            <CardDescription>
              سيتم إضافة تفاصيل الحملة والإحصائيات في التحديث القادم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                صفحة التفاصيل قيد التطوير...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
