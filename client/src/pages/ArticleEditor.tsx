import { useState, useEffect, useCallback, useRef } from "react";
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
  LayoutGrid,
  Share2,
  Layers,
  X,
  BarChart3,
  CheckCircle2,
  Clock,
  RotateCcw,
  Trash2,
} from "lucide-react";
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
import { AIImageGeneratorDialog } from "@/components/AIImageGeneratorDialog";
import { InfographicGeneratorDialog } from "@/components/InfographicGeneratorDialog";
import { InfographicAiDialog } from "@/components/InfographicAiDialog";
import { StoryCardsGenerator } from "@/components/StoryCardsGenerator";
import { AutoImageGenerator } from "@/components/AutoImageGenerator";
import { ThumbnailGenerator } from "@/components/ThumbnailGenerator";
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
  const typeParam = queryParams.get('type') as "news" | "opinion" | "analysis" | "column" | "infographic" | null;
  
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
  const [articleType, setArticleType] = useState<"news" | "opinion" | "analysis" | "column" | "infographic">(
    typeParam || "news"
  );
  const [previousArticleType, setPreviousArticleType] = useState<"news" | "opinion" | "analysis" | "column">("news");
  const [isInfographic, setIsInfographic] = useState(false);
  
  // Debug: Track reporterId changes
  useEffect(() => {
    console.log('[ArticleEditor] reporterId state changed to:', reporterId);
  }, [reporterId]);
  
  // Sync infographic state with articleType
  useEffect(() => {
    setIsInfographic(articleType === "infographic");
  }, [articleType]);
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailManuallyDeleted, setThumbnailManuallyDeleted] = useState(false);
  const [heroImageMediaId, setHeroImageMediaId] = useState<string | null>(null);
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
  const [isGeneratingSocialCards, setIsGeneratingSocialCards] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showAIImageDialog, setShowAIImageDialog] = useState(false);
  const [showInfographicDialog, setShowInfographicDialog] = useState(false);
  const [showStoryCardsDialog, setShowStoryCardsDialog] = useState(false);
  
  // Auto-save states
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<Date | null>(null);
  const [showDraftRecoveryDialog, setShowDraftRecoveryDialog] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedArticleRef = useRef(false);
  
  // Use ref for immediate lock with URL tracking (prevents concurrent uploads even in StrictMode)
  const savingMediaMapRef = useRef<Map<string, Promise<string | null>>>(new Map());
  
  // Request token to track and discard stale responses when hero image changes
  const imageRequestTokenRef = useRef<number>(0);

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

  // Fetch media assets for this article
  const { data: mediaAssets = [], refetch: refetchMediaAssets } = useQuery<any[]>({
    queryKey: ["/api/articles", article?.id, "media-assets"],
    enabled: !isNewArticle && !!article?.id,
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
      // Set thumbnailUrl if available
      const validThumbnailUrl = (article as any).thumbnailUrl && (
        (article as any).thumbnailUrl.match(/^https?:\/\/.+/) || (article as any).thumbnailUrl.startsWith('/')
      ) ? (article as any).thumbnailUrl : "";
      setThumbnailUrl(validThumbnailUrl);
      setThumbnailManuallyDeleted((article as any).thumbnailManuallyDeleted || false);
      setImageFocalPoint((article as any).imageFocalPoint || null);
      const loadedArticleType = (article.articleType as any) || "news";
      setArticleType(loadedArticleType);
      // Handle infographic type
      if (loadedArticleType === "infographic") {
        setIsInfographic(true);
        setPreviousArticleType("news"); // Default fallback
      } else {
        setIsInfographic(false);
        setPreviousArticleType(loadedArticleType);
      }
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
      hasLoadedArticleRef.current = true;
    }
  }, [article, isNewArticle]);

  // Auto-save draft key - unique per article or "new" for new articles
  const autoSaveKey = `article-draft-${isNewArticle ? 'new' : id}`;

  // Function to save draft to localStorage
  const saveDraftToLocalStorage = useCallback(() => {
    // Only save if there's meaningful content
    if (!title && !content) {
      return;
    }

    const draftData = {
      title,
      subtitle,
      slug,
      content,
      excerpt,
      categoryId,
      reporterId,
      opinionAuthorId,
      articleType,
      imageUrl,
      thumbnailUrl,
      imageFocalPoint,
      keywords,
      newsType,
      publishType,
      scheduledAt,
      hideFromHomepage,
      metaTitle,
      metaDescription,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(autoSaveKey, JSON.stringify(draftData));
      setAutoSaveStatus("saved");
      setLastAutoSaveTime(new Date());
      console.log('[Auto-save] Draft saved to localStorage');
    } catch (error) {
      console.error('[Auto-save] Failed to save draft:', error);
    }
  }, [
    autoSaveKey, title, subtitle, slug, content, excerpt, categoryId, 
    reporterId, opinionAuthorId, articleType, imageUrl, thumbnailUrl, 
    imageFocalPoint, keywords, newsType, publishType, scheduledAt, 
    hideFromHomepage, metaTitle, metaDescription
  ]);

  // Function to clear draft from localStorage
  const clearDraftFromLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(autoSaveKey);
      console.log('[Auto-save] Draft cleared from localStorage');
    } catch (error) {
      console.error('[Auto-save] Failed to clear draft:', error);
    }
  }, [autoSaveKey]);

  // Function to restore draft from localStorage
  const restoreDraftFromLocalStorage = useCallback((draft: any) => {
    if (draft.title) setTitle(draft.title);
    if (draft.subtitle) setSubtitle(draft.subtitle);
    if (draft.slug) setSlug(draft.slug);
    if (draft.content) setContent(draft.content);
    if (draft.excerpt) setExcerpt(draft.excerpt);
    if (draft.categoryId) setCategoryId(draft.categoryId);
    if (draft.reporterId !== undefined) setReporterId(draft.reporterId);
    if (draft.opinionAuthorId !== undefined) setOpinionAuthorId(draft.opinionAuthorId);
    if (draft.articleType) setArticleType(draft.articleType);
    if (draft.imageUrl) setImageUrl(draft.imageUrl);
    if (draft.thumbnailUrl) setThumbnailUrl(draft.thumbnailUrl);
    if (draft.imageFocalPoint) setImageFocalPoint(draft.imageFocalPoint);
    if (draft.keywords) setKeywords(draft.keywords);
    if (draft.newsType) setNewsType(draft.newsType);
    if (draft.publishType) setPublishType(draft.publishType);
    if (draft.scheduledAt) setScheduledAt(draft.scheduledAt);
    if (draft.hideFromHomepage !== undefined) setHideFromHomepage(draft.hideFromHomepage);
    if (draft.metaTitle) setMetaTitle(draft.metaTitle);
    if (draft.metaDescription) setMetaDescription(draft.metaDescription);
    
    toast({
      title: "تم استعادة المسودة",
      description: "تم استعادة المحتوى المحفوظ تلقائياً",
    });
  }, [toast]);

  // Check for saved draft on mount (only for new articles or after article is loaded)
  useEffect(() => {
    // For new articles, check immediately
    // For existing articles, wait until the article is loaded
    if (isNewArticle || hasLoadedArticleRef.current) {
      try {
        const savedDraft = localStorage.getItem(autoSaveKey);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          const savedTime = new Date(draft.savedAt);
          const now = new Date();
          const hoursSinceSave = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
          
          // Only offer to restore if saved within last 24 hours
          if (hoursSinceSave < 24) {
            // For new articles, always show recovery dialog if there's content
            // For existing articles, only show if draft has more content than current article
            if (isNewArticle) {
              if (draft.title || draft.content) {
                setRecoveredDraft(draft);
                setShowDraftRecoveryDialog(true);
              }
            } else if (article) {
              // Check if draft has significant changes from saved article
              const hasDraftChanges = 
                (draft.content && draft.content !== article.content) ||
                (draft.title && draft.title !== article.title);
              
              if (hasDraftChanges) {
                setRecoveredDraft(draft);
                setShowDraftRecoveryDialog(true);
              }
            }
          } else {
            // Draft is too old, clear it
            clearDraftFromLocalStorage();
          }
        }
      } catch (error) {
        console.error('[Auto-save] Failed to check for saved draft:', error);
      }
    }
  }, [autoSaveKey, isNewArticle, article, clearDraftFromLocalStorage]);

  // Auto-save effect - save every 30 seconds when there are changes
  useEffect(() => {
    // Don't auto-save while loading or if nothing has been typed
    if (!title && !content) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set status to indicate pending save
    setAutoSaveStatus("saving");

    // Set new timeout to save after 5 seconds of inactivity
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraftToLocalStorage();
    }, 5000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    title, subtitle, content, excerpt, categoryId, articleType, 
    imageUrl, thumbnailUrl, keywords, newsType, metaTitle, metaDescription,
    saveDraftToLocalStorage
  ]);

  // Helper function to save uploaded images to media library (memoized to prevent duplicate uploads)
  const saveToMediaLibrary = useCallback(async (imageUrl: string): Promise<string | null> => {
    // If already saving this specific URL, return the existing promise
    const existingPromise = savingMediaMapRef.current.get(imageUrl);
    if (existingPromise) {
      console.log("[Media Library] Already saving this URL, returning existing promise");
      return existingPromise;
    }
    
    // Create new promise for this URL
    const savePromise = (async () => {
      try {
        const fileName = imageUrl.split('/').pop() || 'image.jpg';
        const mediaTitle = title || "صورة المقال";
        const description = (excerpt || content.substring(0, 100) || mediaTitle);
        
        const mediaFile = await apiRequest("/api/media/save-existing", {
          method: "POST",
          body: JSON.stringify({
            fileName,
            url: imageUrl,
            title: mediaTitle,
            description,
            category: "articles",
          }),
          headers: { "Content-Type": "application/json" },
        }) as MediaFile;
        
        console.log("[Media Library] Successfully saved image to library:", fileName, "ID:", mediaFile.id);
        return mediaFile.id;
      } catch (error) {
        console.error("Failed to save to media library:", error);
        // Don't show error to user - this is background operation
        return null;
      } finally {
        // Clear this URL's promise after completion
        savingMediaMapRef.current.delete(imageUrl);
      }
    })();
    
    // Store promise for potential concurrent callers of the same URL
    savingMediaMapRef.current.set(imageUrl, savePromise);
    return savePromise;
  }, [title, excerpt, content]);
  
  // Helper to fetch media ID from media library based on URL
  useEffect(() => {
    const fetchMediaIdForUrl = async (url: string, requestToken: number) => {
      try {
        const response = await apiRequest(`/api/media?url=${encodeURIComponent(url)}`, {
          method: "GET",
        }) as any;
        
        if (response && response.length > 0) {
          const media = response[0];
          
          // Only update state if this is still the current request
          if (imageRequestTokenRef.current === requestToken) {
            setHeroImageMediaId(media.id);
            console.log("[Media ID] Found media ID for URL:", media.id);
          } else {
            console.log("[Media ID] Discarding stale response - image changed");
          }
        } else {
          console.log("[Media ID] No media file found for URL, auto-saving to library...");
          // Auto-save image to media library if not found
          const mediaId = await saveToMediaLibrary(url);
          
          // Only update state if this is still the current request
          if (mediaId && imageRequestTokenRef.current === requestToken) {
            setHeroImageMediaId(mediaId);
            console.log("[Media ID] Auto-saved to library with ID:", mediaId);
          } else if (mediaId) {
            console.log("[Media ID] Discarding stale auto-save - image changed");
          } else {
            console.error("[Media ID] Failed to auto-save to library");
            
            // Only update state if this is still the current request
            if (imageRequestTokenRef.current === requestToken) {
              setHeroImageMediaId(null);
            }
          }
        }
      } catch (error) {
        console.error("[Media ID] Failed to fetch media ID:", error);
        
        // Only update state if this is still the current request
        if (imageRequestTokenRef.current === requestToken) {
          setHeroImageMediaId(null);
        }
      }
    };
    
    if (imageUrl && !heroImageMediaId && !isNewArticle) {
      // Increment token to invalidate any in-flight requests
      imageRequestTokenRef.current += 1;
      const currentToken = imageRequestTokenRef.current;
      
      fetchMediaIdForUrl(imageUrl, currentToken);
    }
  }, [imageUrl, heroImageMediaId, isNewArticle, saveToMediaLibrary]);

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

      // Auto-save to media library in background and save media ID
      const mediaId = await saveToMediaLibrary(aclData.objectPath);
      if (mediaId) {
        setHeroImageMediaId(mediaId);
      }

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
        thumbnailUrl: thumbnailUrl || "",
        thumbnailManuallyDeleted: thumbnailManuallyDeleted,
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

  // Clear draft after successful save to server
  useEffect(() => {
    if (saveArticleMutation.isSuccess) {
      clearDraftFromLocalStorage();
    }
  }, [saveArticleMutation.isSuccess, clearDraftFromLocalStorage]);

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      // Validation
      if (!content) {
        throw new Error("يجب إدخال المحتوى أولاً");
      }
      
      if (content.length < 100) {
        throw new Error("المحتوى يجب أن يكون 100 حرف على الأقل");
      }
      
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
        body: JSON.stringify({ content, language: "ar" }),
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
      // Validation
      if (!title || !content) {
        throw new Error("يجب إدخال العنوان والمحتوى أولاً");
      }
      
      if (title.length < 10) {
        throw new Error("العنوان يجب أن يكون 10 أحرف على الأقل");
      }
      
      if (content.length < 100) {
        throw new Error("المحتوى يجب أن يكون 100 حرف على الأقل");
      }
      
      setIsClassifying(true);
      
      // If editing existing article, use old endpoint
      if (!isNewArticle && id) {
        console.log('[Classification] Using saved endpoint for existing article:', id);
        return await apiRequest(`/api/articles/${id}/auto-categorize`, {
          method: "POST",
        });
      }
      
      // If new article, use draft endpoint (no save to DB)
      console.log('[Classification] Using draft endpoint for new article');
      return await apiRequest(`/api/articles/auto-classify-draft`, {
        method: "POST",
        body: JSON.stringify({
          title,
          content,
          language: "ar",
        }),
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
      setCategoryId(data.primaryCategory.categoryId);
      
      const suggestedText = data.suggestedCategories?.length > 0
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateSeoMutation = useMutation({
    mutationFn: async () => {
      // Validation
      if (!title || !content) {
        throw new Error("يجب إدخال العنوان والمحتوى أولاً");
      }
      
      if (title.length < 10) {
        throw new Error("العنوان يجب أن يكون 10 أحرف على الأقل");
      }
      
      if (content.length < 100) {
        throw new Error("المحتوى يجب أن يكون 100 حرف على الأقل");
      }
      
      // If editing existing article, use saved mode
      if (!isNewArticle && id) {
        console.log('[SEO] Using saved mode for existing article:', id);
        return await apiRequest(`/api/seo/generate`, {
          method: "POST",
          body: JSON.stringify({
            mode: "saved",
            articleId: id,
            language: "ar"
          }),
        });
      }
      
      // If new article, use draft mode (no save to DB)
      console.log('[SEO] Using draft mode for new article');
      return await apiRequest(`/api/seo/generate`, {
        method: "POST",
        body: JSON.stringify({
          mode: "draft",
          draftData: {
            title,
            content,
            excerpt: excerpt || undefined,
          },
          language: "ar"
        }),
      });
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
      // Auto-fill SEO fields
      if (data.seo) {
        setMetaTitle(data.seo.metaTitle);
        setMetaDescription(data.seo.metaDescription || "");
        setKeywords(data.seo.keywords || []);
      }
      
      // Only invalidate queries if editing existing article
      if (!isNewArticle && id) {
        queryClient.invalidateQueries({ queryKey: ['/api/articles', id] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/articles', id] });
      }
      
      toast({
        title: "تم توليد بيانات SEO",
        description: `تم إنشاء عنوان SEO ووصف وكلمات مفتاحية بواسطة ${data.provider}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في توليد SEO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateAllInOneMutation = useMutation({
    mutationFn: async () => {
      // Validation - Only require content (title will be generated!)
      if (!content) {
        throw new Error("يجب إدخال المحتوى أولاً");
      }
      
      if (content.length < 100) {
        throw new Error("المحتوى يجب أن يكون 100 حرف على الأقل");
      }
      
      console.log('[All-in-One AI] Starting comprehensive AI generation...');
      console.log('[All-in-One AI] Current title:', title || '(سيتم توليده)');
      
      // Execute all AI tools in PARALLEL for speed
      const [
        headlinesResult,
        classificationResult,
        seoResult,
        summaryResult,
      ] = await Promise.all([
        // 1. Headline Suggestions (will generate title from content)
        (async () => {
          try {
            console.log('[All-in-One AI] 1️⃣ Generating headlines...');
            const result = await apiRequest("/api/ai/generate-titles", {
              method: "POST",
              body: JSON.stringify({ content, language: "ar" }),
            });
            console.log('[All-in-One AI] ✅ Headlines result:', result);
            return result;
          } catch (err: any) {
            console.error('[All-in-One AI] ❌ Headlines failed:', err);
            console.error('[All-in-One AI] Error details:', err.message, err.status);
            return { titles: [] };
          }
        })(),
        
        // 2. Smart Classification (use generated title or placeholder)
        (async () => {
          try {
            console.log('[All-in-One AI] 2️⃣ Classifying article...');
            const effectiveTitle = title || "عنوان مؤقت";
            const result = !isNewArticle && id
              ? await apiRequest(`/api/articles/${id}/auto-categorize`, { method: "POST" })
              : await apiRequest(`/api/articles/auto-classify-draft`, {
                  method: "POST",
                  body: JSON.stringify({ title: effectiveTitle, content, language: "ar" }),
                });
            console.log('[All-in-One AI] ✅ Classification result:', result);
            return result;
          } catch (err: any) {
            console.error('[All-in-One AI] ❌ Classification failed:', err);
            console.error('[All-in-One AI] Error details:', err.message, err.status);
            return null;
          }
        })(),
        
        // 3. SEO Generator (use generated title or placeholder)
        (async () => {
          try {
            console.log('[All-in-One AI] 3️⃣ Generating SEO...');
            const effectiveTitle = title || "عنوان مؤقت";
            const result = !isNewArticle && id
              ? await apiRequest(`/api/seo/generate`, {
                  method: "POST",
                  body: JSON.stringify({ mode: "saved", articleId: id, language: "ar" }),
                })
              : await apiRequest(`/api/seo/generate`, {
                  method: "POST",
                  body: JSON.stringify({
                    mode: "draft",
                    draftData: { title: effectiveTitle, content, excerpt: excerpt || undefined },
                    language: "ar"
                  }),
                });
            console.log('[All-in-One AI] ✅ SEO result:', result);
            return result;
          } catch (err: any) {
            console.error('[All-in-One AI] ❌ SEO failed:', err);
            console.error('[All-in-One AI] Error details:', err.message, err.status);
            return null;
          }
        })(),
        
        // 4. Smart Summary
        (async () => {
          try {
            console.log('[All-in-One AI] 4️⃣ Generating summary...');
            const result = await apiRequest("/api/ai/summarize", {
              method: "POST",
              body: JSON.stringify({ content }),
            });
            console.log('[All-in-One AI] ✅ Summary result:', result);
            return result;
          } catch (err: any) {
            console.error('[All-in-One AI] ❌ Summary failed:', err);
            console.error('[All-in-One AI] Error details:', err.message, err.status);
            return { summary: "" };
          }
        })(),
      ]);
      
      return {
        headlines: headlinesResult,
        classification: classificationResult,
        seo: seoResult,
        summary: summaryResult,
      };
    },
    onSuccess: (data) => {
      console.log('[All-in-One AI] Results:', data);
      
      let successCount = 0;
      let failCount = 0;
      const details: string[] = [];
      
      // Apply Headlines (if available)
      if (data.headlines?.titles?.length > 0) {
        const firstHeadline = data.headlines.titles[0];
        setTitle(firstHeadline);
        setSlug(generateSlug(firstHeadline));
        successCount++;
        details.push(`✓ عنوان: ${firstHeadline.substring(0, 30)}...`);
      } else {
        failCount++;
      }
      
      // Apply Classification (if available)
      if (data.classification?.primaryCategory) {
        setCategoryId(data.classification.primaryCategory.categoryId);
        successCount++;
        details.push(`✓ تصنيف: ${data.classification.primaryCategory.categoryName}`);
      } else {
        failCount++;
      }
      
      // Apply SEO (if available)
      if (data.seo?.seo) {
        setMetaTitle(data.seo.seo.metaTitle);
        setMetaDescription(data.seo.seo.metaDescription || "");
        setKeywords(data.seo.seo.keywords || []);
        successCount++;
        details.push(`✓ SEO: تم توليد البيانات`);
      } else {
        failCount++;
      }
      
      // Apply Summary (if available)
      if (data.summary?.summary) {
        setExcerpt(data.summary.summary);
        successCount++;
        details.push(`✓ موجز: ${data.summary.summary.substring(0, 30)}...`);
      } else {
        failCount++;
      }
      
      // Show comprehensive toast
      toast({
        title: `✨ توليد ذكي شامل (${successCount}/${successCount + failCount})`,
        description: details.join("\n"),
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('[All-in-One AI] Critical error:', error);
      toast({
        title: "خطأ في التوليد الشامل",
        description: error.message || "فشل في التوليد الذكي",
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

  // Generate Social Media Cards mutation
  const generateSocialCardsMutation = useMutation({
    mutationFn: async () => {
      if (!id || isNewArticle) {
        throw new Error("يجب حفظ المقال أولاً قبل توليد البطاقات");
      }
      
      console.log('[Social Cards] Starting generation for article:', id);
      setIsGeneratingSocialCards(true);
      
      const requestBody = {
        articleId: id,
        articleTitle: title || "عنوان المقال",
        articleSummary: excerpt || metaDescription || subtitle || "ملخص المقال",
        category: categories.find(c => c.id === categoryId)?.nameAr || "أخبار",
        language: "ar",
        platform: "all"
      };
      
      console.log('[Social Cards] Request body:', requestBody);
      
      try {
        const response = await apiRequest(`/api/visual-ai/generate-social-cards`, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        
        console.log('[Social Cards] Response:', response);
        return response;
      } catch (error) {
        console.error('[Social Cards] API Error:', error);
        setIsGeneratingSocialCards(false);
        throw error;
      }
    },
    onSuccess: (data: {
      cards?: {
        twitter?: string;
        instagram?: string;
        facebook?: string;
        whatsapp?: string;
      };
      message?: string;
    }) => {
      console.log('[Social Cards] Success:', data);
      setIsGeneratingSocialCards(false);
      
      if (data.cards) {
        const generatedPlatforms = Object.keys(data.cards).filter(key => data.cards![key as keyof typeof data.cards]);
        
        toast({
          title: "تم توليد بطاقات السوشال ميديا",
          description: `تم توليد ${generatedPlatforms.length} بطاقات بنجاح للمنصات: ${generatedPlatforms.join(', ')}`,
        });
      } else {
        toast({
          title: "تم بدء عملية التوليد",
          description: data.message || "جاري معالجة الطلب...",
        });
      }
    },
    onError: (error: Error) => {
      console.error('[Social Cards] Mutation Error:', error);
      setIsGeneratingSocialCards(false);
      toast({
        title: "خطأ في توليد البطاقات",
        description: error.message || "فشل في توليد بطاقات السوشال ميديا",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Ensure loading state is always reset
      setIsGeneratingSocialCards(false);
    }
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

  const handleApplyInfographicSuggestions = (suggestions: any) => {
    // Apply title and subtitle
    if (suggestions.title) {
      setTitle(suggestions.title);
    }
    
    if (suggestions.subtitle) {
      setSubtitle(suggestions.subtitle);
    }
    
    // Apply keywords
    if (suggestions.keywords && Array.isArray(suggestions.keywords)) {
      setKeywords(suggestions.keywords);
    }
    
    // Apply description or bullet points to content or excerpt
    if (suggestions.description) {
      // If content is empty, set it, otherwise append to excerpt
      if (!content || content.trim() === '') {
        setContent(suggestions.description);
      } else {
        setExcerpt(suggestions.description);
      }
    }
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

  const handleGenerateAllInOne = () => {
    // Only require content (title will be generated!)
    if (!content) {
      toast({
        title: "تنبيه",
        description: "يجب كتابة المحتوى أولاً",
        variant: "destructive",
      });
      return;
    }
    
    if (content.length < 100) {
      toast({
        title: "تنبيه",
        description: "المحتوى يجب أن يكون 100 حرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    generateAllInOneMutation.mutate();
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

  // Create media asset caption
  const createCaptionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/articles/${article?.id}/media-assets`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "تم إضافة التعريف بنجاح" });
      refetchMediaAssets();
    },
    onError: () => {
      toast({ title: "فشل في إضافة التعريف", variant: "destructive" });
    },
  });

  // Update media asset caption
  const updateCaptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/media-assets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "تم تحديث التعريف بنجاح" });
      refetchMediaAssets();
    },
    onError: () => {
      toast({ title: "فشل في تحديث التعريف", variant: "destructive" });
    },
  });

  // Delete media asset caption
  const deleteCaptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/media-assets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({ title: "تم حذف التعريف بنجاح" });
      refetchMediaAssets();
    },
    onError: () => {
      toast({ title: "فشل في حذف التعريف", variant: "destructive" });
    },
  });

  const isSaving = saveArticleMutation.isPending;
  const isGeneratingAI = 
    generateSummaryMutation.isPending || 
    generateTitlesMutation.isPending || 
    generateSmartContentMutation.isPending ||
    generateAllInOneMutation.isPending ||
    generateSeoMutation.isPending ||
    autoClassifyMutation.isPending;

  return (
    <DashboardLayout>
      {/* Draft Recovery Dialog */}
      <AlertDialog open={showDraftRecoveryDialog} onOpenChange={setShowDraftRecoveryDialog}>
        <AlertDialogContent className="max-w-md" data-testid="dialog-draft-recovery">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-right">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              استعادة المسودة المحفوظة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {recoveredDraft && (
                <div className="space-y-2">
                  <p>تم العثور على مسودة محفوظة تلقائياً:</p>
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    {recoveredDraft.title && (
                      <p><strong>العنوان:</strong> {recoveredDraft.title.substring(0, 50)}...</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      <Clock className="h-3 w-3 inline ml-1" />
                      {new Date(recoveredDraft.savedAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <p className="text-amber-600 dark:text-amber-400 text-sm">
                    هل تريد استعادة هذه المسودة أم تجاهلها؟
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={() => {
                if (recoveredDraft) {
                  restoreDraftFromLocalStorage(recoveredDraft);
                }
                setShowDraftRecoveryDialog(false);
              }}
              className="gap-2"
              data-testid="button-restore-draft"
            >
              <RotateCcw className="h-4 w-4" />
              استعادة المسودة
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => {
                clearDraftFromLocalStorage();
                setShowDraftRecoveryDialog(false);
              }}
              className="gap-2"
              data-testid="button-discard-draft"
            >
              <Trash2 className="h-4 w-4" />
              تجاهل
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {/* Auto-save indicator */}
            {(autoSaveStatus === "saving" || autoSaveStatus === "saved") && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="autosave-indicator">
                {autoSaveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>جاري الحفظ التلقائي...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>تم الحفظ التلقائي</span>
                    {lastAutoSaveTime && (
                      <span className="text-muted-foreground/60">
                        ({lastAutoSaveTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
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
                <div className="flex items-center justify-between">
                  <CardTitle>العنوان الرئيسي</CardTitle>
                  {isInfographic && (
                    <InfographicAiDialog
                      content={content}
                      title={title}
                      category={categories?.find(c => c.id === categoryId)?.nameAr}
                      onApplySuggestions={handleApplyInfographicSuggestions}
                    />
                  )}
                </div>
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
                  onSlugChange={setSlug}
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
                  <Button
                    variant="outline"
                    onClick={() => setShowAIImageDialog(true)}
                    className="gap-2"
                    data-testid="button-generate-ai-image"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    توليد بالذكاء الاصطناعي
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInfographicDialog(true)}
                    className="gap-2"
                    data-testid="button-generate-infographic"
                  >
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    إنفوجرافيك
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowStoryCardsDialog(true)}
                    className="gap-2"
                    data-testid="button-generate-story-cards"
                  >
                    <Layers className="h-4 w-4 text-primary" />
                    قصص مصورة
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {/* Delete Image Button - Show only when there's an image */}
                {imageUrl && (
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setImageUrl("");
                        setThumbnailUrl("");
                        setHeroImageMediaId(null);
                        setImageFocalPoint(null);
                        toast({
                          title: "تم حذف الصورة",
                          description: "تم حذف الصورة البارزة بنجاح",
                        });
                      }}
                      className="gap-2"
                      data-testid="button-delete-image"
                    >
                      <X className="h-4 w-4" />
                      حذف الصورة
                    </Button>
                  </div>
                )}
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
            
            {/* Auto Image Generation */}
            <AutoImageGenerator
              articleId={id}
              title={title}
              content={content}
              excerpt={excerpt}
              category={categories.find(c => c.id === categoryId)?.nameAr}
              language="ar"
              articleType={articleType}
              hasImage={!!imageUrl}
              onImageGenerated={(url, altText) => {
                setImageUrl(url);
                // Update alt text in SEO if needed
                toast({
                  title: "تم توليد الصورة بنجاح",
                  description: `${altText}`,
                });
              }}
            />
            
            {/* Thumbnail Generation */}
            {imageUrl && (
              <ThumbnailGenerator
                articleId={id}
                imageUrl={imageUrl}
                thumbnailUrl={thumbnailUrl}
                thumbnailManuallyDeleted={thumbnailManuallyDeleted}
                articleTitle={title}
                articleExcerpt={excerpt}
                onThumbnailGenerated={(url, manuallyDeleted) => {
                  setThumbnailUrl(url);
                  if (manuallyDeleted !== undefined) {
                    setThumbnailManuallyDeleted(manuallyDeleted);
                  }
                }}
              />
            )}

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>محتوى المقال</span>
                  {/* All-in-One AI Button */}
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleGenerateAllInOne}
                      disabled={isGeneratingAI || !content || content.length < 100}
                      className="gap-2"
                      data-testid="button-generate-all-in-one"
                      title={
                        !content 
                          ? "يجب كتابة المحتوى أولاً (100+ حرف)"
                          : content.length < 100
                          ? `المحتوى قصير جداً (${content.length}/100 حرف)`
                          : "توليد جميع التوليدات الذكية دفعة واحدة: العناوين، التصنيف، SEO، والموجز"
                      }
                    >
                      {generateAllInOneMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      توليد ذكي شامل
                    </Button>
                    {(!content || content.length < 100) && (
                      <span className="text-xs text-muted-foreground">
                        {!content 
                          ? "يجب كتابة المحتوى أولاً"
                          : `المحتوى: ${content.length}/100 حرف`
                        }
                      </span>
                    )}
                  </div>
                </CardTitle>
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
              <CardContent className="space-y-4">
                <Select 
                  value={isInfographic ? previousArticleType : articleType} 
                  onValueChange={(value: any) => {
                    setArticleType(value);
                    setPreviousArticleType(value);
                  }}
                  disabled={isInfographic}
                >
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
                
                {/* Infographic Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <Label htmlFor="infographic-toggle" className="cursor-pointer">
                      <div className="font-medium">إنفوجرافيك</div>
                      <div className="text-xs text-muted-foreground">
                        تصنيف المحتوى كإنفوجرافيك مصور
                      </div>
                    </Label>
                  </div>
                  <Switch
                    id="infographic-toggle"
                    checked={isInfographic}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Save current type before switching to infographic
                        if (articleType !== "infographic") {
                          setPreviousArticleType(articleType as "news" | "opinion" | "analysis" | "column");
                        }
                        setArticleType("infographic");
                      } else {
                        // Restore previous type when unchecked
                        setArticleType(previousArticleType);
                      }
                      setIsInfographic(checked);
                    }}
                    data-testid="switch-infographic"
                  />
                </div>
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
                    disabled={isClassifying || !title || !content}
                    title={!title || !content ? "يجب إدخال العنوان والمحتوى أولاً" : "تصنيف ذكي بالذكاء الاصطناعي"}
                    data-testid="button-auto-classify"
                  >
                    <Sparkles className={`h-4 w-4 ml-1 ${isClassifying ? 'text-muted-foreground animate-pulse' : 'text-primary'}`} />
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
                    disabled={generateSeoMutation.isPending || !title || !content}
                    title={!title || !content ? "يجب إدخال العنوان والمحتوى أولاً" : "توليد SEO ذكي بالذكاء الاصطناعي"}
                    data-testid="button-generate-seo"
                  >
                    <Sparkles className={`h-4 w-4 ml-1 ${generateSeoMutation.isPending ? 'text-muted-foreground animate-pulse' : 'text-primary'}`} />
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="seo">الحقول</TabsTrigger>
                    <TabsTrigger value="preview">المعاينة</TabsTrigger>
                    {!isNewArticle && (
                      <TabsTrigger value="media-captions">
                        <ImageIcon className="h-4 w-4 ml-2" />
                        تعريفات الصور
                      </TabsTrigger>
                    )}
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
                    
                    {/* Social Media Cards Generation Button */}
                    {!isNewArticle && (
                      <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">توليد بطاقات السوشال ميديا</p>
                          <p className="text-xs text-muted-foreground">
                            إنشاء بطاقات مُحسّنة لـ Twitter, Instagram, Facebook و WhatsApp
                          </p>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => generateSocialCardsMutation.mutate()}
                          disabled={isGeneratingSocialCards || !id}
                          data-testid="button-generate-social-cards"
                        >
                          {isGeneratingSocialCards ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              جاري التوليد...
                            </>
                          ) : (
                            <>
                              <Share2 className="h-4 w-4 ml-2" />
                              توليد البطاقات
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

                  {!isNewArticle && (
                    <TabsContent value="media-captions" className="space-y-4">
                      {/* Current Hero Image */}
                      {imageUrl && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base">الصورة الرئيسية</Label>
                            <Badge variant="secondary">Hero Image</Badge>
                          </div>
                          <img 
                            src={imageUrl} 
                            alt="Hero" 
                            className="w-full max-w-md rounded-md border" 
                            data-testid="img-hero-caption-preview"
                          />
                          
                          {/* Caption Form for Hero Image */}
                          <ImageCaptionForm
                            imageUrl={imageUrl}
                            mediaFileId={heroImageMediaId}
                            articleId={article?.id}
                            locale="ar"
                            displayOrder={0}
                            existingCaption={mediaAssets.find((asset: any) => asset.displayOrder === 0)}
                            onSave={(data) => {
                              const existingCaption = mediaAssets.find((asset: any) => asset.displayOrder === 0);
                              if (existingCaption?.id) {
                                updateCaptionMutation.mutate({ id: existingCaption.id, data });
                              } else {
                                createCaptionMutation.mutate({ ...data, displayOrder: 0 });
                              }
                            }}
                            onDelete={(id) => deleteCaptionMutation.mutate(id)}
                          />
                        </div>
                      )}
                      
                      {/* Info Message */}
                      {!imageUrl && (
                        <div className="text-center py-8 text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>قم بإضافة صورة رئيسية للمقال أولاً</p>
                        </div>
                      )}
                    </TabsContent>
                  )}
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
          // Save media ID for caption creation
          setHeroImageMediaId(media.id);
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

      {/* AI Image Generator Dialog for Featured Image */}
      <AIImageGeneratorDialog
        open={showAIImageDialog}
        onClose={() => setShowAIImageDialog(false)}
        onImageGenerated={(generatedUrl, alt) => {
          // Set the generated image as the featured image
          setImageUrl(generatedUrl);
          setShowAIImageDialog(false);
          toast({
            title: "تم توليد الصورة البارزة",
            description: "تم إضافة الصورة المولدة بالذكاء الاصطناعي كصورة بارزة للمقال",
          });
        }}
        initialPrompt={title ? `صورة بارزة احترافية لمقال بعنوان: ${title}` : ""}
      />

      {/* Infographic Generator Dialog */}
      <InfographicGeneratorDialog
        open={showInfographicDialog}
        onClose={() => setShowInfographicDialog(false)}
        onImageGenerated={(generatedUrl, altText) => {
          // Set the generated infographic as the featured image
          setImageUrl(generatedUrl);
          setShowInfographicDialog(false);
          toast({
            title: "تم توليد الإنفوجرافيك!",
            description: "تم إضافة الإنفوجرافيك كصورة بارزة للمقال",
          });
        }}
        initialContent={content ? 
          // Extract key points from article content for infographic
          content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .substring(0, 500) // Take first 500 chars
          : title || ""
        }
        language="ar"
      />

      {/* Story Cards Generator Dialog */}
      {showStoryCardsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">إنشاء القصص المصورة</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStoryCardsDialog(false)}
                data-testid="button-close-story-cards"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <StoryCardsGenerator
              articleId={article?.id || "new"}
              articleTitle={title}
              articleContent={content}
              articleCategory={
                categories.find(c => c.id === categoryId)?.nameAr || "أخبار"
              }
              articleImage={imageUrl}
              articleAuthor={
                reporterId || 
                opinionAuthorId || 
                "سبق"
              }
              onComplete={() => {
                setShowStoryCardsDialog(false);
                toast({
                  title: "تم إنشاء القصص المصورة",
                  description: "تمت إضافة القصص المصورة للمقال بنجاح",
                });
              }}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ImageCaptionForm Component
interface ImageCaptionFormProps {
  imageUrl: string;
  mediaFileId: string | null;
  articleId?: string;
  locale: string;
  displayOrder: number;
  existingCaption?: any;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
}

function ImageCaptionForm({
  imageUrl,
  mediaFileId,
  articleId,
  locale,
  displayOrder,
  existingCaption,
  onSave,
  onDelete,
}: ImageCaptionFormProps) {
  const [altText, setAltText] = useState(existingCaption?.altText || "");
  const [captionPlain, setCaptionPlain] = useState(existingCaption?.captionPlain || "");
  const [sourceName, setSourceName] = useState(existingCaption?.sourceName || "");
  const [sourceUrl, setSourceUrl] = useState(existingCaption?.sourceUrl || "");
  const [keywordTags, setKeywordTags] = useState<string[]>(existingCaption?.keywordTags || []);
  
  const { toast } = useToast();
  
  const handleSave = () => {
    if (!altText) {
      toast({ title: "نص بديل مطلوب", variant: "destructive" });
      return;
    }
    
    if (!mediaFileId) {
      toast({ 
        title: "خطأ", 
        description: "لم يتم العثور على معرّف الصورة. يرجى إعادة اختيار الصورة.",
        variant: "destructive" 
      });
      return;
    }
    
    onSave({
      mediaFileId,
      locale,
      altText,
      captionPlain: captionPlain || null,
      sourceName: sourceName || null,
      sourceUrl: sourceUrl || null,
      keywordTags: keywordTags.length > 0 ? keywordTags : null,
      displayOrder,
    });
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-md">
      {/* Alt Text */}
      <div className="space-y-2">
        <Label htmlFor="altText">النص البديل (مطلوب لـ SEO) *</Label>
        <Input
          id="altText"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="وصف دقيق للصورة..."
          required
          data-testid="input-caption-alt-text"
        />
      </div>
      
      {/* Caption */}
      <div className="space-y-2">
        <Label htmlFor="captionPlain">التعريف النصي</Label>
        <Textarea
          id="captionPlain"
          value={captionPlain}
          onChange={(e) => setCaptionPlain(e.target.value)}
          placeholder="تعريف يظهر أسفل الصورة..."
          rows={3}
          data-testid="textarea-caption-plain"
        />
      </div>
      
      {/* Source */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sourceName">اسم المصدر</Label>
          <Input
            id="sourceName"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="وكالة الأنباء..."
            data-testid="input-caption-source-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sourceUrl">رابط المصدر</Label>
          <Input
            id="sourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            data-testid="input-caption-source-url"
          />
        </div>
      </div>
      
      {/* Keywords */}
      <div className="space-y-2">
        <Label>الكلمات المفتاحية (اختياري)</Label>
        <TagInput
          tags={keywordTags}
          onTagsChange={setKeywordTags}
          placeholder="أضف كلمات مفتاحية..."
        />
      </div>
      
      {/* Actions */}
      <div className="flex justify-between items-center pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!altText}
          data-testid="button-save-caption"
        >
          <Save className="h-4 w-4 ml-2" />
          {existingCaption ? "تحديث التعريف" : "حفظ التعريف"}
        </Button>
        
        {existingCaption && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => onDelete(existingCaption.id)}
            data-testid="button-delete-caption"
          >
            حذف التعريف
          </Button>
        )}
      </div>
    </div>
  );
}
