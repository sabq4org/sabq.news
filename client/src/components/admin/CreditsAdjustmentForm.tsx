import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const creditsAdjustmentSchema = z.object({
  amount: z.number().min(1, "يجب أن تكون الكمية أكبر من صفر"),
  type: z.enum(["package_purchase", "bonus", "deduction", "adjustment"]),
  notes: z.string().min(1, "الملاحظات مطلوبة"),
  packageType: z.enum(["Basic", "Professional", "Enterprise"]).optional(),
});

type CreditsAdjustmentFormValues = z.infer<typeof creditsAdjustmentSchema>;

interface CreditsAdjustmentFormProps {
  publisherId: string;
  onSuccess?: () => void;
}

export function CreditsAdjustmentForm({ publisherId, onSuccess }: CreditsAdjustmentFormProps) {
  const { toast } = useToast();
  const form = useForm<CreditsAdjustmentFormValues>({
    resolver: zodResolver(creditsAdjustmentSchema),
    defaultValues: {
      type: "adjustment",
      amount: 100,
      notes: "",
    },
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: async (data: CreditsAdjustmentFormValues) => {
      return await apiRequest("/api/publisher/credits/adjust", {
        method: "POST",
        body: JSON.stringify({
          publisherId,
          ...data,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publishers"] });
      toast({
        title: "تم تعديل الرصيد",
        description: "تم تعديل رصيد الناشر بنجاح",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تعديل الرصيد",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreditsAdjustmentFormValues) => {
    adjustCreditsMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الكمية</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  data-testid="input-credits-amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>النوع</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                data-testid="select-credits-type"
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="package_purchase">شراء باقة</SelectItem>
                  <SelectItem value="bonus">مكافأة</SelectItem>
                  <SelectItem value="deduction">خصم</SelectItem>
                  <SelectItem value="adjustment">تعديل</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("type") === "package_purchase" && (
          <FormField
            control={form.control}
            name="packageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع الباقة</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  data-testid="select-package-type"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الباقة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الملاحظات</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="أدخل ملاحظات حول التعديل"
                  data-testid="textarea-credits-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={adjustCreditsMutation.isPending}
          className="w-full"
          data-testid="button-submit-credits"
        >
          {adjustCreditsMutation.isPending ? "جاري التعديل..." : "تعديل الرصيد"}
        </Button>
      </form>
    </Form>
  );
}
