import { useState, useRef } from "react";
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
  BarChart3,
  User,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
    <article className="min-h-screen bg-background pb-8">
      {/* Main Content Container */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* Two Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Right Column - Image (Desktop: 7 cols) */}
          <div className="lg:col-span-7 order-1">
            <Card className="overflow-hidden border-0 shadow-lg">
              {/* Image Container */}
              <div 
                className="relative cursor-zoom-in group bg-gradient-to-br from-muted/50 to-muted"
                onClick={() => setImageZoom(true)}
              >
                <OptimizedImage 
                  src={imageUrl} 
                  alt={article.title}
                  className="w-full h-auto object-contain"
                  data-testid="image-infographic-main"
                  priority={true}
                  preferSize="large"
                />
                
                {/* AI Badge */}
                {(article.isAiGeneratedThumbnail || article.isAiGeneratedImage) && (
                  <Badge 
                    className="absolute top-3 right-3 gap-1.5 bg-purple-600/90 text-white border-0 backdrop-blur-sm"
                    data-testid={`badge-article-ai-image-${article.id}`}
                  >
                    <Brain className="h-3 w-3" />
                    صورة ذكية
                  </Badge>
                )}
                
                {/* Zoom Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="bg-black/60 backdrop-blur-sm text-white rounded-full p-3">
                    <Maximize2 className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              {/* Image Action Bar */}
              <CardContent className="p-3 bg-muted/30 border-t">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageZoom(true)}
                      className="gap-1.5 text-muted-foreground"
                      data-testid="button-zoom-image"
                    >
                      <Maximize2 className="h-4 w-4" />
                      <span className="hidden sm:inline">تكبير</span>
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1.5"
                    data-testid="button-download-infographic"
                  >
                    <Download className="h-4 w-4" />
                    تحميل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Left Column - Content (Desktop: 5 cols) */}
          <div className="lg:col-span-5 order-2 space-y-5">
            
            {/* Category Badge */}
            {article.category && (
              <Link href={`/category/${article.category.slug}`}>
                <Badge 
                  variant="secondary" 
                  className="hover-elevate cursor-pointer text-sm gap-1.5"
                  data-testid="badge-infographic-category"
                >
                  <Tag className="h-3 w-3" />
                  {article.category.icon} {article.category.nameAr}
                </Badge>
              </Link>
            )}
            
            {/* Title */}
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
              data-testid="text-infographic-title"
            >
              {article.title}
            </h1>
            
            {/* Meta Info Card */}
            <Card className="border-muted">
              <CardContent className="p-4 space-y-4">
                {/* Author */}
                {author && (
                  <Link href={`/profile/${author.id}`}>
                    <div className="flex items-center gap-3 hover-elevate rounded-lg p-2 -m-2 cursor-pointer">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={author.profileImageUrl || ""} alt={authorName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{authorName}</p>
                        <p className="text-xs text-muted-foreground">المحرر</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                )}
                
                <Separator />
                
                {/* Stats Row */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {publishedDate && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{publishedDate}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{(article.views || 0).toLocaleString('ar-SA')}</span>
                    </div>
                    {(article.reactionsCount || 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        <span>{article.reactionsCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant={hasReacted ? "default" : "outline"}
                size="default"
                onClick={onReact}
                className="flex-1 gap-2"
                data-testid="button-infographic-react"
              >
                <Heart className={`h-4 w-4 ${hasReacted ? 'fill-current' : ''}`} />
                {hasReacted ? 'أعجبني' : 'إعجاب'}
              </Button>
              
              <Button
                variant={isBookmarked ? "default" : "outline"}
                size="default"
                onClick={onBookmark}
                className="flex-1 gap-2"
                data-testid="button-infographic-bookmark"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'محفوظ' : 'حفظ'}
              </Button>
              
              <Button
                variant="outline"
                size="default"
                onClick={handleShare}
                className="flex-1 gap-2"
                data-testid="button-infographic-share"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? 'تم النسخ' : 'مشاركة'}
              </Button>
            </div>
            
            {/* Summary/Excerpt */}
            {(article.aiSummary || article.excerpt) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-base leading-relaxed text-foreground/90">
                    {article.aiSummary || article.excerpt}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Content */}
            {sanitizedContent && (
              <div 
                className="prose prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
              />
            )}
            
            {/* Keywords */}
            {article.seo?.keywords && article.seo.keywords.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground mb-3">الكلمات المفتاحية</p>
                <div className="flex flex-wrap gap-2">
                  {article.seo.keywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="text-xs"
                      data-testid={`badge-keyword-${index}`}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Related Infographics - Full Width */}
        {relatedInfographics && relatedInfographics.length > 0 && (
          <div className="mt-10 pt-8 border-t border-border/50">
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
                  className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start"
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
          <div className="mt-10 pt-8 border-t border-border/50">
            <Skeleton className="h-7 w-40 mb-5" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-[240px] sm:w-[280px]">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-full mt-3" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
              ))}
            </div>
          </div>
        )}
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
