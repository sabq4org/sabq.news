import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Trophy,
  Coins,
  Star,
  ChevronDown,
  Tag,
  X,
  AlertCircle,
  Mail,
  Users,
  UserPlus,
  UserMinus,
  IdCard,
} from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { SmartInterestsBlock } from "@/components/SmartInterestsBlock";
import { ObjectUploader } from "@/components/ObjectUploader";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import type { ArticleWithDetails, User as UserType, UserPointsTotal } from "@shared/schema";
import { hasRole } from "@/hooks/useAuth";

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
  const [activeTab, setActiveTab] = useState("bookmarks");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/resend-verification", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال رسالة التحقق إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال رسالة التحقق. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarUploadComplete = async (result: any) => {
    try {
      const uploadedUrl = result.successful?.[0]?.uploadURL;
      if (!uploadedUrl) {
        throw new Error('لم يتم الحصول على رابط الصورة');
      }

      console.log("[Profile] Image uploaded to:", uploadedUrl);

      // Set ACL and save to user profile
      const response = await apiRequest("/api/profile/image", {
        method: "PUT",
        body: JSON.stringify({ profileImageUrl: uploadedUrl }),
      });

      console.log("[Profile] Image saved to profile:", response);

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث صورتك الشخصية",
      });
    } catch (error: any) {
      console.error("[Profile] Error saving image:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ الصورة. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const getUploadUrl = async () => {
    const response = await apiRequest("/api/profile/image/upload", {
      method: "POST",
    });
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const onSubmit = (data: UpdateUserFormData) => {
    updateMutation.mutate(data);
  };

  const { data: likedArticles = [], isLoading: isLoadingLiked } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/profile/liked"],
    enabled: !!user,
  });

  const { data: bookmarkedArticles = [], isLoading: isLoadingBookmarks } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/profile/bookmarks"],
    enabled: !!user,
  });

  const { data: readingHistory = [], isLoading: isLoadingHistory } = useQuery<ArticleWithDetails[]>({
    queryKey: ["/api/profile/history"],
    enabled: !!user,
  });

  const { data: loyaltyPoints } = useQuery<UserPointsTotal>({
    queryKey: ["/api/loyalty/points"],
    enabled: !!user,
  });

  const { data: followedKeywords = [], isLoading: isLoadingKeywords } = useQuery<
    Array<{ tagId: string; tagName: string; notify: boolean; articleCount: number }>
  >({
    queryKey: ["/api/user/followed-keywords"],
    enabled: !!user,
  });

  const unfollowKeywordMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return await apiRequest(`/api/keywords/unfollow/${tagId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/followed-keywords"] });
      toast({
        title: "تم إلغاء المتابعة",
        description: "لن تتلقى إشعارات عن هذه الكلمة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء المتابعة",
        variant: "destructive",
      });
    },
  });

  const { data: followStats, isLoading: isLoadingFollowStats } = useQuery<{
    followersCount: number;
    followingCount: number;
  }>({
    queryKey: ['/api/social/stats', user?.id],
    enabled: !!user,
  });

  const { data: followers = [], isLoading: isLoadingFollowers } = useQuery<
    Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      bio: string | null;
      profileImageUrl: string | null;
    }>
  >({
    queryKey: ['/api/social/followers', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/social/followers/${user?.id}?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch followers');
      return res.json();
    },
    enabled: !!user && activeTab === 'followers',
  });

  const { data: following = [], isLoading: isLoadingFollowing } = useQuery<
    Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      bio: string | null;
      profileImageUrl: string | null;
    }>
  >({
    queryKey: ['/api/social/following', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/social/following/${user?.id}?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch following');
      return res.json();
    },
    enabled: !!user && activeTab === 'following',
  });

  const unfollowUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/social/unfollow/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, unfollowedUserId) => {
      // Invalidate specific followers query for THIS user
      queryClient.invalidateQueries({ queryKey: ['/api/social/followers', user?.id] });
      
      // Invalidate specific following query for THIS user  
      queryClient.invalidateQueries({ queryKey: ['/api/social/following', user?.id] });
      
      // Invalidate stats for THIS user
      queryClient.invalidateQueries({ queryKey: ['/api/social/stats', user?.id] });
      
      // Also invalidate the unfollowed user's stats/followers
      queryClient.invalidateQueries({ queryKey: ['/api/social/stats', unfollowedUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/followers', unfollowedUserId] });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: "تم إلغاء المتابعة",
        description: "لم تعد تتابع هذا المستخدم",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء المتابعة",
        variant: "destructive",
      });
    },
  });

  const { data: walletStatus, isLoading: isLoadingWallet } = useQuery<{
    hasPass: boolean;
    serialNumber?: string;
    createdAt?: string;
    lastUpdated?: string;
  }>({
    queryKey: ['/api/wallet/status'],
    enabled: !!user,
  });

  const issueWalletPassMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/wallet/issue', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/status'] });
      toast({
        title: "تم إصدار البطاقة",
        description: "تم إصدار بطاقتك الرقمية بنجاح ويمكنك إضافتها الآن إلى Apple Wallet",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "تعذر إصدار البطاقة لأن بيانات الاعتماد الخاصة بـ Apple Wallet غير مكتملة. يرجى التواصل مع المسؤول.",
        variant: "destructive",
      });
    },
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

  const getRankIcon = (rank?: string) => {
    switch (rank) {
      case "سفير سبق":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "العضو الذهبي":
        return <Star className="h-5 w-5 text-amber-500" />;
      case "المتفاعل":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Coins className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankColor = (rank?: string) => {
    switch (rank) {
      case "سفير سبق":
        return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case "العضو الذهبي":
        return "from-amber-500/20 to-orange-500/20 border-amber-500/30";
      case "المتفاعل":
        return "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
      default:
        return "from-gray-500/20 to-slate-500/20 border-gray-500/30";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">يجب تسجيل الدخول</h1>
            <p className="text-muted-foreground mb-8">
              سجل الدخول لعرض ملفك الشخصي
            </p>
            <Button 
              onClick={() => window.location.href = "/api/login"} 
              data-testid="button-login-profile"
            >
              تسجيل الدخول
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
                
                <div className="absolute bottom-0 right-0">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024}
                    allowedFileTypes={['.jpg', '.jpeg', '.png', '.webp']}
                    onGetUploadParameters={getUploadUrl}
                    onComplete={handleAvatarUploadComplete}
                    variant="ghost"
                    size="icon"
                    buttonClassName="h-10 w-10 rounded-full shadow-lg"
                  >
                    <Upload className="h-4 w-4" />
                  </ObjectUploader>
                  <p className="absolute -bottom-8 right-0 text-xs text-muted-foreground whitespace-nowrap">
                    JPG, PNG, WEBP (حتى 5MB)
                  </p>
                </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <Card className="hover-elevate transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">المتابعة</p>
                      {isLoadingFollowStats ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <p className="text-2xl font-bold" data-testid="text-stat-following">
                          {followStats?.followersCount || 0} متابع / {followStats?.followingCount || 0} متابَع
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Alert */}
      {user && !user.emailVerified && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900" data-testid="alert-email-verification">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">
              يرجى تفعيل حسابك عبر البريد الإلكتروني
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p>
                  للوصول الكامل لجميع الميزات، يرجى التحقق من بريدك الإلكتروني وتفعيل حسابك.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendVerificationMutation.mutate()}
                  disabled={resendVerificationMutation.isPending}
                  className="shrink-0 border-yellow-300 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                  data-testid="button-resend-verification"
                >
                  {resendVerificationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 ml-2" />
                      إعادة إرسال رسالة التحقق
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6">
          {/* Sidebar */}
          <aside className="space-y-4 lg:space-y-6">
            {/* Smart Interests - Mobile Collapsible */}
            <div className="lg:block">
              <Collapsible defaultOpen={false} className="lg:hidden">
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover-elevate p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">اهتماماتك</CardTitle>
                        <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      <SmartInterestsBlock userId={user.id} />
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              
              {/* Desktop - Always visible */}
              <div className="hidden lg:block">
                <SmartInterestsBlock userId={user.id} />
              </div>
            </div>

            {/* Followed Keywords - Mobile Collapsible */}
            <Collapsible defaultOpen={false} className="lg:hidden">
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover-elevate p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        كلماتي المتابعة
                      </CardTitle>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0">
                    {isLoadingKeywords ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : followedKeywords.length > 0 ? (
                      <div className="space-y-2">
                        {followedKeywords.map((keyword) => (
                          <div
                            key={keyword.tagId}
                            className="flex items-center justify-between gap-2 p-2 rounded-md hover-elevate"
                          >
                            <Link href={`/keyword/${keyword.tagName}`}>
                              <span className="flex items-center gap-2 flex-1 cursor-pointer" data-testid={`link-keyword-${keyword.tagId}`}>
                                <Tag className="h-3.5 w-3.5 text-primary" />
                                <span className="text-sm font-medium">{keyword.tagName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {keyword.articleCount}
                                </Badge>
                              </span>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => unfollowKeywordMutation.mutate(keyword.tagId)}
                              disabled={unfollowKeywordMutation.isPending}
                              data-testid={`button-unfollow-keyword-${keyword.tagId}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Tag className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          لم تتابع أي كلمات بعد
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Desktop Followed Keywords - Always visible */}
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  كلماتي المتابعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKeywords ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : followedKeywords.length > 0 ? (
                  <div className="space-y-2">
                    {followedKeywords.map((keyword) => (
                      <div
                        key={keyword.tagId}
                        className="flex items-center justify-between gap-2 p-2 rounded-md hover-elevate"
                      >
                        <Link href={`/keyword/${keyword.tagName}`}>
                          <span className="flex items-center gap-2 flex-1 cursor-pointer" data-testid={`link-keyword-${keyword.tagId}`}>
                            <Tag className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">{keyword.tagName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {keyword.articleCount}
                            </Badge>
                          </span>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => unfollowKeywordMutation.mutate(keyword.tagId)}
                          disabled={unfollowKeywordMutation.isPending}
                          data-testid={`button-unfollow-keyword-${keyword.tagId}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Tag className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      لم تتابع أي كلمات بعد
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loyalty Program - Mobile Collapsible */}
            <Collapsible defaultOpen={false} className="lg:hidden">
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover-elevate p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getRankIcon(loyaltyPoints?.currentRank)}
                        برنامج الولاء
                      </CardTitle>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3 p-4 pt-0">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">رتبتك الحالية</span>
                      </div>
                      <div className="font-semibold text-lg" data-testid="text-loyalty-rank-mobile">
                        {loyaltyPoints?.currentRank || "القارئ الجديد"}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">النقاط الكلية</span>
                        <span className="font-semibold">
                          {loyaltyPoints?.lifetimePoints || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">النقاط المتاحة</span>
                        <span className="font-semibold text-primary">
                          {loyaltyPoints?.totalPoints || 0}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="default"
                      className="w-full gap-2"
                      asChild
                      data-testid="button-view-rewards-mobile"
                    >
                      <a href="/loyalty">
                        <Trophy className="h-4 w-4" />
                        استبدل النقاط
                      </a>
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Desktop Loyalty Program - Always visible */}
            <Card className={`hidden lg:block bg-gradient-to-br ${getRankColor(loyaltyPoints?.currentRank)} border`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getRankIcon(loyaltyPoints?.currentRank)}
                    برنامج الولاء
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Coins className="h-3 w-3" />
                    {loyaltyPoints?.totalPoints || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">رتبتك الحالية</span>
                  </div>
                  <div className="font-semibold text-lg" data-testid="text-loyalty-rank">
                    {loyaltyPoints?.currentRank || "القارئ الجديد"}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">النقاط الكلية</span>
                    <span className="font-semibold" data-testid="text-loyalty-lifetime">
                      {loyaltyPoints?.lifetimePoints || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">النقاط المتاحة</span>
                    <span className="font-semibold text-primary" data-testid="text-loyalty-available">
                      {loyaltyPoints?.totalPoints || 0}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="default"
                  className="w-full gap-2"
                  asChild
                  data-testid="button-view-rewards"
                >
                  <a href="/loyalty">
                    <Trophy className="h-4 w-4" />
                    استبدل النقاط
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions - Mobile Collapsible */}
            <Collapsible defaultOpen={false} className="lg:hidden">
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover-elevate p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">إجراءات سريعة</CardTitle>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2 p-4 pt-0">
                {hasRole(user, "editor", "admin", "system_admin") && (
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
                  onClick={() => setActiveTab("settings")}
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                  data-testid="button-notifications"
                >
                  <Bell className="h-4 w-4" />
                  إعدادات الإشعارات
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                  data-testid="button-privacy"
                >
                  <Shield className="h-4 w-4" />
                  الخصوصية والأمان
                </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Desktop Quick Actions - Always visible */}
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-base">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {hasRole(user, "editor", "admin", "system_admin") && (
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
                  onClick={() => setActiveTab("settings")}
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                  data-testid="button-notifications"
                >
                  <Bell className="h-4 w-4" />
                  إعدادات الإشعارات
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                  data-testid="button-privacy"
                >
                  <Shield className="h-4 w-4" />
                  الخصوصية والأمان
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info (if available) - Mobile Collapsible */}
            {(user.phoneNumber || user.firstName || user.lastName) && (
              <>
                <Collapsible defaultOpen={false} className="lg:hidden">
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover-elevate p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">معلومات الاتصال</CardTitle>
                          <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-3 p-4 pt-0">
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
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Desktop Contact Info - Always visible */}
                <Card className="hidden lg:block">
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
              </>
            )}
          </aside>

          {/* Main Content with Tabs */}
          <main>
            <Card>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6">
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
                    
                    <TabsTrigger value="following" className="gap-2" data-testid="tab-following">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">المتابعة</span>
                    </TabsTrigger>
                    
                    <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">الأمان</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bookmarks">
                    {isLoadingBookmarks ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="space-y-3">
                            <Skeleton className="aspect-[16/9] w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        ))}
                      </div>
                    ) : bookmarkedArticles.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        <AnimatePresence>
                          {bookmarkedArticles.map((article, index) => (
                            <motion.div
                              key={article.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <ArticleCard
                                article={article}
                                variant="grid"
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-16"
                      >
                        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Bookmark className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">لا توجد مقالات محفوظة</h3>
                        <p className="text-muted-foreground mb-6">
                          احفظ المقالات المفضلة لديك للوصول إليها بسهولة لاحقاً
                        </p>
                        <Button asChild data-testid="button-browse-articles">
                          <Link href="/">
                            <a>تصفح المقالات</a>
                          </Link>
                        </Button>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="liked">
                    {isLoadingLiked ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="space-y-3">
                            <Skeleton className="aspect-[16/9] w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        ))}
                      </div>
                    ) : likedArticles.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        <AnimatePresence>
                          {likedArticles.map((article, index) => (
                            <motion.div
                              key={article.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <ArticleCard
                                article={article}
                                variant="grid"
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-16"
                      >
                        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Heart className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">لم تعجب بأي مقالات بعد</h3>
                        <p className="text-muted-foreground mb-6">
                          اكتشف المقالات المميزة وأظهر إعجابك بها
                        </p>
                        <Button asChild data-testid="button-browse-articles-liked">
                          <Link href="/">
                            <a>تصفح المقالات</a>
                          </Link>
                        </Button>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="history">
                    {isLoadingHistory ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="space-y-3">
                            <Skeleton className="aspect-[16/9] w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        ))}
                      </div>
                    ) : readingHistory.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        <AnimatePresence>
                          {readingHistory.map((article, index) => (
                            <motion.div
                              key={article.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <ArticleCard
                                article={article}
                                variant="grid"
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-16"
                      >
                        <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">لا يوجد سجل قراءة</h3>
                        <p className="text-muted-foreground mb-6">
                          ابدأ القراءة وسيظهر سجل قراءتك هنا
                        </p>
                        <Button asChild data-testid="button-browse-articles-history">
                          <Link href="/">
                            <a>تصفح المقالات</a>
                          </Link>
                        </Button>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="following" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Followers Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          المتابعون
                        </h3>
                        {isLoadingFollowers ? (
                          <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-48" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : followers.length > 0 ? (
                          <div className="space-y-3">
                            {followers.map((follower) => (
                              <Link key={follower.id} href={`/user/${follower.id}`}>
                                <a 
                                  className="flex items-center gap-3 p-3 rounded-lg border hover-elevate transition-all"
                                  data-testid={`link-follower-${follower.id}`}
                                >
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage 
                                      src={follower.profileImageUrl || ""} 
                                      alt={`${follower.firstName || ''} ${follower.lastName || ''}`}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {follower.firstName?.[0] || follower.email[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate" data-testid={`text-follower-name-${follower.id}`}>
                                      {follower.firstName && follower.lastName
                                        ? `${follower.firstName} ${follower.lastName}`
                                        : follower.email}
                                    </p>
                                    {follower.bio && (
                                      <p className="text-sm text-muted-foreground truncate">
                                        {follower.bio}
                                      </p>
                                    )}
                                  </div>
                                </a>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 border rounded-lg">
                            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              لا يوجد متابعون بعد
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Following Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <UserMinus className="h-5 w-5" />
                          المتابَعون
                        </h3>
                        {isLoadingFollowing ? (
                          <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                              </div>
                            ))}
                          </div>
                        ) : following.length > 0 ? (
                          <div className="space-y-3">
                            {following.map((followedUser) => (
                              <div 
                                key={followedUser.id} 
                                className="flex items-center gap-3 p-3 rounded-lg border hover-elevate transition-all"
                                data-testid={`card-following-${followedUser.id}`}
                              >
                                <Link href={`/user/${followedUser.id}`}>
                                  <a className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage 
                                        src={followedUser.profileImageUrl || ""} 
                                        alt={`${followedUser.firstName || ''} ${followedUser.lastName || ''}`}
                                      />
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {followedUser.firstName?.[0] || followedUser.email[0].toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate" data-testid={`text-following-name-${followedUser.id}`}>
                                        {followedUser.firstName && followedUser.lastName
                                          ? `${followedUser.firstName} ${followedUser.lastName}`
                                          : followedUser.email}
                                      </p>
                                      {followedUser.bio && (
                                        <p className="text-sm text-muted-foreground truncate">
                                          {followedUser.bio}
                                        </p>
                                      )}
                                    </div>
                                  </a>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => unfollowUserMutation.mutate(followedUser.id)}
                                  disabled={unfollowUserMutation.isPending}
                                  data-testid={`button-unfollow-${followedUser.id}`}
                                >
                                  {unfollowUserMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <UserMinus className="h-4 w-4 ml-1" />
                                      إلغاء المتابعة
                                    </>
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 border rounded-lg">
                            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              لا تتابع أي مستخدم بعد
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
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

                    <Separator className="my-8" />

                    <div>
                      <Card className="hover-elevate" data-testid="card-wallet">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <IdCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle>البطاقة الصحفية الرقمية</CardTitle>
                              <CardDescription>
                                احصل على بطاقة صحفية رسمية يمكن استخدامها عبر Apple Wallet لتأكيد اعتمادك بسرعة
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isLoadingWallet ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>جاري التحميل...</span>
                            </div>
                          ) : walletStatus?.hasPass ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" data-testid="status-wallet">
                                  تمت الإضافة
                                </Badge>
                              </div>
                              
                              {walletStatus.serialNumber && (
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">الرقم التسلسلي</p>
                                  <p className="text-sm font-mono" data-testid="text-wallet-serial">
                                    {walletStatus.serialNumber}
                                  </p>
                                </div>
                              )}
                              
                              {walletStatus.createdAt && (
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">تاريخ الإصدار</p>
                                  <p className="text-sm" data-testid="text-wallet-created">
                                    {new Date(walletStatus.createdAt).toLocaleDateString('ar-SA')}
                                  </p>
                                </div>
                              )}
                              
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  البطاقة جاهزة. سيتم تفعيل التحميل بعد إضافة بيانات Apple Developer.
                                </AlertDescription>
                              </Alert>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                لم تقم بإصدار بطاقتك الرقمية بعد. اضغط على الزر أدناه للحصول على بطاقة رسمية.
                              </p>
                              
                              <Button
                                onClick={() => issueWalletPassMutation.mutate()}
                                disabled={issueWalletPassMutation.isPending}
                                className="w-full sm:w-auto"
                                data-testid="button-wallet-add"
                              >
                                {issueWalletPassMutation.isPending ? (
                                  <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جاري إصدار البطاقة...
                                  </>
                                ) : (
                                  <>
                                    <IdCard className="ml-2 h-4 w-4" />
                                    إضافة إلى Apple Wallet
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Separator className="my-8" />
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">الأمان والحماية</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        قم بتأمين حسابك بطبقة حماية إضافية من خلال التحقق بخطوتين
                      </p>
                      
                      <TwoFactorSettings />
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
