import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isPast, isFuture } from "date-fns";
import { ar } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { IFoxSidebar } from "@/components/admin/ifox/IFoxSidebar";
import { IFoxCalendar } from "@/components/admin/ifox/IFoxCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  List,
  Grid,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Share2,
  Bell,
  Eye,
  FileText,
  TrendingUp,
  Sparkles,
  Zap,
  Timer,
  CalendarDays,
  History,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Send
} from "lucide-react";

interface ScheduledArticle {
  id: string;
  articleId: string;
  title: string;
  category: string;
  author: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "failed" | "cancelled";
  publishOptions: {
    publishToSite: boolean;
    shareToSocial: string[];
    sendNotifications: boolean;
  };
  recurrence?: {
    type: "daily" | "weekly" | "monthly";
    endDate?: string;
  };
  aiScore?: number;
}

interface DraftArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  createdAt: string;
  wordCount: number;
  aiScore?: number;
}

interface PublishingSlot {
  time: string;
  maxArticles: number;
  currentArticles: number;
  isOptimal: boolean;
}

const socialPlatforms = [
  { value: "twitter", label: "Twitter", icon: Twitter, color: "text-blue-400" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
];

export default function IFoxSchedule() {
  useRoleProtection('admin');
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<DraftArticle | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledArticle | null>(null);
  
  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    articleId: "",
    scheduledAt: "",
    publishToSite: true,
    shareToSocial: [] as string[],
    sendNotifications: false,
    recurrenceType: "none" as "none" | "daily" | "weekly" | "monthly",
    recurrenceEndDate: "",
  });

  // Fetch scheduled articles
  const { data: scheduledArticles = [], isLoading, error: scheduleError } = useQuery<ScheduledArticle[]>({
    queryKey: ["/api/admin/ifox/schedule"]
  });

  // Fetch draft articles
  const { data: draftArticles = [], error: draftsError } = useQuery<DraftArticle[]>({
    queryKey: ["/api/admin/ifox/articles/drafts"]
  });

  // Fetch publishing slots
  const { data: publishingSlots = [], error: slotsError } = useQuery<PublishingSlot[]>({
    queryKey: ["/api/admin/ifox/schedule/slots", selectedDate]
  });

  // Create/Update schedule mutation
  const scheduleArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/admin/ifox/schedule", {
        method: editingSchedule ? "PUT" : "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/schedule"] });
      toast({
        title: "تمت الجدولة بنجاح",
        description: editingSchedule ? "تم تحديث الجدولة بنجاح" : "تمت جدولة المقال بنجاح",
      });
      setIsScheduleDialogOpen(false);
      resetScheduleForm();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشلت عملية الجدولة",
        variant: "destructive",
      });
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      return apiRequest(`/api/admin/ifox/schedule/${scheduleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/schedule"] });
      toast({
        title: "تم الإلغاء بنجاح",
        description: "تم إلغاء الجدولة بنجاح",
      });
    }
  });

  const resetScheduleForm = () => {
    setScheduleForm({
      articleId: "",
      scheduledAt: "",
      publishToSite: true,
      shareToSocial: [],
      sendNotifications: false,
      recurrenceType: "none",
      recurrenceEndDate: "",
    });
    setSelectedArticle(null);
    setEditingSchedule(null);
  };

  const openScheduleDialog = (article?: DraftArticle, schedule?: ScheduledArticle) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        articleId: schedule.articleId,
        scheduledAt: format(new Date(schedule.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
        publishToSite: schedule.publishOptions.publishToSite,
        shareToSocial: schedule.publishOptions.shareToSocial,
        sendNotifications: schedule.publishOptions.sendNotifications,
        recurrenceType: schedule.recurrence?.type || "none",
        recurrenceEndDate: schedule.recurrence?.endDate ? format(new Date(schedule.recurrence.endDate), "yyyy-MM-dd") : "",
      });
    } else if (article) {
      setSelectedArticle(article);
      setScheduleForm({
        ...scheduleForm,
        articleId: article.id,
      });
    }
    setIsScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = () => {
    const data = {
      ...scheduleForm,
      articleId: selectedArticle?.id || scheduleForm.articleId,
      recurrence: scheduleForm.recurrenceType !== "none" ? {
        type: scheduleForm.recurrenceType,
        endDate: scheduleForm.recurrenceEndDate || undefined,
      } : undefined,
    };
    scheduleArticleMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "published": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "failed": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "cancelled": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const upcomingArticles = scheduledArticles
    .filter(a => a.status === "scheduled" && isFuture(new Date(a.scheduledAt)))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const publishedArticles = scheduledArticles
    .filter(a => a.status === "published")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 10);

  const hasConflict = (date: Date) => {
    const hour = format(date, "HH:00");
    const slot = publishingSlots.find(s => s.time === hour);
    return slot ? slot.currentArticles >= slot.maxArticles : false;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-purple-950/20">
      {/* Sidebar */}
      <IFoxSidebar className="hidden lg:block" />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      جدولة النشر
                    </h1>
                    <p className="text-white/60">إدارة وجدولة نشر المقالات</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white/5 rounded-lg p-1">
                    <Button
                      variant={viewMode === "calendar" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("calendar")}
                      className="gap-2"
                    >
                      <Grid className="w-4 h-4" />
                      التقويم
                    </Button>
                    <Button
                      variant={viewMode === "timeline" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("timeline")}
                      className="gap-2"
                    >
                      <List className="w-4 h-4" />
                      الخط الزمني
                    </Button>
                  </div>
                  <Button
                    onClick={() => setIsScheduleDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    جدولة جديدة
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">مجدول اليوم</p>
                        <p className="text-2xl font-bold text-white">
                          {scheduledArticles.filter(a => 
                            isToday(new Date(a.scheduledAt)) && a.status === "scheduled"
                          ).length}
                        </p>
                      </div>
                      <CalendarDays className="w-8 h-8 text-blue-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">هذا الأسبوع</p>
                        <p className="text-2xl font-bold text-white">
                          {scheduledArticles.filter(a => {
                            const date = new Date(a.scheduledAt);
                            const now = new Date();
                            return date >= startOfWeek(now) && date <= endOfWeek(now) && a.status === "scheduled";
                          }).length}
                        </p>
                      </div>
                      <Timer className="w-8 h-8 text-purple-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">تم النشر</p>
                        <p className="text-2xl font-bold text-white">
                          {scheduledArticles.filter(a => a.status === "published").length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">مسودات متاحة</p>
                        <p className="text-2xl font-bold text-white">{draftArticles.length}</p>
                      </div>
                      <FileText className="w-8 h-8 text-amber-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Calendar/Timeline View */}
              <div className="lg:col-span-2">
                {viewMode === "calendar" ? (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        التقويم
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <IFoxCalendar
                        events={scheduledArticles.map(article => ({
                          id: article.id,
                          title: article.title,
                          start: new Date(article.scheduledAt),
                          end: new Date(new Date(article.scheduledAt).getTime() + 30 * 60 * 1000),
                          category: article.category,
                          status: article.status,
                        }))}
                        onEventClick={(event) => {
                          const article = scheduledArticles.find(a => a.id === event.id);
                          if (article) openScheduleDialog(undefined, article);
                        }}
                        onDateClick={(date) => {
                          setSelectedDate(date);
                          setScheduleForm({
                            ...scheduleForm,
                            scheduledAt: format(date, "yyyy-MM-dd'T'HH:mm"),
                          });
                          setIsScheduleDialogOpen(true);
                        }}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <List className="w-5 h-5" />
                        الخط الزمني
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px] pl-4">
                        <div className="space-y-4">
                          {upcomingArticles.map((article, index) => (
                            <motion.div
                              key={article.id}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex gap-4"
                            >
                              <div className="relative">
                                <div className="w-3 h-3 rounded-full bg-blue-500 mt-2" />
                                {index < upcomingArticles.length - 1 && (
                                  <div className="absolute top-5 right-1.5 w-px h-full bg-white/20" />
                                )}
                              </div>
                              <div className="flex-1 pb-8">
                                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-white font-medium">{article.title}</h3>
                                      <p className="text-white/60 text-sm mt-1">{article.category}</p>
                                    </div>
                                    <Badge className={getStatusColor(article.status)}>
                                      {article.status === "scheduled" ? "مجدول" : article.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-white/60">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {format(new Date(article.scheduledAt), "d MMM", { locale: ar })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {format(new Date(article.scheduledAt), "h:mm a", { locale: ar })}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-3">
                                    {article.publishOptions.publishToSite && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Eye className="w-3 h-3 ml-1" />
                                        الموقع
                                      </Badge>
                                    )}
                                    {article.publishOptions.shareToSocial.map(platform => {
                                      const platformInfo = socialPlatforms.find(p => p.value === platform);
                                      const Icon = platformInfo?.icon;
                                      return Icon ? (
                                        <Badge key={platform} variant="secondary" className="text-xs">
                                          <Icon className={`w-3 h-3 ml-1 ${platformInfo.color}`} />
                                          {platformInfo.label}
                                        </Badge>
                                      ) : null;
                                    })}
                                    {article.publishOptions.sendNotifications && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Bell className="w-3 h-3 ml-1" />
                                        إشعارات
                                      </Badge>
                                    )}
                                    {article.recurrence && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Repeat className="w-3 h-3 ml-1" />
                                        {article.recurrence.type === "daily" ? "يومي" :
                                         article.recurrence.type === "weekly" ? "أسبوعي" : "شهري"}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openScheduleDialog(undefined, article)}
                                    >
                                      <Edit className="w-4 h-4 ml-2" />
                                      تعديل
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("هل أنت متأكد من إلغاء هذه الجدولة؟")) {
                                          deleteScheduleMutation.mutate(article.id);
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4 ml-2" />
                                      إلغاء
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publishing Slots */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      أوقات النشر المثلى
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {publishingSlots.map((slot) => (
                      <div
                        key={slot.time}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          slot.isOptimal
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-white/5 border-white/10"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-white/60" />
                            <span className="text-white font-medium">{slot.time}</span>
                            {slot.isOptimal && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                <Zap className="w-3 h-3 ml-1" />
                                مثالي
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className={cn(
                              "font-medium",
                              slot.currentArticles >= slot.maxArticles
                                ? "text-red-400"
                                : "text-white"
                            )}>
                              {slot.currentArticles}
                            </span>
                            <span className="text-white/60"> / {slot.maxArticles}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Draft Articles */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      مسودات جاهزة للنشر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {draftArticles.map((article) => (
                          <div
                            key={article.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                          >
                            <h4 className="text-white text-sm font-medium mb-1 line-clamp-1">
                              {article.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60 text-xs">{article.category}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openScheduleDialog(article)}
                                className="h-7 text-xs"
                              >
                                <Calendar className="w-3 h-3 ml-1" />
                                جدولة
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Publishing History */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <History className="w-5 h-5" />
                      سجل النشر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {publishedArticles.map((article) => (
                          <div
                            key={article.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10"
                          >
                            <h4 className="text-white text-sm font-medium mb-1 line-clamp-1">
                              {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <span>{format(new Date(article.scheduledAt), "d MMM, h:mm a", { locale: ar })}</span>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                تم النشر
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </ScrollArea>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={(open) => {
        if (!open) resetScheduleForm();
        setIsScheduleDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-950 via-blue-950/50 to-purple-950/30 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingSchedule ? "تعديل الجدولة" : "جدولة مقال جديد"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              حدد وقت النشر وخيارات المشاركة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4" dir="rtl">
            {/* Article Selection */}
            {!editingSchedule && (
              <div>
                <Label className="text-white/60">اختر المقال</Label>
                <Select
                  value={scheduleForm.articleId}
                  onValueChange={(value) => {
                    setScheduleForm({ ...scheduleForm, articleId: value });
                    setSelectedArticle(draftArticles.find(a => a.id === value) || null);
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="اختر مقال من المسودات" />
                  </SelectTrigger>
                  <SelectContent>
                    {draftArticles.map((article) => (
                      <SelectItem key={article.id} value={article.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{article.title}</span>
                          {article.aiScore && (
                            <Badge variant="secondary" className="mr-2 text-xs">
                              AI: {article.aiScore}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Schedule Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60">التاريخ والوقت</Label>
                <Input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                {scheduleForm.scheduledAt && hasConflict(new Date(scheduleForm.scheduledAt)) && (
                  <div className="flex items-center gap-1 mt-2 text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>تحذير: هذا الوقت مزدحم بالمقالات</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-white/60">التكرار</Label>
                <Select
                  value={scheduleForm.recurrenceType}
                  onValueChange={(value: any) => setScheduleForm({ ...scheduleForm, recurrenceType: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تكرار</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {scheduleForm.recurrenceType !== "none" && (
              <div>
                <Label className="text-white/60">تاريخ انتهاء التكرار (اختياري)</Label>
                <Input
                  type="date"
                  value={scheduleForm.recurrenceEndDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, recurrenceEndDate: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            {/* Publishing Options */}
            <div className="space-y-3">
              <Label className="text-white/60">خيارات النشر</Label>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="publishToSite"
                  checked={scheduleForm.publishToSite}
                  onCheckedChange={(checked) => 
                    setScheduleForm({ ...scheduleForm, publishToSite: checked as boolean })
                  }
                />
                <label
                  htmlFor="publishToSite"
                  className="text-white text-sm cursor-pointer flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  نشر على موقع آي فوكس
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendNotifications"
                  checked={scheduleForm.sendNotifications}
                  onCheckedChange={(checked) => 
                    setScheduleForm({ ...scheduleForm, sendNotifications: checked as boolean })
                  }
                />
                <label
                  htmlFor="sendNotifications"
                  className="text-white text-sm cursor-pointer flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  إرسال إشعارات للمتابعين
                </label>
              </div>
            </div>

            {/* Social Media Sharing */}
            <div className="space-y-3">
              <Label className="text-white/60">المشاركة على وسائل التواصل</Label>
              <div className="grid grid-cols-3 gap-2">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = scheduleForm.shareToSocial.includes(platform.value);
                  
                  return (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => {
                        setScheduleForm({
                          ...scheduleForm,
                          shareToSocial: isSelected
                            ? scheduleForm.shareToSocial.filter(p => p !== platform.value)
                            : [...scheduleForm.shareToSocial, platform.value]
                        });
                      }}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        isSelected
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <Icon className={`w-5 h-5 mx-auto ${platform.color}`} />
                      <span className="text-white/80 text-xs mt-1 block">{platform.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                resetScheduleForm();
                setIsScheduleDialogOpen(false);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              disabled={!scheduleForm.articleId || !scheduleForm.scheduledAt}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {editingSchedule ? "تحديث الجدولة" : "جدولة المقال"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}