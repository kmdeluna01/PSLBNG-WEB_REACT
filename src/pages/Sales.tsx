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
  //console.log("Top Products: ", topProducts);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COD' | 'MAYA'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);  // Modal for delivered orders
  const [isRefreshing, setIsRefreshing] = useState(false);  // State for refreshing data
  const [productDetails, setProductDetails] = useState([]);  // State for product details
  const [userProducts, setUserProducts] = useState([]);  // State for user products
  const [loading, setLoading] = useState(true);  // Loading state for the data fetching
  const [summaryType, setSummaryType] = useState("month"); // New state for summary type
  const { toast } = useToast();  // Toast hook for notifications

  // Effect hook to fetch sales data and delivered orders whenever the vendor ID changes
  useEffect(() => {
    if (vendorId) {
      fetchSalesData();  // Fetch sales data from the API
      fetchDeliveredOrders();  // Fetch delivered orders
      getUserProducts();  // Fetch user products
    }
  }, [vendorId]);

  // Get top products and low stock alerts from userProducts
  useEffect(() => {
    if (Array.isArray(userProducts) && userProducts.length > 0) {
      // Top products: sort by totalSold (or sold) descending, take top 5
      const sorted = [...userProducts].sort((a, b) => (b.totalSold || b.sold || 0) - (a.totalSold || a.sold || 0));
      setTopProducts(sorted.slice(0, 5));
      // Low stock alerts: quantity <= 5
      setLowStockAlerts(userProducts.filter(product => product.quantity !== undefined && product.quantity <= 5));
    } else {
      setTopProducts([]);
      setLowStockAlerts([]);
    }
  }, [userProducts]);

  const fetchProductDetails = async (productIds) => {
      try {
        const productRequests = productIds.map((productId) =>
          axios.get(`${baseURL}/product-details/${productId}`) // Fetch each product's details
        );
        const responses = await Promise.all(productRequests); // Wait for all product requests to complete
        const products = responses.map((response) => response.data.data); // Extract product data
        setUserProducts(products); // Set user products in state
      } catch (error) {
        console.error("Error fetching product details: ", error); // Log error if fetching details fails
      }
    };

  const getUserProducts = async () => {
      setIsRefreshing(true); // Set refreshing state to true
      if (vendorId) {
        try {
          const res = await axios.get(`${baseURL}/merchant/${vendorId}/get-products`); // API call to fetch products
          if (res.data.data && Array.isArray(res.data.data)) {
            fetchProductDetails(res.data.data); // Fetch product details if data is an array
          } else {
            console.error("Products data is not an array:", res.data.data); // Log error if data is not an array
          }
        } catch (error) {
          console.error("Error fetching products:", error); // Log error if API request fails
        }
      }
      setIsRefreshing(false); // Set refreshing state to false
    };

  // Function to fetch sales data from the API
  const fetchSalesData = async () => {
    setLoading(true);  // Set loading to true before fetching
    try {
      const res = await axios.get(`${baseURL}/merchant/${vendorId}/sales-summary`);  // API request
      const { totalSales, topProducts, lowStock, revenue, profit } = res.data;
      console.log(res.data);  // Log the response data for debugging

      // Update the state with the fetched data
      setTotalSales(totalSales || 0);
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

  // Helper to filter delivered orders by summaryType
  const filterOrdersBySummaryType = (orders, summaryType) => {
    if (!Array.isArray(orders)) return [];
    const now = new Date();
    if (summaryType === "all") return orders;
    return orders.filter(order => {
      const date = new Date(order.createdAt);
      if (summaryType === "day") {
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
      }
      if (summaryType === "week") {
        // Get ISO week number
        const getWeek = d => {
          d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
          return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        };
        return (
          date.getFullYear() === now.getFullYear() &&
          getWeek(date) === getWeek(now)
        );
      }
      if (summaryType === "month") {
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      }
      if (summaryType === "year") {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  // Filtered delivered orders for summaryType
  const deliveredOrdersForSummary = useMemo(() => filterOrdersBySummaryType(deliveredOrders, summaryType), [deliveredOrders, summaryType]);

  // Items Sold, Revenue, Profit for summaryType
  const computedTotalSales = useMemo(() => deliveredOrdersForSummary.reduce((sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0), 0), [deliveredOrdersForSummary]);
  const computedRevenue = useMemo(() => deliveredOrdersForSummary.reduce((sum, order) => sum + order.items.reduce((s, i) => s + (i.product_id?.price || 0) * i.quantity, 0), 0), [deliveredOrdersForSummary]);
  // If you have cost/profit info, adjust this calculation as needed
  const computedProfit = useMemo(() => computedRevenue * 0.2, [computedRevenue]); // Example: 20% profit margin

  // Top selling products for summaryType
  const computedTopProducts = useMemo(() => {
    const productMap: Array<{ _id: string; productName: string; sold: number }> = [];
    const productObj: { [id: string]: { _id: string; productName: string; sold: number } } = {};
    deliveredOrdersForSummary.forEach(order => {
      order.items.forEach(item => {
        const id = item.product_id?._id || item.product_id || item._id;
        if (!productObj[id]) {
          productObj[id] = {
            _id: id,
            productName: item.product_id?.productName || item.productName || "Unknown",
            sold: 0
          };
        }
        productObj[id].sold += item.quantity;
      });
    });
    return Object.values(productObj).sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
  }, [deliveredOrdersForSummary]);

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
      <div className="flex items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
        <div>
          <select
            id="summary-type"
            value={summaryType}
            onChange={e => setSummaryType(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
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
                <p className="text-4xl font-extrabold">{computedTotalSales.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-400 text-white hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold">₱{computedRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-md bg-gradient-to-r from-yellow-500 to-yellow-400 text-white hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold">₱{computedProfit.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg text-gray-700">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {computedTopProducts.length ? (
                  <ul className="space-y-4">
                    {computedTopProducts.map((product) => (
                      <li key={product._id || product.productName} className="flex justify-between">
                        <span>{product.productName}</span>
                        <span className="font-semibold">{product.sold} sold</span>
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
