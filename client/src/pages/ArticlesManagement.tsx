import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Send, Star, Bell, Plus, Archive, Trash, GripVertical, Sparkles } from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusCards } from "@/components/admin/StatusCards";
import { BreakingSwitch } from "@/components/admin/BreakingSwitch";
import { RowActions } from "@/components/admin/RowActions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  articleType: string;
  newsType: string;
  isFeatured: boolean;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    nameAr: string;
    nameEn: string;
  } | null;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
  } | null;
};

type Category = {
  id: string;
  nameAr: string;
  nameEn: string;
};

function SortableRow({ article, children }: { article: Article; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-border hover:bg-muted/30"
      data-testid={`row-article-${article.id}`}
    >
      <td className="hidden md:table-cell py-3 px-2 text-center cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 mx-auto text-muted-foreground" data-testid={`drag-handle-${article.id}`} />
      </td>
      {children}
    </tr>
  );
}

export default function ArticlesManagement() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // State for dialogs and filters
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState<"published" | "scheduled" | "draft" | "archived">("published");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // State for bulk selection
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // State for drag and drop
  const [localArticles, setLocalArticles] = useState<Article[]>([]);

  // State for AI classification
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [showClassificationDialog, setShowClassificationDialog] = useState(false);

  // State for mobile detection
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Mobile detection effect
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["/api/admin/articles/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/articles/metrics", { credentials: "include" });
      if (!response.ok) {
        console.error("Metrics fetch failed:", response.status, response.statusText);
        throw new Error("Failed to fetch metrics");
      }
      const data = await response.json();
      console.log("Metrics loaded:", data);
      return data;
    },
    enabled: !!user,
  });

  // Fetch articles with filters
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/admin/articles", searchTerm, activeStatus, typeFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (activeStatus) params.append("status", activeStatus);
      if (typeFilter && typeFilter !== "all") params.append("articleType", typeFilter);
      if (categoryFilter && categoryFilter !== "all") params.append("categoryId", categoryFilter);
      
      const url = `/api/admin/articles${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Update local articles when articles change
  useEffect(() => {
    setLocalArticles(articles);
  }, [articles]);

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/articles/${id}/publish`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({
        title: "تم النشر",
        description: "تم نشر المقال بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل نشر المقال",
        variant: "destructive",
      });
    },
  });

  // Feature mutation
  const featureMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      return await apiRequest(`/api/admin/articles/${id}/feature`, {
        method: "POST",
        body: JSON.stringify({ featured }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة التمييز بنجاح",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/articles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      setDeletingArticle(null);
      toast({
        title: "تم الأرشفة",
        description: "تم أرشفة المقال بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشلت عملية الأرشفة",
        variant: "destructive",
      });
    },
  });

  // AI Classification mutation
  const classifyMutation = useMutation({
    mutationFn: async (articleId: string) => {
      return await apiRequest(`/api/articles/${articleId}/auto-categorize`, {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      setClassificationResult(data);
      setShowClassificationDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التصنيف",
        description: error.message || "فشل تصنيف المقال تلقائياً",
        variant: "destructive",
      });
    },
  });

  // Resend notifications mutation
  const resendNotificationsMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/articles/${id}/resend-notification`, {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ تم إرسال الإشعارات",
        description: data.message || "تم إرسال الإشعارات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل إرسال الإشعارات",
        variant: "destructive",
      });
    },
  });

  // Toggle breaking news mutation
  const toggleBreakingMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      return await apiRequest(`/api/admin/articles/${id}/toggle-breaking`, {
        method: "POST",
      });
    },
    onMutate: async ({ id, currentState }) => {
      // Store the exact query key being modified
      const queryKey = ["/api/admin/articles", searchTerm, activeStatus, typeFilter, categoryFilter];
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/admin/articles"] });
      
      // Snapshot the previous value with its query key
      const previousArticles = queryClient.getQueryData(queryKey);
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: Article[] | undefined) => {
        if (!old) return old;
        return old.map(article => 
          article.id === id 
            ? { ...article, newsType: currentState ? "regular" : "breaking" }
            : article
        );
      });
      
      return { previousArticles, queryKey };
    },
    onSuccess: (data: any, { currentState }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      const isNowBreaking = !currentState;
      toast({
        title: isNowBreaking ? "تم التمييز كخبر عاجل" : "تم إلغاء التمييز كخبر عاجل",
        description: isNowBreaking 
          ? "تم تمييز المقال كخبر عاجل بنجاح"
          : "تم إلغاء تمييز المقال كخبر عاجل بنجاح",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error using the original query key
      if (context?.previousArticles && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousArticles);
      }
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث حالة الخبر العاجل",
        variant: "destructive",
      });
    },
  });

  // Bulk archive mutation
  const bulkArchiveMutation = useMutation({
    mutationFn: async (articleIds: string[]) => {
      return await apiRequest("/api/admin/articles/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ articleIds }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles/metrics"] });
      setSelectedArticles(new Set());
      toast({
        title: "تم الأرشفة",
        description: "تم أرشفة المقالات المحددة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشلت عملية الأرشفة",
        variant: "destructive",
      });
    },
  });

  // Bulk permanent delete mutation
  const bulkPermanentDeleteMutation = useMutation({
    mutationFn: async (articleIds: string[]) => {
      return await apiRequest("/api/admin/articles/bulk-delete-permanent", {
        method: "POST",
        body: JSON.stringify({ articleIds }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles/metrics"] });
      setSelectedArticles(new Set());
      setShowBulkDeleteDialog(false);
      toast({
        title: "تم الحذف",
        description: "تم حذف المقالات المحددة نهائياً",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشلت عملية الحذف",
        variant: "destructive",
      });
    },
  });

  // Update articles order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (articleOrders: Array<{ id: string; displayOrder: number }>) => {
      return await apiRequest("/api/admin/articles/update-order", {
        method: "POST",
        body: JSON.stringify({ articleOrders }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["/api/admin/articles"] });
      await queryClient.refetchQueries({ queryKey: ["/api/admin/articles"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث ترتيب المقالات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث الترتيب",
        variant: "destructive",
      });
      setLocalArticles(articles);
    },
  });

  // Selection handlers
  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articles.map(a => a.id)));
    }
  };

  const handleBulkArchive = () => {
    if (selectedArticles.size === 0) return;
    bulkArchiveMutation.mutate(Array.from(selectedArticles));
  };

  const handleBulkPermanentDelete = () => {
    if (selectedArticles.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleEdit = (article: Article) => {
    setLocation(`/dashboard/articles/${article.id}`);
  };

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localArticles.findIndex((article) => article.id === active.id);
    const newIndex = localArticles.findIndex((article) => article.id === over.id);

    const newArticles = arrayMove(localArticles, oldIndex, newIndex);
    setLocalArticles(newArticles);

    const articleOrders = newArticles.map((article, index) => ({
      id: article.id,
      displayOrder: newArticles.length - index,
    }));

    updateOrderMutation.mutate(articleOrders);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: <Badge variant="secondary" data-testid="badge-draft">مسودة</Badge>,
      scheduled: <Badge variant="outline" data-testid="badge-scheduled">مجدول</Badge>,
      published: <Badge variant="default" data-testid="badge-published">منشور</Badge>,
      archived: <Badge variant="destructive" data-testid="badge-archived">مؤرشف</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      news: <Badge variant="secondary">خبر</Badge>,
      opinion: <Badge variant="outline">رأي</Badge>,
      analysis: <Badge variant="default">تحليل</Badge>,
      column: <Badge variant="default">عمود</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge>{type}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 p-3 md:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" data-testid="heading-title">
              إدارة الأخبار والمقالات
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              إدارة المحتوى الإخباري والمقالات
            </p>
          </div>
          <Button
            onClick={() => setLocation("/dashboard/articles/new")}
            className="gap-2 w-full sm:w-auto"
            size="sm"
            data-testid="button-create-article"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            مقال جديد
          </Button>
        </div>

        {/* Status Cards */}
        {metricsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : metrics ? (
          <StatusCards
            metrics={metrics}
            activeStatus={activeStatus}
            onSelect={setActiveStatus}
          />
        ) : (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            خطأ في تحميل الإحصائيات: {metricsError?.message || "غير معروف"}
          </div>
        )}

        {/* Filters - Mobile Optimized */}
        <div className="bg-card rounded-lg border border-border p-3 md:p-4">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div>
              <Input
                placeholder="البحث عن مقال..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 md:h-9"
                data-testid="input-search-articles"
              />
            </div>
            
            {/* Filters Row */}
            <div className="grid grid-cols-3 md:flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter" className="h-11 md:h-9 md:w-[150px]">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="news">خبر</SelectItem>
                  <SelectItem value="opinion">رأي</SelectItem>
                  <SelectItem value="analysis">تحليل</SelectItem>
                  <SelectItem value="column">عمود</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-category-filter" className="h-11 md:h-9 md:w-[150px]">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                }}
                className="h-11 md:h-9"
                data-testid="button-clear-filters"
              >
                مسح
              </Button>
            </div>
          </div>
        </div>

          {/* Bulk Actions Toolbar */}
          {selectedArticles.size > 0 && (
            <div className="bg-card rounded-lg border border-border p-3 md:p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  تم تحديد {selectedArticles.size} مقال
                </div>
                <div className="flex items-center gap-2">
                  {activeStatus !== "archived" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                      disabled={bulkArchiveMutation.isPending}
                      data-testid="button-bulk-archive"
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      أرشفة المحدد
                    </Button>
                  )}
                  {activeStatus === "archived" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkPermanentDelete}
                      disabled={bulkPermanentDeleteMutation.isPending}
                      data-testid="button-bulk-delete-permanent"
                      className="gap-2"
                    >
                      <Trash className="h-4 w-4" />
                      حذف نهائي
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedArticles(new Set())}
                    data-testid="button-clear-selection"
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Articles Table - Desktop View */}
          <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
            {articlesLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                جاري التحميل...
              </div>
            ) : localArticles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد مقالات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <DndContext
                  sensors={isMobile ? [] : sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-center py-3 px-2 w-10" data-testid="header-drag"></th>
                        <th className="text-center py-3 px-4 w-12">
                          <Checkbox
                            checked={localArticles.length > 0 && selectedArticles.size === localArticles.length}
                            onCheckedChange={toggleSelectAll}
                            data-testid="checkbox-select-all"
                          />
                        </th>
                        <th className="text-right py-3 px-4 font-medium">العنوان</th>
                        <th className="text-right py-3 px-4 font-medium">النوع</th>
                        <th className="text-right py-3 px-4 font-medium">الكاتب</th>
                        <th className="text-right py-3 px-4 font-medium">التصنيف</th>
                        <th className="text-right py-3 px-4 font-medium">عاجل</th>
                        <th className="text-right py-3 px-4 font-medium">المشاهدات</th>
                        <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      <SortableContext
                        items={localArticles.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {localArticles.map((article) => (
                          <SortableRow key={article.id} article={article}>
                            <td className="py-3 px-4 text-center">
                              <Checkbox
                                checked={selectedArticles.has(article.id)}
                                onCheckedChange={() => toggleArticleSelection(article.id)}
                                data-testid={`checkbox-article-${article.id}`}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium max-w-md truncate inline-block">{article.title}</span>
                            </td>
                            <td className="py-3 px-4">
                              {getTypeBadge(article.articleType || "news")}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={article.author?.profileImageUrl || ""} />
                                  <AvatarFallback className="text-xs">
                                    {article.author?.firstName?.[0] || article.author?.email?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {article.author?.firstName || article.author?.email}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">{article.category?.nameAr || "-"}</span>
                            </td>
                            <td className="py-3 px-4">
                              <BreakingSwitch 
                                articleId={article.id}
                                initialValue={article.newsType === "breaking"}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <ViewsCount 
                                views={article.views}
                                iconClassName="h-4 w-4"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => classifyMutation.mutate(article.id)}
                                  disabled={classifyMutation.isPending}
                                  title={classifyMutation.isPending ? "جاري التصنيف..." : "تصنيف ذكي"}
                                  data-testid={`button-classify-${article.id}`}
                                >
                                  <Sparkles className={`w-4 h-4 ${classifyMutation.isPending ? 'text-muted-foreground animate-pulse' : 'text-primary'}`} />
                                </Button>
                                <RowActions 
                                  articleId={article.id}
                                  status={article.status}
                                  onEdit={() => handleEdit(article)}
                                  isFeatured={article.isFeatured}
                                  onDelete={() => setDeletingArticle(article)}
                                />
                              </div>
                            </td>
                          </SortableRow>
                        ))}
                      </SortableContext>
                    </tbody>
                  </table>
                </DndContext>
              </div>
            )}
          </div>

          {/* Articles Cards - Mobile View */}
          <div className="md:hidden space-y-3">
            {articlesLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                جاري التحميل...
              </div>
            ) : articles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                لا توجد مقالات
              </div>
            ) : (
              articles.map((article) => (
                <div 
                  key={article.id} 
                  className="bg-card border rounded-lg p-4 space-y-3 hover-elevate"
                  data-testid={`card-article-${article.id}`}
                >
                  {/* Header: Checkbox + Title + Status */}
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      className="h-11 w-11 md:h-5 md:w-5 mt-0.5"
                      checked={selectedArticles.has(article.id)}
                      onCheckedChange={() => toggleArticleSelection(article.id)}
                      data-testid={`checkbox-article-mobile-${article.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-base flex-1 break-words leading-snug">
                          {article.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(article.status)}
                        {getTypeBadge(article.articleType || "news")}
                      </div>
                    </div>
                  </div>
                  
                  {/* Meta Info: Author + Category */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={article.author?.profileImageUrl || ""} />
                        <AvatarFallback className="text-xs">
                          {article.author?.firstName?.[0] || article.author?.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{article.author?.firstName || article.author?.email}</span>
                    </div>
                    <span>•</span>
                    <span>{article.category?.nameAr || "-"}</span>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {article.newsType === "breaking" && (
                        <Badge variant="destructive" className="text-xs">
                          <Bell className="h-3 w-3 ml-1" />
                          عاجل
                        </Badge>
                      )}
                      {article.isFeatured && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 ml-1 fill-current" />
                          مميز
                        </Badge>
                      )}
                    </div>
                    <ViewsCount 
                      views={article.views}
                      iconClassName="h-4 w-4"
                      className="text-sm text-muted-foreground"
                    />
                  </div>
                  
                  {/* Action Buttons - Always Visible */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => handleEdit(article)}
                      className="flex-1 h-11"
                      data-testid={`button-edit-mobile-${article.id}`}
                    >
                      <Edit className="ml-2 h-4 w-4" />
                      تعديل
                    </Button>
                    
                    <Button
                      size="default"
                      variant={article.newsType === "breaking" ? "destructive" : "outline"}
                      onClick={() => toggleBreakingMutation.mutate({ 
                        id: article.id, 
                        currentState: article.newsType === "breaking"
                      })}
                      disabled={toggleBreakingMutation.isPending}
                      className="flex-1 h-11"
                      data-testid={`button-breaking-mobile-${article.id}`}
                    >
                      <Bell className="ml-2 h-4 w-4" />
                      {article.newsType === "breaking" ? "إلغاء العاجل" : "عاجل"}
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => featureMutation.mutate({ id: article.id, featured: !article.isFeatured })}
                      disabled={featureMutation.isPending}
                      className="h-11 w-11"
                      data-testid={`button-feature-mobile-${article.id}`}
                    >
                      <Star className={`h-5 w-5 ${article.isFeatured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingArticle(article)}
                      className="h-11 w-11"
                      data-testid={`button-delete-mobile-${article.id}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {/* Bulk Action Bar - Mobile Only */}
      {selectedArticles.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {selectedArticles.size} مقال محدد
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedArticles(new Set())}
              data-testid="button-clear-selection-mobile"
            >
              إلغاء التحديد
            </Button>
          </div>
          <div className="flex gap-2">
            {activeStatus !== "archived" && (
              <Button
                size="default"
                variant="outline"
                onClick={() => bulkArchiveMutation.mutate(Array.from(selectedArticles))}
                disabled={bulkArchiveMutation.isPending}
                className="flex-1 h-11"
                data-testid="button-bulk-archive-mobile"
              >
                <Archive className="ml-2 h-4 w-4" />
                أرشفة ({selectedArticles.size})
              </Button>
            )}
            {activeStatus === "archived" && (
              <Button
                size="default"
                variant="destructive"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="flex-1 h-11"
                data-testid="button-bulk-delete-mobile"
              >
                <Trash className="ml-2 h-4 w-4" />
                حذف ({selectedArticles.size})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingArticle} onOpenChange={() => setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الأرشفة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أرشفة المقال "{deletingArticle?.title}"؟ يمكن استعادته لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingArticle && deleteMutation.mutate(deletingArticle.id)}
              data-testid="button-confirm-delete"
            >
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Permanent Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف النهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedArticles.size} مقال نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkPermanentDeleteMutation.mutate(Array.from(selectedArticles))}
              data-testid="button-confirm-bulk-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Classification Results Dialog */}
      <Dialog open={showClassificationDialog} onOpenChange={setShowClassificationDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-classification-results">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              نتائج التصنيف الذكي
            </DialogTitle>
            <DialogDescription>
              تم تحليل المقال بواسطة الذكاء الاصطناعي وتصنيفه تلقائياً
            </DialogDescription>
          </DialogHeader>
          
          {classificationResult && (
            <div className="space-y-4">
              {/* Primary Category */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">التصنيف الأساسي</h3>
                  <Badge variant="default" data-testid="badge-primary-category">
                    {Math.round(classificationResult.primaryCategory.confidence * 100)}% ثقة
                  </Badge>
                </div>
                <p className="text-xl font-bold text-primary mb-2" data-testid="text-primary-category-name">
                  {classificationResult.primaryCategory.categoryName}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-primary-reasoning">
                  {classificationResult.primaryCategory.reasoning}
                </p>
              </div>

              {/* Suggested Categories */}
              {classificationResult.suggestedCategories && classificationResult.suggestedCategories.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">تصنيفات مقترحة إضافية</h3>
                  <div className="space-y-3">
                    {classificationResult.suggestedCategories.map((cat: any, index: number) => (
                      <div 
                        key={cat.categoryId} 
                        className="bg-muted/50 border rounded-lg p-3"
                        data-testid={`suggested-category-${index}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{cat.categoryName}</p>
                          <Badge variant="secondary">
                            {Math.round(cat.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{cat.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Info */}
              <div className="text-xs text-muted-foreground border-t pt-3">
                النموذج المستخدم: {classificationResult.model} ({classificationResult.provider})
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
