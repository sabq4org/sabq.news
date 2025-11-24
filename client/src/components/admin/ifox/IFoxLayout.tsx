import { ReactNode } from "react";
import { IFoxSidebar } from "./IFoxSidebar";
import { IFoxThemeProvider } from "@/components/IFoxThemeProvider";

interface IFoxLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

/**
 * RTL-aware layout wrapper for iFox admin pages
 * Ensures sidebar appears on the right side for Arabic interface
 * Applies OKLCH-based modern SaaS theme
 */
export function IFoxLayout({ children, showSidebar = true }: IFoxLayoutProps) {
  return (
    <IFoxThemeProvider>
      <div 
        className="flex flex-row-reverse h-screen bg-background text-foreground" 
        dir="rtl"
      >
        {/* Sidebar on the right (first in flex-row-reverse) */}
        {showSidebar && <IFoxSidebar className="hidden lg:block" />}
        
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </IFoxThemeProvider>
  );
}
