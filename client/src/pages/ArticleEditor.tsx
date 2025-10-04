import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Send,
  ArrowRight,
  Sparkles,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Category, ArticleWithDetails } from "@shared/schema";

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNewArticle = id === "new";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: article } = useQuery<ArticleWithDetails>({
    queryKey: ["/api/dashboard/articles", id],
    enabled: !isNewArticle,
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNewArticle && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleGenerateSummary = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    // Will be implemented in integration phase
    console.log("Generate AI summary");
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const handleGenerateTitle = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    // Will be implemented in integration phase
    console.log("Generate AI title");
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const handleSave = async (publishNow = false) => {
    console.log("Save article:", { title, slug, content, excerpt, categoryId, imageUrl, status: publishNow ? "published" : status });
    // Will be implemented in integration phase
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-testid="button-back"
              >
                <Link href="/dashboard">
                  <a className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    العودة
                  </a>
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold">
                {isNewArticle ? "مقال جديد" : "تحرير المقال"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                className="gap-2"
                data-testid="button-save-draft"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">حفظ كمسودة</span>
              </Button>
              <Button
                onClick={() => handleSave(true)}
                className="gap-2"
                data-testid="button-publish"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">نشر</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>محتوى المقال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">العنوان *</Label>
                  <Input
                    id="title"
                    placeholder="أدخل عنوان المقال..."
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-xl font-semibold"
                    data-testid="input-article-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">الرابط (Slug)</Label>
                  <Input
                    id="slug"
                    placeholder="article-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    dir="ltr"
                    className="font-mono text-sm"
                    data-testid="input-article-slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">المقتطف</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="مقتطف قصير يصف المقال..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    data-testid="textarea-article-excerpt"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">المحتوى *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateTitle}
                        disabled={isGenerating || !content.trim()}
                        className="gap-2"
                        data-testid="button-generate-title"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        توليد عنوان
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSummary}
                        disabled={isGenerating || !content.trim()}
                        className="gap-2"
                        data-testid="button-generate-summary"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        تلخيص تلقائي
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="content"
                    placeholder="اكتب محتوى المقال هنا..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    className="font-sans leading-loose"
                    data-testid="textarea-article-content"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length} حرف | {content.split(/\s+/).filter(Boolean).length} كلمة
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الصورة المميزة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {imageUrl ? (
                  <div className="relative aspect-video overflow-hidden rounded-lg border">
                    <img
                      src={imageUrl}
                      alt="Featured"
                      className="w-full h-full object-cover"
                      data-testid="img-article-preview"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 left-2"
                      onClick={() => setImageUrl("")}
                      data-testid="button-remove-image"
                    >
                      إزالة
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors">
                    <ImagePlus className="h-8 w-8" />
                    <p className="text-sm">لا توجد صورة</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">رابط الصورة</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    dir="ltr"
                    data-testid="input-image-url"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">إعدادات النشر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue placeholder="اختر تصنيفاً" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select 
                    value={status} 
                    onValueChange={(v) => setStatus(v as "draft" | "published")}
                  >
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="published">منشور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="border-accent">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-foreground" />
                  مساعد الذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  استخدم الذكاء الاصطناعي لتحسين مقالك
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleGenerateTitle}
                    disabled={isGenerating || !content.trim()}
                    data-testid="button-ai-title-sidebar"
                  >
                    <Sparkles className="h-4 w-4" />
                    اقتراح عناوين بديلة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleGenerateSummary}
                    disabled={isGenerating || !content.trim()}
                    data-testid="button-ai-summary-sidebar"
                  >
                    <Sparkles className="h-4 w-4" />
                    إنشاء ملخص تلقائي
                  </Button>
                </div>
                <Badge variant="secondary" className="w-full justify-center gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  مدعوم بـ GPT-5
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
