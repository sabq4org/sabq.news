import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Send,
  ArrowRight,
  Sparkles,
  ImagePlus,
  Loader2,
  Upload,
  Zap,
  AlertCircle,
  Calendar,
  Hash,
  EyeOff,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SeoPreview } from "@/components/SeoPreview";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, ArticleWithDetails } from "@shared/schema";
import { RichTextEditor } from "@/components/RichTextEditor";
import { TagInput } from "@/components/TagInput";
import { ReporterSelect } from "@/components/ReporterSelect";
import { OpinionAuthorSelect } from "@/components/OpinionAuthorSelect";

export default function ArticleEditor() {
  const params = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  
  // Extract pathname without query string
  const pathname = location.split('?')[0];
  const isNewArticle = pathname.endsWith('/article/new') || pathname.endsWith('/articles/new');
  
  // Extract id from params or pathname
  const id = params.id || pathname.split('/').pop();
  
  // Extract query parameters from URL
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const typeParam = queryParams.get('type') as "news" | "opinion" | "analysis" | "column" | null;
  
  console.log('[ArticleEditor] params:', params);
  console.log('[ArticleEditor] location:', location);
  console.log('[ArticleEditor] pathname:', pathname);
  console.log('[ArticleEditor] extracted id:', id);
  console.log('[ArticleEditor] isNewArticle:', isNewArticle);
  console.log('[ArticleEditor] type query param:', typeParam);

  // Article fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [reporterId, setReporterId] = useState<string | null>(null);
  const [opinionAuthorId, setOpinionAuthorId] = useState<string | null>(null);
  const [articleType, setArticleType] = useState<"news" | "opinion" | "analysis" | "column">(
    typeParam || "news"
  );
  
  // Debug: Track reporterId changes
  useEffect(() => {
    console.log('[ArticleEditor] reporterId state changed to:', reporterId);
  }, [reporterId]);
  const [imageUrl, setImageUrl] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  
  // New fields
  const [newsType, setNewsType] = useState<"breaking" | "featured" | "regular">("regular");
  const [publishType, setPublishType] = useState<"instant" | "scheduled">("instant");
  const [scheduledAt, setScheduledAt] = useState("");
  const [hideFromHomepage, setHideFromHomepage] = useState(false);
  
  // SEO fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [republish, setRepublish] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { toast } = useToast();

  // Check authentication and redirect if needed
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter to show only core categories (exclude smart, dynamic, seasonal)
  const categories = allCategories.filter(cat => cat.type === "core" || !cat.type);

  const { data: article } = useQuery<ArticleWithDetails>({
    queryKey: isNewArticle ? ["article-editor-new"] : ["/api/dashboard/articles", id],
    enabled: !isNewArticle && !!user,
  });

  // Load article data when editing
  useEffect(() => {
    if (article && !isNewArticle) {
      console.log('[ArticleEditor] Loading article data:', {
        articleId: article.id,
        reporterId: article.reporterId,
        reporterIdType: typeof article.reporterId,
        authorId: article.authorId,
        author: article.author,
      });
      setTitle(article.title);
      setSubtitle(article.subtitle || "");
      setSlug(article.slug);
      setContent(article.content);
      setExcerpt(article.excerpt || "");
      setCategoryId(article.categoryId || "");
      // Use reporterId as is - system supports various ID formats (nanoid, UUID, etc.)
      const validReporterId = article.reporterId || null;
      console.log('[ArticleEditor] Setting reporterId:', {
        original: article.reporterId,
        validated: validReporterId,
      });
      setReporterId(validReporterId);
      // Set opinionAuthorId from article.authorId for opinion articles
      if (article.articleType === "opinion") {
        setOpinionAuthorId(article.authorId || null);
      }
      // Validate imageUrl - accept http/https URLs or relative paths starting with /
      const validImageUrl = article.imageUrl && (
        article.imageUrl.match(/^https?:\/\/.+/) || article.imageUrl.startsWith('/')
      ) ? article.imageUrl : "";
      setImageUrl(validImageUrl);
      setArticleType((article.articleType as any) || "news");
      setNewsType((article.newsType as any) || "regular");
      setPublishType((article.publishType as any) || "instant");
      setScheduledAt(article.scheduledAt ? new Date(article.scheduledAt).toISOString().slice(0, 16) : "");
      setHideFromHomepage(article.hideFromHomepage || false);
      // Validate SEO fields - truncate if too long (legacy data cleanup)
      const validMetaTitle = article.seo?.metaTitle 
        ? article.seo.metaTitle.substring(0, 70) 
        : "";
      const validMetaDescription = article.seo?.metaDescription 
        ? article.seo.metaDescription.substring(0, 160) 
        : "";
      setMetaTitle(validMetaTitle);
      setMetaDescription(validMetaDescription);
      setKeywords(article.seo?.keywords || []);
      setStatus(article.status as any);
    }
  }, [article, isNewArticle]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار ملف صورة فقط",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploadData = await apiRequest("/api/objects/upload", {
        method: "POST",
      }) as { uploadURL: string };

      const uploadResponse = await fetch(uploadData.uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Extract the actual file path without query parameters
      const fileUrl = uploadData.uploadURL.split('?')[0];
      console.log("[Image Upload] File URL:", fileUrl);

      const aclData = await apiRequest("/api/article-images", {
        method: "PUT",
        body: JSON.stringify({ imageURL: fileUrl }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as { objectPath: string };

      console.log("[Image Upload] ACL Response:", aclData);
      console.log("[Image Upload] Object Path:", aclData.objectPath);

      setImageUrl(aclData.objectPath);

      toast({
        title: "تم الرفع بنجاح",
        description: `الرابط: ${aclData.objectPath.substring(0, 50)}...`,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveArticleMutation = useMutation({
    mutationFn: async ({ publishNow }: { publishNow: boolean }) => {
      console.log('[Save Article] Starting save...', {
        isNewArticle,
        publishNow,
        title,
        slug,
        content: content?.substring(0, 50)
      });
      
      console.log('[Save Article] Current reporterId state:', {
        reporterId,
        reporterIdType: typeof reporterId,
        reporterIdIsNull: reporterId === null,
        reporterIdValue: JSON.stringify(reporterId)
      });

      // Use reporterId as is - no UUID validation needed since system uses various ID formats (nanoid, UUID, etc.)
      const validReporterId = reporterId || null;
      
      console.log('[Save Article] After validation:', {
        validReporterId,
        willSendAsNull: validReporterId === null
      });
      
      const articleData: any = {
        title,
        slug,
        content,
        excerpt,
        categoryId: categoryId || null,
        imageUrl: imageUrl || "",
        articleType,
        publishType,
        scheduledAt: publishType === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        hideFromHomepage,
        status: publishNow 
          ? (publishType === "scheduled" ? "scheduled" : "published")
          : "draft",
        seo: {
          metaTitle: metaTitle ? metaTitle.substring(0, 70) : (title ? title.substring(0, 70) : ""),
          metaDescription: metaDescription ? metaDescription.substring(0, 160) : (excerpt ? excerpt.substring(0, 160) : ""),
          keywords: keywords,
        },
      };

      // Add fields specific to news articles (not for opinion)
      if (articleType !== "opinion") {
        articleData.subtitle = subtitle;
        articleData.reporterId = validReporterId;
        articleData.newsType = newsType;
        articleData.isFeatured = newsType === "featured";
      } else {
        // Opinion articles always use regular newsType
        articleData.newsType = "regular";
        articleData.isFeatured = false;
        // Add opinionAuthorId for opinion articles
        if (opinionAuthorId) {
          articleData.opinionAuthorId = opinionAuthorId;
        }
      }

      // For new articles, set publishedAt based on publish settings
      if (isNewArticle) {
        if (publishNow && publishType === "instant") {
          articleData.publishedAt = new Date().toISOString();
        } else if (publishNow && publishType === "scheduled" && scheduledAt) {
          articleData.publishedAt = new Date(scheduledAt).toISOString();
        }
      } else {
        // For updates, include republish flag
        // Backend will handle publishedAt based on this flag
        articleData.republish = republish;
      }

      console.log('[Save Article] Article data prepared:', articleData);
      console.log('[Save Article] Detailed SEO data:', {
        metaTitle: articleData.seo.metaTitle,
        metaTitleLength: articleData.seo.metaTitle?.length,
        metaDescription: articleData.seo.metaDescription,
        metaDescLength: articleData.seo.metaDescription?.length,
        imageUrl: articleData.imageUrl,
        imageUrlType: typeof articleData.imageUrl,
        reporterId: articleData.reporterId,
        reporterIdType: typeof articleData.reporterId,
      });

      if (isNewArticle) {
        console.log('[Save Article] Creating NEW article via POST /api/admin/articles');
        const result = await apiRequest("/api/admin/articles", {
          method: "POST",
          body: JSON.stringify(articleData),
        });
        console.log('[Save Article] POST result:', result);
        return result;
      } else {
        console.log('[Save Article] Updating EXISTING article via PATCH /api/admin/articles/' + id);
        const result = await apiRequest(`/api/admin/articles/${id}`, {
          method: "PATCH",
          body: JSON.stringify(articleData),
        });
        console.log('[Save Article] PATCH result:', result);
        return result;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate all article-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/homepage"] });
      
      // If updating existing article, also invalidate its specific query
      if (!isNewArticle && id) {
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/articles", id] });
      }
      
      toast({
        title: variables.publishNow ? "تم النشر بنجاح" : "تم الحفظ بنجاح",
        description: variables.publishNow ? "تم نشر المقال بنجاح" : "تم حفظ المقال كمسودة",
      });
      // العودة للصفحة السابقة (لوحة التحكم)
      setTimeout(() => {
        navigate("/dashboard/articles");
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ المقال",
        variant: "destructive",
      });
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/summarize", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (data: { summary: string }) => {
      setExcerpt(data.summary);
      toast({
        title: "تم التلخيص",
        description: "تم إنشاء ملخص تلقائي للمقال",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في توليد الملخص",
        variant: "destructive",
      });
    },
  });

  const generateTitlesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/generate-titles", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (data: { titles: string[] }) => {
      if (data.titles.length > 0) {
        setTitle(data.titles[0]);
        setSlug(generateSlug(data.titles[0]));
        toast({
          title: "تم توليد العناوين",
          description: `اقتراح: ${data.titles.join(" | ")}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في توليد العناوين",
        variant: "destructive",
      });
    },
  });

  // UUID validation regex - shared constant to avoid duplication
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generateSlug = (text: string) => {
    if (!text || typeof text !== 'string') return "";
    
    const slug = text
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "") // Keep Arabic, English, numbers, spaces, hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .substring(0, 150); // Limit to 150 characters
    
    return slug || ""; // Return slug or empty string
  };

  const handleTitleChange = (value: string) => {
    console.log('[handleTitleChange] Called with:', value);
    console.log('[handleTitleChange] isNewArticle:', isNewArticle);
    
    setTitle(value);
    
    // Always auto-generate slug for new articles as user types
    if (isNewArticle) {
      const generatedSlug = generateSlug(value);
      console.log('[Slug Generation] Title:', value, '-> Slug:', generatedSlug);
      setSlug(generatedSlug);
    } else {
      console.log('[Slug Generation] SKIPPED - not a new article');
    }
    
    if (!metaTitle) {
      setMetaTitle(value);
    }
  };

  const handleGenerateSummary = async () => {
    if (!content || typeof content !== 'string' || !content.trim()) return;
    generateSummaryMutation.mutate();
  };

  const handleGenerateTitle = async () => {
    if (!content || typeof content !== 'string' || !content.trim()) return;
    generateTitlesMutation.mutate();
  };

  const handleSave = async (publishNow = false) => {
    // Check required fields
    const missingFields = [];
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      missingFields.push("العنوان الرئيسي");
    }
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      missingFields.push("رابط المقال (Slug)");
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      missingFields.push("محتوى المقال");
    }
    if (!categoryId) {
      missingFields.push("التصنيف");
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "حقول مطلوبة",
        description: `الرجاء ملء: ${missingFields.join(" - ")}`,
        variant: "destructive",
      });
      return;
    }
    
    saveArticleMutation.mutate({ publishNow });
  };

  const isSaving = saveArticleMutation.isPending;
  const isGeneratingAI = generateSummaryMutation.isPending || generateTitlesMutation.isPending;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Page Header with Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              data-testid="button-back"
            >
              <Link href="/dashboard/articles">
                <a className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  العودة
                </a>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">
              {isNewArticle ? "خبر جديد" : "تحرير الخبر"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="gap-2"
              data-testid="button-save-draft"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ كمسودة
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="gap-2"
              data-testid="button-publish"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              نشر
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Main Content Area - 70% */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title with AI */}
            <Card>
              <CardHeader>
                <CardTitle>العنوان الرئيسي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="اكتب عنوان المقال..."
                    className="flex-1"
                    data-testid="input-title"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateTitle}
                    disabled={isGeneratingAI || !content || typeof content !== 'string' || !content.trim()}
                    title="اقتراح من الذكاء الاصطناعي"
                    data-testid="button-ai-title"
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(title || "").length}/200 حرف
                </p>
              </CardContent>
            </Card>

            {/* Subtitle - Hidden for opinion articles */}
            {articleType !== "opinion" && (
              <Card>
                <CardHeader>
                  <CardTitle>العنوان الفرعي</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="عنوان فرعي (اختياري)..."
                    maxLength={120}
                    data-testid="input-subtitle"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {(subtitle || "").length}/120 حرف
                    {(subtitle || "").length > 100 && (
                      <span className="text-amber-500 mr-2">قريب من الحد الأقصى</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>الصورة البارزة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {imageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      data-testid="img-preview"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={isUploadingImage}
                    className="gap-2"
                    data-testid="button-upload-image"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {imageUrl ? "تغيير الصورة" : "رفع صورة"}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>محتوى المقال</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="ابدأ بكتابة المقال..."
                />
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>الملخص</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingAI || !content || typeof content !== 'string' || !content.trim()}
                    className="gap-2"
                    data-testid="button-ai-summary"
                  >
                    <Sparkles className="h-4 w-4" />
                    توليد تلقائي
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value);
                    if (!metaDescription) {
                      setMetaDescription(e.target.value);
                    }
                  }}
                  placeholder="ملخص قصير للمقال..."
                  rows={4}
                  data-testid="textarea-excerpt"
                />
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar - 30% */}
          <div className="lg:col-span-3 space-y-6">
            {/* Article Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  نوع المحتوى
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={articleType} onValueChange={(value: any) => setArticleType(value)}>
                  <SelectTrigger data-testid="select-article-type">
                    <SelectValue placeholder="اختر نوع المحتوى" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">خبر</SelectItem>
                    <SelectItem value="opinion">مقال رأي</SelectItem>
                    <SelectItem value="analysis">تحليل</SelectItem>
                    <SelectItem value="column">عمود</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* News Type - Hidden for opinion articles */}
            {articleType !== "opinion" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    نوع الخبر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={newsType} onValueChange={(value: any) => setNewsType(value)}>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="breaking" id="breaking" />
                      <Label htmlFor="breaking" className="flex items-center gap-2 cursor-pointer">
                        خبر عاجل
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="featured" id="featured" />
                      <Label htmlFor="featured" className="flex items-center gap-2 cursor-pointer">
                        خبر مميز
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="regular" id="regular" />
                      <Label htmlFor="regular" className="flex items-center gap-2 cursor-pointer">
                        خبر عادي
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {/* Hide from Homepage Option */}
                  <div className="pt-4 border-t mt-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id="hideFromHomepage"
                        checked={hideFromHomepage}
                        onCheckedChange={(checked) => setHideFromHomepage(checked as boolean)}
                        data-testid="checkbox-hide-from-homepage"
                      />
                      <Label htmlFor="hideFromHomepage" className="flex items-center gap-2 cursor-pointer text-sm">
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">إخفاء من الواجهة الرئيسية</div>
                          <div className="text-xs text-muted-foreground">
                            المقال سينشر لكن لن يظهر في الصفحة الرئيسية
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>التصنيف</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="اختر تصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon && <span className="ml-2">{category.icon}</span>}
                        {category.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Reporter - Hidden for opinion articles */}
            {articleType !== "opinion" && (
              <Card>
                <CardHeader>
                  <CardTitle>المراسل</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReporterSelect
                    value={reporterId}
                    onChange={setReporterId}
                  />
                </CardContent>
              </Card>
            )}

            {/* Opinion Author - Shown only for opinion articles */}
            {articleType === "opinion" && (
              <Card>
                <CardHeader>
                  <CardTitle>كاتب المقال</CardTitle>
                </CardHeader>
                <CardContent>
                  <OpinionAuthorSelect
                    value={opinionAuthorId}
                    onChange={setOpinionAuthorId}
                  />
                </CardContent>
              </Card>
            )}

            {/* Publishing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  النشر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="publish-type">نشر مجدول</Label>
                  <Switch
                    id="publish-type"
                    checked={publishType === "scheduled"}
                    onCheckedChange={(checked) => setPublishType(checked ? "scheduled" : "instant")}
                  />
                </div>
                
                {publishType === "scheduled" && (
                  <div className="space-y-2">
                    <Label>التاريخ والوقت</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full"
                      data-testid="input-scheduled-at"
                    />
                  </div>
                )}

                {publishType === "instant" && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    سيتم النشر فوراً
                  </div>
                )}

                {/* Republish Switch - Only show when editing a published article */}
                {!isNewArticle && article?.status === "published" && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="republish" className="cursor-pointer">
                        إعادة النشر بالتوقيت الحالي
                      </Label>
                      <Switch
                        id="republish"
                        checked={republish}
                        onCheckedChange={setRepublish}
                        data-testid="switch-republish"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      عند التفعيل، سيتم تحديث وقت النشر وسيظهر المقال في أعلى القائمة
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  إعدادات SEO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="seo" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="seo">الحقول</TabsTrigger>
                    <TabsTrigger value="preview">المعاينة</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="seo" className="space-y-4">
                    <div className="space-y-2">
                      <Label>عنوان SEO</Label>
                      <Input
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder={title || "عنوان للصفحة..."}
                        maxLength={70}
                        data-testid="input-meta-title"
                      />
                      <p className="text-xs text-muted-foreground">
                        {(metaTitle || "").length}/70 حرف
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>وصف SEO</Label>
                      <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder={excerpt || "وصف قصير..."}
                        rows={3}
                        maxLength={160}
                        data-testid="textarea-meta-description"
                      />
                      <p className="text-xs text-muted-foreground">
                        {(metaDescription || "").length}/160 حرف
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Slug (الرابط)</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSlug(generateSlug(title))}
                          className="h-auto py-1 px-2 text-xs"
                        >
                          توليد تلقائي
                        </Button>
                      </div>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="article-slug"
                        dir="ltr"
                        maxLength={150}
                        data-testid="input-slug"
                      />
                      <p className="text-xs text-muted-foreground">
                        {(slug || "").length}/150 حرف
                      </p>
                    </div>

                    <TagInput
                      label="الكلمات المفتاحية"
                      tags={keywords}
                      onTagsChange={setKeywords}
                      placeholder="اكتب كلمة واضغط Enter..."
                      testId="input-keywords"
                    />
                  </TabsContent>

                  <TabsContent value="preview">
                    <SeoPreview
                      title={metaTitle || title}
                      description={metaDescription || excerpt}
                      slug={slug}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
