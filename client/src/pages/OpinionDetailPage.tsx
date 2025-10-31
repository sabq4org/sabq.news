import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Clock, 
  Eye, 
  BookOpen,
  User,
  Calendar
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

type OpinionArticle = {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: string;
  views: number;
  category?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
    icon?: string;
    color?: string;
  };
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
    bio?: string;
  };
};

export default function OpinionDetailPage() {
  const params = useParams();
  const slug = params.slug;

  const { data: article, isLoading } = useQuery<OpinionArticle>({
    queryKey: ["/api/opinion", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-muted rounded w-3/4"></div>
            <div className="h-96 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      </div>
    );
  }

  const authorName = article.author
    ? `${article.author.firstName || ""} ${article.author.lastName || ""}`.trim() || "كاتب غير معروف"
    : "كاتب غير معروف";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/opinion">
          <Button 
            variant="ghost" 
            className="mb-6"
            data-testid="button-back-to-opinions"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة لمقالات الرأي
          </Button>
        </Link>

        <article className="space-y-8">
          <header className="space-y-6">
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

            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" data-testid="text-article-title">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-xl text-muted-foreground" data-testid="text-article-subtitle">
                {article.subtitle}
              </p>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {article.author?.profileImageUrl ? (
                    <img 
                      src={article.author.profileImageUrl}
                      alt={authorName}
                      className="h-16 w-16 rounded-full object-cover"
                      data-testid="img-author-avatar"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-lg text-foreground" data-testid="text-author-name">
                      {authorName}
                    </h3>
                    {article.author?.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-author-bio">
                        {article.author.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {article.publishedAt && (
                        <>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span data-testid="text-publish-date">
                              {format(new Date(article.publishedAt), "d MMMM yyyy", { locale: ar })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(article.publishedAt), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span data-testid="text-views">
                          {article.views.toLocaleString("en-US")} قراءة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </header>

          {article.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-auto"
                data-testid="img-article-cover"
              />
            </div>
          )}

          <Separator />

          <div 
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="text-article-content"
          />

          <Separator />

          <div className="bg-muted/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              {article.author?.profileImageUrl ? (
                <img 
                  src={article.author.profileImageUrl}
                  alt={authorName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
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
        </article>
      </div>
    </div>
  );
}
