import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Calendar,
  Clock,
  Folder,
  User,
  Eye,
  Share2,
  Download,
  FileText,
  FileDown,
  Brain,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

interface DeepAnalysis {
  id: string;
  title: string;
  topic: string;
  keywords: string[];
  status: string;
  createdAt: string;
  category?: string;
  categoryName?: string;
  authorId?: string;
  authorName?: string;
  viewsCount?: number;
  sharesCount?: number;
  downloadsCount?: number;
  exportsPdfCount?: number;
  exportsDocxCount?: number;
  generationTime?: number;
  gptAnalysis: string | null;
  geminiAnalysis: string | null;
  claudeAnalysis: string | null;
  mergedAnalysis: string | null;
  executiveSummary: string | null;
  recommendations: string | null;
}

export default function OmqDetail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [, params] = useRoute("/omq/:id");
  const analysisId = params?.id;
  const [activeTab, setActiveTab] = useState("unified");
  const [viewRecorded, setViewRecorded] = useState(false);

  // Fetch analysis
  const { data: analysis, isLoading, error } = useQuery<DeepAnalysis>({
    queryKey: ['/api/omq', analysisId],
    enabled: !!analysisId,
  });

  // Record view event once on mount
  useEffect(() => {
    if (analysisId && !viewRecorded) {
      fetch(`/api/omq/${analysisId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventType: 'view' })
      }).catch(() => {
        // Silently fail - analytics tracking is not critical
      });
      setViewRecorded(true);
    }
  }, [analysisId, viewRecorded]);

  // Helper functions
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'published':
        return 'منشور';
      case 'draft':
        return 'مسودة';
      case 'archived':
        return 'مؤرشف';
      default:
        return status;
    }
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US');
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const recordEvent = async (eventType: string) => {
    if (!analysisId) return;
    try {
      await fetch(`/api/omq/${analysisId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventType })
      });
    } catch (error) {
      // Silently fail - analytics tracking is not critical
    }
  };

  const handleShare = async () => {
    await recordEvent('share');
    
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: analysis?.title,
          text: analysis?.topic,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط التحليل إلى الحافظة",
      });
    }
  };

  const handleDownload = async () => {
    await recordEvent('download');
    
    if (!analysis) return;
    
    const content = `
# ${analysis.title}

## الموضوع
${analysis.topic}

## الكلمات المفتاحية
${analysis.keywords.join(', ')}

## التحليل الموحد
${analysis.mergedAnalysis || 'غير متوفر'}

## تحليل GPT-5
${analysis.gptAnalysis || 'غير متوفر'}

## تحليل Gemini
${analysis.geminiAnalysis || 'غير متوفر'}

## تحليل Claude
${analysis.claudeAnalysis || 'غير متوفر'}

## الملخص التنفيذي
${analysis.executiveSummary || 'غير متوفر'}

## التوصيات
${analysis.recommendations || 'غير متوفر'}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التنزيل",
      description: "تم تنزيل التحليل بنجاح",
    });
  };

  const handleExportPDF = async () => {
    await recordEvent('export_pdf');
    toast({
      title: "قريباً",
      description: "سيتم إضافة ميزة التصدير إلى PDF قريباً",
    });
  };

  const handleExportWord = async () => {
    await recordEvent('export_docx');
    toast({
      title: "قريباً",
      description: "سيتم إضافة ميزة التصدير إلى Word قريباً",
    });
  };

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-16 text-center">
            <Brain className="w-20 h-20 text-muted-foreground mx-auto mb-4" data-testid="icon-error" />
            <h3 className="text-xl font-semibold mb-2" data-testid="text-error-title">
              حدث خطأ
            </h3>
            <p className="text-muted-foreground mb-6" data-testid="text-error-description">
              لم نتمكن من تحميل التحليل المطلوب
            </p>
            <Button onClick={() => navigate('/omq')} data-testid="button-back-to-list">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للقائمة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>

          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Not found
  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-16 text-center">
            <Brain className="w-20 h-20 text-muted-foreground mx-auto mb-4" data-testid="icon-not-found" />
            <h3 className="text-xl font-semibold mb-2" data-testid="text-not-found-title">
              التحليل غير موجود
            </h3>
            <p className="text-muted-foreground mb-6" data-testid="text-not-found-description">
              لم نتمكن من العثور على التحليل المطلوب
            </p>
            <Button onClick={() => navigate('/omq')} data-testid="button-back-to-list-notfound">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للقائمة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          <div className="flex-1">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/omq')}
              data-testid="button-back"
              className="mb-3"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للقائمة
            </Button>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-analysis-title">
              {analysis.title}
            </h1>
            <p className="text-muted-foreground text-lg" data-testid="text-analysis-topic">
              {analysis.topic}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={getStatusVariant(analysis.status)} 
              data-testid="badge-status"
              className="text-sm px-3 py-1"
            >
              {getStatusLabel(analysis.status)}
            </Badge>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleShare}
              data-testid="button-share"
              title="مشاركة"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleDownload}
              data-testid="button-download"
              title="تنزيل كملف نصي"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
              title="تصدير PDF"
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleExportWord}
              data-testid="button-export-word"
              title="تصدير Word"
            >
              <FileDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metadata Bar */}
        <Card className="mb-6" data-testid="card-metadata">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3" data-testid="metadata-created">
                <div className="p-2 rounded-md bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="text-sm font-medium">{formatDate(analysis.createdAt)}</p>
                </div>
              </div>

              {analysis.generationTime && (
                <div className="flex items-center gap-3" data-testid="metadata-generation-time">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">وقت التوليد</p>
                    <p className="text-sm font-medium">{analysis.generationTime} ثانية</p>
                  </div>
                </div>
              )}

              {analysis.categoryName && (
                <div className="flex items-center gap-3" data-testid="metadata-category">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Folder className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">التصنيف</p>
                    <p className="text-sm font-medium">{analysis.categoryName}</p>
                  </div>
                </div>
              )}

              {analysis.authorName && (
                <div className="flex items-center gap-3" data-testid="metadata-author">
                  <div className="p-2 rounded-md bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المراسل</p>
                    <p className="text-sm font-medium">{analysis.authorName}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card data-testid="metric-card-views" className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold" data-testid="metric-views-count">
                    {formatNumber(analysis.viewsCount)}
                  </p>
                  <p className="text-xs text-muted-foreground">مشاهدة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-card-shares" className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold" data-testid="metric-shares-count">
                    {formatNumber(analysis.sharesCount)}
                  </p>
                  <p className="text-xs text-muted-foreground">مشاركة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-card-downloads" className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold" data-testid="metric-downloads-count">
                    {formatNumber(analysis.downloadsCount)}
                  </p>
                  <p className="text-xs text-muted-foreground">تنزيل</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-card-pdf" className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold" data-testid="metric-pdf-count">
                    {formatNumber(analysis.exportsPdfCount)}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-card-word" className="hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileDown className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold" data-testid="metric-word-count">
                    {formatNumber(analysis.exportsDocxCount)}
                  </p>
                  <p className="text-xs text-muted-foreground">Word</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keywords Section */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6" data-testid="keywords-section">
            {analysis.keywords.map((keyword, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                data-testid={`badge-keyword-${idx}`}
                className="text-sm px-3 py-1"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        {/* Main Content - Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" data-testid="tabs-analysis">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="unified" data-testid="tab-trigger-unified">
              التحليل الموحد
            </TabsTrigger>
            <TabsTrigger value="models" data-testid="tab-trigger-models">
              نماذج AI
            </TabsTrigger>
            <TabsTrigger value="summary" data-testid="tab-trigger-summary">
              الملخص
            </TabsTrigger>
          </TabsList>

          {/* Unified Analysis Tab */}
          <TabsContent value="unified" data-testid="tab-content-unified">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  التحليل الموحد العميق
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                {analysis.mergedAnalysis ? (
                  <div 
                    className="whitespace-pre-wrap text-base leading-relaxed"
                    data-testid="content-unified"
                  >
                    {analysis.mergedAnalysis}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground" data-testid="empty-unified">
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا يتوفر تحليل موحد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Models Tab with Nested Tabs */}
          <TabsContent value="models" data-testid="tab-content-models">
            <ModelTabs analysis={analysis} />
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" data-testid="tab-content-summary">
            <Card>
              <CardHeader>
                <CardTitle>الملخص التنفيذي</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                {analysis.executiveSummary ? (
                  <div 
                    className="whitespace-pre-wrap text-base leading-relaxed"
                    data-testid="content-summary"
                  >
                    {analysis.executiveSummary}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground" data-testid="empty-summary">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا يتوفر ملخص تنفيذي</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {analysis.recommendations && (
              <Card className="mt-6" data-testid="card-recommendations">
                <CardHeader>
                  <CardTitle>التوصيات</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <div 
                    className="whitespace-pre-wrap text-base leading-relaxed"
                    data-testid="content-recommendations"
                  >
                    {analysis.recommendations}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ModelTabs component with nested tabs for AI models
function ModelTabs({ analysis }: { analysis: DeepAnalysis }) {
  const [modelTab, setModelTab] = useState("gpt");

  return (
    <Tabs value={modelTab} onValueChange={setModelTab} dir="rtl" className="w-full" data-testid="tabs-models">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="gpt" data-testid="tab-model-gpt">
          GPT-5
        </TabsTrigger>
        <TabsTrigger value="gemini" data-testid="tab-model-gemini">
          Gemini
        </TabsTrigger>
        <TabsTrigger value="claude" data-testid="tab-model-claude">
          Claude
        </TabsTrigger>
      </TabsList>

      <TabsContent value="gpt" data-testid="tab-content-model-gpt">
        <Card>
          <CardHeader>
            <CardTitle>تحليل GPT-5</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            {analysis.gptAnalysis ? (
              <div 
                className="whitespace-pre-wrap text-base leading-relaxed"
                data-testid="content-gpt"
              >
                {analysis.gptAnalysis}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground" data-testid="empty-gpt">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>لا يتوفر تحليل من GPT-5</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="gemini" data-testid="tab-content-model-gemini">
        <Card>
          <CardHeader>
            <CardTitle>تحليل Gemini</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            {analysis.geminiAnalysis ? (
              <div 
                className="whitespace-pre-wrap text-base leading-relaxed"
                data-testid="content-gemini"
              >
                {analysis.geminiAnalysis}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground" data-testid="empty-gemini">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>لا يتوفر تحليل من Gemini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="claude" data-testid="tab-content-model-claude">
        <Card>
          <CardHeader>
            <CardTitle>تحليل Claude</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            {analysis.claudeAnalysis ? (
              <div 
                className="whitespace-pre-wrap text-base leading-relaxed"
                data-testid="content-claude"
              >
                {analysis.claudeAnalysis}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground" data-testid="empty-claude">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>لا يتوفر تحليل من Claude</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
