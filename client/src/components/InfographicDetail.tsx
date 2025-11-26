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
    <div className="min-h-screen">
      {/* Hero Section with Image */}
      <div className="relative">
        {/* Main Infographic Image - Full Width */}
        <div className="relative group cursor-zoom-in" onClick={() => setImageZoom(true)}>
          <img 
            src={article.imageUrl || ""} 
            alt={article.title}
            className="w-full h-auto"
            data-testid="image-infographic-main"
          />
          
          {/* Gradient Overlay at Bottom */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          
          {/* AI Badge - Top Right */}
          {(article.isAiGeneratedThumbnail || article.isAiGeneratedImage) && (
            <Badge 
              className="absolute top-3 right-3 z-10 gap-1 bg-purple-500/90 text-white border-0 backdrop-blur-sm text-xs"
              data-testid={`badge-article-ai-image-${article.id}`}
            >
              <Brain className="h-3 w-3" />
              AI
            </Badge>
          )}
          
          {/* Zoom Indicator - Center on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="bg-white/90 dark:bg-black/80 rounded-full p-3 shadow-lg">
              <ZoomIn className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Floating Action Bar */}
          <Card className="p-3 mb-6 shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {(article.views || 0).toLocaleString('ar-SA')}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {article.reactionsCount || 0}
                </span>
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant={hasReacted ? "default" : "ghost"}
                  size="icon"
                  onClick={onReact}
                  data-testid="button-infographic-react"
                >
                  <Heart className={`h-4 w-4 ${hasReacted ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant={isBookmarked ? "default" : "ghost"}
                  size="icon"
                  onClick={onBookmark}
                  data-testid="button-infographic-bookmark"
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  data-testid="button-download-infographic"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  data-testid="button-infographic-share"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>

          {/* Category & Date */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {article.category && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-infographic-category">
                {article.category.icon} {article.category.nameAr}
              </Badge>
            )}
            {publishedDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {publishedDate}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4" data-testid="text-infographic-title">
            {article.title}
          </h1>
          
          {/* AI Summary or Excerpt */}
          {(article.aiSummary || article.excerpt) && (
            <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-start gap-2">
                {article.aiGenerated && (
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.aiSummary || article.excerpt}
                </p>
              </div>
            </div>
          )}
          
          {/* Additional Content if exists */}
          {sanitizedContent && (
            <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
            </div>
          )}
          
          {/* Keywords */}
          {article.seo?.keywords && article.seo.keywords.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-1.5">
                {article.seo.keywords.slice(0, 6).map((keyword, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="text-xs px-2 py-0.5"
                    data-testid={`badge-keyword-${index}`}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Author Info - Compact */}
          {author && (
            <div className="flex items-center gap-3 py-4 border-t border-border/50">
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarImage src={author.profileImageUrl || ""} alt={authorName} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {authorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{authorName}</p>
                <p className="text-xs text-muted-foreground">كاتب المحتوى</p>
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