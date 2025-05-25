// Import necessary libraries and components
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar'; // Provides context for sidebar behavior
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Dropdown UI components
import { Button } from "@/components/ui/button"; // Custom button component
import { useNavigate } from 'react-router-dom'; // For navigation
import axios from 'axios'; // For making HTTP requests
// Get base API URL from environment variables or fallback to "api"
const baseURL = import.meta.env.VITE_API_URL || "api";

// Define the props type for the layout component
interface DashboardLayoutProps {
    children: React.ReactNode; // Will render the page content inside layout
}

// Layout component for product pages with sidebar and top nav
export const AdminLayout = ({ children }: DashboardLayoutProps) => {
    const navigate = useNavigate(); // Hook to navigate programmatically
    const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar toggle state

    // Interface for the shape of merchant details
    interface NotifDetails {
        notifications: { id: string; message: string; date: Date; read: boolean }[];
    }

    // State to store merchant data including notifications
    const [merchantDetails, setMerchantDetails] = useState<NotifDetails>({ notifications: [] });

    // Fetch user details once when component mounts
    useEffect(() => {
        getUserDetails();
    }, []);

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
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-vendor-100">
                {/* Main content area (everything next to the sidebar) */}
                <div className="flex-1 flex flex-col min-h-screen">
                    {/* Top Navigation Bar */}
                    <div className="bg-white shadow-md px-4 flex justify-between items-center">
                        <h2 className="text-2xl font-bold mb-6 text-gray-700 text-center">Admin Dashboard</h2>
                        <div className="flex items-center gap-4">
                            {/* Account Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <span className="cursor-pointer text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100">
                                        Account
                                    </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
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
                    <main className="flex-1 p-6">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
};
