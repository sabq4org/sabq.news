import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserCheck,
  UserX,
  Ban,
  Search,
  MoreVertical,
  Eye,
  Shield,
  Award,
  Trash2,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Types
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  status: string;
  emailVerified: boolean;
  verificationBadge: string;
  role: string;
  roleName: string | null;
  roleNameAr: string | null;
  roleId: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  hasPressCard: boolean;
}

interface KPIs {
  total: number;
  emailVerified: number;
  emailVerifiedTrend: number;
  suspended: number;
  suspendedTrend: number;
  banned: number;
  bannedTrend: number;
}

interface Role {
  id: string;
  name: string;
  nameAr: string;
}

export default function AdminUsers() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  // Dialog state
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [banReason, setBanReason] = useState("");
  const [banIsPermanent, setBanIsPermanent] = useState(false);
  const [banDuration, setBanDuration] = useState("30");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("none");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIs>({
    queryKey: ["/api/dashboard/users/kpis"],
    enabled: !!user,
  });

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (roleFilter && roleFilter !== "all") params.set("roleId", roleFilter);
    return params.toString();
  };

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", searchTerm, statusFilter, roleFilter],
    queryFn: async () => {
      const query = buildQueryParams();
      const url = `/api/admin/users${query ? `?${query}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      console.log("🔍 [DEBUG] API Response:", data);
      // API returns { users: [...], items: [...] } for backward compatibility
      // Always return an array
      if (Array.isArray(data)) {
        console.log("🔍 [DEBUG] Returning array data, first user:", data[0]);
        return data;
      }
      if (data.users && Array.isArray(data.users)) {
        console.log("🔍 [DEBUG] Returning data.users, first user:", data.users[0]);
        return data.users;
      }
      return [];
    },
    enabled: !!user,
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    enabled: !!user,
  });

  // Filter users by verification
  const filteredUsers = users.filter((u) => {
    if (verificationFilter === "all") return true;
    if (verificationFilter === "verified") return u.emailVerified;
    if (verificationFilter === "unverified") return !u.emailVerified;
    return true;
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: string; reason: string; duration: string }) => {
      return await apiRequest(`/api/dashboard/users/${userId}/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason, duration }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/users/kpis"] });
      toast({ title: "تم التعليق", description: "تم تعليق المستخدم بنجاح" });
      setSuspendDialogOpen(false);
      setSuspendReason("");
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل تعليق المستخدم", variant: "destructive" });
    },
  });

  // Ban mutation
  const banMutation = useMutation({
    mutationFn: async ({ userId, reason, isPermanent, duration }: { userId: string; reason: string; isPermanent: boolean; duration?: string }) => {
      return await apiRequest(`/api/dashboard/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason, isPermanent, duration }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/users/kpis"] });
      toast({ title: "تم الحظر", description: "تم حظر المستخدم بنجاح" });
      setBanDialogOpen(false);
      setBanReason("");
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل حظر المستخدم", variant: "destructive" });
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ roleId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم التحديث", description: "تم تغيير دور المستخدم بنجاح" });
      setRoleDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل تغيير الدور", variant: "destructive" });
    },
  });

  // Set badge mutation
  const setBadgeMutation = useMutation({
    mutationFn: async ({ userId, badge }: { userId: string; badge: string }) => {
      return await apiRequest(`/api/admin/users/${userId}/verification-badge`, {
        method: "PATCH",
        body: JSON.stringify({ badge }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم التحديث", description: "تم تحديث علامة التوثيق بنجاح" });
      setBadgeDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل تحديث العلامة", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/users/kpis"] });
      toast({ title: "تم الحذف", description: "تم حذف المستخدم بنجاح" });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل حذف المستخدم", variant: "destructive" });
    },
  });

  // Table columns
  const columnHelper = createColumnHelper<User>();
  const columns = [
    columnHelper.accessor("firstName", {
      header: "المستخدم",
      cell: (info) => {
        const user = info.row.original;
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "بدون اسم";
        return (
          <div className="flex items-center gap-3">
            <Avatar data-testid={`avatar-${user.id}`}>
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback>
                {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium" data-testid={`text-name-${user.id}`}>{fullName}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("email", {
      header: "البريد الإلكتروني",
      cell: (info) => {
        const user = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <span data-testid={`text-email-${user.id}`}>{info.getValue()}</span>
            {user.emailVerified && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-verified-${user.id}`}>
                <UserCheck className="w-3 h-3 ml-1" />
                موثق
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "الحالة",
      cell: (info) => {
        const status = info.getValue();
        const variants: Record<string, any> = {
          active: { variant: "default" as const, color: "text-green-600", label: "نشط" },
          suspended: { variant: "secondary" as const, color: "text-orange-600", label: "معلق" },
          banned: { variant: "destructive" as const, color: "text-red-600", label: "محظور" },
        };
        const config = variants[status] || variants.active;
        return (
          <Badge variant={config.variant} data-testid={`badge-status-${info.row.original.id}`}>
            {config.label}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("roleNameAr", {
      header: "الدور",
      cell: (info) => {
        const user = info.row.original;
        return user.roleNameAr ? (
          <Badge variant="outline" data-testid={`badge-role-${user.id}`}>{info.getValue()}</Badge>
        ) : (
          <span className="text-muted-foreground">بدون دور</span>
        );
      },
    }),
    columnHelper.accessor("verificationBadge", {
      header: "علامة التوثيق",
      cell: (info) => {
        const badge = info.getValue();
        const labels: Record<string, string> = {
          none: "بدون",
          silver: "فضية",
          gold: "ذهبية",
        };
        const colors: Record<string, string> = {
          none: "text-muted-foreground",
          silver: "text-gray-500",
          gold: "text-yellow-600",
        };
        return (
          <div className="flex items-center gap-1" data-testid={`badge-verification-${info.row.original.id}`}>
            {badge !== "none" && <Award className={`w-4 h-4 ${colors[badge]}`} />}
            <span className={colors[badge]}>{labels[badge] || badge}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "تاريخ التسجيل",
      cell: (info) => (
        <span data-testid={`text-created-${info.row.original.id}`}>
          {format(new Date(info.getValue()), "dd MMM yyyy", { locale: ar })}
        </span>
      ),
    }),
    columnHelper.accessor("lastActivityAt", {
      header: "آخر نشاط",
      cell: (info) => {
        const lastActivity = info.getValue();
        return (
          <span data-testid={`text-activity-${info.row.original.id}`}>
            {lastActivity ? format(new Date(lastActivity), "dd MMM yyyy", { locale: ar }) : "لا يوجد"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "الإجراءات",
      cell: (info) => {
        const user = info.row.original;
        const isCurrentUser = user.id === user.id;
        console.log(`🔍 [DEBUG] User ${user.email} - hasPressCard:`, user.hasPressCard);
        return (
          <div className="flex items-center gap-2">
            {user.hasPressCard && (
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary"
                title="بطاقة صحفية مفعلة"
                data-testid={`icon-press-card-${user.id}`}
              >
                <CreditCard className="w-4 h-4" />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-actions-${user.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-right">
              <DropdownMenuItem
                onClick={() => window.open(`/profile/${user.id}`, "_blank")}
                data-testid={`action-view-${user.id}`}
              >
                <Eye className="w-4 h-4 ml-2" />
                عرض الملف
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setSuspendDialogOpen(true);
                }}
                disabled={isCurrentUser}
                data-testid={`action-suspend-${user.id}`}
              >
                <UserX className="w-4 h-4 ml-2" />
                تعليق
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setBanDialogOpen(true);
                }}
                disabled={isCurrentUser}
                data-testid={`action-ban-${user.id}`}
              >
                <Ban className="w-4 h-4 ml-2" />
                حظر
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setSelectedRoleId(user.roleId || "");
                  setRoleDialogOpen(true);
                }}
                disabled={isCurrentUser}
                data-testid={`action-role-${user.id}`}
              >
                <Shield className="w-4 h-4 ml-2" />
                تغيير الدور
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setSelectedBadge(user.verificationBadge);
                  setBadgeDialogOpen(true);
                }}
                data-testid={`action-badge-${user.id}`}
              >
                <Award className="w-4 h-4 ml-2" />
                علامة التوثيق
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setDeleteDialogOpen(true);
                }}
                disabled={isCurrentUser}
                className="text-destructive"
                data-testid={`action-delete-${user.id}`}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  // Table instance
  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  // Handle KPI click
  const handleKPIClick = (filter: string) => {
    if (filter === "total") {
      setStatusFilter("all");
      setVerificationFilter("all");
    } else if (filter === "emailVerified") {
      setVerificationFilter("verified");
    } else if (filter === "suspended") {
      setStatusFilter("suspended");
    } else if (filter === "banned") {
      setStatusFilter("banned");
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRoleFilter("all");
    setVerificationFilter("all");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-title">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع جميع المستخدمين في النظام</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => handleKPIClick("total")}
            data-testid="card-kpi-total"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total">
                {kpisLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis?.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => handleKPIClick("emailVerified")}
            data-testid="card-kpi-verified"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الموثقون بالبريد</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-verified">
                {kpisLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis?.emailVerified || 0}
              </div>
              {!kpisLoading && kpis && (
                <div className={`flex items-center text-xs ${kpis.emailVerifiedTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.emailVerifiedTrend >= 0 ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                  <span>{Math.abs(kpis.emailVerifiedTrend)}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => handleKPIClick("suspended")}
            data-testid="card-kpi-suspended"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المعلقون</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-suspended">
                {kpisLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis?.suspended || 0}
              </div>
              {!kpisLoading && kpis && (
                <div className={`flex items-center text-xs ${kpis.suspendedTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.suspendedTrend >= 0 ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                  <span>{Math.abs(kpis.suspendedTrend)}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => handleKPIClick("banned")}
            data-testid="card-kpi-banned"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المحظورون</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-banned">
                {kpisLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis?.banned || 0}
              </div>
              {!kpisLoading && kpis && (
                <div className={`flex items-center text-xs ${kpis.bannedTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {kpis.bannedTrend >= 0 ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                  <span>{Math.abs(kpis.bannedTrend)}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم، البريد، أو الجوال..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                    <SelectItem value="banned">محظور</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-role">
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

                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-verification">
                    <SelectValue placeholder="التوثيق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="verified">موثق</SelectItem>
                    <SelectItem value="unverified">غير موثق</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4 ml-2" />
                  مسح الفلاتر
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="flex justify-center items-center py-12" data-testid="loading-spinner">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="text-right">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-testid={`row-user-${row.original.id}`}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="text-right">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="text-center py-12">
                          <p className="text-muted-foreground" data-testid="text-empty">لا توجد نتائج</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">عدد الصفوف:</span>
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[100px]" data-testid="select-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  data-testid="button-previous-page"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
                <span className="text-sm" data-testid="text-page-info">
                  صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  data-testid="button-next-page"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent data-testid="dialog-suspend">
          <DialogHeader>
            <DialogTitle>تعليق المستخدم</DialogTitle>
            <DialogDescription>
              قم بتعليق المستخدم "{selectedUser?.email}" مؤقتاً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">السبب *</Label>
              <Textarea
                id="suspend-reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="اذكر سبب التعليق..."
                data-testid="textarea-suspend-reason"
              />
            </div>
            <div>
              <Label htmlFor="suspend-duration">المدة</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger id="suspend-duration" data-testid="select-suspend-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">يوم واحد</SelectItem>
                  <SelectItem value="3">3 أيام</SelectItem>
                  <SelectItem value="7">أسبوع</SelectItem>
                  <SelectItem value="30">شهر</SelectItem>
                  <SelectItem value="permanent">دائم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              data-testid="button-suspend-cancel"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (selectedUser && suspendReason) {
                  suspendMutation.mutate({
                    userId: selectedUser.id,
                    reason: suspendReason,
                    duration: suspendDuration,
                  });
                }
              }}
              disabled={!suspendReason || suspendMutation.isPending}
              data-testid="button-suspend-confirm"
            >
              {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "تعليق"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent data-testid="dialog-ban">
          <DialogHeader>
            <DialogTitle>حظر المستخدم</DialogTitle>
            <DialogDescription>
              قم بحظر المستخدم "{selectedUser?.email}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ban-reason">السبب *</Label>
              <Textarea
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="اذكر سبب الحظر..."
                data-testid="textarea-ban-reason"
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="ban-permanent"
                checked={banIsPermanent}
                onCheckedChange={(checked) => setBanIsPermanent(checked as boolean)}
                data-testid="checkbox-ban-permanent"
              />
              <Label htmlFor="ban-permanent">حظر دائم</Label>
            </div>
            {!banIsPermanent && (
              <div>
                <Label htmlFor="ban-duration">المدة</Label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger id="ban-duration" data-testid="select-ban-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">أسبوع</SelectItem>
                    <SelectItem value="30">شهر</SelectItem>
                    <SelectItem value="90">3 أشهر</SelectItem>
                    <SelectItem value="365">سنة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              data-testid="button-ban-cancel"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser && banReason) {
                  banMutation.mutate({
                    userId: selectedUser.id,
                    reason: banReason,
                    isPermanent: banIsPermanent,
                    duration: banIsPermanent ? undefined : banDuration,
                  });
                }
              }}
              disabled={!banReason || banMutation.isPending}
              data-testid="button-ban-confirm"
            >
              {banMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حظر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent data-testid="dialog-role">
          <DialogHeader>
            <DialogTitle>تغيير الدور</DialogTitle>
            <DialogDescription>
              اختر دوراً جديداً للمستخدم "{selectedUser?.email}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-select">الدور *</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger id="role-select" data-testid="select-new-role">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              data-testid="button-role-cancel"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (selectedUser && selectedRoleId) {
                  changeRoleMutation.mutate({
                    userId: selectedUser.id,
                    roleId: selectedRoleId,
                  });
                }
              }}
              disabled={!selectedRoleId || changeRoleMutation.isPending}
              data-testid="button-role-confirm"
            >
              {changeRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Badge Dialog */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent data-testid="dialog-badge">
          <DialogHeader>
            <DialogTitle>علامة التوثيق</DialogTitle>
            <DialogDescription>
              اختر علامة توثيق للمستخدم "{selectedUser?.email}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="badge-select">العلامة</Label>
              <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                <SelectTrigger id="badge-select" data-testid="select-badge">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون</SelectItem>
                  <SelectItem value="silver">فضية</SelectItem>
                  <SelectItem value="gold">ذهبية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBadgeDialogOpen(false)}
              data-testid="button-badge-cancel"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  setBadgeMutation.mutate({
                    userId: selectedUser.id,
                    badge: selectedBadge,
                  });
                }
              }}
              disabled={setBadgeMutation.isPending}
              data-testid="button-badge-confirm"
            >
              {setBadgeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم "{selectedUser?.email}"؟ سيتم تعيين حالته إلى "محظور".
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  deleteMutation.mutate(selectedUser.id);
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
