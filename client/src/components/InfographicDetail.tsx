import { useState, useEffect } from "react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { 
  Eye, 
  Share2, 
  Calendar, 
  Heart, 
  Bookmark, 
  Clock,
  Sparkles,
  Copy,
  Check,
  X,
  Download,
  ZoomIn,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ArticleWithDetails } from "@shared/schema";
import DOMPurify from "isomorphic-dompurify";

interface InfographicDetailProps {
  article: ArticleWithDetails;
  onReact?: () => void;
  onBookmark?: () => void;
  hasReacted?: boolean;
  isBookmarked?: boolean;
  shortLink?: { shortCode: string } | null;
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
  
  // Format publish date
  const publishedDate = article.publishedAt 
    ? format(new Date(article.publishedAt), 'dd MMMM yyyy', { locale: arSA })
    : '';

  // Calculate reading time from content
  const readingTime = article.content 
    ? Math.ceil(article.content.split(/\s+/).length / 200) 
    : 1;

  // Get author info
  const author = article.articleType === 'opinion' ? article.opinionAuthor : article.author;
  const authorName = author?.firstName && author?.lastName 
    ? `${author.firstName} ${author.lastName}`
    : author?.email || 'سبق';

  // Handle share with copy to clipboard
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
          description: "تم نسخ رابط المقال بنجاح"
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Handle image download
  const handleDownload = () => {
    if (article.imageUrl) {
      const link = document.createElement('a');
      link.href = article.imageUrl;
      link.download = `infographic-${article.slug}.jpg`;
      link.click();
    }
  };

  // Sanitize content for safe HTML rendering
  const sanitizedContent = article.content 
    ? DOMPurify.sanitize(article.content, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
      })
    : '';

  return (
    <div>
      <div className="py-8">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-10">
          {/* Category Badge */}
          {article.category && (
            <div className="flex justify-center" data-testid="badge-infographic-category">
              <Badge variant="outline" className="text-base px-4 py-1.5 bg-primary/5 border-primary/30">
                {article.category.icon} {article.category.nameAr}
              </Badge>
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl mx-auto" data-testid="text-infographic-title">
            {article.title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
            {publishedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {publishedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {(article.views || 0).toLocaleString('ar-SA')} مشاهدة
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readingTime} دقائق قراءة
            </span>
          </div>
        </div>

        {/* Main Infographic Image */}
        <Card className="relative overflow-hidden mb-10 border-0 shadow-lg">
          <div className="relative group">
            <img 
              src={article.imageUrl || ""} 
              alt={article.title}
              className="w-full h-auto cursor-zoom-in transition-transform duration-300"
              onClick={() => setImageZoom(true)}
              data-testid="image-infographic-main"
            />
            
            {/* AI Generated Thumbnail Badge - Top Right */}
            {article.isAiGeneratedThumbnail && (
              <Badge 
                className="absolute top-4 right-4 z-10 gap-1.5 bg-purple-500/90 hover:bg-purple-600 text-white border-0 backdrop-blur-sm shadow-lg"
                data-testid={`badge-article-ai-thumbnail-${article.id}`}
              >
                الصورة
                <Brain className="h-3 w-3" aria-hidden="true" />
              </Badge>
            )}
            
            {/* Overlay with actions on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 bg-white/90 hover:bg-white"
                  onClick={() => setImageZoom(true)}
                  data-testid="button-zoom-infographic"
                >
                  <ZoomIn className="h-4 w-4" />
                  عرض بالحجم الكامل
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 bg-white/90 hover:bg-white"
                  onClick={handleDownload}
                  data-testid="button-download-infographic"
                >
                  <Download className="h-4 w-4" />
                  تحميل
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* AI Summary or Excerpt */}
          {(article.aiSummary || article.excerpt) && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                {article.aiGenerated && (
                  <Sparkles className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                )}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">نبذة مختصرة</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {article.aiSummary || article.excerpt}
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Keywords */}
          {article.seo?.keywords && article.seo.keywords.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg">الكلمات المفتاحية</h3>
              <div className="flex flex-wrap gap-2">
                {article.seo.keywords.map((keyword, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="px-3 py-1.5 text-sm"
                    data-testid={`badge-keyword-${index}`}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Additional Content if exists */}
          {sanitizedContent && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 py-6">
            <Button
              variant={hasReacted ? "default" : "outline"}
              size="lg"
              onClick={onReact}
              className="gap-2 min-w-[120px]"
              data-testid="button-infographic-react"
            >
              <Heart className={`h-5 w-5 ${hasReacted ? 'fill-current' : ''}`} />
              <span>{article.reactionsCount || 0}</span>
            </Button>
            
            <Button
              variant={isBookmarked ? "default" : "outline"}
              size="lg"
              onClick={onBookmark}
              className="gap-2"
              data-testid="button-infographic-bookmark"
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              حفظ
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="gap-2"
              data-testid="button-infographic-share"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Share2 className="h-5 w-5" />
                  مشاركة
                </>
              )}
            </Button>
          </div>
          
          <Separator />
          
          {/* Author Info */}
          {author && (
            <div className="flex items-center gap-4 justify-center py-6">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage 
                  src={author.profileImageUrl || ""} 
                  alt={authorName}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {authorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg">{authorName}</p>
                <p className="text-sm text-muted-foreground">كاتب المحتوى</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Image Zoom Modal */}
      <Dialog open={imageZoom} onOpenChange={setImageZoom}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 overflow-hidden">
          <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-background">
            <X className="h-4 w-4" />
            <span className="sr-only">إغلاق</span>
          </DialogClose>
          <div className="relative w-full h-full flex items-center justify-center bg-black/90">
            <img
              src={article.imageUrl || ""}
              alt={article.title}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4 gap-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              تحميل الصورة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}