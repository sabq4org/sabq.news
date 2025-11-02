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
import { apiRequest } from "@/lib/queryClient";
import { LogIn } from "lucide-react";

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

      toast({
        title: "مرحباً بك!",
        description: "تم تسجيل الدخول بنجاح",
      });

      // Redirect to home page for regular users
      window.location.href = "/";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">سبق الذكية</CardTitle>
          <CardDescription className="text-right">
            سجل الدخول للوصول إلى حسابك
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
                {isLoading ? "جاري تسجيل الدخول..." : "دخول"}
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
    </div>
  );
}
