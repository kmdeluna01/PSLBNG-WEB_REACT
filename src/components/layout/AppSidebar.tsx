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
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const menuItems = [
  { title: "Products", icon: Package, path: "/merchant" },
  { title: "Orders", icon: ShoppingCart, path: "/merchant/orders" },
  { title: "Profile", icon: User, path: "/merchant/details" },
  { title: "Settings", icon: Settings, path: "/merchant/security-settings" },
  { title: "Sales", icon: ChartArea, path: "/merchant/sales" },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const logOut = () => {
    localStorage.removeItem('isMerchantAuth');
    localStorage.removeItem('uploadedProducts');
    localStorage.removeItem('token');
    navigate("/");
  };

  return (
    <Sidebar className="sticky top-0 h-screen">
      <SidebarContent>
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
                      <item.icon className="mr-3 h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-4">
          <button
            className="w-full flex items-center text-vendor-600 hover:text-vendor-800 transition-colors p-2"
            onClick={logOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
