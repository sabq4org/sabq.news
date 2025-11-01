import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const newChannelSchema = z.object({
  type: z.enum(["group", "channel"]),
  name: z.string().min(1, "اسم القناة مطلوب").max(100, "اسم القناة يجب ألا يتجاوز 100 حرف"),
  description: z.string().max(500, "الوصف يجب ألا يتجاوز 500 حرف").optional(),
  category: z.enum(["desk", "department", "team", "custom"]),
  departmentType: z.enum(["local", "world", "sports", "economy", "technology", "health", "culture", "entertainment"]).optional(),
  isPrivate: z.boolean(),
});

type NewChannelFormData = z.infer<typeof newChannelSchema>;

interface NewChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
}

export function NewChannelDialog({
  open,
  onOpenChange,
  onChannelCreated,
}: NewChannelDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<NewChannelFormData>({
    resolver: zodResolver(newChannelSchema),
    defaultValues: {
      type: "group",
      name: "",
      description: "",
      category: "custom",
      isPrivate: true,
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: NewChannelFormData) => {
      if (!user) throw new Error("User not authenticated");
      
      return await apiRequest("/api/chat/channels", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          createdBy: user.id,
        }),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels"] });
      toast({
        title: "تم إنشاء القناة",
        description: "تم إنشاء القناة الجديدة بنجاح",
      });
      form.reset();
      onOpenChange(false);
      if (onChannelCreated) {
        onChannelCreated(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في إنشاء القناة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewChannelFormData) => {
    createChannelMutation.mutate(data);
  };

  const category = form.watch("category");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl" data-testid="new-channel-dialog">
        <DialogHeader>
          <DialogTitle>قناة جديدة</DialogTitle>
          <DialogDescription>
            أنشئ قناة أو مجموعة جديدة للتواصل مع الفريق
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع القناة</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={createChannelMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-channel-type">
                        <SelectValue placeholder="اختر نوع القناة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="group">مجموعة</SelectItem>
                      <SelectItem value="channel">قناة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    المجموعة: محادثة خاصة لفريق صغير. القناة: للبث لعدد كبير.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم القناة</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: فريق التحرير"
                      {...field}
                      disabled={createChannelMutation.isPending}
                      data-testid="input-channel-name"
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
                  <FormLabel>الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف مختصر للقناة..."
                      className="resize-none"
                      {...field}
                      disabled={createChannelMutation.isPending}
                      data-testid="input-channel-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفئة</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={createChannelMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="desk">ديسك</SelectItem>
                      <SelectItem value="department">قسم</SelectItem>
                      <SelectItem value="team">فريق</SelectItem>
                      <SelectItem value="custom">مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {category === "department" && (
              <FormField
                control={form.control}
                name="departmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع القسم</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={createChannelMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-department-type">
                          <SelectValue placeholder="اختر نوع القسم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="local">محلي</SelectItem>
                        <SelectItem value="world">عالمي</SelectItem>
                        <SelectItem value="sports">رياضة</SelectItem>
                        <SelectItem value="economy">اقتصاد</SelectItem>
                        <SelectItem value="technology">تقنية</SelectItem>
                        <SelectItem value="health">صحة</SelectItem>
                        <SelectItem value="culture">ثقافة</SelectItem>
                        <SelectItem value="entertainment">ترفيه</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      قناة خاصة
                    </FormLabel>
                    <FormDescription>
                      القنوات الخاصة تتطلب دعوة للانضمام
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={createChannelMutation.isPending}
                      data-testid="switch-is-private"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={createChannelMutation.isPending}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createChannelMutation.isPending}
                data-testid="button-create-channel"
              >
                {createChannelMutation.isPending ? "جاري الإنشاء..." : "إنشاء القناة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
