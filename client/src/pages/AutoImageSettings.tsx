import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  Save, 
  Loader2, 
  AlertCircle, 
  Wand2,
  Check,
  X,
  Plus,
  Trash2
} from "lucide-react";
import type { Category } from "@shared/schema";

interface AutoImageSettings {
  enabled: boolean;
  articleTypes: string[];
  skipCategories: string[];
  defaultStyle: string;
  provider: string;
  autoPublish: boolean;
  generateOnSave: boolean;
  imagePromptTemplate?: string;
  maxMonthlyGenerations?: number;
  currentMonthGenerations?: number;
}

export default function AutoImageSettingsPage() {
  const [settings, setSettings] = useState<AutoImageSettings>({
    enabled: false,
    articleTypes: ["news", "analysis"],
    skipCategories: ["opinion", "columns"],
    defaultStyle: "photorealistic",
    provider: "nano-banana",
    autoPublish: false,
    generateOnSave: false,
    imagePromptTemplate: "",
    maxMonthlyGenerations: 100,
    currentMonthGenerations: 0
  });

  const [newCategory, setNewCategory] = useState("");

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: true
  });

  // Fetch settings
  const { data, isLoading } = useQuery<AutoImageSettings>({
    queryKey: ["/api/auto-image/settings"]
  });
  
  // Update local settings when data is fetched
  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: AutoImageSettings) => {
      return await apiRequest<{ success: boolean }>("/api/auto-image/settings", {
        method: "PUT",
        body: JSON.stringify(updatedSettings)
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات التوليد التلقائي بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auto-image/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const addSkipCategory = () => {
    if (newCategory && !settings.skipCategories.includes(newCategory)) {
      setSettings({
        ...settings,
        skipCategories: [...settings.skipCategories, newCategory]
      });
      setNewCategory("");
    }
  };

  const removeSkipCategory = (category: string) => {
    setSettings({
      ...settings,
      skipCategories: settings.skipCategories.filter(c => c !== category)
    });
  };

  const toggleArticleType = (type: string) => {
    if (settings.articleTypes.includes(type)) {
      setSettings({
        ...settings,
        articleTypes: settings.articleTypes.filter(t => t !== type)
      });
    } else {
      setSettings({
        ...settings,
        articleTypes: [...settings.articleTypes, type]
      });
    }
  };

  const articleTypeOptions = [
    { value: "news", label: "أخبار" },
    { value: "analysis", label: "تحليلات" },
    { value: "column", label: "أعمدة" },
    { value: "opinion", label: "آراء" }
  ];

  const styleOptions = [
    { value: "photorealistic", label: "واقعي" },
    { value: "illustration", label: "رسم توضيحي" },
    { value: "abstract", label: "تجريدي" },
    { value: "minimalist", label: "بسيط" },
    { value: "modern", label: "عصري" }
  ];

  const providerOptions = [
    { value: "nano-banana", label: "Nano Banana Pro" },
    { value: "gemini", label: "Google Gemini" },
    { value: "dall-e", label: "DALL-E 3" }
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wand2 className="h-8 w-8 text-primary" />
              إعدادات التوليد التلقائي للصور
            </h1>
            <p className="text-muted-foreground mt-2">
              تحكم في إعدادات توليد الصور بالذكاء الاصطناعي للمقالات
            </p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            size="lg"
            className="gap-2"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>

        {/* Usage Stats Alert */}
        {settings.currentMonthGenerations && settings.maxMonthlyGenerations && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>استخدام الشهر الحالي</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span>
                تم توليد {settings.currentMonthGenerations} من أصل {settings.maxMonthlyGenerations} صورة هذا الشهر
              </span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(settings.currentMonthGenerations / settings.maxMonthlyGenerations) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round((settings.currentMonthGenerations / settings.maxMonthlyGenerations) * 100)}%
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>الإعدادات الرئيسية</CardTitle>
            <CardDescription>
              تفعيل أو تعطيل التوليد التلقائي للصور
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="enabled" className="text-base font-medium">
                  تفعيل التوليد التلقائي
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  توليد صور تلقائياً للمقالات التي لا تحتوي على صور
                </p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, enabled: checked })
                }
              />
            </div>

            <Separator />

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>مزود خدمة التوليد</Label>
              <Select
                value={settings.provider}
                onValueChange={(value) => 
                  setSettings({ ...settings, provider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                اختر مزود الخدمة المفضل لتوليد الصور
              </p>
            </div>

            {/* Default Style */}
            <div className="space-y-2">
              <Label>النمط الافتراضي للصور</Label>
              <Select
                value={settings.defaultStyle}
                onValueChange={(value) => 
                  setSettings({ ...settings, defaultStyle: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto Generation Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="generateOnSave">
                    توليد عند الحفظ
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    توليد صورة تلقائياً عند حفظ المقال بدون صورة
                  </p>
                </div>
                <Switch
                  id="generateOnSave"
                  checked={settings.generateOnSave}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, generateOnSave: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoPublish">
                    النشر التلقائي للصور
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    نشر الصور المُولّدة تلقائياً دون الحاجة لموافقة
                  </p>
                </div>
                <Switch
                  id="autoPublish"
                  checked={settings.autoPublish}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, autoPublish: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Article Types Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>أنواع المقالات</CardTitle>
            <CardDescription>
              اختر أنواع المقالات التي سيتم توليد صور لها تلقائياً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {articleTypeOptions.map(type => (
                <div
                  key={type.value}
                  className={`
                    p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${settings.articleTypes.includes(type.value)
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/50"}
                  `}
                  onClick={() => toggleArticleType(type.value)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type.label}</span>
                    {settings.articleTypes.includes(type.value) ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skip Categories Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>الفئات المستثناة</CardTitle>
            <CardDescription>
              الفئات التي لن يتم توليد صور لها تلقائياً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select
                value={newCategory}
                onValueChange={setNewCategory}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر فئة لاستثنائها" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(cat => !settings.skipCategories.includes(cat.nameAr))
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.nameAr}>
                        {cat.nameAr}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <Button
                onClick={addSkipCategory}
                disabled={!newCategory}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.skipCategories.map(category => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="px-3 py-1 flex items-center gap-1"
                >
                  {category}
                  <button
                    onClick={() => removeSkipCategory(category)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {settings.skipCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا توجد فئات مستثناة
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات متقدمة</CardTitle>
            <CardDescription>
              خيارات متقدمة للتحكم في توليد الصور
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Template */}
            <div className="space-y-2">
              <Label htmlFor="promptTemplate">
                قالب التوليد (اختياري)
              </Label>
              <textarea
                id="promptTemplate"
                className="w-full min-h-[100px] p-3 rounded-md border bg-background resize-none"
                placeholder="أدخل قالب التوليد المخصص... يمكنك استخدام {title} و {category} كمتغيرات"
                value={settings.imagePromptTemplate || ""}
                onChange={(e) => 
                  setSettings({ ...settings, imagePromptTemplate: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                استخدم {"{title}"} للعنوان و {"{category}"} للفئة في القالب
              </p>
            </div>

            {/* Monthly Limit */}
            <div className="space-y-2">
              <Label htmlFor="maxMonthly">
                الحد الأقصى الشهري
              </Label>
              <Input
                id="maxMonthly"
                type="number"
                min="0"
                max="10000"
                value={settings.maxMonthlyGenerations || 100}
                onChange={(e) => 
                  setSettings({ 
                    ...settings, 
                    maxMonthlyGenerations: parseInt(e.target.value) || 100
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                الحد الأقصى لعدد الصور المُولّدة شهرياً
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}