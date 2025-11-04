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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Send, Star, Bell, Plus, Archive, Trash, GripVertical } from "lucide-react";
import { ViewsCount } from "@/components/ViewsCount";
import { EnglishDashboardLayout } from "@/components/en/EnglishDashboardLayout";
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
      className="border-t border-stroke dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4"
      data-testid={`row-en-article-${article.id}`}
    >
      <td className="py-4 px-2 text-center cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 mx-auto text-muted-foreground" data-testid={`drag-handle-en-${article.id}`} />
      </td>
      {children}
    </tr>
  );
}

export default function EnglishArticlesPage() {
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["/api/en/dashboard/articles/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/en/dashboard/articles/metrics", { credentials: "include" });
      if (!response.ok) {
        console.error("Metrics fetch failed:", response.status, response.statusText);
        throw new Error("Failed to fetch metrics");
      }
      const data = await response.json();
      console.log("English metrics loaded:", data);
      return data;
    },
    enabled: !!user,
  });

  // Fetch articles with filters
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/en/dashboard/articles", searchTerm, activeStatus, typeFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (activeStatus) params.append("status", activeStatus);
      if (typeFilter && typeFilter !== "all") params.append("articleType", typeFilter);
      if (categoryFilter && categoryFilter !== "all") params.append("categoryId", categoryFilter);
      
      const url = `/api/en/dashboard/articles${params.toString() ? `?${params.toString()}` : ""}`;
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
      return await apiRequest(`/api/en/dashboard/articles/${id}/publish`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles"] });
      toast({
        title: "Published",
        description: "Article published successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish article",
        variant: "destructive",
      });
    },
  });

  // Feature mutation
  const featureMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      return await apiRequest(`/api/en/dashboard/articles/${id}/feature`, {
        method: "POST",
        body: JSON.stringify({ featured }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles"] });
      toast({
        title: "Updated",
        description: "Feature status updated successfully",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/en/dashboard/articles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles"] });
      setDeletingArticle(null);
      toast({
        title: "Archived",
        description: "Article archived successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive article",
        variant: "destructive",
      });
    },
  });

  // Resend notifications mutation
  const resendNotificationsMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/en/dashboard/articles/${id}/resend-notification`, {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Notifications Sent",
        description: data.message || "Notifications sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    },
  });

  // Toggle breaking news mutation
  const toggleBreakingMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      return await apiRequest(`/api/en/dashboard/articles/${id}/toggle-breaking`, {
        method: "POST",
      });
    },
    onMutate: async ({ id, currentState }) => {
      const queryKey = ["/api/en/dashboard/articles", searchTerm, activeStatus, typeFilter, categoryFilter];
      
      await queryClient.cancelQueries({ queryKey: ["/api/en/dashboard/articles"] });
      
      const previousArticles = queryClient.getQueryData(queryKey);
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles"] });
      const isNowBreaking = !currentState;
      toast({
        title: isNowBreaking ? "Marked as Breaking News" : "Unmarked as Breaking News",
        description: isNowBreaking 
          ? "Article marked as breaking news successfully"
          : "Article unmarked as breaking news successfully",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousArticles && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousArticles);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update breaking news status",
        variant: "destructive",
      });
    },
  });

  // Bulk archive mutation
  const bulkArchiveMutation = useMutation({
    mutationFn: async (articleIds: string[]) => {
      return await apiRequest("/api/en/dashboard/articles/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ articleIds }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles/metrics"] });
      setSelectedArticles(new Set());
      toast({
        title: "Archived",
        description: "Selected articles archived successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive articles",
        variant: "destructive",
      });
    },
  });

  // Bulk permanent delete mutation
  const bulkPermanentDeleteMutation = useMutation({
    mutationFn: async (articleIds: string[]) => {
      return await apiRequest("/api/en/dashboard/articles/bulk-delete-permanent", {
        method: "POST",
        body: JSON.stringify({ articleIds }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/en/dashboard/articles/metrics"] });
      setSelectedArticles(new Set());
      setShowBulkDeleteDialog(false);
      toast({
        title: "Deleted",
        description: "Selected articles permanently deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete articles",
        variant: "destructive",
      });
    },
  });

  // Update articles order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (articleOrders: Array<{ id: string; displayOrder: number }>) => {
      return await apiRequest("/api/en/dashboard/articles/update-order", {
        method: "POST",
        body: JSON.stringify({ articleOrders }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["/api/en/dashboard/articles"] });
      await queryClient.refetchQueries({ queryKey: ["/api/en/dashboard/articles"] });
      toast({
        title: "Updated",
        description: "Articles order updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
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
    setLocation(`/en/dashboard/articles/${article.id}/edit`);
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
      draft: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-warning/10 text-warning border-warning/20 no-default-hover-elevate no-default-active-elevate" data-testid="badge-en-draft">Draft</Badge>,
      scheduled: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20 no-default-hover-elevate no-default-active-elevate" data-testid="badge-en-scheduled">Scheduled</Badge>,
      published: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-success/10 text-success border-success/20 no-default-hover-elevate no-default-active-elevate" data-testid="badge-en-published">Published</Badge>,
      archived: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-danger/10 text-danger border-danger/20 no-default-hover-elevate no-default-active-elevate" data-testid="badge-en-archived">Archived</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      news: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20 no-default-hover-elevate no-default-active-elevate">News</Badge>,
      opinion: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 no-default-hover-elevate no-default-active-elevate">Opinion</Badge>,
      analysis: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 no-default-hover-elevate no-default-active-elevate">Analysis</Badge>,
      column: <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400 no-default-hover-elevate no-default-active-elevate">Column</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-medium no-default-hover-elevate no-default-active-elevate">{type}</Badge>;
  };

  const StatusCards = ({ 
    metrics, 
    activeStatus, 
    onSelect 
  }: { 
    metrics: any; 
    activeStatus: string; 
    onSelect: (status: "published" | "scheduled" | "draft" | "archived") => void 
  }) => {
    const cards = [
      { status: "published" as const, label: "Published", count: metrics.published || 0 },
      { status: "scheduled" as const, label: "Scheduled", count: metrics.scheduled || 0 },
      { status: "draft" as const, label: "Draft", count: metrics.draft || 0 },
      { status: "archived" as const, label: "Archived", count: metrics.archived || 0 },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {cards.map(({ status, label, count }) => (
          <button
            key={status}
            onClick={() => onSelect(status)}
            className={`rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark px-7.5 py-6 transition-colors no-default-hover-elevate no-default-active-elevate ${
              activeStatus === status
                ? "ring-2 ring-primary"
                : ""
            }`}
            data-testid={`status-card-en-${status}`}
          >
            <div className="text-2xl md:text-3xl font-bold text-black dark:text-white">{count}</div>
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
          </button>
        ))}
      </div>
    );
  };

  const BreakingSwitch = ({ 
    articleId, 
    initialValue 
  }: { 
    articleId: string; 
    initialValue: boolean 
  }) => {
    return (
      <button
        onClick={() => toggleBreakingMutation.mutate({ id: articleId, currentState: initialValue })}
        disabled={toggleBreakingMutation.isPending}
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          initialValue
            ? "bg-danger/10 text-danger border border-danger/20"
            : "bg-gray-2 text-muted-foreground dark:bg-meta-4"
        }`}
        data-testid={`breaking-switch-en-${articleId}`}
      >
        {initialValue ? "Breaking" : "Regular"}
      </button>
    );
  };

  const RowActions = ({ 
    articleId, 
    status, 
    onEdit, 
    isFeatured, 
    onDelete 
  }: { 
    articleId: string; 
    status: string; 
    onEdit: () => void; 
    isFeatured: boolean; 
    onDelete: () => void 
  }) => {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          className="hover:text-primary"
          data-testid={`button-edit-en-${articleId}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => featureMutation.mutate({ id: articleId, featured: !isFeatured })}
          disabled={featureMutation.isPending}
          className="hover:text-warning"
          data-testid={`button-feature-en-${articleId}`}
        >
          <Star className={`h-4 w-4 ${isFeatured ? 'text-warning fill-warning' : ''}`} />
        </Button>
        {status === "draft" && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => publishMutation.mutate(articleId)}
            disabled={publishMutation.isPending}
            className="hover:text-success"
            data-testid={`button-publish-en-${articleId}`}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="hover:text-danger"
          data-testid={`button-delete-en-${articleId}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <EnglishDashboardLayout>
      <div className="space-y-6 p-0" dir="ltr">
        {/* Header */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white" data-testid="heading-en-title">
                News & Articles Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage news content and articles
              </p>
            </div>
            <Button
              onClick={() => setLocation("/en/dashboard/articles/new")}
              className="gap-2 w-full sm:w-auto"
              data-testid="button-create-en-article"
            >
              <Plus className="h-4 w-4" />
              New Article
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        {metricsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark animate-pulse" />
            ))}
          </div>
        ) : metrics ? (
          <StatusCards
            metrics={metrics}
            activeStatus={activeStatus}
            onSelect={setActiveStatus}
          />
        ) : (
          <div className="rounded-sm border border-danger bg-danger/10 px-6 py-4">
            <p className="text-sm font-medium text-danger">Error loading metrics: {metricsError?.message || "Unknown"}</p>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 text-sm"
                data-testid="input-en-search"
              />
            </div>

            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-en-type-filter" className="h-11 text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="opinion">Opinion</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="column">Column</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-en-category-filter" className="h-11 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedArticles.size > 0 && (
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-black dark:text-white">
                {selectedArticles.size} article{selectedArticles.size > 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2">
                {activeStatus !== "archived" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={bulkArchiveMutation.isPending}
                    data-testid="button-bulk-archive-en"
                    className="gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    Archive Selected
                  </Button>
                )}
                {activeStatus === "archived" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkPermanentDelete}
                    disabled={bulkPermanentDeleteMutation.isPending}
                    data-testid="button-bulk-delete-permanent-en"
                    className="gap-2"
                  >
                    <Trash className="h-4 w-4" />
                    Delete Permanently
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedArticles(new Set())}
                  data-testid="button-clear-selection-en"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Articles Table - Desktop View */}
        <div className="hidden md:block rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Table Header */}
          <div className="px-4 py-6 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              All Articles
            </h4>
          </div>

          {articlesLoading ? (
            <div className="border-t border-stroke dark:border-strokedark p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : localArticles.length === 0 ? (
            <div className="border-t border-stroke dark:border-strokedark p-8 text-center">
              <p className="text-muted-foreground">No articles found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or create a new article</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-stroke px-4 py-4.5 dark:border-strokedark md:px-6 2xl:px-7.5">
                      <th className="text-center px-2 w-10" data-testid="header-en-drag"></th>
                      <th className="text-center px-4 w-12">
                        <Checkbox
                          checked={localArticles.length > 0 && selectedArticles.size === localArticles.length}
                          onCheckedChange={toggleSelectAll}
                          data-testid="checkbox-select-all-en"
                        />
                      </th>
                      <th className="text-left px-4 py-4.5 font-medium text-sm text-black dark:text-white">Title</th>
                      <th className="text-left px-4 py-4.5 font-medium text-sm text-black dark:text-white">Type</th>
                      <th className="text-left px-4 py-4.5 font-medium text-sm text-black dark:text-white">Author</th>
                      <th className="text-left px-4 py-4.5 font-medium text-sm text-black dark:text-white">Category</th>
                      <th className="text-left px-4 py-4.5 font-medium text-sm text-black dark:text-white">Breaking</th>
                      <th className="text-left px-4 py-4.5 font-medium text-sm text-black dark:text-white">Views</th>
                      <th className="text-left px-4 py-4.5 font-medium text-sm text-black dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={localArticles.map(a => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {localArticles.map((article) => (
                        <SortableRow key={article.id} article={article}>
                          <td className="py-4 px-4 text-center">
                            <Checkbox
                              checked={selectedArticles.has(article.id)}
                              onCheckedChange={() => toggleArticleSelection(article.id)}
                              data-testid={`checkbox-en-article-${article.id}`}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-sm text-black dark:text-white max-w-md truncate inline-block">{article.title}</span>
                          </td>
                          <td className="py-4 px-4">
                            {getTypeBadge(article.articleType || "news")}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={article.author?.profileImageUrl || ""} />
                                <AvatarFallback className="text-xs">
                                  {article.author?.firstName?.[0] || article.author?.email?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-black dark:text-white">
                                {article.author?.firstName || article.author?.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-black dark:text-white">{article.category?.nameEn || "-"}</span>
                          </td>
                          <td className="py-4 px-4">
                            <BreakingSwitch 
                              articleId={article.id}
                              initialValue={article.newsType === "breaking"}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <ViewsCount 
                              views={article.views}
                              iconClassName="h-4 w-4"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <RowActions 
                              articleId={article.id}
                              status={article.status}
                              onEdit={() => handleEdit(article)}
                              isFeatured={article.isFeatured}
                              onDelete={() => setDeletingArticle(article)}
                            />
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
        <div className="md:hidden space-y-4">
          {articlesLoading ? (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8 text-center">
              <p className="text-muted-foreground">No articles found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or create a new article</p>
            </div>
          ) : (
            articles.map((article) => (
              <div 
                key={article.id} 
                className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4 space-y-3 hover-elevate"
                data-testid={`card-en-article-${article.id}`}
              >
                {/* Checkbox and Title */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedArticles.has(article.id)}
                    onCheckedChange={() => toggleArticleSelection(article.id)}
                    data-testid={`checkbox-en-article-mobile-${article.id}`}
                    className="mt-1"
                  />
                  <div className="flex-1 flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-sm flex-1 break-words leading-snug text-black dark:text-white">
                      {article.title}
                    </h3>
                    {getStatusBadge(article.status)}
                  </div>
                </div>

                {/* Author and Category */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={article.author?.profileImageUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {article.author?.firstName?.[0] || article.author?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-black dark:text-white">
                      {article.author?.firstName || article.author?.email}
                    </span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-black dark:text-white">
                    {article.category?.nameEn || "-"}
                  </span>
                </div>

                {/* Article Type */}
                <div>
                  {getTypeBadge(article.articleType || "news")}
                </div>

                {/* Badges and Views */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {article.newsType === "breaking" && (
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-danger/10 text-danger border-danger/20 no-default-hover-elevate no-default-active-elevate">Breaking</Badge>
                    )}
                    {article.isFeatured && (
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning/10 text-warning border-warning/20 flex items-center gap-1 no-default-hover-elevate no-default-active-elevate">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <ViewsCount 
                    views={article.views}
                    iconClassName="h-3.5 w-3.5"
                    className="text-xs text-muted-foreground"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-stroke dark:border-strokedark">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(article)}
                    className="flex-1 gap-1.5"
                    data-testid={`button-edit-mobile-en-${article.id}`}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  
                  {article.newsType !== "breaking" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleBreakingMutation.mutate({ 
                        id: article.id, 
                        currentState: false 
                      })}
                      disabled={toggleBreakingMutation.isPending}
                      className="flex-1 gap-1.5"
                      data-testid={`button-breaking-mobile-en-${article.id}`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Breaking
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => toggleBreakingMutation.mutate({ 
                        id: article.id, 
                        currentState: true 
                      })}
                      disabled={toggleBreakingMutation.isPending}
                      className="flex-1"
                      data-testid={`button-unbreaking-mobile-en-${article.id}`}
                    >
                      Unmark
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => featureMutation.mutate({ id: article.id, featured: !article.isFeatured })}
                    disabled={featureMutation.isPending}
                    className="hover:text-warning"
                    data-testid={`button-feature-mobile-en-${article.id}`}
                  >
                    <Star className={`h-4 w-4 ${article.isFeatured ? 'text-warning fill-warning' : ''}`} />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeletingArticle(article)}
                    className="hover:text-danger"
                    data-testid={`button-delete-mobile-en-${article.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingArticle} onOpenChange={() => setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive the article "{deletingArticle?.title}"? You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-en">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingArticle && deleteMutation.mutate(deletingArticle.id)}
              data-testid="button-confirm-delete-en"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Permanent Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedArticles.size} article{selectedArticles.size > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete-en">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkPermanentDeleteMutation.mutate(Array.from(selectedArticles))}
              data-testid="button-confirm-bulk-delete-en"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EnglishDashboardLayout>
  );
}
