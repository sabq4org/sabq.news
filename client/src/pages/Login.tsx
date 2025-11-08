import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getDefaultRedirectPath, isStaff, type User } from "@/hooks/useAuth";
import { SiGoogle, SiApple } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import sabqLogo from "@assets/sabq-logo.png";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      // Check if 2FA is required
      if (response.requires2FA) {
        toast({
          title: "التحقق بخطوتين مطلوب",
          description: "يرجى استخدام صفحة تسجيل دخول الإدارة",
        });
        navigate("/admin/login");
        return;
      }

      // Fetch user data to determine redirect path
      const userData = await queryClient.fetchQuery<User>({
        queryKey: ["/api/auth/user"],
      });

      toast({
        title: "مرحباً بك!",
        description: "تم تسجيل الدخول بنجاح",
      });

      // Smart redirect based on user role
      const redirectPath = getDefaultRedirectPath(userData);
      window.location.href = redirectPath;
    } catch (error: any) {
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4A90E2] via-[#5B9FED] to-[#6DAEF8] p-4 lg:p-8" dir="rtl">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Right Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-white space-y-6 px-8">
          {/* Logo */}
          <div className="text-center space-y-6">
            <img 
              src={sabqLogo} 
              alt="سبق" 
              className="w-64 h-auto mx-auto brightness-0 invert"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>

          {/* Tagline */}
          <div className="text-center space-y-3 max-w-md">
            <h2 className="text-2xl font-semibold">حيث تلتقي الثقة بالمصداقية</h2>
            <p className="text-lg opacity-90">صحافة ذكية. مستقبل مشرق.</p>
            <p className="text-base opacity-80">التميز في لوحة الإعلام الرقمي المدعوم بالذكاء الاصطناعي</p>
          </div>

          {/* AI Badge */}
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30 px-4 py-2 text-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 ml-2" />
            AI-Powered
          </Badge>
        </div>

        {/* Left Side - Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-right">مرحباً بك في مستقبل الصحافة الذكية</CardTitle>
            <CardDescription className="text-right">
              الدخول إلى لوحة التحكم المدعومة بالذكاء الاصطناعي
            </CardDescription>
          </CardHeader>
          <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="admin@sabq.sa"
                        disabled={isLoading}
                        data-testid="input-email"
                        className="text-right"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>كلمة المرور</FormLabel>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-sm text-primary hover:underline"
                        data-testid="link-forgot-password"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••"
                        disabled={isLoading}
                        data-testid="input-password"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تحويل إلى لوحة التحكم"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/api/auth/google'}
                data-testid="button-google-login"
              >
                <SiGoogle className="ml-2 h-4 w-4" />
                تسجيل الدخول عبر Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/api/auth/apple'}
                data-testid="button-apple-login"
              >
                <SiApple className="ml-2 h-4 w-4" />
                تسجيل الدخول عبر Apple
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-primary hover:underline font-medium"
                  data-testid="link-register"
                >
                  إنشاء حساب جديد
                </button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">هل أنت من الإدارة أو الصحفيين؟</p>
                <button
                  type="button"
                  onClick={() => navigate("/admin/login")}
                  className="text-sm text-primary hover:underline font-medium"
                  data-testid="link-admin-login"
                >
                  تسجيل دخول الإدارة
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Mobile Branding - shown on small screens */}
      <div className="lg:hidden text-center mt-8 text-white">
        <h2 className="text-2xl font-bold mb-2">سبق الذكية</h2>
        <p className="text-sm opacity-90">صحافة ذكية مدعومة بالذكاء الاصطناعي</p>
      </div>
      </div>
    </div>
  );
}
