import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash } from "lucide-react";
import type { EnArticle, EnCategory } from "@shared/schema";

export default function EnglishDashboard() {
  const { data: articles, isLoading: articlesLoading } = useQuery<EnArticle[]>({
    queryKey: ["/api/en/articles", { status: "all" }],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<EnCategory[]>({
    queryKey: ["/api/en/categories"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Please login to access the dashboard.
          </p>
          <Link href="/login">
            <Button data-testid="button-login">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Check if user has English language permission
  const hasEnglishAccess = user.allowedLanguages?.includes('en');
  if (!hasEnglishAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Permission</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the English dashboard.
          </p>
          <Link href="/dashboard">
            <Button data-testid="button-arabic-dashboard">
              Go to Arabic Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (articlesLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  const publishedArticles = articles?.filter((a) => a.status === "published") || [];
  const draftArticles = articles?.filter((a) => a.status === "draft") || [];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">English Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage English content
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/en">
                <Button variant="outline" data-testid="button-view-site">
                  View Site
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" data-testid="button-arabic-dashboard">
                  عربي
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-articles">
                {articles?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-published-articles">
                {publishedArticles.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-draft-articles">
                {draftArticles.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Section */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <Button size="sm" data-testid="button-create-category">
              <Plus className="w-4 h-4 mr-2" /> New Category
            </Button>
          </CardHeader>
          <CardContent>
            {categories && categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="px-3 py-1.5"
                    data-testid={`badge-category-${category.id}`}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No categories yet. Create your first category.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Articles Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Articles</CardTitle>
            <Button data-testid="button-create-article">
              <Plus className="w-4 h-4 mr-2" /> New Article
            </Button>
          </CardHeader>
          <CardContent>
            {articles && articles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                      <TableCell className="font-medium">
                        {article.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            article.status === "published"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.views || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString("en-US")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/en/articles/${article.slug}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-view-${article.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-edit-${article.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-delete-${article.id}`}
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No articles yet. Create your first article.
                </p>
                <Button data-testid="button-create-first-article">
                  <Plus className="w-4 h-4 mr-2" /> Create First Article
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
