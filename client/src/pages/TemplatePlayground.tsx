import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Code, 
  Sparkles, 
  LayoutGrid,
  RefreshCw,
  Eye,
  Settings,
} from "lucide-react";
import { TEMPLATE_REGISTRY } from "@/components/publishing/templates";
import { recommendTemplates, analyzeContent } from "@/lib/publishing/templateSelector";
import type { 
  ArticleItem, 
  TemplatesManifest, 
  PublishingTemplate,
  TemplateRecommendation 
} from "@/lib/publishing/types";

export default function TemplatePlayground() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("hero.split");
  const [selectedDataset, setSelectedDataset] = useState<string>("breaking-news");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load manifest
  const { data: manifest } = useQuery<TemplatesManifest>({
    queryKey: ['/fixtures/templatesManifest.json'],
    queryFn: async () => {
      const res = await fetch('/fixtures/templatesManifest.json');
      return res.json();
    },
  });

  // Load demo data
  const { data: demoArticles } = useQuery<ArticleItem[]>({
    queryKey: ['/fixtures/demoArticles.json'],
    queryFn: async () => {
      const res = await fetch('/fixtures/demoArticles.json');
      return res.json();
    },
  });

  // Get current template
  const currentTemplate = manifest?.templates.find((t: PublishingTemplate) => t.id === selectedTemplateId);
  
  // Get template component
  const TemplateComponent = TEMPLATE_REGISTRY[selectedTemplateId as keyof typeof TEMPLATE_REGISTRY];

  // Get demo items based on dataset
  const getDemoItems = (): ArticleItem[] => {
    if (!demoArticles) return [];
    
    switch (selectedDataset) {
      case 'breaking-news':
        return demoArticles.filter(a => a.newsType === 'breaking').slice(0, 5);
      case 'featured':
        return demoArticles.filter(a => a.newsType === 'featured').slice(0, 6);
      case 'mixed':
        return demoArticles.slice(0, 8);
      case 'single':
        return demoArticles.slice(0, 1);
      case 'many':
        return demoArticles.slice(0, 15);
      default:
        return demoArticles.slice(0, 6);
    }
  };

  const demoItems = getDemoItems();

  // Get recommendations
  const recommendations: TemplateRecommendation[] = manifest && demoItems.length > 0
    ? recommendTemplates(demoItems, manifest, { limit: 5 })
    : [];

  // Content analysis
  const contentAnalysis = demoItems.length > 0 ? analyzeContent(demoItems) : null;

  // Auto-refresh recommendations
  useEffect(() => {
    if (autoRefresh && recommendations.length > 0) {
      const topRecommendation = recommendations[0];
      if (topRecommendation && topRecommendation.template.id !== selectedTemplateId) {
        setSelectedTemplateId(topRecommendation.template.id);
      }
    }
  }, [autoRefresh, recommendations, selectedTemplateId]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Play className="w-6 h-6 text-primary" />
                Template Playground
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                معاينة واختبار تمبلتات النشر المتنوعة
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showRecommendations ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRecommendations(!showRecommendations)}
                data-testid="button-toggle-recommendations"
              >
                <Sparkles className="w-4 h-4 ml-2" />
                التوصيات الذكية
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                data-testid="button-toggle-auto-refresh"
              >
                <RefreshCw className={`w-4 h-4 ml-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                تحديث تلقائي
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                إعدادات العرض
              </h3>

              {/* Dataset Selector */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">مجموعة البيانات</label>
                <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                  <SelectTrigger data-testid="select-dataset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breaking-news">أخبار عاجلة (5)</SelectItem>
                    <SelectItem value="featured">مميزة (6)</SelectItem>
                    <SelectItem value="mixed">متنوعة (8)</SelectItem>
                    <SelectItem value="single">فردية (1)</SelectItem>
                    <SelectItem value="many">كثيرة (15)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">التمبلت</label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger data-testid="select-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {manifest?.templates.map((t: PublishingTemplate) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Content Analysis */}
            {contentAnalysis && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">تحليل المحتوى</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد العناصر</span>
                    <span className="font-medium">{contentAnalysis.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">يحتوي صور</span>
                    <Badge variant={contentAnalysis.hasImages ? "default" : "secondary"}>
                      {contentAnalysis.hasImages ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">يحتوي فيديو</span>
                    <Badge variant={contentAnalysis.hasVideo ? "default" : "secondary"}>
                      {contentAnalysis.hasVideo ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">أخبار عاجلة</span>
                    <Badge variant={contentAnalysis.hasBreaking ? "destructive" : "secondary"}>
                      {contentAnalysis.hasBreaking ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">فئات فريدة</span>
                    <span className="font-medium">{contentAnalysis.uniqueCategories}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Recommendations Panel */}
            {showRecommendations && recommendations.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  التوصيات ({recommendations.length})
                </h3>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <button
                        key={rec.template.id}
                        onClick={() => setSelectedTemplateId(rec.template.id)}
                        className={`w-full text-right p-3 rounded-lg border hover-elevate active-elevate-2 transition-all ${
                          rec.template.id === selectedTemplateId 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border'
                        }`}
                        data-testid={`recommendation-${idx}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-sm">{rec.template.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(rec.score)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {rec.reasoning.join(' • ')}
                        </p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>

          {/* Main Content - Preview */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {currentTemplate && (
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{currentTemplate.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{currentTemplate.description}</p>
                    </div>
                    <Badge>{currentTemplate.kind}</Badge>
                  </div>
                  
                  {currentTemplate.bestFor && currentTemplate.bestFor.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {currentTemplate.bestFor.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Separator className="my-6" />

              <Tabs defaultValue="preview" dir="rtl">
                <TabsList>
                  <TabsTrigger value="preview" data-testid="tab-preview">
                    <Eye className="w-4 h-4 ml-2" />
                    معاينة
                  </TabsTrigger>
                  <TabsTrigger value="props" data-testid="tab-props">
                    <Code className="w-4 h-4 ml-2" />
                    Props
                  </TabsTrigger>
                  <TabsTrigger value="info" data-testid="tab-info">
                    <LayoutGrid className="w-4 h-4 ml-2" />
                    معلومات
                  </TabsTrigger>
                </TabsList>

                {/* Preview Tab */}
                <TabsContent value="preview" className="mt-6">
                  <div className="rounded-lg border bg-muted/30 p-6 min-h-[400px]">
                    {TemplateComponent ? (
                      demoItems.length > 0 ? (
                        currentTemplate?.kind === 'hero' || currentTemplate?.kind === 'spotlight' ? (
                          <TemplateComponent item={demoItems[0]} />
                        ) : (
                          <TemplateComponent items={demoItems} />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                          <p>لا توجد بيانات للعرض</p>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground">
                        <p>التمبلت غير متاح</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Props Tab */}
                <TabsContent value="props" className="mt-6">
                  {currentTemplate && (
                    <Card className="p-4 bg-muted/30">
                      <pre className="text-xs overflow-x-auto" dir="ltr">
                        <code>{JSON.stringify(currentTemplate.component, null, 2)}</code>
                      </pre>
                    </Card>
                  )}
                </TabsContent>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-6">
                  {currentTemplate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">السلوكيات</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">التصفح</span>
                            <span>{currentTemplate.behaviors.pagination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحركة</span>
                            <span>{currentTemplate.behaviors.animation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">افتراضي</span>
                            <Badge variant={currentTemplate.behaviors.virtualize ? "default" : "secondary"}>
                              {currentTemplate.behaviors.virtualize ? 'نعم' : 'لا'}
                            </Badge>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">الأداء</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hydration</span>
                            <span>{currentTemplate.performance.hydrationHint}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">حد العناصر</span>
                            <span>{currentTemplate.performance.maxItems}</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">الأنماط</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الكثافة</span>
                            <span>{currentTemplate.styles.density}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الارتفاع</span>
                            <span>{currentTemplate.styles.elevation}</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">إمكانية الوصول</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">التباين</span>
                            <span>{currentTemplate.a11y.contrastMin}:1</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">لوحة المفاتيح</span>
                            <Badge variant={currentTemplate.a11y.keyboardNav ? "default" : "secondary"}>
                              {currentTemplate.a11y.keyboardNav ? 'نعم' : 'لا'}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
