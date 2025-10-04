import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Rss,
  Users,
  PlusCircle,
  Settings,
  LogOut,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import type { ArticleWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

export default function Dashboard() {
  const [location] = useLocation();

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: stats } = useQuery<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: myArticles = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/dashboard/articles"],
  });

  const menuItems = [
    {
      title: "نظرة عامة",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "مقالاتي",
      icon: FileText,
      href: "/dashboard/articles",
    },
    {
      title: "مقال جديد",
      icon: PlusCircle,
      href: "/dashboard/articles/new",
    },
    {
      title: "التصنيفات",
      icon: FolderOpen,
      href: "/dashboard/categories",
      adminOnly: true,
    },
    {
      title: "مصادر RSS",
      icon: Rss,
      href: "/dashboard/rss-feeds",
      adminOnly: true,
    },
    {
      title: "المستخدمون",
      icon: Users,
      href: "/dashboard/users",
      adminOnly: true,
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

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

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <div className="px-4 py-4">
                <Link href="/">
                  <a className="flex items-center gap-2" data-testid="link-home-from-dashboard">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                      س
                    </div>
                    <span className="text-lg font-bold">سبق الذكية</span>
                  </a>
                </Link>
              </div>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href}>
                          <a 
                            className="flex items-center gap-3 w-full"
                            data-testid={`link-${item.href.split('/').pop()}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </a>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/profile">
                        <a className="flex items-center gap-3 w-full" data-testid="link-settings">
                          <Settings className="h-4 w-4" />
                          <span>الإعدادات</span>
                        </a>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/api/auth/logout" className="flex items-center gap-3 w-full" data-testid="link-logout-dashboard">
                        <LogOut className="h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-bold">لوحة التحكم</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild data-testid="button-view-site">
                <Link href="/">
                  <a>عرض الموقع</a>
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <a className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      مقال جديد
                    </a>
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
                            <a>تحرير</a>
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
                        <a className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          إنشاء أول مقال
                        </a>
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
