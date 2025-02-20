
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Circle, CheckCircle } from "lucide-react";

const statsCards = [
  {
    title: "Total Products",
    value: "24",
    icon: Package,
    description: "Active products in your store",
  },
  {
    title: "Pending Orders",
    value: "12",
    icon: Circle,
    description: "Orders waiting to be processed",
  },
  {
    title: "Processing Orders",
    value: "5",
    icon: ShoppingCart,
    description: "Orders currently being prepared",
  },
  {
    title: "Completed Orders",
    value: "156",
    icon: CheckCircle,
    description: "Successfully fulfilled orders",
  },
];

const Index = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-vendor-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-vendor-600 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-vendor-600">Orders will appear here</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-vendor-600">Products will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
