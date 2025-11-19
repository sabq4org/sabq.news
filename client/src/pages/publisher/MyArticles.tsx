import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit, Trash2, AlertCircle, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type Article = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publisherStatus: string | null;
  createdAt: string;
  updatedAt: string;
  publisherReviewNotes: string | null;
  categoryId: string;
  category?: {
    nameAr: string;
  };
};

const statusColors = {
  pending: "warning",
  approved: "default",
  rejected: "destructive",
  needs_revision: "secondary",
} as const;

const statusLabels = {
  pending: "قيد الانتظار",
  approved: "موافق عليها",
  rejected: "مرفوضة",
  needs_revision: "تحتاج مراجعة",
};

export default function MyArticles() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [viewingFeedback, setViewingFeedback] = useState<Article | null>(null);

  // RBAC Guard: Publisher only
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'publisher') {
      navigate('/');
      toast({ 
        title: 'غير مصرح', 
        description: 'هذه الصفحة للناشرين فقط', 
        variant: 'destructive' 
      });
    }
  }, [user, navigate, toast]);

  if (!user || user.role !== 'publisher') {
    return null;
  }

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/publisher/articles", activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") {
        params.append("publisherStatus", activeTab);
      }
      const url = `/api/publisher/articles${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("فشل تحميل المقالات");
      return response.json();
    },
    enabled: !!user,
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (articleId: string) => {
      return apiRequest(`/api/publisher/articles/${articleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/logs"] });
      toast({
        title: "نجح",
        description: "تم حذف المقال بنجاح",
      });
      setDeletingArticle(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل حذف المقال",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (article: Article) => {
    if (article.status !== "draft") {
      toast({
        title: "خطأ",
        description: "يمكن حذف المسودات فقط",
        variant: "destructive",
      });
      return;
    }
    setDeletingArticle(article);
  };

  const canEdit = (article: Article) => {
    return article.status === "draft" || article.publisherStatus === "needs_revision";
  };

  const getStatusBadge = (article: Article) => {
    const status = (article.publisherStatus || article.status) as keyof typeof statusColors;
    const variant = statusColors[status] || "default";
    const label = statusLabels[status] || status;

    return (
      <Badge variant={variant as any} data-testid={`badge-status-${article.id}`}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-my-articles">
            مقالاتي
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة ومتابعة مقالاتك
          </p>
        </div>
        <Link href="/publisher/submit">
          <Button data-testid="button-new-article">
            <FileText className="mr-2 h-4 w-4" />
            مقال جديد
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-filter-all">
            الكل
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-filter-pending">
            قيد الانتظار
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-filter-approved">
            موافق عليها
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-filter-rejected">
            مرفوضة
          </TabsTrigger>
          <TabsTrigger value="needs_revision" data-testid="tab-filter-needs-revision">
            تحتاج مراجعة
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div
                  className="p-12 text-center text-muted-foreground"
                  data-testid="text-no-articles"
                >
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">لا توجد مقالات</p>
                  <p className="text-sm mt-2">
                    ابدأ بكتابة مقالك الأول
                  </p>
                </div>
              ) : (
                <Table data-testid="table-articles">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">التصنيف</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{article.title}</div>
                            {(article.publisherStatus === "rejected" ||
                              article.publisherStatus === "needs_revision") &&
                              article.publisherReviewNotes && (
                                <button
                                  onClick={() => setViewingFeedback(article)}
                                  className="text-xs text-muted-foreground hover:text-foreground underline mt-1 flex items-center gap-1"
                                  data-testid={`button-view-feedback-${article.id}`}
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  عرض الملاحظات
                                </button>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {article.category?.nameAr || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(article)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(article.updatedAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/articles/${article.slug}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-view-${article.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canEdit(article) && (
                              <Link href={`/publisher/submit/${article.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-edit-${article.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {article.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(article)}
                                data-testid={`button-delete-${article.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingArticle}
        onOpenChange={(open) => !open && setDeletingArticle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المقال "{deletingArticle?.title}"؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingArticle && deleteArticleMutation.mutate(deletingArticle.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback Dialog */}
      <Dialog
        open={!!viewingFeedback}
        onOpenChange={(open) => !open && setViewingFeedback(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملاحظات المراجعة</DialogTitle>
            <DialogDescription>
              ملاحظات الإدارة على المقال
            </DialogDescription>
          </DialogHeader>
          {viewingFeedback && (
            <div className="space-y-4" dir="rtl">
              <div>
                <h3 className="font-semibold mb-2">المقال:</h3>
                <p className="text-sm text-muted-foreground">
                  {viewingFeedback.title}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">الملاحظات:</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingFeedback.publisherReviewNotes || "لا توجد ملاحظات"}
                </p>
              </div>
              {viewingFeedback.publisherStatus === "needs_revision" && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    يمكنك تعديل المقال ثم إعادة إرساله
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
