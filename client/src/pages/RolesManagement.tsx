import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Shield, 
  Users, 
  Key, 
  Lock, 
  Menu, 
  LogOut, 
  FileText, 
  FolderTree, 
  MessageSquare, 
  UserCog 
} from "lucide-react";
import type { RoleWithPermissions, Permission } from "@shared/schema";

export default function RolesManagement() {
  const [location] = useLocation();
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<RoleWithPermissions[]>({
    queryKey: ["/api/admin/roles"],
    enabled: !!user,
  });

  // Fetch all permissions
  const { data: allPermissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
    enabled: !!user && !!editingRole,
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: string; permissionIds: string[] }) => {
      return await apiRequest(`/api/admin/roles/${data.roleId}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissionIds: data.permissionIds }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث صلاحيات الدور بنجاح",
      });
      setTimeout(() => {
        setEditingRole(null);
        setSelectedPermissions(new Set());
      }, 300);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث الصلاحيات",
        variant: "destructive",
      });
    },
  });

  // Handle edit role permissions
  const handleEditPermissions = (role: RoleWithPermissions) => {
    setEditingRole(role);
    const permIds = new Set(role.permissions.map(p => p.id));
    setSelectedPermissions(permIds);
  };

  // Handle permission toggle
  const togglePermission = (permissionId: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissions(newSet);
  };

  // Handle save permissions
  const handleSavePermissions = () => {
    if (!editingRole) return;
    updatePermissionsMutation.mutate({
      roleId: editingRole.id,
      permissionIds: Array.from(selectedPermissions),
    });
  };

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const moduleNames: Record<string, string> = {
    articles: "المقالات",
    categories: "التصنيفات",
    users: "المستخدمين",
    comments: "التعليقات",
    staff: "الكادر",
    system: "النظام",
  };

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`bg-card border-l border-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">س</span>
            </div>
            <span className="font-bold text-lg">سبق الذكية</span>
          </div>

          <nav className="space-y-1">
            <Link href="/dashboard/users">
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover-elevate active-elevate-2 ${
                  location === "/dashboard/users" ? "bg-accent" : ""
                }`}
                data-testid="link-users"
              >
                <Users className="h-5 w-5" />
                <span>إدارة المستخدمين</span>
              </a>
            </Link>

            <Link href="/dashboard/categories">
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover-elevate active-elevate-2 ${
                  location === "/dashboard/categories" ? "bg-accent" : ""
                }`}
                data-testid="link-categories"
              >
                <FolderTree className="h-5 w-5" />
                <span>إدارة التصنيفات</span>
              </a>
            </Link>

            <Link href="/dashboard/articles">
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover-elevate active-elevate-2 ${
                  location === "/dashboard/articles" ? "bg-accent" : ""
                }`}
                data-testid="link-articles"
              >
                <FileText className="h-5 w-5" />
                <span>إدارة الأخبار</span>
              </a>
            </Link>

            <Link href="/dashboard/comments">
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover-elevate active-elevate-2 ${
                  location === "/dashboard/comments" ? "bg-accent" : ""
                }`}
                data-testid="link-comments"
              >
                <MessageSquare className="h-5 w-5" />
                <span>إدارة التعليقات</span>
              </a>
            </Link>

            <Link href="/dashboard/roles">
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover-elevate active-elevate-2 ${
                  location === "/dashboard/roles" ? "bg-accent" : ""
                }`}
                data-testid="link-roles"
              >
                <Shield className="h-5 w-5" />
                <span>الأدوار والصلاحيات</span>
              </a>
            </Link>

            <Link href="/dashboard/staff">
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover-elevate active-elevate-2 ${
                  location === "/dashboard/staff" ? "bg-accent" : ""
                }`}
                data-testid="link-staff"
              >
                <UserCog className="h-5 w-5" />
                <span>إدارة الطاقم</span>
              </a>
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName || user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-toggle-sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" data-testid="icon-shield" />
              <div>
                <h1 className="text-3xl font-bold" data-testid="heading-title">
                  إدارة الأدوار والصلاحيات
                </h1>
                <p className="text-muted-foreground" data-testid="text-description">
                  تحكم في صلاحيات كل دور في النظام
                </p>
              </div>
            </div>
          </div>

          {rolesLoading ? (
            <div className="flex justify-center p-8" data-testid="loading-roles">
              <p className="text-muted-foreground">جارِ تحميل الأدوار...</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right" data-testid="header-role">الدور</TableHead>
                <TableHead className="text-right" data-testid="header-description">الوصف</TableHead>
                <TableHead className="text-right" data-testid="header-users">المستخدمين</TableHead>
                <TableHead className="text-right" data-testid="header-permissions">الصلاحيات</TableHead>
                <TableHead className="text-right" data-testid="header-actions">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} data-testid={`row-role-${role.id}`}>
                  <TableCell data-testid={`cell-name-${role.id}`}>
                    <div className="flex items-center gap-2">
                      {role.isSystem && <Lock className="w-4 h-4 text-yellow-600" data-testid={`icon-lock-${role.id}`} />}
                      <span className="font-medium">{role.nameAr}</span>
                      <Badge variant="outline" data-testid={`badge-name-${role.id}`}>{role.name}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`cell-description-${role.id}`}>
                    {role.description}
                  </TableCell>
                  <TableCell data-testid={`cell-usercount-${role.id}`}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{role.userCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`cell-permcount-${role.id}`}>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span>{role.permissions?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`cell-actions-${role.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPermissions(role)}
                      disabled={role.isSystem}
                      data-testid={`button-edit-${role.id}`}
                    >
                      {role.isSystem ? "محمي" : "تعديل الصلاحيات"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
          )}
        </div>
      </main>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl" data-testid="dialog-edit-permissions">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">
              تعديل صلاحيات: {editingRole?.nameAr}
            </DialogTitle>
            <DialogDescription data-testid="dialog-description">
              اختر الصلاحيات المطلوبة لهذا الدور
            </DialogDescription>
          </DialogHeader>

          {permissionsLoading ? (
            <div className="flex justify-center p-8" data-testid="loading-permissions">
              <p className="text-muted-foreground">جارِ تحميل الصلاحيات...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="space-y-3" data-testid={`module-${module}`}>
                  <h3 className="font-semibold text-lg flex items-center gap-2" data-testid={`module-title-${module}`}>
                    <Shield className="w-5 h-5 text-primary" />
                    {moduleNames[module] || module}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex items-start gap-3" data-testid={`permission-${perm.id}`}>
                        <Checkbox
                          id={perm.id}
                          checked={selectedPermissions.has(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          data-testid={`checkbox-${perm.id}`}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={perm.id} 
                            className="cursor-pointer font-medium"
                            data-testid={`label-${perm.id}`}
                          >
                            {perm.labelAr}
                          </Label>
                          <p className="text-xs text-muted-foreground" data-testid={`code-${perm.id}`}>
                            {perm.code}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditingRole(null)}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={updatePermissionsMutation.isPending}
                  data-testid="button-save"
                >
                  {updatePermissionsMutation.isPending ? "جارِ الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
