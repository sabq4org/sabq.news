import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    id: string;
    title: string;
    excerpt?: string | null;
    content?: string | null;
    publisherStatus?: string;
    createdAt: string;
    publisher?: {
      agencyName: string;
    } | null;
  } | null;
}

export function ArticlePreviewModal({
  isOpen,
  onClose,
  article,
}: ArticlePreviewModalProps) {
  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-article-preview">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-2">
            <span>
              نُشر منذ{" "}
              {formatDistanceToNow(new Date(article.createdAt), {
                locale: ar,
                addSuffix: false,
              })}
            </span>
            {article.publisher && (
              <>
                <span className="text-muted-foreground">•</span>
                <span>{article.publisher.agencyName}</span>
              </>
            )}
            {article.publisherStatus && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge variant="outline" data-testid={`badge-status-${article.publisherStatus}`}>
                  {article.publisherStatus === "pending" && "قيد المراجعة"}
                  {article.publisherStatus === "approved" && "موافق عليه"}
                  {article.publisherStatus === "rejected" && "مرفوض"}
                  {article.publisherStatus === "revision_required" && "يحتاج تعديل"}
                </Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] mt-4">
          <div className="space-y-4 pr-4">
            {article.excerpt && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium mb-2">المقتطف:</p>
                <p className="text-sm text-muted-foreground">{article.excerpt}</p>
              </div>
            )}

            {article.content && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
            )}

            {!article.content && !article.excerpt && (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا يوجد محتوى للمعاينة</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
