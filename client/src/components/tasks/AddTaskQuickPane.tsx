import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Calendar, Flag, User, X, ArrowDown, Minus, ArrowUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { InsertTask } from "@shared/schema";

interface AddTaskQuickPaneProps {
  onSubmit: (data: Partial<InsertTask>) => Promise<void>;
  isPending?: boolean;
  creatingSubtaskFor?: string | null;
  onCancel?: () => void;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

const quickTaskSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "completed", "archived"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dueDate: z.date().optional(),
  assignedToId: z.string().optional(),
  parentTaskId: z.string().optional(),
});

type QuickTaskForm = z.infer<typeof quickTaskSchema>;

const priorityIcons = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  critical: AlertTriangle,
} as const;

const priorityColors = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-red-500",
} as const;

const priorityOptions = [
  { value: "low" as const, label: "منخفضة" },
  { value: "medium" as const, label: "متوسطة" },
  { value: "high" as const, label: "عالية" },
  { value: "critical" as const, label: "عاجلة" },
];

export default function AddTaskQuickPane({
  onSubmit,
  isPending = false,
  creatingSubtaskFor = null,
  onCancel,
}: AddTaskQuickPaneProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPrioritySelect, setShowPrioritySelect] = useState(false);
  const [showAssigneeSelect, setShowAssigneeSelect] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<QuickTaskForm>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: undefined,
      assignedToId: undefined,
      parentTaskId: creatingSubtaskFor || undefined,
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
  });

  useEffect(() => {
    if (expanded && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [expanded]);

  useEffect(() => {
    if (creatingSubtaskFor) {
      setExpanded(true);
      form.setValue("parentTaskId", creatingSubtaskFor);
    } else if (!creatingSubtaskFor && form.getValues("parentTaskId")) {
      form.setValue("parentTaskId", undefined);
    }
  }, [creatingSubtaskFor, form]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const title = form.getValues("title");
      if (title.trim()) {
        // Always use full submit to preserve all fields
        form.handleSubmit(handleFullSubmit)();
      }
    }
  };

  const handleQuickSubmit = async () => {
    const values = form.getValues();
    
    if (!values.title?.trim()) return;

    // Use form values, not hard-coded defaults
    const data: Partial<InsertTask> = {
      title: values.title.trim(),
      status: values.status || "todo",
      priority: values.priority || "medium",
      description: values.description?.trim() || undefined,
      dueDate: values.dueDate?.toISOString(),
      assignedToId: values.assignedToId || undefined,
      parentTaskId: creatingSubtaskFor || undefined,
    };

    try {
      await onSubmit(data);
      handleReset();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleFullSubmit = form.handleSubmit(async (data) => {
    const submitData: Partial<InsertTask> = {
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate?.toISOString(),
      assignedToId: data.assignedToId || undefined,
      parentTaskId: creatingSubtaskFor || data.parentTaskId || undefined,
    };

    try {
      await onSubmit(submitData);
      handleReset();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  });

  const handleReset = () => {
    form.reset({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: undefined,
      assignedToId: undefined,
      parentTaskId: undefined,
    });
    form.setValue("parentTaskId", undefined);
    setExpanded(false);
    setShowDatePicker(false);
    setShowPrioritySelect(false);
    setShowAssigneeSelect(false);
  };

  const handleCancel = () => {
    handleReset();
    if (onCancel) {
      onCancel();
    }
  };

  const handleSmartButtonClick = () => {
    if (!expanded) {
      setExpanded(true);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return "غير معروف";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  };

  const selectedPriority = priorityOptions.find(
    (opt) => opt.value === form.watch("priority")
  );

  const currentPriority = form.watch("priority");
  const PriorityIcon = currentPriority ? priorityIcons[currentPriority] : null;
  const priorityColor = currentPriority ? priorityColors[currentPriority] : "";

  return (
    <Card
      className="overflow-hidden"
      dir="rtl"
      data-testid="card-add-task-quick-pane"
    >
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="p-4"
      >
        <Input
          ref={titleInputRef}
          placeholder={
            creatingSubtaskFor
              ? "اكتب المهمة الفرعية الجديدة..."
              : "اكتب المهمة الجديدة..."
          }
          value={form.watch("title")}
          onChange={(e) => form.setValue("title", e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="text-base border-0 shadow-none focus-visible:ring-0 px-0"
          data-testid="input-task-title"
        />

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 mt-3"
            >
              <Textarea
                placeholder="الوصف (اختياري)"
                value={form.watch("description") || ""}
                onChange={(e) => form.setValue("description", e.target.value)}
                disabled={isPending}
                rows={3}
                className="resize-none text-sm"
                data-testid="textarea-task-description"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSmartButtonClick}
                      disabled={isPending}
                      className={cn(
                        "gap-2",
                        form.watch("dueDate") && "text-primary"
                      )}
                      data-testid="button-task-due-date"
                    >
                      <Calendar className="h-4 w-4" />
                      {form.watch("dueDate")
                        ? format(form.watch("dueDate")!, "PPP", { locale: ar })
                        : "تاريخ الاستحقاق"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.watch("dueDate")}
                      onSelect={(date) => {
                        form.setValue("dueDate", date);
                        setShowDatePicker(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover
                  open={showPrioritySelect}
                  onOpenChange={setShowPrioritySelect}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSmartButtonClick}
                      disabled={isPending}
                      className="gap-2"
                      data-testid="button-task-priority"
                    >
                      <Flag className="h-4 w-4" />
                      {selectedPriority && PriorityIcon ? (
                        <>
                          <PriorityIcon className={cn("h-3.5 w-3.5", priorityColor)} />
                          <span>{selectedPriority.label}</span>
                        </>
                      ) : (
                        "الأولوية"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                      {priorityOptions.map((option) => {
                        const OptionIcon = priorityIcons[option.value];
                        const optionColor = priorityColors[option.value];
                        return (
                          <Button
                            key={option.value}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              form.setValue("priority", option.value);
                              setShowPrioritySelect(false);
                            }}
                            data-testid={`button-priority-${option.value}`}
                          >
                            <OptionIcon className={cn("h-3.5 w-3.5", optionColor)} />
                            <span>{option.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover
                  open={showAssigneeSelect}
                  onOpenChange={setShowAssigneeSelect}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSmartButtonClick}
                      disabled={isPending}
                      className={cn(
                        "gap-2",
                        form.watch("assignedToId") && "text-primary"
                      )}
                      data-testid="button-task-assignee"
                    >
                      <User className="h-4 w-4" />
                      {form.watch("assignedToId")
                        ? getUserName(form.watch("assignedToId")!)
                        : "المسؤول"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          form.setValue("assignedToId", undefined);
                          setShowAssigneeSelect(false);
                        }}
                        data-testid="button-assignee-none"
                      >
                        غير مسند
                      </Button>
                      {users.map((user) => (
                        <Button
                          key={user.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            form.setValue("assignedToId", user.id);
                            setShowAssigneeSelect(false);
                          }}
                          data-testid={`button-assignee-${user.id}`}
                        >
                          {getUserName(user.id)}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isPending}
                  data-testid="button-task-cancel"
                >
                  إلغاء
                </Button>

                <Button
                  size="sm"
                  onClick={handleFullSubmit}
                  disabled={isPending || !form.watch("title")?.trim()}
                  data-testid="button-task-submit"
                >
                  {creatingSubtaskFor ? "إضافة مهمة فرعية" : "إضافة مهمة"}
                </Button>
              </div>

              {form.watch("dueDate") && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    موعد الاستحقاق:{" "}
                    {format(form.watch("dueDate")!, "PPP", { locale: ar })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => form.setValue("dueDate", undefined)}
                    data-testid="button-clear-due-date"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Card>
  );
}
