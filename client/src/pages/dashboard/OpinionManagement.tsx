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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle,
  Clock,
  Send,
  User
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";

type OpinionArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  reviewStatus?: string;
  reviewNotes?: string;
  views: number;
  publishedAt?: string;
  createdAt: string;
  category?: {
    id: string;
    nameAr: string;
  };
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  reviewer?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function OpinionManagement() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>("all");

  const [reviewingArticle, setReviewingArticle] = useState<OpinionArticle | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data, isLoading } = useQuery<{
    articles: OpinionArticle[];
    pagination: {
      page: number;
      limit: number;
    };
  }>({
    queryKey: ["/api/dashboard/opinion"],
  });

  const articles = data?.articles;

  const approveMutation = useMutation({
    mutationFn: async (articleId: string) => {
      await apiRequest(`/api/dashboard/opinion/${articleId}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/opinion"] });
      toast({
        title: "تم الموافقة",
        description: "تمت الموافقة على المقال بنجاح",
      });
      setReviewingArticle(null);
      setReviewAction(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الموافقة على المقال",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ articleId, notes }: { articleId: string; notes: string }) => {
      await apiRequest(`/api/dashboard/opinion/${articleId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reviewNotes: notes }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/opinion"] });
      toast({
        title: "تم الرفض",
        description: "تم رفض المقال وإرسال الملاحظات للكاتب",
      });
      setReviewingArticle(null);
      setReviewAction(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفض المقال",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (articleId: string) => {
      await apiRequest(`/api/dashboard/opinion/${articleId}/publish`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/opinion"] });
      toast({
        title: "تم النشر",
        description: "تم نشر المقال بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء نشر المقال",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (article: OpinionArticle) => {
    setReviewingArticle(article);
    setReviewAction("approve");
  };

  const handleReject = (article: OpinionArticle) => {
    setReviewingArticle(article);
    setReviewAction("reject");
    setReviewNotes("");
  };

  const confirmReview = () => {
    if (!reviewingArticle) return;

    if (reviewAction === "approve") {
      approveMutation.mutate(reviewingArticle.id);
    } else if (reviewAction === "reject") {
      if (!reviewNotes.trim()) {
        toast({
          title: "خطأ",
          description: "يجب إدخال سبب الرفض",
          variant: "destructive",
        });
        return;
      }
      rejectMutation.mutate({ articleId: reviewingArticle.id, notes: reviewNotes });
    }
  };

  const getReviewStatusBadge = (reviewStatus?: string) => {
    switch (reviewStatus) {
      case "pending_review":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            قيد المراجعة
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3" />
            موافق عليه
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            مرفوض
          </Badge>
        );
      case "needs_changes":
        return (
          <Badge variant="secondary" className="gap-1 bg-orange-600 hover:bg-orange-700 text-white">
            <Edit className="h-3 w-3" />
            يحتاج تعديل
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default">منشور</Badge>;
      case "draft":
        return <Badge variant="secondary">مسودة</Badge>;
      case "scheduled":
        return <Badge variant="secondary">مجدول</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredArticles = articles?.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    const matchesReviewStatus = reviewStatusFilter === "all" || article.reviewStatus === reviewStatusFilter;
    return matchesSearch && matchesStatus && matchesReviewStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              إدارة مقالات الرأي
            </h1>
          </div>
          <Button
            onClick={() => setLocation("/dashboard/article/new?type=opinion")}
            data-testid="button-create-opinion"
          >
            <Plus className="ml-2 h-4 w-4" />
            مقال جديد
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المقالات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-status-filter">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="published">منشور</SelectItem>
              <SelectItem value="scheduled">مجدول</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reviewStatusFilter} onValueChange={setReviewStatusFilter}>
            <SelectTrigger data-testid="select-review-status-filter">
              <SelectValue placeholder="حالة المراجعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع حالات المراجعة</SelectItem>
              <SelectItem value="pending_review">قيد المراجعة</SelectItem>
              <SelectItem value="approved">موافق عليه</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="needs_changes">يحتاج تعديل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-32 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : filteredArticles && filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {filteredArticles.map((article) => {
              const authorName = article.author
                ? `${article.author.firstName || ""} ${article.author.lastName || ""}`.trim() || "غير معروف"
                : "غير معروف";

              return (
                <Card key={article.id} data-testid={`card-opinion-${article.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(article.status)}
                          {article.reviewStatus && getReviewStatusBadge(article.reviewStatus)}
                          {article.category && (
                            <Badge variant="outline">{article.category.nameAr}</Badge>
                          )}
                        </div>

                        <h3 
                          className="text-xl font-bold text-foreground hover:text-primary cursor-pointer"
                          onClick={() => setLocation(`/opinion/${article.slug}`)}
                          data-testid={`text-opinion-title-${article.id}`}
                        >
                          {article.title}
                        </h3>

                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-2">
                            {article.author?.profileImageUrl ? (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={article.author.profileImageUrl} />
                                <AvatarFallback>
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3 w-3" />
                              </div>
                            )}
                            <span>{authorName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{article.views.toLocaleString("en-US")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(article.createdAt), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          </div>
                        </div>

                        {article.reviewNotes && (
                          <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-sm font-semibold text-foreground mb-1">
                              ملاحظات المراجعة:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {article.reviewNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/dashboard/article/${article.id}/edit`)}
                          data-testid={`button-edit-${article.id}`}
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          تعديل
                        </Button>

                        {article.reviewStatus === "pending_review" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(article)}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-approve-${article.id}`}
                            >
                              <CheckCircle className="h-4 w-4 ml-2" />
                              موافقة
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(article)}
                              data-testid={`button-reject-${article.id}`}
                            >
                              <XCircle className="h-4 w-4 ml-2" />
                              رفض
                            </Button>
                          </>
                        )}

                        {article.reviewStatus === "approved" && article.status === "draft" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => publishMutation.mutate(article.id)}
                            data-testid={`button-publish-${article.id}`}
                          >
                            <Send className="h-4 w-4 ml-2" />
                            نشر
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/opinion/${article.slug}`, "_blank")}
                          data-testid={`button-view-${article.id}`}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              لا توجد مقالات رأي
            </h2>
            <p className="text-muted-foreground mb-6">
              ابدأ بإنشاء مقال رأي جديد
            </p>
            <Button onClick={() => setLocation("/dashboard/article/new?type=opinion")}>
              <Plus className="ml-2 h-4 w-4" />
              مقال جديد
            </Button>
          </div>
        )}

        <Dialog 
          open={!!reviewingArticle && !!reviewAction} 
          onOpenChange={(open) => {
            if (!open) {
              setReviewingArticle(null);
              setReviewAction(null);
              setReviewNotes("");
            }
          }}
        >
          <DialogContent data-testid="dialog-review-opinion">
            <DialogHeader>
              <DialogTitle>
                {reviewAction === "approve" ? "الموافقة على المقال" : "رفض المقال"}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === "approve" 
                  ? "هل أنت متأكد من الموافقة على هذا المقال؟"
                  : "يرجى تقديم ملاحظات للكاتب حول سبب الرفض"}
              </DialogDescription>
            </DialogHeader>

            {reviewAction === "reject" && (
              <Textarea
                placeholder="اكتب ملاحظاتك هنا..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={5}
                data-testid="textarea-review-notes"
              />
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReviewingArticle(null);
                  setReviewAction(null);
                  setReviewNotes("");
                }}
                data-testid="button-cancel-review"
              >
                إلغاء
              </Button>
              <Button
                variant={reviewAction === "approve" ? "default" : "destructive"}
                onClick={confirmReview}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                data-testid="button-confirm-review"
              >
                {reviewAction === "approve" ? "تأكيد الموافقة" : "تأكيد الرفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
