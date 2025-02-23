import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Bell, ShoppingBag, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const ProductsLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-vendor-100">
        {/* Sidebar toggle button for small screens */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Sidebar - Visible on large screens, toggle on small screens */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} lg:hidden`} onClick={() => setSidebarOpen(false)}></div>
        <div className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform lg:relative lg:translate-x-0 lg:block`}> 
          <AppSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 border-b bg-white/50 backdrop-blur-sm flex items-center justify-between px-6">
            <h1 className="text-2xl font-semibold text-vendor-800">Pasalubong</h1>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuItem>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>New order received</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
