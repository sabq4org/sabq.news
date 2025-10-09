import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Heart, 
  Bookmark, 
  FileText, 
  Settings,
  Bell,
  Shield,
  Loader2,
  Upload,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { ObjectUploader } from "@/components/ObjectUploader";
import { SmartInterestsBlock } from "@/components/SmartInterestsBlock";
import type { ArticleWithDetails, User as UserType } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

const updateUserSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل").optional(),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل").optional(),
  bio: z.string().max(500, "النبذة يجب أن لا تزيد عن 500 حرف").optional(),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "رقم الهاتف غير صحيح").optional(),
  profileImageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function Profile() {
  const { toast } = useToast();

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    values: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      phoneNumber: user?.phoneNumber || "",
      profileImageUrl: user?.profileImageUrl || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUserFormData) => {
      return apiRequest("/api/auth/user", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم حفظ بياناتك الشخصية",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث البيانات. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateUserFormData) => {
    updateMutation.mutate(data);
  };

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

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'م';
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.lastName) {
      return user.lastName;
    }
    return "مستخدم";
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

      {/* Hero Header with Cover */}
      <div className="relative">
        {/* Cover Image with Gradient */}
        <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10" />
        
        {/* Profile Info Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 pb-6">
            {/* Avatar + Basic Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-8">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage 
                    src={user.profileImageUrl || ""} 
                    alt={getUserDisplayName()}
                    className="object-cover"
                    data-testid="img-profile-avatar"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  allowedFileTypes={['.jpg', '.jpeg', '.png', '.webp']}
                  onGetUploadParameters={async () => {
                    const response = await apiRequest("/api/profile/image/upload", {
                      method: "POST",
                    });
                    return {
                      method: "PUT" as const,
                      url: response.uploadURL,
                    };
                  }}
                  onComplete={async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                    try {
                      if (result.successful && result.successful[0]) {
                        const uploadURL = result.successful[0].uploadURL;
                        
                        const response = await apiRequest("/api/profile/image", {
                          method: "PUT",
                          body: JSON.stringify({ profileImageUrl: uploadURL }),
                        });
                        
                        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                        
                        toast({
                          title: "تم التحديث بنجاح",
                          description: "تم تحديث صورتك الشخصية",
                        });
                      }
                    } catch (error) {
                      console.error("Error uploading profile image:", error);
                      toast({
                        title: "خطأ",
                        description: "فشل في رفع الصورة. حاول مرة أخرى.",
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="ghost"
                  size="icon"
                  buttonClassName="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg"
                >
                  <Upload className="h-4 w-4" />
                </ObjectUploader>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-3xl font-bold" data-testid="text-profile-name">
                    {getUserDisplayName()}
                  </h1>
                  {getRoleBadge(user.role)}
                </div>
                <p className="text-muted-foreground" data-testid="text-profile-email">
                  {user.email}
                </p>
                {user.bio && (
                  <p className="text-foreground/80 max-w-2xl">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="hover-elevate transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">الإعجابات</p>
                      <p className="text-2xl font-bold" data-testid="text-stat-likes">
                        {likedArticles.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/30 flex items-center justify-center">
                      <Bookmark className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">المحفوظات</p>
                      <p className="text-2xl font-bold" data-testid="text-stat-bookmarks">
                        {bookmarkedArticles.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">القراءات</p>
                      <p className="text-2xl font-bold" data-testid="text-stat-history">
                        {readingHistory.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Smart Interests */}
            <SmartInterestsBlock userId={user.id} />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(user.role === "editor" || user.role === "admin") && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    asChild
                    data-testid="button-go-to-dashboard"
                  >
                    <Link href="/dashboard">
                      <a className="flex items-center gap-2 w-full">
                        <LayoutDashboard className="h-4 w-4" />
                        لوحة التحكم
                      </a>
                    </Link>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  data-testid="button-notifications"
                >
                  <Bell className="h-4 w-4" />
                  إعدادات الإشعارات
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  data-testid="button-privacy"
                >
                  <Shield className="h-4 w-4" />
                  الخصوصية والأمان
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info (if available) */}
            {(user.phoneNumber || user.firstName || user.lastName) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">معلومات الاتصال</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.phoneNumber && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">رقم الهاتف</p>
                      <p className="font-medium">{user.phoneNumber}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">البريد الإلكتروني</p>
                    <p className="font-medium break-all">{user.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Main Content with Tabs */}
          <main>
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="bookmarks" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
                    <TabsTrigger value="bookmarks" className="gap-2" data-testid="tab-bookmarks">
                      <Bookmark className="h-4 w-4" />
                      <span className="hidden sm:inline">المحفوظات</span>
                      <Badge variant="secondary" className="sm:mr-1">
                        {bookmarkedArticles.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger value="liked" className="gap-2" data-testid="tab-liked">
                      <Heart className="h-4 w-4" />
                      <span className="hidden sm:inline">الإعجابات</span>
                      <Badge variant="secondary" className="sm:mr-1">
                        {likedArticles.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger value="history" className="gap-2" data-testid="tab-history">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">السجل</span>
                      <Badge variant="secondary" className="sm:mr-1">
                        {readingHistory.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">الإعدادات</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bookmarks" className="space-y-4">
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
                      <div className="text-center py-16">
                        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Bookmark className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">لا توجد مقالات محفوظة</h3>
                        <p className="text-muted-foreground mb-6">
                          احفظ المقالات المفضلة لديك للوصول إليها بسهولة لاحقاً
                        </p>
                        <Button asChild>
                          <Link href="/">
                            <a>تصفح المقالات</a>
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="liked" className="space-y-4">
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
                      <div className="text-center py-16">
                        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Heart className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">لم تعجب بأي مقالات بعد</h3>
                        <p className="text-muted-foreground mb-6">
                          اكتشف المقالات المميزة وأظهر إعجابك بها
                        </p>
                        <Button asChild>
                          <Link href="/">
                            <a>تصفح المقالات</a>
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
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
                      <div className="text-center py-16">
                        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">لا يوجد سجل قراءة</h3>
                        <p className="text-muted-foreground mb-6">
                          ابدأ القراءة وسيظهر سجل قراءتك هنا
                        </p>
                        <Button asChild>
                          <Link href="/">
                            <a>تصفح المقالات</a>
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">تحديث المعلومات الشخصية</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        قم بتحديث بياناتك الشخصية. جميع الحقول اختيارية.
                      </p>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>الاسم الأول</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="أدخل الاسم الأول" 
                                      {...field} 
                                      data-testid="input-firstName"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>اسم العائلة</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="أدخل اسم العائلة" 
                                      {...field}
                                      data-testid="input-lastName"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رقم الهاتف</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="+966 123 456 789" 
                                    {...field}
                                    data-testid="input-phoneNumber"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="profileImageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رابط الصورة الشخصية</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://example.com/image.jpg" 
                                    {...field}
                                    data-testid="input-profileImageUrl"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نبذة عنك</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="اكتب نبذة مختصرة عنك..."
                                    className="resize-none min-h-[120px]"
                                    {...field}
                                    data-testid="input-bio"
                                  />
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-muted-foreground">
                                  {field.value?.length || 0} / 500 حرف
                                </p>
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              type="submit"
                              disabled={updateMutation.isPending}
                              data-testid="button-save"
                            >
                              {updateMutation.isPending ? (
                                <>
                                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                  جاري الحفظ...
                                </>
                              ) : (
                                <>
                                  <FileText className="ml-2 h-4 w-4" />
                                  حفظ التغييرات
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
