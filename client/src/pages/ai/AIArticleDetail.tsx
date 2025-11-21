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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {article.title}
            </h1>
            
            {article.excerpt && (
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Author Section */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-900/50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {(() => {
                  if (typeof article.author === 'string') {
                    return article.author.charAt(0);
                  } else if (article.author?.firstName) {
                    return article.author.firstName.charAt(0);
                  }
                  return "S";
                })()}
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">
                  {(() => {
                    if (typeof article.author === 'string') {
                      return article.author;
                    } else if (article.author) {
                      return `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim();
                    }
                    return language === "ar" ? "فريق سبق الرقمي" : "Sabq Digital Team";
                  })()}
                </div>
                <div className="text-gray-500 text-sm">
                  {language === "ar" ? "محرر تقني" : "Tech Editor"}
                </div>
              </div>
            </div>
            
            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {format(new Date(article.createdAt), "PPP", {
                    locale: language === "ar" ? ar : enUS
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{article.views || 0} {language === "ar" ? "مشاهدة" : "views"}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>0 {language === "ar" ? "تعليق" : "comments"}</span>
              </div>
            </div>
          </header>

          {/* Share and Actions Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-slate-900/50 rounded-lg mb-8 border border-slate-800">
            <div className="flex items-center gap-3">
              {/* Like Button with Counter */}
              <Button
                variant={liked ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-2 transition-all ${
                  liked 
                    ? "bg-red-600 hover:bg-red-700 border-red-600" 
                    : "border-slate-700 hover:bg-slate-800 hover:border-red-500"
                }`}
                onClick={toggleLike}
                data-testid="button-like"
                title={language === "ar" ? "أعجبني" : "Like"}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span className="font-semibold">{likesCount}</span>
              </Button>

              <div className="w-px h-8 bg-slate-700" />

              {/* Share Buttons Group */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 mr-2">
                  {language === "ar" ? "شارك:" : "Share:"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-blue-500 transition-all"
                  onClick={() => handleShare("twitter")}
                  data-testid="button-share-twitter"
                  title={language === "ar" ? "شارك على تويتر" : "Share on Twitter"}
                >
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-blue-600 transition-all"
                  onClick={() => handleShare("facebook")}
                  data-testid="button-share-facebook"
                  title={language === "ar" ? "شارك على فيسبوك" : "Share on Facebook"}
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-blue-700 transition-all"
                  onClick={() => handleShare("linkedin")}
                  data-testid="button-share-linkedin"
                  title={language === "ar" ? "شارك على لينكد إن" : "Share on LinkedIn"}
                >
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`border-slate-700 hover:bg-slate-800 transition-all ${
                    copied ? "border-green-500 bg-green-500/10" : ""
                  }`}
                  onClick={() => handleShare("copy")}
                  data-testid="button-copy-link"
                  title={language === "ar" ? "نسخ الرابط" : "Copy Link"}
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Bookmark Button */}
            <Button
              variant={bookmarked ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 transition-all ${
                bookmarked 
                  ? "bg-yellow-600 hover:bg-yellow-700 border-yellow-600" 
                  : "border-slate-700 hover:bg-slate-800 hover:border-yellow-500"
              }`}
              onClick={toggleBookmark}
              data-testid="button-bookmark"
              title={language === "ar" ? "حفظ المقال" : "Save Article"}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
              <span>
                {bookmarked 
                  ? (language === "ar" ? "محفوظ" : "Saved")
                  : (language === "ar" ? "حفظ" : "Save")}
              </span>
            </Button>
          </div>

          {/* Featured Image */}
          {article.imageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-auto rounded-xl"
              />
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