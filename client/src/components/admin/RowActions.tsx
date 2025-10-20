import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, Undo2, Upload, MoreVertical, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RowActionsProps {
  articleId: string;
  status: string;
}

export function RowActions({ articleId, status }: RowActionsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await apiRequest(`/api/admin/articles/${articleId}/restore`, {
        method: "POST",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles/metrics"] });
      
      toast({
        title: "تم الاسترجاع",
        description: "تم استرجاع المقال بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشلت عملية الاسترجاع",
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

  if (status === "archived") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handlePublish}
          disabled={isLoading}
          data-testid={`button-action-publish-${articleId}`}
        >
          <Upload className="w-4 h-4 ml-2" />
          نشر
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRestore}
          disabled={isLoading}
          data-testid={`button-action-restore-${articleId}`}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleArchive}
        disabled={isLoading}
        data-testid={`button-action-archive-${articleId}`}
      >
        <Archive className="w-4 h-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" data-testid={`button-action-menu-${articleId}`}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePublish} disabled={isLoading}>
            <Send className="w-4 h-4 ml-2" />
            نشر الآن
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive} disabled={isLoading}>
            <Archive className="w-4 h-4 ml-2" />
            أرشفة
          </DropdownMenuItem>
          {status === "archived" && (
            <DropdownMenuItem onClick={handleRestore} disabled={isLoading}>
              <Undo2 className="w-4 h-4 ml-2" />
              استرجاع
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
