import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { IFoxLayout } from "@/components/admin/ifox/IFoxLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
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

interface ArticlesResponse {
  articles: IFoxArticle[];
  total: number;
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
  const { data, isLoading, refetch } = useQuery<ArticlesResponse>({
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
        body: JSON.stringify({ articleIds: ids }),
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
        body: JSON.stringify({ articleIds: ids }),
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
    <IFoxLayout>
      <ScrollArea className="h-full">
        <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent truncate" data-testid="text-page-title">
                  آي فوكس - إدارة المحتوى
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-[hsl(var(--ifox-text-secondary))] mt-1 sm:mt-2 truncate" data-testid="text-page-description">
                  إدارة المحتوى التقني والذكاء الاصطناعي
                </p>
              </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial"
              data-testid="button-export"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">تصدير</span>
            </Button>
            <Link href="/dashboard/admin/ifox/articles/new" className="flex-1 sm:flex-initial">
              <Button className="gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full" data-testid="button-new-article">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/30 border-amber-200 dark:border-amber-800" data-testid="card-ai-score">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 truncate">متوسط تقييم AI</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300">85%</p>
                </div>
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/30 border-green-200 dark:border-green-800" data-testid="card-engagement">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 truncate">معدل التفاعل</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">67%</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-blue-200 dark:border-blue-800" data-testid="card-today-articles">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 truncate">مقالات اليوم</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">12</p>
                </div>
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/30 border-purple-200 dark:border-purple-800" data-testid="card-publish-rate">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 truncate">معدل النشر</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">95%</p>
                </div>
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
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
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-medium">
                  تم تحديد {selectedArticles.length} مقال
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={bulkArchiveMutation.isPending}
                    className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial"
                    data-testid="button-bulk-archive"
                  >
                    <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">أرشفة المحدد</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial"
                    data-testid="button-bulk-delete"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">حذف المحدد</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Articles Table */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              قائمة المقالات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  عرض {Math.min(page * 20, totalArticles)} من {totalArticles} مقال
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                    className="text-xs sm:text-sm"
                  >
                    السابق
                  </Button>
                  <div className="hidden sm:flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-8 sm:w-10 text-xs sm:text-sm"
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <span className="sm:hidden text-xs text-muted-foreground">
                    صفحة {page} من {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                    className="text-xs sm:text-sm"
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
              <AlertDialogTitle className="text-base sm:text-lg">
                {bulkActionDialog.action === "delete" ? "تأكيد الحذف" : "تأكيد الأرشفة"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                {bulkActionDialog.action === "delete"
                  ? `هل أنت متأكد من حذف ${selectedArticles.length} مقال؟ هذه العملية لا يمكن التراجع عنها.`
                  : `هل أنت متأكد من أرشفة ${selectedArticles.length} مقال؟`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs sm:text-sm">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkAction}
                disabled={bulkDeleteMutation.isPending || bulkArchiveMutation.isPending}
                className={cn(
                  "text-xs sm:text-sm",
                  bulkActionDialog.action === "delete" ? "bg-destructive hover:bg-destructive/90" : ""
                )}
              >
                {bulkActionDialog.action === "delete" ? "حذف" : "أرشفة"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </ScrollArea>
    </IFoxLayout>
  );
}
