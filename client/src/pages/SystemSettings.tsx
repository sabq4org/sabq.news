import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Settings, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

interface AnnouncementData {
  message: string;
  type: "info" | "success" | "warning" | "danger";
  isActive: boolean;
}

const announcementSchema = z.object({
  message: z.string().min(1, "الرجاء إدخال نص الإعلان"),
  type: z.enum(["info", "success", "warning", "danger"]),
  isActive: z.boolean(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function SystemSettings() {
  const { toast } = useToast();

  const { data: announcement, isLoading } = useQuery<AnnouncementData>({
    queryKey: ["/api/system/announcement"],
  });

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: announcement?.message || "",
      type: announcement?.type || "info",
      isActive: announcement?.isActive || false,
    },
    values: announcement ? {
      message: announcement.message || "",
      type: announcement.type || "info",
      isActive: announcement.isActive || false,
    } : undefined,
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      return await apiRequest("/api/system/announcement", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/announcement"] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الإعلان بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    updateAnnouncementMutation.mutate(data);
  };

  const typeConfig = {
    info: {
      icon: Info,
      label: "معلومة",
      color: "text-blue-500",
    },
    success: {
      icon: CheckCircle,
      label: "نجاح",
      color: "text-green-500",
    },
    warning: {
      icon: AlertTriangle,
      label: "تحذير",
      color: "text-yellow-500",
    },
    danger: {
      icon: AlertCircle,
      label: "خطر",
      color: "text-red-500",
    },
  };

  const currentType = form.watch("type");
  const currentIsActive = form.watch("isActive");
  const TypeIcon = typeConfig[currentType].icon;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Settings className="h-8 w-8" />
            إعدادات النظام
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة إعدادات النظام والإعلانات الداخلية
          </p>
        </div>

        {/* Current Announcement Status */}
        {announcement?.isActive && announcement?.message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإعلان الحالي</CardTitle>
              <CardDescription>معاينة الإعلان النشط حالياً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 rounded-lg border-2" style={{
                borderColor: currentType === 'info' ? '#3b82f6' : 
                             currentType === 'success' ? '#22c55e' : 
                             currentType === 'warning' ? '#eab308' : '#ef4444',
                backgroundColor: currentType === 'info' ? 'rgba(59, 130, 246, 0.1)' : 
                                 currentType === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                                 currentType === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              }}>
                <TypeIcon className={`h-5 w-5 flex-shrink-0 ${typeConfig[announcement.type].color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{announcement.message}</p>
                </div>
                <Badge variant={announcement.isActive ? "default" : "secondary"}>
                  {announcement.isActive ? "نشط" : "غير نشط"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Announcement Form */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة الإعلان الداخلي</CardTitle>
            <CardDescription>
              قم بإنشاء أو تعديل الإعلان الذي يظهر لجميع المستخدمين في أعلى الصفحة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Message Field */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نص الإعلان</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اكتب نص الإعلان هنا..."
                          className="resize-none min-h-[100px]"
                          data-testid="textarea-announcement-message"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        الرسالة التي ستظهر للمستخدمين في شريط الإعلان
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type Field */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الإعلان</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-type">
                            <SelectValue placeholder="اختر نوع الإعلان" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">
                            <span className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              معلومة
                            </span>
                          </SelectItem>
                          <SelectItem value="success">
                            <span className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              نجاح
                            </span>
                          </SelectItem>
                          <SelectItem value="warning">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              تحذير
                            </span>
                          </SelectItem>
                          <SelectItem value="danger">
                            <span className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              خطر
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        نوع الإعلان يحدد اللون والأيقونة المستخدمة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Active Switch */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">تفعيل الإعلان</FormLabel>
                        <FormDescription>
                          عند التفعيل، سيظهر الإعلان لجميع المستخدمين
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-announcement-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Preview */}
                {form.watch("message") && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">معاينة:</p>
                    <div className="flex items-start gap-3 p-3 rounded-md" style={{
                      borderColor: currentType === 'info' ? '#3b82f6' : 
                                   currentType === 'success' ? '#22c55e' : 
                                   currentType === 'warning' ? '#eab308' : '#ef4444',
                      backgroundColor: currentType === 'info' ? 'rgba(59, 130, 246, 0.1)' : 
                                       currentType === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                                       currentType === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid',
                    }}>
                      <TypeIcon className={`h-5 w-5 flex-shrink-0 ${typeConfig[currentType].color}`} />
                      <p className="text-sm flex-1" data-testid="text-preview-message">{form.watch("message")}</p>
                      {currentIsActive && (
                        <Badge variant="default" className="text-xs">نشط</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateAnnouncementMutation.isPending}
                    data-testid="button-save-announcement"
                  >
                    {updateAnnouncementMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
