import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { 
  ArrowLeft,
  Share2,
  Bookmark,
  MessageCircle,
  Eye,
  Clock,
  User,
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  CheckCircle,
  Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import AIHeader from "@/components/ai/AIHeader";
import AINewsCard from "@/components/ai/AINewsCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageWithCaption } from "@/components/ImageWithCaption";
import type { Article } from "@shared/schema";

export default function AIArticleDetail() {
  const params = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(342);

  // Fetch article details
  const { data: article, isLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${params.slug}`],
    enabled: !!params.slug
  });

  // Fetch related articles
  const { data: relatedArticles = [] } = useQuery<Article[]>({
    queryKey: [`/api/articles/${params.slug}/related`],
    enabled: !!params.slug && !!article
  });

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article?.title || "";
    
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
          title: language === "ar" ? "تم النسخ!" : "Copied!",
          description: language === "ar" ? "تم نسخ الرابط" : "Link copied to clipboard"
        });
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    toast({
      title: !bookmarked 
        ? (language === "ar" ? "تم الحفظ!" : "Saved!") 
        : (language === "ar" ? "تم الإلغاء!" : "Removed!"),
      description: !bookmarked
        ? (language === "ar" ? "تم حفظ المقال في المفضلة" : "Article saved to bookmarks")
        : (language === "ar" ? "تم إزالة المقال من المفضلة" : "Article removed from bookmarks")
    });
  };

  const toggleLike = () => {
    setLiked(!liked);
    if (!liked) {
      setLikesCount(prev => prev + 1);
      toast({
        title: language === "ar" ? "أعجبك المقال!" : "You liked this article!",
        description: language === "ar" ? "تم إضافة إعجابك" : "Your like has been added"
      });
    } else {
      setLikesCount(prev => prev - 1);
      toast({
        title: language === "ar" ? "تم إلغاء الإعجاب" : "Like removed",
        description: language === "ar" ? "تم إزالة إعجابك" : "Your like has been removed"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" dir="rtl" lang="ar">
        <AIHeader />
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-3/4" />
            <div className="h-64 bg-slate-800 rounded" />
            <div className="h-4 bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-800 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" dir="rtl" lang="ar">
        <AIHeader />
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {language === "ar" ? "المقال غير موجود" : "Article not found"}
              </h2>
              <Link href="/ai">
                <Button variant="default" data-testid="button-back-to-ai">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === "ar" ? "العودة لقسم AI" : "Back to AI Section"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" dir="rtl" lang="ar">
      {/* Header */}
      <AIHeader />

      {/* Article Content */}
      <article className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Button */}
          <Link href="/ai">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white mb-6"
              data-testid="button-back-to-ai"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "ar" ? "العودة لـ iFox" : "Back to iFox"}
            </Button>
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            {/* Category and AI Badges - Above Title */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Category Badge */}
              {article.category && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-sm px-3 py-1"
                  data-testid="badge-category"
                >
                  {typeof article.category === 'string' ? article.category : article.category.nameAr || article.category.name}
                </Badge>
              )}
              
              {/* AI Generated Badge */}
              {article.aiGenerated && (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-sm px-3 py-1 flex items-center gap-1.5"
                  data-testid="badge-ai-generated"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  {language === "ar" ? "تم إنشاؤها بواسطة الذكاء الاصطناعي" : "AI Generated Content"}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {article.title}
            </h1>
            
            {article.excerpt && (
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Enhanced Author & Meta Section */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {/* Author Card */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-lg border border-slate-800/50 backdrop-blur-sm">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                  {(() => {
                    if (typeof article.author === 'string') {
                      return article.author.charAt(0);
                    } else if (article.author?.firstName) {
                      return article.author.firstName.charAt(0);
                    }
                    return "S";
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-base mb-0.5 truncate" data-testid="text-author-name">
                    {(() => {
                      if (typeof article.author === 'string') {
                        return article.author;
                      } else if (article.author) {
                        return `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim();
                      }
                      return language === "ar" ? "سبق AI" : "Sabq AI";
                    })()}
                  </div>
                  <div className="text-gray-400 text-xs flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{language === "ar" ? "محرر ذكاء اصطناعي" : "AI Editor"}</span>
                  </div>
                </div>
              </div>

              {/* Article Stats Card */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-lg border border-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    {format(new Date(article.createdAt), "PPP", {
                      locale: language === "ar" ? ar : enUS
                    })}
                  </span>
                </div>
                <div className="w-px h-5 bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-sm">
                  <Eye className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 font-medium" data-testid="text-views">
                    {(article.views || 0).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                  </span>
                  <span className="text-gray-400 text-xs">{language === "ar" ? "مشاهدة" : "views"}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Enhanced Share and Actions Bar */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/50 rounded-xl p-4 sm:p-5 mb-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Like & Share Section */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Like Button with Counter */}
                <Button
                  variant={liked ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-2 transition-all ${
                    liked 
                      ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 border-0 shadow-lg shadow-red-500/30" 
                      : "border-slate-700 hover:bg-slate-800 hover:border-red-400"
                  }`}
                  onClick={toggleLike}
                  data-testid="button-like"
                  title={language === "ar" ? "أعجبني" : "Like"}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                  <span className="font-semibold">{likesCount.toLocaleString(language === "ar" ? "ar-SA" : "en-US")}</span>
                </Button>

                <div className="w-px h-8 bg-slate-700 hidden sm:block" />

                {/* Share Buttons Group */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-400 font-medium hidden sm:inline">
                    {language === "ar" ? "مشاركة:" : "Share:"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 hover:bg-blue-500/10 hover:border-blue-400 hover:text-blue-400 transition-all"
                      onClick={() => handleShare("twitter")}
                      data-testid="button-share-twitter"
                      title={language === "ar" ? "شارك على تويتر" : "Share on Twitter"}
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 hover:bg-blue-600/10 hover:border-blue-500 hover:text-blue-500 transition-all"
                      onClick={() => handleShare("facebook")}
                      data-testid="button-share-facebook"
                      title={language === "ar" ? "شارك على فيسبوك" : "Share on Facebook"}
                    >
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 hover:bg-blue-700/10 hover:border-blue-600 hover:text-blue-600 transition-all"
                      onClick={() => handleShare("linkedin")}
                      data-testid="button-share-linkedin"
                      title={language === "ar" ? "شارك على لينكد إن" : "Share on LinkedIn"}
                    >
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`border-slate-700 transition-all ${
                        copied 
                          ? "border-green-400 bg-green-500/10 text-green-400" 
                          : "hover:bg-gray-500/10 hover:border-gray-400"
                      }`}
                      onClick={() => handleShare("copy")}
                      data-testid="button-copy-link"
                      title={language === "ar" ? "نسخ الرابط" : "Copy Link"}
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bookmark Button */}
              <Button
                variant={bookmarked ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-2 transition-all w-full sm:w-auto ${
                  bookmarked 
                    ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 border-0 shadow-lg shadow-yellow-500/30" 
                    : "border-slate-700 hover:bg-slate-800 hover:border-yellow-400"
                }`}
                onClick={toggleBookmark}
                data-testid="button-bookmark"
                title={language === "ar" ? "حفظ المقال" : "Save Article"}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                <span className="font-medium">
                  {bookmarked 
                    ? (language === "ar" ? "محفوظ" : "Saved")
                    : (language === "ar" ? "حفظ للقراءة لاحقاً" : "Save for Later")}
                </span>
              </Button>
            </div>
          </div>

          {/* Featured Image with AI Badge */}
          {article.imageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden relative group">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-auto rounded-xl"
                data-testid="img-featured"
              />
              
              {/* AI Image Badge - Overlay on Image */}
              {article.aiGenerated && (
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
                  <Badge
                    variant="default"
                    className="bg-black/80 backdrop-blur-sm border-purple-500/50 text-purple-300 hover:bg-black/90 text-xs sm:text-sm px-3 py-1.5 flex items-center gap-2 shadow-lg"
                    data-testid="badge-ai-image"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
                    </span>
                    {language === "ar" ? "صورة بالذكاء الاصطناعي" : "AI Generated Image"}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-invert prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />


          <Separator className="bg-slate-800 mb-8" />

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                {language === "ar" ? "مقالات ذات صلة" : "Related Articles"}
                <ChevronRight className="w-6 h-6" />
              </h2>
              <div className="grid gap-6">
                {relatedArticles.slice(0, 3).map((relatedArticle) => (
                  <AINewsCard 
                    key={relatedArticle.id} 
                    article={{
                      ...relatedArticle,
                      summary: relatedArticle.excerpt,
                      viewCount: relatedArticle.views,
                      commentCount: 0,
                      createdAt: relatedArticle.createdAt instanceof Date ? relatedArticle.createdAt.toISOString() : relatedArticle.createdAt,
                      featured: relatedArticle.isFeatured,
                      trending: false
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </article>
    </div>
  );
}