import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, Loader2, Key, AlertTriangle } from "lucide-react";

const verifySchema = z.object({
  token: z.string().min(1, "الرمز مطلوب"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function TwoFactorVerify() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      token: "",
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    try {
      setIsLoading(true);
      
      await apiRequest("/api/2fa/verify", {
        method: "POST",
        body: JSON.stringify({
          token: data.token,
          isBackupCode: useBackupCode,
        }),
      });

      toast({
        title: "تم التحقق بنجاح",
        description: "مرحباً بك في سبق الذكية",
      });

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: "فشل التحقق",
        description: error.message || useBackupCode 
          ? "الرمز الاحتياطي غير صحيح أو مستخدم مسبقاً"
          : "الرمز غير صحيح",
        variant: "destructive",
      });
      
      // Reset the form on error
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    form.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              {useBackupCode ? (
                <Key className="w-8 h-8 text-primary-foreground" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">التحقق بخطوتين</CardTitle>
          <CardDescription>
            {useBackupCode 
              ? "أدخل أحد رموزك الاحتياطية للمتابعة"
              : "أدخل الرمز من تطبيق المصادقة للمتابعة"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!useBackupCode ? (
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز التحقق</FormLabel>
                      <FormControl>
                        <div className="flex justify-center" dir="ltr">
                          <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                            data-testid="input-2fa-token"
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرمز الاحتياطي</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="أدخل الرمز الاحتياطي"
                          disabled={isLoading}
                          data-testid="input-backup-code"
                          dir="ltr"
                          className="font-mono text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {useBackupCode 
                    ? "كل رمز احتياطي يمكن استخدامه مرة واحدة فقط"
                    : "الرمز صالح لمدة 30 ثانية فقط"
                  }
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-verify-2fa"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="ml-2 h-4 w-4" />
                    تحقق
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleToggleBackupCode}
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                  data-testid="link-toggle-backup-code"
                >
                  {useBackupCode 
                    ? "استخدام رمز من تطبيق المصادقة"
                    : "استخدام رمز احتياطي بدلاً من ذلك"
                  }
                </button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    // Logout and return to login page
                    window.location.href = "/login";
                  }}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                  data-testid="link-back-to-login"
                >
                  العودة إلى تسجيل الدخول
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
