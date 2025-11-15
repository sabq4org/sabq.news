import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ListTodo, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListPlus
} from "lucide-react";
import { format, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import type { Task, InsertTask } from "@shared/schema";
import { insertTaskSchema } from "@shared/schema";

interface TaskStatistics {
  total: number;
  in_progress: number;
  overdue: number;
  completed: number;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

const statusOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'todo', label: 'قيد الانتظار' },
  { value: 'in_progress', label: 'قيد العمل' },
  { value: 'review', label: 'مراجعة' },
  { value: 'completed', label: 'مكتملة' },
] as const;

const priorityOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'low', label: 'منخفضة' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'high', label: 'عالية' },
  { value: 'critical', label: 'عاجلة' },
] as const;

const statusLabels: Record<string, string> = {
  todo: 'قيد الانتظار',
  in_progress: 'قيد العمل',
  review: 'مراجعة',
  completed: 'مكتملة',
  archived: 'مؤرشفة',
};

const priorityLabels: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  critical: 'عاجلة',
};

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'low':
      return 'text-gray-600';
    case 'medium':
      return 'text-blue-600';
    case 'high':
      return 'text-orange-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

// Component for rendering subtasks
interface SubtaskRowProps {
  parentTask: Task;
  users: User[];
  onDelete: (id: string) => void;
  onCreateSubtask: (parentId: string) => void;
}

function SubtaskRow({ parentTask, users, onDelete, onCreateSubtask }: SubtaskRowProps) {
  const { data: subtasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks', 'subtasks', parentTask.id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?parentTaskId=${parentTask.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch subtasks');
      const data = await res.json();
      return data.tasks || [];
    },
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return 'غير مسند';
    const user = users.find(u => u.id === userId);
    if (!user) return 'غير معروف';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <>
      {subtasks.map((subtask) => {
        const dueDateValue = subtask.dueDate ? new Date(subtask.dueDate) : null;
        const taskIsOverdue = dueDateValue && dueDateValue < new Date() && subtask.status !== 'completed';
        
        return (
          <TableRow key={subtask.id} data-testid={`row-subtask-${subtask.id}`} className="bg-muted/30">
            <TableCell className="font-medium pr-12" data-testid={`text-title-${subtask.id}`}>
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-border" />
                <div>
                  <div>{subtask.title}</div>
                  {subtask.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {subtask.description}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell data-testid={`badge-status-${subtask.id}`}>
              <Badge variant={getStatusVariant(subtask.status)}>
                {statusLabels[subtask.status]}
              </Badge>
            </TableCell>
            <TableCell data-testid={`badge-priority-${subtask.id}`}>
              <span className={getPriorityColor(subtask.priority)}>
                {priorityLabels[subtask.priority]}
              </span>
            </TableCell>
            <TableCell data-testid={`text-assignee-${subtask.id}`}>
              {getUserName(subtask.assignedToId)}
            </TableCell>
            <TableCell data-testid={`text-due-date-${subtask.id}`}>
              {dueDateValue ? (
                <div className="flex items-center gap-2">
                  <span className={taskIsOverdue ? 'text-red-600' : ''}>
                    {format(dueDateValue, 'PPP', { locale: ar })}
                  </span>
                  {taskIsOverdue && (
                    <AlertCircle className="h-4 w-4 text-red-600" data-testid={`icon-overdue-${subtask.id}`} />
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">غير محدد</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`button-view-${subtask.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`button-edit-${subtask.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(subtask.id)}
                  data-testid={`button-delete-${subtask.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export default function TasksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [creatingSubtaskFor, setCreatingSubtaskFor] = useState<string | null>(null);
  
  const limit = 20;

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignedToId: undefined,
      dueDate: undefined,
      department: '',
      category: '',
      tags: [],
      parentTaskId: undefined,
      estimatedDuration: undefined,
    },
  });

  // Fetch tasks statistics
  const { data: statistics } = useQuery<TaskStatistics>({
    queryKey: ['/api/tasks/statistics'],
    queryFn: async () => {
      const res = await fetch('/api/tasks/statistics', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch statistics');
      return await res.json();
    },
  });

  // Fetch parent tasks only (tasks without a parent)
  const { data: tasksData, isLoading, isError, refetch } = useQuery<{ tasks: Task[]; total: number; totalPages: number }>({
    queryKey: ['/api/tasks', 'parent', page, searchQuery, statusFilter, priorityFilter, assigneeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        parentTaskId: 'null', // Fetch only parent tasks
      });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (assigneeFilter && assigneeFilter !== 'all') params.append('assignedToId', assigneeFilter);

      const res = await fetch(`/api/tasks?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return await res.json();
    },
  });

  // Fetch users for assignee select
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/statistics'] });
      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء المهمة بنجاح",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل إنشاء المهمة",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/tasks/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/statistics'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المهمة بنجاح",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل حذف المهمة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    // Parse tags if provided as comma-separated string
    const processedData: InsertTask = {
      ...data,
      tags: data.tags || [],
      parentTaskId: creatingSubtaskFor || data.parentTaskId,
      assignedToId: data.assignedToId === 'unassigned' ? undefined : data.assignedToId,
    };
    createMutation.mutate(processedData);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCreatingSubtaskFor(null);
    form.reset({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignedToId: undefined,
      dueDate: undefined,
      department: '',
      category: '',
      tags: [],
      parentTaskId: undefined,
      estimatedDuration: undefined,
    });
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleCreateSubtask = (parentId: string) => {
    setCreatingSubtaskFor(parentId);
    setIsDialogOpen(true);
  };

  const getParentTaskName = (parentId: string | null) => {
    if (!parentId) return null;
    const parentTask = tasksData?.tasks.find(t => t.id === parentId);
    return parentTask?.title || null;
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return 'غير مسند';
    const user = users.find(u => u.id === userId);
    if (!user) return 'غير معروف';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  const isOverdue = (dueDate: Date | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return isPast(dueDate);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold" data-testid="heading-tasks">
                مركز المهام
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              إدارة المهام والمتابعة
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            data-testid="button-create-task"
          >
            <Plus className="h-4 w-4 ml-2" />
            مهمة جديدة
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-stat-total">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                إجمالي المهام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-total">
                {(statistics?.total ?? 0).toLocaleString('en-US')}
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-in-progress">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                قيد العمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-stat-in-progress">
                {(statistics?.in_progress ?? 0).toLocaleString('en-US')}
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-overdue">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                متأخرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-stat-overdue">
                {(statistics?.overdue ?? 0).toLocaleString('en-US')}
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-completed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                مكتملة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-stat-completed">
                {(statistics?.completed ?? 0).toLocaleString('en-US')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card data-testid="card-filters">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              الفلاتر
            </CardTitle>
            <CardDescription>تصفية المهام حسب المعايير</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في العنوان والوصف..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pr-10"
                  data-testid="input-search"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(value) => {
                  setPriorityFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger data-testid="select-priority-filter">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={assigneeFilter}
                onValueChange={(value) => {
                  setAssigneeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger data-testid="select-assignee-filter">
                  <SelectValue placeholder="المسؤول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="unassigned">غير مسند</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {isError && (
          <Card data-testid="card-error">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive text-lg font-medium mb-2">حدث خطأ أثناء تحميل المهام</p>
              <p className="text-muted-foreground mb-4">يرجى المحاولة مرة أخرى</p>
              <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tasks Table */}
        {!isError && (
          <Card>
            <CardHeader>
              <CardTitle>جميع المهام</CardTitle>
              <CardDescription>
                عرض ({(tasksData?.tasks?.length ?? 0).toLocaleString('en-US')}) من ({(tasksData?.total ?? 0).toLocaleString('en-US')}) مهمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : !tasksData?.tasks || tasksData.tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد مهام</p>
                  <p className="text-sm">انقر على "مهمة جديدة" للبدء</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">العنوان</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الأولوية</TableHead>
                        <TableHead className="text-right">المسؤول</TableHead>
                        <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasksData.tasks.map((task) => {
                      const dueDateValue = task.dueDate ? new Date(task.dueDate) : null;
                      const taskIsOverdue = dueDateValue && dueDateValue < new Date() && task.status !== 'completed';
                      const isExpanded = expandedTasks.has(task.id);
                      
                      return (
                        <>
                          <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                            <TableCell className="font-medium" data-testid={`text-title-${task.id}`}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleExpand(task.id)}
                                  className="h-6 w-6"
                                  data-testid={`button-expand-task-${task.id}`}
                                >
                                  <ChevronDown 
                                    className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} 
                                  />
                                </Button>
                                <div>
                                  <div>{task.title}</div>
                                  {task.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {task.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`badge-status-${task.id}`}>
                              <Badge variant={getStatusVariant(task.status)}>
                                {statusLabels[task.status]}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`badge-priority-${task.id}`}>
                              <span className={getPriorityColor(task.priority)}>
                                {priorityLabels[task.priority]}
                              </span>
                            </TableCell>
                            <TableCell data-testid={`text-assignee-${task.id}`}>
                              {getUserName(task.assignedToId)}
                            </TableCell>
                            <TableCell data-testid={`text-due-date-${task.id}`}>
                              {dueDateValue ? (
                                <div className="flex items-center gap-2">
                                  <span className={taskIsOverdue ? 'text-red-600' : ''}>
                                    {format(dueDateValue, 'PPP', { locale: ar })}
                                  </span>
                                  {taskIsOverdue && (
                                    <AlertCircle className="h-4 w-4 text-red-600" data-testid={`icon-overdue-${task.id}`} />
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">غير محدد</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCreateSubtask(task.id)}
                                  title="إنشاء مهمة فرعية"
                                  data-testid={`button-create-subtask-${task.id}`}
                                >
                                  <ListPlus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-view-${task.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-edit-${task.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(task.id)}
                                  data-testid={`button-delete-${task.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <SubtaskRow 
                              key={`subtask-${task.id}`}
                              parentTask={task} 
                              users={users} 
                              onDelete={setDeleteId}
                              onCreateSubtask={handleCreateSubtask}
                            />
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>

                  {/* Pagination */}
                  {tasksData && tasksData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        صفحة {page.toLocaleString('en-US')} من {tasksData.totalPages.toLocaleString('en-US')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          data-testid="button-previous-page"
                        >
                          <ChevronRight className="h-4 w-4 ml-2" />
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(tasksData.totalPages, p + 1))}
                          disabled={page === tasksData.totalPages}
                          data-testid="button-next-page"
                        >
                          التالي
                          <ChevronLeft className="h-4 w-4 mr-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Task Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title-create-task">
                {creatingSubtaskFor ? 'إنشاء مهمة فرعية' : 'إنشاء مهمة جديدة'}
              </DialogTitle>
              <DialogDescription>
                {creatingSubtaskFor ? (
                  <span>
                    إضافة مهمة فرعية للمهمة: <strong>{getParentTaskName(creatingSubtaskFor)}</strong>
                  </span>
                ) : (
                  'أضف مهمة جديدة إلى النظام'
                )}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحالة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="todo">قيد الانتظار</SelectItem>
                            <SelectItem value="in_progress">قيد العمل</SelectItem>
                            <SelectItem value="review">مراجعة</SelectItem>
                            <SelectItem value="completed">مكتملة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الأولوية</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
                            <SelectItem value="critical">عاجلة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المسؤول</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "" ? undefined : value)}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-assignee">
                              <SelectValue placeholder="اختر المسؤول" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">غير محدد</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => {
                      // Convert ISO string to local datetime-local format
                      const formatForInput = (isoString: string | undefined) => {
                        if (!isoString) return '';
                        const date = new Date(isoString);
                        // Format as YYYY-MM-DDTHH:mm in local timezone
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                      };

                      return (
                        <FormItem>
                          <FormLabel>تاريخ الاستحقاق</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={formatForInput(field.value)}
                              onChange={(e) => {
                                // Convert local datetime to ISO string
                                if (e.target.value) {
                                  const date = new Date(e.target.value);
                                  field.onChange(date.toISOString());
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              data-testid="input-due-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القسم</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: التحرير، التقنية، التسويق" data-testid="input-department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوسوم</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="افصل بين الوسوم بفاصلة"
                          data-testid="input-tags"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="dialog-title-delete">تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
