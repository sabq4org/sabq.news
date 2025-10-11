import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Rss,
  Users,
  PlusCircle,
  Shield,
  Palette,
  LogOut,
} from "lucide-react";
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
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth({ redirectToLogin: true });
  const { toast } = useToast();

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

  const menuItems = [
    {
      title: "نظرة عامة",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "مقالاتي",
      icon: FileText,
      href: "/dashboard/articles",
    },
    {
      title: "مقال جديد",
      icon: PlusCircle,
      href: "/dashboard/articles/new",
    },
    {
      title: "التصنيفات",
      icon: FolderOpen,
      href: "/dashboard/categories",
      adminOnly: true,
    },
    {
      title: "مصادر RSS",
      icon: Rss,
      href: "/dashboard/rss-feeds",
      adminOnly: true,
    },
    {
      title: "المستخدمون",
      icon: Users,
      href: "/dashboard/users",
      adminOnly: true,
    },
    {
      title: "الأدوار والصلاحيات",
      icon: Shield,
      href: "/dashboard/roles",
      adminOnly: true,
    },
    {
      title: "إدارة الثيمات",
      icon: Palette,
      href: "/dashboard/themes",
      adminOnly: true,
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly) {
      return user?.role === "admin";
    }
    return true;
  });

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'س';
  };

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
                <SidebarMenu>
                  {filteredMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <span className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.title}</span>
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
                    {user?.email}
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
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
