import { ReactNode } from "react";
import { IFoxSidebar } from "./IFoxSidebar";

interface IFoxLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

/**
 * RTL-aware layout wrapper for iFox admin pages
 * Ensures sidebar appears on the right side for Arabic interface
 */
export function IFoxLayout({ children, showSidebar = true }: IFoxLayoutProps) {
  return (
    <div 
      className="flex flex-row-reverse h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950" 
      dir="rtl"
    >
      {/* Sidebar on the right (first in flex-row-reverse) */}
      {showSidebar && <IFoxSidebar className="hidden lg:block" />}
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
