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
    <div className="p-6 space-y-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800">📊 Sales</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold">{totalSales.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-400 text-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold">₱{revenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-md bg-gradient-to-r from-yellow-500 to-yellow-400 text-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold">₱{profit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
            {[...topProducts]
              .sort((a, b) => b.sold - a.sold)
              .map((product) => (
                <li key={product._id} className="flex justify-between text-gray-600">
                  <span>{product.productName}</span>
                  <span className="font-semibold">{product.sold} sold</span>
                </li>
              ))
            }
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockAlerts.length ? (
              <ul className="space-y-4">
                {lowStockAlerts.map((product) => (
                  <li key={product._id} className="text-red-500 font-semibold">
                    {product.productName} - {product.quantity} left
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No low stock products</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

  );
}