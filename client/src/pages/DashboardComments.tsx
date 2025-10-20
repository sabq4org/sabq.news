import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, MessageCircle, User, Calendar, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  moderatedAt?: string;
  moderationReason?: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  articleId: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
}

export default function DashboardComments() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch ALL comments once - we'll filter in the UI
  const { data: allComments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/dashboard/comments"],
  });

  // Filter comments based on active tab
  const comments = allComments?.filter(c => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  // Fetch articles to show titles
  const { data: articles } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const getArticleTitle = (articleId: string) => {
    const article = articles?.find(a => a.id === articleId);
    return article?.title || "مقال غير معروف";
  };

  const getArticleSlug = (articleId: string) => {
    const article = articles?.find(a => a.id === articleId);
    return article?.slug || "#";
  };

  const approveMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(`/api/dashboard/comments/${commentId}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "تم اعتماد التعليق",
        description: "تم اعتماد التعليق ونشره بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/comments"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل اعتماد التعليق",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason?: string }) => {
      return await apiRequest(`/api/dashboard/comments/${commentId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم رفض التعليق",
        description: "تم رفض التعليق بنجاح",
      });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedComment(null);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/comments"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل رفض التعليق",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (comment: Comment) => {
    approveMutation.mutate(comment.id);
  };

  const handleRejectClick = (comment: Comment) => {
    setSelectedComment(comment);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedComment) {
      rejectMutation.mutate({
        commentId: selectedComment.id,
        reason: rejectionReason || undefined,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">معتمد</Badge>;
      case "pending":
        return <Badge variant="secondary">بانتظار المراجعة</Badge>;
      case "rejected":
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserName = (user: Comment["user"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split("@")[0];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Calculate counts from ALL comments, not just filtered ones
  const pendingCount = allComments?.filter(c => c.status === "pending").length || 0;
  const approvedCount = allComments?.filter(c => c.status === "approved").length || 0;
  const rejectedCount = allComments?.filter(c => c.status === "rejected").length || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة التعليقات</h1>
          <p className="text-muted-foreground">
            مراجعة واعتماد تعليقات المستخدمين
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">بانتظار المراجعة</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معتمد</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مرفوض</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-4 gap-2">
          <TabsTrigger value="pending" data-testid="tab-pending">
            بانتظار المراجعة ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            معتمد ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            مرفوض ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            الكل ({allComments?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {!comments || comments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد تعليقات</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} data-testid={`comment-${comment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getUserName(comment.user)}</span>
                          {getStatusBadge(comment.status)}
                        </div>
                        <Link href={`/article/${getArticleSlug(comment.articleId)}`}>
                          <p className="text-sm text-primary hover:underline">
                            على المقال: {getArticleTitle(comment.articleId)}
                          </p>
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: arSA,
                          })}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">{comment.content}</p>

                    {comment.moderationReason && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">سبب الرفض:</p>
                        <p className="text-sm">{comment.moderationReason}</p>
                      </div>
                    )}

                    {comment.status === "pending" && (
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(comment)}
                          disabled={approveMutation.isPending}
                          className="gap-2"
                          data-testid={`button-approve-${comment.id}`}
                        >
                          <Check className="h-4 w-4" />
                          اعتماد
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(comment)}
                          disabled={rejectMutation.isPending}
                          className="gap-2"
                          data-testid={`button-reject-${comment.id}`}
                        >
                          <X className="h-4 w-4" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض التعليق</DialogTitle>
            <DialogDescription>
              يمكنك إضافة سبب الرفض (اختياري)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="اكتب سبب رفض التعليق..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            data-testid="input-rejection-reason"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              data-testid="button-cancel-reject"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
