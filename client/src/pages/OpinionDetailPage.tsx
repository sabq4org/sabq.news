import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { NavigationBar } from "@/components/NavigationBar";
import { Footer } from "@/components/Footer";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import { AIRecommendationsBlock } from "@/components/AIRecommendationsBlock";
import { RelatedOpinionsSection } from "@/components/RelatedOpinionsSection";
import { ViewsCount } from "@/components/ViewsCount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";
import { useArticleReadTracking } from "@/hooks/useArticleReadTracking";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ArrowRight, 
  Clock, 
  Eye, 
  BookOpen,
  User,
  Calendar,
  Heart,
  Bookmark,
  Share2,
  Sparkles,
  ChevronRight,
  Volume2,
  VolumeX,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails } from "@shared/schema";
import { useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";

export default function OpinionDetailPage() {
  const params = useParams();
  const slug = params.slug;
  const { toast } = useToast();
  const { logBehavior } = useBehaviorTracking();
  const [, setLocation] = useLocation();

  // Text-to-speech hook
  const { speak, cancel, isSpeaking, isSupported } = useTextToSpeech({
    lang: 'ar-SA',
    rate: 0.9,
  });

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: article, isLoading } = useQuery<ArticleWithDetails>({
    queryKey: ["/api/opinion", slug],
    enabled: !!slug,
  });

  const { data: relatedArticles = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/opinion", slug, "related"],
    enabled: !!slug,
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
      "@type": "OpinionNewsArticle",
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
          : article.author?.email || "كاتب رأي",
        "description": article.author?.bio || undefined,
        "image": article.author?.profileImageUrl || undefined
      },
      "publisher": {
        "@type": "Organization",
        "name": "صحيفة سبق",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/logo.png`
        }
      },
      "articleSection": article.category?.nameAr || "رأي",
      "keywords": article.seo?.keywords?.join(", ") || "",
      "isAccessibleForFree": true,
      "inLanguage": "ar",
      "genre": "opinion"
    };

    // Add script tag to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'opinion-structured-data';
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById('opinion-structured-data');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [article?.id]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/opinion", slug] });
    },
    onError: (error: Error) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/opinion", slug] });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث المقالات المحفوظة",
      });
    },
    onError: (error: Error) => {
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
          text: article.excerpt || article.subtitle || "",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share failed:", err);
      }
    }
  };

  // Extract text for audio summary
  const getAudioText = () => {
    if (!article) return '';
    
    // Priority 1: aiSummary
    if (article.aiSummary) {
      return article.aiSummary;
    }
    
    // Priority 2: excerpt or subtitle
    if (article.excerpt) {
      return article.excerpt;
    }

    if (article.subtitle) {
      return article.subtitle;
    }
    
    // Priority 3: First 200 words from content
    if (article.content) {
      // Remove HTML tags
      const textContent = article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const words = textContent.split(' ');
      return words.slice(0, 200).join(' ') + (words.length > 200 ? '...' : '');
    }
    
    return '';
  };

  const handlePlayAudio = () => {
    if (!isSupported) {
      toast({
        title: "غير مدعوم",
        description: "متصفحك لا يدعم ميزة القراءة الصوتية",
        variant: "destructive",
      });
      return;
    }

    const audioText = getAudioText();
    if (!audioText) {
      toast({
        title: "لا يوجد محتوى",
        description: "لا يوجد نص متاح للقراءة الصوتية",
        variant: "destructive",
      });
      return;
    }

    if (isSpeaking) {
      cancel();
    } else {
      speak(audioText);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'ر';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header user={user} />
        <NavigationBar />
        <main className="flex-1">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header user={user} />
        <NavigationBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground">
              المقال غير موجود
            </h2>
            <Link href="/opinion">
              <Button variant="default" data-testid="button-back-to-opinions">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة لمقالات الرأي
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const authorName = article.author
    ? `${article.author.firstName || ""} ${article.author.lastName || ""}`.trim() || "كاتب غير معروف"
    : "كاتب غير معروف";

  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: arSA,
      })
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header user={user} />
      <NavigationBar />

      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-home">
              الرئيسية
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/opinion" className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-opinion">
              مقالات الرأي
            </Link>
            <ChevronRight className="h-4 w-4" />
            {article.category && (
              <>
                <span className="hover:text-foreground transition-colors" data-testid="text-breadcrumb-category">
                  {article.category.nameAr}
                </span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground line-clamp-1">{article.title}</span>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-2 space-y-8">
              {/* Article Header */}
              <header className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="gap-1" data-testid="badge-opinion-type">
                    <BookOpen className="h-3 w-3" />
                    مقال رأي
                  </Badge>
                  {article.category && (
                    <Badge variant="secondary" data-testid="badge-category">
                      {article.category.icon} {article.category.nameAr}
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground" data-testid="text-article-title">
                  {article.title}
                </h1>

                {article.subtitle && (
                  <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-article-subtitle">
                    {article.subtitle}
                  </p>
                )}

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {article.author && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={article.author?.profileImageUrl || ""} 
                          alt={authorName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(article.author?.firstName, article.author?.lastName, article.author?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-base text-foreground" data-testid="text-author-name">
                          {authorName}
                        </p>
                        {timeAgo && (
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator orientation="vertical" className="h-12" />

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ViewsCount 
                        views={article.views || 0}
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
                    data-testid="img-article-cover"
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
                      variant={isSpeaking ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={handlePlayAudio}
                      data-testid="button-listen-summary"
                    >
                      {isSpeaking ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                      {isSpeaking ? "إيقاف" : "استمع للملخص"}
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
                data-testid="text-article-content"
              />

              <Separator />

              {/* Author Bio Section */}
              {article.author && (
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={article.author?.profileImageUrl || ""} 
                        alt={authorName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {getInitials(article.author?.firstName, article.author?.lastName, article.author?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-xl text-foreground">
                        عن الكاتب
                      </h3>
                      <p className="font-semibold text-lg text-foreground">
                        {authorName}
                      </p>
                      {article.author?.bio && (
                        <p className="text-muted-foreground">
                          {article.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
              </div>

            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* AI-Powered Smart Recommendations */}
              {slug && <AIRecommendationsBlock articleSlug={slug} />}

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
                  title="مقالات رأي ذات صلة"
                  reason="قد تعجبك أيضاً"
                />
              )}
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
