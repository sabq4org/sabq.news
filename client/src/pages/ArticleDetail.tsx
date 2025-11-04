import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { CommentSection } from "@/components/CommentSection";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import { AIRecommendationsBlock } from "@/components/AIRecommendationsBlock";
import { RelatedOpinionsSection } from "@/components/RelatedOpinionsSection";
import StoryTimeline from "@/components/StoryTimeline";
import FollowStoryButton from "@/components/FollowStoryButton";
import { ViewsCount } from "@/components/ViewsCount";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { ArticlePdfView } from "@/components/ArticlePdfView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";
import { useArticleReadTracking } from "@/hooks/useArticleReadTracking";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Heart,
  Bookmark,
  Share2,
  Clock,
  Sparkles,
  ChevronRight,
  Volume2,
  VolumeX,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails, CommentWithUser } from "@shared/schema";
import { useEffect, useState, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { logBehavior } = useBehaviorTracking();
  const [, setLocation] = useLocation();
  
  // Audio player state
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: article, isLoading } = useQuery<ArticleWithDetails>({
    queryKey: ["/api/articles", slug],
  });

  const { data: comments = [] } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/articles", slug, "comments"],
  });

  const { data: relatedArticles = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/articles", slug, "related"],
  });

  const { logArticleView } = useArticleReadTracking({
    articleId: article?.id || "",
    enabled: !!article && !!user,
  });

  useEffect(() => {
    if (article && user) {
      logArticleView();
    }
  }, [article?.id, user?.id]);

  // Add Schema.org JSON-LD for search engines and LLMs
  useEffect(() => {
    if (!article) return;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      },
      "headline": article.title,
      "description": article.excerpt || article.aiSummary || "",
      "image": article.imageUrl ? [article.imageUrl] : [],
      "datePublished": article.publishedAt,
      "dateModified": article.updatedAt,
      "author": {
        "@type": "Person",
        "name": article.author?.firstName && article.author?.lastName
          ? `${article.author.firstName} ${article.author.lastName}`
          : article.author?.email || "سبق",
        "url": article.staff?.slug ? `${window.location.origin}/reporter/${article.staff.slug}` : undefined
      },
      "publisher": {
        "@type": "Organization",
        "name": "صحيفة سبق",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/logo.png`
        }
      },
      "articleSection": article.category?.nameAr || "عام",
      "keywords": article.seo?.keywords?.join(", ") || "",
      "isAccessibleForFree": true,
      "inLanguage": "ar"
    };

    // Add script tag to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'article-structured-data';
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById('article-structured-data');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [article?.id]);

  // Add Open Graph and Twitter Cards meta tags
  useEffect(() => {
    if (!article) return;

    const seoTitle = article.seo?.metaTitle || article.title;
    const seoDescription = article.seo?.metaDescription || article.excerpt || article.aiSummary || "";
    const seoImage = article.imageUrl || `${window.location.origin}/og-image.png`;
    const seoUrl = window.location.href;

    // Store original values to restore on cleanup
    const originalValues = new Map<HTMLMetaElement, string>();
    const createdTags: HTMLMetaElement[] = [];

    // Create or update meta tags, tracking changes
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let tag = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      
      if (!tag) {
        // New tag - track it for removal on cleanup
        tag = document.createElement('meta');
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
        createdTags.push(tag);
      } else {
        // Existing tag - store original value for restoration
        originalValues.set(tag, tag.content);
      }
      
      tag.content = content;
      return tag;
    };

    // Open Graph Tags
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:title', seoTitle);
    updateMetaTag('og:description', seoDescription);
    updateMetaTag('og:image', seoImage);
    updateMetaTag('og:url', seoUrl);
    updateMetaTag('og:site_name', 'صحيفة سبق الإلكترونية');
    updateMetaTag('og:locale', 'ar_SA');

    if (article.publishedAt) {
      updateMetaTag('article:published_time', new Date(article.publishedAt).toISOString());
    }
    if (article.updatedAt) {
      updateMetaTag('article:modified_time', new Date(article.updatedAt).toISOString());
    }
    if (article.category?.nameAr) {
      updateMetaTag('article:section', article.category.nameAr);
    }

    // Twitter Cards
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', seoTitle, true);
    updateMetaTag('twitter:description', seoDescription, true);
    updateMetaTag('twitter:image', seoImage, true);

    // SEO Meta Tags
    updateMetaTag('description', seoDescription, true);

    if (article.seo?.keywords && article.seo.keywords.length > 0) {
      updateMetaTag('keywords', article.seo.keywords.join(', '), true);
    }

    // Cleanup on unmount - restore original values or remove created tags
    return () => {
      // Remove newly created tags
      createdTags.forEach(tag => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });
      
      // Restore original values for existing tags
      originalValues.forEach((originalContent, tag) => {
        if (tag.parentNode) {
          tag.content = originalContent;
        }
      });
    };
  }, [article?.id, article?.seo]);

  const reactMutation = useMutation({
    mutationFn: async () => {
      if (!article) return;
      return await apiRequest(`/api/articles/${article.id}/react`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      if (article) {
        logBehavior("reaction_add", { articleId: article.id });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/articles", slug] });
    },
    onError: (error: Error) => {
      console.log("React mutation error:", error.message);
      if (isUnauthorizedError(error)) {
        toast({
          title: "تسجيل دخول مطلوب",
          description: "يجب تسجيل الدخول للتفاعل مع المقالات",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ",
          description: error.message || "فشل في التفاعل",
          variant: "destructive",
        });
      }
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!article) return;
      return await apiRequest(`/api/articles/${article.id}/bookmark`, {
        method: "POST",
      });
    },
    onSuccess: (result: any) => {
      if (article) {
        logBehavior(
          result?.isBookmarked ? "bookmark_add" : "bookmark_remove",
          { articleId: article.id }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["/api/articles", slug] });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث المقالات المحفوظة",
      });
    },
    onError: (error: Error) => {
      console.log("Bookmark mutation error:", error.message);
      if (isUnauthorizedError(error)) {
        toast({
          title: "تسجيل دخول مطلوب",
          description: "يجب تسجيل الدخول لحفظ المقالات",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ",
          description: error.message || "فشل في الحفظ",
          variant: "destructive",
        });
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      return await apiRequest(`/api/articles/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      if (article) {
        logBehavior("comment_create", { articleId: article.id });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/articles", slug, "comments"] });
      toast({
        title: "شكراً لمشاركتك",
        description: "سيتم مراجعة تعليقك من قبل فريق التحرير للتأكد من التزامه بمعايير المجتمع ونشره في أقرب وقت",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "تسجيل دخول مطلوب",
          description: "يجب تسجيل الدخول لإضافة تعليق",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ",
          description: error.message || "فشل في إضافة التعليق",
          variant: "destructive",
        });
      }
    },
  });

  const handleReact = async () => {
    reactMutation.mutate();
  };

  const handleBookmark = async () => {
    bookmarkMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || "",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share failed:", err);
      }
    }
  };

  const handleComment = async (content: string, parentId?: string) => {
    commentMutation.mutate({ content, parentId });
  };

  // Handle audio playback using ElevenLabs
  const handlePlayAudio = async () => {
    if (!article?.smartSummary && !article?.aiSummary && !article?.excerpt) {
      toast({
        title: "لا يوجد محتوى",
        description: "الموجز الذكي غير متوفر لهذا المقال",
        variant: "destructive",
      });
      return;
    }

    // If currently playing, stop playback
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to beginning
      setIsPlaying(false);
      return;
    }

    // If audio is already loaded but paused, resume playback
    if (audioRef.current && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error resuming audio:', error);
        toast({
          title: "خطأ",
          description: "فشل تشغيل الموجز الصوتي",
          variant: "destructive",
        });
      }
      return;
    }

    // Load and play new audio
    try {
      setIsLoadingAudio(true);
      
      // Add cache busting parameter to prevent browser from caching errors
      const timestamp = article?.updatedAt || new Date().toISOString();
      const audioUrl = `/api/articles/${slug}/summary-audio?v=${encodeURIComponent(timestamp)}`;
      
      // Create audio element
      audioRef.current = new Audio(audioUrl);
      
      // Add event listeners
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        toast({
          title: "خطأ",
          description: "فشل تشغيل الموجز الصوتي",
          variant: "destructive",
        });
        setIsPlaying(false);
        setIsLoadingAudio(false);
      });
      
      // Wait for audio to be ready, then play
      audioRef.current.addEventListener('canplaythrough', async () => {
        if (audioRef.current) {
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            setIsLoadingAudio(false);
          } catch (playError) {
            console.error('Error playing audio:', playError);
            toast({
              title: "خطأ",
              description: "فشل تشغيل الموجز الصوتي",
              variant: "destructive",
            });
            setIsLoadingAudio(false);
          }
        }
      }, { once: true }); // Only fire once
      
      // Start loading the audio
      audioRef.current.load();
    } catch (error) {
      console.error('Error loading audio:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الموجز الصوتي",
        variant: "destructive",
      });
      setIsLoadingAudio(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="w-full aspect-[16/9] mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">المقال غير موجود</h1>
            <p className="text-muted-foreground mb-8">
              عذراً، لم نتمكن من العثور على المقال المطلوب
            </p>
            <Button asChild>
              <Link href="/">
                <a>العودة للرئيسية</a>
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: arSA,
      })
    : null;

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'م';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-home">
              الرئيسية
            </Link>
            <ChevronRight className="h-4 w-4" />
            {article.category && (
              <>
                <Link href={`/?category=${article.category.id}`} className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-category">
                  {article.category.nameAr}
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground line-clamp-1">{article.title}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2 space-y-8">
            {/* Article Header */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {article.category && (
                  <Badge variant="default" data-testid="badge-article-category">
                    {article.category.icon} {article.category.nameAr}
                  </Badge>
                )}
                {article.aiGenerated && (
                  <Badge variant="secondary" className="gap-1" data-testid="badge-article-ai">
                    <Sparkles className="h-3 w-3" />
                    محتوى مُنشأ بالذكاء الاصطناعي
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" data-testid="text-article-title">
                {article.title}
              </h1>

              {/* Author & Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {article.author && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={article.author?.profileImageUrl || ""} 
                        alt={`${article.author?.firstName || ""} ${article.author?.lastName || ""}`.trim() || article.author?.email || ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(article.author?.firstName, article.author?.lastName, article.author?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {article.staff ? (
                        <Link 
                          href={`/reporter/${article.staff.slug}`} 
                          className="font-medium hover:text-primary transition-colors flex items-center gap-1" 
                          data-testid="link-reporter-profile"
                        >
                          <span data-testid="text-author-name">
                            {article.author?.firstName && article.author?.lastName
                              ? `${article.author.firstName} ${article.author.lastName}`
                              : article.author?.email}
                          </span>
                          {article.staff.isVerified && (
                            <CheckCircle2 className="h-4 w-4 text-primary inline" />
                          )}
                        </Link>
                      ) : (
                        <p className="font-medium" data-testid="text-author-name">
                          {article.author?.firstName && article.author?.lastName
                            ? `${article.author.firstName} ${article.author.lastName}`
                            : article.author?.email}
                        </p>
                      )}
                      {timeAgo && (
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator orientation="vertical" className="h-10" />

                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ViewsCount 
                      views={article.views}
                      iconClassName="h-4 w-4"
                    />
                    <span>مشاهدة</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {article.reactionsCount || 0}
                  </span>
                </div>
              </div>
            </header>

            <Separator />

            {/* Featured Image */}
            {article.imageUrl && (
              <div className="relative overflow-hidden rounded-lg bg-muted md:aspect-[16/9]">
                {/* Blurred background image - Desktop only */}
                <div 
                  className="hidden md:block absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${article.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(40px)',
                    transform: 'scale(1.1)',
                  }}
                />
                {/* Main image */}
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="relative w-full object-cover md:h-full md:object-contain z-10"
                  data-testid="img-article-featured"
                />
              </div>
            )}

            {/* Smart Summary */}
            {(article.aiSummary || article.excerpt) && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg text-primary">الموجز الذكي</h3>
                  </div>
                  <Button
                    variant={isPlaying ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={handlePlayAudio}
                    disabled={isLoadingAudio}
                    data-testid="button-listen-summary"
                  >
                    {isLoadingAudio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    {isLoadingAudio ? "جاري التحميل..." : isPlaying ? "إيقاف" : "استمع للموجز"}
                  </Button>
                </div>
                <p className="text-foreground/90 leading-relaxed text-lg" data-testid="text-smart-summary">
                  {article.aiSummary || article.excerpt}
                </p>
              </div>
            )}

            {/* Keywords */}
            {article.seo?.keywords && article.seo.keywords.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">الكلمات المفتاحية</h3>
                <div className="flex flex-wrap gap-2">
                  {article.seo.keywords.map((keyword, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover-elevate active-elevate-2 transition-all duration-300 hover:scale-105"
                      onClick={() => setLocation(`/keyword/${encodeURIComponent(keyword)}`)}
                      data-testid={`badge-keyword-${index}`}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Article Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none leading-loose"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
              data-testid="content-article-body"
            />

            <Separator />

            {/* Share Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={article.hasReacted ? "default" : "outline"}
                className="gap-2 hover-elevate"
                onClick={handleReact}
                data-testid="button-article-react"
              >
                <Heart className={article.hasReacted ? 'fill-current' : ''} />
                إعجاب ({article.reactionsCount || 0})
              </Button>

              <Button
                variant={article.isBookmarked ? "default" : "outline"}
                className="gap-2 hover-elevate"
                onClick={handleBookmark}
                data-testid="button-article-bookmark"
              >
                <Bookmark className={article.isBookmarked ? 'fill-current' : ''} />
                حفظ
              </Button>

              <Button
                variant="outline"
                className="gap-2 hover-elevate"
                onClick={handleShare}
                data-testid="button-article-share"
              >
                <Share2 />
                مشاركة
              </Button>

              <ExportPdfButton
                articleSlug={article.slug}
                articleUrl={`${window.location.origin}/article/${article.slug}`}
                variant="outline"
                className="gap-2 hover-elevate"
              />
            </div>

            <Separator />

            {/* Story Timeline */}
            {article.storyId && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">تطور القصة</h2>
                    <FollowStoryButton 
                      storyId={article.storyId} 
                      storyTitle={article.storyTitle || article.title}
                    />
                  </div>
                  <StoryTimeline storyId={article.storyId} />
                </div>
                <Separator />
              </>
            )}

            {/* Comments */}
            <CommentSection
              articleId={article.id}
              comments={comments}
              currentUser={user}
              onSubmitComment={handleComment}
            />
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* AI-Powered Smart Recommendations */}
            <AIRecommendationsBlock articleSlug={slug} />

            {/* Related Opinion Articles */}
            {article?.category && (
              <RelatedOpinionsSection
                categoryId={article.category.id}
                categoryName={article.category.nameAr}
                categoryColor={article.category.color || undefined}
                excludeArticleId={article.id}
                limit={5}
              />
            )}

            {relatedArticles.length > 0 && (
              <RecommendationsWidget
                articles={relatedArticles}
                title="مقالات ذات صلة"
                reason="قد تعجبك أيضاً"
              />
            )}
          </aside>
        </div>
      </main>

      {/* PDF View - Hidden component for PDF export */}
      <ArticlePdfView
        article={article}
        articleUrl={`${window.location.origin}/article/${article.slug}`}
      />
    </div>
  );
}
