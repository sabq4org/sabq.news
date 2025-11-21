/**
 * AI Image Studio - Nano Banana Pro Interface
 * Generate professional images using Gemini 3 Pro Image
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Image as ImageIcon, Download, Trash2, Clock, DollarSign, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Generation {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  aspectRatio: string;
  imageSize: string;
  status: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  generationTime?: number;
  cost?: number;
  errorMessage?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  totalCost: number;
  avgGenerationTime: number;
}

export default function ImageStudio() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageSize, setImageSize] = useState("2K");
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(false);
  const [enableThinking, setEnableThinking] = useState(true);

  // Fetch generations
  const { data: generationsData, isLoading } = useQuery<{ generations: Generation[] }>({
    queryKey: ["/api/nano-banana/generations"],
    refetchInterval: 5000, // Auto-refresh every 5s
  });
  
  const generations = generationsData?.generations || [];

  // Fetch stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/nano-banana/stats"],
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/nano-banana/generate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "جاري التوليد",
        description: "يتم الآن توليد الصورة باستخدام Nano Banana Pro",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nano-banana/generations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nano-banana/stats"] });
      setPrompt("");
      setNegativePrompt("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "فشل التوليد",
        description: error.message || "حدث خطأ أثناء توليد الصورة",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/nano-banana/generations/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف الصورة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nano-banana/generations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nano-banana/stats"] });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "البرومبت مطلوب",
        description: "يرجى إدخال وصف للصورة المراد توليدها",
      });
      return;
    }

    generateMutation.mutate({
      prompt,
      negativePrompt: negativePrompt || undefined,
      aspectRatio,
      imageSize,
      enableSearchGrounding,
      enableThinking,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-purple-500" />
          AI Image Studio
        </h1>
        <p className="text-muted-foreground text-lg">
          توليد صور احترافية باستخدام Gemini 3 Pro Image (Nano Banana Pro)
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الصور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">الناجحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                التكلفة الإجمالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                متوسط الوقت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgGenerationTime}s</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              توليد صورة جديدة
            </CardTitle>
            <CardDescription>
              استخدم Nano Banana Pro لتوليد صور احترافية عالية الجودة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">البرومبت (الوصف)</Label>
              <Textarea
                id="prompt"
                data-testid="input-prompt"
                placeholder="اكتب وصفاً تفصيلياً للصورة المراد توليدها..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div>
              <Label htmlFor="negative-prompt">البرومبت السلبي (اختياري)</Label>
              <Textarea
                id="negative-prompt"
                data-testid="input-negative-prompt"
                placeholder="ما الذي تريد تجنبه في الصورة..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نسبة العرض إلى الارتفاع</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger data-testid="select-aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (أفقي)</SelectItem>
                    <SelectItem value="1:1">1:1 (مربع)</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="9:16">9:16 (عمودي)</SelectItem>
                    <SelectItem value="21:9">21:9 (سينمائي)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الجودة</Label>
                <Select value={imageSize} onValueChange={setImageSize}>
                  <SelectTrigger data-testid="select-image-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1K">1K (سريع)</SelectItem>
                    <SelectItem value="2K">2K (موصى به)</SelectItem>
                    <SelectItem value="4K">4K (عالي الجودة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="thinking">تفعيل التفكير المتقدم</Label>
              <Switch
                id="thinking"
                data-testid="switch-thinking"
                checked={enableThinking}
                onCheckedChange={setEnableThinking}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="search">استخدام بحث Google</Label>
              <Switch
                id="search"
                data-testid="switch-search"
                checked={enableSearchGrounding}
                onCheckedChange={setEnableSearchGrounding}
              />
            </div>

            <Button
              data-testid="button-generate"
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  توليد الصورة
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Generations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              الصور المولدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : generations && generations.length > 0 ? (
                generations.map((gen) => (
                  <div
                    key={gen.id}
                    className="border rounded-lg p-4 space-y-2"
                    data-testid={`generation-${gen.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{gen.prompt}</p>
                      <Badge
                        variant={
                          gen.status === "completed"
                            ? "default"
                            : gen.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {gen.status === "completed"
                          ? "مكتمل"
                          : gen.status === "failed"
                          ? "فشل"
                          : "جاري المعالجة"}
                      </Badge>
                    </div>

                    {gen.imageUrl && (
                      <img
                        src={gen.imageUrl}
                        alt={gen.prompt}
                        className="w-full rounded-lg"
                        data-testid={`image-${gen.id}`}
                      />
                    )}

                    {gen.errorMessage && (
                      <p className="text-sm text-destructive">{gen.errorMessage}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(gen.createdAt), "dd MMM yyyy HH:mm", { locale: ar })}
                      </span>
                      {gen.generationTime && <span>{gen.generationTime}s</span>}
                      {gen.cost && <span>${gen.cost.toFixed(3)}</span>}
                    </div>

                    {gen.status === "completed" && gen.imageUrl && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex-1"
                          data-testid={`button-download-${gen.id}`}
                        >
                          <a href={gen.imageUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 ml-2" />
                            تحميل
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(gen.id)}
                          data-testid={`button-delete-${gen.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد صور مولدة بعد</p>
                  <p className="text-sm">ابدأ بتوليد صورتك الأولى</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
