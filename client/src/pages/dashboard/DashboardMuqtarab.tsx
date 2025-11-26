import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAngleSchema } from "@shared/schema";
import type { Angle } from "@/lib/muqtarab";
import { DashboardLayout } from "@/components/DashboardLayout";
import * as LucideIcons from "lucide-react";

// Form schema - extends insertAngleSchema with validation
const angleFormSchema = insertAngleSchema.extend({
  nameAr: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  slug: z.string().min(2, "المعرف يجب أن يكون حرفين على الأقل")
    .regex(/^[a-z0-9-]+$/, "المعرف يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط"),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "اللون يجب أن يكون بصيغة hex (#RRGGBB)"),
  iconKey: z.string().min(1, "رمز الأيقونة مطلوب"),
  nameEn: z.string().optional(),
  coverImageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
  shortDesc: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

type AngleFormValues = z.infer<typeof angleFormSchema>;

// Section type
interface Section {
  id: string;
  name: string;
  slug: string;
}

// Auto-generate slug from Arabic name
function generateSlug(nameAr: string): string {
  const transliterationMap: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
    'ة': 'h', 'ئ': 'e', 'ء': 'a',
    ' ': '-', '_': '-',
  };

  return nameAr
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function DashboardMuqtarab() {
  const [location, setLocation] = useLocation();
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAngle, setEditingAngle] = useState<Angle | null>(null);
  const [deletingAngle, setDeletingAngle] = useState<Angle | null>(null);

  // Form - MUST be before early returns
  const form = useForm<AngleFormValues>({
    resolver: zodResolver(angleFormSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      slug: "",
      colorHex: "#3b82f6",
      iconKey: "Newspaper",
      coverImageUrl: "",
      shortDesc: "",
      sortOrder: 0,
      isActive: true,
      sectionId: "", // Will be set when muqtarab section is fetched
    },
  });

  // Fetch muqtarab section
  const { data: muqtarabSection } = useQuery<Section>({
    queryKey: ["/api/muqtarab/section"],
    queryFn: async () => {
      const res = await fetch("/api/muqtarab/section");
      if (!res.ok) throw new Error("Failed to fetch section");
      return res.json();
    },
  });

  // Fetch all angles (including inactive for admin)
  const { data: angles = [], isLoading } = useQuery<Angle[]>({
    queryKey: ["/api/muqtarab/angles"],
    queryFn: async () => {
      const res = await fetch("/api/muqtarab/angles");
      if (!res.ok) throw new Error("Failed to fetch angles");
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AngleFormValues) => {
      return await apiRequest("/api/admin/muqtarab/angles", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/muqtarab/angles"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "تم إنشاء الزاوية",
        description: "تم إضافة الزاوية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الزاوية",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AngleFormValues> }) => {
      return await apiRequest(`/api/admin/muqtarab/angles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/muqtarab/angles"] });
      setEditingAngle(null);
      form.reset();
      toast({
        title: "تم تحديث الزاوية",
        description: "تم تحديث الزاوية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الزاوية",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/muqtarab/angles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/muqtarab/angles"] });
      setDeletingAngle(null);
      toast({
        title: "تم حذف الزاوية",
        description: "تم حذف الزاوية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الزاوية",
        variant: "destructive",
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest(`/api/admin/muqtarab/angles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/muqtarab/angles"] });
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة الزاوية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الحالة",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreate = () => {
    if (muqtarabSection) {
      form.reset({
        nameAr: "",
        nameEn: "",
        slug: "",
        colorHex: "#3b82f6",
        iconKey: "Newspaper",
        coverImageUrl: "",
        shortDesc: "",
        sortOrder: 0,
        isActive: true,
        sectionId: muqtarabSection.id,
      });
      setIsCreateDialogOpen(true);
    }
  };

  const handleEdit = (angle: Angle) => {
    setEditingAngle(angle);
    form.reset({
      nameAr: angle.nameAr,
      nameEn: angle.nameEn || "",
      slug: angle.slug,
      colorHex: angle.colorHex,
      iconKey: angle.iconKey,
      coverImageUrl: angle.coverImageUrl || "",
      shortDesc: angle.shortDesc || "",
      sortOrder: angle.sortOrder || 0,
      isActive: angle.isActive,
      sectionId: angle.sectionId,
    });
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (editingAngle) {
      updateMutation.mutate({ id: editingAngle.id, data });
    } else {
      createMutation.mutate(data);
    }
  });

  const handleToggleActive = (angle: Angle) => {
    toggleActiveMutation.mutate({ id: angle.id, isActive: !angle.isActive });
  };

  // Auto-generate slug from nameAr
  const nameAr = form.watch("nameAr");
  useEffect(() => {
    if (nameAr && !editingAngle) {
      form.setValue("slug", generateSlug(nameAr));
    }
  }, [nameAr, editingAngle, form]);

  // Get icon component
  const getIconComponent = (iconKey: string) => {
    const IconComponent = (LucideIcons as any)[iconKey];
    return IconComponent || LucideIcons.HelpCircle;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">إدارة مُقترب</h1>
            <p className="text-muted-foreground mt-1">إدارة الزوايا التحليلية والمواضيع</p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!muqtarabSection}
            data-testid="button-create-angle"
          >
            <Plus className="h-4 w-4 ml-2" />
            زاوية جديدة
          </Button>
        </div>

        {/* Angles Table */}
        <Card data-testid="card-angles-table">
          <CardHeader>
            <CardTitle>الزوايا ({angles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8" data-testid="loader-angles">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : angles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-angles">
                لا توجد زوايا. ابدأ بإنشاء زاوية جديدة.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الأيقونة</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">المعرف</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الترتيب</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {angles.map((angle) => {
                      const IconComponent = getIconComponent(angle.iconKey);
                      return (
                        <TableRow key={angle.id} data-testid={`row-angle-${angle.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-10 h-10 rounded-md flex items-center justify-center"
                                style={{ backgroundColor: angle.colorHex }}
                                data-testid={`icon-preview-${angle.id}`}
                              >
                                <IconComponent className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div data-testid={`text-angle-name-${angle.id}`}>
                              <div className="font-medium">{angle.nameAr}</div>
                              {angle.nameEn && (
                                <div className="text-sm text-muted-foreground">{angle.nameEn}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code
                              className="text-sm bg-muted px-2 py-1 rounded"
                              data-testid={`text-angle-slug-${angle.id}`}
                            >
                              {angle.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={angle.isActive ? "default" : "secondary"}
                              data-testid={`badge-status-${angle.id}`}
                            >
                              {angle.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-sort-order-${angle.id}`}>
                            {angle.sortOrder}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                data-testid={`button-topics-${angle.id}`}
                              >
                                <Link href={`/dashboard/muqtarab/angles/${angle.id}/topics`}>
                                  <FileText className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleActive(angle)}
                                disabled={toggleActiveMutation.isPending}
                                data-testid={`button-toggle-active-${angle.id}`}
                              >
                                {angle.isActive ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(angle)}
                                data-testid={`button-edit-${angle.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingAngle(angle)}
                                data-testid={`button-delete-${angle.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog
          open={isCreateDialogOpen || !!editingAngle}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingAngle(null);
              form.reset();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingAngle ? "تعديل الزاوية" : "زاوية جديدة"}
              </DialogTitle>
              <DialogDescription>
                {editingAngle
                  ? "تعديل معلومات الزاوية التحليلية"
                  : "إضافة زاوية تحليلية جديدة إلى مُقترب"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Arabic */}
                <FormField
                  control={form.control}
                  name="nameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم بالعربية *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="مثال: النشر الرقمي"
                          data-testid="input-name-ar"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Name English */}
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم بالإنجليزية</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Example: Digital Publishing"
                          data-testid="input-name-en"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المعرف (Slug) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="digital-publishing"
                          dir="ltr"
                          data-testid="input-slug"
                        />
                      </FormControl>
                      <FormDescription>
                        يتم توليده تلقائياً من الاسم العربي ويمكن تعديله
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color */}
                <FormField
                  control={form.control}
                  name="colorHex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اللون *</FormLabel>
                      <div className="flex items-center gap-3">
                        <FormControl>
                          <Input
                            {...field}
                            type="color"
                            className="w-20 h-10"
                            data-testid="input-color"
                          />
                        </FormControl>
                        <Input
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="#3b82f6"
                          className="font-mono"
                          data-testid="input-color-hex"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Icon Key */}
                <FormField
                  control={form.control}
                  name="iconKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز الأيقونة *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Newspaper"
                          data-testid="input-icon-key"
                        />
                      </FormControl>
                      <FormDescription>
                        اسم أيقونة من مكتبة Lucide (مثال: Newspaper, LineChart, BookOpenCheck)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cover Image URL */}
                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط صورة الغلاف</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          data-testid="input-cover-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Short Description */}
                <FormField
                  control={form.control}
                  name="shortDesc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف مختصر</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="وصف قصير للزاوية"
                          rows={3}
                          data-testid="input-short-desc"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sort Order */}
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ترتيب العرض</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-sort-order"
                        />
                      </FormControl>
                      <FormDescription>
                        رقم أقل = يظهر أولاً
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Active */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-active"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">
                        الزاوية نشطة وظاهرة للعامة
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingAngle(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    )}
                    {editingAngle ? "تحديث" : "إنشاء"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingAngle}
          onOpenChange={(open) => !open && setDeletingAngle(null)}
        >
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="text-delete-title">
                هل أنت متأكد من الحذف؟
              </AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الزاوية "{deletingAngle?.nameAr}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-delete-cancel">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingAngle && deleteMutation.mutate(deletingAngle.id)}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-confirm"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
