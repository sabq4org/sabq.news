import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Users, FileCheck, BarChart3, Globe } from "lucide-react";
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
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminPublishersLayoutProps {
  children: ReactNode;
}

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}

const navItems: NavItem[] = [
  {
    id: "publishers-list",
    href: "/dashboard/admin/publishers",
    label: "قائمة الناشرين",
    icon: Users,
    testId: "nav-publishers",
  },
  {
    id: "publishers-articles",
    href: "/dashboard/admin/publishers/articles",
    label: "مراجعة المقالات",
    icon: FileCheck,
    testId: "nav-review-articles",
  },
  {
    id: "publishers-analytics",
    href: "/dashboard/admin/publishers/analytics",
    label: "التحليلات والإحصائيات",
    icon: BarChart3,
    testId: "nav-analytics",
  },
];

export function AdminPublishersLayout({ children }: AdminPublishersLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

  // Loading state
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
    return 'م';
  };

  const isActive = (href: string) => {
    if (href === "/dashboard/admin/publishers") {
      // Also activate for detail pages like /dashboard/admin/publishers/:id
      return location === href || location === "/dashboard/admin/publishers/" || 
             (location.startsWith("/dashboard/admin/publishers/") && 
              !location.includes("/articles") && 
              !location.includes("/analytics"));
    }
    return location.startsWith(href);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full" dir="rtl">
        <Sidebar side="right" collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold mb-4">
                <div className="flex items-center gap-2">
                  <img 
                    src="/attached_assets/sabq-logo.png" 
                    alt="سبق" 
                    className="h-8 w-auto object-contain"
                    data-testid="img-sabq-logo"
                  />
                  <span>الناشرون والوكالات</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <span className="flex items-center gap-3">
                              <Icon className="h-5 w-5" />
                              <span>{item.label}</span>
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
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
                    مدير النظام
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
          <header className="flex h-16 items-center gap-4 border-b px-4 md:px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <NotificationBell />
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
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
