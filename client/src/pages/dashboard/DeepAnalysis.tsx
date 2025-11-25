import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { OmqLayout } from "@/components/admin/omq/OmqLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  Loader2, 
  ChevronRight,
  Clock,
  Trash2,
  Download,
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Zap,
  Target,
  Layers,
  Send,
  BarChart3
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeepAnalysis {
  id: string;
  title: string;
  topic: string;
  keywords: string[];
  status: string;
  createdAt: string;
  gptAnalysis: string | null;
  geminiAnalysis: string | null;
  claudeAnalysis: string | null;
  mergedAnalysis: string | null;
  executiveSummary: string | null;
  recommendations: string | null;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, text: 'مسودة', icon: Edit, color: 'text-slate-400' };
    case 'completed':
      return { variant: 'default' as const, text: 'جاهز للنشر', icon: CheckCircle, color: 'text-emerald-400' };
    case 'published':
      return { variant: 'default' as const, text: 'منشور', icon: Globe, color: 'text-violet-400' };
    case 'archived':
      return { variant: 'outline' as const, text: 'مؤرشف', icon: EyeOff, color: 'text-gray-400' };
    default:
      return { variant: 'secondary' as const, text: status, icon: FileText, color: 'text-slate-400' };
  }
};

export default function DeepAnalysis() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");
  const [saudiContext, setSaudiContext] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("unified");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, message: '' });
  const [showNewForm, setShowNewForm] = useState(false);

  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editId = urlParams.get('id') || urlParams.get('edit');
  const isNew = urlParams.get('new') === 'true';

  const { data: analyses, isLoading: isLoadingList } = useQuery<{ analyses: DeepAnalysis[]; total: number }>({
    queryKey: ['/api/deep-analysis'],
  });

  const { data: categories } = useQuery<{ categories: Category[] }>({
    queryKey: ['/api/categories'],
  });

  const { data: selectedAnalysis } = useQuery<DeepAnalysis>({
    queryKey: ['/api/deep-analysis', selectedAnalysisId],
    enabled: !!selectedAnalysisId,
  });

  useEffect(() => {
    if (isNew) {
      setShowNewForm(true);
      setSelectedAnalysisId(null);
    }
  }, [isNew]);

  useEffect(() => {
    if (editId && !selectedAnalysisId) {
      setSelectedAnalysisId(editId);
      setActiveTab("unified");
      setShowNewForm(false);
    }
  }, [editId, selectedAnalysisId]);

  useEffect(() => {
    if (selectedAnalysis) {
      setTopic(selectedAnalysis.topic || "");
      setKeywords(selectedAnalysis.keywords?.join(', ') || "");
      setCategory("");
      setSaudiContext("");
    }
  }, [selectedAnalysis]);

  const handleGenerateWithSSE = async (data: { topic: string; keywords: string[]; category?: string; saudiContext?: string }) => {
    setIsGenerating(true);
    setProgress({ percent: 0, message: 'جاري الاتصال...' });

    try {
      const response = await fetch('/api/deep-analysis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('فشل في بدء التوليد');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('لا يمكن قراءة الاستجابة');

      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (isGenerating) {
            setIsGenerating(false);
            setProgress({ percent: 0, message: '' });
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.substring(6));

              if (currentEvent === 'progress') {
                setProgress({ percent: eventData.percent, message: eventData.message });
              } else if (currentEvent === 'complete') {
                setProgress({ percent: 100, message: eventData.message });
                queryClient.invalidateQueries({ queryKey: ['/api/deep-analysis'] });
                setSelectedAnalysisId(eventData.analysis.id);
                setActiveTab("unified");
                setShowNewForm(false);
                toast({
                  title: "تم التوليد بنجاح",
                  description: "تم إنشاء التحليل العميق بنجاح",
                });
                setIsGenerating(false);
              } else if (currentEvent === 'error') {
                throw new Error(eventData.message);
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء توليد التحليل",
      });
      setIsGenerating(false);
      setProgress({ percent: 0, message: '' });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/deep-analysis/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deep-analysis'] });
      if (selectedAnalysisId === deletedId) {
        setSelectedAnalysisId(null);
      }
      toast({ title: "تم الحذف", description: "تم حذف التحليل بنجاح" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/deep-analysis/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deep-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deep-analysis', selectedAnalysisId] });
      toast({ title: "تم التحديث", description: data.message || "تم تحديث حالة التحليل بنجاح" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "خطأ", description: error.message || "فشل تحديث الحالة" });
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى إدخال موضوع التحليل" });
      return;
    }

    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

    handleGenerateWithSSE({
      topic: topic.trim(),
      keywords: keywordArray,
      category: category || undefined,
      saudiContext: saudiContext || undefined,
    });
  };

  const resetForm = () => {
    setTopic("");
    setKeywords("");
    setCategory("");
    setSaudiContext("");
    setSelectedAnalysisId(null);
    setShowNewForm(true);
  };

  return (
    <OmqLayout>
      <ScrollArea className="h-full">
        <div className="p-4 md:p-6 space-y-6" dir="rtl">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                <Brain className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">التحليل العميق الذكي</h1>
                <p className="text-sm text-slate-400">تحليل متعدد النماذج: GPT-5.1 • Gemini 3 • Claude</p>
              </div>
            </div>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
              data-testid="button-new-analysis"
            >
              <Zap className="w-4 h-4 ml-2" />
              تحليل جديد
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <AnimatePresence mode="wait">
                {(showNewForm || !selectedAnalysisId) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm" data-testid="card-analysis-form">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Sparkles className="w-5 h-5 text-violet-400" />
                          إنشاء تحليل جديد
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          أدخل موضوع التحليل والتفاصيل المطلوبة
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="topic" className="text-slate-200 flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-400" />
                            موضوع التحليل <span className="text-red-400">*</span>
                          </Label>
                          <Textarea
                            id="topic"
                            data-testid="input-topic"
                            placeholder="مثال: تأثير الذكاء الاصطناعي على سوق العمل السعودي في ظل رؤية 2030"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            rows={4}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="keywords" className="text-slate-200 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-violet-400" />
                            الكلمات المفتاحية
                          </Label>
                          <Input
                            id="keywords"
                            data-testid="input-keywords"
                            placeholder="ذكاء اصطناعي، رؤية 2030، سوق العمل"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
                          />
                          <p className="text-xs text-slate-500">افصل بين الكلمات بفاصلة</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-slate-200 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-violet-400" />
                            التصنيف
                          </Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger 
                              className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500"
                              data-testid="select-category"
                            >
                              <SelectValue placeholder="اختر التصنيف" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="politics" className="text-white hover:bg-slate-700">سياسة</SelectItem>
                              <SelectItem value="economy" className="text-white hover:bg-slate-700">اقتصاد</SelectItem>
                              <SelectItem value="technology" className="text-white hover:bg-slate-700">تقنية</SelectItem>
                              <SelectItem value="society" className="text-white hover:bg-slate-700">مجتمع</SelectItem>
                              <SelectItem value="sports" className="text-white hover:bg-slate-700">رياضة</SelectItem>
                              <SelectItem value="culture" className="text-white hover:bg-slate-700">ثقافة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="saudiContext" className="text-slate-200 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-violet-400" />
                            السياق السعودي
                          </Label>
                          <Textarea
                            id="saudiContext"
                            data-testid="input-saudi-context"
                            placeholder="معلومات إضافية متعلقة بالسعودية أو رؤية 2030..."
                            value={saudiContext}
                            onChange={(e) => setSaudiContext(e.target.value)}
                            rows={3}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 resize-none"
                          />
                        </div>

                        <Button
                          data-testid="button-generate-analysis"
                          onClick={handleGenerate}
                          disabled={isGenerating || !topic.trim()}
                          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 h-12"
                          size="lg"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                              جاري التوليد...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 ml-2" />
                              توليد التحليل العميق
                            </>
                          )}
                        </Button>

                        {isGenerating && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-slate-300">
                                {progress.message || 'يتم الآن استدعاء 3 نماذج AI بالتوازي...'}
                              </p>
                              <span className="text-sm font-mono text-violet-400">{progress.percent}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                              <motion.div 
                                className="bg-gradient-to-r from-violet-500 to-purple-500 h-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percent}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm" data-testid="card-analysis-history">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <Clock className="w-4 h-4 text-slate-400" />
                    التحليلات السابقة
                    {analyses?.total ? (
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300 mr-auto">
                        {analyses.total}
                      </Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingList ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : analyses && analyses.analyses.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {analyses.analyses.map((analysis) => {
                        const statusConfig = getStatusConfig(analysis.status);
                        const StatusIcon = statusConfig.icon;
                        const isSelected = selectedAnalysisId === analysis.id;
                        
                        return (
                          <motion.div
                            key={analysis.id}
                            whileHover={{ x: -4 }}
                            whileTap={{ scale: 0.98 }}
                            data-testid={`card-history-${analysis.id}`}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'bg-violet-500/10 border-violet-500/50' 
                                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                            }`}
                            onClick={() => {
                              setSelectedAnalysisId(analysis.id);
                              setShowNewForm(false);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0 space-y-2">
                                <p className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-slate-200'}`} data-testid={`text-title-${analysis.id}`}>
                                  {analysis.title}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={`text-xs border-slate-600 ${statusConfig.color}`} data-testid={`badge-status-${analysis.id}`}>
                                    <StatusIcon className="w-3 h-3 ml-1" />
                                    {statusConfig.text}
                                  </Badge>
                                  <span className="text-xs text-slate-500">
                                    {new Date(analysis.createdAt).toLocaleDateString('ar-SA')}
                                  </span>
                                </div>
                              </div>
                              <Button
                                data-testid={`button-delete-${analysis.id}`}
                                size="icon"
                                variant="ghost"
                                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate(analysis.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                      <p className="text-slate-400 text-sm">لا توجد تحليلات سابقة</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selectedAnalysis ? (
                  <motion.div
                    key="analysis-result"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm" data-testid="card-analysis-results">
                      <CardHeader className="border-b border-slate-800">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <CardTitle className="text-xl text-white" data-testid="text-selected-title">
                                {selectedAnalysis.title}
                              </CardTitle>
                              <Badge 
                                variant="outline" 
                                className={`border-slate-600 ${getStatusConfig(selectedAnalysis.status).color}`}
                                data-testid="badge-selected-status"
                              >
                                {(() => {
                                  const StatusIcon = getStatusConfig(selectedAnalysis.status).icon;
                                  return <StatusIcon className="w-3 h-3 ml-1" />;
                                })()}
                                {getStatusConfig(selectedAnalysis.status).text}
                              </Badge>
                            </div>
                            <CardDescription className="text-slate-400">
                              {new Date(selectedAnalysis.createdAt).toLocaleString('ar-SA')}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {selectedAnalysis.status === 'completed' && (
                              <Button
                                data-testid="button-publish"
                                onClick={() => updateStatusMutation.mutate({ id: selectedAnalysis.id, status: 'published' })}
                                disabled={updateStatusMutation.isPending}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
                              >
                                <Eye className="w-4 h-4 ml-2" />
                                نشر
                              </Button>
                            )}
                            {selectedAnalysis.status === 'published' && (
                              <Button
                                data-testid="button-unpublish"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: selectedAnalysis.id, status: 'completed' })}
                                disabled={updateStatusMutation.isPending}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                              >
                                <EyeOff className="w-4 h-4 ml-2" />
                                إلغاء النشر
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="border-slate-600 text-slate-300 hover:bg-slate-800"
                              data-testid="button-download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {selectedAnalysis.keywords.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-4">
                            {selectedAnalysis.keywords.map((keyword, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="bg-slate-800 text-slate-300 border-slate-700"
                                data-testid={`badge-keyword-${idx}`}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-slate-800/50 p-1">
                            <TabsTrigger 
                              value="unified" 
                              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400"
                              data-testid="tab-unified"
                            >
                              <FileText className="w-4 h-4 ml-1 hidden sm:block" />
                              موحد
                            </TabsTrigger>
                            <TabsTrigger 
                              value="gpt"
                              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
                              data-testid="tab-gpt"
                            >
                              GPT
                            </TabsTrigger>
                            <TabsTrigger 
                              value="gemini"
                              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
                              data-testid="tab-gemini"
                            >
                              Gemini
                            </TabsTrigger>
                            <TabsTrigger 
                              value="claude"
                              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400"
                              data-testid="tab-claude"
                            >
                              Claude
                            </TabsTrigger>
                            <TabsTrigger 
                              value="summary"
                              className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-slate-400"
                              data-testid="tab-summary"
                            >
                              <TrendingUp className="w-4 h-4 ml-1 hidden sm:block" />
                              ملخص
                            </TabsTrigger>
                            <TabsTrigger 
                              value="recommendations"
                              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400"
                              data-testid="tab-recommendations"
                            >
                              <ChevronRight className="w-4 h-4 ml-1 hidden sm:block" />
                              توصيات
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="unified" className="mt-6" data-testid="content-unified">
                            <div className="prose prose-invert max-w-none">
                              {selectedAnalysis.mergedAnalysis ? (
                                <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-200">
                                  {selectedAnalysis.mergedAnalysis}
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                  <p className="text-slate-400">لا يتوفر تحليل موحد</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="gpt" className="mt-6" data-testid="content-gpt">
                            <div className="prose prose-invert max-w-none">
                              {selectedAnalysis.gptAnalysis ? (
                                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                                    <Brain className="w-5 h-5" />
                                    <span className="font-semibold">GPT-5.1</span>
                                  </div>
                                  <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-200">
                                    {selectedAnalysis.gptAnalysis}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <Brain className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                  <p className="text-slate-400">لا يتوفر تحليل من GPT-5</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="gemini" className="mt-6" data-testid="content-gemini">
                            <div className="prose prose-invert max-w-none">
                              {selectedAnalysis.geminiAnalysis ? (
                                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                  <div className="flex items-center gap-2 mb-4 text-blue-400">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="font-semibold">Gemini 3</span>
                                  </div>
                                  <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-200">
                                    {selectedAnalysis.geminiAnalysis}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                  <p className="text-slate-400">لا يتوفر تحليل من Gemini</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="claude" className="mt-6" data-testid="content-claude">
                            <div className="prose prose-invert max-w-none">
                              {selectedAnalysis.claudeAnalysis ? (
                                <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                                  <div className="flex items-center gap-2 mb-4 text-orange-400">
                                    <Zap className="w-5 h-5" />
                                    <span className="font-semibold">Claude</span>
                                  </div>
                                  <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-200">
                                    {selectedAnalysis.claudeAnalysis}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <Zap className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                  <p className="text-slate-400">لا يتوفر تحليل من Claude</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="summary" className="mt-6" data-testid="content-summary">
                            <div className="p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
                              <div className="flex items-center gap-2 mb-4 text-pink-400">
                                <TrendingUp className="w-5 h-5" />
                                <span className="font-semibold">الملخص التنفيذي</span>
                              </div>
                              {selectedAnalysis.executiveSummary ? (
                                <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-200">
                                  {selectedAnalysis.executiveSummary}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <TrendingUp className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                                  <p className="text-slate-400">لا يتوفر ملخص تنفيذي</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="recommendations" className="mt-6" data-testid="content-recommendations">
                            <div className="space-y-3">
                              {selectedAnalysis.recommendations ? (
                                selectedAnalysis.recommendations.split('\n').filter(r => r.trim()).map((rec, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20"
                                    data-testid={`card-recommendation-${idx}`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-white">{idx + 1}</span>
                                      </div>
                                      <p className="flex-1 text-slate-200 pt-1">{rec}</p>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="text-center py-12">
                                  <ChevronRight className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                  <p className="text-slate-400">لا توجد توصيات</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : !showNewForm && (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                      <CardContent className="py-16">
                        <div className="text-center">
                          <motion.div
                            animate={{
                              y: [0, -10, 0],
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <Brain className="w-20 h-20 mx-auto mb-6 text-violet-400" />
                          </motion.div>
                          <h3 className="text-2xl font-bold text-white mb-3">ابدأ بتوليد تحليل عميق</h3>
                          <p className="text-slate-400 max-w-md mx-auto mb-6">
                            قم بإدخال موضوع التحليل في النموذج، ثم اضغط على "توليد التحليل العميق" للحصول على
                            تحليل شامل متعدد الأبعاد من 3 نماذج AI متقدمة
                          </p>
                          <div className="flex items-center justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              GPT-5.1
                            </div>
                            <div className="flex items-center gap-2 text-blue-400">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              Gemini 3
                            </div>
                            <div className="flex items-center gap-2 text-orange-400">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              Claude
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </ScrollArea>
    </OmqLayout>
  );
}
