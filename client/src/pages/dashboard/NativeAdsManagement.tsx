import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Megaphone, 
  Plus, 
  Search,
  Eye,
  MousePointer,
  TrendingUp,
  BarChart3,
  Edit2, 
  Pause, 
  Play,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Calendar,
  Upload,
  UserCircle,
  Mail,
  Phone,
  Building2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageUploadDialog } from "@/components/ImageUploadDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNativeAdSchema, type NativeAd, type Category } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type NativeAdStatus = "draft" | "pending_approval" | "active" | "paused" | "expired" | "rejected";

const statusColors: Record<NativeAdStatus, string> = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  paused: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  expired: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  pending_approval: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  draft: "bg-muted text-muted-foreground border-border",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const statusLabels: Record<NativeAdStatus, string> = {
  active: "نشط",
  paused: "متوقف مؤقتاً",
  expired: "منتهي",
  pending_approval: "قيد المراجعة",
  draft: "مسودة",
  rejected: "مرفوض",
};

const deviceOptions = [
  { value: "all", label: "جميع الأجهزة" },
  { value: "desktop", label: "سطح المكتب" },
  { value: "mobile", label: "الهاتف" },
  { value: "tablet", label: "الجهاز اللوحي" },
];

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "d MMMM yyyy", { locale: ar });
}

function calculateCTR(impressions: number, clicks: number): string {
  if (impressions === 0) return "0%";
  return ((clicks / impressions) * 100).toFixed(2) + "%";
}

type FormValues = z.infer<typeof insertNativeAdSchema>;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-16 w-24 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-primary/10 p-6 mb-4">
          <Megaphone className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">لا يوجد محتوى مدفوع</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          ابدأ بإنشاء أول إعلان مدفوع للوصول إلى جمهورك المستهدف
        </p>
        <Button onClick={onCreateClick} data-testid="button-create-first-ad">
          <Plus className="h-4 w-4 ml-2" />
          إنشاء إعلان جديد
        </Button>
      </CardContent>
    </Card>
  );
}

export default function NativeAdsManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adToDelete, setAdToDelete] = useState<NativeAd | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<NativeAd | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"imageUrl" | "advertiserLogo" | null>(null);

  useEffect(() => {
    document.title = "إدارة المحتوى المدفوع - لوحة التحكم";
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(insertNativeAdSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      destinationUrl: "",
      callToAction: "اقرأ المزيد",
      advertiserName: "",
      advertiserLogo: "",
      targetCategories: [],
      targetKeywords: [],
      targetDevices: "all",
      startDate: new Date(),
      endDate: null,
      dailyBudget: undefined,
      totalBudget: undefined,
      costPerClick: 100,
      priority: 5,
      status: "draft",
    },
  });

  const { data: ads = [], isLoading } = useQuery<NativeAd[]>({
    queryKey: ["/api/native-ads", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const url = `/api/native-ads${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("فشل في جلب الإعلانات");
      }
      const data = await response.json();
      return data.ads || [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest("/api/native-ads", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/native-ads"] });
      toast({
        title: "تم إنشاء الإعلان",
        description: "تم إنشاء الإعلان بنجاح",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الإعلان",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<FormValues> }) => {
      return await apiRequest(`/api/native-ads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/native-ads"] });
      toast({
        title: "تم تحديث الإعلان",
        description: "تم تحديث الإعلان بنجاح",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الإعلان",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/native-ads/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/native-ads"] });
      toast({
        title: "تم حذف الإعلان",
        description: "تم حذف الإعلان بنجاح",
      });
      setAdToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الإعلان",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: NativeAdStatus }) => {
      await apiRequest(`/api/native-ads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/native-ads"] });
      const action = variables.newStatus === "paused" ? "إيقاف" : "تفعيل";
      toast({
        title: `تم ${action} الإعلان`,
        description: `تم ${action} الإعلان بنجاح`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الإعلان",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (ad?: NativeAd) => {
    if (ad) {
      setEditingAd(ad);
      form.reset({
        title: ad.title,
        description: ad.description || "",
        imageUrl: ad.imageUrl,
        destinationUrl: ad.destinationUrl,
        callToAction: ad.callToAction || "اقرأ المزيد",
        advertiserName: ad.advertiserName,
        advertiserLogo: ad.advertiserLogo || "",
        targetCategories: ad.targetCategories || [],
        targetKeywords: ad.targetKeywords || [],
        targetDevices: ad.targetDevices as "all" | "desktop" | "mobile" | "tablet",
        startDate: new Date(ad.startDate),
        endDate: ad.endDate ? new Date(ad.endDate) : null,
        dailyBudget: ad.dailyBudget || undefined,
        totalBudget: ad.totalBudget || undefined,
        costPerClick: ad.costPerClick || 100,
        priority: ad.priority,
        status: ad.status as NativeAdStatus,
      });
    } else {
      setEditingAd(null);
      form.reset({
        title: "",
        description: "",
        imageUrl: "",
        destinationUrl: "",
        callToAction: "اقرأ المزيد",
        advertiserName: "",
        advertiserLogo: "",
        targetCategories: [],
        targetKeywords: [],
        targetDevices: "all",
        startDate: new Date(),
        endDate: null,
        dailyBudget: undefined,
        totalBudget: undefined,
        costPerClick: 100,
        priority: 5,
        status: "draft",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAd(null);
    form.reset();
  };

  const onSubmit = (values: FormValues) => {
    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleToggleStatus = (ad: NativeAd) => {
    const newStatus = ad.status === "active" ? "paused" : "active";
    toggleStatusMutation.mutate({ id: ad.id, newStatus });
  };

  const filteredAds = ads.filter((ad) =>
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.advertiserName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAds = ads.length;
  const activeAds = ads.filter((a) => a.status === "active").length;
  const totalImpressions = ads.reduce((sum, a) => sum + a.impressions, 0);
  const totalClicks = ads.reduce((sum, a) => sum + a.clicks, 0);
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">إدارة المحتوى المدفوع</h1>
              <p className="text-sm text-muted-foreground">
                إدارة الإعلانات المدفوعة والمحتوى الراعي
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="button-create-ad">
            <Plus className="h-4 w-4 ml-2" />
            إنشاء إعلان جديد
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-ads">
                {formatNumber(totalAds)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-active-ads">
                {formatNumber(activeAds)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-impressions">
                {formatNumber(totalImpressions)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي النقرات</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-clicks">
                {formatNumber(totalClicks)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل النقر (CTR)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-overall-ctr">
                {overallCTR}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>الفلاتر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالعنوان أو اسم المعلن..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending_approval">قيد المراجعة</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="paused">متوقف مؤقتاً</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <TableSkeleton />
        ) : filteredAds.length === 0 ? (
          <EmptyState onCreateClick={() => handleOpenDialog()} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">الصورة</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>المعلن</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-center">المشاهدات</TableHead>
                    <TableHead className="text-center">النقرات</TableHead>
                    <TableHead className="text-center">CTR</TableHead>
                    <TableHead className="text-center">الأولوية</TableHead>
                    <TableHead>التواريخ</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => (
                    <TableRow key={ad.id} data-testid={`row-ad-${ad.id}`}>
                      <TableCell>
                        <div className="w-20 h-14 rounded overflow-hidden bg-muted">
                          {ad.imageUrl ? (
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                              data-testid={`img-ad-${ad.id}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium" data-testid={`text-title-${ad.id}`}>
                          {ad.title}
                        </div>
                        {ad.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {ad.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-advertiser-${ad.id}`}>
                        <div className="flex flex-col gap-1">
                          <span>{ad.advertiserName}</span>
                          {(ad as any).isSelfServe && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs w-fit cursor-help">
                                  <UserCircle className="h-3 w-3 ml-1" />
                                  خدمة ذاتية
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-right" dir="rtl">
                                <div className="space-y-1 text-sm">
                                  {(ad as any).advertiserEmail && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-3 w-3" />
                                      <span>{(ad as any).advertiserEmail}</span>
                                    </div>
                                  )}
                                  {(ad as any).advertiserPhone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3" />
                                      <span dir="ltr">{(ad as any).advertiserPhone}</span>
                                    </div>
                                  )}
                                  {(ad as any).advertiserCompany && (
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-3 w-3" />
                                      <span>{(ad as any).advertiserCompany}</span>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[ad.status as NativeAdStatus]}
                          data-testid={`badge-status-${ad.id}`}
                        >
                          {statusLabels[ad.status as NativeAdStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center" data-testid={`text-impressions-${ad.id}`}>
                        {formatNumber(ad.impressions)}
                      </TableCell>
                      <TableCell className="text-center" data-testid={`text-clicks-${ad.id}`}>
                        {formatNumber(ad.clicks)}
                      </TableCell>
                      <TableCell className="text-center" data-testid={`text-ctr-${ad.id}`}>
                        {calculateCTR(ad.impressions, ad.clicks)}
                      </TableCell>
                      <TableCell className="text-center" data-testid={`text-priority-${ad.id}`}>
                        <Badge variant="secondary">{ad.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(ad.startDate)}</span>
                          </div>
                          {ad.endDate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              إلى: {formatDate(ad.endDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(ad)}
                            data-testid={`button-edit-${ad.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {(ad.status === "active" || ad.status === "paused") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleToggleStatus(ad)}
                              disabled={toggleStatusMutation.isPending}
                              data-testid={`button-toggle-${ad.id}`}
                            >
                              {ad.status === "active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setAdToDelete(ad)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${ad.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? "تعديل الإعلان" : "إنشاء إعلان جديد"}
              </DialogTitle>
              <DialogDescription>
                {editingAd
                  ? "قم بتعديل تفاصيل الإعلان أدناه"
                  : "أدخل تفاصيل الإعلان الجديد"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان الإعلان *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="عنوان الإعلان"
                            {...field}
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advertiserName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المعلن *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="اسم المعلن"
                            {...field}
                            data-testid="input-advertiser-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المحتوى</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="المحتوى الذي سيظهر للقراء"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط الصورة *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="https://example.com/image.jpg"
                              {...field}
                              data-testid="input-image-url"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setUploadTarget("imageUrl")}
                            title="رفع صورة"
                            data-testid="button-upload-image"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destinationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط الوجهة *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/landing-page"
                            {...field}
                            data-testid="input-destination-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="callToAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>زر الإجراء (CTA)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="اقرأ المزيد"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-cta"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advertiserLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شعار المعلن</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="https://example.com/logo.png"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-advertiser-logo"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setUploadTarget("advertiserLogo")}
                            title="رفع شعار"
                            data-testid="button-upload-logo"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التصنيفات المستهدفة</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const current = field.value || [];
                          if (!current.includes(value)) {
                            field.onChange([...current, value]);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-target-categories">
                            <SelectValue placeholder="اختر التصنيفات المستهدفة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((catId) => {
                            const cat = categories.find((c) => c.id === catId);
                            return (
                              <Badge
                                key={catId}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() =>
                                  field.onChange(field.value?.filter((id) => id !== catId))
                                }
                              >
                                {cat?.nameAr || catId} ×
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <FormDescription>
                        اختر التصنيفات التي سيظهر فيها الإعلان
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetDevices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الأجهزة المستهدفة</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-target-devices">
                              <SelectValue placeholder="اختر الأجهزة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deviceOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحالة</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">مسودة</SelectItem>
                            <SelectItem value="pending_approval">قيد المراجعة</SelectItem>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="paused">متوقف مؤقتاً</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ البداية *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الانتهاء</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? new Date(e.target.value) : null)
                            }
                            data-testid="input-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأولوية: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                          data-testid="slider-priority"
                        />
                      </FormControl>
                      <FormDescription>
                        أولوية أعلى = ظهور أكثر (1-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dailyBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الميزانية اليومية (ر.س)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            value={field.value ? field.value / 100 : ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) * 100 : undefined)
                            }
                            data-testid="input-daily-budget"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الميزانية الإجمالية (ر.س)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5000"
                            {...field}
                            value={field.value ? field.value / 100 : ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) * 100 : undefined)
                            }
                            data-testid="input-total-budget"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costPerClick"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تكلفة النقرة (هللة)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : 100)
                            }
                            data-testid="input-cost-per-click"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    )}
                    {editingAd ? "حفظ التعديلات" : "إنشاء الإعلان"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!adToDelete} onOpenChange={() => setAdToDelete(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الإعلان</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف الإعلان "{adToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => adToDelete && deleteMutation.mutate(adToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image Upload Dialog */}
        <ImageUploadDialog
          open={uploadTarget !== null}
          onOpenChange={(open) => {
            if (!open) setUploadTarget(null);
          }}
          onImageUploaded={(url) => {
            if (uploadTarget) {
              form.setValue(uploadTarget, url);
            }
            setUploadTarget(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
