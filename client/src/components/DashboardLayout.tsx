import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getHighestRole } from "@/hooks/useAuth";
import { LogOut, ChevronDown, Globe, User, Star } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
import { NotificationBell } from "./NotificationBell";
import { AutoPublishBanner } from "./AutoPublishBanner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNav, trackNavClick } from "@/nav/useNav";
import { AppBreadcrumbs } from "./AppBreadcrumbs";
import { InternalAnnouncement } from "./InternalAnnouncement";
import type { UserRole } from "@/nav/types";
import type { NavItem } from "@/nav/types";

interface DashboardLayoutProps {
  children: ReactNode;
}

const STORAGE_KEY = "sabq.sidebar.v1";

const iconColors = [
  "text-yellow-400",
  "text-green-400", 
  "text-blue-400",
  "text-purple-400",
  "text-pink-400",
  "text-orange-400",
  "text-cyan-400",
  "text-rose-400",
];

const getIconColor = (index: number) => iconColors[index % iconColors.length];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();
  
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedGroups));
    } catch (error) {
      console.error("Failed to save sidebar state:", error);
    }
  }, [collapsedGroups]);

  const highestRole = getHighestRole(user);
  
  const roleMapping: Record<string, UserRole> = {
    'system_admin': 'admin',
    'superadmin': 'admin', 
    'super_admin': 'admin',
    'admin': 'admin',
    'content_manager': 'editor',
    'chief_editor': 'editor',
    'publisher': 'editor',
    'editor': 'editor',
    'writer': 'author',
    'content_creator': 'author',
    'author': 'author',
    'reporter': 'reporter',
    'opinion_author': 'opinion_author',
    'moderator': 'reviewer',
    'comments_moderator': 'comments_moderator',
    'analyst': 'analyst',
    'advertiser': 'advertiser',
    'reviewer': 'reviewer',
    'reader': 'guest',
  };
  
  const mappedRole = roleMapping[highestRole];
  const role: UserRole = mappedRole || 'guest';
  
  const flags = useMemo(() => ({
    aiDeepAnalysis: false,
    smartThemes: true,
    audioSummaries: false,
  }), []);
  
  const { treeFiltered, activeItem } = useNav({ 
    role, 
    flags,
    pathname: location,
    permissions: user?.permissions || [],
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center" dir="rtl" data-testid="loading-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

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

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      'admin': 'مدير النظام',
      'editor': 'رئيس التحرير',
      'author': 'كاتب',
      'reporter': 'مراسل',
      'reviewer': 'مراجع',
      'analyst': 'محلل',
    };
    return labels[role || ''] || 'مستخدم';
  };

  const renderNavItem = (item: NavItem, itemIndex: number) => {
    const Icon = item.icon;
    const isActive = activeItem?.id === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const iconColorClass = getIconColor(itemIndex);

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
                className="w-full text-gray-200 hover:text-white hover:bg-white/10"
                data-testid={`nav-item-${item.id}`}
              >
                <span className="flex items-center gap-3 flex-1">
                  {Icon ? (
                    <Icon className={`h-5 w-5 ${iconColorClass}`} />
                  ) : (
                    <Star className={`h-4 w-4 ${iconColorClass}`} />
                  )}
                  <span>{item.labelAr || item.labelKey}</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children?.map((child, childIndex) => {
                  const ChildIcon = child.icon;
                  const isChildActive = activeItem?.id === child.id;
                  const childIconColor = getIconColor(itemIndex + childIndex + 1);
                  
                  return (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isChildActive}
                        className={`text-gray-300 hover:text-white hover:bg-white/10 ${isChildActive ? 'bg-white/15 text-white' : ''}`}
                        data-testid={`nav-subitem-${child.id}`}
                      >
                        <Link 
                          href={child.path || "#"}
                          onClick={() => handleNavClick(child)}
                        >
                          <span className="flex items-center gap-3">
                            {ChildIcon ? (
                              <ChildIcon className={`h-4 w-4 ${childIconColor}`} />
                            ) : (
                              <Star className={`h-3 w-3 ${childIconColor}`} />
                            )}
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
          className={`text-gray-200 hover:text-white hover:bg-white/10 ${isActive ? 'bg-white/15 text-white' : ''}`}
          data-testid={`nav-item-${item.id}`}
        >
          <Link 
            href={item.path || "#"}
            onClick={() => handleNavClick(item)}
          >
            <span className="flex items-center gap-3">
              {Icon ? (
                <Icon className={`h-5 w-5 ${iconColorClass}`} />
              ) : (
                <Star className={`h-4 w-4 ${iconColorClass}`} />
              )}
              <span>{item.labelAr || item.labelKey}</span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const navGroups: { label: string; items: NavItem[] }[] = [];
  let currentGroup: NavItem[] = [];
  let currentLabel = "الرئيسية";
  let groupCounter = 0;

  treeFiltered.forEach((item) => {
    if (item.divider && currentGroup.length > 0) {
      navGroups.push({ label: currentLabel, items: currentGroup });
      currentGroup = [item];
      groupCounter++;
      currentLabel = groupCounter === 1 ? "بوابة الموظف" : groupCounter === 2 ? "المهام والمشاريع" : `قسم ${groupCounter + 1}`;
    } else {
      currentGroup.push(item);
    }
  });

  if (currentGroup.length > 0) {
    navGroups.push({ label: currentLabel, items: currentGroup });
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full" dir="rtl" data-testid="dashboard-layout">
        <Sidebar 
          side="right" 
          collapsible="offcanvas"
          className="bg-gradient-to-b from-[#1a1f37] via-[#1e2444] to-[#252b52] border-l-0"
          data-testid="sidebar"
        >
          <SidebarHeader className="p-4 border-b border-white/10" data-testid="sidebar-header">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" data-testid="sidebar-logo">
                <img 
                  src="/attached_assets/sabq-logo.png" 
                  alt="سبق" 
                  className="h-7 w-auto object-contain filter brightness-0 invert"
                  data-testid="img-sabq-logo"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" data-testid="sidebar-title">سبق</h1>
                <p className="text-xs text-gray-400" data-testid="sidebar-subtitle">منصة سبق الإلكترونية</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            {navGroups.map((group, groupIndex) => (
              <SidebarGroup key={groupIndex} className={groupIndex > 0 ? "mt-4" : ""}>
                <SidebarGroupLabel 
                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2"
                  data-testid={`section-label-${groupIndex}`}
                >
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item, itemIndex) => renderNavItem(item, groupIndex * 10 + itemIndex))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10" data-testid="sidebar-footer">
            <div className="p-4 space-y-3">
              <div 
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                data-testid="user-profile-section"
              >
                <Avatar className="h-10 w-10 border-2 border-white/20" data-testid="user-avatar">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {getInitials(user?.firstName, user?.lastName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate" data-testid="user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate" data-testid="user-role">
                    {getRoleLabel(user?.role)}
                  </p>
                </div>
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
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
          <header className="flex h-16 items-center gap-4 border-b px-4 md:px-6" data-testid="main-header">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <NotificationBell data-testid="notification-bell" />
            <Button
              variant="outline"
              size="icon"
              asChild
              data-testid="button-view-site"
            >
              <Link href="/" target="_blank">
                <Globe className="h-5 w-5" />
                <span className="sr-only">عرض الموقع</span>
              </Link>
            </Button>
            <ThemeToggle data-testid="theme-toggle" />
          </header>
          
          <InternalAnnouncement data-testid="internal-announcement" />
          <AutoPublishBanner data-testid="auto-publish-banner" />
          
          <main className="flex-1 overflow-auto p-4 md:p-6" data-testid="main-content">
            <AppBreadcrumbs role={role} flags={flags} />
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
