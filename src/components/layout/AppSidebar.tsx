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
  User,
  Settings,
  LogOut,
  ChartArea
} from "lucide-react";
import { useNavigate, } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "api";

export function AppSidebar() {
  const navigate = useNavigate();
  const [orderAlert, setOrderAlert] = useState(false);

  const menuItems = [
    { title: "Products", icon: Package, path: "/merchant" },
    { title: "Orders", icon: ShoppingCart, path: "/merchant/orders" , hasAlert: orderAlert },
    { title: "Sales", icon: ChartArea, path: "/merchant/sales" },
    { title: "Profile", icon: User, path: "/merchant/details" },
    { title: "Settings", icon: Settings, path: "/merchant/security-settings" },
  ];

  useEffect(() => {
      getUserDetails();
  }, []);

  const getUserDetails = async () => {
    const vendorId = localStorage.getItem("vendorId");

    if (vendorId) {
      try {
        const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
        const profileDetails = res.data.data;

        setOrderAlert(profileDetails.ordersAlert);
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  };

  const logOut = () => {
    localStorage.removeItem('isMerchantAuth');
    localStorage.removeItem('uploadedProducts');
    localStorage.removeItem('token');
    navigate("/");
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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={() => navigate(item.path)}>
                  <button className="w-full flex items-center">
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.hasAlert && (
                        <span className="text-xs text-red-600 font-bold ml-2">
                          New Order
                        </span>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <div className="mt-auto py-6">
                <button
                  className="sticky w-full flex items-center text-red-600 hover:text-red-800 transition-colors p-2"
                  onClick={logOut}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
