import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IFoxSidebar } from "@/components/admin/ifox/IFoxSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { RichTextEditor } from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Save,
  Send,
  Clock,
  Calendar as CalendarIcon,
  ArrowLeft,
  Eye,
  Sparkles,
  Brain,
  Lightbulb,
  TrendingUp,
  ImagePlus,
  Tag,
  Globe,
  AlertCircle,
  RefreshCw,
  Laptop,
  BookOpen,
  Gamepad2,
  Heart,
  DollarSign,
  ChevronRight,
  Wand2,
  BarChart3,
  X
} from "lucide-react";

// iFox Categories
const categories = [
  { id: "technology", label: "التقنية", icon: Laptop, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950" },
  { id: "ai", label: "الذكاء الاصطناعي", icon: Brain, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950" },
  { id: "web", label: "الويب", icon: Globe, color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950" },
  { id: "education", label: "التعليم", icon: BookOpen, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950" },
  { id: "gaming", label: "الألعاب", icon: Gamepad2, color: "text-pink-600", bgColor: "bg-pink-50 dark:bg-pink-950" },
  { id: "health", label: "الصحة", icon: Heart, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950" },
  { id: "business", label: "الأعمال", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950" }
];

const articleSchema = z.object({
  title: z.string().min(10, "العنوان يجب أن يكون 10 أحرف على الأقل"),
  titleEn: z.string().optional(),
  slug: z.string().optional(),
  excerpt: z.string().min(50, "الوصف يجب أن يكون 50 حرف على الأقل"),
  content: z.string().min(100, "المحتوى يجب أن يكون 100 حرف على الأقل"),
  category: z.string().min(1, "يرجى اختيار التصنيف"),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  publishDate: z.date().optional(),
  status: z.enum(["draft", "published", "scheduled"]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function IFoxArticleEditor() {
  useRoleProtection('admin');
  const { toast } = useToast();
  const params = useParams();
  const [, setLocation] = useLocation();
  const articleId = params.id;
  const isEditMode = !!articleId;

  const [previewMode, setPreviewMode] = useState(false);
  const [aiScore, setAiScore] = useState(0);
  const [sentimentScore, setSentimentScore] = useState<{ positive: number; negative: number; neutral: number } | null>(null);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [exitDialog, setExitDialog] = useState(false);

  // Fetch article data if in edit mode
  const { data: articleData, isLoading } = useQuery({
    queryKey: [`/api/admin/ifox/articles/${articleId}`],
    enabled: isEditMode,
  });

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      titleEn: "",
      excerpt: "",
      content: "",
      category: "",
      tags: [],
      featuredImage: "",
      status: "draft",
      publishDate: undefined,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
    },
  });

  // Update form when article data is loaded
  useEffect(() => {
    if (articleData) {
      form.reset({
        title: articleData.title || "",
        titleEn: articleData.titleEn || "",
        slug: articleData.slug || "",
        excerpt: articleData.excerpt || "",
        content: articleData.content || "",
        category: articleData.category || "",
        tags: articleData.tags || [],
        featuredImage: articleData.featuredImage || "",
        status: articleData.status || "draft",
        publishDate: articleData.publishDate ? new Date(articleData.publishDate) : undefined,
        seoTitle: articleData.seoTitle || "",
        seoDescription: articleData.seoDescription || "",
        seoKeywords: articleData.seoKeywords || [],
      });
      setAiScore(articleData.aiScore || 0);
      setSentimentScore(articleData.sentimentScore || null);
    }
  }, [articleData, form]);

  // Save/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const url = isEditMode 
        ? `/api/admin/ifox/articles/${articleId}`
        : "/api/admin/ifox/articles";
      
      return apiRequest(url, {
        method: isEditMode ? "PATCH" : "POST",
        body: JSON.stringify({ ...data, aiScore, sentimentScore }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "تم الحفظ",
        description: isEditMode ? "تم تحديث المقال بنجاح" : "تم إنشاء المقال بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/articles"] });
      if (!isEditMode && data.id) {
        setLocation(`/dashboard/admin/ifox/articles/edit/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل حفظ المقال",
        variant: "destructive",
      });
    },
  });

  // AI Title Generation
  const generateAITitle = async () => {
    setGeneratingTitle(true);
    try {
      const response = await apiRequest("/api/admin/ifox/ai/generate-title", {
        method: "POST",
        body: JSON.stringify({
          content: form.getValues("content"),
          category: form.getValues("category"),
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.title) {
        form.setValue("title", response.title);
        if (response.titleEn) {
          form.setValue("titleEn", response.titleEn);
        }
        toast({
          title: "تم التوليد",
          description: "تم توليد العنوان بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل توليد العنوان",
        variant: "destructive",
      });
    } finally {
      setGeneratingTitle(false);
    }
  };

  // AI Content Suggestions
  const generateSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      const response = await apiRequest("/api/admin/ifox/ai/generate-suggestions", {
        method: "POST",
        body: JSON.stringify({
          title: form.getValues("title"),
          content: form.getValues("content"),
          category: form.getValues("category"),
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.suggestions) {
        // Show suggestions in a modal or sidebar
        toast({
          title: "اقتراحات المحتوى",
          description: response.suggestions.join("\n"),
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل توليد الاقتراحات",
        variant: "destructive",
      });
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  // Analyze Content Quality
  const analyzeContent = async () => {
    setAnalyzingContent(true);
    try {
      const response = await apiRequest("/api/admin/ifox/ai/analyze-content", {
        method: "POST",
        body: JSON.stringify({
          title: form.getValues("title"),
          content: form.getValues("content"),
          category: form.getValues("category"),
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.score) {
        setAiScore(response.score);
        setSentimentScore(response.sentiment || null);
        toast({
          title: "تم التحليل",
          description: `جودة المحتوى: ${response.score}%`,
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحليل المحتوى",
        variant: "destructive",
      });
    } finally {
      setAnalyzingContent(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  const onSubmit = (data: ArticleFormData) => {
    saveMutation.mutate(data);
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAIScoreLabel = (score: number) => {
    if (score >= 80) return "ممتاز";
    if (score >= 60) return "جيد";
    if (score >= 40) return "متوسط";
    return "يحتاج تحسين";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
        <IFoxSidebar className="hidden lg:block" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      <IFoxSidebar className="hidden lg:block" />
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setExitDialog(true)}
              className="gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditMode ? "تحرير المقال" : "مقال جديد"}
              </h1>
              <p className="text-muted-foreground">آي فوكس - المحتوى التقني</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="gap-2"
              data-testid="button-preview"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? "إغلاق المعاينة" : "معاينة"}
            </Button>
          </div>
        </div>

        {/* AI Score Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تقييم جودة المحتوى</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={aiScore} className="h-2 w-32" />
                    <span className={cn("text-2xl font-bold", getAIScoreColor(aiScore))}>
                      {aiScore}%
                    </span>
                    <Badge variant="secondary">{getAIScoreLabel(aiScore)}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={analyzeContent}
                  disabled={analyzingContent || !form.getValues("content")}
                  className="gap-2"
                  data-testid="button-analyze"
                >
                  {analyzingContent ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  تحليل المحتوى
                </Button>
              </div>
            </div>

            {/* Sentiment Analysis */}
            {sentimentScore && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">تحليل المشاعر</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">إيجابي</p>
                    <p className="text-lg font-bold text-green-600">{sentimentScore.positive}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">محايد</p>
                    <p className="text-lg font-bold text-gray-600">{sentimentScore.neutral}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">سلبي</p>
                    <p className="text-lg font-bold text-red-600">{sentimentScore.negative}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان (عربي) *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} dir="rtl" placeholder="أدخل عنوان المقال" />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={generateAITitle}
                              disabled={generatingTitle || !form.getValues("content")}
                              className="gap-2"
                              data-testid="button-generate-title"
                            >
                              {generatingTitle ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4" />
                              )}
                              توليد بـ AI
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="titleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان (إنجليزي)</FormLabel>
                          <FormControl>
                            <Input {...field} dir="ltr" placeholder="Enter article title" />
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
                          <FormLabel>الوصف المختصر *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              dir="rtl"
                              rows={3}
                              placeholder="أدخل وصف مختصر للمقال"
                            />
                          </FormControl>
                          <FormDescription>
                            سيظهر هذا الوصف في قوائم المقالات ونتائج البحث
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Content Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>محتوى المقال</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateSuggestions}
                        disabled={generatingSuggestions || !form.getValues("title")}
                        className="gap-2"
                        data-testid="button-suggestions"
                      >
                        {generatingSuggestions ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lightbulb className="h-4 w-4" />
                        )}
                        اقتراحات AI
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RichTextEditor
                              content={field.value}
                              onChange={field.onChange}
                              placeholder="ابدأ بكتابة محتوى المقال..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publishing Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>خيارات النشر</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحالة</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">مسودة</SelectItem>
                              <SelectItem value="published">منشور</SelectItem>
                              <SelectItem value="scheduled">مجدول</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("status") === "scheduled" && (
                      <FormField
                        control={form.control}
                        name="publishDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ النشر</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-right",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="button-publish-date"
                                  >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ar })
                                    ) : (
                                      <span>اختر التاريخ</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="flex-1 gap-2"
                        data-testid="button-save"
                      >
                        {saveMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : form.watch("status") === "published" ? (
                          <Send className="h-4 w-4" />
                        ) : form.watch("status") === "scheduled" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {form.watch("status") === "published" ? "نشر" : 
                         form.watch("status") === "scheduled" ? "جدولة" : "حفظ"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>التصنيف</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-2">
                              {categories.map((category) => {
                                const Icon = category.icon;
                                const isSelected = field.value === category.id;
                                return (
                                  <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => field.onChange(category.id)}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                                      isSelected
                                        ? `${category.bgColor} ${category.color} ring-2 ring-primary`
                                        : "hover:bg-muted"
                                    )}
                                    data-testid={`button-category-${category.id}`}
                                  >
                                    <div className={cn("p-2 rounded-lg", category.bgColor)}>
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium">{category.label}</span>
                                    {isSelected && (
                                      <ChevronRight className="h-4 w-4 ml-auto" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle>الكلمات المفتاحية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="أضف كلمة مفتاحية"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        data-testid="input-tag"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                        data-testid="button-add-tag"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.watch("tags")?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Featured Image */}
                <Card>
                  <CardHeader>
                    <CardTitle>الصورة البارزة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="featuredImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-4">
                              {field.value ? (
                                <div className="relative">
                                  <img
                                    src={field.value}
                                    alt="Featured"
                                    className="w-full h-40 object-cover rounded-lg"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 left-2"
                                    onClick={() => field.onChange("")}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                  <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    اختر صورة بارزة
                                  </p>
                                </div>
                              )}
                              <Input
                                type="url"
                                placeholder="رابط الصورة"
                                value={field.value}
                                onChange={field.onChange}
                                data-testid="input-featured-image"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>

        {/* Exit Confirmation Dialog */}
        <AlertDialog open={exitDialog} onOpenChange={setExitDialog}>
          <AlertDialogContent data-testid="dialog-exit">
            <AlertDialogHeader>
              <AlertDialogTitle>هل تريد المغادرة؟</AlertDialogTitle>
              <AlertDialogDescription>
                قد تفقد التغييرات غير المحفوظة. هل أنت متأكد من المغادرة؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>البقاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setLocation("/dashboard/admin/ifox/articles")}
              >
                المغادرة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}