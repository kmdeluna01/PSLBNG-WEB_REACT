import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { products } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const baseURL = import.meta.env.VITE_API_URL || '';

export default function SalesDashboard() {
  const [totalSales, setTotalSales] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const { toast } = useToast();
  const vendorId = localStorage.getItem("vendorId");

  const fetchSalesData = async () => {
    try {
      const res = await axios.get(`${baseURL}/merchant/${vendorId}/sales-summary`);
      const { totalSales, topProducts, lowStock, revenue, profit } = res.data;

      setTotalSales(totalSales);
      setTopProducts(topProducts);
      setLowStockAlerts(lowStock);
      setRevenue(revenue);
      setProfit(profit);
    } catch (error) {
      console.error("Error fetching sales data: ", error);
      toast({ title: "Error", description: "Failed to fetch sales data", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [vendorId]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-vendor-800">Sales Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₱{totalSales.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₱{revenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₱{profit.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockAlerts.length ? (
              <ul className="space-y-2">
                {lowStockAlerts.map((product) => (
                  <li key={product._id} className="text-red-500">
                    {product.productName} - {product.quantity} left
                  </li>
                ))}
              </ul>
            ) : (
              <p>No low stock products</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topProducts.map((product) => (
                <li key={product._id} className="flex justify-between">
                  <span>{product.productName}</span>
                  <span>{product.sales} sales</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}