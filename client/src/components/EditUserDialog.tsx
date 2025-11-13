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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, IdCard } from "lucide-react";
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
  firstNameEn: string | null;
  lastNameEn: string | null;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: Role[];
  hasPressCard?: boolean;
  jobTitle?: string | null;
  department?: string | null;
  pressIdNumber?: string | null;
  cardValidUntil?: string | null;
}

const editUserSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
  firstNameEn: z.union([z.string().min(2, "English first name must be at least 2 characters"), z.literal("")]).optional(),
  lastNameEn: z.union([z.string().min(2, "English last name must be at least 2 characters"), z.literal("")]).optional(),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional().or(z.literal("")),
  profileImageUrl: z.string().nullable().optional(),
  bioAr: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  titleAr: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  roleIds: z.array(z.string().uuid("معرف الدور غير صحيح")).min(1, "يجب اختيار دور واحد على الأقل"),
  status: z.enum(["active", "pending", "suspended", "banned", "locked"]).default("active"),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  hasPressCard: z.boolean().optional(),
  jobTitle: z.union([z.string(), z.literal(""), z.null()]).optional(),
  department: z.union([z.string(), z.literal(""), z.null()]).optional(),
  pressIdNumber: z.union([z.string(), z.literal(""), z.null()]).optional(),
  cardValidUntil: z.union([z.string(), z.literal(""), z.null()]).optional(),
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

  const { data: staffData } = useQuery<{ bio?: string; bioAr?: string; title?: string; titleAr?: string } | null>({
    queryKey: ["/api/admin/users", userId, "staff"],
    enabled: open && !!userId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/staff`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      firstNameEn: "",
      lastNameEn: "",
      phoneNumber: "",
      profileImageUrl: null,
      bioAr: "",
      bio: "",
      titleAr: "",
      title: "",
      roleIds: [],
      status: "active",
      emailVerified: false,
      phoneVerified: false,
      hasPressCard: false,
      jobTitle: "",
      department: "",
      pressIdNumber: "",
      cardValidUntil: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameEn: user.firstNameEn || "",
        lastNameEn: user.lastNameEn || "",
        phoneNumber: user.phoneNumber || "",
        profileImageUrl: user.profileImageUrl,
        bioAr: staffData?.bioAr || "",
        bio: staffData?.bio || "",
        titleAr: staffData?.titleAr || "",
        title: staffData?.title || "",
        roleIds: user.roles?.map(r => r.id) || [],
        status: user.status as any,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        hasPressCard: user.hasPressCard || false,
        jobTitle: user.jobTitle || "",
        department: user.department || "",
        pressIdNumber: user.pressIdNumber || "",
        cardValidUntil: user.cardValidUntil || "",
      });
    }
  }, [user, staffData, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { roleIds, bioAr, bio, titleAr, title, hasPressCard, jobTitle, department, pressIdNumber, cardValidUntil, ...userData } = data;
      
      // Prepare press card data
      const pressCardData = {
        hasPressCard,
        jobTitle: jobTitle || null,
        department: department || null,
        pressIdNumber: pressIdNumber || null,
        cardValidUntil: cardValidUntil || null,
      };
      
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ ...userData, ...pressCardData }),
      });

      if (roleIds && roleIds.length > 0) {
        await apiRequest(`/api/admin/users/${userId}/roles`, {
          method: "PATCH",
          body: JSON.stringify({ roleIds }),
        });
      }

      // Only update staff data if at least one field has a value
      if (bioAr || bio || titleAr || title) {
        await apiRequest(`/api/admin/users/${userId}/staff`, {
          method: "PATCH",
          body: JSON.stringify({ bioAr, bio, titleAr, title }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "staff"] });
      
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
    // Log form state for debugging
    console.log('📝 Form submission data:', data);
    console.log('📝 Form errors:', form.formState.errors);
    updateUserMutation.mutate(data);
  };
  
  const onError = (errors: any) => {
    console.error('❌ Form validation errors:', errors);
    toast({
      title: "خطأ في التحقق من البيانات",
      description: "يرجى التحقق من جميع الحقول المطلوبة",
      variant: "destructive",
    });
  };

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col" data-testid="dialog-edit-user" dir="rtl">
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
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="flex flex-col flex-1 min-h-0">
              <div className="space-y-4 overflow-y-auto flex-1 px-1">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-firstNameEn">English First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ahmed"
                          data-testid="input-firstNameEn"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage data-testid="error-firstNameEn" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-lastNameEn">English Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Mohammed"
                          data-testid="input-lastNameEn"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage data-testid="error-lastNameEn" />
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

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-1">
                  <h3 className="font-medium">معلومات الموظف</h3>
                  <p className="text-sm text-muted-foreground">هذه الحقول تظهر في صفحة المراسل العامة</p>
                </div>

                <FormField
                  control={form.control}
                  name="bioAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-bioAr">السيرة الذاتية (عربي)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="نبذة مختصرة عن الكاتب..."
                          data-testid="textarea-bioAr"
                          dir="rtl"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage data-testid="error-bioAr" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-bio">Biography (English)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief bio about the writer..."
                          data-testid="textarea-bio"
                          dir="ltr"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage data-testid="error-bio" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titleAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-titleAr">المسمى الوظيفي (عربي)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="مثال: كاتب صحفي"
                          data-testid="input-titleAr"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage data-testid="error-titleAr" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-title">Job Title (English)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Journalist"
                          data-testid="input-title"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage data-testid="error-title" />
                    </FormItem>
                  )}
                />
              </div>

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

              {/* Press Card Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  البطاقة الصحفية الرقمية
                </h3>
                
                <FormField
                  control={form.control}
                  name="hasPressCard"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          تفعيل البطاقة الصحفية
                        </FormLabel>
                        <FormDescription>
                          منح المستخدم صلاحية إصدار بطاقة صحفية رقمية
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-has-press-card"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {form.watch('hasPressCard') && (
                  <>
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المنصب الوظيفي</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="محرر، مراسل، رئيس قسم..." data-testid="input-job-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>القسم</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="القسم الرياضي، السياسي..." data-testid="input-department" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pressIdNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم البطاقة الصحفية</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="PRESS-12345" data-testid="input-press-id-number" />
                          </FormControl>
                          <FormDescription>
                            رقم فريد للبطاقة الصحفية
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cardValidUntil"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>صالحة حتى</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} 
                              data-testid="input-card-valid-until"
                            />
                          </FormControl>
                          <FormDescription>
                            تاريخ انتهاء صلاحية البطاقة (اختياري)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4">
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
