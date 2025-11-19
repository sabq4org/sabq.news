import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PublisherDialog } from "@/components/admin/PublisherDialog";
import { PublisherStatusBadge } from "@/components/admin/PublisherStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  PlusCircle,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Power,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";

interface Publisher {
  id: string;
  agencyName: string;
  contactPersonName: string;
  email: string;
  phone: string;
  packageType: string;
  isActive: boolean;
  userId: string;
  totalArticles: number;
  pendingArticles: number;
  approvedArticles: number;
  rejectedArticles: number;
  creditsRemaining: number;
}

export default function PublishersList() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // RBAC Guard: Admin only
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin' && user.role !== 'system_admin') {
      navigate('/');
      toast({ 
        title: 'غير مصرح', 
        description: 'ليس لديك صلاحية الوصول لهذه الصفحة', 
        variant: 'destructive' 
      });
    }
  }, [user, navigate, toast]);

  if (!user || (user.role !== 'admin' && user.role !== 'system_admin')) {
    return null;
  }
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [togglingPublisher, setTogglingPublisher] = useState<Publisher | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch publishers
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/publishers", debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch(`/api/admin/publishers?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch publishers");
      return response.json();
    },
  });

  const publishers = data?.publishers || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Toggle publisher status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (publisher: Publisher) => {
      return await apiRequest(`/api/admin/publishers/${publisher.id}`, {
        method: "PUT",
        body: JSON.stringify({
          isActive: !publisher.isActive,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publishers"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الناشر بنجاح",
      });
      setTogglingPublisher(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الحالة",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (publisher: Publisher) => {
    setEditingPublisher(publisher);
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setEditingPublisher(null);
  };

  const handleToggleStatus = (publisher: Publisher) => {
    setTogglingPublisher(publisher);
  };

  const confirmToggleStatus = () => {
    if (togglingPublisher) {
      toggleStatusMutation.mutate(togglingPublisher);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-publishers">
              إدارة الناشرين
            </h1>
            <p className="text-muted-foreground">
              إدارة جميع الناشرين ومتابعة أنشطتهم
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            data-testid="button-add-publisher"
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            إضافة ناشر جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم، البريد، أو الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                    data-testid="input-publisher-search"
                  />
                </div>
              </div>

              <Tabs
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as any)}
                data-testid="tabs-status-filter"
              >
                <TabsList>
                  <TabsTrigger value="all" data-testid="tab-filter-all">
                    الكل ({total})
                  </TabsTrigger>
                  <TabsTrigger value="active" data-testid="tab-filter-active">
                    النشطون
                  </TabsTrigger>
                  <TabsTrigger value="inactive" data-testid="tab-filter-inactive">
                    غير النشطين
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : publishers.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-testid="empty-state"
              >
                <p className="text-lg">لا توجد ناشرون</p>
                <p className="text-sm mt-2">ابدأ بإضافة ناشر جديد</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المؤسسة</TableHead>
                        <TableHead className="text-right">المسؤول</TableHead>
                        <TableHead className="text-right">البريد</TableHead>
                        <TableHead className="text-right">الهاتف</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الرصيد</TableHead>
                        <TableHead className="text-right">المقالات</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publishers.map((publisher: Publisher) => (
                        <TableRow key={publisher.id} data-testid={`row-publisher-${publisher.id}`}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/admin/publishers/${publisher.id}`}
                              className="hover:underline"
                              data-testid={`link-publisher-${publisher.id}`}
                            >
                              {publisher.agencyName}
                            </Link>
                          </TableCell>
                          <TableCell>{publisher.contactPersonName}</TableCell>
                          <TableCell className="text-sm">{publisher.email}</TableCell>
                          <TableCell className="text-sm">{publisher.phone}</TableCell>
                          <TableCell>
                            <PublisherStatusBadge
                              status={publisher.isActive ? "active" : "inactive"}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-credits-${publisher.id}`}>
                              {publisher.creditsRemaining || 0} نقطة
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div>الإجمالي: {publisher.totalArticles || 0}</div>
                              <div className="text-muted-foreground">
                                {publisher.pendingArticles || 0} معلق
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-actions-${publisher.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/publishers/${publisher.id}`}
                                    data-testid={`button-view-publisher-${publisher.id}`}
                                  >
                                    <Eye className="h-4 w-4 ml-2" />
                                    عرض التفاصيل
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(publisher)}
                                  data-testid={`button-edit-publisher-${publisher.id}`}
                                >
                                  <Edit className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(publisher)}
                                  data-testid={`button-toggle-publisher-${publisher.id}`}
                                >
                                  <Power className="h-4 w-4 ml-2" />
                                  {publisher.isActive ? "تعطيل" : "تفعيل"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      صفحة {page} من {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronRight className="h-4 w-4" />
                        السابق
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        data-testid="button-next-page"
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <PublisherDialog
        isOpen={showDialog}
        onClose={handleDialogClose}
        publisher={editingPublisher}
      />

      <AlertDialog
        open={!!togglingPublisher}
        onOpenChange={() => setTogglingPublisher(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {togglingPublisher?.isActive ? "تعطيل الناشر" : "تفعيل الناشر"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من {togglingPublisher?.isActive ? "تعطيل" : "تفعيل"}{" "}
              {togglingPublisher?.agencyName}؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-toggle">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleStatus}
              data-testid="button-confirm-toggle"
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
