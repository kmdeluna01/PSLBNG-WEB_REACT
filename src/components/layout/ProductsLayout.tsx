import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Card, CardContent } from '@mui/material';
import { format } from "date-fns";
import MerchantDetails from '@/pages/Profile';

const baseURL = import.meta.env.VITE_API_URL || "api";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const ProductsLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  interface MerchantDetails {
    notifications: { id: string; message: string; date: Date; read: boolean }[];
  }

  const [merchantDetails, setMerchantDetails] = useState<MerchantDetails>({ notifications: [] });
  const unreadCount = merchantDetails.notifications.filter(notification => !notification.read).length;

  useEffect(() => {
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    const vendorId = localStorage.getItem("vendorId");

    if (vendorId) {
      try {
        const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
        setMerchantDetails(res.data.data)
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  };

  const handleProfile = () => {
    navigate("/merchant/details");
  };

  const handleSettings = () => {
    navigate("/merchant/security-settings");
  };

  const handleNotification = async () => {
    const vendorId = localStorage.getItem("vendorId");

    if (vendorId) {
      try {
        await axios.put(`${baseURL}/merchant/${vendorId}/read-notifications`);
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("isMerchantAuth");
    localStorage.removeItem("uploadedProducts");
    localStorage.removeItem("token");
    navigate("/");
  };


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
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="bg-white shadow-md p-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-700">Welcome!</h1>
            <div className="flex items-center gap-4">
              <DropdownMenu onOpenChange={(isOpen) => isOpen && handleNotification()}>
                <DropdownMenuTrigger>
                  <span className="relative cursor-pointer p-2 rounded-full hover:bg-gray-200">
                    <Bell className="h-6 w-6 text-gray-600" />

                    {/* Notification Badge (only show if count > 0) */}
                    {unreadCount > 0 && (
                      <span className="absolute top-6 left-1 transform translate-x-1 -translate-y-1 flex items-center justify-center bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-full p-2 shadow-lg bg-white rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 px-2 py-1">Notifications</h3>
                  <ScrollArea className="max-h-[75vh] overflow-y-auto"> {/* Ensure scrolling works */}
                    {merchantDetails.notifications.length > 0 ? (
                      merchantDetails.notifications
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((notification, index) => (
                        <DropdownMenuItem key={notification.id || index} className="p-2">
                          <Card className={`w-full ${notification.read ? "bg-gray-100" : ""} rounded-md`}>
                            <CardContent className="p-3">
                              <div className="flex flex-col justify-between items-start">
                                <p className="text-sm text-gray-800">{notification.message}</p>
                                <span className="text-xs text-gray-500">{format(new Date(notification.date), "MMM dd, yyyy • hh:mm a")}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="text-center text-gray-500">
                        No notifications
                      </DropdownMenuItem>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="cursor-pointer text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100">
                    Account
                  </span>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleProfile}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettings}>Settings</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 hover:bg-red-100 focus:bg-red-100" onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main Page Content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
