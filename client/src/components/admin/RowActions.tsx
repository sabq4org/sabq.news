import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Star, Archive, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RowActionsProps {
  articleId: string;
  status: string;
  onEdit: () => void;
  isFeatured: boolean;
  onDelete: () => void;
}

export function RowActions({ articleId, status, onEdit, isFeatured: initialIsFeatured, onDelete }: RowActionsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured);

  // Update local state when prop changes
  useEffect(() => {
    setIsFeatured(initialIsFeatured);
  }, [initialIsFeatured]);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await apiRequest(`/api/admin/articles/${articleId}/archive`, {
        method: "POST",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles/metrics"] });
      
      toast({
        title: "تم الأرشفة",
        description: "تم أرشفة المقال بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشلت عملية الأرشفة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await apiRequest(`/api/admin/articles/${articleId}/publish`, {
        method: "POST",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles/metrics"] });
      
      toast({
        title: "تم النشر",
        description: "تم نشر المقال بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل نشر المقال",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeature = async () => {
    const previousValue = isFeatured;
    
    // Optimistic update
    setIsFeatured(!isFeatured);
    setIsLoading(true);
    
    try {
      await apiRequest(`/api/admin/articles/${articleId}/feature`, {
        method: "POST",
        body: JSON.stringify({ featured: !previousValue }),
        headers: { "Content-Type": "application/json" },
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      
      toast({
        title: !previousValue ? "تم التمييز" : "تم إلغاء التمييز",
        description: !previousValue ? "تم تمييز المقال بنجاح" : "تم إلغاء تمييز المقال بنجاح",
      });
    } catch (error: any) {
      // Revert on error
      setIsFeatured(previousValue);
      
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث حالة التمييز",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // للمقالات المؤرشفة: تعديل - مميز - نشر
  if (status === "archived") {
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          disabled={isLoading}
          data-testid={`button-action-edit-${articleId}`}
          title="تعديل"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFeature}
          disabled={isLoading}
          data-testid={`button-action-feature-${articleId}`}
          title={isFeatured ? "إلغاء التمييز" : "تمييز"}
        >
          <Star className={`w-4 h-4 ${isFeatured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePublish}
          disabled={isLoading}
          data-testid={`button-action-publish-${articleId}`}
          title="نشر"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // للمقالات النشطة (منشور/مسودة/مجدول): تعديل - مميز - أرشفة - حذف
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        disabled={isLoading}
        data-testid={`button-action-edit-${articleId}`}
        title="تعديل"
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFeature}
        disabled={isLoading}
        data-testid={`button-action-feature-${articleId}`}
        title={isFeatured ? "إلغاء التمييز" : "تمييز"}
      >
        <Star className={`w-4 h-4 ${isFeatured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleArchive}
        disabled={isLoading}
        data-testid={`button-action-archive-${articleId}`}
        title="أرشفة"
      >
        <Archive className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={isLoading}
        data-testid={`button-action-delete-${articleId}`}
        title="حذف"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}
