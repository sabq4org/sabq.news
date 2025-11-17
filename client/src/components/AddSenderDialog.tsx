import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TrustedEmailSender } from "@shared/schema";

const formSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  language: z.enum(["ar", "en", "ur"]),
  autoPublish: z.boolean(),
  defaultCategory: z.string().optional(),
  reporterUserId: z.string().optional(),
  status: z.enum(["active", "suspended", "revoked"]),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  nameAr: string;
  status: string;
}

interface Reporter {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface AddSenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues & { token?: string }) => Promise<void>;
  editingSender?: TrustedEmailSender | null;
  isSubmitting?: boolean;
}

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function AddSenderDialog({
  open,
  onOpenChange,
  onSubmit,
  editingSender,
  isSubmitting,
}: AddSenderDialogProps) {
  const { toast } = useToast();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories', { credentials: 'include' });
      if (!res.ok) throw new Error('فشل في تحميل التصنيفات');
      return await res.json();
    },
  });

  // Fetch reporters (users with reporter role)
  const { data: reporters } = useQuery<Reporter[]>({
    queryKey: ['/api/users/reporters'],
    queryFn: async () => {
      const res = await fetch('/api/users?role=reporter', { credentials: 'include' });
      if (!res.ok) throw new Error('فشل في تحميل المراسلين');
      const users = await res.json();
      console.log('📊 [Reporters Dropdown] Total reporters fetched:', users.length);
      console.log('📋 [Reporters Dropdown] Reporters list:', users);
      // API already filters by role=reporter, no need to filter again
      return users;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      language: "ar",
      autoPublish: true,
      defaultCategory: undefined,
      reporterUserId: undefined,
      status: "active",
    },
  });

  // Reset form when dialog opens/closes or editing sender changes
  useEffect(() => {
    if (open) {
      if (editingSender) {
        form.reset({
          email: editingSender.email,
          name: editingSender.name,
          language: editingSender.language as "ar" | "en" | "ur",
          autoPublish: editingSender.autoPublish,
          defaultCategory: editingSender.defaultCategory || undefined,
          reporterUserId: editingSender.reporterUserId || undefined,
          status: editingSender.status as "active" | "suspended" | "revoked",
        });
        setGeneratedToken(null);
      } else {
        form.reset({
          email: "",
          name: "",
          language: "ar",
          autoPublish: true,
          defaultCategory: undefined,
          reporterUserId: undefined,
          status: "active",
        });
        // Generate token for new senders
        setGeneratedToken(generateToken());
      }
      setShowToken(false);
    }
  }, [open, editingSender, form]);

  const handleSubmit = async (values: FormValues) => {
    const submitData = editingSender
      ? values // Don't send token when editing
      : { ...values, token: generatedToken! }; // Include token for new senders

    await onSubmit(submitData);
  };

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرمز السري إلى الحافظة",
      });
    }
  };

  const activeCategories = categories?.filter(c => c.status === 'active') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {editingSender ? "تعديل المرسل الموثوق" : "إضافة مرسل موثوق"}
          </DialogTitle>
          <DialogDescription>
            {editingSender
              ? "قم بتحديث معلومات المرسل الموثوق"
              : "أضف مرسل بريد إلكتروني موثوق للسماح بالنشر التلقائي"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="sender@example.com"
                      disabled={!!editingSender}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormDescription>
                    {editingSender
                      ? "لا يمكن تعديل البريد الإلكتروني بعد الإنشاء"
                      : "البريد الإلكتروني الذي سيتم قبول الرسائل منه"}
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
                  <FormLabel>اسم المرسل *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="مثال: فريق التحرير"
                      data-testid="input-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reporterUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المراسل المعتمد</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Allow clearing selection
                      field.onChange(value === "none" ? undefined : value);
                    }}
                    defaultValue={field.value || "none"}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-reporter">
                        <SelectValue placeholder="اختر المراسل (اختياري)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">بدون مراسل</SelectItem>
                      {reporters?.map((reporter, index) => {
                        const name = [reporter.firstName, reporter.lastName]
                          .filter(Boolean)
                          .join(" ") || reporter.email;
                        console.log(`📝 [Rendering Reporter ${index + 1}/${reporters.length}]:`, name, reporter.id);
                        return (
                          <SelectItem key={reporter.id} value={reporter.id}>
                            {name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    المراسل الذي سيتم نسب المقالات المنشورة له
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اللغة *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue placeholder="اختر اللغة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ar">عربية</SelectItem>
                        <SelectItem value="en">إنجليزية</SelectItem>
                        <SelectItem value="ur">أردية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="suspended">معلق</SelectItem>
                        <SelectItem value="revoked">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="defaultCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التصنيف الافتراضي</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Allow clearing selection
                      field.onChange(value === "none" ? undefined : value);
                    }}
                    defaultValue={field.value || "none"}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="بدون تصنيف (اختياري)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">بدون تصنيف</SelectItem>
                      {activeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    التصنيف الذي سيتم نشر المقالات فيه تلقائياً
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoPublish"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">نشر تلقائي</FormLabel>
                    <FormDescription>
                      نشر المقالات تلقائياً عند استلام البريد (إذا كان معطلاً، سيتم حفظها كمسودات)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-auto-publish"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!editingSender && generatedToken && (
              <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base mb-0">الرمز السري</FormLabel>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                      data-testid="button-toggle-token"
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyToken}
                      data-testid="button-copy-token"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="font-mono text-sm p-2 bg-background rounded border break-all">
                  {showToken ? generatedToken : "•".repeat(64)}
                </div>
                <p className="text-sm text-muted-foreground">
                  احفظ هذا الرمز السري بأمان. سيتم استخدامه للتحقق من الرسائل الواردة.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting
                  ? "جاري الحفظ..."
                  : editingSender
                  ? "تحديث"
                  : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
