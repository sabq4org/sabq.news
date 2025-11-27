import { QuickActionCard } from "./QuickActionCard";
import {
  Newspaper,
  CheckSquare,
  TrendingUp,
  Megaphone,
  Blocks,
} from "lucide-react";

export function QuickActionsSection() {
  const actions = [
    {
      id: "add-article",
      title: "إضافة خبر",
      description: "إنشاء خبر أو مقال جديد ونشره مباشرة",
      icon: Newspaper,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBgColor: "bg-emerald-50 dark:bg-emerald-950",
      href: "/dashboard/article/new",
      testId: "quick-action-add-article",
    },
    {
      id: "add-task",
      title: "إضافة مهمة",
      description: "إنشاء مهمة جديدة وتعيينها للفريق",
      icon: CheckSquare,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBgColor: "bg-indigo-50 dark:bg-indigo-950",
      href: "/dashboard/tasks",
      testId: "quick-action-add-task",
    },
    {
      id: "add-analysis",
      title: "إضافة تحليل عميق",
      description: "كتابة تحليل متعمق باستخدام الذكاء الاصطناعي",
      icon: TrendingUp,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBgColor: "bg-purple-50 dark:bg-purple-950",
      href: "/dashboard/ai/deep",
      testId: "quick-action-add-analysis",
    },
    {
      id: "add-block",
      title: "إضافة بلوك ذكي",
      description: "إنشاء بلوك محتوى ذكي قابل لإعادة الاستخدام",
      icon: Blocks,
      iconColor: "text-cyan-600 dark:text-cyan-400",
      iconBgColor: "bg-cyan-50 dark:bg-cyan-950",
      href: "/dashboard/smart-blocks",
      testId: "quick-action-add-block",
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">إجراءات سريعة</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            إضافة محتوى جديد بنقرة واحدة
          </p>
        </div>
      </div>

      {/* Grid - 2 columns on mobile for better space utilization */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            title={action.title}
            description={action.description}
            icon={action.icon}
            iconColor={action.iconColor}
            iconBgColor={action.iconBgColor}
            href={action.href}
            testId={action.testId}
          />
        ))}
      </div>
    </div>
  );
}
