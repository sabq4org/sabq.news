import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

interface Role {
  id: string;
  name: string;
  nameAr: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: Role[];
}

const editUserSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  profileImageUrl: z.string().url("رابط الصورة غير صحيح").nullable().optional(),
  roleIds: z.array(z.string().uuid("معرف الدور غير صحيح")).min(1, "يجب اختيار دور واحد على الأقل"),
  status: z.enum(["active", "pending", "suspended", "banned", "locked"]).default("active"),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
});

type FormData = z.infer<typeof editUserSchema>;

export function EditUserDialog({ open, onOpenChange, userId }: EditUserDialogProps) {
  const { toast } = useToast();

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles"],
    enabled: open,
    queryFn: async () => {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/admin/users", userId],
    enabled: open && !!userId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      profileImageUrl: null,
      roleIds: [],
      status: "active",
      emailVerified: false,
      phoneVerified: false,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || "",
        profileImageUrl: user.profileImageUrl,
        roleIds: user.roles?.map(r => r.id) || [],
        status: user.status as any,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      });
    }
  }, [user, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { roleIds, ...userData } = data;
      
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(userData),
      });

      if (roleIds && roleIds.length > 0) {
        await apiRequest(`/api/admin/users/${userId}/roles`, {
          method: "PATCH",
          body: JSON.stringify({ roleIds }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
      
      toast({
        title: "تم تحديث المستخدم بنجاح",
        description: "تم حفظ التغييرات بنجاح",
      });
      
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث المستخدم",
        description: error.message || "حدث خطأ أثناء تحديث المستخدم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateUserMutation.mutate(data);
  };

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-edit-user" dir="rtl">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">تعديل بيانات المستخدم</DialogTitle>
          <DialogDescription data-testid="dialog-description">
            قم بتعديل بيانات المستخدم وأدواره
          </DialogDescription>
        </DialogHeader>

        {userLoading ? (
          <div className="flex items-center justify-center py-8" data-testid="loading-user">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="profileImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-profileImage">الصورة الشخصية</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        disabled={updateUserMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage data-testid="error-profileImage" />
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
                  disabled={updateUserMutation.isPending}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  data-testid="button-submit"
                >
                  {updateUserMutation.isPending && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" data-testid="spinner-submit" />
                  )}
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
