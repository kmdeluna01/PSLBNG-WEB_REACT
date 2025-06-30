// Importing custom UI components for building the sidebar layout
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Importing icons to use in the sidebar menu
import {
  Package,
  ShoppingCart,
  ChartArea,
  LayoutDashboardIcon,
} from "lucide-react";

// React Router hooks for navigation and getting the current route
import { useNavigate, useLocation } from "react-router-dom";

// React hooks for state management and side effects
import { useEffect, useState } from "react";

// Logo image for the sidebar
import logo from "../../assets/logo.png";

// Axios for making HTTP requests
import axios from "axios";

// Get base API URL from environment variable or default to 'api'
const baseURL = import.meta.env.VITE_API_URL || "api";

// Sidebar component definition
export function AppSidebar({ closeSidebar }: { closeSidebar?: () => void }) {
  const navigate = useNavigate(); // Hook to programmatically navigate to routes
  const location = useLocation(); // Hook to get the current route path

  // State to show/hide order alert badge
  const [orderAlert, setOrderAlert] = useState(false);

  // State to store how many incoming orders there are
  const [incomingOrders, setIncomingOrders] = useState(0);

  // List of menu items for the sidebar, including title, icon, and path
  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboardIcon, path: "/merchant/" },
    { title: "Products", icon: Package, path: "/merchant/products" },
    { title: "Orders", icon: ShoppingCart, path: "/merchant/orders", hasAlert: orderAlert },
    { title: "Sales", icon: ChartArea, path: "/merchant/sales" },
  ];

  // useEffect to run `getUserDetails` once when the component mounts
  useEffect(() => {
    getUserDetails();
  }, []);

  // Fetches user-related data: pending orders and profile info
  const getUserDetails = async () => {
    const vendorId = localStorage.getItem("vendorId"); // Get vendor ID from local storage

    if (!vendorId) return; // Exit if no vendor ID found

    try {
      // Get all pending orders for the vendor
      const response = await axios.get(`${baseURL}/merchant/${vendorId}/orders/pending`);
      const fetchedOrders = response.data;

      // Count how many of the pending orders have status "incoming"
      const incomingOrdersCount = fetchedOrders.filter(order => order.status === "incoming").length;

      setIncomingOrders(incomingOrdersCount); // Update state with the count

      // Get the merchant profile to see if alerts should be shown
      const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
      const profileDetails = res.data.data;

      // Set alert state based on profile
      setOrderAlert(profileDetails?.ordersAlert || false);
    } catch (error) {
      console.error("Error fetching user data: ", error); // Log any errors
    }
  };

  // Render the sidebar
  return (
    <Sidebar className="flex flex-col w-64 h-screen bg-white shadow-lg lg:sticky lg:top-0">
      <SidebarContent className="flex-1 flex flex-col items-start justify-start overflow-y-auto px-2 py-6">
        <div className="flex justify-center items-center">
          <img src={logo} alt="PSLBNG Logo" className="px-3 h-20 w-auto" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      onClick={() => {
                        navigate(item.path);
                        closeSidebar?.();
                      }}
                    >
                      <button
                        className={`w-full flex items-center px-4 py-2 rounded-md transition-colors ${isActive
                            ? "bg-green-100 text-green-700 font-bold"
                            : "text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-4 w-4" />
                          <span>{item.title}</span>
                        </div>

                        {item.hasAlert && incomingOrders > 0 && (
                          <span className="ml-2 flex items-center justify-center bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full">
                            {incomingOrders}
                          </span>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

}

// Export the component to be used in other parts of the app
export default AppSidebar;
