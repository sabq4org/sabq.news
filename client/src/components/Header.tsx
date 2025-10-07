import { Search, Menu, User, LogOut, LayoutDashboard, X, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/Artboard 5@3x-8_1759572465922.png";
import type { Category } from "@shared/schema";

interface HeaderProps {
  user?: { name?: string; email?: string; role?: string; profileImageUrl?: string };
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
}

export function Header({ user, onSearch, onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

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

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'س';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo and brand */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-2 py-2 cursor-pointer" data-testid="link-home">
                <img 
                  src={logoImage} 
                  alt="سبق - SABQ" 
                  className="h-10 w-auto object-contain"
                />
              </span>
            </Link>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث في الأخبار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10"
                data-testid="input-search"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover-elevate active-elevate-2"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <ThemeToggle />

            {user && <NotificationBell />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="gap-2 hover-elevate active-elevate-2"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.name || user.email} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block">{user.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {(user.role === "editor" || user.role === "admin") && (
                    <>
                      <DropdownMenuItem asChild>
                        <a href="/dashboard" className="flex w-full items-center cursor-pointer" data-testid="link-dashboard">
                          <LayoutDashboard className="ml-2 h-4 w-4" />
                          لوحة التحكم
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/profile" className="flex w-full items-center cursor-pointer" data-testid="link-profile">
                      <User className="ml-2 h-4 w-4" />
                      الملف الشخصي
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/notification-settings" className="flex w-full items-center cursor-pointer" data-testid="link-notification-settings">
                      <Bell className="ml-2 h-4 w-4" />
                      إعدادات الإشعارات
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex w-full items-center cursor-pointer" 
                    data-testid="link-logout"
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild data-testid="button-login" className="gap-2">
                <a href="/login">
                  <User className="h-5 w-5 sm:hidden" />
                  <span className="hidden sm:inline-block">تسجيل الدخول</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث في الأخبار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10"
              data-testid="input-search-mobile"
            />
          </div>
        </form>

        {/* Categories bar - Desktop only */}
        {categories.length > 0 && (
          <div className="hidden md:flex items-center gap-4 pb-3 overflow-x-auto">
            <Link href="/">
              <span className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap cursor-pointer" data-testid="link-category-all">
                الكل
              </span>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <span className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap cursor-pointer" data-testid={`link-category-${category.slug}`}>
                  {category.nameAr}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile menu sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px]">
          <SheetHeader>
            <SheetTitle className="text-right">التصنيفات</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1">
            <Link href="/">
              <span
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-category-all"
              >
                الكل
              </span>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <span
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-category-${category.slug}`}
                >
                  {category.nameAr}
                </span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
