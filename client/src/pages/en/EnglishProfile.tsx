import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { EnglishLayout } from "@/components/en/EnglishLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import type { User as UserType } from "@shared/schema";

const updateUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/, "Invalid phone number").optional(),
  profileImageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function EnglishProfile() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("settings");

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
        title: "Updated successfully",
        description: "Your profile has been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUploadUrl = async () => {
    const response = await apiRequest("/api/profile/image/upload", {
      method: "POST",
    });
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleAvatarUploadComplete = async (result: any) => {
    try {
      const uploadedUrl = result.successful?.[0]?.uploadURL;
      if (!uploadedUrl) {
        throw new Error('Failed to get image URL');
      }

      await apiRequest("/api/profile/image", {
        method: "PUT",
        body: JSON.stringify({ profileImageUrl: uploadedUrl }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error) {
      console.error("[Profile] Image upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: UpdateUserFormData) => {
    updateMutation.mutate(data);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

  return (
    <EnglishLayout>
      <main className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-profile">
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt={`${user?.firstName} ${user?.lastName}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {getInitials(user?.firstName, user?.lastName, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024}
                    allowedFileTypes={['.jpg', '.jpeg', '.png', '.webp']}
                    onGetUploadParameters={getUploadUrl}
                    onComplete={handleAvatarUploadComplete}
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </ObjectUploader>
                </div>

                <h2 className="text-xl font-bold mb-1" data-testid="text-user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </h2>
                <p className="text-sm text-muted-foreground mb-3" data-testid="text-user-email">
                  {user?.email}
                </p>

                {user?.role && (
                  <Badge variant="secondary" className="mb-4" data-testid="badge-user-role">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                )}

                <Separator className="my-4" />

                {user?.bio && (
                  <p className="text-sm text-muted-foreground" data-testid="text-user-bio">
                    {user.bio}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="settings" data-testid="tab-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="security" data-testid="tab-security">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and bio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Enter first name"
                                    data-testid="input-first-name"
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
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Enter last name"
                                    data-testid="input-last-name"
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
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter phone number"
                                  data-testid="input-phone"
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
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Tell us about yourself"
                                  rows={4}
                                  data-testid="input-bio"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            {updateMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <TwoFactorSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </EnglishLayout>
  );
}
