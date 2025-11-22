import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, ArrowLeft, Save, Radio, PlayCircle, Search, X, GripVertical,
  Clock, Calendar, Mic, Settings, ChevronDown, ChevronUp, Pause, Download, Share2,
  FileText, Sparkles, Timer, CalendarClock, Plus, Check, Newspaper, Briefcase,
  TrendingUp, Zap, AlertCircle, MessageSquare, Trophy, Laptop, Volume2, RefreshCw,
  Play, SkipBack, SkipForward, Info, Sliders
} from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth, hasRole } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { arSA } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Backend schema matching
const newsletterSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  customContent: z.string().optional(),
  template: z.enum([
    "morning_brief",
    "evening_digest",
    "weekly_analysis",
    "breaking_news",
    "tech_update",
    "business_report",
    "sport_highlights",
    "custom"
  ], { required_error: "يجب اختيار قالب" }),
  voicePreset: z.enum(["MALE_NEWS", "MALE_ANALYSIS", "FEMALE_NEWS", "FEMALE_CONVERSATIONAL", "CUSTOM"]).optional(),
  customVoiceId: z.string().optional(),
  customVoiceSettings: z.object({
    stability: z.number().min(0).max(1),
    similarity_boost: z.number().min(0).max(1),
    style: z.number().min(0).max(1).optional(),
    use_speaker_boost: z.boolean().optional(),
  }).optional(),
  scheduledFor: z.string().optional(),
  recurringSchedule: z.object({
    type: z.enum(["daily", "weekly", "custom"]),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    daysOfWeek: z.array(z.number()).optional(),
    timezone: z.string(),
    enabled: z.boolean(),
  }).optional(),
  publishImmediately: z.boolean().optional(),
  metadata: z.object({
    autoIntro: z.boolean().optional(),
    autoOutro: z.boolean().optional(),
    includeTransitions: z.boolean().optional(),
    backgroundMusic: z.boolean().optional(),
    audioQuality: z.enum(["standard", "high"]).optional(),
  }).optional(),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

interface Article {
  id: string;
  title: string;
  categoryId: string;
  category?: { nameAr: string };
  publishedAt: string;
  excerpt?: string;
}

// Template definitions
const TEMPLATES = [
  {
    id: "morning_brief",
    nameAr: "موجز الصباح",
    description: "نشرة إخبارية صباحية موجزة لبداية يومك",
    icon: Newspaper,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20"
  },
  {
    id: "evening_digest",
    nameAr: "موجز المساء",
    description: "ملخص شامل لأهم أحداث اليوم",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20"
  },
  {
    id: "weekly_analysis",
    nameAr: "تحليل أسبوعي",
    description: "تحليل معمق لأبرز أحداث الأسبوع",
    icon: TrendingUp,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20"
  },
  {
    id: "breaking_news",
    nameAr: "أخبار عاجلة",
    description: "تغطية فورية للأحداث العاجلة",
    icon: Zap,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20"
  },
  {
    id: "tech_update",
    nameAr: "أخبار تقنية",
    description: "آخر مستجدات عالم التكنولوجيا",
    icon: Laptop,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20"
  },
  {
    id: "business_report",
    nameAr: "تقرير اقتصادي",
    description: "تحليل الأسواق والأخبار الاقتصادية",
    icon: Briefcase,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20"
  },
  {
    id: "sport_highlights",
    nameAr: "أبرز الرياضة",
    description: "ملخص الأحداث الرياضية المهمة",
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
  },
  {
    id: "custom",
    nameAr: "قالب مخصص",
    description: "أنشئ نشرة بتصميمك الخاص",
    icon: Sparkles,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20"
  }
];

// Voice presets
const VOICE_PRESETS = [
  {
    id: "MALE_NEWS",
    nameAr: "صوت ذكوري إخباري",
    description: "مناسب للأخبار الرسمية والتقارير",
    gender: "male",
    style: "news",
    icon: Radio,
  },
  {
    id: "MALE_ANALYSIS",
    nameAr: "صوت ذكوري تحليلي",
    description: "مثالي للتحليلات المعمقة والتعليقات",
    gender: "male",
    style: "analysis",
    icon: MessageSquare,
  },
  {
    id: "FEMALE_NEWS",
    nameAr: "صوت أنثوي إخباري",
    description: "نبرة احترافية للأخبار والتقارير",
    gender: "female",
    style: "news",
    icon: Radio,
  },
  {
    id: "FEMALE_CONVERSATIONAL",
    nameAr: "صوت أنثوي حواري",
    description: "أسلوب ودي مناسب للمحتوى التفاعلي",
    gender: "female",
    style: "conversational",
    icon: MessageSquare,
  }
];

interface SortableArticleProps {
  article: Article;
  onRemove: () => void;
}

function SortableArticle({ article, onRemove }: SortableArticleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border rounded-lg bg-card hover-elevate"
      data-testid={`sortable-article-${article.id}`}
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{article.title}</p>
        <p className="text-xs text-muted-foreground">
          {article.category?.nameAr} • {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: arSA })}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        className="h-8 w-8"
        data-testid={`button-remove-article-${article.id}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Audio Player Component
function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          مشغل الصوت
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            dir="ltr"
            className="w-full"
            data-testid="audio-progress"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button size="icon" variant="ghost" data-testid="button-skip-back">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="default"
            onClick={togglePlay}
            className="h-12 w-12"
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button size="icon" variant="ghost" data-testid="button-skip-forward">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex-1" data-testid="button-download">
            <Download className="h-4 w-4 ml-2" />
            تحميل
          </Button>
          <Button variant="outline" className="flex-1" data-testid="button-share">
            <Share2 className="h-4 w-4 ml-2" />
            مشاركة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AudioNewsletterEditor() {
  const [, params] = useRoute("/dashboard/audio-newsletters/:id/edit");
  const [, navigate] = useLocation();
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  const newsletterId = params?.id;
  const isEditMode = !!newsletterId;

  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState("template");
  const [showAdvancedVoice, setShowAdvancedVoice] = useState(false);
  const [contentSource, setContentSource] = useState<"articles" | "custom">("articles");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      title: "",
      description: "",
      customContent: "",
      template: "morning_brief",
      voicePreset: "MALE_NEWS",
      customVoiceSettings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
      recurringSchedule: {
        type: "daily",
        time: "08:00",
        timezone: "Asia/Riyadh",
        enabled: false,
      },
      publishImmediately: false,
      metadata: {
        autoIntro: true,
        autoOutro: true,
        includeTransitions: true,
        backgroundMusic: false,
        audioQuality: "high",
      },
    },
  });

  const { data: newsletter, isLoading: isNewsletterLoading } = useQuery({
    queryKey: ["/api/audio-newsletters/newsletters", newsletterId],
    enabled: isEditMode,
  });

  const { data: publishedArticles = [], isLoading: isArticlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles", { status: "published" }],
    enabled: !!user,
  });

  useEffect(() => {
    if (newsletter?.newsletter) {
      const data = newsletter.newsletter;
      form.reset({
        title: data.title,
        description: data.description || "",
        template: data.template || "morning_brief",
        voicePreset: data.metadata?.voicePreset || "MALE_NEWS",
        customVoiceId: data.metadata?.customVoiceId,
        customVoiceSettings: data.metadata?.customVoiceSettings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        scheduledFor: data.scheduledFor,
        recurringSchedule: data.metadata?.recurringSchedule,
        metadata: data.metadata,
      });

      if (data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
      }

      if (data.articles) {
        const articlesList = data.articles.map((a: any) => ({
          id: a.article.id,
          title: a.article.title,
          categoryId: a.article.categoryId,
          category: a.article.category,
          publishedAt: a.article.publishedAt,
          excerpt: a.article.excerpt,
        }));
        setSelectedArticles(articlesList);
      }
    }
  }, [newsletter, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: NewsletterFormData & { articleIds: string[] }) => {
      if (isEditMode) {
        return await apiRequest(`/api/audio-newsletters/newsletters/${newsletterId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        return await apiRequest("/api/audio-newsletters/newsletters", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-newsletters"] });
      toast({
        title: "تم الحفظ",
        description: isEditMode ? "تم تحديث النشرة بنجاح" : "تم إنشاء النشرة بنجاح",
      });
      
      // If job was started, show the newsletter ID
      if (data.job) {
        toast({
          title: "جاري التوليد",
          description: "بدأ توليد الملف الصوتي...",
        });
        // Start monitoring the generation progress
        pollGenerationProgress(data.newsletter.id);
      } else if (!isEditMode) {
        navigate("/dashboard/audio-newsletters");
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل حفظ النشرة",
        variant: "destructive",
      });
    },
  });

  const generateAudioMutation = useMutation({
    mutationFn: async (newsletterId: string) => {
      return await apiRequest("/api/audio-newsletters/newsletters/generate-audio", {
        method: "POST",
        body: JSON.stringify({ newsletterId }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "بدأ التوليد",
        description: "جاري توليد الملف الصوتي...",
      });
      setIsGenerating(true);
      pollGenerationProgress(data.job.newsletterId);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل بدء توليد الصوت",
        variant: "destructive",
      });
    },
  });

  const pollGenerationProgress = useCallback((id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiRequest(`/api/audio-newsletters/newsletters/${id}`);
        const newsletter = response.newsletter;
        
        if (newsletter.status === "published" && newsletter.audioUrl) {
          setGeneratedAudioUrl(newsletter.audioUrl);
          setIsGenerating(false);
          setGenerationProgress(100);
          clearInterval(interval);
          toast({
            title: "تم التوليد",
            description: "تم توليد الملف الصوتي بنجاح",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/audio-newsletters/newsletters", id] });
        } else if (newsletter.status === "failed") {
          setIsGenerating(false);
          clearInterval(interval);
          toast({
            title: "فشل التوليد",
            description: "حدث خطأ أثناء توليد الملف الصوتي",
            variant: "destructive",
          });
        } else if (newsletter.status === "processing") {
          // Simulate progress based on status
          setGenerationProgress((prev) => Math.min(prev + 5, 95));
        }
      } catch (error) {
        console.error("Error polling generation progress:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [toast, queryClient]);

  const onSubmit = (data: NewsletterFormData) => {
    // Validate based on content source
    if (contentSource === "articles") {
      if (selectedArticles.length === 0) {
        toast({
          title: "خطأ",
          description: "يجب اختيار مقالة واحدة على الأقل",
          variant: "destructive",
        });
        return;
      }
    } else if (contentSource === "custom") {
      if (!data.customContent || !data.customContent.trim()) {
        toast({
          title: "خطأ",
          description: "يجب إدخال محتوى نصي",
          variant: "destructive",
        });
        return;
      }
    }

    // Prepare submission data based on content source
    const submissionData: any = {
      ...data,
      articleIds: contentSource === "articles" ? selectedArticles.map((a) => a.id) : [],
      customContent: contentSource === "custom" ? data.customContent : undefined,
    };

    saveMutation.mutate(submissionData);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSelectedArticles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addArticle = (article: Article) => {
    if (!selectedArticles.find((a) => a.id === article.id)) {
      setSelectedArticles([...selectedArticles, article]);
    }
    setIsArticleDialogOpen(false);
  };

  const removeArticle = (articleId: string) => {
    setSelectedArticles(selectedArticles.filter((a) => a.id !== articleId));
  };

  const filteredAvailableArticles = publishedArticles.filter(
    (article) =>
      !selectedArticles.find((a) => a.id === article.id) &&
      article.title.toLowerCase().includes(articleSearchQuery.toLowerCase())
  );

  if (isUserLoading || !user) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96" />
      </DashboardLayout>
    );
  }

  if (!hasRole(user, "admin", "system_admin", "editor")) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>غير مصرح</CardTitle>
          </CardHeader>
          <CardContent>
            <p>لا تملك صلاحية إنشاء أو تعديل النشرات الصوتية</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const selectedTemplate = TEMPLATES.find(t => t.id === form.watch("template"));
  const selectedVoicePreset = VOICE_PRESETS.find(v => v.id === form.watch("voicePreset"));

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/dashboard/audio-newsletters">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold" data-testid="heading-editor">
              {isEditMode ? "تعديل نشرة صوتية" : "نشرة صوتية جديدة"}
            </h1>
            {isEditMode && newsletter?.newsletter && (
              <p className="text-sm text-muted-foreground mt-1">
                الحالة: <Badge variant="outline">{newsletter.newsletter.status}</Badge>
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
              <TabsList className="grid w-full grid-cols-6 gap-2">
                <TabsTrigger value="template" data-testid="tab-template">
                  <FileText className="h-4 w-4 ml-2" />
                  القالب
                </TabsTrigger>
                <TabsTrigger value="basic" data-testid="tab-basic">
                  <Settings className="h-4 w-4 ml-2" />
                  الأساسيات
                </TabsTrigger>
                <TabsTrigger value="voice" data-testid="tab-voice">
                  <Mic className="h-4 w-4 ml-2" />
                  الصوت
                </TabsTrigger>
                <TabsTrigger value="articles" data-testid="tab-articles">
                  <Newspaper className="h-4 w-4 ml-2" />
                  المقالات ({selectedArticles.length})
                </TabsTrigger>
                <TabsTrigger value="schedule" data-testid="tab-schedule">
                  <CalendarClock className="h-4 w-4 ml-2" />
                  الجدولة
                </TabsTrigger>
                <TabsTrigger value="advanced" data-testid="tab-advanced">
                  <Sparkles className="h-4 w-4 ml-2" />
                  متقدم
                </TabsTrigger>
              </TabsList>

              {/* Template Selection */}
              <TabsContent value="template" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>اختر القالب</CardTitle>
                    <CardDescription>
                      اختر نوع النشرة الصوتية المناسب لمحتواك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="template"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="grid grid-cols-2 gap-4"
                            >
                              {TEMPLATES.map((template) => {
                                const Icon = template.icon;
                                const isSelected = field.value === template.id;
                                return (
                                  <label
                                    key={template.id}
                                    className={cn(
                                      "relative flex flex-col gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                                      isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover-elevate",
                                      template.bgColor
                                    )}
                                    data-testid={`template-${template.id}`}
                                  >
                                    <RadioGroupItem
                                      value={template.id}
                                      className="sr-only"
                                    />
                                    {isSelected && (
                                      <div className="absolute top-2 left-2">
                                        <Badge variant="default">
                                          <Check className="h-3 w-3" />
                                        </Badge>
                                      </div>
                                    )}
                                    <div className={cn("flex items-center gap-3", template.color)}>
                                      <Icon className="h-6 w-6" />
                                      <div className="flex-1">
                                        <h4 className="font-semibold">{template.nameAr}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {template.description}
                                        </p>
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    data-testid="button-next-to-basic"
                  >
                    التالي: المعلومات الأساسية
                  </Button>
                </div>
              </TabsContent>

              {/* Basic Info */}
              <TabsContent value="basic" className="space-y-4">
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
                          <FormLabel>العنوان *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="عنوان النشرة الصوتية" data-testid="input-title" />
                          </FormControl>
                          <FormDescription>
                            عنوان واضح ووصفي للنشرة الصوتية
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="وصف موجز للنشرة الصوتية"
                              rows={3}
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormDescription>
                            وصف يساعد المستمعين على فهم محتوى النشرة
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("template")}
                    data-testid="button-back-to-template"
                  >
                    السابق
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("voice")}
                    data-testid="button-next-to-voice"
                  >
                    التالي: اختيار الصوت
                  </Button>
                </div>
              </TabsContent>

              {/* Voice Selection */}
              <TabsContent value="voice" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="h-5 w-5" />
                          اختيار الصوت
                        </CardTitle>
                        <CardDescription className="mt-1">
                          اختر الصوت المناسب لنشرتك الصوتية
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        Flash v2.5
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="voicePreset"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الأصوات المحترفة</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="grid grid-cols-2 gap-4"
                            >
                              {VOICE_PRESETS.map((voice) => {
                                const Icon = voice.icon;
                                const isSelected = field.value === voice.id;
                                return (
                                  <label
                                    key={voice.id}
                                    className={cn(
                                      "relative flex flex-col gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                                      isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover-elevate"
                                    )}
                                    data-testid={`voice-${voice.id}`}
                                  >
                                    <RadioGroupItem
                                      value={voice.id}
                                      className="sr-only"
                                    />
                                    {isSelected && (
                                      <div className="absolute top-2 left-2">
                                        <Badge variant="default">
                                          <Check className="h-3 w-3" />
                                        </Badge>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <Icon className="h-5 w-5 text-primary" />
                                      <div className="flex-1">
                                        <h4 className="font-semibold">{voice.nameAr}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {voice.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Badge variant="outline" className="text-xs">
                                        {voice.gender === "male" ? "ذكر" : "أنثى"}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {voice.style === "news" ? "إخباري" : voice.style === "analysis" ? "تحليلي" : "حواري"}
                                      </Badge>
                                    </div>
                                  </label>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <Collapsible open={showAdvancedVoice} onOpenChange={setShowAdvancedVoice}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between" data-testid="button-toggle-advanced-voice">
                          <span className="flex items-center gap-2">
                            <Sliders className="h-4 w-4" />
                            إعدادات متقدمة
                          </span>
                          {showAdvancedVoice ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="customVoiceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>معرف صوت مخصص (اختياري)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="أدخل معرف الصوت من ElevenLabs" data-testid="input-custom-voice-id" />
                              </FormControl>
                              <FormDescription>
                                استخدم صوتك المخصص من ElevenLabs
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="customVoiceSettings.stability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الثبات (Stability): {field.value?.toFixed(2)}</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value || 0.5]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  dir="ltr"
                                  data-testid="slider-stability"
                                />
                              </FormControl>
                              <FormDescription>
                                مستوى ثبات الصوت (0 = متنوع، 1 = ثابت)
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="customVoiceSettings.similarity_boost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تحسين التشابه: {field.value?.toFixed(2)}</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value || 0.75]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  dir="ltr"
                                  data-testid="slider-similarity"
                                />
                              </FormControl>
                              <FormDescription>
                                مستوى تحسين التشابه مع الصوت الأصلي
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="customVoiceSettings.style"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>النمط (Style): {field.value?.toFixed(2)}</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value || 0]}
                                  onValueChange={([value]) => field.onChange(value)}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  dir="ltr"
                                  data-testid="slider-style"
                                />
                              </FormControl>
                              <FormDescription>
                                مستوى تعبير الصوت (0 = محايد، 1 = معبّر)
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="customVoiceSettings.use_speaker_boost"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>تعزيز وضوح المتحدث</FormLabel>
                                <FormDescription>
                                  يحسن وضوح الصوت للمحتوى الطويل
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-speaker-boost"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                    data-testid="button-back-to-basic"
                  >
                    السابق
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("articles")}
                    data-testid="button-next-to-articles"
                  >
                    التالي: اختيار المقالات
                  </Button>
                </div>
              </TabsContent>

              {/* Articles */}
              <TabsContent value="articles" className="space-y-4">
                {/* Content Source Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>مصدر المحتوى</CardTitle>
                    <CardDescription>
                      اختر كيف تريد إنشاء محتوى النشرة الإخبارية
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={contentSource}
                      onValueChange={(value: "articles" | "custom") => {
                        setContentSource(value);
                        if (value === "custom") {
                          setSelectedArticles([]);
                        } else {
                          form.setValue("customContent", "");
                        }
                      }}
                      data-testid="radio-group-content-source"
                    >
                      <div className="flex items-center space-x-reverse space-x-2 p-3 border rounded-lg hover-elevate cursor-pointer">
                        <RadioGroupItem value="articles" id="source-articles" data-testid="radio-source-articles" />
                        <Label htmlFor="source-articles" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">من المقالات</p>
                            <p className="text-sm text-muted-foreground">اختر مقالات موجودة لتجميعها في نشرة إخبارية</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2 p-3 border rounded-lg hover-elevate cursor-pointer">
                        <RadioGroupItem value="custom" id="source-custom" data-testid="radio-source-custom" />
                        <Label htmlFor="source-custom" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">نص مباشر</p>
                            <p className="text-sm text-muted-foreground">اكتب المحتوى الذي تريد قراءته صوتياً مباشرة</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Articles Selection (shown when contentSource is "articles") */}
                {contentSource === "articles" && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <CardTitle>المقالات ({selectedArticles.length})</CardTitle>
                          <CardDescription className="mt-1">
                            اختر المقالات ورتبها بالترتيب المطلوب
                          </CardDescription>
                        </div>
                        <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="button-add-articles">
                              <Plus className="h-4 w-4 ml-2" />
                              إضافة مقالات
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
                          <DialogHeader>
                            <DialogTitle>اختيار المقالات</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="البحث عن مقالات..."
                                value={articleSearchQuery}
                                onChange={(e) => setArticleSearchQuery(e.target.value)}
                                className="pr-10"
                                data-testid="input-search-articles"
                              />
                            </div>
                            <ScrollArea className="h-[50vh]">
                              <div className="space-y-2">
                                {isArticlesLoading ? (
                                  <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                      <Skeleton key={i} className="h-16" />
                                    ))}
                                  </div>
                                ) : filteredAvailableArticles.length === 0 ? (
                                  <div className="text-center py-8">
                                    <p className="text-muted-foreground">لا توجد مقالات متاحة</p>
                                  </div>
                                ) : (
                                  filteredAvailableArticles.map((article) => (
                                    <div
                                      key={article.id}
                                      className="flex items-center gap-3 p-3 border rounded-lg hover-elevate cursor-pointer"
                                      onClick={() => addArticle(article)}
                                      data-testid={`article-option-${article.id}`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{article.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {article.category?.nameAr} •{" "}
                                          {formatDistanceToNow(new Date(article.publishedAt), {
                                            addSuffix: true,
                                            locale: arSA,
                                          })}
                                        </p>
                                      </div>
                                      <Button size="sm" variant="ghost" data-testid={`button-add-article-${article.id}`}>
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedArticles.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground" data-testid="text-no-articles">
                          لم يتم اختيار أي مقالات بعد
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          اضغط على "إضافة مقالات" للبدء
                        </p>
                      </div>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selectedArticles.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {selectedArticles.map((article, index) => (
                              <div key={article.id} className="flex items-center gap-2">
                                <Badge variant="outline" className="px-2">
                                  {index + 1}
                                </Badge>
                                <div className="flex-1">
                                  <SortableArticle
                                    article={article}
                                    onRemove={() => removeArticle(article.id)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </CardContent>
                </Card>
                )}

                {/* Custom Content Input (shown when contentSource is "custom") */}
                {contentSource === "custom" && (
                  <FormField
                    control={form.control}
                    name="customContent"
                    render={({ field }) => {
                      const charCount = field.value?.length || 0;
                      return (
                        <FormItem>
                          <Card>
                            <CardHeader>
                              <CardTitle>المحتوى النصي</CardTitle>
                              <CardDescription>
                                اكتب المحتوى الذي تريد قراءته صوتياً
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="اكتب النشرة الإخبارية هنا... يمكنك كتابة أي محتوى تريد قراءته صوتياً"
                                  rows={12}
                                  className="resize-none"
                                  data-testid="textarea-custom-content"
                                />
                              </FormControl>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <p>سيتم قراءة هذا النص صوتياً باستخدام الصوت المختار</p>
                                <p data-testid="text-char-count">
                                  {charCount.toLocaleString('ar-SA')} حرف
                                </p>
                              </div>
                              <FormMessage />
                            </CardContent>
                          </Card>
                        </FormItem>
                      );
                    }}
                  />
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("voice")}
                    data-testid="button-back-to-voice"
                  >
                    السابق
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("schedule")}
                    disabled={
                      contentSource === "articles" 
                        ? selectedArticles.length === 0 
                        : !form.watch("customContent")?.trim()
                    }
                    data-testid="button-next-to-schedule"
                  >
                    التالي: الجدولة
                  </Button>
                </div>
              </TabsContent>

              {/* Scheduling */}
              <TabsContent value="schedule" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" />
                      جدولة النشر
                    </CardTitle>
                    <CardDescription>
                      حدد موعد نشر النشرة أو اجعلها متكررة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="scheduledFor"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>جدولة للنشر لاحقاً</FormLabel>
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  field.onChange(tomorrow.toISOString());
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                              data-testid="switch-schedule"
                            />
                          </div>
                          {field.value && (
                            <FormControl>
                              <Input
                                type="datetime-local"
                                value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                                data-testid="input-scheduled-time"
                              />
                            </FormControl>
                          )}
                          <FormDescription>
                            <Clock className="h-3 w-3 inline ml-1" />
                            التوقيت: UTC+3 (السعودية)
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="recurringSchedule.enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>جدولة متكررة</FormLabel>
                            <FormDescription>
                              نشر النشرة بشكل تلقائي ومتكرر
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-recurring"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("recurringSchedule.enabled") && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <FormField
                          control={form.control}
                          name="recurringSchedule.type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع التكرار</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-recurring-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">يومياً</SelectItem>
                                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                                  <SelectItem value="custom">مخصص</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recurringSchedule.time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>وقت النشر</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  data-testid="input-recurring-time"
                                />
                              </FormControl>
                              <FormDescription>
                                الوقت اليومي لنشر النشرة
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        {form.watch("recurringSchedule.type") === "weekly" && (
                          <FormField
                            control={form.control}
                            name="recurringSchedule.daysOfWeek"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>أيام الأسبوع</FormLabel>
                                <FormControl>
                                  <div className="flex flex-wrap gap-2">
                                    {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((day, index) => {
                                      const isSelected = field.value?.includes(index);
                                      return (
                                        <Button
                                          key={index}
                                          type="button"
                                          variant={isSelected ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => {
                                            const current = field.value || [];
                                            if (isSelected) {
                                              field.onChange(current.filter(d => d !== index));
                                            } else {
                                              field.onChange([...current, index]);
                                            }
                                          }}
                                          data-testid={`button-day-${index}`}
                                        >
                                          {day}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  اختر الأيام التي تريد نشر النشرة فيها
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Publish Immediately Option */}
                <FormField
                  control={form.control}
                  name="publishImmediately"
                  render={({ field }) => (
                    <FormItem>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>نشر فوري بعد التوليد</FormLabel>
                              <FormDescription>
                                نشر النشرة تلقائياً فور انتهاء توليد الصوت
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-publish-immediately"
                              />
                            </FormControl>
                          </div>
                        </CardContent>
                      </Card>
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("articles")}
                    data-testid="button-back-to-articles"
                  >
                    السابق
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("advanced")}
                    data-testid="button-next-to-advanced"
                  >
                    التالي: الإعدادات المتقدمة
                  </Button>
                </div>
              </TabsContent>

              {/* Advanced Settings */}
              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      التخصيصات الذكية
                    </CardTitle>
                    <CardDescription>
                      خيارات إضافية لتحسين جودة النشرة الصوتية
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="metadata.autoIntro"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>توليد المقدمة تلقائياً</FormLabel>
                            <FormDescription>
                              إضافة مقدمة احترافية للنشرة بشكل تلقائي
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-auto-intro"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.autoOutro"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>توليد الخاتمة تلقائياً</FormLabel>
                            <FormDescription>
                              إضافة خاتمة مناسبة للنشرة بشكل تلقائي
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-auto-outro"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.includeTransitions"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>إضافة انتقالات بين المقالات</FormLabel>
                            <FormDescription>
                              جمل انتقالية سلسة بين الأخبار
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-transitions"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.backgroundMusic"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>موسيقى خلفية</FormLabel>
                            <FormDescription>
                              إضافة موسيقى خلفية هادئة (قريباً)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled
                              data-testid="switch-background-music"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="metadata.audioQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>جودة الصوت</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-audio-quality">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">قياسية (أسرع)</SelectItem>
                              <SelectItem value="high">عالية (مستحسن)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            الجودة العالية تعطي صوتاً أوضح لكن تحتاج وقتاً أطول
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("schedule")}
                    data-testid="button-back-to-schedule"
                  >
                    السابق
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Generation & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : generatedAudioUrl ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      تم التوليد بنجاح
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-5 w-5" />
                      جاهز للتوليد
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {isGenerating
                    ? "يتم الآن توليد الملف الصوتي، قد يستغرق هذا بضع دقائق..."
                    : generatedAudioUrl
                    ? "تم توليد الملف الصوتي بنجاح. يمكنك الاستماع إليه أدناه."
                    : "احفظ النشرة كمسودة أو ابدأ توليد الملف الصوتي مباشرة"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} data-testid="progress-generation" />
                    <p className="text-sm text-center text-muted-foreground">
                      {generationProgress}% - {
                        generationProgress < 30 ? "جاري تحليل المحتوى..." :
                        generationProgress < 60 ? "جاري توليد الصوت..." :
                        generationProgress < 90 ? "جاري المعالجة النهائية..." :
                        "على وشك الانتهاء..."
                      }
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        الوقت المتوقع: ~{Math.ceil((100 - generationProgress) / 10)} دقيقة
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending || isGenerating}
                    className="flex-1"
                    data-testid="button-save"
                  >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                    <Save className="h-4 w-4 ml-2" />
                    {isEditMode ? "تحديث" : "حفظ كمسودة"}
                  </Button>

                  {isEditMode && !isGenerating && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant={generatedAudioUrl ? "outline" : "default"}
                            onClick={() => generateAudioMutation.mutate(newsletterId)}
                            disabled={generateAudioMutation.isPending || selectedArticles.length === 0}
                            className="flex-1"
                            data-testid="button-generate"
                          >
                            {generateAudioMutation.isPending ? (
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            ) : generatedAudioUrl ? (
                              <RefreshCw className="h-4 w-4 ml-2" />
                            ) : (
                              <PlayCircle className="h-4 w-4 ml-2" />
                            )}
                            {generatedAudioUrl ? "إعادة التوليد" : "توليد الصوت"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>سيتم توليد ملف صوتي احترافي من المقالات المختارة</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    data-testid="button-cancel"
                  >
                    <Link href="/dashboard/audio-newsletters">إلغاء</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player */}
            {generatedAudioUrl && !isGenerating && (
              <AudioPlayer audioUrl={generatedAudioUrl} />
            )}
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
