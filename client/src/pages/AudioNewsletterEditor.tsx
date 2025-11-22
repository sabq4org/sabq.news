import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, ArrowLeft, Save, Radio, PlayCircle, Search, X, GripVertical,
  Filter, Clock, Calendar, Mic, Eye, Settings, ChevronDown, ChevronUp,
  FileText, Hash, Sparkles, Timer, CalendarClock, Plus
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
import { DashboardLayout } from "@/components/DashboardLayout";
import { NewsletterTemplates, NewsletterTemplate } from "@/components/NewsletterTemplates";
import { useAuth, hasRole } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { cn } from "@/lib/utils";

const newsletterSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  coverImageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
  templateId: z.string().optional(),
  intro: z.string().optional(),
  outro: z.string().optional(),
  voiceId: z.string().min(1, "يجب اختيار صوت"),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1),
    similarityBoost: z.number().min(0).max(1),
  }),
  schedule: z.object({
    enabled: z.boolean(),
    type: z.enum(["once", "daily", "weekly", "monthly"]).optional(),
    time: z.string().optional(),
    date: z.string().optional(),
    days: z.array(z.number()).optional(),
  }).optional(),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

interface Article {
  id: string;
  title: string;
  categoryId: string;
  category?: { nameAr: string };
  publishedAt: string;
}

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
      coverImageUrl: "",
      voiceId: "pNInz6obpgDQGcFmaJgB", // Default ElevenLabs voice
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
      },
    },
  });

  const { data: newsletter, isLoading: isNewsletterLoading } = useQuery({
    queryKey: ["/api/audio-newsletters", newsletterId],
    enabled: isEditMode,
  });

  const { data: publishedArticles = [], isLoading: isArticlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles", { status: "published" }],
    enabled: !!user,
  });

  useEffect(() => {
    if (newsletter) {
      form.reset({
        title: newsletter.title,
        description: newsletter.description || "",
        coverImageUrl: newsletter.coverImageUrl || "",
        voiceId: newsletter.voiceId || "pNInz6obpgDQGcFmaJgB",
        voiceSettings: {
          stability: newsletter.voiceSettings?.stability || 0.5,
          similarityBoost: newsletter.voiceSettings?.similarityBoost || 0.75,
        },
      });

      if (newsletter.articles) {
        setSelectedArticles(newsletter.articles);
      }
    }
  }, [newsletter, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: NewsletterFormData & { articleIds: string[] }) => {
      if (isEditMode) {
        return await apiRequest(`/api/audio-newsletters/${newsletterId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        return await apiRequest("/api/audio-newsletters", {
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
      navigate("/dashboard/audio-newsletters");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل حفظ النشرة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewsletterFormData) => {
    saveMutation.mutate({
      ...data,
      articleIds: selectedArticles.map((a) => a.id),
    });
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
            {isEditMode && newsletter && (
              <p className="text-sm text-muted-foreground mt-1">
                {newsletter.status === "draft" ? "مسودة" : newsletter.status}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط صورة الغلاف</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-cover-image" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات الصوت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="voiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الصوت</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-voice">
                            <SelectValue placeholder="اختر صوت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam (ذكر - إنجليزي)</SelectItem>
                          <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (أنثى - إنجليزي)</SelectItem>
                          <SelectItem value="AZnzlk1XvdvUeBnXmlld">Domi (أنثى - إنجليزي)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voiceSettings.stability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الثبات (Stability): {field.value.toFixed(2)}</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
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
                  name="voiceSettings.similarityBoost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تحسين التشابه (Similarity Boost): {field.value.toFixed(2)}</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>المقالات ({selectedArticles.length})</CardTitle>
                  <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-add-articles">
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
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                          {isArticlesLoading ? (
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16" />
                              ))}
                            </div>
                          ) : filteredAvailableArticles.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                              لا توجد مقالات متاحة
                            </p>
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
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {selectedArticles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-articles">
                    لم يتم اختيار أي مقالات بعد
                  </p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={selectedArticles.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {selectedArticles.map((article) => (
                          <SortableArticle
                            key={article.id}
                            article={article}
                            onRemove={() => removeArticle(article.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                <Save className="h-4 w-4 ml-2" />
                حفظ كمسودة
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                data-testid="button-cancel"
              >
                <Link href="/dashboard/audio-newsletters">إلغاء</Link>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
