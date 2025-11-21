import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { StatusCards } from "@/components/admin/StatusCards";
import { IFoxArticlesTable } from "@/components/admin/ifox/IFoxArticlesTable";
import { IFoxArticlesFilters, type FilterValues } from "@/components/admin/ifox/IFoxArticlesFilters";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import {
  Plus,
  Trash2,
  Archive,
  Download,
  Upload,
  Sparkles,
  TrendingUp,
  FileText,
  CheckCircle2
} from "lucide-react";

interface IFoxArticle {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  category: string;
  status: "published" | "draft" | "scheduled" | "archived";
  publishDate: string;
  aiScore: number;
  sentimentScore?: number;
  author: string;
  views: number;
  engagementRate: number;
  createdAt: string;
  updatedAt: string;
}

type StatusKey = "published" | "scheduled" | "draft" | "archived";

const defaultFilters: FilterValues = {
  search: "",
  categories: [],
  status: "all",
  dateFrom: undefined,
  dateTo: undefined,
  aiScoreMin: undefined,
  aiScoreMax: undefined
};

export default function IFoxArticles() {
  useRoleProtection('admin');
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [activeStatus, setActiveStatus] = useState<StatusKey>("published");
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: "delete" | "archive" | null;
  }>({ open: false, action: null });

  // Fetch articles with filters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/ifox/articles", { 
      page, 
      limit: 20,
      status: filters.status === "all" ? undefined : filters.status,
      categories: filters.categories.length > 0 ? filters.categories.join(",") : undefined,
      search: filters.search || undefined,
      dateFrom: filters.dateFrom?.toISOString(),
      dateTo: filters.dateTo?.toISOString(),
      aiScoreMin: filters.aiScoreMin,
      aiScoreMax: filters.aiScoreMax
    }],
    enabled: true,
  });

  // Fetch metrics for status cards
  const { data: metrics } = useQuery<{
    published: number;
    scheduled: number;
    draft: number;
    archived: number;
    total: number;
  }>({
    queryKey: ["/api/admin/ifox/articles/metrics"],
    enabled: true,
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiRequest("/api/admin/ifox/articles/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: `تم حذف ${selectedArticles.length} مقال بنجاح`,
      });
      setSelectedArticles([]);
      setBulkActionDialog({ open: false, action: null });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/articles/metrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل حذف المقالات",
        variant: "destructive",
      });
    },
  });

  // Bulk archive mutation
  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiRequest("/api/admin/ifox/articles/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "تمت الأرشفة",
        description: `تم أرشفة ${selectedArticles.length} مقال بنجاح`,
      });
      setSelectedArticles([]);
      setBulkActionDialog({ open: false, action: null });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/articles/metrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل أرشفة المقالات",
        variant: "destructive",
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/ifox/articles/export", {
        method: "POST",
        body: JSON.stringify({ 
          filters: {
            ...filters,
            categories: filters.categories.length > 0 ? filters.categories.join(",") : undefined,
          }
        }),
        headers: { "Content-Type": "application/json" },
      });
      return response;
    },
    onSuccess: (data: any) => {
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ifox-articles-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "تم التصدير",
        description: "تم تصدير المقالات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل تصدير المقالات",
        variant: "destructive",
      });
    },
  });

  const handleSelectArticle = (id: string) => {
    setSelectedArticles(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!data?.articles) return;
    
    if (selectedArticles.length === data.articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(data.articles.map((a: IFoxArticle) => a.id));
    }
  };

  const handleBulkDelete = () => {
    setBulkActionDialog({ open: true, action: "delete" });
  };

  const handleBulkArchive = () => {
    setBulkActionDialog({ open: true, action: "archive" });
  };

  const confirmBulkAction = () => {
    if (bulkActionDialog.action === "delete") {
      bulkDeleteMutation.mutate(selectedArticles);
    } else if (bulkActionDialog.action === "archive") {
      bulkArchiveMutation.mutate(selectedArticles);
    }
  };

  const handleStatusCardClick = (status: StatusKey) => {
    setActiveStatus(status);
    setFilters({ ...filters, status });
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setActiveStatus("published");
    setPage(1);
  };

  const filteredArticles = data?.articles || [];
  const totalArticles = data?.total || 0;
  const totalPages = Math.ceil(totalArticles / 20);

  return (
    <DashboardLayout>
      <div className="space-y-8" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              آي فوكس - إدارة المحتوى
            </h1>
            <p className="text-muted-foreground mt-2">
              إدارة المحتوى التقني والذكاء الاصطناعي
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="gap-2"
              data-testid="button-export"
            >
              <Download className="h-4 w-4" />
              تصدير
            </Button>
            <Link href="/dashboard/admin/ifox/articles/new">
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Plus className="h-4 w-4" />
                مقال جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <StatusCards
            metrics={metrics}
            activeStatus={activeStatus}
            onSelect={handleStatusCardClick}
          />
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">متوسط تقييم AI</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">85%</p>
                </div>
                <Sparkles className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">معدل التفاعل</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">67%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">مقالات اليوم</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">12</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">معدل النشر</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">95%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <IFoxArticlesFilters
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          articleCount={totalArticles}
        />

        {/* Bulk Actions */}
        {selectedArticles.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  تم تحديد {selectedArticles.length} مقال
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={bulkArchiveMutation.isPending}
                    className="gap-2"
                    data-testid="button-bulk-archive"
                  >
                    <Archive className="h-4 w-4" />
                    أرشفة المحدد
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="gap-2"
                    data-testid="button-bulk-delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف المحدد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Articles Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              قائمة المقالات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IFoxArticlesTable
              articles={filteredArticles}
              selectedArticles={selectedArticles}
              onSelectArticle={handleSelectArticle}
              onSelectAll={handleSelectAll}
              onRefresh={refetch}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  عرض {Math.min(page * 20, totalArticles)} من {totalArticles} مقال
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    السابق
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-10"
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={bulkActionDialog.open} onOpenChange={(open) => {
          if (!open) setBulkActionDialog({ open: false, action: null });
        }}>
          <AlertDialogContent data-testid="dialog-bulk-action">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkActionDialog.action === "delete" ? "تأكيد الحذف" : "تأكيد الأرشفة"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkActionDialog.action === "delete"
                  ? `هل أنت متأكد من حذف ${selectedArticles.length} مقال؟ هذه العملية لا يمكن التراجع عنها.`
                  : `هل أنت متأكد من أرشفة ${selectedArticles.length} مقال؟`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkAction}
                disabled={bulkDeleteMutation.isPending || bulkArchiveMutation.isPending}
                className={bulkActionDialog.action === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                {bulkActionDialog.action === "delete" ? "حذف" : "أرشفة"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}