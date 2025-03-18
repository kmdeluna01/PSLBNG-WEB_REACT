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
import {
  Package,
  ShoppingCart,
  ChartArea,
  LayoutDashboardIcon,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "api";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation(); // Get current path
  const [orderAlert, setOrderAlert] = useState(false);
  const [incomingOrders, setIncomingOrders] = useState(0);

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboardIcon, path: "/merchant/" },
    { title: "Products", icon: Package, path: "/merchant/products" },
    { title: "Orders", icon: ShoppingCart, path: "/merchant/orders", hasAlert: orderAlert },
    { title: "Sales", icon: ChartArea, path: "/merchant/sales" },
  ];

  useEffect(() => {
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) return;

    try {
      const response = await axios.get(`${baseURL}/merchant/${vendorId}/orders/pending`);
      const fetchedOrders = response.data;
      const incomingOrdersCount = fetchedOrders.filter(order => order.status === "incoming").length;
      setIncomingOrders(incomingOrdersCount);

      const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
      const profileDetails = res.data.data;

      setOrderAlert(profileDetails?.ordersAlert || false);
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  return (
    <Sidebar className="sticky top-0 h-screen">
      <SidebarContent className="flex flex-col h-full overflow-y-auto">
        <div className="p-6">
          <img src={logo} alt="PSLBNG Logo" className="h-auto" />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path; // Check if active

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild onClick={() => navigate(item.path)}>
                      <button
                        className={`w-full flex items-center px-4 py-2 rounded-md transition-colors ${
                          isActive
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

export default AppSidebar;
