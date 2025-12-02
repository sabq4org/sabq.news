import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Brain,
  Eye,
  Check,
  X,
  AlertTriangle,
  MessageCircle,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Filter,
  Pencil,
  Trash2,
  FileText,
  ExternalLink,
  History,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { arSA } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";

interface ModerationResult {
  commentId: string;
  moderationScore: number;
  aiClassification: 'safe' | 'flagged' | 'spam' | 'harmful';
  detectedIssues: string[];
  aiModerationAnalyzedAt: string;
  comment: {
    id: string;
    content: string;
    status: string;
    createdAt: string;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
    articleId: string;
    articleTitle?: string;
    articleSlug?: string;
  };
}

interface ModerationStats {
  total: number;
  safe: number;
  flagged: number;
  spam: number;
  harmful: number;
  pending: number;
  averageScore: number;
}

const classificationColors: Record<string, { bg: string; text: string; icon: typeof Shield }> = {
  safe: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", icon: ShieldCheck },
  flagged: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", icon: ShieldAlert },
  spam: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", icon: Shield },
  harmful: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", icon: ShieldX },
};

const classificationLabels: Record<string, string> = {
  safe: "آمن",
  flagged: "مشكوك فيه",
  spam: "سبام",
  harmful: "ضار",
};

const issueLabels: Record<string, string> = {
  hate_speech: "خطاب كراهية",
  profanity: "ألفاظ نابية",
  harassment: "تحرش",
  spam: "محتوى مزعج",
  misinformation: "معلومات مضللة",
  adult_content: "محتوى للبالغين",
  violence: "عنف",
  personal_attack: "هجوم شخصي",
  off_topic: "خارج الموضوع",
  self_promotion: "ترويج ذاتي",
};

export default function AIModerationDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [selectedComment, setSelectedComment] = useState<ModerationResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<ModerationResult | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editReason, setEditReason] = useState("");
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingComment, setDeletingComment] = useState<ModerationResult | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<ModerationStats>({
    queryKey: ["/api/moderation/stats"],
  });

  const { data: results, isLoading: resultsLoading, refetch } = useQuery<ModerationResult[]>({
    queryKey: ["/api/moderation/results", activeTab, scoreFilter],
    queryFn: async () => {
      let url = "/api/moderation/results?";
      if (activeTab !== "all") {
        url += `classification=${activeTab}&`;
      }
      if (scoreFilter !== "all") {
        const [min, max] = scoreFilter.split("-").map(Number);
        url += `minScore=${min}&maxScore=${max}&`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
  });

  const analyzeAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/moderation/analyze-all", {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "تم بدء التحليل",
        description: `جاري تحليل ${data.count || 0} تعليق`,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/moderation"] });
        refetch();
      }, 2000);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل بدء التحليل",
        variant: "destructive",
      });
    },
  });

  const analyzeSingleMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(`/api/moderation/analyze/${commentId}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "تم التحليل",
        description: "تم تحليل التعليق بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation"] });
      refetch();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تحليل التعليق",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(`/api/dashboard/comments/${commentId}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الاعتماد",
        description: "تم اعتماد التعليق بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/comments"] });
      refetch();
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
    mutationFn: async (commentId: string) => {
      return await apiRequest(`/api/dashboard/comments/${commentId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "AI Moderation: تم الرفض بناءً على تحليل الذكاء الاصطناعي" }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الرفض",
        description: "تم رفض التعليق بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/comments"] });
      refetch();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل رفض التعليق",
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editMutation = useMutation({
    mutationFn: async ({ commentId, content, reason }: { commentId: string; content: string; reason?: string }) => {
      return await apiRequest(`/api/moderation/edit/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({ content, reason }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم التعديل",
        description: "تم تعديل التعليق بنجاح",
      });
      setEditDialogOpen(false);
      setEditingComment(null);
      setEditContent("");
      setEditReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/comments"] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل تعديل التعليق",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason?: string }) => {
      return await apiRequest(`/api/moderation/delete/${commentId}`, {
        method: "DELETE",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف التعليق بنجاح",
      });
      setDeleteDialogOpen(false);
      setDeletingComment(null);
      setDeleteReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/comments"] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل حذف التعليق",
        variant: "destructive",
      });
    },
  });

  // Handle opening edit dialog
  const handleEditClick = (result: ModerationResult) => {
    setEditingComment(result);
    setEditContent(result.comment.content);
    setEditReason("");
    setEditDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDeleteClick = (result: ModerationResult) => {
    setDeletingComment(result);
    setDeleteReason("");
    setDeleteDialogOpen(true);
  };

  // Handle edit submit
  const handleEditSubmit = () => {
    if (!editingComment || !editContent.trim()) return;
    editMutation.mutate({
      commentId: editingComment.commentId,
      content: editContent.trim(),
      reason: editReason.trim() || undefined,
    });
  };

  // Handle delete confirm
  const handleDeleteConfirm = () => {
    if (!deletingComment) return;
    deleteMutation.mutate({
      commentId: deletingComment.commentId,
      reason: deleteReason.trim() || undefined,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getUserName = (user: ModerationResult["comment"]["user"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split("@")[0];
  };

  const handleViewDetails = (result: ModerationResult) => {
    setSelectedComment(result);
    setDetailsOpen(true);
  };

  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">الرقابة الذكية</h1>
            </div>
            <div className="flex items-center gap-2 mb-2 mr-10">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                GPT-4o-mini
              </Badge>
            </div>
            <p className="text-muted-foreground">
              تحليل وفلترة التعليقات تلقائياً باستخدام الذكاء الاصطناعي
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="icon"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => analyzeAllMutation.mutate()}
              disabled={analyzeAllMutation.isPending}
              className="gap-2"
              data-testid="button-analyze-all"
            >
              {analyzeAllMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  تحليل الكل
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المحلل</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">آمن</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.safe || 0}</p>
                </div>
                <div className="p-2 rounded-full bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">مشكوك فيه</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.flagged || 0}</p>
                </div>
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <ShieldAlert className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">سبام</p>
                  <p className="text-2xl font-bold text-orange-600">{stats?.spam || 0}</p>
                </div>
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">ضار</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.harmful || 0}</p>
                </div>
                <div className="p-2 rounded-full bg-red-500/10">
                  <ShieldX className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {stats && stats.total > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                متوسط نقاط الأمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress
                  value={stats.averageScore}
                  className="h-3 flex-1"
                />
                <span className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={scoreFilter}
              onValueChange={setScoreFilter}
              data-testid="select-score-filter"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نقاط الأمان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع النقاط</SelectItem>
                <SelectItem value="80-100">80-100 (آمن جداً)</SelectItem>
                <SelectItem value="60-79">60-79 (مقبول)</SelectItem>
                <SelectItem value="40-59">40-59 (مشكوك فيه)</SelectItem>
                <SelectItem value="0-39">0-39 (خطر)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full md:w-auto grid-cols-5 gap-2" dir="rtl">
            <TabsTrigger value="all" data-testid="tab-all">
              الكل ({stats?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="safe" data-testid="tab-safe">
              آمن ({stats?.safe || 0})
            </TabsTrigger>
            <TabsTrigger value="flagged" data-testid="tab-flagged">
              مشكوك ({stats?.flagged || 0})
            </TabsTrigger>
            <TabsTrigger value="spam" data-testid="tab-spam">
              سبام ({stats?.spam || 0})
            </TabsTrigger>
            <TabsTrigger value="harmful" data-testid="tab-harmful">
              ضار ({stats?.harmful || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {resultsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : !results || results.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد نتائج تحليل</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    اضغط على "تحليل الكل" لبدء تحليل التعليقات
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const classification = classificationColors[result.aiClassification] || classificationColors.safe;
                  const ClassIcon = classification.icon;

                  return (
                    <Card key={result.commentId} data-testid={`moderation-result-${result.commentId}`} dir="rtl">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${classification.bg}`}>
                            <ClassIcon className={`h-6 w-6 ${classification.text}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className={`${classification.bg} ${classification.text} border-0`}
                              >
                                {classificationLabels[result.aiClassification]}
                              </Badge>
                              <span className={`text-sm font-medium ${getScoreColor(result.moderationScore)}`}>
                                {result.moderationScore}%
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {result.comment.status === "pending" ? "معلق" : 
                                 result.comment.status === "approved" ? "معتمد" : "مرفوض"}
                              </Badge>
                            </div>

                            <p className="text-sm mb-3 line-clamp-2">{result.comment.content}</p>

                            {result.detectedIssues.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {result.detectedIssues.map((issue) => (
                                  <Badge
                                    key={issue}
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {issueLabels[issue] || issue}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center flex-wrap gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getUserName(result.comment.user)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(result.aiModerationAnalyzedAt), {
                                  addSuffix: true,
                                  locale: arSA,
                                })}
                              </div>
                              {result.comment.articleTitle && (
                                <a
                                  href={`/article/${result.comment.articleSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                  data-testid={`link-article-${result.commentId}`}
                                >
                                  <FileText className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{result.comment.articleTitle}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(result)}
                              className="gap-1"
                              data-testid={`button-view-details-${result.commentId}`}
                            >
                              <Eye className="h-4 w-4" />
                              تفاصيل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(result)}
                              className="gap-1"
                              data-testid={`button-edit-${result.commentId}`}
                            >
                              <Pencil className="h-4 w-4" />
                              تعديل
                            </Button>
                            {result.comment.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveMutation.mutate(result.commentId)}
                                  disabled={approveMutation.isPending}
                                  className="gap-1"
                                  data-testid={`button-approve-${result.commentId}`}
                                >
                                  <Check className="h-4 w-4" />
                                  اعتماد
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectMutation.mutate(result.commentId)}
                                  disabled={rejectMutation.isPending}
                                  className="gap-1"
                                  data-testid={`button-reject-${result.commentId}`}
                                >
                                  <X className="h-4 w-4" />
                                  رفض
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(result)}
                              className="gap-1 text-destructive hover:text-destructive"
                              data-testid={`button-delete-${result.commentId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                تفاصيل تحليل الذكاء الاصطناعي
              </DialogTitle>
              <DialogDescription>
                تحليل شامل للتعليق بواسطة GPT-4o-mini
              </DialogDescription>
            </DialogHeader>

            {selectedComment && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        محتوى التعليق
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedComment.comment.content}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        نتائج التحليل
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">التصنيف:</span>
                        <Badge
                          className={`${classificationColors[selectedComment.aiClassification]?.bg} ${classificationColors[selectedComment.aiClassification]?.text} border-0`}
                        >
                          {classificationLabels[selectedComment.aiClassification]}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">نقاط الأمان:</span>
                          <span className={`font-bold ${getScoreColor(selectedComment.moderationScore)}`}>
                            {selectedComment.moderationScore}%
                          </span>
                        </div>
                        <Progress
                          value={selectedComment.moderationScore}
                          className="h-2"
                        />
                      </div>

                      {selectedComment.detectedIssues.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">المشاكل المكتشفة:</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedComment.detectedIssues.map((issue) => (
                              <Badge key={issue} variant="destructive">
                                <AlertTriangle className="h-3 w-3 ml-1" />
                                {issueLabels[issue] || issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">تم التحليل:</span>
                        <span>
                          {format(new Date(selectedComment.aiModerationAnalyzedAt), "PPpp", { locale: arSA })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                إغلاق
              </Button>
              {selectedComment && selectedComment.comment.status === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      approveMutation.mutate(selectedComment.commentId);
                      setDetailsOpen(false);
                    }}
                    disabled={approveMutation.isPending}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    اعتماد
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      rejectMutation.mutate(selectedComment.commentId);
                      setDetailsOpen(false);
                    }}
                    disabled={rejectMutation.isPending}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    رفض
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Comment Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                تعديل التعليق
              </DialogTitle>
              <DialogDescription>
                قم بتعديل محتوى التعليق. سيتم حفظ التعديل في سجل التغييرات.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-content">محتوى التعليق</Label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                  dir="rtl"
                  data-testid="textarea-edit-content"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reason">سبب التعديل (اختياري)</Label>
                <Input
                  id="edit-reason"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="مثال: تصحيح إملائي، إزالة محتوى غير مناسب..."
                  dir="rtl"
                  data-testid="input-edit-reason"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={editMutation.isPending || !editContent.trim()}
                className="gap-1"
                data-testid="button-confirm-edit"
              >
                {editMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                تأكيد حذف التعليق
              </AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.
                سيتم حفظ سجل الحذف للمراجعة.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deletingComment && (
              <div className="my-4 p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground mb-2">التعليق المراد حذفه:</p>
                <p className="line-clamp-3">{deletingComment.comment.content}</p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <Label htmlFor="delete-reason">سبب الحذف (اختياري)</Label>
              <Input
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="مثال: محتوى مخالف، سبام..."
                dir="rtl"
                data-testid="input-delete-reason"
              />
            </div>

            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1"
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    تأكيد الحذف
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
