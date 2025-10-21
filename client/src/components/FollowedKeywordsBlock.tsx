import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tag, X } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface FollowedKeyword {
  tagId: string;
  tagName: string;
  notify: boolean;
  articleCount: number;
}

export function FollowedKeywordsBlock() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: keywords = [], isLoading } = useQuery<FollowedKeyword[]>({
    queryKey: ["/api/user/followed-keywords"],
    enabled: !!user,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return await apiRequest(`/api/keywords/unfollow/${tagId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/followed-keywords"] });
      toast({
        title: "تم إلغاء المتابعة",
        description: "لن تتلقى إشعارات عن هذه الكلمة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء المتابعة",
        variant: "destructive",
      });
    },
  });

  // Don't show if user is not logged in
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">كلماتي المتابعة</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          تابع الكلمات المفتاحية واحصل على إشعارات بالمقالات الجديدة
        </p>
        
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">كلماتي المتابعة</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          تابع الكلمات المفتاحية واحصل على إشعارات بالمقالات الجديدة
        </p>
        
        <div className="flex flex-col items-center justify-center py-4">
          <Tag className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            لم تتابع أي كلمات بعد — تصفح الكلمات المتداولة واضغط على الجرس للمتابعة
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent border border-border/40 p-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">كلماتي المتابعة</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        تابع الكلمات المفتاحية واحصل على إشعارات بالمقالات الجديدة
      </p>
      
      <div className="flex flex-wrap gap-2" dir="rtl">
        {keywords.map((item) => (
          <motion.div
            key={item.tagId}
            className="flex items-center gap-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.button
              onClick={() => setLocation(`/keyword/${encodeURIComponent(item.tagName)}`)}
              className="bg-primary/80 dark:bg-primary/70 text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2 shadow-sm transition-all duration-200 cursor-pointer border-0 text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              data-testid={`followed-keyword-${item.tagName}`}
              aria-label={`الكلمة المفتاحية ${item.tagName} مع ${item.articleCount} ${item.articleCount === 1 ? 'مقال' : 'مقالات'}`}
            >
              <span>#{item.tagName}</span>
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
                {item.articleCount}
              </Badge>
            </motion.button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                unfollowMutation.mutate(item.tagId);
              }}
              disabled={unfollowMutation.isPending}
              data-testid={`button-unfollow-keyword-${item.tagId}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
