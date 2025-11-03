import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { z } from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Calendar, Save } from "lucide-react";
import { Link } from "wouter";

const eventSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  type: z.enum(["GLOBAL", "NATIONAL", "INTERNAL"]),
  dateStart: z.string().min(1, "تاريخ البدء مطلوب"),
  dateEnd: z.string().optional(),
  importance: z.coerce.number().min(1).max(5),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function CalendarEventForm() {
  const [, params] = useRoute("/dashboard/calendar/:action");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = params?.action === "new";

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "GLOBAL",
      dateStart: "",
      dateEnd: "",
      importance: 3,
      categoryId: "",
      tags: "",
    },
  });

  const createEvent = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()) : [],
        categoryId: data.categoryId || null,
        dateEnd: data.dateEnd || null,
      };
      return await apiRequest("/api/calendar/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "تم الحفظ",
        description: "تم إضافة المناسبة بنجاح",
      });
      navigate("/dashboard/calendar");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ المناسبة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormValues) => {
    createEvent.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/calendar">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? "إضافة مناسبة جديدة" : "تعديل المناسبة"}
            </h1>
            <p className="text-muted-foreground">
              أضف مناسبة إلى التقويم التحريري
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>معلومات المناسبة</CardTitle>
            <CardDescription>
              املأ البيانات أدناه لإضافة مناسبة جديدة إلى التقويم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان المناسبة *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: اليوم العالمي للمرأة"
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="وصف تفصيلي للمناسبة..."
                          rows={4}
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع المناسبة *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GLOBAL">عالمي</SelectItem>
                            <SelectItem value="NATIONAL">وطني</SelectItem>
                            <SelectItem value="INTERNAL">داخلي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="importance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الأهمية (1-5) *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-importance">
                              <SelectValue placeholder="اختر الأهمية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 - منخفضة</SelectItem>
                            <SelectItem value="2">2 - متوسطة</SelectItem>
                            <SelectItem value="3">3 - عادية</SelectItem>
                            <SelectItem value="4">4 - مهمة</SelectItem>
                            <SelectItem value="5">5 - مهمة جداً</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dateStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ البدء *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-date-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الانتهاء (اختياري)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-date-end"
                          />
                        </FormControl>
                        <FormDescription>
                          للمناسبات التي تستمر لأكثر من يوم
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التصنيف (اختياري)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="اختر تصنيفاً" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">بدون تصنيف</SelectItem>
                          {(categories as any[]).map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوسوم (اختياري)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="افصل بين الوسوم بفاصلة، مثال: صحة، تعليم، تكنولوجيا"
                          {...field}
                          data-testid="input-tags"
                        />
                      </FormControl>
                      <FormDescription>
                        افصل بين الوسوم بفاصلة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createEvent.isPending}
                    data-testid="button-submit"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    {createEvent.isPending ? "جاري الحفظ..." : "حفظ المناسبة"}
                  </Button>
                  <Link href="/dashboard/calendar">
                    <Button variant="outline" type="button" data-testid="button-cancel">
                      إلغاء
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
