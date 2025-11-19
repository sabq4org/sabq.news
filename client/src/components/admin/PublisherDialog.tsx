import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const publisherFormSchema = z.object({
  agencyName: z.string().min(2, "اسم المؤسسة مطلوب"),
  contactPersonName: z.string().min(2, "اسم المسؤول مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(9, "رقم الهاتف غير صالح"),
  initialCredits: z.number().min(0, "النقاط يجب أن تكون صفر أو أكثر").default(100),
  packageType: z.enum(["Basic", "Professional", "Enterprise"]).default("Basic"),
  isActive: z.boolean().default(true),
});

type PublisherFormValues = z.infer<typeof publisherFormSchema>;

interface PublisherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  publisher?: {
    id: string;
    agencyName: string;
    contactPersonName: string;
    email: string;
    phone: string;
    packageType: string;
    isActive: boolean;
    userId: string;
  } | null;
}

export function PublisherDialog({ isOpen, onClose, publisher }: PublisherDialogProps) {
  const { toast } = useToast();
  const isEditing = !!publisher;

  const form = useForm<PublisherFormValues>({
    resolver: zodResolver(publisherFormSchema),
    defaultValues: {
      agencyName: "",
      contactPersonName: "",
      email: "",
      phone: "",
      initialCredits: 100,
      packageType: "Basic",
      isActive: true,
    },
  });

  useEffect(() => {
    if (publisher) {
      form.reset({
        agencyName: publisher.agencyName,
        contactPersonName: publisher.contactPersonName,
        email: publisher.email,
        phone: publisher.phone,
        packageType: publisher.packageType as "Basic" | "Professional" | "Enterprise",
        isActive: publisher.isActive,
        initialCredits: 100, // Not used when editing
      });
    } else {
      form.reset({
        agencyName: "",
        contactPersonName: "",
        email: "",
        phone: "",
        initialCredits: 100,
        packageType: "Basic",
        isActive: true,
      });
    }
  }, [publisher, form]);

  const createPublisherMutation = useMutation({
    mutationFn: async (data: PublisherFormValues) => {
      let userId = publisher?.userId;

      // Step 1: Check if user exists (for new publishers)
      if (!isEditing) {
        try {
          const existingUser = await apiRequest(`/api/admin/users/search?email=${data.email}`);
          userId = existingUser.id;
        } catch (error: any) {
          // User doesn't exist, create new user
          if (error.message.includes("not found") || error.message.includes("404")) {
            const newUser = await apiRequest("/api/admin/users", {
              method: "POST",
              body: JSON.stringify({
                email: data.email,
                firstName: data.contactPersonName,
                lastName: "",
                role: "publisher",
              }),
            });
            userId = newUser.id;
          } else {
            throw error;
          }
        }
      }

      // Step 2: Create or Update Publisher
      const publisherData = {
        userId,
        agencyName: data.agencyName,
        contactPersonName: data.contactPersonName,
        email: data.email,
        phone: data.phone,
        packageType: data.packageType,
        isActive: data.isActive,
      };

      let publisherResult;
      if (isEditing) {
        publisherResult = await apiRequest(`/api/admin/publishers/${publisher.id}`, {
          method: "PUT",
          body: JSON.stringify(publisherData),
        });
      } else {
        publisherResult = await apiRequest("/api/admin/publishers", {
          method: "POST",
          body: JSON.stringify(publisherData),
        });
      }

      // Step 3: Initialize credits (only for new publishers)
      if (!isEditing && data.initialCredits > 0) {
        await apiRequest("/api/publisher/credits/adjust", {
          method: "POST",
          body: JSON.stringify({
            publisherId: publisherResult.id,
            amount: data.initialCredits,
            type: "package_purchase",
            packageType: data.packageType,
            notes: `Initial credits for ${data.agencyName}`,
          }),
        });
      }

      return publisherResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publishers"] });
      toast({
        title: isEditing ? "تم التحديث" : "تم الإنشاء",
        description: isEditing
          ? "تم تحديث بيانات الناشر بنجاح"
          : "تم إنشاء الناشر بنجاح",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ البيانات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PublisherFormValues) => {
    createPublisherMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-publisher">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "تعديل ناشر" : "إضافة ناشر جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "تحديث بيانات الناشر"
              : "إنشاء حساب ناشر جديد في النظام"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="agencyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المؤسسة</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-agency-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المسؤول</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-contact-person" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        disabled={isEditing}
                        data-testid="input-publisher-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="input-publisher-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEditing && (
              <FormField
                control={form.control}
                name="initialCredits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النقاط الأولية</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-initial-credits"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select
                      value={field.value ? "active" : "inactive"}
                      onValueChange={(value) => field.onChange(value === "active")}
                      data-testid="select-publisher-status"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createPublisherMutation.isPending}
                data-testid="button-cancel-publisher"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createPublisherMutation.isPending}
                data-testid="button-submit-publisher"
              >
                {createPublisherMutation.isPending
                  ? "جاري الحفظ..."
                  : isEditing
                  ? "تحديث"
                  : "إنشاء"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
