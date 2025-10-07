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
  User, 
  Heart, 
  Bookmark, 
  FileText, 
  Settings,
  Bell,
  Shield,
  Save,
  Loader2,
  Upload,
} from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { ObjectUploader } from "@/components/ObjectUploader";
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

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.profileImageUrl || ""} alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
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
                        if (result.successful && result.successful[0]) {
                          const uploadURL = result.successful[0].uploadURL;
                          await apiRequest("/api/profile/image", {
                            method: "PUT",
                            body: JSON.stringify({ profileImageUrl: uploadURL }),
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                          toast({
                            title: "تم التحديث بنجاح",
                            description: "تم تحديث صورتك الشخصية",
                          });
                        }
                      }}
                      variant="ghost"
                      size="icon"
                      buttonClassName="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    >
                      <Upload className="h-4 w-4" />
                    </ObjectUploader>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold" data-testid="text-profile-name">
                      {getUserDisplayName()}
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
                  <TabsList className="grid w-full grid-cols-4">
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
                    <TabsTrigger value="settings" data-testid="tab-settings">
                      <Settings className="h-4 w-4 ml-2" />
                      الإعدادات
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

                  <TabsContent value="settings" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>تحديث المعلومات الشخصية</CardTitle>
                        <CardDescription>
                          قم بتحديث بياناتك الشخصية. جميع الحقول اختيارية.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
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
                                      className="resize-none min-h-[100px]"
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

                            <div className="flex justify-end gap-2 pt-4">
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
                                    <Save className="ml-2 h-4 w-4" />
                                    حفظ التغييرات
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
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
