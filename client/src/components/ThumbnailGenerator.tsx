import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ImageIcon, AlertCircle, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ThumbnailGeneratorProps {
  articleId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
  autoGenerate?: boolean;
}

export function ThumbnailGenerator({
  articleId,
  imageUrl,
  thumbnailUrl,
  onThumbnailGenerated,
  autoGenerate = true
}: ThumbnailGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState(thumbnailUrl);

  const generateThumbnail = async () => {
    if (!imageUrl) {
      toast({
        title: "لا توجد صورة",
        description: "يجب رفع صورة أولاً قبل توليد الصورة المصغرة",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiRequest<{
        success: boolean;
        thumbnailUrl?: string;
        message?: string;
      }>("/api/thumbnails/generate", {
        method: "POST",
        body: JSON.stringify({
          articleId,
          imageUrl
        })
      });

      if (response.success && response.thumbnailUrl) {
        setCurrentThumbnail(response.thumbnailUrl);
        
        if (onThumbnailGenerated) {
          onThumbnailGenerated(response.thumbnailUrl);
        }

        toast({
          title: "تم توليد الصورة المصغرة",
          description: "تم إنشاء صورة الغلاف بنسبة 16:9 بنجاح"
        });
      } else {
        throw new Error(response.message || "فشل توليد الصورة المصغرة");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل توليد الصورة المصغرة",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate thumbnail when image changes
  useEffect(() => {
    if (autoGenerate && imageUrl && !currentThumbnail && articleId) {
      generateThumbnail();
    }
  }, [imageUrl, articleId]); // Re-run when image or article changes

  if (!imageUrl) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">صورة الغلاف المصغرة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentThumbnail ? (
          <div className="space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <img
                src={currentThumbnail}
                alt="صورة الغلاف المصغرة"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                16:9
              </div>
            </div>
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                تم توليد صورة الغلاف المصغرة وستظهر في قوائم الأخبار
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              لا توجد صورة غلاف مصغرة. سيتم عرض الصورة الأصلية في القوائم.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={generateThumbnail}
          disabled={isGenerating || !imageUrl}
          variant={currentThumbnail ? "outline" : "default"}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري توليد الصورة المصغرة...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 ml-2" />
              {currentThumbnail ? "إعادة توليد الصورة المصغرة" : "توليد صورة الغلاف (16:9)"}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          صورة الغلاف تظهر فقط في قوائم الأخبار بنسبة 16:9 محسّنة للعرض السريع
        </p>
      </CardContent>
    </Card>
  );
}