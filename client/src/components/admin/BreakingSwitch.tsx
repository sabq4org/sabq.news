import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BreakingSwitchProps {
  articleId: string;
  initialValue: boolean;
}

export function BreakingSwitch({ articleId, initialValue }: BreakingSwitchProps) {
  const [isBreaking, setIsBreaking] = useState(initialValue);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    const previousValue = isBreaking;
    
    setIsBreaking(checked);
    
    try {
      await apiRequest(`/api/admin/articles/${articleId}/toggle-breaking`, {
        method: "POST",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      
      toast({
        title: checked ? "تم التمييز كخبر عاجل" : "تم إلغاء التمييز كخبر عاجل",
        description: checked 
          ? "تم تمييز المقال كخبر عاجل بنجاح"
          : "تم إلغاء تمييز المقال كخبر عاجل بنجاح",
      });
    } catch (error: any) {
      setIsBreaking(previousValue);
      
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث حالة الخبر العاجل",
        variant: "destructive",
      });
    }
  };

  return (
    <Switch
      checked={isBreaking}
      onCheckedChange={handleToggle}
      className="h-5 w-9 data-[state=checked]:bg-red-600 dark:data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
      data-testid={`switch-breaking-${articleId}`}
    />
  );
}
