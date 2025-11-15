import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Task } from "@shared/schema";
import { Clock, User, Calendar, Tag, FileText, Folder } from "lucide-react";

interface TaskViewDialogProps {
  taskId: string;
  onClose: () => void;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export function TaskViewDialog({ taskId, onClose }: TaskViewDialogProps) {
  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['/api/tasks', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch task');
      return await res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    },
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return 'غير مسند';
    const user = users.find(u => u.id === userId);
    if (!user) return 'غير معروف';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl" data-testid="dialog-task-view">
        <DialogHeader>
          <DialogTitle data-testid="heading-dialog-title">تفاصيل المهمة</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8" data-testid="text-loading">جاري التحميل...</div>
        ) : task ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2" data-testid="text-task-title">{task.title}</h3>
              {task.description && (
                <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-task-description">
                  {task.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">الحالة:</span>
                <Badge data-testid="badge-task-status">{getStatusLabel(task.status)}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">الأولوية:</span>
                <span className={getPriorityColor(task.priority)} data-testid="text-task-priority">
                  {getPriorityLabel(task.priority)}
                </span>
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">تاريخ الاستحقاق:</span>
                  <span data-testid="text-task-due-date">
                    {format(new Date(task.dueDate), 'PPP', { locale: ar })}
                  </span>
                </div>
              )}

              {task.assignedToId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">المسؤول:</span>
                  <span data-testid="text-task-assignee">{getUserName(task.assignedToId)}</span>
                </div>
              )}

              {task.department && (
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">القسم:</span>
                  <span data-testid="text-task-department">{task.department}</span>
                </div>
              )}

              {task.category && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">الفئة:</span>
                  <span data-testid="text-task-category">{task.category}</span>
                </div>
              )}
            </div>

            {task.tags && task.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium">الوسوم:</span>
                <div className="flex flex-wrap gap-2 mt-2" data-testid="container-task-tags">
                  {task.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" data-testid={`badge-tag-${i}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-not-found">
            المهمة غير موجودة
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    todo: 'قيد الانتظار',
    in_progress: 'قيد العمل',
    review: 'مراجعة',
    completed: 'مكتملة',
    archived: 'مؤرشفة',
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    critical: 'عاجلة',
  };
  return labels[priority] || priority;
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'text-gray-600 dark:text-gray-400',
    medium: 'text-blue-600 dark:text-blue-400',
    high: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400',
  };
  return colors[priority] || 'text-gray-600';
}
