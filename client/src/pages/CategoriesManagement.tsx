import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FolderOpen,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Rss,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";
import { insertCategorySchema } from "@shared/schema";

// Form schema for client-side validation
const categoryFormSchema = insertCategorySchema.extend({
  nameAr: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  slug: z.string().min(2, "المعرف يجب أن يكون حرفين على الأقل")
    .regex(/^[a-z0-9-]+$/, "المعرف يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CategoriesManagement() {
  const [location] = useLocation();
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      slug: "",
      description: "",
      icon: "",
      color: "",
      displayOrder: 0,
      status: "active",
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      return await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "تم إنشاء التصنيف",
        description: "تم إضافة التصنيف بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء التصنيف",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormValues> }) => {
      return await apiRequest(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      form.reset();
      toast({
        title: "تم تحديث التصنيف",
        description: "تم تحديث التصنيف بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث التصنيف",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/categories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeletingCategory(null);
      toast({
        title: "تم حذف التصنيف",
        description: "تم حذف التصنيف بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف التصنيف",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      nameAr: category.nameAr,
      nameEn: category.nameEn || "",
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "",
      displayOrder: category.displayOrder || 0,
      status: category.status || "active",
    });
  };

  const onSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) =>
    searchQuery
      ? cat.nameAr.includes(searchQuery) ||
        cat.nameEn?.includes(searchQuery) ||
        cat.slug.includes(searchQuery)
      : true
  );

  const menuItems = [
    {
      title: "نظرة عامة",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "مقالاتي",
      icon: FileText,
      href: "/dashboard/articles",
    },
    {
      title: "مقال جديد",
      icon: PlusCircle,
      href: "/dashboard/articles/new",
    },
    {
      title: "التصنيفات",
      icon: FolderOpen,
      href: "/dashboard/categories",
      adminOnly: true,
    },
    {
      title: "مصادر RSS",
      icon: Rss,
      href: "/dashboard/rss-feeds",
      adminOnly: true,
    },
    {
      title: "المستخدمون",
      icon: Users,
      href: "/dashboard/users",
      adminOnly: true,
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar side="right" collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup>
              <div className="px-4 py-4">
                <Link href="/">
                  <a className="flex items-center gap-2" data-testid="link-home">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                      س
                    </div>
                    <span className="text-lg font-bold">سبق الذكية</span>
                  </a>
                </Link>
              </div>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href}>
                          <a
                            className="flex items-center gap-3 w-full"
                            data-testid={`link-${item.href.split('/').pop()}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </a>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/profile">
                        <a className="flex items-center gap-3 w-full" data-testid="link-settings">
                          <Settings className="h-4 w-4" />
                          <span>الإعدادات</span>
                        </a>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a
                        href="/api/auth/logout"
                        className="flex items-center gap-3 w-full"
                        data-testid="link-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-bold">إدارة التصنيفات</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild data-testid="button-view-site">
                <Link href="/">
                  <a>عرض الموقع</a>
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      التصنيفات ({filteredCategories.length})
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 w-64"
                        data-testid="input-search"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setIsCreateDialogOpen(true);
                        form.reset();
                      }}
                      className="gap-2"
                      data-testid="button-create"
                    >
                      <PlusCircle className="h-4 w-4" />
                      تصنيف جديد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    جاري التحميل...
                  </div>
                ) : filteredCategories.length > 0 ? (
                  <div className="space-y-2">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate transition-all"
                        data-testid={`category-row-${category.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {category.icon && (
                              <span className="text-2xl" data-testid={`icon-${category.id}`}>
                                {category.icon}
                              </span>
                            )}
                            <div>
                              <h3 className="font-semibold" data-testid={`name-${category.id}`}>
                                {category.nameAr}
                              </h3>
                              {category.nameEn && (
                                <p className="text-sm text-muted-foreground">
                                  {category.nameEn}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline" data-testid={`slug-${category.id}`}>
                              {category.slug}
                            </Badge>
                            {category.description && (
                              <p className="text-muted-foreground truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            data-testid={`button-edit-${category.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingCategory(category)}
                            data-testid={`button-delete-${category.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? "لا توجد تصنيفات مطابقة" : "لا توجد تصنيفات"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingCategory(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-form">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "تعديل التصنيف" : "تصنيف جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "قم بتعديل بيانات التصنيف"
                : "أضف تصنيفاً جديداً للمقالات"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالعربية *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: التقنية"
                        data-testid="input-name-ar"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالإنجليزية</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Technology"
                        data-testid="input-name-en"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المعرّف *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="technology"
                        data-testid="input-slug"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأيقونة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="💻"
                        data-testid="input-icon"
                        {...field}
                        value={field.value || ""}
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
                        placeholder="وصف التصنيف..."
                        rows={3}
                        data-testid="textarea-description"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
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
                    setEditingCategory(null);
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
                  {createMutation.isPending || updateMutation.isPending
                    ? "جاري الحفظ..."
                    : editingCategory
                    ? "حفظ التغييرات"
                    : "إنشاء"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
      >
        <AlertDialogContent data-testid="dialog-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف التصنيف "{deletingCategory?.nameAr}" بشكل نهائي. لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategory) {
                  deleteMutation.mutate(deletingCategory.id);
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
