import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit,
  Trash2,
  Eye,
  Send,
  Star,
  Menu,
  LogOut,
  Users,
  FolderTree,
  FileText,
  MessageSquare,
  Shield,
  UserCog,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

// Update schema for admin
const updateArticleSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").optional(),
  excerpt: z.string().optional(),
  categoryId: z.union([
    z.string().uuid("معرف التصنيف غير صحيح"),
    z.literal(""),
    z.literal("none")
  ]).optional(),
  articleType: z.enum(["news", "opinion", "analysis", "column"]).optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
});

type ArticleFormValues = z.infer<typeof updateArticleSchema>;

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  articleType: string;
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
  const [location] = useLocation();
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  // State for dialogs and filters
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch articles with filters
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/admin/articles", searchTerm, statusFilter, typeFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
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

  // Form for editing
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(updateArticleSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      categoryId: "",
      articleType: "news",
      status: "draft",
    },
  });

  // Update article mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; values: ArticleFormValues }) => {
      // Convert "none" to empty string for API (backend expects UUID | "" | null)
      const { categoryId, ...rest } = data.values;
      const payload = {
        ...rest,
        categoryId: categoryId === "none" || categoryId === undefined ? "" : categoryId,
      };
      return await apiRequest(`/api/admin/articles/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث المقال بنجاح",
      });
      // Close dialog after a brief delay to show toast
      setTimeout(() => {
        setEditingArticle(null);
        form.reset();
      }, 300);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث المقال",
        variant: "destructive",
      });
    },
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

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    form.reset({
      title: article.title,
      excerpt: article.excerpt || "",
      categoryId: article.category?.id || "none",
      articleType: article.articleType as any,
      status: article.status as any,
    });
  };

  const handleSubmit = (values: ArticleFormValues) => {
    if (!editingArticle) return;
    updateMutation.mutate({ id: editingArticle.id, values });
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
            <div>
              <h1 className="text-2xl font-bold" data-testid="heading-title">
                إدارة الأخبار والمقالات
              </h1>
              <p className="text-sm text-muted-foreground">
                إدارة المحتوى الإخباري والمقالات
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="بحث بالعنوان..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="scheduled">مجدول</SelectItem>
                    <SelectItem value="published">منشور</SelectItem>
                    <SelectItem value="archived">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
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
                      <th className="text-right py-3 px-4 font-medium">النوع</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
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
                          <div className="flex items-center gap-2">
                            {article.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <span className="font-medium">{article.title}</span>
                          </div>
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
                        <td className="py-3 px-4">{getTypeBadge(article.articleType)}</td>
                        <td className="py-3 px-4">{getStatusBadge(article.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{article.views}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(article)}
                              data-testid={`button-edit-${article.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {article.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => publishMutation.mutate(article.id)}
                                data-testid={`button-publish-${article.id}`}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                featureMutation.mutate({
                                  id: article.id,
                                  featured: !article.isFeatured,
                                })
                              }
                              data-testid={`button-feature-${article.id}`}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  article.isFeatured
                                    ? "text-yellow-500 fill-yellow-500"
                                    : ""
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingArticle(article)}
                              data-testid={`button-delete-${article.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={() => setEditingArticle(null)}>
        <DialogContent data-testid="dialog-edit">
          <DialogHeader>
            <DialogTitle>تحرير المقال</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المقتطف</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-excerpt" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصنيف</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون تصنيف</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="articleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="news">خبر</SelectItem>
                        <SelectItem value="opinion">رأي</SelectItem>
                        <SelectItem value="analysis">تحليل</SelectItem>
                        <SelectItem value="column">عمود</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="scheduled">مجدول</SelectItem>
                        <SelectItem value="published">منشور</SelectItem>
                        <SelectItem value="archived">مؤرشف</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingArticle(null)}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit">
                  {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
