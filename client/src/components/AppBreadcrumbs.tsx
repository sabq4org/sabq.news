import { Fragment } from "react";
import { Link } from "wouter";
import { ChevronLeft, Home } from "lucide-react";
import { useNav } from "@/nav/useNav";
import type { UserRole } from "@/nav/types";

interface AppBreadcrumbsProps {
  role?: UserRole;
  flags?: Record<string, boolean>;
}

/**
 * مكون مسار التنقل المتزامن مع شجرة القائمة
 * Breadcrumbs component synchronized with navigation tree
 */
export function AppBreadcrumbs({ role, flags }: AppBreadcrumbsProps) {
  const { activeItem, parents } = useNav({ role, flags });

  // لا تعرض شيء إذا لم يكن هناك عنصر نشط
  // Don't show anything if no active item
  if (!activeItem) {
    return null;
  }

  // بناء المسار: الصفحة الرئيسية + الآباء + العنصر النشط
  // Build path: Home + Parents + Active Item
  const breadcrumbItems = [
    { id: "home", labelAr: "الرئيسية", path: "/dashboard", icon: Home },
    ...parents.map(parent => ({
      id: parent.id,
      labelAr: parent.labelAr || parent.labelKey,
      path: parent.path,
    })),
    {
      id: activeItem.id,
      labelAr: activeItem.labelAr || activeItem.labelKey,
      path: activeItem.path,
    },
  ];

  return (
    <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const Icon = index === 0 ? Home : null;

        return (
          <Fragment key={item.id}>
            {index > 0 && (
              <ChevronLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}
            {isLast ? (
              <span 
                className="font-medium text-foreground flex items-center gap-2"
                aria-current="page"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.labelAr}
              </span>
            ) : (
              <Link 
                href={item.path || "/dashboard"}
                className="hover:text-foreground transition-colors flex items-center gap-2"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.labelAr}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
