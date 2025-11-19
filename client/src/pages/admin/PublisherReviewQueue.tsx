import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArticlePreviewModal } from "@/components/admin/ArticlePreviewModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  publisherStatus: string;
  createdAt: string;
  publisher?: {
    id: string;
    agencyName: string;
  } | null;
}

export default function PublisherReviewQueue() {
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

  const [publisherFilter, setPublisherFilter] = useState("all");
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [approvingArticle, setApprovingArticle] = useState<Article | null>(null);
  const [rejectingArticle, setRejectingArticle] = useState<Article | null>(null);
  const [revisionArticle, setRevisionArticle] = useState<Article | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [revisionFeedback, setRevisionFeedback] = useState("");

  // Fetch all publishers for filter
  const { data: publishersData } = useQuery({
    queryKey: ["/api/admin/publishers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/publishers", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch publishers");
      return response.json();
    },
  });

  const publishers = publishersData?.publishers || [];

  // Fetch pending articles
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ["/api/admin/publisher-articles", publisherFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("publisherStatus", "pending");
      if (publisherFilter !== "all") {
        params.append("publisherId", publisherFilter);
      }

      const response = await fetch(`/api/admin/publisher-articles?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
  });

  const articles = articlesData?.articles || [];

  // Approve article mutation
  const approveMutation = useMutation({
    mutationFn: async (articleId: string) => {
      return await apiRequest(`/api/admin/publisher-articles/${articleId}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publisher-articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publishers"] });
      toast({
        title: "تمت الموافقة",
        description: "تم قبول المقال بنجاح",
      });
      setApprovingArticle(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في الموافقة على المقال",
        variant: "destructive",
      });
    },
  });

  // Reject article mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ articleId, reason }: { articleId: string; reason: string }) => {
      return await apiRequest(`/api/admin/publisher-articles/${articleId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publisher-articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publishers"] });
      toast({
        title: "تم الرفض",
        description: "تم رفض المقال",
      });
      setRejectingArticle(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفض المقال",
        variant: "destructive",
      });
    },
  });

  // Request revision mutation
  const revisionMutation = useMutation({
    mutationFn: async ({ articleId, feedback }: { articleId: string; feedback: string }) => {
      return await apiRequest(`/api/admin/publisher-articles/${articleId}/request-revision`, {
        method: "POST",
        body: JSON.stringify({ notes: feedback }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publisher-articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publishers"] });
      toast({
        title: "تم طلب التعديل",
        description: "تم إرسال طلب التعديل للناشر",
      });
      setRevisionArticle(null);
      setRevisionFeedback("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في طلب التعديل",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (article: Article) => {
    setApprovingArticle(article);
  };

  const confirmApprove = () => {
    if (approvingArticle) {
      approveMutation.mutate(approvingArticle.id);
    }
  };

  const handleReject = (article: Article) => {
    setRejectingArticle(article);
    setRejectionReason("");
  };

  const confirmReject = () => {
    if (rejectingArticle && rejectionReason.trim()) {
      rejectMutation.mutate({
        articleId: rejectingArticle.id,
        reason: rejectionReason,
      });
    }
  };

  const handleRequestRevision = (article: Article) => {
    setRevisionArticle(article);
    setRevisionFeedback("");
  };

  const confirmRevision = () => {
    if (revisionArticle && revisionFeedback.trim()) {
      revisionMutation.mutate({
        articleId: revisionArticle.id,
        feedback: revisionFeedback,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-review-queue">
              مراجعة مقالات الناشرين
            </h1>
            <p className="text-muted-foreground">
              مراجعة والموافقة على المقالات المقدمة من الناشرين
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle>المقالات قيد المراجعة</CardTitle>
              <div className="flex gap-4">
                <Select
                  value={publisherFilter}
                  onValueChange={setPublisherFilter}
                  data-testid="select-publisher-filter"
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="جميع الناشرين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الناشرين</SelectItem>
                    {publishers.map((publisher: any) => (
                      <SelectItem key={publisher.id} value={publisher.id}>
                        {publisher.agencyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-testid="empty-state"
              >
                <p className="text-lg">لا توجد مقالات قيد المراجعة</p>
                <p className="text-sm mt-2">جميع المقالات تمت مراجعتها</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">الناشر</TableHead>
                      <TableHead className="text-right">تاريخ الإرسال</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article: Article) => (
                      <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                        <TableCell className="font-medium max-w-md">
                          <div className="truncate">{article.title}</div>
                          {article.excerpt && (
                            <div className="text-sm text-muted-foreground truncate mt-1">
                              {article.excerpt}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {article.publisher?.agencyName || "غير معروف"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(article.createdAt), {
                            locale: ar,
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-status-${article.id}`}>
                            قيد المراجعة
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewArticle(article)}
                              data-testid={`button-preview-${article.id}`}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              معاينة
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(article)}
                              data-testid={`button-approve-${article.id}`}
                            >
                              <CheckCircle className="h-4 w-4 ml-1" />
                              موافقة
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestRevision(article)}
                              data-testid={`button-request-revision-${article.id}`}
                            >
                              <AlertCircle className="h-4 w-4 ml-1" />
                              تعديل
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(article)}
                              data-testid={`button-reject-${article.id}`}
                            >
                              <XCircle className="h-4 w-4 ml-1" />
                              رفض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <ArticlePreviewModal
        isOpen={!!previewArticle}
        onClose={() => setPreviewArticle(null)}
        article={previewArticle}
      />

      {/* Approve Confirmation */}
      <AlertDialog
        open={!!approvingArticle}
        onOpenChange={() => setApprovingArticle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>الموافقة على المقال</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من الموافقة على "{approvingArticle?.title}"؟
              <br />
              <span className="text-sm font-medium">
                ملاحظة: سيتم خصم نقطة من رصيد الناشر تلقائياً.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-approve">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "جاري المعالجة..." : "موافقة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingArticle} onOpenChange={() => setRejectingArticle(null)}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>رفض المقال</DialogTitle>
            <DialogDescription>
              يرجى تقديم سبب الرفض. سيتم إرساله للناشر.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="اكتب سبب الرفض..."
              rows={4}
              data-testid="textarea-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectingArticle(null)}
              data-testid="button-cancel-reject"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "جاري الرفض..." : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={!!revisionArticle} onOpenChange={() => setRevisionArticle(null)}>
        <DialogContent data-testid="dialog-revision">
          <DialogHeader>
            <DialogTitle>طلب تعديل</DialogTitle>
            <DialogDescription>
              يرجى تقديم ملاحظات التعديل المطلوبة. سيتم إرسالها للناشر.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="اكتب ملاحظات التعديل..."
              rows={4}
              data-testid="textarea-revision-feedback"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevisionArticle(null)}
              data-testid="button-cancel-revision"
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmRevision}
              disabled={!revisionFeedback.trim() || revisionMutation.isPending}
              data-testid="button-confirm-revision"
            >
              {revisionMutation.isPending ? "جاري الإرسال..." : "إرسال"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
