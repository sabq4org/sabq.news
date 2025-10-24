import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Sparkles, 
  RefreshCw,
  LayoutGrid,
  Info,
  ChevronDown,
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
  const [selectedDataset, setSelectedDataset] = useState<string>("mixed");
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Load manifest
  const { data: manifest, isLoading: manifestLoading } = useQuery<TemplatesManifest>({
    queryKey: ['/fixtures/templatesManifest.json'],
    queryFn: async () => {
      const res = await fetch('/fixtures/templatesManifest.json');
      if (!res.ok) throw new Error('Failed to load manifest');
      return res.json();
    },
  });

  // Load demo data
  const { data: demoArticles, isLoading: articlesLoading } = useQuery<ArticleItem[]>({
    queryKey: ['/fixtures/demoArticles.json'],
    queryFn: async () => {
      const res = await fetch('/fixtures/demoArticles.json');
      if (!res.ok) throw new Error('Failed to load demo articles');
      return res.json();
    },
  });

  const isLoading = manifestLoading || articlesLoading;

  // Get current template
  const currentTemplate = manifest?.templates.find((t: PublishingTemplate) => t.id === selectedTemplateId);
  
  // Get template component
  const TemplateComponent = TEMPLATE_REGISTRY[selectedTemplateId as keyof typeof TEMPLATE_REGISTRY];

  // Dataset configurations
  const datasets = {
    'breaking-news': { label: 'أخبار عاجلة (5)', filter: (a: ArticleItem) => a.newsType === 'breaking', limit: 5 },
    'featured': { label: 'مميزة (6)', filter: (a: ArticleItem) => a.newsType === 'featured', limit: 6 },
    'mixed': { label: 'متنوعة (8)', filter: () => true, limit: 8 },
    'single': { label: 'مقال واحد (1)', filter: () => true, limit: 1 },
    'many': { label: 'كثيرة (15)', filter: () => true, limit: 15 },
  };

  // Get demo items based on dataset
  const demoItems = demoArticles 
    ? demoArticles
        .filter(datasets[selectedDataset as keyof typeof datasets]?.filter || (() => true))
        .slice(0, datasets[selectedDataset as keyof typeof datasets]?.limit || 8)
    : [];

  // Get recommendations
  const recommendations: TemplateRecommendation[] = manifest && demoItems.length > 0
    ? recommendTemplates(demoItems, manifest, { limit: 3 })
    : [];

  // Content analysis
  const contentAnalysis = demoItems.length > 0 ? analyzeContent(demoItems) : null;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">معاينة القوالب</h1>
              <p className="text-sm text-muted-foreground">اختبر وشاهد القوالب المختلفة مع بيانات تجريبية</p>
            </div>
          </div>
          
          <Button
            variant={showRecommendations ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRecommendations(!showRecommendations)}
            data-testid="button-toggle-recommendations"
          >
            <Sparkles className="w-4 h-4 ml-2" />
            التوصيات الذكية
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Dataset Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اختر المحتوى</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(datasets).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDataset(key)}
                    className={`w-full text-right p-3 rounded-lg border transition-all ${
                      selectedDataset === key
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover-elevate active-elevate-2'
                    }`}
                    data-testid={`dataset-${key}`}
                  >
                    {label}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Template Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اختر القالب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {manifest?.templates
                    .reduce((acc: string[], t: PublishingTemplate) => {
                      if (!acc.includes(t.kind)) acc.push(t.kind);
                      return acc;
                    }, [])
                    .map((kind) => (
                      <details key={kind} open={manifest.templates.some((t: PublishingTemplate) => t.kind === kind && t.id === selectedTemplateId)}>
                        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground mb-2 hover:text-primary">
                          <span className="capitalize">{kind}</span>
                          <ChevronDown className="w-4 h-4" />
                        </summary>
                        <div className="space-y-1 mr-2">
                          {manifest.templates
                            .filter((t: PublishingTemplate) => t.kind === kind)
                            .map((template: PublishingTemplate) => (
                              <button
                                key={template.id}
                                onClick={() => setSelectedTemplateId(template.id)}
                                className={`w-full text-right p-2 rounded text-xs transition-all ${
                                  selectedTemplateId === template.id
                                    ? 'bg-primary/20 text-primary font-medium'
                                    : 'hover:bg-muted'
                                }`}
                                data-testid={`template-${template.id}`}
                              >
                                {template.name}
                              </button>
                            ))}
                        </div>
                      </details>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Analysis */}
            {contentAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    تحليل المحتوى
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العناصر</span>
                    <span className="font-medium">{contentAnalysis.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">صور</span>
                    <Badge variant={contentAnalysis.hasImages ? "default" : "secondary"} className="text-xs">
                      {contentAnalysis.hasImages ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">فيديو</span>
                    <Badge variant={contentAnalysis.hasVideo ? "default" : "secondary"} className="text-xs">
                      {contentAnalysis.hasVideo ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عاجل</span>
                    <Badge variant={contentAnalysis.hasBreaking ? "destructive" : "secondary"} className="text-xs">
                      {contentAnalysis.hasBreaking ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Smart Recommendations */}
            {showRecommendations && recommendations.length > 0 && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    توصيات ذكية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendations.map((rec, idx) => (
                    <button
                      key={rec.template.id}
                      onClick={() => setSelectedTemplateId(rec.template.id)}
                      className={`w-full text-right p-3 rounded-lg border transition-all ${
                        rec.template.id === selectedTemplateId
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover-elevate active-elevate-2'
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Preview Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{currentTemplate?.name || 'اختر قالباً'}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentTemplate?.description || 'اختر قالباً من القائمة لمعاينته'}
                    </p>
                  </div>
                  {currentTemplate && (
                    <Badge className="capitalize">{currentTemplate.kind}</Badge>
                  )}
                </div>
                
                {currentTemplate?.bestFor && currentTemplate.bestFor.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {currentTemplate.bestFor.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-6 min-h-[500px]" data-testid="preview-area">
                  {TemplateComponent && demoItems.length > 0 ? (
                    currentTemplate?.kind === 'hero' || currentTemplate?.kind === 'spotlight' ? (
                      <TemplateComponent item={demoItems[0]} {...({} as any)} />
                    ) : (
                      <TemplateComponent items={demoItems} {...({} as any)} />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <LayoutGrid className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {!TemplateComponent ? 'اختر قالباً' : 'لا توجد بيانات'}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {!TemplateComponent 
                          ? 'اختر قالباً من القائمة الجانبية لمعاينته مع البيانات التجريبية'
                          : 'اختر مجموعة بيانات من القائمة الجانبية'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
