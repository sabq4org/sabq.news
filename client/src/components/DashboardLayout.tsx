import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNav, trackNavClick } from "@/nav/useNav";
import { AppBreadcrumbs } from "./AppBreadcrumbs";
import type { UserRole } from "@/nav/types";
import type { NavItem } from "@/nav/types";

interface DashboardLayoutProps {
  children: ReactNode;
}

const STORAGE_KEY = "sabq.sidebar.v1";

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  
  // Load collapsed state from localStorage
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedGroups));
    } catch (error) {
      console.error("Failed to save sidebar state:", error);
    }
  }, [collapsedGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // عرض شاشة تحميل أثناء التحقق من المصادقة
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Get navigation state
  const role = (user.role || "guest") as UserRole;
  const flags = {
    aiDeepAnalysis: false, // يمكن تفعيلها من الإعدادات
    smartThemes: true,     // مفعلة افتراضياً
    audioSummaries: false,
  };
  
  const { treeFiltered, activeItem } = useNav({ role, flags });

  const handleLogout = async () => {
    try {
      await apiRequest("/api/logout", { method: "POST" });
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNavClick = (item: NavItem) => {
    trackNavClick(item.id, item.path);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return `${firstName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'س';
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeItem?.id === item.id;
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      const isOpen = !collapsedGroups[item.id];

      return (
        <Collapsible
          key={item.id}
          open={isOpen}
          onOpenChange={() => toggleGroup(item.id)}
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={item.labelAr || item.labelKey}
                className="w-full"
              >
                <span className="flex items-center gap-3 flex-1">
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.labelAr || item.labelKey}</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children?.map((child) => {
                  const ChildIcon = child.icon;
                  const isChildActive = activeItem?.id === child.id;
                  
                  return (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isChildActive}
                      >
                        <Link 
                          href={child.path || "#"}
                          onClick={() => handleNavClick(child)}
                        >
                          <span className="flex items-center gap-3">
                            {ChildIcon && <ChildIcon className="h-4 w-4" />}
                            <span>{child.labelAr || child.labelKey}</span>
                          </span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.labelAr || item.labelKey}
        >
          <Link 
            href={item.path || "#"}
            onClick={() => handleNavClick(item)}
          >
            <span className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5" />}
              <span>{item.labelAr || item.labelKey}</span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // Group items with and without dividers
  const navGroups: NavItem[][] = [];
  let currentGroup: NavItem[] = [];

  treeFiltered.forEach((item) => {
    if (item.divider && currentGroup.length > 0) {
      navGroups.push(currentGroup);
      currentGroup = [item];
    } else {
      currentGroup.push(item);
    }
  });

  if (currentGroup.length > 0) {
    navGroups.push(currentGroup);
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full" dir="rtl">
        <Sidebar side="right" collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">س</span>
                  </div>
                  <span>سبق الذكية</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {navGroups.map((group, groupIndex) => (
                  <SidebarMenu key={groupIndex} className={groupIndex > 0 ? "mt-4 pt-4 border-t" : ""}>
                    {group.map(renderNavItem)}
                  </SidebarMenu>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="p-4 space-y-3 border-t">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user?.firstName, user?.lastName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role === "admin" ? "مدير" : user?.role === "editor" ? "محرر" : "كاتب"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-16 items-center gap-4 border-b px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <AppBreadcrumbs role={role} flags={flags} />
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
