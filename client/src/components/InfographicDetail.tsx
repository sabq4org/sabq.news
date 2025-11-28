import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { 
  Eye, 
  Share2, 
  Calendar, 
  Heart, 
  Bookmark,
  Download,
  ZoomIn,
  ZoomOut,
  X,
  Check,
  Brain,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getCacheBustedImageUrl } from "@/lib/imageUtils";
import type { ArticleWithDetails } from "@shared/schema";
import DOMPurify from "isomorphic-dompurify";
import { OptimizedImage } from "@/components/OptimizedImage";

interface InfographicDetailProps {
  article: ArticleWithDetails;
  onReact?: () => void;
  onBookmark?: () => void;
  hasReacted?: boolean;
  isBookmarked?: boolean;
  shortLink?: { shortCode: string } | null;
}

interface RelatedInfographic {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  publishedAt: string | null;
  views: number;
  category: {
    id: string;
    nameAr: string;
    icon: string | null;
  } | null;
}

export function InfographicDetail({ 
  article, 
  onReact, 
  onBookmark,
  hasReacted,
  isBookmarked,
  shortLink
}: InfographicDetailProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showActions, setShowActions] = useState(true);
  const lastScrollY = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const { data: relatedInfographics, isLoading: loadingRelated } = useQuery<RelatedInfographic[]>({
    queryKey: [`/api/articles/${article.slug}/infographics`],
    enabled: !!article.slug,
  });
  
  const publishedDate = article.publishedAt 
    ? format(new Date(article.publishedAt), 'dd MMMM yyyy', { locale: arSA })
    : '';

  const author = article.articleType === 'opinion' ? article.opinionAuthor : article.author;
  const authorName = author?.firstName && author?.lastName 
    ? `${author.firstName} ${author.lastName}`
    : author?.email || 'سبق';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowActions(false);
      } else {
        setShowActions(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShare = async () => {
    const shareUrl = shortLink 
      ? `https://sabq.me/${shortLink.shortCode}`
      : window.location.href;
      
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.aiSummary || '',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط المقال"
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleDownload = async () => {
    if (article.imageUrl) {
      try {
        const response = await fetch(article.imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${article.slug || 'infographic'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
          title: "تم التحميل",
          description: "تم تحميل الإنفوجرافيك بنجاح"
        });
      } catch (error) {
        window.open(article.imageUrl, '_blank');
      }
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 280;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const sanitizedContent = article.content 
    ? DOMPurify.sanitize(article.content, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
      })
    : '';

  const imageUrl = getCacheBustedImageUrl(article.imageUrl, article.updatedAt);

  return (
    <article className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Full-Bleed Hero Section */}
      <div className="relative w-full bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Hero Image Container */}
        <div 
          className="relative w-full cursor-zoom-in group"
          onClick={() => setImageZoom(true)}
        >
          {/* Background blur layer */}
          <div 
            className="absolute inset-0 blur-3xl opacity-30 scale-110"
            style={{ 
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Main Image */}
          <div className="relative max-w-5xl mx-auto px-0 sm:px-4 lg:px-8">
            <OptimizedImage 
              src={imageUrl} 
              alt={article.title}
              className="w-full h-auto max-h-[85vh] object-contain mx-auto rounded-none sm:rounded-xl shadow-2xl"
              data-testid="image-infographic-main"
              priority={true}
              preferSize="large"
            />
            
            {/* AI Badge */}
            {(article.isAiGeneratedThumbnail || article.isAiGeneratedImage) && (
              <Badge 
                className="absolute top-4 right-4 gap-1.5 bg-purple-600/90 text-white border-0 backdrop-blur-sm px-3 py-1.5"
                data-testid={`badge-article-ai-image-${article.id}`}
              >
                <Brain className="h-3.5 w-3.5" />
                صورة ذكية
              </Badge>
            )}
            
            {/* Zoom Indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-black/70 backdrop-blur-sm text-white rounded-full p-4 shadow-xl transform group-hover:scale-110 transition-transform">
                <Maximize2 className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Meta Section */}
        <div className="py-6 sm:py-8">
          {/* Category Badge */}
          {article.category && (
            <Link href={`/category/${article.category.slug}`}>
              <Badge 
                variant="secondary" 
                className="mb-4 hover-elevate cursor-pointer text-sm px-3 py-1"
                data-testid="badge-infographic-category"
              >
                {article.category.icon} {article.category.nameAr}
              </Badge>
            </Link>
          )}
          
          {/* Title */}
          <h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-5"
            data-testid="text-infographic-title"
          >
            {article.title}
          </h1>
          
          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {publishedDate && (
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5">
                <Calendar className="h-4 w-4" />
                <span>{publishedDate}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5">
              <Eye className="h-4 w-4" />
              <span>{(article.views || 0).toLocaleString('ar-SA')} مشاهدة</span>
            </div>
            {(article.reactionsCount || 0) > 0 && (
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5">
                <Heart className="h-4 w-4" />
                <span>{article.reactionsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Action Bar - Sticky */}
        <div className="hidden lg:flex items-center justify-between gap-4 py-4 border-y border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
          <div className="flex items-center gap-3">
            <Button
              variant={hasReacted ? "default" : "outline"}
              size="default"
              onClick={onReact}
              className="gap-2 min-w-[100px]"
              data-testid="button-infographic-react"
            >
              <Heart className={`h-4 w-4 ${hasReacted ? 'fill-current' : ''}`} />
              {hasReacted ? 'أعجبني' : 'إعجاب'}
            </Button>
            
            <Button
              variant={isBookmarked ? "default" : "outline"}
              size="default"
              onClick={onBookmark}
              className="gap-2 min-w-[100px]"
              data-testid="button-infographic-bookmark"
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'محفوظ' : 'حفظ'}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={handleDownload}
              className="gap-2"
              data-testid="button-download-infographic"
            >
              <Download className="h-4 w-4" />
              تحميل
            </Button>
            
            <Button
              variant="outline"
              size="default"
              onClick={handleShare}
              className="gap-2 min-w-[100px]"
              data-testid="button-infographic-share"
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? 'تم النسخ' : 'مشاركة'}
            </Button>
          </div>
        </div>

        {/* Summary/Excerpt Section */}
        {(article.aiSummary || article.excerpt) && (
          <div className="py-6 sm:py-8">
            <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-2xl p-5 sm:p-6 border border-primary/10">
              <p className="text-lg sm:text-xl leading-relaxed text-foreground/90">
                {article.aiSummary || article.excerpt}
              </p>
            </div>
          </div>
        )}
        
        {/* Content Section */}
        {sanitizedContent && (
          <div className="py-6 sm:py-8">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
            />
          </div>
        )}
        
        {/* Keywords Section */}
        {article.seo?.keywords && article.seo.keywords.length > 0 && (
          <div className="py-6 border-t border-border/50">
            <p className="text-sm font-semibold text-muted-foreground mb-4">الكلمات المفتاحية</p>
            <div className="flex flex-wrap gap-2">
              {article.seo.keywords.map((keyword, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="text-sm px-3 py-1 hover-elevate cursor-default"
                  data-testid={`badge-keyword-${index}`}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Author Section */}
        {author && (
          <div className="py-6 border-t border-border/50">
            <Link href={`/profile/${author.id}`}>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover-elevate cursor-pointer transition-all">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={author.profileImageUrl || ""} alt={authorName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-lg">{authorName}</p>
                  <p className="text-sm text-muted-foreground">المحرر</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </div>
        )}

        {/* Related Infographics Carousel */}
        {relatedInfographics && relatedInfographics.length > 0 && (
          <div className="py-8 border-t border-border/50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">إنفوجرافيك ذات صلة</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollCarousel('right')}
                  className="h-9 w-9 rounded-full"
                  data-testid="button-carousel-prev"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollCarousel('left')}
                  className="h-9 w-9 rounded-full"
                  data-testid="button-carousel-next"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div 
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedInfographics.map((infographic, index) => (
                <Link
                  key={infographic.id}
                  href={`/article/${infographic.slug}`}
                  className="flex-shrink-0 w-[260px] snap-start"
                  data-testid={`link-related-infographic-${index}`}
                >
                  <Card className="overflow-hidden hover-elevate h-full border-muted">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      {infographic.imageUrl ? (
                        <OptimizedImage
                          src={infographic.imageUrl}
                          alt={infographic.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          priority={false}
                          preferSize="medium"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <BarChart3 className="h-12 w-12 text-primary/30" aria-label="إنفوجرافيك" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-bold text-sm line-clamp-2 mb-2">
                        {infographic.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{(infographic.views || 0).toLocaleString('ar-SA')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {loadingRelated && (
          <div className="py-8 border-t border-border/50">
            <Skeleton className="h-7 w-40 mb-5" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[260px]">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-full mt-3" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <div 
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/50 px-4 py-3 z-50 transition-transform duration-300 ${
          showActions ? 'translate-y-0' : 'translate-y-full'
        }`}
        data-testid="mobile-action-bar"
      >
        <div className="flex items-center justify-around gap-2 max-w-lg mx-auto">
          <Button
            variant={hasReacted ? "default" : "ghost"}
            size="lg"
            onClick={onReact}
            className="flex-1 gap-2 h-12"
            data-testid="button-mobile-react"
          >
            <Heart className={`h-5 w-5 ${hasReacted ? 'fill-current' : ''}`} />
            <span className="text-sm">{hasReacted ? 'أعجبني' : 'إعجاب'}</span>
          </Button>
          
          <Button
            variant={isBookmarked ? "default" : "ghost"}
            size="lg"
            onClick={onBookmark}
            className="flex-1 gap-2 h-12"
            data-testid="button-mobile-bookmark"
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className="text-sm">{isBookmarked ? 'محفوظ' : 'حفظ'}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={handleDownload}
            className="flex-1 gap-2 h-12"
            data-testid="button-mobile-download"
          >
            <Download className="h-5 w-5" />
            <span className="text-sm">تحميل</span>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={handleShare}
            className="flex-1 gap-2 h-12"
            data-testid="button-mobile-share"
          >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            <span className="text-sm">{copied ? 'تم' : 'مشاركة'}</span>
          </Button>
        </div>
      </div>
      
      {/* Enhanced Lightbox Dialog */}
      <Dialog open={imageZoom} onOpenChange={setImageZoom}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-0 bg-black/95 rounded-none">
          <VisuallyHidden>
            <DialogTitle>عرض الإنفوجرافيك: {article.title}</DialogTitle>
            <DialogDescription>اضغط مرتين للتكبير أو استخدم أزرار التحكم</DialogDescription>
          </VisuallyHidden>
          <DialogClose className="absolute left-4 top-4 z-50 rounded-full bg-white/10 hover:bg-white/20 text-white p-3 backdrop-blur-sm transition-colors">
            <X className="h-6 w-6" />
            <span className="sr-only">إغلاق</span>
          </DialogClose>
          
          {/* Zoom Controls */}
          <div className="absolute left-4 bottom-4 z-50 flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm font-medium min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Download Button */}
          <Button
            variant="secondary"
            size="default"
            className="absolute right-4 bottom-4 z-50 gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={handleDownload}
            data-testid="button-lightbox-download"
          >
            <Download className="h-4 w-4" />
            تحميل الصورة
          </Button>
          
          {/* Image Container */}
          <div 
            className="relative flex items-center justify-center w-full h-full overflow-auto p-8"
            style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
          >
            <img
              src={imageUrl}
              alt={article.title}
              className="max-w-none transition-transform duration-200"
              style={{ 
                transform: `scale(${zoomLevel})`,
                maxHeight: zoomLevel === 1 ? '90vh' : 'none',
                maxWidth: zoomLevel === 1 ? '90vw' : 'none'
              }}
              onDoubleClick={() => setZoomLevel(prev => prev === 1 ? 2 : 1)}
              data-testid="image-lightbox"
            />
          </div>
          
          {/* Title Overlay */}
          <div className="absolute top-4 right-16 left-16 z-40">
            <h2 className="text-white text-lg sm:text-xl font-bold text-center line-clamp-2 drop-shadow-lg">
              {article.title}
            </h2>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
