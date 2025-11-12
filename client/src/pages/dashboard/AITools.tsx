import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SmartHeadlineComparison } from "@/components/SmartHeadlineComparison";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, 
  FileText, 
  Share2, 
  Image as ImageIcon, 
  Languages,
  Copy,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AITools() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">مركز الذكاء الاصطناعي للمحتوى</h1>
          <p className="text-muted-foreground">
            أدوات ذكية متكاملة لتحسين وإنتاج المحتوى الصحفي باستخدام أحدث نماذج الذكاء الاصطناعي
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>300+ نموذج AI متاح</CardTitle>
            </div>
            <CardDescription>
              GPT-5، Claude Opus 4.1، Gemini 2.5 Pro، وأكثر من 300 نموذج ذكاء اصطناعي جاهز للاستخدام
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="headlines" className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-1" data-testid="tabs-list">
            <TabsTrigger value="headlines" data-testid="tab-headlines">
              <Sparkles className="w-4 h-4 ml-2" />
              العناوين الذكية
            </TabsTrigger>
            <TabsTrigger value="summarizer" data-testid="tab-summarizer">
              <FileText className="w-4 h-4 ml-2" />
              التلخيص
            </TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">
              <Share2 className="w-4 h-4 ml-2" />
              منشورات
            </TabsTrigger>
            <TabsTrigger value="images" data-testid="tab-images">
              <ImageIcon className="w-4 h-4 ml-2" />
              الصور
            </TabsTrigger>
            <TabsTrigger value="translate" data-testid="tab-translate">
              <Languages className="w-4 h-4 ml-2" />
              الترجمة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="headlines" className="mt-6">
            <SmartHeadlineComparison />
          </TabsContent>

          <TabsContent value="summarizer" className="mt-6">
            <TextSummarizer />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <SocialMediaGenerator />
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            <SmartImageSearch />
          </TabsContent>

          <TabsContent value="translate" className="mt-6">
            <InstantTranslator />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function TextSummarizer() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<"ar" | "en" | "ur">("ar");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!text.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال النص المراد تلخيصه",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ 
        summary: string; 
        wordCount: number; 
        compressionRate: number;
      }>("/api/ai-tools/summarize", {
        method: "POST",
        body: JSON.stringify({ text, language }),
      });

      setResult(response);
      toast({
        title: "تم التلخيص بنجاح",
        description: `تم تقليل النص بنسبة ${response.compressionRate}%`,
      });
    } catch (error: any) {
      toast({
        title: "فشل التلخيص",
        description: error.message || "حدث خطأ أثناء تلخيص النص",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الملخص إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء نسخ النص",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>تلخيص النصوص الذكي</CardTitle>
        </div>
        <CardDescription>
          استخدم Claude Sonnet 4-5 لتلخيص النصوص الطويلة مع الحفاظ على النقاط الرئيسية (30% من الطول الأصلي)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">اللغة</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ur">اردو</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text">النص الأصلي</Label>
          <Textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="الصق النص المراد تلخيصه هنا..."
            rows={8}
            className="resize-none"
            data-testid="textarea-text"
          />
          <p className="text-xs text-muted-foreground">
            عدد الكلمات: {text.trim().split(/\s+/).filter(w => w.length > 0).length}
          </p>
        </div>

        <Button
          onClick={handleSummarize}
          disabled={loading || !text.trim()}
          className="w-full"
          data-testid="button-summarize"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري التلخيص...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 ml-2" />
              لخص النص
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">الملخص</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" data-testid="badge-word-count">
                  {result.wordCount} كلمة
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-compression">
                  تقليل {result.compressionRate}%
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  data-testid="button-copy-summary"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 ml-1" />
                      تم
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 ml-1" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-4">
                <p className="text-base leading-relaxed" data-testid="text-summary">
                  {result.summary}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SocialMediaGenerator() {
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [platform, setPlatform] = useState<"twitter" | "facebook" | "linkedin">("twitter");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!articleTitle.trim() || !articleSummary.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال العنوان والملخص",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{
        post: string;
        hashtags: string[];
        characterCount: number;
      }>("/api/ai-tools/social-post", {
        method: "POST",
        body: JSON.stringify({ articleTitle, articleSummary, platform }),
      });

      setResult(response);
      toast({
        title: "تم إنشاء المنشور بنجاح",
        description: `منشور ${platform} جاهز (${response.characterCount} حرف)`,
      });
    } catch (error: any) {
      toast({
        title: "فشل إنشاء المنشور",
        description: error.message || "حدث خطأ أثناء إنشاء المنشور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result.post);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "تم النسخ",
        description: "تم نسخ المنشور إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء نسخ النص",
        variant: "destructive",
      });
    }
  };

  const platformConfig = {
    twitter: { name: "تويتر", maxChars: 280, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    facebook: { name: "فيسبوك", maxChars: 500, color: "bg-blue-700/10 text-blue-700 border-blue-700/20" },
    linkedin: { name: "لينكد إن", maxChars: 700, color: "bg-blue-600/10 text-blue-600 border-blue-600/20" },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          <CardTitle>منشورات وسائل التواصل</CardTitle>
        </div>
        <CardDescription>
          استخدم GPT-4o لإنشاء منشورات احترافية مخصصة لكل منصة تواصل اجتماعي
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="platform">المنصة</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
            <SelectTrigger data-testid="select-platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twitter">تويتر (280 حرف)</SelectItem>
              <SelectItem value="facebook">فيسبوك (500 حرف)</SelectItem>
              <SelectItem value="linkedin">لينكد إن (700 حرف)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-title">عنوان المقال</Label>
          <Textarea
            id="article-title"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            placeholder="اكتب عنوان المقال..."
            rows={2}
            className="resize-none"
            data-testid="textarea-article-title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-summary">ملخص المقال</Label>
          <Textarea
            id="article-summary"
            value={articleSummary}
            onChange={(e) => setArticleSummary(e.target.value)}
            placeholder="اكتب ملخصاً للمقال..."
            rows={4}
            className="resize-none"
            data-testid="textarea-article-summary"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !articleTitle.trim() || !articleSummary.trim()}
          className="w-full"
          data-testid="button-generate-post"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 ml-2" />
              أنشئ منشور {platformConfig[platform].name}
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">المنشور</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={platformConfig[platform].color} data-testid="badge-platform">
                  {platformConfig[platform].name}
                </Badge>
                <Badge variant="outline" data-testid="badge-char-count">
                  {result.characterCount} حرف
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  data-testid="button-copy-post"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 ml-1" />
                      تم
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 ml-1" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-base leading-relaxed whitespace-pre-wrap" data-testid="text-post">
                  {result.post}
                </p>
                {result.hashtags && result.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {result.hashtags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" data-testid={`badge-hashtag-${idx}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SmartImageSearch() {
  const [contentText, setContentText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!contentText.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال المحتوى",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{
        queries: string[];
        keywords: string[];
        description: string;
      }>("/api/ai-tools/image-search", {
        method: "POST",
        body: JSON.stringify({ contentText }),
      });

      setResult(response);
      toast({
        title: "تم إنشاء الاقتراحات بنجاح",
        description: `تم توليد ${response.queries.length} استعلامات بحث`,
      });
    } catch (error: any) {
      toast({
        title: "فشل الاقتراح",
        description: error.message || "حدث خطأ أثناء اقتراح كلمات البحث",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (query: string, index: number) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "تم النسخ",
        description: "تم نسخ استعلام البحث إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء نسخ النص",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <CardTitle>البحث الذكي عن الصور</CardTitle>
        </div>
        <CardDescription>
          استخدم Gemini 2.0 لاقتراح استعلامات بحث دقيقة للعثور على الصور المناسبة لمحتواك
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content-text">محتوى المقال</Label>
          <Textarea
            id="content-text"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="الصق محتوى المقال هنا لتحليله واقتراح صور مناسبة..."
            rows={6}
            className="resize-none"
            data-testid="textarea-content-text"
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || !contentText.trim()}
          className="w-full"
          data-testid="button-search-images"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 ml-2" />
              اقترح كلمات بحث
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            {result.description && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">الصورة المثالية</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-description">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {result.queries && result.queries.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">استعلامات البحث (للاستخدام في مكتبات الصور)</h3>
                {result.queries.map((query: string, idx: number) => (
                  <Card key={idx} className="hover-elevate" data-testid={`card-query-${idx}`}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <code className="text-sm bg-muted px-2 py-1 rounded" data-testid={`text-query-${idx}`}>
                        {query}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(query, idx)}
                        data-testid={`button-copy-query-${idx}`}
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 ml-1" />
                            تم
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 ml-1" />
                            نسخ
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {result.keywords && result.keywords.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">كلمات مفتاحية</h3>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="outline" data-testid={`badge-keyword-${idx}`}>
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InstantTranslator() {
  const [text, setText] = useState("");
  const [fromLang, setFromLang] = useState("ar");
  const [toLang, setToLang] = useState("en");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const languages = [
    { value: "ar", label: "العربية" },
    { value: "en", label: "English" },
    { value: "ur", label: "اردو" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" },
    { value: "de", label: "Deutsch" },
    { value: "tr", label: "Türkçe" },
  ];

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال النص المراد ترجمته",
        variant: "destructive",
      });
      return;
    }

    if (fromLang === toLang) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار لغتين مختلفتين",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{
        translatedText: string;
        originalLength: number;
        translatedLength: number;
      }>("/api/ai-tools/translate", {
        method: "POST",
        body: JSON.stringify({ text, fromLang, toLang }),
      });

      setResult(response);
      toast({
        title: "تمت الترجمة بنجاح",
        description: `تم ترجمة ${response.originalLength} كلمة`,
      });
    } catch (error: any) {
      toast({
        title: "فشلت الترجمة",
        description: error.message || "حدث خطأ أثناء الترجمة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الترجمة إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء نسخ النص",
        variant: "destructive",
      });
    }
  };

  const swapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    if (result) {
      setText(result.translatedText);
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-primary" />
          <CardTitle>الترجمة الفورية</CardTitle>
        </div>
        <CardDescription>
          استخدم Claude Sonnet 4-5 للترجمة الاحترافية مع الحفاظ على النبرة والأسلوب الأصلي
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="from-lang">من</Label>
            <Select value={fromLang} onValueChange={setFromLang}>
              <SelectTrigger data-testid="select-from-lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={swapLanguages}
              data-testid="button-swap-langs"
            >
              <Languages className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-lang">إلى</Label>
            <Select value={toLang} onValueChange={setToLang}>
              <SelectTrigger data-testid="select-to-lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text">النص الأصلي</Label>
          <Textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب أو الصق النص المراد ترجمته..."
            rows={6}
            className="resize-none"
            data-testid="textarea-translate-text"
          />
          <p className="text-xs text-muted-foreground">
            عدد الكلمات: {text.trim().split(/\s+/).filter(w => w.length > 0).length}
          </p>
        </div>

        <Button
          onClick={handleTranslate}
          disabled={loading || !text.trim() || fromLang === toLang}
          className="w-full"
          data-testid="button-translate"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الترجمة...
            </>
          ) : (
            <>
              <Languages className="w-4 h-4 ml-2" />
              ترجم النص
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">الترجمة</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" data-testid="badge-translated-word-count">
                  {result.translatedLength} كلمة
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  data-testid="button-copy-translation"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 ml-1" />
                      تم
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 ml-1" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-4">
                <p className="text-base leading-relaxed" data-testid="text-translation">
                  {result.translatedText}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
