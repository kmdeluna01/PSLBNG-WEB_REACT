import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const baseURL = import.meta.env.VITE_API_URL || "";

export default function SalesDashboard() {
  const [vendorId, setVendorId] = useState(localStorage.getItem("vendorId") || "");
  const [totalSales, setTotalSales] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (vendorId) {
      fetchSalesData();
      fetchDeliveredOrders();
    }
  }, [vendorId]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/merchant/${vendorId}/sales-summary`);
      const { totalSales, topProducts, lowStock, revenue, profit } = res.data;

      setTotalSales(totalSales || 0);
      setTopProducts(topProducts || []);
      setLowStockAlerts(lowStock || []);
      setRevenue(revenue || 0);
      setProfit(profit || 0);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveredOrders = async () => {
    try {
      const response = await axios.get(`${baseURL}/merchant/${vendorId}/orders/pending`);
      const orders = response.data.filter(order => order.status === "delivered");
      setDeliveredOrders(orders);
    } catch (error) {
      console.error("Error fetching delivered orders:", error.response?.data || error.message);
    }
  };

  const sortedTopProducts = useMemo(() => {
    return [...topProducts].sort((a, b) => b.sold - a.sold);
  }, [topProducts]);

  return (
    <div className="min-h-screen">
      <div className="flex items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading sales data...</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card onClick={() => setIsModalOpen(true)} className="rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:shadow-lg transition-shadow duration-300 cursor-pointer active:scale-95">
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
                {sortedTopProducts.length ? (
                  <ul className="space-y-4">
                    {sortedTopProducts.map((product) => (
                      <li key={product._id || product.productName} className="flex justify-between">
                        <span>{product.productName}</span>
                        <span className="font-semibold">{product.totalSold} sold</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No sales data available</p>
                )}
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
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[80vw] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Sold Items</DialogTitle>
          </DialogHeader>
          {deliveredOrders.length > 0 ? (
            <ul className="space-y-4 h-full">
              {deliveredOrders.map(order => (
                <div key={order._id} className="mt-4 p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Order #{order.orderNum}</h3>
                  <p className="text-sm text-gray-600">Mode of Payment: {order.paymentMode}</p>

                  {/* Loop through the items in each order */}
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                    {order.items.map(item => (
                      <div key={item._id} className="flex items-center mt-3 bg-gray-100 p-3 rounded-md">
                        <img
                          src={item.product_id?.image || 'https://dummyimage.com/150x150/cccccc/ffffff&text=No+Image'}
                          className="w-20 h-20 rounded-md object-cover"
                          alt={item.product_id?.productName || 'Product Image'}
                        />
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">{item.product_id?.productName || 'Loading...'}</h3>
                          <p className="text-sm text-gray-700">₱{item.product_id?.price || 'Loading...'}</p>
                          <p className="text-sm text-gray-700">Sold <span className="font-bold">{item.quantity} items</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No delivered orders</p>
          )}
        </DialogContent>

      </Dialog>
    </div>
  );
}
