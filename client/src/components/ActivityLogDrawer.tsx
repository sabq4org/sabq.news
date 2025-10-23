import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, User, Clock, Activity, Database, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ActivityLogDrawerProps {
  log?: {
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    oldValue: Record<string, any> | null;
    newValue: Record<string, any> | null;
    metadata: { ip?: string; userAgent?: string; reason?: string } | null;
    createdAt: Date | string;
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('success')) return "default";
  if (actionLower.includes('update') || actionLower.includes('modify')) return "secondary";
  if (actionLower.includes('delete') || actionLower.includes('ban') || actionLower.includes('fail')) return "destructive";
  return "outline";
}

export default function ActivityLogDrawer({ log, open, onOpenChange }: ActivityLogDrawerProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} بنجاح`,
    });
  };

  const copyJSON = () => {
    if (!log) return;
    const json = JSON.stringify(log, null, 2);
    copyToClipboard(json, "بيانات JSON");
  };

  if (!log) return null;

  const userName = log.user
    ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
    : 'مستخدم محذوف';

  const userInitials = log.user
    ? `${log.user.firstName?.[0] || ''}${log.user.lastName?.[0] || ''}` || log.user.email[0]
    : 'U';

  const createdAt = typeof log.createdAt === 'string' ? new Date(log.createdAt) : log.createdAt;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto" data-testid="activity-log-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            تفاصيل سجل النشاط
          </SheetTitle>
          <SheetDescription>
            معلومات كاملة عن العملية المنفذة
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Information */}
          <div data-testid="drawer-user-section">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              المستخدم
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-md border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={log.user?.profileImageUrl || undefined} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{userName}</p>
                {log.user && (
                  <p className="text-xs text-muted-foreground truncate">{log.user.email}</p>
                )}
              </div>
              {log.userId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(log.userId!, 'معرف المستخدم')}
                  data-testid="button-copy-user-id"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Information */}
          <div data-testid="drawer-action-section">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              معلومات العملية
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="text-sm text-muted-foreground">نوع العملية</span>
                <Badge variant={getActionBadgeVariant(log.action)} data-testid="badge-action">
                  {log.action}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="text-sm text-muted-foreground">نوع الكيان</span>
                <span className="text-sm font-medium">{log.entityType}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="text-sm text-muted-foreground">معرف الكيان</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded">{log.entityId}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(log.entityId, 'معرف الكيان')}
                    data-testid="button-copy-entity-id"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamp */}
          <div data-testid="drawer-time-section">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              التوقيت
            </h3>
            <div className="p-3 rounded-md border">
              <p className="text-sm">
                {format(createdAt, 'PPpp', { locale: ar })}
              </p>
            </div>
          </div>

          {/* Metadata */}
          {log.metadata && (
            <>
              <Separator />
              <div data-testid="drawer-metadata-section">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  معلومات إضافية
                </h3>
                <div className="space-y-2">
                  {log.metadata.ip && (
                    <div className="p-2 rounded-md bg-muted/50">
                      <span className="text-xs text-muted-foreground">عنوان IP:</span>
                      <code className="text-xs mr-2">{log.metadata.ip}</code>
                    </div>
                  )}
                  {log.metadata.userAgent && (
                    <div className="p-2 rounded-md bg-muted/50">
                      <span className="text-xs text-muted-foreground">المتصفح:</span>
                      <p className="text-xs mt-1 break-all">{log.metadata.userAgent}</p>
                    </div>
                  )}
                  {log.metadata.reason && (
                    <div className="p-2 rounded-md bg-muted/50">
                      <span className="text-xs text-muted-foreground">السبب:</span>
                      <p className="text-xs mt-1">{log.metadata.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Old and New Values */}
          {(log.oldValue || log.newValue) && (
            <>
              <Separator />
              <div data-testid="drawer-values-section">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  التغييرات
                </h3>
                <div className="space-y-4">
                  {log.oldValue && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">القيمة القديمة:</p>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(log.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.newValue && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">القيمة الجديدة:</p>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(log.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={copyJSON}
              data-testid="button-copy-json"
            >
              <Copy className="h-4 w-4 ml-2" />
              نسخ JSON
            </Button>
            {/* You can add more action buttons here like "View Entity" if needed */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
