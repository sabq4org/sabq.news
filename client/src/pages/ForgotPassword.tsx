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
import { KeyRound, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      // In development, show the reset link
      if (response.resetLink) {
        setResetLink(response.resetLink);
      }

      toast({
        title: "تم إرسال رابط إعادة التعيين",
        description: response.message,
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في معالجة طلبك",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">نسيت كلمة المرور؟</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                        placeholder="example@email.com"
                        disabled={isLoading}
                        data-testid="input-forgot-email"
                        className="text-right"
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
                data-testid="button-send-reset"
              >
                {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
              </Button>
            </form>
          </Form>

          {resetLink && (
            <Alert className="mt-4">
              <AlertDescription className="space-y-2">
                <p className="font-semibold">رابط إعادة التعيين (للتطوير فقط):</p>
                <a 
                  href={resetLink} 
                  className="text-primary hover:underline break-all text-sm"
                  data-testid="link-reset-dev"
                >
                  {resetLink}
                </a>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
              data-testid="link-back-to-login"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة لتسجيل الدخول
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
