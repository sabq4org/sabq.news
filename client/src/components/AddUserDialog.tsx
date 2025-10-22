import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminCreateUserSchema } from "@shared/schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Copy, Check } from "lucide-react";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Role {
  id: string;
  name: string;
  nameAr: string;
}

type FormData = z.infer<typeof adminCreateUserSchema>;

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { toast } = useToast();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      roleIds: [],
      status: "active",
      emailVerified: false,
      phoneVerified: false,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      
      // Store the temporary password and show the dialog
      if (response.temporaryPassword) {
        setTemporaryPassword(response.temporaryPassword);
        setShowPasswordDialog(true);
        setPasswordCopied(false);
      }
      
      toast({
        title: "تم إنشاء المستخدم بنجاح",
        description: "تم إضافة المستخدم الجديد إلى النظام",
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message || "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive",
      });
    },
  });

  const copyPasswordToClipboard = async () => {
    if (temporaryPassword) {
      try {
        await navigator.clipboard.writeText(temporaryPassword);
        setPasswordCopied(true);
        toast({
          title: "تم النسخ",
          description: "تم نسخ كلمة المرور المؤقتة إلى الحافظة",
        });
      } catch (error) {
        toast({
          title: "خطأ في النسخ",
          description: "فشل نسخ كلمة المرور",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: FormData) => {
    createUserMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-add-user" dir="rtl">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">إنشاء مستخدم جديد</DialogTitle>
            <DialogDescription data-testid="dialog-description">
              قم بإدخال بيانات المستخدم الجديد واختيار أدواره
            </DialogDescription>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-email">البريد الإلكتروني *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="user@example.com"
                      data-testid="input-email"
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage data-testid="error-email" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-firstName">الاسم الأول *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أحمد"
                        data-testid="input-firstName"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-firstName" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-lastName">اسم العائلة *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="محمد"
                        data-testid="input-lastName"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-lastName" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-phoneNumber">رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+966 50 123 4567"
                      data-testid="input-phoneNumber"
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage data-testid="error-phoneNumber" />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel data-testid="label-roles">الأدوار *</FormLabel>
              {rolesLoading ? (
                <p className="text-sm text-muted-foreground" data-testid="roles-loading">
                  جاري تحميل الأدوار...
                </p>
              ) : (
                <div className="space-y-2 border rounded-md p-3" data-testid="roles-list">
                  {roles?.map((role) => (
                    <FormField
                      key={role.id}
                      control={form.control}
                      name="roleIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={role.id}
                            className="flex flex-row items-center gap-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                data-testid={`checkbox-role-${role.id}`}
                                checked={field.value?.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, role.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer" data-testid={`label-role-${role.id}`}>
                              {role.nameAr}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              )}
              <FormMessage data-testid="error-roleIds" />
            </div>

            <div className="space-y-3 border-t pt-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel data-testid="label-status">حالة الحساب</FormLabel>
                      <FormDescription data-testid="description-status">
                        {field.value === "active" ? "الحساب نشط" : "الحساب معطل"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        data-testid="switch-status"
                        checked={field.value === "active"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "active" : "pending")
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel data-testid="label-emailVerified">تأكيد البريد الإلكتروني</FormLabel>
                      <FormDescription data-testid="description-emailVerified">
                        {field.value ? "تم التأكيد" : "غير مؤكد"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        data-testid="switch-emailVerified"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel data-testid="label-phoneVerified">تأكيد رقم الهاتف</FormLabel>
                      <FormDescription data-testid="description-phoneVerified">
                        {field.value ? "تم التأكيد" : "غير مؤكد"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        data-testid="switch-phoneVerified"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createUserMutation.isPending}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                data-testid="button-submit"
              >
                {createUserMutation.isPending && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" data-testid="spinner-submit" />
                )}
                إنشاء مستخدم
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
      <AlertDialogContent dir="rtl" data-testid="dialog-temporary-password">
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="title-temporary-password">
            كلمة المرور المؤقتة
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p data-testid="description-temporary-password">
                تم إنشاء المستخدم بنجاح. يرجى نسخ كلمة المرور المؤقتة التالية وإرسالها للمستخدم بشكل آمن.
              </p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md" data-testid="container-password">
                <Input
                  value={temporaryPassword || ""}
                  readOnly
                  dir="ltr"
                  className="font-mono text-center"
                  data-testid="input-temporary-password"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyPasswordToClipboard}
                  data-testid="button-copy-password"
                >
                  {passwordCopied ? (
                    <Check className="h-4 w-4" data-testid="icon-copied" />
                  ) : (
                    <Copy className="h-4 w-4" data-testid="icon-copy" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-destructive" data-testid="warning-password">
                ⚠️ تأكد من نسخ كلمة المرور الآن. لن تتمكن من رؤيتها مرة أخرى بعد إغلاق هذه النافذة.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => {
              setShowPasswordDialog(false);
              setTemporaryPassword(null);
              setPasswordCopied(false);
            }}
            data-testid="button-close-password-dialog"
          >
            تم، لقد نسخت كلمة المرور
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
