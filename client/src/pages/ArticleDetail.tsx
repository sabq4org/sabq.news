import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { CommentSection } from "@/components/CommentSection";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  Bookmark,
  Share2,
  Clock,
  Eye,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import type { ArticleWithDetails, CommentWithUser } from "@shared/schema";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: user } = useQuery<{ id: string; name?: string; email?: string }>({
    queryKey: ["/api/auth/user"],
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

  const handleReact = async () => {
    console.log("React to article");
  };

  const handleBookmark = async () => {
    console.log("Bookmark article");
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
    console.log("Submit comment:", content, parentId);
  };

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

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
            <Link href="/">
              <a className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-home">
                الرئيسية
              </a>
            </Link>
            <ChevronRight className="h-4 w-4" />
            {article.category && (
              <>
                <Link href={`/?category=${article.category.id}`}>
                  <a className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-category">
                    {article.category.nameAr}
                  </a>
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground line-clamp-1">{article.title}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

              {article.excerpt && (
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              {/* Author & Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {article.author && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(article.author.name, article.author.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid="text-author-name">
                        {article.author.name || article.author.email}
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

                <Separator orientation="vertical" className="h-10" />

                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.views} مشاهدة
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
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  data-testid="img-article-featured"
                />
              </div>
            )}

            {/* AI Summary */}
            {article.aiSummary && (
              <div className="bg-accent/50 border border-accent-foreground/10 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                  <h3 className="font-semibold text-accent-foreground">ملخص تلقائي</h3>
                </div>
                <p className="text-accent-foreground/90 leading-relaxed" data-testid="text-ai-summary">
                  {article.aiSummary}
                </p>
              </div>
            )}

            {/* Article Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none leading-loose"
              dangerouslySetInnerHTML={{ __html: article.content }}
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
            </div>

            <Separator />

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
