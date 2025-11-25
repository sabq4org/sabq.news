import { ReactNode, useState } from "react";
import { OmqSidebar } from "./OmqSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface OmqLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function OmqLayout({ children, showSidebar = true }: OmqLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div 
      className="flex flex-row-reverse h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" 
      dir="rtl"
    >
      {showSidebar && <OmqSidebar className="hidden lg:flex" />}
      
      <AnimatePresence>
        {showSidebar && isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
              data-testid="sidebar-overlay"
            />
            
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full z-50 lg:hidden"
            >
              <OmqSidebar 
                className="h-full" 
                onClose={() => setIsMobileSidebarOpen(false)}
                isMobile={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {showSidebar && (
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              data-testid="button-mobile-menu"
            >
              {isMobileSidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
            
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              عمق - التحليل العميق
            </h1>
            
            <div className="w-10" />
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
