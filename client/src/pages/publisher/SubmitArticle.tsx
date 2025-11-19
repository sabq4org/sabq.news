import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Send, Eye, Upload, ImageIcon } from "lucide-react";
import type { Category } from "@shared/schema";

// Extend insertArticleSchema for publisher form
const publisherArticleSchema = z.object({
  title: z.string().min(10, "العنوان يجب أن يكون 10 أحرف على الأقل"),
  subtitle: z.string().optional(),
  content: z.string().min(100, "المحتوى يجب أن يكون 100 حرف على الأقل"),
  excerpt: z.string().optional(),
  categoryId: z.string().min(1, "يرجى اختيار التصنيف"),
  imageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
  language: z.enum(["ar", "en", "ur"]).default("ar"),
});

type PublisherArticleFormData = z.infer<typeof publisherArticleSchema>;

export default function SubmitArticle() {
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const articleId = params.id;

  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PublisherArticleFormData | null>(null);

  const form = useForm<PublisherArticleFormData>({
    resolver: zodResolver(publisherArticleSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      content: "",
      excerpt: "",
      categoryId: "",
      imageUrl: "",
      language: "ar",
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Fetch article if editing
  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ["/api/publisher/articles", articleId],
    queryFn: async () => {
      const articles = await fetch(`/api/publisher/articles?id=${articleId}`, {
        credentials: "include",
      }).then((r) => r.json());
      return articles[0];
    },
    enabled: !!articleId && !!user,
  });

  // Populate form when editing
  useEffect(() => {
    if (article && articleId) {
      form.reset({
        title: article.title || "",
        subtitle: article.subtitle || "",
        content: article.content || "",
        excerpt: article.excerpt || "",
        categoryId: article.categoryId || "",
        imageUrl: article.imageUrl || "",
        language: article.language || "ar",
      });
    }
  }, [article, articleId, form]);

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/media/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("فشل رفع الصورة");
      return response.json();
    },
  });

  // Submit article mutation
  const submitArticleMutation = useMutation({
    mutationFn: async ({
      data,
      status,
      publisherStatus,
    }: {
      data: PublisherArticleFormData;
      status: "draft" | "pending";
      publisherStatus?: "pending";
    }) => {
      const payload = {
        ...data,
        status,
        publisherStatus: publisherStatus || (status === "draft" ? undefined : "pending"),
        articleType: "news",
        newsType: "regular",
      };

      if (articleId) {
        return apiRequest(`/api/publisher/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      return apiRequest("/api/publisher/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/logs"] });

      const message =
        variables.status === "draft"
          ? "تم حفظ المسودة بنجاح"
          : "تم إرسال المقال للمراجعة بنجاح";

      toast({
        title: "نجح",
        description: message,
      });

      navigate("/publisher/articles");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشلت العملية",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      form.setValue("imageUrl", result.url);
      toast({
        title: "نجح",
        description: "تم رفع الصورة بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = (data: PublisherArticleFormData) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleSaveDraft = (data: PublisherArticleFormData) => {
    submitArticleMutation.mutate({ data, status: "draft" });
  };

  const handleSubmitForReview = (data: PublisherArticleFormData) => {
    submitArticleMutation.mutate({ data, status: "pending", publisherStatus: "pending" });
  };

  if (articleLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="heading-submit-article">
          {articleId ? "تعديل المقال" : "إرسال مقال جديد"}
        </h1>
        <p className="text-muted-foreground mt-1">
          املأ النموذج أدناه لإرسال مقالك
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المقال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل عنوان المقال"
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان الفرعي</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل العنوان الفرعي (اختياري)"
                        data-testid="input-subtitle"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصنيف *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اللغة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ur">اردو</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المقتطف</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="أدخل مقتطف المقال (اختياري)"
                        rows={3}
                        data-testid="textarea-excerpt"
                      />
                    </FormControl>
                    <FormDescription>
                      ملخص قصير للمقال (يظهر في القوائم)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المحتوى *</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div data-testid="editor-content">
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="ابدأ الكتابة..."
                          dir="rtl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>صورة المقال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط الصورة</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-image-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>أو ارفع صورة</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    data-testid="input-image-file"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            رفع صورة
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {form.watch("imageUrl") && (
                <div className="rounded-md border p-2">
                  <img
                    src={form.watch("imageUrl")}
                    alt="معاينة"
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.handleSubmit(handlePreview)()}
              data-testid="button-preview"
            >
              <Eye className="mr-2 h-4 w-4" />
              معاينة
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.handleSubmit(handleSaveDraft)()}
              disabled={submitArticleMutation.isPending}
              data-testid="button-save-draft"
            >
              {submitArticleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              حفظ كمسودة
            </Button>
            <Button
              type="button"
              onClick={() => form.handleSubmit(handleSubmitForReview)()}
              disabled={submitArticleMutation.isPending}
              data-testid="button-submit-review"
            >
              {submitArticleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              إرسال للمراجعة
            </Button>
          </div>
        </form>
      </Form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة المقال</DialogTitle>
            <DialogDescription>
              تحقق من المقال قبل الإرسال
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4" dir="rtl">
              {previewData.imageUrl && (
                <img
                  src={previewData.imageUrl}
                  alt={previewData.title}
                  className="w-full h-64 object-cover rounded-md"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{previewData.title}</h2>
                {previewData.subtitle && (
                  <p className="text-lg text-muted-foreground mt-2">
                    {previewData.subtitle}
                  </p>
                )}
              </div>
              {previewData.excerpt && (
                <p className="text-muted-foreground italic">
                  {previewData.excerpt}
                </p>
              )}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewData.content }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
