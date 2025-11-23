import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { IFoxLayout } from "@/components/admin/ifox/IFoxLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import {
  Zap,
  Sparkles,
  Calendar,
  Clock,
  Brain,
  FileText,
  Newspaper,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Wand2
} from "lucide-react";
import mascotImage from "@assets/sabq_ai_mascot_1_1_1763712965053.png";

const contentSchema = z.object({
  topic: z.string().min(10, "الموضوع يجب أن يكون 10 أحرف على الأقل"),
  description: z.string().optional(),
  contentType: z.enum(["news", "article", "analysis", "opinion"]),
  scheduledFor: z.string(),
  priority: z.enum(["low", "medium", "high"]),
});

type ContentRequest = z.infer<typeof contentSchema>;

interface ScheduledTask {
  id: string;
  topicIdea: string | null;
  plannedContentType: string | null;
  scheduledDate: string;
  actualPublishedAt?: string | null;
  status: string;
  createdAt: string;
}

export default function IFoxContentGenerator() {
  useRoleProtection('admin');
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<ContentRequest>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      topic: "",
      description: "",
      contentType: "news",
      scheduledFor: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour from now
      priority: "medium",
    },
  });

  // Fetch scheduled tasks
  const { data: scheduledTasks = [], isLoading } = useQuery<ScheduledTask[]>({
    queryKey: ["/api/ifox/ai-management/calendar"],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: ContentRequest) => {
      return await apiRequest("/api/ifox/ai-management/calendar", {
        method: "POST",
        body: JSON.stringify({
          scheduledDate: new Date(data.scheduledFor),
          slot: new Date(data.scheduledFor).getHours() < 12 ? "morning" : 
                 new Date(data.scheduledFor).getHours() < 17 ? "afternoon" : 
                 new Date(data.scheduledFor).getHours() < 21 ? "evening" : "night",
          topicIdea: data.topic,
          aiSuggestion: data.description || "",
          plannedContentType: data.contentType,
          assignmentType: "ai",
          status: "planned",
          keywords: [],
          suggestedCategories: [],
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ifox/ai-management/calendar"] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      form.reset();
      toast({
        title: "✨ تم جدولة المهمة بنجاح",
        description: "سيتم معالجة المحتوى تلقائياً في الوقت المحدد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الجدولة",
        description: error.message || "حدث خطأ أثناء جدولة المهمة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContentRequest) => {
    createTaskMutation.mutate(data);
  };

  // Helper function to format date in Riyadh timezone (UTC+3)
  // Uses browser's timezone-aware toLocaleString instead of manual offset math
  const formatRiyadhTime = (utcDate: string) => {
    const date = new Date(utcDate);
    return date.toLocaleString('ar-SA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' (الرياض)';
  };

  const contentTypeIcons = {
    news: Newspaper,
    article: FileText,
    analysis: BarChart3,
    opinion: Brain,
  };

  const priorityColors = {
    low: "from-blue-500 to-cyan-500",
    medium: "from-amber-500 to-orange-500",
    high: "from-red-500 to-pink-500",
  };

  // Filter tasks by status
  const plannedTasks = scheduledTasks.filter(task => task.status === 'planned' || task.status === 'in_progress');
  const completedTasks = scheduledTasks.filter(task => task.status === 'completed');

  return (
    <IFoxLayout>
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-4">
                {/* Animated AI Mascot */}
                <motion.div
                  className="relative"
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl opacity-60"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background: "radial-gradient(circle, rgba(236, 72, 153, 0.6), rgba(147, 51, 234, 0.6))",
                    }}
                  />
                  <img 
                    src={mascotImage} 
                    alt="iFox AI" 
                    className="w-20 h-20 relative z-10 drop-shadow-2xl"
                  />
                </motion.div>

                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                    محرك المحتوى الذكي
                  </h1>
                  <p className="text-gray-100 text-lg">
                    أنشئ محتوى احترافي بالذكاء الاصطناعي - جدوله وانتظر النتيجة
                  </p>
                </div>

                <motion.div
                  className="mr-auto flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-fuchsia-400"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      boxShadow: [
                        "0 0 5px rgba(236, 72, 153, 0.5)",
                        "0 0 15px rgba(236, 72, 153, 1)",
                        "0 0 5px rgba(236, 72, 153, 0.5)",
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-fuchsia-400">تجريبي</span>
                  <Sparkles className="w-3 h-3 text-fuchsia-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* Success Animation */}
            {showSuccess && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
              >
                <Card className="bg-gradient-to-br from-green-500/90 to-emerald-600/90 border-green-400/50 backdrop-blur-lg shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">تم بنجاح! ✨</h3>
                    <p className="text-white/90">المهمة مجدولة وجاهزة للمعالجة</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Form */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white font-bold">
                      <Wand2 className="w-5 h-5 text-fuchsia-400" />
                      طلب محتوى جديد
                    </CardTitle>
                    <CardDescription className="text-gray-100">
                      اكتب ما تريد والذكاء الاصطناعي سيقوم بالباقي
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Topic */}
                        <FormField
                          control={form.control}
                          name="topic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">موضوع المحتوى *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="مثال: أحدث تطورات الذكاء الاصطناعي في 2024"
                                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-gray-400"
                                  data-testid="input-topic"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Description */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">تفاصيل إضافية (اختياري)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="أضف أي تفاصيل أو توجيهات للذكاء الاصطناعي..."
                                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                                  data-testid="input-description"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-gray-300 text-xs">
                                كلما كانت التفاصيل أكثر، كان المحتوى أفضل
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        {/* Content Type */}
                        <FormField
                          control={form.control}
                          name="contentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">نوع المحتوى *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white" data-testid="select-content-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="news">
                                    <div className="flex items-center gap-2">
                                      <Newspaper className="w-4 h-4" />
                                      <span>خبر</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="article">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      <span>مقال</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="analysis">
                                    <div className="flex items-center gap-2">
                                      <BarChart3 className="w-4 h-4" />
                                      <span>تحليل</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="opinion">
                                    <div className="flex items-center gap-2">
                                      <Brain className="w-4 h-4" />
                                      <span>رأي</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        {/* Scheduling */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="scheduledFor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">موعد التنفيذ *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    className="bg-slate-800/50 border-white/20 text-white"
                                    data-testid="input-scheduled-for"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">الأولوية *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-slate-800/50 border-white/20 text-white" data-testid="select-priority">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">منخفضة</SelectItem>
                                    <SelectItem value="medium">متوسطة</SelectItem>
                                    <SelectItem value="high">عالية</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white font-bold"
                          disabled={createTaskMutation.isPending}
                          data-testid="button-submit"
                        >
                          {createTaskMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                              جاري الجدولة...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 ml-2" />
                              جدولة المهمة
                              <ArrowRight className="w-4 h-4 mr-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Scheduled Tasks */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/70 to-slate-900/50 border-white/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white font-bold">
                      <Calendar className="w-5 h-5 text-fuchsia-400" />
                      المهام المجدولة
                    </CardTitle>
                    <CardDescription className="text-gray-100">
                      {plannedTasks.length} مهمة في الانتظار
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {isLoading ? (
                          <div className="text-center py-12 text-gray-300">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            جاري التحميل...
                          </div>
                        ) : plannedTasks.length === 0 ? (
                          <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-300">لا توجد مهام مجدولة حالياً</p>
                            <p className="text-gray-400 text-sm mt-1">ابدأ بإنشاء مهمة جديدة من النموذج</p>
                          </div>
                        ) : (
                          plannedTasks.map((task, index) => {
                            const ContentIcon = contentTypeIcons[task.plannedContentType as keyof typeof contentTypeIcons] || FileText;
                            const statusColors = {
                              planned: "from-blue-500 to-cyan-500",
                              in_progress: "from-amber-500 to-orange-500",
                              completed: "from-green-500 to-emerald-500",
                              cancelled: "from-red-500 to-pink-500",
                            };

                            return (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 rounded-lg bg-slate-800/50 border border-white/20 hover:border-white/30 transition-all"
                                data-testid={`task-${task.id}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className={`p-2 rounded-lg bg-gradient-to-r ${statusColors[task.status as keyof typeof statusColors] || statusColors.planned}`}>
                                      <ContentIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-white font-semibold mb-1 line-clamp-2">
                                        {task.topicIdea || 'محتوى جديد'}
                                      </h4>
                                      <div className="flex items-center gap-3 text-xs text-gray-300">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {formatRiyadhTime(task.scheduledDate)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${statusColors[task.status as keyof typeof statusColors] || statusColors.planned}`}>
                                    {task.status === 'planned' && 'مجدولة'}
                                    {task.status === 'in_progress' && 'قيد المعالجة'}
                                    {task.status === 'completed' && 'مكتملة'}
                                    {task.status === 'cancelled' && 'ملغاة'}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-cyan-400/30 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <Brain className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
                  <h3 className="font-bold text-white mb-1">ذكاء اصطناعي متقدم</h3>
                  <p className="text-xs text-gray-200">محتوى احترافي بجودة عالية</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border-fuchsia-400/30 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-fuchsia-300 mx-auto mb-2" />
                  <h3 className="font-bold text-white mb-1">جدولة تلقائية</h3>
                  <p className="text-xs text-gray-200">حدد الوقت ودع النظام يعمل</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <Sparkles className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                  <h3 className="font-bold text-white mb-1">نتائج فورية</h3>
                  <p className="text-xs text-gray-200">محتوى جاهز للنشر مباشرة</p>
                </CardContent>
              </Card>
            </div>

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white font-bold">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      المهام المكتملة
                    </CardTitle>
                    <CardDescription className="text-gray-100">
                      {completedTasks.length} مهمة تم إنجازها بنجاح
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {completedTasks.map((task, index) => {
                          const ContentIcon = contentTypeIcons[task.plannedContentType as keyof typeof contentTypeIcons] || FileText;
                          
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-4 rounded-lg bg-green-500/5 border border-green-400/20 hover:border-green-400/40 transition-all"
                              data-testid={`completed-task-${task.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                                  <ContentIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold mb-1 line-clamp-2">
                                    {task.topicIdea || 'محتوى جديد'}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-300">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.actualPublishedAt 
                                        ? `تم النشر: ${formatRiyadhTime(task.actualPublishedAt)}`
                                        : `مجدول: ${formatRiyadhTime(task.scheduledDate)}`
                                      }
                                    </span>
                                  </div>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </ScrollArea>
    </IFoxLayout>
  );
}
