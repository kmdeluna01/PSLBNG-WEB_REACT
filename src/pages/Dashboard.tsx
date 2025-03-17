import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

const demoMonthlySales = [
    { month: "Jan", totalSales: 500 },
    { month: "Feb", totalSales: 700 },
    { month: "Mar", totalSales: 650 },
    { month: "Apr", totalSales: 800 },
    { month: "May", totalSales: 900 },
    { month: "Jun", totalSales: 1200 },
    { month: "Jul", totalSales: 1000 },
    { month: "Aug", totalSales: 1100 },
    { month: "Sep", totalSales: 950 },
    { month: "Oct", totalSales: 1150 },
    { month: "Nov", totalSales: 1250 },
    { month: "Dec", totalSales: 1400 },
];

export default function Dashboard() {
    const [monthlySales, setMonthlySales] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [canceledOrders, setCanceledOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("delivered");

    const vendorId = localStorage.getItem("vendorId");

    useEffect(() => {
        fetchSalesData();
        fetchDeliveredOrders();
    }, [vendorId]);

    const getUserDetails = async (userId) => {
        try {
            if (userId) {
                const res = await axios.get(`${baseURL}/profile/buyer/${userId}`);
                const profileDetails = res.data.data;
                if (res.status !== 200) {
                    throw new Error("Unexpected response");
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchSalesData = async () => {
        try {
            const res = await axios.get(`${baseURL}/merchant/${vendorId}/monthly-sales`);
            setMonthlySales(res.data.sales);
        } catch (error) {
            console.error("Error fetching sales data: ", error);
        }
    };

    const fetchDeliveredOrders = async () => {
        try {
            const res = await axios.get(`${baseURL}/merchant/${vendorId}/orders/pending`);
            const deliveredOrders = res.data.filter(order => order.status === "delivered");
            const canceledOrders = res.data.filter(order => order.status === "canceled");

            console.log(deliveredOrders)
            setDeliveredOrders(deliveredOrders);
            setCanceledOrders(canceledOrders)
        } catch (error) {
            console.error("Error fetching delivered orders: ", error);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            </div>
            {/* Monthly Sales Graph */}
            <Card className="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-700">Monthly Sales (Demo)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={demoMonthlySales}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="totalSales" stroke="#4F46E5" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Orders History Table */}
            <Card className="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg text-gray-700">Orders History</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Tab Buttons */}
                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        className={`px-4 py-2 text-sm font-semibold ${activeTab === "delivered" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                        onClick={() => setActiveTab("delivered")}
                    >
                        Delivered Orders
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-semibold ${activeTab === "canceled" ? "border-b-2 border-red-500 text-red-600" : "text-gray-500"}`}
                        onClick={() => setActiveTab("canceled")}
                    >
                        Canceled Orders
                    </button>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">Order #</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Mode of Payment</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Customer Email</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Customer Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeTab === "delivered" ? deliveredOrders : canceledOrders).length > 0 ? (
                                (activeTab === "delivered" ? deliveredOrders : canceledOrders).map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2">{order.orderNum}</td>
                                        <td className="border border-gray-300 px-4 py-2">₱{order.items.reduce((total, item) => total + (item.product_id?.price || 0) * item.quantity, 0)}</td>
                                        <td className="border border-gray-300 px-4 py-2">{order.paymentMode}</td>
                                        <td className="border border-gray-300 px-4 py-2">{order.userId?.email || "N/A"}</td>
                                        <td className="border border-gray-300 px-4 py-2">{order.userId?.number || "N/A"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                                        No {activeTab} orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
        </div>
    );
}
