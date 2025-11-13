import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, UserMinus, FileText, Users2 } from "lucide-react";
import type { User as UserType } from "@shared/schema";

type SuggestedUser = {
  id: string;
  username: string;
  fullName: string;
  bio: string | null;
  profilePicture: string | null;
  role: string;
  followersCount: number;
  articlesCount: number;
  isFollowing: boolean;
};

export default function DiscoverUsers() {
  const { toast } = useToast();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth({ redirectToLogin: true });

  // Fetch suggested users
  const { data: suggestedData, isLoading: isLoadingSuggested } = useQuery<{
    users: SuggestedUser[];
  }>({
    queryKey: ["/api/users/suggested"],
    enabled: !!currentUser,
  });

  const suggestedUsers = suggestedData?.users || [];

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("/api/social/follow", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/following", currentUser?.id] });
      toast({
        title: "تمت المتابعة",
        description: "أصبحت تتابع هذا المستخدم",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشلت عملية المتابعة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/social/unfollow/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/stats", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/following", currentUser?.id] });
      toast({
        title: "تم إلغاء المتابعة",
        description: "لم تعد تتابع هذا المستخدم",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشلت عملية إلغاء المتابعة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case "chief_editor":
        return "default";
      case "editor":
        return "secondary";
      case "writer":
      case "reporter":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      chief_editor: "رئيس تحرير",
      editor: "محرر",
      writer: "كاتب",
      reporter: "مراسل",
      opinion_author: "كاتب رأي",
      content_creator: "منشئ محتوى",
    };
    return labels[role] || role;
  };

  // Loading state
  if (isAuthLoading || isLoadingSuggested) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={currentUser || undefined} />
        
        <div className="relative">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <Skeleton className="h-10 w-64 mb-3 mx-auto" />
              <Skeleton className="h-5 w-96 mx-auto" />
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={currentUser || undefined} />

      {/* Hero Section */}
      <div className="relative">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="h-8 w-8 text-primary" />
              <h1
                className="text-3xl sm:text-4xl font-bold"
                data-testid="heading-discover-users"
              >
                اكتشف الكتّاب والمحررين
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              تابع الكتّاب النشطين واحصل على تحديثات مقالاتهم
            </p>
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {suggestedUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                لا يوجد مستخدمون مقترحون حالياً
              </h2>
              <p className="text-muted-foreground">
                تحقق مرة أخرى لاحقاً لاكتشاف كتّاب ومحررين جدد
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedUsers.map((user) => (
                <Card
                  key={user.id}
                  className="hover-elevate transition-all"
                  data-testid={`card-user-${user.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16 shrink-0">
                        <AvatarImage
                          src={user.profilePicture || ""}
                          alt={user.fullName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold mb-1 truncate">
                          {user.fullName}
                        </h3>
                        <p
                          className="text-sm text-muted-foreground mb-2"
                          data-testid={`text-username-${user.id}`}
                        >
                          @{user.username}
                        </p>
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          data-testid={`badge-role-${user.id}`}
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-sm text-foreground/80 mb-4 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{user.followersCount} متابع</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{user.articlesCount} مقال</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    {user.isFollowing ? (
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => unfollowMutation.mutate(user.id)}
                        disabled={unfollowMutation.isPending}
                        className="w-full gap-2"
                        data-testid={`button-unfollow-${user.id}`}
                      >
                        <UserMinus className="h-4 w-4" />
                        إلغاء المتابعة
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="default"
                        onClick={() => followMutation.mutate(user.id)}
                        disabled={followMutation.isPending}
                        className="w-full gap-2"
                        data-testid={`button-follow-${user.id}`}
                      >
                        <UserPlus className="h-4 w-4" />
                        متابعة
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
