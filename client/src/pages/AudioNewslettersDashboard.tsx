import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Edit, Trash, PlayCircle, Eye, BarChart, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth, hasRole } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

interface AudioNewsletter {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  coverImageUrl: string | null;
  audioUrl: string | null;
  duration: number | null;
  status: string;
  totalListens: number;
  averageCompletion: number;
  articlesCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export default function AudioNewslettersDashboard() {
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: newsletters, isLoading } = useQuery<AudioNewsletter[]>({
    queryKey: ["/api/audio-newsletters/admin"],
    enabled: !!user && hasRole(user, "admin", "system_admin", "editor"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/audio-newsletters/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-newsletters/admin"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف النشرة الصوتية بنجاح",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل حذف النشرة الصوتية",
        variant: "destructive",
      });
    },
  });

  const generateAudioMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/audio-newsletters/${id}/generate`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-newsletters/admin"] });
      toast({
        title: "تم بدء التوليد",
        description: "جاري توليد الملف الصوتي...",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل بدء عملية التوليد",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/audio-newsletters/${id}/publish`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-newsletters/admin"] });
      toast({
        title: "تم النشر",
        description: "تم نشر النشرة الصوتية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل نشر النشرة الصوتية",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      draft: { variant: "secondary", label: "مسودة" },
      processing: { variant: "outline", label: "قيد المعالجة" },
      completed: { variant: "default", label: "مكتمل" },
      failed: { variant: "destructive", label: "فشل" },
      published: { variant: "default", label: "منشور" },
    };
    
    const config = variants[status] || { variant: "outline", label: status };
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const filteredNewsletters = newsletters?.filter((newsletter) => {
    const matchesSearch = newsletter.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || newsletter.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isUserLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasRole(user, "admin", "system_admin", "editor")) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle data-testid="heading-unauthorized">غير مصرح</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-testid="text-unauthorized-message">
              لا تملك صلاحية الوصول إلى إدارة النشرات الصوتية
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
              النشرات الصوتية
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-subtitle">
              إدارة النشرات الصوتية الخاصة بالمنصة
            </p>
          </div>
          <Button asChild data-testid="button-create-newsletter">
            <Link href="/dashboard/audio-newsletters/create">
              <Plus className="h-4 w-4 ml-2" />
              نشرة جديدة
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                placeholder="البحث بالعنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sm:max-w-xs"
                data-testid="input-search"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-48" data-testid="select-status">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="processing">قيد المعالجة</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="failed">فشل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredNewsletters.length === 0 ? (
              <div className="p-8 text-center" data-testid="text-no-newsletters">
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "لا توجد نتائج"
                    : "لا توجد نشرات صوتية بعد"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المقالات</TableHead>
                    <TableHead className="text-right">الاستماعات</TableHead>
                    <TableHead className="text-right">معدل الإكمال</TableHead>
                    <TableHead className="text-right">تاريخ النشر</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNewsletters.map((newsletter) => (
                    <TableRow key={newsletter.id} data-testid={`row-newsletter-${newsletter.id}`}>
                      <TableCell className="font-medium" data-testid={`text-title-${newsletter.id}`}>
                        {newsletter.title}
                      </TableCell>
                      <TableCell>{getStatusBadge(newsletter.status)}</TableCell>
                      <TableCell data-testid={`text-articles-count-${newsletter.id}`}>
                        {newsletter.articlesCount}
                      </TableCell>
                      <TableCell data-testid={`text-listens-${newsletter.id}`}>
                        {newsletter.totalListens.toLocaleString("ar-EG")}
                      </TableCell>
                      <TableCell data-testid={`text-completion-${newsletter.id}`}>
                        {newsletter.averageCompletion.toFixed(1)}%
                      </TableCell>
                      <TableCell data-testid={`text-published-date-${newsletter.id}`}>
                        {newsletter.publishedAt
                          ? formatDistanceToNow(new Date(newsletter.publishedAt), {
                              addSuffix: true,
                              locale: arSA,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                            data-testid={`button-edit-${newsletter.id}`}
                          >
                            <Link href={`/dashboard/audio-newsletters/${newsletter.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>

                          {newsletter.status === "draft" && newsletter.articlesCount > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => generateAudioMutation.mutate(newsletter.id)}
                              disabled={generateAudioMutation.isPending}
                              data-testid={`button-generate-${newsletter.id}`}
                            >
                              <Radio className="h-4 w-4" />
                            </Button>
                          )}

                          {newsletter.status === "completed" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => publishMutation.mutate(newsletter.id)}
                              disabled={publishMutation.isPending}
                              data-testid={`button-publish-${newsletter.id}`}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {newsletter.status === "published" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                              data-testid={`button-view-${newsletter.id}`}
                            >
                              <Link href={`/audio-newsletters/${newsletter.slug}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(newsletter.id)}
                            data-testid={`button-delete-${newsletter.id}`}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="heading-delete-confirm">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-confirm">
              هل أنت متأكد من حذف هذه النشرة الصوتية؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
