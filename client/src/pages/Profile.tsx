import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Heart, 
  Bookmark, 
  FileText, 
  Settings,
  Bell,
  Shield,
} from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleWithDetails } from "@shared/schema";

export default function Profile() {
  const { data: user } = useQuery<{ 
    id: string; 
    name?: string; 
    email?: string; 
    role?: string;
  }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: likedArticles = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/profile/liked"],
    enabled: !!user,
  });

  const { data: bookmarkedArticles = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/profile/bookmarks"],
    enabled: !!user,
  });

  const { data: readingHistory = [] } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/profile/history"],
    enabled: !!user,
  });

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'م';
  };

  const getRoleBadge = (role?: string) => {
    const labels: Record<string, string> = {
      admin: "مدير",
      editor: "محرر",
      reader: "قارئ",
    };
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      editor: "secondary",
      reader: "outline",
    };
    return (
      <Badge variant={variants[role || "reader"] || "outline"}>
        {labels[role || "reader"] || role}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">يجب تسجيل الدخول</h1>
            <p className="text-muted-foreground mb-8">
              سجل الدخول لعرض ملفك الشخصي
            </p>
            <Button asChild data-testid="button-login-profile">
              <a href="/api/auth/login">تسجيل الدخول</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold" data-testid="text-profile-name">
                      {user.name || "مستخدم"}
                    </h2>
                    <p className="text-sm text-muted-foreground" data-testid="text-profile-email">
                      {user.email}
                    </p>
                    {getRoleBadge(user.role)}
                  </div>

                  <Separator />

                  <div className="w-full space-y-2">
                    {(user.role === "editor" || user.role === "admin") && (
                      <Button
                        variant="default"
                        className="w-full gap-2"
                        asChild
                        data-testid="button-go-to-dashboard"
                      >
                        <Link href="/dashboard">
                          <a>
                            <FileText className="h-4 w-4" />
                            لوحة التحكم
                          </a>
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                      data-testid="button-settings"
                    >
                      <a>
                        <Settings className="h-4 w-4" />
                        الإعدادات
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الإحصائيات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>الإعجابات</span>
                  </div>
                  <span className="font-semibold" data-testid="text-stat-likes">
                    {likedArticles.length}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                    <span>المحفوظات</span>
                  </div>
                  <span className="font-semibold" data-testid="text-stat-bookmarks">
                    {bookmarkedArticles.length}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>القراءات</span>
                  </div>
                  <span className="font-semibold" data-testid="text-stat-history">
                    {readingHistory.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">التفضيلات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 hover-elevate"
                  data-testid="button-notifications"
                >
                  <Bell className="h-4 w-4" />
                  إعدادات الإشعارات
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 hover-elevate"
                  data-testid="button-privacy"
                >
                  <Shield className="h-4 w-4" />
                  الخصوصية والأمان
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>نشاطي</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="bookmarks" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">
                      <Bookmark className="h-4 w-4 ml-2" />
                      المحفوظات
                    </TabsTrigger>
                    <TabsTrigger value="liked" data-testid="tab-liked">
                      <Heart className="h-4 w-4 ml-2" />
                      الإعجابات
                    </TabsTrigger>
                    <TabsTrigger value="history" data-testid="tab-history">
                      <FileText className="h-4 w-4 ml-2" />
                      السجل
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bookmarks" className="space-y-4 mt-6">
                    {bookmarkedArticles.length > 0 ? (
                      <div className="space-y-4">
                        {bookmarkedArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            variant="list"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">لا توجد مقالات محفوظة</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="liked" className="space-y-4 mt-6">
                    {likedArticles.length > 0 ? (
                      <div className="space-y-4">
                        {likedArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            variant="list"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">لم تعجب بأي مقالات بعد</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4 mt-6">
                    {readingHistory.length > 0 ? (
                      <div className="space-y-4">
                        {readingHistory.map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            variant="list"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">لا يوجد سجل قراءة</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
