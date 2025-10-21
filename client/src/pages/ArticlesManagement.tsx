import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Edit, Trash2, Eye, Send, Star, Bell } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusCards } from "@/components/admin/StatusCards";
import { BreakingSwitch } from "@/components/admin/BreakingSwitch";
import { RowActions } from "@/components/admin/RowActions";

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

  const handleEdit = (article: Article) => {
    setLocation(`/dashboard/articles/${article.id}`);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-title">
              إدارة الأخبار والمقالات
            </h1>
            <p className="text-sm text-muted-foreground">
              إدارة المحتوى الإخباري والمقالات
            </p>
          </div>
          <Button
            onClick={() => setLocation("/dashboard/articles/new")}
            className="gap-2"
            data-testid="button-create-article"
          >
            <Plus className="h-4 w-4" />
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

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="بحث بالعنوان..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>

              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
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
              </div>

              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
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
              </div>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {articlesLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                جاري التحميل...
              </div>
            ) : articles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد مقالات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-right py-3 px-4 font-medium">العنوان</th>
                      <th className="text-right py-3 px-4 font-medium">الكاتب</th>
                      <th className="text-right py-3 px-4 font-medium">التصنيف</th>
                      <th className="text-right py-3 px-4 font-medium">عاجل</th>
                      <th className="text-right py-3 px-4 font-medium">مميز</th>
                      <th className="text-right py-3 px-4 font-medium">المشاهدات</th>
                      <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => (
                      <tr
                        key={article.id}
                        className="border-b border-border hover:bg-muted/30"
                        data-testid={`row-article-${article.id}`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium">{article.title}</span>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => featureMutation.mutate({ id: article.id, featured: !article.isFeatured })}
                            disabled={featureMutation.isPending}
                            data-testid={`button-feature-${article.id}`}
                          >
                            <Star className={`h-4 w-4 ${article.isFeatured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                          </Button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{article.views}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <RowActions 
                            articleId={article.id}
                            status={article.status}
                            onEdit={() => handleEdit(article)}
                            isFeatured={article.isFeatured}
                            onDelete={() => setDeletingArticle(article)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

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
    </DashboardLayout>
  );
}
