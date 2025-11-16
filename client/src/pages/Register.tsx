import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiApple } from "react-icons/si";
import { ChevronLeft, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { GoogleIcon } from "@/components/GoogleIcon";

const registerSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().min(2, "الاسم الأخير مطلوب"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول",
      });

      // Redirect to onboarding welcome page
      navigate("/onboarding/welcome");
    } catch (error: any) {
      toast({
        title: "فشل إنشاء الحساب",
        description: error.message || "حدث خطأ ما. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="w-full max-w-md pt-10 mx-auto mb-5">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-home"
          >
            <ChevronLeft className="h-5 w-5 ml-1" />
            العودة للرئيسية
          </Link>
        </div>
        
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pb-10">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h1 className="mb-1.5 sm:mb-2 font-semibold text-gray-800 text-xl sm:text-2xl lg:text-title-md dark:text-white/90 text-right">
              إنشاء حساب
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground text-right">
              أدخل بياناتك للتسجيل!
            </p>
          </div>
          
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full inline-flex items-center justify-center gap-2 sm:gap-3"
                data-testid="button-google-register"
              >
                <GoogleIcon />
                إنشاء حساب عبر Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = '/api/auth/apple'}
                className="w-full inline-flex items-center justify-center gap-2 sm:gap-3"
                data-testid="button-apple-register"
              >
                <SiApple className="h-4 w-4 sm:h-5 sm:w-5" />
                إنشاء حساب عبر Apple
              </Button>
            </div>

            <div className="relative my-4 sm:my-5 lg:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">أو</span>
              </div>
            </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 lg:space-y-5">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="محمد"
                          disabled={isLoading}
                          data-testid="input-firstName"
                          className="text-right"
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
                      <FormLabel>الاسم الأخير</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="أحمد"
                          disabled={isLoading}
                          data-testid="input-lastName"
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        placeholder="email@example.com"
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
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••"
                          disabled={isLoading}
                          data-testid="input-password"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تأكيد كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••"
                          disabled={isLoading}
                          data-testid="input-confirmPassword"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-toggle-confirmPassword"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                <div className="flex items-start gap-2 sm:gap-2.5 lg:gap-3 p-2.5 sm:p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <Checkbox
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    data-testid="checkbox-terms"
                    className="mt-0.5"
                  />
                  <label 
                    htmlFor="terms-checkbox"
                    className="text-sm text-foreground cursor-pointer leading-relaxed"
                  >
                    بإنشاء حساب، أنت توافق على{" "}
                    <Link 
                      to="/terms" 
                      className="text-primary font-medium hover:underline"
                      data-testid="link-terms"
                    >
                      الشروط والأحكام
                    </Link>
                    {" "}و{" "}
                    <Link 
                      to="/privacy" 
                      className="text-primary font-medium hover:underline"
                      data-testid="link-privacy"
                    >
                      سياسة الخصوصية
                    </Link>
                  </label>
                </div>

                {!termsAccepted && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 px-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <p>يجب الموافقة على الشروط والأحكام لإنشاء الحساب</p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full min-h-11 text-base font-medium"
                disabled={isLoading || !termsAccepted}
                data-testid="button-register"
              >
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
              </Button>
            </form>
          </Form>
          </div>
          
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              لديك حساب بالفعل؟{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline font-medium"
                data-testid="link-login"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
