import { useState } from "react";
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
  X,
  Check,
  Brain,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
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
          description: "تم تحميل الإنفوجرافيك"
        });
      } catch (error) {
        window.open(article.imageUrl, '_blank');
      }
    }
  };

  const sanitizedContent = article.content 
    ? DOMPurify.sanitize(article.content, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
      })
    : '';

  return (
    <article className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="px-4 pt-6 pb-4">
          {article.category && (
            <Link href={`/category/${article.category.slug}`}>
              <Badge 
                variant="secondary" 
                className="mb-3 hover-elevate cursor-pointer"
                data-testid="badge-infographic-category"
              >
                {article.category.icon} {article.category.nameAr}
              </Badge>
            </Link>
          )}
          
          <h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4"
            data-testid="text-infographic-title"
          >
            {article.title}
          </h1>
          
          <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4 flex-wrap">
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
              {(article.reactionsCount || 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  {article.reactionsCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div 
          className="relative group cursor-zoom-in mx-4 rounded-xl overflow-hidden shadow-lg"
          onClick={() => setImageZoom(true)}
        >
          <img 
            src={article.imageUrl || ""} 
            alt={article.title}
            className="w-full h-auto"
            data-testid="image-infographic-main"
          />
          
          {(article.isAiGeneratedThumbnail || article.isAiGeneratedImage) && (
            <Badge 
              className="absolute top-3 right-3 gap-1 bg-purple-500/90 text-white border-0 backdrop-blur-sm text-xs"
              data-testid={`badge-article-ai-image-${article.id}`}
            >
              <Brain className="h-3 w-3" />
              AI
            </Badge>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="bg-white/95 dark:bg-black/90 rounded-full p-4 shadow-xl">
              <ZoomIn className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center justify-between gap-3 pb-6 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant={hasReacted ? "default" : "outline"}
                size="sm"
                onClick={onReact}
                className="gap-2"
                data-testid="button-infographic-react"
              >
                <Heart className={`h-4 w-4 ${hasReacted ? 'fill-current' : ''}`} />
                إعجاب
              </Button>
              
              <Button
                variant={isBookmarked ? "default" : "outline"}
                size="sm"
                onClick={onBookmark}
                className="gap-2"
                data-testid="button-infographic-bookmark"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                حفظ
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
                data-testid="button-download-infographic"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تحميل</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
                data-testid="button-infographic-share"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span className="hidden sm:inline">مشاركة</span>
              </Button>
            </div>
          </div>

          {(article.aiSummary || article.excerpt) && (
            <div className="py-6 border-b">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {article.aiSummary || article.excerpt}
              </p>
            </div>
          )}
          
          {sanitizedContent && (
            <div className="py-6 border-b">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
              />
            </div>
          )}
          
          {article.seo?.keywords && article.seo.keywords.length > 0 && (
            <div className="py-6 border-b">
              <p className="text-sm font-medium text-muted-foreground mb-3">الكلمات المفتاحية</p>
              <div className="flex flex-wrap gap-2">
                {article.seo.keywords.map((keyword, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="text-sm"
                    data-testid={`badge-keyword-${index}`}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {author && (
            <div className="py-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarImage src={author.profileImageUrl || ""} alt={authorName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{authorName}</p>
                  <p className="text-sm text-muted-foreground">المحرر</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={imageZoom} onOpenChange={setImageZoom}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent">
          <DialogClose className="absolute left-4 top-4 z-50 rounded-full bg-black/70 hover:bg-black/90 text-white p-2.5">
            <X className="h-5 w-5" />
            <span className="sr-only">إغلاق</span>
          </DialogClose>
          <div className="relative flex items-center justify-center">
            <img
              src={article.imageUrl || ""}
              alt={article.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 left-4 gap-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              تحميل
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
