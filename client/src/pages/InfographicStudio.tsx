import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  LayoutGrid, 
  Sparkles, 
  Download, 
  Copy, 
  Loader2,
  Palette,
  Image,
  Type,
  ArrowRight
} from "lucide-react";
import { infographicShapes, infographicStyles } from "@/config/infographicTemplates";

export default function InfographicStudio() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [shape, setShape] = useState("timeline");
  const [type, setType] = useState("minimal-flat");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{
    url: string;
    prompt: string;
    timestamp: Date;
  }>>([]);
  const [activeTab, setActiveTab] = useState("create");

  const handleGenerate = async () => {
    if (!content) {
      toast({
        title: "محتوى مطلوب",
        description: "يرجى إدخال المحتوى لإنشاء الإنفوجرافيك",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const selectedShape = infographicShapes[shape];
      const selectedType = infographicStyles[type];
      
      const combinedPrompt = `${selectedShape.prompt}. ${selectedType.prompt}. Content: ${content}`;

      const response = await apiRequest("/api/nano-banana/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: combinedPrompt,
          isInfographic: true 
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const newImage = {
        url: response.imageUrl,
        prompt: combinedPrompt,
        timestamp: new Date(),
      };

      setGeneratedImages([newImage, ...generatedImages]);
      setActiveTab("gallery");
      
      toast({
        title: "تم توليد الإنفوجرافيك!",
        description: "تم إنشاء الإنفوجرافيك بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التوليد",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء توليد الإنفوجرافيك",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `infographic-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "تم التحميل",
        description: "تم تحميل الإنفوجرافيك بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل الإنفوجرافيك",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الصورة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <LayoutGrid className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">استوديو الإنفوجرافيك</h1>
              <p className="text-muted-foreground mt-1">
                صمم إنفوجرافيك احترافي بالذكاء الاصطناعي
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Gemini 3 Pro
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="create" className="gap-2">
              <Palette className="h-4 w-4" />
              إنشاء جديد
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Image className="h-4 w-4" />
              المعرض ({generatedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      المحتوى
                    </CardTitle>
                    <CardDescription>
                      أدخل النص أو النقاط الرئيسية للإنفوجرافيك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="مثال: 5 خطوات للنجاح:
1. التخطيط الجيد
2. العمل الجاد
3. التعلم المستمر
4. بناء العلاقات
5. الصبر والمثابرة"
                      className="min-h-[200px]"
                      data-testid="textarea-infographic-content"
                    />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>شكل التصميم</CardTitle>
                      <CardDescription>
                        اختر الشكل المناسب لمحتواك
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={shape} onValueChange={setShape}>
                        <SelectTrigger data-testid="select-shape">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(infographicShapes).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{value.icon}</span>
                                <span>{value.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>نوع التصميم</CardTitle>
                      <CardDescription>
                        اختر الستايل المرئي
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(infographicStyles).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ background: value.color }}
                                />
                                <span>{value.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>المعاينة</CardTitle>
                    <CardDescription>
                      معاينة الإعدادات المختارة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">الشكل:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{infographicShapes[shape].icon}</span>
                        <span>{infographicShapes[shape].name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">النوع:</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ background: infographicStyles[type].color }}
                        />
                        <span>{infographicStyles[type].name}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium block mb-2">المحتوى:</span>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {content || "لم يتم إدخال محتوى بعد"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !content}
                  className="w-full h-12 text-lg"
                  size="lg"
                  data-testid="button-generate-studio"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      توليد الإنفوجرافيك
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">نصائح للحصول على أفضل النتائج:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• استخدم نقاط واضحة ومختصرة</li>
                          <li>• اختر الشكل المناسب للمحتوى</li>
                          <li>• جرب أنواع تصميم مختلفة</li>
                          <li>• يمكنك التعديل والتوليد مرة أخرى</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الإنفوجرافيك المولد</CardTitle>
                <CardDescription>
                  جميع التصاميم التي قمت بإنشائها
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 ? (
                  <div className="text-center py-12">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      لم يتم توليد أي إنفوجرافيك بعد
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("create")}
                    >
                      ابدأ الإنشاء
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedImages.map((image, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="aspect-square relative group">
                          <img 
                            src={image.url} 
                            alt={`Infographic ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => handleDownload(image.url)}
                              data-testid={`button-download-${index}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => handleCopyUrl(image.url)}
                              data-testid={`button-copy-${index}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {image.prompt}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(image.timestamp).toLocaleString('ar-SA')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}