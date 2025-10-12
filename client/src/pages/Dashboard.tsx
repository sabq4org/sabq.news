import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  PlusCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Check authentication and redirect if needed
  const { user, isLoading: isUserLoading } = useAuth({ redirectToLogin: true });

  // Always call hooks before any conditional returns
  const { data: stats } = useQuery<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user && user.role !== "reader", // Only fetch if not a reader
  });

  const { data: myArticles = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/dashboard/articles"],
    enabled: !!user && user.role !== "reader", // Only fetch if not a reader
  });

  // Redirect readers to home page - only content creators and admins can access dashboard
  useEffect(() => {
    if (!isUserLoading && user && user.role === "reader") {
      setLocation("/");
    }
  }, [isUserLoading, user, setLocation]);

  // Don't render dashboard for readers
  if (!isUserLoading && user && user.role === "reader") {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      published: "default",
      draft: "secondary",
      pending: "outline",
    };
    const labels: Record<string, string> = {
      published: "منشور",
      draft: "مسودة",
      pending: "قيد المراجعة",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-2">مرحباً بك في لوحة التحكم</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المقالات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-total-articles">
                {stats?.totalArticles || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المقالات المنشورة</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-published">
                {stats?.publishedArticles || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المسودات</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-drafts">
                {stats?.draftArticles || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-views">
                {stats?.totalViews || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Articles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>مقالاتي الأخيرة</CardTitle>
            <Button asChild data-testid="button-new-article">
              <Link href="/dashboard/articles/new">
                <span className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  مقال جديد
                </span>
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myArticles.length > 0 ? (
              <div className="space-y-4">
                {myArticles.slice(0, 5).map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate transition-all"
                    data-testid={`article-item-${article.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate" data-testid={`text-article-title-${article.id}`}>
                          {article.title}
                        </h3>
                        {article.aiGenerated && (
                          <Badge variant="secondary" className="gap-1 text-xs" data-testid={`badge-ai-${article.id}`}>
                            <Sparkles className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {article.publishedAt
                            ? formatDistanceToNow(new Date(article.publishedAt), {
                                addSuffix: true,
                                locale: arSA,
                              })
                            : "لم يُنشر بعد"}
                        </span>
                        <span>{article.views} مشاهدة</span>
                        {getStatusBadge(article.status)}
                      </div>
                    </div>
                    <Button variant="ghost" asChild data-testid={`button-edit-${article.id}`}>
                      <Link href={`/dashboard/articles/${article.id}`}>
                        <span>تحرير</span>
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">لم تقم بإنشاء أي مقالات بعد</p>
                <Button asChild data-testid="button-create-first-article">
                  <Link href="/dashboard/articles/new">
                    <span className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      إنشاء أول مقال
                    </span>
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
