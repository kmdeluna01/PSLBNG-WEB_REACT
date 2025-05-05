import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

// Set the base URL for API requests from environment variables
const baseURL = import.meta.env.VITE_API_URL || "";

// The SalesDashboard component is the main component for displaying sales data
export default function SalesDashboard() {
  // Use state to store the vendor ID, total sales, top products, etc.
  const [vendorId, setVendorId] = useState(localStorage.getItem("vendorId") || "");
  const [totalSales, setTotalSales] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COD' | 'MAYA'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);  // Modal for delivered orders
  const [loading, setLoading] = useState(true);  // Loading state for the data fetching
  const { toast } = useToast();  // Toast hook for notifications

  // Effect hook to fetch sales data and delivered orders whenever the vendor ID changes
  useEffect(() => {
    if (vendorId) {
      fetchSalesData();  // Fetch sales data from the API
      fetchDeliveredOrders();  // Fetch delivered orders
    }
  }, [vendorId]);

  // Function to fetch sales data from the API
  const fetchSalesData = async () => {
    setLoading(true);  // Set loading to true before fetching
    try {
      const res = await axios.get(`${baseURL}/merchant/${vendorId}/sales-summary`);  // API request
      const { totalSales, topProducts, lowStock, revenue, profit } = res.data;

      // Update the state with the fetched data
      setTotalSales(totalSales || 0);
      setTopProducts(topProducts || []);
      setLowStockAlerts(lowStock || []);
      setRevenue(revenue || 0);
      setProfit(profit || 0);
    } catch (error) {
      console.error("Error fetching sales data:", error);  // Handle any errors
    } finally {
      setLoading(false);  // Set loading to false once data is fetched
    }
  };

  // Function to fetch delivered orders from the API
  const fetchDeliveredOrders = async () => {
    try {
      const response = await axios.get(`${baseURL}/merchant/${vendorId}/orders/pending`);
      const orders = response.data.filter(order => order.status === "delivered");  // Filter delivered orders
      setDeliveredOrders(orders);  // Update state with delivered orders
    } catch (error) {
      console.error("Error fetching delivered orders:", error.response?.data || error.message);  // Handle errors
    }
  };

  // Memoized function to sort top products by the number of items sold in descending order
  const sortedTopProducts = useMemo(() => {
    return [...topProducts].sort((a, b) => b.sold - a.sold);
  }, [topProducts]);

  const filteredOrders = useMemo(() => {
    if (paymentFilter === 'ALL') return deliveredOrders;
    return deliveredOrders.filter(order => order.paymentMode === paymentFilter);
  }, [deliveredOrders, paymentFilter]);

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

          <div className="mt-2">
            <label htmlFor="paymentFilter" className="mr-2 text-sm font-medium text-gray-700">
              Payment Mode:
            </label>
            <select
              id="paymentFilter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | 'COD' | 'MAYA')}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="ALL">All</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="MAYA">Maya</option>
            </select>
          </div>

          {filteredOrders.length > 0 ? (
            <ul className="space-y-4 h-full">
              {filteredOrders.map(order => (
                <div key={order._id} className="mt-4 p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Order #{order.orderNum}</h3>
                  <p className="text-sm text-gray-600">Mode of Payment: <strong>{order.paymentMode}</strong></p>
                  <p className="text-sm text-gray-600">Total Items: <strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></p>

                  {/* Grid layout for items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto mt-4">
                    {order.items.map(item => (
                      <div
                        key={item._id}
                        className="flex items-center bg-gray-100 p-3 rounded-md"
                      >
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
            <p className="text-gray-500">
              No delivered orders{paymentFilter !== 'ALL' ? ` with ${paymentFilter}` : ''}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
