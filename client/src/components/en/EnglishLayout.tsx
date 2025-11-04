import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Newspaper, List, Gauge } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface EnglishLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function EnglishLayout({ children, showNav = true }: EnglishLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/en", label: "Home", icon: Home, testId: "nav-home" },
    { href: "/en/news", label: "News", icon: Newspaper, testId: "nav-news" },
    { href: "/en/categories", label: "Categories", icon: List, testId: "nav-categories" },
    { href: "/en/dashboard", label: "Dashboard", icon: Gauge, testId: "nav-dashboard" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/en">
              <div className="cursor-pointer">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Sabq Smart
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">English Edition</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/login">
                <Button size="sm" data-testid="button-login">Login</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {showNav && (
          <div className="border-t bg-background/50">
            <div className="container mx-auto px-4">
              <nav className="flex gap-1 overflow-x-auto py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="whitespace-nowrap gap-2"
                        data-testid={item.testId}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
