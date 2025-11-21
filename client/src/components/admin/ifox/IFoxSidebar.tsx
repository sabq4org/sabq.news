import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Brain,
  Home,
  FileText,
  FolderOpen,
  Image,
  Calendar,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  Sparkles,
  Cpu,
  MessageSquare,
  Lightbulb,
  GraduationCap,
  Users,
  Eye,
  BookOpen,
  Zap,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IFoxSidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  titleEn?: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
  gradient?: string;
}

const navigationItems: NavItem[] = [
  {
    title: "نظرة عامة",
    titleEn: "Overview",
    href: "/dashboard/admin/ifox",
    icon: Home,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    title: "إدارة المقالات",
    titleEn: "Articles",
    href: "/dashboard/admin/ifox/articles",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-500",
    badge: "جديد",
  },
  {
    title: "التصنيفات",
    titleEn: "Categories",
    icon: FolderOpen,
    gradient: "from-indigo-500 to-purple-500",
    children: [
      {
        title: "أخبار AI",
        titleEn: "AI News",
        href: "/dashboard/admin/ifox/categories/ai-news",
        icon: Sparkles,
      },
      {
        title: "AI Voice",
        titleEn: "AI Voice",
        href: "/dashboard/admin/ifox/categories/ai-voice",
        icon: MessageSquare,
      },
      {
        title: "AI Tools",
        titleEn: "AI Tools",
        href: "/dashboard/admin/ifox/categories/ai-tools",
        icon: Cpu,
      },
      {
        title: "AI Academy",
        titleEn: "AI Academy",
        href: "/dashboard/admin/ifox/categories/ai-academy",
        icon: GraduationCap,
      },
      {
        title: "AI Community",
        titleEn: "AI Community",
        href: "/dashboard/admin/ifox/categories/ai-community",
        icon: Users,
      },
      {
        title: "AI Insights",
        titleEn: "AI Insights",
        href: "/dashboard/admin/ifox/categories/ai-insights",
        icon: Lightbulb,
      },
      {
        title: "AI Opinions",
        titleEn: "AI Opinions",
        href: "/dashboard/admin/ifox/categories/ai-opinions",
        icon: Eye,
      },
    ],
  },
  {
    title: "مكتبة الوسائط",
    titleEn: "Media Library",
    href: "/dashboard/admin/ifox/media",
    icon: Image,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    title: "الجدولة",
    titleEn: "Scheduling",
    href: "/dashboard/admin/ifox/schedule",
    icon: Calendar,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "التحليلات",
    titleEn: "Analytics",
    href: "/dashboard/admin/ifox/analytics",
    icon: BarChart3,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "الإعدادات",
    titleEn: "Settings",
    href: "/dashboard/admin/ifox/settings",
    icon: Settings,
    gradient: "from-gray-500 to-slate-500",
  },
];

export function IFoxSidebar({ className }: IFoxSidebarProps) {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location === href || location.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return false;
  };

  return (
    <motion.div
      className={cn(
        "w-64 h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950",
        "border-r border-white/10",
        className
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-white">آي فوكس</h2>
            <p className="text-xs text-white/60">iFox AI Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-2" dir="rtl">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.title);
            const active = isParentActive(item);

            return (
              <div key={item.title} data-testid={`ifox-nav-${item.title}`}>
                {item.children ? (
                  <>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 group relative overflow-hidden",
                        "hover:bg-white/5 transition-all duration-200",
                        active && "bg-white/10"
                      )}
                      onClick={() => toggleExpanded(item.title)}
                      data-testid={`ifox-nav-toggle-${item.title}`}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          active
                            ? `bg-gradient-to-r ${item.gradient}`
                            : "bg-white/10 group-hover:bg-white/20"
                        )}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="flex-1 text-right text-white/80 group-hover:text-white">
                        {item.title}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-white/60" />
                      </motion.div>
                    </Button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mr-4 space-y-1 mt-1"
                        >
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive = isActive(child.href);
                            
                            return (
                              <Link key={child.title} href={child.href!}>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start gap-2 text-sm group",
                                    "hover:bg-white/5 transition-all duration-200",
                                    childActive && "bg-white/10"
                                  )}
                                  data-testid={`ifox-nav-child-${child.title}`}
                                >
                                  <ChildIcon className="w-3 h-3 text-white/60 group-hover:text-white" />
                                  <span className="text-white/60 group-hover:text-white">
                                    {child.title}
                                  </span>
                                </Button>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link href={item.href!}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 group relative overflow-hidden",
                        "hover:bg-white/5 transition-all duration-200",
                        active && "bg-white/10"
                      )}
                      data-testid={`ifox-nav-link-${item.title}`}
                    >
                      {/* Active indicator */}
                      {active && (
                        <motion.div
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-violet-500 to-purple-500 rounded-l-full"
                          initial={{ x: 10 }}
                          animate={{ x: 0 }}
                          transition={{ type: "spring" }}
                        />
                      )}

                      <div
                        className={cn(
                          "p-2 rounded-lg transition-all duration-200",
                          active
                            ? `bg-gradient-to-r ${item.gradient} shadow-lg`
                            : "bg-white/10 group-hover:bg-white/20"
                        )}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="flex-1 text-right text-white/80 group-hover:text-white">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.titleEn && (
                        <span className="text-xs text-white/40 group-hover:text-white/60">
                          {item.titleEn}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-white/60">Powered by AI</span>
          <Layers className="w-4 h-4 text-violet-400" />
        </div>
      </div>
    </motion.div>
  );
}