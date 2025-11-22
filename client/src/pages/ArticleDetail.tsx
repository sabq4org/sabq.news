import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { MobileOptimizedKpiCard } from "@/components/MobileOptimizedKpiCard";
import { CommentSection } from "@/components/CommentSection";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import { AIRecommendationsBlock } from "@/components/AIRecommendationsBlock";
import { RelatedOpinionsSection } from "@/components/RelatedOpinionsSection";
import StoryTimeline from "@/components/StoryTimeline";
import FollowStoryButton from "@/components/FollowStoryButton";
import { ViewsCount } from "@/components/ViewsCount";
import { AiArticleStats } from "@/components/AiArticleStats";
import { AdSlot } from "@/components/AdSlot";
import { SocialShareBar } from "@/components/SocialShareBar";
import { ImageWithCaption } from "@/components/ImageWithCaption";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  ChevronDown,
  Volume2,
  VolumeX,
  CheckCircle2,
  Loader2,
  UserPlus,
  UserCheck,
  Eye,
  MessageSquare,
  Archive,
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
  
  // Smart summary collapsible state
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
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

  const { data: mediaAssets } = useQuery<any[]>({
    queryKey: ["/api/articles", article?.id, "media-assets"],
    enabled: !!article?.id,
  });

  // Unified author resolution for both news and opinion articles
  const resolvedAuthorId = article?.articleType === 'opinion'
    ? article?.opinionAuthor?.id
    : article?.author?.id;
  const resolvedAuthor = article?.articleType === 'opinion'
    ? article?.opinionAuthor
    : article?.author;
  const isOwnArticle = user?.id === resolvedAuthorId;

  // Check if current user follows the author
  const { data: isFollowingData } = useQuery<{
    isFollowing: boolean;
  }>({
    queryKey: ["/api/social/is-following", resolvedAuthorId],
    enabled: !!resolvedAuthorId && !!user && !isOwnArticle,
  });

  const isFollowing = isFollowingData?.isFollowing || false;

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedAuthorId) throw new Error("Author ID not found");
      return apiRequest("/api/social/follow", {
        method: "POST",
        body: JSON.stringify({ followingId: resolvedAuthorId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/is-following", resolvedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", resolvedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/followers", resolvedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تمت المتابعة",
        description: "أصبحت تتابع هذا الكاتب",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشلت عملية المتابعة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedAuthorId) throw new Error("Author ID not found");
      return apiRequest(`/api/social/unfollow/${resolvedAuthorId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/is-following", resolvedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", resolvedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/followers", resolvedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تم إلغاء المتابعة",
        description: "لم تعد تتابع هذا الكاتب",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشلت عملية إلغاء المتابعة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Fetch existing short link for article (idempotent GET first)
  const { data: existingShortLink, isLoading: isLoadingShortLink, error: shortLinkError } = useQuery<{ shortCode: string; originalUrl: string } | null>({
    queryKey: ["/api/shortlinks/article", article?.id],
    queryFn: async () => {
      if (!article?.id) return null;
      try {
        const response = await fetch(`/api/shortlinks/article/${article.id}`, {
          credentials: "include",
        });
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${await response.text()}`);
        }
        return await response.json();
      } catch (error) {
        console.error("[ShortLink] Error fetching:", error);
        return null;
      }
    },
    enabled: !!article?.id,
    staleTime: Infinity,
    retry: false,
  });

  // Create short link mutation (only called if no existing link)
  const createShortLinkMutation = useMutation({
    mutationFn: async () => {
      if (!article) throw new Error("Article not loaded");
      console.log("[ShortLink] Creating new short link for article:", article.id);
      const response = await apiRequest("/api/shortlinks", {
        method: "POST",
        body: JSON.stringify({
          originalUrl: `https://sabq.news/article/${slug}`,
          articleId: article.id,
          utmMedium: "social",
          utmCampaign: "article_share",
        }),
      });
      console.log("[ShortLink] Created successfully:", response);
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/shortlinks/article", article?.id], data);
    },
    onError: (error) => {
      console.error("[ShortLink] Error creating short link:", error);
    },
  });

  // Trigger creation only if no existing link and not already creating/failed
  useEffect(() => {
    if (
      article?.id && 
      !isLoadingShortLink && 
      !existingShortLink && 
      !createShortLinkMutation.isPending && 
      !createShortLinkMutation.isSuccess &&
      !createShortLinkMutation.data &&
      !createShortLinkMutation.isError
    ) {
      console.log("[ShortLink] No existing link found, creating new one...");
      createShortLinkMutation.mutate();
    }
  }, [article?.id, isLoadingShortLink, existingShortLink]);

  // Use existing link if found, otherwise use created link, fallback to canonical URL
  const shortLink = existingShortLink || createShortLinkMutation.data;

  const { logArticleView } = useArticleReadTracking({
    articleId: article?.id || "",
    enabled: !!article && !!user,
  });

  // Ensure RTL direction is applied for Arabic content
  useEffect(() => {
    const previousDir = document.documentElement.dir;
    const previousLang = document.documentElement.lang;
    
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    
    // Cleanup: restore previous values when unmounting
    return () => {
      document.documentElement.dir = previousDir || "ltr";
      document.documentElement.lang = previousLang || "en";
    };
  }, []);

  useEffect(() => {
    if (article && user) {
      logArticleView();
    }
  }, [article?.id, user?.id]);

  // Load Twitter widgets script and render embedded tweets with theme support
  useEffect(() => {
    if (!article?.content) return;

    // Function to apply theme to all tweet blockquotes
    const applyThemeToTweets = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const theme = isDark ? 'dark' : 'light';
      
      const tweetBlocks = document.querySelectorAll('blockquote.twitter-tweet');
      tweetBlocks.forEach((block) => {
        block.setAttribute('data-theme', theme);
      });
    };

    // Apply theme before loading widgets
    applyThemeToTweets();

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
    
    if (existingScript && window.twttr?.widgets) {
      // Script already loaded, just render tweets
      console.log('[ArticleDetail] Twitter widgets already loaded, rendering tweets');
      window.twttr.widgets.load();
    } else if (!existingScript) {
      // Load script for the first time
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      
      script.onload = () => {
        console.log('[ArticleDetail] Twitter widgets script loaded successfully');
        applyThemeToTweets();
        if (window.twttr?.widgets) {
          window.twttr.widgets.load();
        }
      };

      script.onerror = () => {
        console.error('[ArticleDetail] Failed to load Twitter widgets script');
      };

      document.body.appendChild(script);
    }

    // Listen for theme changes and reload tweets
    let previousTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      
      // Only reload if theme actually changed
      if (currentTheme !== previousTheme) {
        previousTheme = currentTheme;
        console.log('[ArticleDetail] Theme changed to', currentTheme);
        applyThemeToTweets();
        if (window.twttr?.widgets) {
          window.twttr.widgets.load();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, [article?.content]);

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
        "name": resolvedAuthor?.firstName && resolvedAuthor?.lastName
          ? `${resolvedAuthor.firstName} ${resolvedAuthor.lastName}`
          : resolvedAuthor?.email || "سبق",
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

  // Add ImageObject JSON-LD for image SEO
  useEffect(() => {
    if (!article?.imageUrl) return;

    // Get hero image asset data (displayOrder === 0)
    const heroAsset = mediaAssets?.find((asset: any) => asset.displayOrder === 0);
    
    // Convert relative URL to absolute URL
    const absoluteImageUrl = article.imageUrl.startsWith('http') 
      ? article.imageUrl 
      : `${window.location.origin}${article.imageUrl}`;

    const imageObject: any = {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "contentUrl": absoluteImageUrl,
      "url": absoluteImageUrl,
      "caption": heroAsset?.captionPlain || article.title,
      "description": heroAsset?.altText || article.title,
    };

    // Add keywords if available
    if (heroAsset?.keywordTags && heroAsset.keywordTags.length > 0) {
      imageObject["keywords"] = heroAsset.keywordTags.join(", ");
    } else if (article.seo?.keywords && article.seo.keywords.length > 0) {
      imageObject["keywords"] = article.seo.keywords.join(", ");
    }

    // Add author/source if available
    if (heroAsset?.sourceName) {
      imageObject["author"] = {
        "@type": "Organization",
        "name": heroAsset.sourceName,
      };
      if (heroAsset.sourceUrl) {
        imageObject["author"]["url"] = heroAsset.sourceUrl;
      }
    }

    // Add copyright notice if available
    if (heroAsset?.rightsStatement) {
      imageObject["copyrightNotice"] = heroAsset.rightsStatement;
    }

    // Add script tag to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(imageObject);
    script.id = 'image-structured-data';
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById('image-structured-data');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [article?.id, article?.imageUrl, mediaAssets]);

  // Add Open Graph and Twitter Cards meta tags
  useEffect(() => {
    if (!article) return;

    const seoTitle = article.seo?.metaTitle || article.title;
    const seoDescription = article.seo?.metaDescription || article.excerpt || article.aiSummary || "";
    
    // Convert relative imageUrl to absolute URL
    let seoImage = article.imageUrl || `${window.location.origin}/og-image.png`;
    if (article.imageUrl && !article.imageUrl.startsWith('http')) {
      seoImage = `${window.location.origin}${article.imageUrl}`;
    }
    
    const seoUrl = window.location.href;

    // Get hero image asset data for alt text
    const heroAsset = mediaAssets?.find((asset: any) => asset.displayOrder === 0);
    const imageAlt = heroAsset?.altText || article.title;

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

    // Open Graph Image Tags
    if (article.imageUrl) {
      updateMetaTag('og:image:alt', imageAlt);
      updateMetaTag('og:image:type', 'image/jpeg');
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
    }

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
    
    // Twitter Card Image Tags
    if (article.imageUrl) {
      updateMetaTag('twitter:image:alt', imageAlt, true);
    }

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
  }, [article?.id, article?.seo, article?.imageUrl, mediaAssets]);

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

  const handleComment = async (content: string, parentId?: string) => {
    commentMutation.mutate({ content, parentId });
  };

  // Handle audio playback using ElevenLabs
  const handlePlayAudio = async () => {
    if (!article?.aiSummary && !article?.excerpt) {
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
      const timestamp = article?.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString();
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

  // Calculate reading time
  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes || 1;
  };

  const readingTime = article.content ? estimateReadingTime(article.content) : 1;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      {/* Breadcrumbs */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-home">
              الرئيسية
            </Link>
            <ChevronRight className="h-4 w-4" />
            {article.category && (
              <>
                <Link href={`/category/${article.category.slug}`} className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-category">
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
        {/* Statistics Cards Section - TailAdmin Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-8">
          <MobileOptimizedKpiCard
            label="المشاهدات"
            value={(article.views ?? 0).toLocaleString('en-US')}
            icon={Eye}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
            testId="card-stat-views"
          />
          
          <MobileOptimizedKpiCard
            label="الإعجابات"
            value={(article.reactionsCount ?? 0).toLocaleString('en-US')}
            icon={Heart}
            iconColor="text-red-500"
            iconBgColor="bg-red-500/10"
            testId="card-stat-reactions"
          />
          
          <MobileOptimizedKpiCard
            label="التعليقات"
            value={(article.commentsCount ?? 0).toLocaleString('en-US')}
            icon={MessageSquare}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/10"
            testId="card-stat-comments"
          />
          
          <MobileOptimizedKpiCard
            label="دقائق قراءة"
            value={readingTime}
            icon={Clock}
            iconColor="text-orange-500"
            iconBgColor="bg-orange-500/10"
            testId="card-stat-reading-time"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2 space-y-6">
            {/* Article Header Card - TailAdmin Style */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {article.category && (
                  <Badge variant="outline" className="bg-primary/5 border-primary/30 gap-1" data-testid="badge-article-category">
                    {article.category.icon} {article.category.nameAr}
                  </Badge>
                )}
                {article.status === 'archived' && (user?.role === 'system_admin' || user?.role === 'admin' || user?.role === 'editor') && (
                  <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 gap-1" data-testid="badge-article-archived">
                    <Archive className="h-3 w-3" />
                    مؤرشف
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

              {/* Author Card */}
              {resolvedAuthor && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage 
                        src={resolvedAuthor?.profileImageUrl || ""} 
                        alt={`${resolvedAuthor?.firstName || ""} ${resolvedAuthor?.lastName || ""}`.trim() || resolvedAuthor?.email || ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                        {getInitials(resolvedAuthor?.firstName, resolvedAuthor?.lastName, resolvedAuthor?.email)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {article.staff ? (
                          <Link 
                            href={`/reporter/${article.staff.slug}`} 
                            className="text-lg font-bold hover:text-primary transition-colors flex items-center gap-1" 
                            data-testid="link-reporter-profile"
                          >
                            <span data-testid="text-author-name">
                              {resolvedAuthor?.firstName && resolvedAuthor?.lastName
                                ? `${resolvedAuthor.firstName} ${resolvedAuthor.lastName}`
                                : resolvedAuthor?.email}
                            </span>
                            {article.staff.isVerified && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </Link>
                        ) : (
                          <p className="text-lg font-bold" data-testid="text-author-name">
                            {resolvedAuthor?.firstName && resolvedAuthor?.lastName
                              ? `${resolvedAuthor.firstName} ${resolvedAuthor.lastName}`
                              : resolvedAuthor?.email}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        {timeAgo && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {timeAgo}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {readingTime} دقائق قراءة
                        </span>
                      </div>
                    </div>

                    {user && !isOwnArticle && resolvedAuthorId && (
                      isFollowing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unfollowMutation.mutate()}
                          disabled={unfollowMutation.isPending}
                          className="gap-1 shrink-0"
                          data-testid="button-unfollow-author"
                        >
                          <UserCheck className="h-4 w-4" />
                          متابع
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => followMutation.mutate()}
                          disabled={followMutation.isPending}
                          className="gap-1 shrink-0"
                          data-testid="button-follow-author"
                        >
                          <UserPlus className="h-4 w-4" />
                          متابعة
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Featured Image - Clean TailAdmin Style */}
            {article.imageUrl && (() => {
              // Find caption data for hero image (if exists)
              const heroImageAsset = mediaAssets?.find(
                (asset: any) => asset.displayOrder === 0
              );
              
              return (
                <ImageWithCaption
                  imageUrl={article.imageUrl}
                  altText={heroImageAsset?.altText || article.title}
                  captionHtml={heroImageAsset?.captionHtml}
                  captionPlain={heroImageAsset?.captionPlain}
                  sourceName={heroImageAsset?.sourceName}
                  sourceUrl={heroImageAsset?.sourceUrl}
                  isAiGenerated={(article as any).isAiGeneratedImage || false}
                  aiModel={(article as any).aiImageModel}
                  relatedArticleSlugs={heroImageAsset?.relatedArticleSlugs}
                  keywordTags={heroImageAsset?.keywordTags}
                  className=""
                />
              );
            })()}

            {/* Smart Summary - TailAdmin Style */}
            {(article.aiSummary || article.excerpt) && (
              <Collapsible open={isSummaryExpanded} onOpenChange={setIsSummaryExpanded}>
                <div className="bg-muted/50 border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold">الموجز الذكي</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          data-testid="button-toggle-summary"
                        >
                          <span className="text-xs">{isSummaryExpanded ? "إخفاء" : "عرض الكل"}</span>
                          <ChevronDown 
                            className={`h-4 w-4 transition-transform duration-200 ${isSummaryExpanded ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
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
                        <span className="hidden md:inline">{isLoadingAudio ? "جاري التحميل..." : isPlaying ? "إيقاف" : "استمع للموجز"}</span>
                      </Button>
                    </div>
                  </div>
                  <p 
                    className={`text-muted-foreground leading-relaxed ${!isSummaryExpanded ? 'line-clamp-3' : ''}`}
                    data-testid="text-smart-summary"
                  >
                    {article.aiSummary || article.excerpt}
                  </p>
                </div>
              </Collapsible>
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
            <div className="bg-card border rounded-lg p-6">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none leading-loose"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(article.content, {
                    ADD_TAGS: ['iframe', 'blockquote'],
                    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'data-lang', 'data-theme', 'data-video-embed', 'data-url', 'data-embed-url', 'class'],
                    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                  })
                }}
                data-testid="content-article-body"
              />
            </div>

            {/* Additional Images */}
            {mediaAssets && mediaAssets.length > 0 && (() => {
              // Filter out hero image (displayOrder === 0) and sort by displayOrder
              const additionalImages = mediaAssets
                .filter((asset: any) => asset.displayOrder !== 0)
                .sort((a: any, b: any) => a.displayOrder - b.displayOrder);
              
              if (additionalImages.length === 0) return null;
              
              return (
                <div className="bg-card border rounded-lg p-6 space-y-8">
                  <h3 className="text-lg font-bold mb-4">الصور المرفقة</h3>
                  <div className="space-y-8">
                    {additionalImages.map((asset: any, index: number) => (
                      <ImageWithCaption
                        key={asset.id || index}
                        imageUrl={asset.url}
                        altText={asset.altText || `صورة ${index + 1}`}
                        captionHtml={asset.captionHtml}
                        captionPlain={asset.captionPlain}
                        sourceName={asset.sourceName}
                        sourceUrl={asset.sourceUrl}
                        relatedArticleSlugs={asset.relatedArticleSlugs}
                        keywordTags={asset.keywordTags}
                        className="w-full"
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Engagement Actions - TailAdmin Style */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">تفاعل مع المقال</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={article.hasReacted ? "default" : "outline"}
                  className="gap-2 h-12"
                  onClick={handleReact}
                  data-testid="button-article-react"
                >
                  <Heart className={article.hasReacted ? 'fill-current' : ''} />
                  <span>إعجاب ({article.reactionsCount || 0})</span>
                </Button>

                <Button
                  variant={article.isBookmarked ? "default" : "outline"}
                  className="gap-2 h-12"
                  onClick={handleBookmark}
                  data-testid="button-article-bookmark"
                >
                  <Bookmark className={article.isBookmarked ? 'fill-current' : ''} />
                  <span>حفظ</span>
                </Button>
              </div>
            </div>

            {/* Social Share Bar - TailAdmin Style */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  {isLoadingShortLink ? (
                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                  ) : (
                    <Share2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <h3 className="text-lg font-bold">شارك المقال</h3>
              </div>
              {isLoadingShortLink ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري إنشاء رابط المشاركة...
                </div>
              ) : (
                <SocialShareBar
                  title={article.title}
                  url={shortLink?.shortCode ? `https://sabq.news/s/${shortLink.shortCode}` : `https://sabq.news/article/${slug}`}
                  description={article.excerpt || ""}
                  articleId={article.id}
                />
              )}
            </div>

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
            {/* AI Article Analytics */}
            <AiArticleStats slug={slug} />

            {/* Advertisement Slot - Article Sidebar */}
            <AdSlot slotId="sidebar" className="my-6" />

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
    </div>
  );
}
