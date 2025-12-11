import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Newspaper,
  CheckSquare,
  TrendingUp,
  Blocks,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { useAuth, hasAnyPermission } from "@/hooks/useAuth";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Newspaper;
  colorClass: string;
  href: string;
  testId: string;
  permissions: string[];
}

export function QuickActionsSection() {
  const { user } = useAuth();

  const allActions: QuickAction[] = [
    {
      id: "add-article",
      title: "إضافة خبر",
      description: "إنشاء خبر أو مقال جديد ونشره مباشرة",
      icon: Newspaper,
      colorClass: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      href: "/dashboard/article/new",
      testId: "quick-action-add-article",
      permissions: ["articles.create"],
    },
    {
      id: "add-task",
      title: "إضافة مهمة",
      description: "إنشاء مهمة جديدة وتعيينها للفريق",
      icon: CheckSquare,
      colorClass: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
      href: "/dashboard/tasks",
      testId: "quick-action-add-task",
      permissions: ["tasks.manage"],
    },
    {
      id: "add-analysis",
      title: "إضافة تحليل عميق",
      description: "كتابة تحليل متعمق باستخدام الذكاء الاصطناعي",
      icon: TrendingUp,
      colorClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
      href: "/dashboard/ai/deep",
      testId: "quick-action-add-analysis",
      permissions: ["analysis.create", "omq.create"],
    },
    {
      id: "add-block",
      title: "إضافة بلوك ذكي",
      description: "إنشاء بلوك محتوى ذكي قابل لإعادة الاستخدام",
      icon: Blocks,
      colorClass: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
      href: "/dashboard/smart-blocks",
      testId: "quick-action-add-block",
      permissions: ["blocks.manage"],
    },
  ];

  const visibleActions = allActions.filter((action) =>
    hasAnyPermission(user, ...action.permissions)
  );

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <Card data-testid="quick-actions-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" data-testid="title-quick-actions">
          <Zap className="h-5 w-5 text-primary" />
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.id} href={action.href} data-testid={action.testId}>
              <div className="p-3 border rounded-lg hover-elevate active-elevate-2 transition-all bg-card cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${action.colorClass}`}>
                    <Icon className="h-4 w-4" data-testid={`icon-${action.id}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm" data-testid={`text-${action.id}-title`}>
                      {action.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1" data-testid={`text-${action.id}-desc`}>
                      {action.description}
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
