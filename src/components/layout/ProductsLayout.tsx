// Import necessary libraries and components
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar'; // Provides context for sidebar behavior
import { AppSidebar } from '@/components/layout/AppSidebar'; // Sidebar component
import { Bell, ShoppingBag, Menu } from 'lucide-react'; // Icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Dropdown UI components
import { Button } from "@/components/ui/button"; // Custom button component
import { useNavigate } from 'react-router-dom'; // For navigation
import axios from 'axios'; // For making HTTP requests
import { ScrollArea } from '@radix-ui/react-scroll-area'; // Scrollable area for notifications
import { Card, CardContent } from '@mui/material'; // Material UI card components
import { format } from "date-fns"; // To format notification date/time
import { Link } from "react-router-dom"; // For linking to other pages

// Get base API URL from environment variables or fallback to "api"
const baseURL = import.meta.env.VITE_API_URL || "api";

// Define the props type for the layout component
interface DashboardLayoutProps {
  children: React.ReactNode; // Will render the page content inside layout
}

// Layout component for product pages with sidebar and top nav
export const ProductsLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate(); // Hook to navigate programmatically
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar toggle state

  // Interface for the shape of merchant details
  interface MerchantDetails {
    notifications: { id: string; message: string; date: Date; read: boolean }[];
    verified?: boolean;
  }

  // State to store merchant data including notifications
  const [merchantDetails, setMerchantDetails] = useState<MerchantDetails>({ notifications: [] });

  // Count unread notifications
  const unreadCount = merchantDetails.notifications.filter(notification => !notification.read).length;

  // Fetch user details once when component mounts
  useEffect(() => {
    getUserDetails();
  }, []);

  useEffect(() => {
  if (sidebarOpen) {
    document.body.classList.add("overflow-hidden");
  } else {
    document.body.classList.remove("overflow-hidden");
  }

  // Cleanup on unmount
  return () => {
    document.body.classList.remove("overflow-hidden");
  };
}, [sidebarOpen]);


  // Fetch merchant profile and update state
  const getUserDetails = async () => {
    const vendorId = localStorage.getItem("vendorId");
    if (vendorId) {
      try {
        const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
        setMerchantDetails(res.data.data); // Store notifications and other details
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  };

  // Handlers for navigating to different merchant pages
  const handleProfile = () => {
    navigate("/merchant/details");
  };

  const handleSettings = () => {
    navigate("/merchant/security-settings");
  };

  // Mark notifications as read when dropdown opens
  const handleNotification = async () => {
    const vendorId = localStorage.getItem("vendorId");
    if (vendorId) {
      try {
        await axios.put(`${baseURL}/merchant/${vendorId}/read-notifications`);
      } catch (error) {
        console.error("Error updating notifications: ", error);
      }
    }
  };

  // Logout function clears auth and redirects to home page
  const handleLogout = () => {
    localStorage.removeItem("isMerchantAuth");
    localStorage.removeItem("uploadedProducts");
    localStorage.removeItem("token");
    navigate("/");
  };

  // Add merchant verification status
  const isVerified = merchantDetails.verified !== false;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col lg:flex-row w-full bg-vendor-100">
        {/* Mobile Menu Button - shown on small screens */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Overlay for mobile sidebar - darkens background when sidebar is open */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } lg:hidden`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar itself - slides in/out on mobile, always visible on desktop */}
        <div
          className={`w-64 fixed top-0 left-0 h-full bg-white shadow-lg z-50 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:block`}
        >
          <AppSidebar closeSidebar={() => setSidebarOpen(false)} />
        </div>

        {/* Main content area (everything next to the sidebar) */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Navigation Bar */}
          <div className="bg-white shadow-md px-4 flex justify-end sticky top-0 z-30 items-center">
            <div className="flex items-center gap-4">
              {/* Show warning if merchant is not verified, or verified label if verified */}
              {!isVerified ? (
                <>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-semibold mr-2">
                    Account not verified
                  </span>
                  <Button
                    size="sm"
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={() => navigate("/merchant/details")}
                  >
                    Get Verified
                  </Button>
                </>
              ) : (
                <span className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-semibold mr-2">
                  Verified
                  <svg className="ml-1 w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 00-1.414-1.414z" clipRule="evenodd" /></svg>
                </span>
              )}

              {/* Notification Bell with badge */}
              <DropdownMenu onOpenChange={(isOpen) => isOpen && handleNotification()}>
                <DropdownMenuTrigger>
                  <span className="relative cursor-pointer p-2 rounded-full hover:bg-gray-200">
                    <Bell className="h-6 w-6 text-gray-600" />
                    {/* Show red badge if there are unread notifications */}
                    {unreadCount > 0 && (
                      <span className="absolute top-6 left-1 transform translate-x-1 -translate-y-1 flex items-center justify-center bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </DropdownMenuTrigger>

                {/* Notification Dropdown Content */}
                <DropdownMenuContent align="end" className="w-full p-2 shadow-lg bg-white rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 px-2 py-1">Notifications</h3>

                  {/* Scrollable notification list */}
                  <ScrollArea className="max-h-[75vh] overflow-y-auto">
                    {merchantDetails.notifications.length > 0 ? (
                      merchantDetails.notifications
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
                        .map((notification, index) => (
                          <Link key={notification.id || index} to="/merchant/orders">
                            <DropdownMenuItem className="p-2 cursor-pointer">
                              <Card className={`w-full rounded-md ${!notification.read ? "bg-gray-200" : "bg-white"}`}>
                                <CardContent className="p-3">
                                  <div className="flex flex-col justify-between items-start">
                                    <p className="text-sm text-gray-800">{notification.message}</p>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(notification.date), "MMM dd, yyyy • hh:mm a")}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </DropdownMenuItem>
                          </Link>
                        ))
                    ) : (
                      <DropdownMenuItem disabled className="text-center text-gray-500">
                        No notifications
                      </DropdownMenuItem>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Account Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="cursor-pointer text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100">
                    Account
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleProfile}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettings}>Settings</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 hover:bg-red-100 focus:bg-red-100"
                    onClick={handleLogout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main content (children passed into the layout) */}
          <main className="flex-1 p-4 min-h-[calc(100vh-4rem)]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
