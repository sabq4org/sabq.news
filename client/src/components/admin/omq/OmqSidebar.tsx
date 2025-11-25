import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain,
  Home,
  Plus,
  Archive,
  Eye,
  Clock,
  X,
  Globe,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import mascotImage from "@assets/sabq_ai_mascot_1_1_1763712965053.png";

interface OmqSidebarProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
}

interface NavItem {
  title: string;
  titleEn?: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  gradient?: string;
}

const navigationItems: NavItem[] = [
  {
    title: "لوحة التحكم",
    titleEn: "Dashboard",
    href: "/dashboard/ai/deep",
    icon: Home,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    title: "تحليل جديد",
    titleEn: "New Analysis",
    href: "/dashboard/ai/deep?new=true",
    icon: Plus,
    gradient: "from-emerald-500 to-teal-500",
    badge: "إنشاء",
  },
  {
    title: "المنشورة",
    titleEn: "Published",
    href: "/dashboard/ai/deep?status=published",
    icon: Globe,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "المسودات",
    titleEn: "Drafts",
    href: "/dashboard/ai/deep?status=draft",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "الأرشيف",
    titleEn: "Archived",
    href: "/dashboard/ai/deep?status=archived",
    icon: Archive,
    gradient: "from-gray-500 to-slate-500",
  },
];

export function OmqSidebar({ className, onClose, isMobile }: OmqSidebarProps) {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard/ai/deep") {
      return location === href || (location.startsWith(href) && !location.includes("?"));
    }
    return location === href || location.startsWith(href);
  };

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-l border-slate-800/50 flex flex-col",
        className
      )}
      dir="rtl"
    >
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              animate={{
                y: [0, -5, 0],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full blur-lg opacity-60 bg-gradient-to-r from-violet-500 to-purple-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <img
                src={mascotImage}
                alt="عمق AI"
                className="w-10 h-10 rounded-full relative z-10"
              />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                عمق
              </h1>
              <p className="text-xs text-slate-500">التحليل العميق الذكي</p>
            </div>
          </div>
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  onClick={handleNavClick}
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid={`nav-${item.titleEn?.toLowerCase().replace(/\s+/g, '-') || item.title}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                    active
                      ? "bg-gradient-to-l from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-md",
                      active
                        ? `bg-gradient-to-r ${item.gradient}`
                        : "bg-slate-800"
                    )}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-800/50">
        <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-white">نماذج AI</span>
          </div>
          <p className="text-xs text-slate-400">
            GPT-5.1 • Gemini 3 • Claude
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/50">
        <Link href="/omq">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
            data-testid="button-view-public"
          >
            <Eye className="w-4 h-4" />
            معاينة الصفحة العامة
          </Button>
        </Link>
      </div>
    </div>
  );
}
