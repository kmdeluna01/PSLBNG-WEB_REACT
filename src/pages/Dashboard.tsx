import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import axios from "axios";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet"; // Import Leaflet for heatmap
import { Skeleton } from "@/components/ui/skeleton";

// Import leaflet-heat for the heatmap layer
import "leaflet.heat";

const baseURL = import.meta.env.VITE_API_URL || "";

export default function Dashboard() {
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [canceledOrders, setCanceledOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("delivered");
    const [location, setLocation] = useState(null);
    const [heatMapData, setHeatMapData] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [townData, setTownData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedMonthData, setSelectedMonthData] = useState(null);

    const vendorId = localStorage.getItem("vendorId");

    //console.log("Monthly Revenue: ", monthlyRevenue)
    console.log("Selected Town: ", selectedMonth)
    //console.log("Selected Month Data: ", selectedMonthData)

    useEffect(() => {
        fetchSalesData();
        fetchDeliveredOrders();
        getUserDetails();
    }, [vendorId]);

    useEffect(() => {
        if (deliveredOrders.length > 0) {
            fetchGeolocationData();
        }
    }, [deliveredOrders]);

    useEffect(() => {
        if (selectedMonth) {
            const monthData = getMonthDistribution(deliveredOrders);
            setSelectedMonthData(monthData[selectedMonth] 
                ? Object.entries(monthData[selectedMonth]).map(([town, totalRevenue]) => ({ town, totalRevenue })) 
                : []
            );
        }
    }, [selectedMonth, deliveredOrders]);
    

    const handleLineChartClick = (data) => {
        if (data && data.activeLabel) {
            setSelectedMonth(data.activeLabel);
        }
    };

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const getUserDetails = async () => {
        if (vendorId) {
            try {
                const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
                const profileDetails = res.data.data;
                setLocation(profileDetails.location);
            } catch (error) {
                console.error("Error fetching user data: ", error);
            }
        }
    };

    const fetchSalesData = async () => {
        try {
            const res = await axios.get(`${baseURL}/merchant/${vendorId}/sales-summary`);
            const { monthlyRevenue } = res.data;
            setMonthlyRevenue(monthlyRevenue);
        } catch (error) {
            console.error("Error fetching sales data: ", error);
        }
    };

    const fetchDeliveredOrders = async () => {
        try {
            const res = await axios.get(`${baseURL}/merchant/${vendorId}/orders/pending`);
            const deliveredOrders = res.data.filter(order => order.status === "delivered");
            const canceledOrders = res.data.filter(order => order.status === "cancelled");
            const geocodedAddresses = deliveredOrders.map(order => order.userId.addressGeocoded);

            const newHeatmapData = deliveredOrders
                .map(order => ({
                    lat: order.userId?.address.latitude,
                    lng: order.userId?.address.longitude
                }))
                .filter(location => location.lat && location.lng);

            setAddresses(geocodedAddresses);
            setHeatMapData(newHeatmapData);
            setDeliveredOrders(deliveredOrders);
            setCanceledOrders(canceledOrders);
        } catch (error) {
            console.error("Error fetching delivered orders: ", error);
        }
    };

    const fetchGeolocationData = async () => {
        setTownData(getTownDistribution(addresses));
        setSelectedMonthData(getMonthDistribution(deliveredOrders) || []);
        setLoading(false);
    };

    const HeatmapLayer = ({ data }) => {
        const map = useMap();

        useEffect(() => {
            if (!map) return;

            const heatLayer = L.heatLayer(
                data.map(({ lat, lng }) => [lat, lng]),
                { radius: 20, blur: 15, maxZoom: 10 }
            ).addTo(map);

            return () => {
                map.removeLayer(heatLayer); // Cleanup heatmap when component unmounts
            };
        }, [map, data]);

        return null;
    };

    const getTownDistribution = (addresses) => {
        if (!addresses || addresses.length === 0) {
            return [];
        }
        const townCounts = addresses.reduce((acc, town) => {
            if (town && town !== "Unknown") {
                acc[town] = (acc[town] || 0) + 1;
            }
            return acc;
        }, {});
        return Object.entries(townCounts).map(([town, count]) => ({ town, count }));
    };

    const getMonthDistribution = (orders) => {
        if (!orders || orders.length === 0) {
            return {};
        }
    
        const monthlyData = orders.reduce((acc, order) => {
            if (!order.createdAt || !order.userId?.addressGeocoded) return acc;
    
            const date = new Date(order.createdAt);
            const month = date.toLocaleString("en-US", { month: "long" });
            const town = order.userId.addressGeocoded;
    
            const totalRevenue = order.items.reduce((sum, item) => {
                return sum + (item.product_id?.price || 0) * item.quantity;
            }, 0);
    
            if (!acc[month]) acc[month] = {};
            if (!acc[month][town]) acc[month][town] = 0;
    
            acc[month][town] += totalRevenue;
    
            return acc;
        }, {});
    
        return monthlyData;
    };
    


    return (
        <div className="min-h-screen">
            <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            </div>
            {/* Monthly Sales Graph */}
            <div className="space-y-8">
                {/* Monthly Sales Chart Card */}
                <div className="flex space-x-8">
                    {/* Monthly Sales Line Chart */}
                    <Card className="w-1/2 shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-700">Monthly Sales 2025</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full">
                                <ResponsiveContainer width="100%" height={300}>
                                    {monthlyRevenue.length > 0 ? (
                                        <LineChart data={monthlyRevenue} onClick={handleLineChartClick}>
                                            <XAxis dataKey="month" tickFormatter={(month) => month.substring(0, 3)} />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="totalRevenue"
                                                stroke="#4F46E5"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    ) : (
                                        <div className="flex justify-center items-center h-full">
                                            <p className="text-center text-gray-500">No sales data available</p>
                                        </div>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Buyer Distribution Pie Chart */}
                    <Card className="w-1/2 shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-700">
                                {selectedMonth ? `Buyer Distribution for ${selectedMonth}` : "Buyer Distribution by Town"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full">
                                {loading ? (
                                    <div className="flex justify-center items-center h-72">
                                        <Skeleton className="w-40 h-40 rounded-full bg-gray-300 animate-pulse" />
                                    </div>
                                ) : selectedMonthData && selectedMonthData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={selectedMonthData} // Use correct nested array
                                                dataKey="totalRevenue"
                                                nameKey="town"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius="90%"
                                            >
                                                {selectedMonthData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={getRandomColor()} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-gray-500">
                                        {selectedMonth ? "No data for this month" : "Select a month to view details"}
                                    </p>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Orders History Table Card */}
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
                            {/* New Heatmap Tab */}
                            <button
                                className={`px-4 py-2 text-sm font-semibold ${activeTab === "heatmap" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500"}`}
                                onClick={() => setActiveTab("heatmap")}
                            >
                                Heatmap
                            </button>
                        </div>

                        {/* Orders Table */}
                        <div className="overflow-x-auto max-h-96">
                            {activeTab !== "heatmap" ? (
                                <table className="min-w-full border-collapse border border-gray-200">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 px-4 py-2 text-left">Order #</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Mode of Payment</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Customer Email</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Customer Number</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeTab === "delivered" ? deliveredOrders : canceledOrders).length > 0 ? (
                                            (activeTab === "delivered" ? deliveredOrders : canceledOrders).map((order) => (
                                                <tr key={order._id} className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 px-4 py-2">{order.orderNum}</td>
                                                    <td className="border border-gray-300 px-4 py-2">
                                                        ₱{order.items.reduce((total, item) => total + (item.product_id?.price || 0) * item.quantity, 0)}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2">{order.paymentMode}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{order.userId?.email || "N/A"}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{order.userId?.number || "N/A"}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{order.userId?.addressGeocoded || "N/A"}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                                                    No {activeTab} orders found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>

                                </table>
                            ) : (
                                <div className="h-96 relative">
                                    <MapContainer center={[location.latitude, location.longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <HeatmapLayer data={heatMapData} />
                                    </MapContainer>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
