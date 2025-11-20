import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Upload, X } from "lucide-react";
import type { Publisher } from "@shared/schema";

const publisherFormSchema = z.object({
  userId: z.string().min(1, "يرجى اختيار مستخدم"),
  agencyName: z.string().min(2, "اسم الوكالة مطلوب (حرفين على الأقل)"),
  agencyNameEn: z.string().optional(),
  contactPerson: z.string().min(2, "اسم الشخص المسؤول مطلوب"),
  contactPersonEn: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phoneNumber: z.string().min(8, "رقم الهاتف مطلوب"),
  logoUrl: z.string().nullable().optional(),
  commercialRegistration: z.string().optional(),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

type PublisherFormData = z.infer<typeof publisherFormSchema>;

interface CreatePublisherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publisher?: Publisher;
  mode?: "create" | "edit";
}

export function CreatePublisherDialog({
  open,
  onOpenChange,
  publisher,
  mode = "create",
}: CreatePublisherDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(publisher?.logoUrl || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Fetch users with publisher role for selection
  const { data: publisherUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users", { role: "publisher" }],
    enabled: mode === "create",
  });

  const form = useForm<PublisherFormData>({
    resolver: zodResolver(publisherFormSchema),
    defaultValues: publisher
      ? {
          userId: publisher.userId,
          agencyName: publisher.agencyName,
          agencyNameEn: publisher.agencyNameEn || "",
          contactPerson: publisher.contactPerson,
          contactPersonEn: publisher.contactPersonEn || "",
          email: publisher.email,
          phoneNumber: publisher.phoneNumber,
          logoUrl: publisher.logoUrl || null,
          commercialRegistration: publisher.commercialRegistration || "",
          taxNumber: publisher.taxNumber || "",
          address: publisher.address || "",
          isActive: publisher.isActive,
          notes: publisher.notes || "",
        }
      : {
          userId: "",
          agencyName: "",
          agencyNameEn: "",
          contactPerson: "",
          contactPersonEn: "",
          email: "",
          phoneNumber: "",
          logoUrl: null,
          commercialRegistration: "",
          taxNumber: "",
          address: "",
          isActive: true,
          notes: "",
        },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة فقط",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload logo immediately
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/publishers/upload-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('فشل في رفع اللوقو');
      }

      const data = await response.json();
      form.setValue('logoUrl', data.url);
      
      toast({
        title: "تم رفع اللوقو",
        description: "تم رفع شعار الناشر بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع اللوقو",
        variant: "destructive",
      });
      setLogoFile(null);
      setLogoPreview(publisher?.logoUrl || null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    form.setValue('logoUrl', null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: PublisherFormData) => {
      const endpoint = mode === "create" 
        ? "/api/admin/publishers" 
        : `/api/admin/publishers/${publisher?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      
      return apiRequest(endpoint, {
        method,
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publishers"] });
      toast({
        title: mode === "create" ? "تم إنشاء الناشر" : "تم تحديث الناشر",
        description: mode === "create" 
          ? "تم إنشاء حساب الناشر بنجاح" 
          : "تم تحديث بيانات الناشر بنجاح",
      });
      onOpenChange(false);
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

  const onSubmit = async (data: PublisherFormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-create-publisher">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "إضافة ناشر جديد" : "تعديل بيانات الناشر"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "أدخل بيانات الناشر الجديد. الحقول المطلوبة مُعلّمة بـ *" 
              : "تعديل بيانات الناشر"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === "create" && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستخدم *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user">
                          <SelectValue placeholder="اختر مستخدماً من قائمة الناشرين" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {publisherUsers?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agencyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الوكالة (عربي) *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-agency-name" dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agencyNameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الوكالة (إنجليزي)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-agency-name-en" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الشخص المسؤول (عربي) *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-contact-person" dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPersonEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الشخص المسؤول (إنجليزي)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-contact-person-en" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف *</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <FormLabel>شعار الناشر / الوكالة</FormLabel>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Publisher Logo"
                      className="h-24 w-24 object-contain border rounded-md"
                      data-testid="img-logo-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveLogo}
                      disabled={isUploadingLogo}
                      data-testid="button-remove-logo"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-24 w-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={isUploadingLogo}
                    data-testid="input-logo"
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {isUploadingLogo ? "جاري رفع الشعار..." : "صورة بصيغة PNG أو JPG (حجم أقصى 5 ميجابايت)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commercialRegistration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السجل التجاري</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-commercial-reg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرقم الضريبي</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-tax-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Textarea {...field} data-testid="textarea-address" dir="rtl" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (للإدارة فقط)</FormLabel>
                  <FormControl>
                    <Textarea {...field} data-testid="textarea-notes" dir="rtl" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>الحساب نشط</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      عند التعطيل، لن يتمكن الناشر من إضافة مقالات جديدة
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-is-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "إنشاء الناشر" : "حفظ التعديلات"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
