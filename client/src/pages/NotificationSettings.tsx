import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, Sparkles, TrendingUp, BookMarked, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NotificationPrefs {
  id: string;
  userId: string;
  breaking: boolean;
  interest: boolean;
  likedUpdates: boolean;
  mostRead: boolean;
  webPush: boolean;
  dailyDigest: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  updatedAt?: string;
}

export default function NotificationSettings() {
  const { toast } = useToast();

  const { data: prefs, isLoading } = useQuery<NotificationPrefs>({
    queryKey: ["/api/me/notification-prefs"],
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPrefs>) => {
      return await apiRequest("/api/me/notification-prefs", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/notification-prefs"] });
      toast({
        title: "✅ تم الحفظ",
        description: "تم حفظ إعدادات الإشعارات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    updatePrefsMutation.mutate({ [key]: value });
  };

  const handleQuietHoursChange = (start: string, end: string) => {
    updatePrefsMutation.mutate({
      quietHoursStart: start || null,
      quietHoursEnd: end || null,
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">إعدادات الإشعارات</h1>
        <p className="text-muted-foreground">
          تحكم في الإشعارات التي تتلقاها وأوقات استلامها
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              أنواع الإشعارات
            </CardTitle>
            <CardDescription>
              اختر الإشعارات التي تريد استلامها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Breaking News */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-destructive" />
                <div>
                  <Label htmlFor="breaking-news" className="text-base font-medium">
                    الأخبار العاجلة
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    احصل على إشعارات فورية بالأخبار العاجلة
                  </p>
                </div>
              </div>
              <Switch
                id="breaking-news"
                checked={prefs?.breaking ?? true}
                onCheckedChange={(checked) => handleToggle("breaking", checked)}
                data-testid="switch-breaking-news"
              />
            </div>

            {/* Interest Match */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="interest-match" className="text-base font-medium">
                    المقالات المطابقة لاهتماماتك
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    مقالات جديدة تتعلق بمواضيع تهمك
                  </p>
                </div>
              </div>
              <Switch
                id="interest-match"
                checked={prefs?.interest ?? true}
                onCheckedChange={(checked) => handleToggle("interest", checked)}
                data-testid="switch-interest-match"
              />
            </div>

            {/* Liked Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookMarked className="h-5 w-5 text-accent" />
                <div>
                  <Label htmlFor="liked-updates" className="text-base font-medium">
                    تحديثات المقالات المفضلة
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    تحديثات على المقالات التي أعجبتك أو حفظتها
                  </p>
                </div>
              </div>
              <Switch
                id="liked-updates"
                checked={prefs?.likedUpdates ?? true}
                onCheckedChange={(checked) => handleToggle("likedUpdates", checked)}
                data-testid="switch-liked-updates"
              />
            </div>

            {/* Most Read */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-chart-1" />
                <div>
                  <Label htmlFor="most-read" className="text-base font-medium">
                    الأكثر قراءة اليوم
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    ملخص يومي للمقالات الأكثر قراءة في اهتماماتك
                  </p>
                </div>
              </div>
              <Switch
                id="most-read"
                checked={prefs?.mostRead ?? true}
                onCheckedChange={(checked) => handleToggle("mostRead", checked)}
                data-testid="switch-most-read"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              أوقات الهدوء
            </CardTitle>
            <CardDescription>
              حدد الأوقات التي لا تريد استلام إشعارات فيها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">بداية وقت الهدوء</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={prefs?.quietHoursStart || ""}
                  onChange={(e) => handleQuietHoursChange(e.target.value, prefs?.quietHoursEnd || "")}
                  data-testid="input-quiet-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">نهاية وقت الهدوء</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={prefs?.quietHoursEnd || ""}
                  onChange={(e) => handleQuietHoursChange(prefs?.quietHoursStart || "", e.target.value)}
                  data-testid="input-quiet-end"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              خلال هذه الأوقات، ستستمر في استلام الإشعارات في صندوق الوارد، لكن لن يتم إرسال تنبيهات فورية
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              toast({
                title: "✅ الإعدادات محفوظة",
                description: "يتم حفظ التغييرات تلقائياً",
              });
            }}
            data-testid="button-save-settings"
          >
            تم الحفظ
          </Button>
        </div>
      </div>
    </div>
  );
}
