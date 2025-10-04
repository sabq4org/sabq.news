import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users as UsersIcon,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  FolderOpen,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { adminUpdateUserSchema } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// User type from API
interface UserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  status: string;
  isProfileComplete: boolean;
  createdAt: string;
  roleName: string | null;
  roleNameAr: string | null;
  roleId: string | null;
}

// Role type
interface Role {
  id: string;
  name: string;
  nameAr: string;
}

type UserFormValues = z.infer<typeof adminUpdateUserSchema>;

export default function UsersManagement() {
  const [location] = useLocation();
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  // Store current user ID globally for button disable logic
  if (user?.id) {
    (globalThis as any).__currentUserId = user.id;
  }

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // State for dialogs and filters
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: {
      status: "active",
      roleId: undefined,
    },
  });

  // Build query params
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set("search", searchQuery);
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
  if (roleFilter && roleFilter !== "all") queryParams.set("roleId", roleFilter);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  // Fetch users
  const { data: users = [], isLoading } = useQuery<UserListItem[]>({
    queryKey: ["/api/admin/users", searchQuery, statusFilter, roleFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserFormValues }) => {
      return await apiRequest(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      form.reset();
      toast({
        title: "تم تحديث المستخدم",
        description: "تم تحديث بيانات المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المستخدم",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeletingUser(null);
      toast({
        title: "تم حذف المستخدم",
        description: "تم حظر المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
    form.reset({
      status: user.status as "active" | "suspended" | "banned",
      roleId: user.roleId || undefined,
    });
  };

  const handleSubmit = (data: UserFormValues) => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, data });
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteMutation.mutate(deletingUser.id);
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      suspended: "secondary",
      banned: "destructive",
    };
    const labels: Record<string, string> = {
      active: "نشط",
      suspended: "معلق",
      banned: "محظور",
    };
    return (
      <Badge variant={variants[status] || "default"} data-testid={`badge-status-${status}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Sidebar items
  const sidebarItems = [
    { title: "الرئيسية", icon: LayoutDashboard, path: "/dashboard", testId: "link-dashboard" },
    { title: "التصنيفات", icon: FolderOpen, path: "/dashboard/categories", testId: "link-categories" },
    { title: "المستخدمون", icon: UsersIcon, path: "/dashboard/users", testId: "link-users" },
    { title: "المقالات", icon: FileText, path: "/dashboard/articles", testId: "link-articles" },
    { title: "الأخبار", icon: Rss, path: "/dashboard/news", testId: "link-news" },
    { title: "الإعدادات", icon: Settings, path: "/dashboard/settings", testId: "link-settings" },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full" dir="rtl">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>لوحة التحكم</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.path}
                        data-testid={item.testId}
                      >
                        <Link href={item.path}>
                          <item.icon className="ml-2" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="ml-2" />
                      <span>تسجيل الخروج</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-bold" data-testid="heading-title">إدارة المستخدمين</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle data-testid="heading-users">المستخدمون</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم أو البريد..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="suspended">معلق</SelectItem>
                      <SelectItem value="banned">محظور</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[200px]" data-testid="select-role-filter">
                      <SelectValue placeholder="الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأدوار</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="text-center py-8" data-testid="text-loading">جاري التحميل...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground" data-testid="text-empty">
                      لا توجد مستخدمون
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4">المستخدم</th>
                          <th className="text-right py-3 px-4">البريد الإلكتروني</th>
                          <th className="text-right py-3 px-4">الدور</th>
                          <th className="text-right py-3 px-4">الحالة</th>
                          <th className="text-right py-3 px-4">تاريخ التسجيل</th>
                          <th className="text-right py-3 px-4">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover-elevate" data-testid={`row-user-${user.id}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar data-testid={`avatar-${user.id}`}>
                                  <AvatarImage src={user.profileImageUrl || undefined} />
                                  <AvatarFallback>
                                    {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium" data-testid={`text-name-${user.id}`}>
                                    {user.firstName || user.lastName
                                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                      : "بدون اسم"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4" data-testid={`text-email-${user.id}`}>
                              {user.email}
                            </td>
                            <td className="py-3 px-4">
                              {user.roleNameAr ? (
                                <Badge variant="outline" data-testid={`badge-role-${user.id}`}>
                                  {user.roleNameAr}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">بدون دور</span>
                              )}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                            <td className="py-3 px-4" data-testid={`text-date-${user.id}`}>
                              {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(user)}
                                  disabled={user.id === (globalThis as any).__currentUserId}
                                  data-testid={`button-edit-${user.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingUser(user)}
                                  disabled={user.id === (globalThis as any).__currentUserId}
                                  data-testid={`button-delete-${user.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent data-testid="dialog-edit">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
              قم بتعديل حالة المستخدم أو دوره
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="suspended">معلق</SelectItem>
                        <SelectItem value="banned">محظور</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent data-testid="dialog-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم "{deletingUser?.email}"؟ سيتم تعيين حالته إلى "محظور".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
