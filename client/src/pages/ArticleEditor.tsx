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
  Image as ImageIcon,
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
import { ImageFocalPointPicker } from "@/components/ImageFocalPointPicker";
import { SmartLinksPanel } from "@/components/SmartLinksPanel";
import { MediaLibraryPicker } from "@/components/dashboard/MediaLibraryPicker";
import { InlineHeadlineSuggestions } from "@/components/InlineHeadlineSuggestions";
import type { Editor } from "@tiptap/react";
import type { MediaFile } from "@shared/schema";

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
  const [imageFocalPoint, setImageFocalPoint] = useState<{ x: number; y: number } | null>(null);
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
  const [isAnalyzingSEO, setIsAnalyzingSEO] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

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
    refetchOnMount: true, // Always fetch fresh data when opening editor
    staleTime: 0, // Consider data stale immediately to ensure fresh data
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
      setImageFocalPoint((article as any).imageFocalPoint || null);
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

  // Helper function to save uploaded images to media library
  const saveToMediaLibrary = async (imageUrl: string) => {
    try {
      const fileName = imageUrl.split('/').pop() || 'image.jpg';
      const mediaTitle = title || "صورة المقال";
      const description = (excerpt || content.substring(0, 100) || mediaTitle);
      
      await apiRequest("/api/media/save-existing", {
        method: "POST",
        body: JSON.stringify({
          fileName,
          url: imageUrl,
          title: mediaTitle,
          description,
          category: "articles",
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      console.log("[Media Library] Successfully saved image to library:", fileName);
    } catch (error) {
      console.error("Failed to save to media library:", error);
      // Don't show error to user - this is background operation
    }
  };

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

      // Auto-save to media library in background
      saveToMediaLibrary(aclData.objectPath);

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
        imageFocalPoint: imageFocalPoint || null,
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

  const autoClassifyMutation = useMutation({
    mutationFn: async () => {
      if (!id || isNewArticle) {
        throw new Error("يجب حفظ المقال كمسودة أولاً");
      }
      setIsClassifying(true);
      return await apiRequest(`/api/articles/${id}/auto-categorize`, {
        method: "POST",
      });
    },
    onSuccess: (data: {
      primaryCategory: {
        categoryId: string;
        categoryName: string;
        confidence: number;
        reasoning: string;
      };
      suggestedCategories: Array<{
        categoryId: string;
        categoryName: string;
        confidence: number;
        reasoning: string;
      }>;
      provider: string;
      model: string;
    }) => {
      setIsClassifying(false);
      // Auto-fill the primary category
      setCategoryId(data.primaryCategory.categoryId);
      
      // Show success with category info
      const suggestedText = data.suggestedCategories.length > 0
        ? `\n\nتصنيفات مقترحة أخرى: ${data.suggestedCategories.map(c => `${c.categoryName} (${Math.round(c.confidence * 100)}%)`).join(', ')}`
        : '';
      
      toast({
        title: "تم التصنيف بنجاح",
        description: `التصنيف: ${data.primaryCategory.categoryName} (${Math.round(data.primaryCategory.confidence * 100)}% ثقة)${suggestedText}`,
      });
    },
    onError: (error: Error) => {
      setIsClassifying(false);
      toast({
        title: "خطأ في التصنيف",
        description: error.message || "فشل في تصنيف المقال",
        variant: "destructive",
      });
    },
  });

  const generateSeoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/seo/generate`, {
        method: "POST",
        body: JSON.stringify({ articleId: id, language: "ar" }),
      });
      return response;
    },
    onSuccess: (data: {
      seo: {
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
      };
      provider: string;
      model: string;
    }) => {
      // Auto-fill SEO fields from data.seo object
      if (data.seo && data.seo.metaTitle) {
        setMetaTitle(data.seo.metaTitle);
        setMetaDescription(data.seo.metaDescription || "");
        setKeywords(data.seo.keywords || []);
      }
      
      // Invalidate queries to refetch article with updated SEO data
      queryClient.invalidateQueries({ queryKey: ['/api/articles', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/articles', id] });
      
      // Show success toast
      toast({
        title: "تم توليد SEO بنجاح",
        description: `المزود: ${data.provider} | النموذج: ${data.model}`,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "فشل في توليد SEO";
      toast({
        title: "فشل توليد SEO",
        description: message,
        variant: "destructive",
      });
    },
  });

  const analyzeSEOMutation = useMutation({
    mutationFn: async () => {
      if (!id || isNewArticle) {
        throw new Error("يجب حفظ المقال أولاً قبل تحليل SEO");
      }
      setIsAnalyzingSEO(true);
      return await apiRequest(`/api/articles/${id}/analyze-seo`, {
        method: "POST",
        body: JSON.stringify({ applyChanges: false }),
      });
    },
    onSuccess: (data: {
      seoTitle: string;
      metaDescription: string;
      keywords: string[];
      socialTitle: string;
      socialDescription: string;
      imageAltText: string;
      suggestions: string[];
      score: number;
    }) => {
      setIsAnalyzingSEO(false);
      setMetaTitle(data.seoTitle);
      setMetaDescription(data.metaDescription);
      setKeywords(data.keywords);
      
      toast({
        title: `تحليل SEO - النتيجة: ${data.score}/100`,
        description: `تم تحليل المقال وتطبيق التوصيات. ${data.suggestions.length > 0 ? data.suggestions[0] : ''}`,
      });
    },
    onError: (error: Error) => {
      setIsAnalyzingSEO(false);
      toast({
        title: "خطأ في تحليل SEO",
        description: error.message || "فشل في تحليل SEO",
        variant: "destructive",
      });
    },
  });

  const generateSmartContentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/articles/generate-content", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (data: {
      mainTitle: string;
      subTitle: string;
      smartSummary: string;
      keywords: string[];
      seo: { metaTitle: string; metaDescription: string };
    }) => {
      setTitle(data.mainTitle);
      setSubtitle(data.subTitle);
      setExcerpt(data.smartSummary);
      setKeywords(data.keywords);
      setMetaTitle(data.seo.metaTitle);
      setMetaDescription(data.seo.metaDescription);
      setSlug(generateSlug(data.mainTitle));
      
      toast({
        title: "✨ تم التوليد الذكي",
        description: "تم إنشاء جميع العناصر التحريرية تلقائياً",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل توليد المحتوى الذكي",
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

  const handleGenerateSmartContent = async () => {
    if (!content || typeof content !== 'string' || !content.trim()) {
      toast({
        title: "تنبيه",
        description: "يجب كتابة محتوى الخبر أولاً",
        variant: "destructive",
      });
      return;
    }
    generateSmartContentMutation.mutate();
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

  const handleAddLink = (suggestion: { text: string; position: number; length: number }, url: string) => {
    if (!editorInstance) {
      toast({
        title: "خطأ",
        description: "المحرر غير جاهز. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
      return;
    }

    // البحث عن النص في المحرر باستخدام regex للدقة
    const searchText = suggestion.text.trim();
    
    // استخدام findChildren للبحث في عقد المحرر
    let found = false;
    const { state } = editorInstance;
    
    state.doc.descendants((node, pos) => {
      if (found) return false; // توقف بعد إيجاد أول مطابقة
      
      if (node.isText && node.text) {
        // البحث عن النص في هذه العقدة
        const textContent = node.text;
        const index = textContent.indexOf(searchText);
        
        if (index !== -1) {
          // وجدنا النص! احسب الموقع الدقيق في المحرر
          const from = pos + index;
          const to = from + searchText.length;
          
          // تطبيق الرابط
          editorInstance
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .setLink({ href: url })
            .run();
          
          found = true;
          
          toast({
            title: "تم إضافة الرابط بنجاح",
            description: `تم ربط "${searchText}" بالرابط المقترح`,
          });
          
          return false; // توقف عن البحث
        }
      }
      return true; // استمر في البحث
    });
    
    if (!found) {
      // إذا لم نجد النص، جرب البحث بطريقة أخرى
      const editorText = state.doc.textContent;
      const index = editorText.indexOf(searchText);
      
      if (index !== -1) {
        // حاول حساب الموقع بناءً على النص الكامل
        // هذه طريقة احتياطية قد لا تكون دقيقة 100%
        let charCount = 0;
        let targetFrom = -1;
        
        state.doc.descendants((node, pos) => {
          if (targetFrom !== -1) return false;
          
          if (node.isText && node.text) {
            const nodeLength = node.text.length;
            if (charCount + nodeLength > index) {
              // النص يبدأ في هذه العقدة
              const localIndex = index - charCount;
              targetFrom = pos + localIndex;
              return false;
            }
            charCount += nodeLength;
          }
          return true;
        });
        
        if (targetFrom !== -1) {
          const targetTo = targetFrom + searchText.length;
          
          editorInstance
            .chain()
            .focus()
            .setTextSelection({ from: targetFrom, to: targetTo })
            .setLink({ href: url })
            .run();
          
          toast({
            title: "تم إضافة الرابط بنجاح",
            description: `تم ربط "${searchText}" بالرابط المقترح`,
          });
        } else {
          toast({
            title: "لم يتم العثور على النص",
            description: `النص "${searchText}" غير موجود في المحتوى الحالي`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "لم يتم العثور على النص",
          description: `النص "${searchText}" غير موجود في المحتوى الحالي`,
          variant: "destructive",
        });
      }
    }
  };

  const isSaving = saveArticleMutation.isPending;
  const isGeneratingAI = generateSummaryMutation.isPending || generateTitlesMutation.isPending || generateSmartContentMutation.isPending;

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
                <InlineHeadlineSuggestions
                  language="ar"
                  editorInstance={editorInstance}
                  currentTitle={title}
                  onTitleChange={setTitle}
                />
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
                  <Button
                    variant="outline"
                    onClick={() => setShowMediaPicker(true)}
                    className="gap-2"
                    data-testid="button-choose-from-library"
                  >
                    <ImageIcon className="h-4 w-4" />
                    اختر من المكتبة
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

            {/* Focal Point Picker - Show only when image is uploaded */}
            {imageUrl && (
              <ImageFocalPointPicker
                imageUrl={imageUrl}
                currentFocalPoint={imageFocalPoint || undefined}
                onFocalPointChange={(point) => setImageFocalPoint(point)}
              />
            )}

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>محتوى المقال</CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateSmartContent}
                    disabled={isGeneratingAI || !content || typeof content !== 'string' || !content.trim()}
                    className="gap-2"
                    data-testid="button-smart-generate"
                    title="توليد جميع العناصر التحريرية تلقائياً"
                  >
                    {generateSmartContentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    توليد ذكي
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="ابدأ بكتابة المقال..."
                  editorRef={setEditorInstance}
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

            {/* Smart Links Panel */}
            <div className="h-[600px]" data-testid="smart-links-container">
              <SmartLinksPanel
                articleContent={content}
                articleId={isNewArticle ? undefined : id}
                onAddLink={handleAddLink}
              />
            </div>
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
                <CardTitle className="flex items-center justify-between">
                  <span>التصنيف</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => autoClassifyMutation.mutate()}
                    disabled={isClassifying || !title || !content || isNewArticle}
                    title={
                      isNewArticle 
                        ? "احفظ المقال كمسودة أولاً لاستخدام التصنيف الذكي" 
                        : !title || !content 
                          ? "يجب إدخال العنوان والمحتوى أولاً" 
                          : "تصنيف ذكي بالذكاء الاصطناعي"
                    }
                    data-testid="button-auto-classify"
                  >
                    <Sparkles className={`h-4 w-4 ml-1 ${isClassifying ? 'text-muted-foreground animate-pulse' : isNewArticle ? 'text-muted-foreground' : 'text-primary'}`} />
                    <span className="text-sm">{isClassifying ? 'جاري التصنيف...' : 'تصنيف ذكي'}</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                
                {isNewArticle && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    التصنيف الذكي متاح بعد حفظ المقال كمسودة
                  </p>
                )}
              </CardContent>
            </Card>

            {/* SEO Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>تحسين محركات البحث (SEO)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateSeoMutation.mutate()}
                    disabled={generateSeoMutation.isPending || !title || !content || isNewArticle}
                    title={
                      isNewArticle 
                        ? "احفظ المقال كمسودة أولاً لاستخدام توليد SEO" 
                        : !title || !content 
                          ? "يجب إدخال العنوان والمحتوى أولاً" 
                          : "توليد SEO ذكي بالذكاء الاصطناعي"
                    }
                    data-testid="button-generate-seo"
                  >
                    <Sparkles className={`h-4 w-4 ml-1 ${generateSeoMutation.isPending ? 'text-muted-foreground animate-pulse' : isNewArticle ? 'text-muted-foreground' : 'text-primary'}`} />
                    <span className="text-sm">{generateSeoMutation.isPending ? 'جاري التوليد...' : 'توليد SEO'}</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>عنوان Meta (50-60 حرف) - {metaTitle.length}/60</Label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="عنوان محسّن لمحركات البحث"
                    maxLength={60}
                    data-testid="input-meta-title"
                  />
                </div>
                <div>
                  <Label>وصف Meta (140-160 حرف) - {metaDescription.length}/160</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="وصف مقنع لمحركات البحث"
                    maxLength={160}
                    rows={3}
                    data-testid="textarea-meta-description"
                  />
                </div>
                <div>
                  <Label>الكلمات المفتاحية</Label>
                  <Input
                    value={keywords.join(", ")}
                    onChange={(e) => setKeywords(e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
                    placeholder="كلمة1, كلمة2, كلمة3"
                    data-testid="input-keywords"
                  />
                </div>
                {isNewArticle && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    توليد SEO متاح بعد حفظ المقال كمسودة
                  </p>
                )}
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
                    {/* SEO AI Analysis Button */}
                    {!isNewArticle && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">تحليل SEO بالذكاء الاصطناعي</p>
                          <p className="text-xs text-muted-foreground">
                            احصل على توصيات تلقائية لتحسين ظهور المقال في محركات البحث
                          </p>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => analyzeSEOMutation.mutate()}
                          disabled={isAnalyzingSEO || !id}
                          data-testid="button-analyze-seo"
                        >
                          {isAnalyzingSEO ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              جاري التحليل...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 ml-2" />
                              تحليل SEO
                            </>
                          )}
                        </Button>
                      </div>
                    )}

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

      {/* Media Library Picker */}
      <MediaLibraryPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media: MediaFile) => {
          // Use originalUrl (from database) instead of url (which might be proxy URL)
          // This ensures we store the actual GCS URL (https:// or gs://)
          const urlToStore = (media as any).originalUrl || media.url;
          setImageUrl(urlToStore);
          setShowMediaPicker(false);
          toast({
            title: "تم اختيار الصورة",
            description: "تم إضافة الصورة من المكتبة",
          });
        }}
        articleTitle={title}
        articleContent={content?.substring(0, 500)}
        currentImageUrl={imageUrl}
      />
    </DashboardLayout>
  );
}
