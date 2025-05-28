// @ts-nocheck
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import axios from "axios";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet"; // Leaflet library for rendering the map
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import React, { useMemo } from "react";
import "leaflet.heat"; // Heatmap extension for Leaflet

const baseURL = import.meta.env.VITE_API_URL || "";

export default function Dashboard() {
    // State variables to manage fetched data and UI state
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    //console.log(monthlyRevenue, "monthlyRevenue");
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    //console.log(deliveredOrders, "deliveredOrders");
    const [canceledOrders, setCanceledOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("delivered");
    const [location, setLocation] = useState(null);
    //console.log(location);
    const [heatMapData, setHeatMapData] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [townData, setTownData] = useState([]);
    //console.log(townData, "townData");
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(null);
    //console.log(selectedMonth, "selectedMonth");
    const [selectedMonthData, setSelectedMonthData] = useState(null);
    //console.log(selectedMonthData, "selectedMonthData");
    const [showAllTowns, setShowAllTowns] = useState(true); // Default to true to show buyer distribution
    //console.log(showAllTowns, "showAllTowns");
    const [summaryType, setSummaryType] = useState("month"); // New state for summary type

    const chartData = showAllTowns ? townData : selectedMonthData;
    //console.log(chartData, "chartData");
    const dataKey = showAllTowns ? "count" : "totalRevenue";
    const vendorId = localStorage.getItem("vendorId");

    const [selectedData, setSelectedData] = useState(null); // For modal data
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
    const [selectedMonthForDay, setSelectedMonthForDay] = useState(""); // Add this state for the day filter

    //console.log(deliveredOrders, "deliveredOrders");

    const handlePieClick = (data) => {
        setSelectedData(data);
        setIsModalOpen(true);
    };
    
    // Initial data fetching
    useEffect(() => {
        fetchSalesData();
        fetchDeliveredOrders();
        getUserDetails();
    }, [vendorId, summaryType]);

    // Fetch geolocation data when deliveredOrders change
    useEffect(() => {
        if (deliveredOrders.length > 0) {
            fetchGeolocationData();
        }
    }, [deliveredOrders]);

    // Update selectedMonthData when selectedMonth changes
    useEffect(() => {
        if (selectedMonth) {
            const monthData = getMonthDistribution(deliveredOrders);
            setSelectedMonthData(monthData[selectedMonth]
                ? Object.entries(monthData[selectedMonth]).map(([town, totalRevenue]) => ({ town, totalRevenue }))
                : []
            );
        }
    }, [selectedMonth, deliveredOrders]);

    // Set default selectedLabel on monthlyRevenue or summaryType change
    useEffect(() => {
        if (monthlyRevenue.length > 0) {
            setSelectedLabel(monthlyRevenue[0].month);
        } else {
            setSelectedLabel(null);
        }
    }, [monthlyRevenue, summaryType]);

    // --- Pie Chart Data Logic ---
    // For summaryType 'month', clicking a line chart month shows pie by town for that month
    // For other summaryTypes, clicking a line chart label shows pie by town for that label
    const [selectedLabel, setSelectedLabel] = useState(null);
    //console.log(selectedLabel, "selectedLabel");
    const pieChartData = useMemo(() => {
        if (!selectedLabel) return [];
        if (summaryType === "day" && Array.isArray(selectedMonthData)) {
            // For 'day', selectedLabel is a date string (e.g., '2025-05-22')
            // selectedMonthData should be an array of { town, totalRevenue, day }
            if (selectedMonthData.length > 0 && selectedMonthData[0].day) {
                // Find the breakdown for the selected day
                return selectedMonthData.filter(item => item.day === selectedLabel);
            }
            // If no 'day' property, just return selectedMonthData
            return selectedMonthData;
        }
        if ((summaryType === "week" || summaryType === "month" || summaryType === "year") && Array.isArray(selectedMonthData)) {
            // For week/month/year, selectedMonthData is already set to the correct breakdown for the selectedLabel
            return selectedMonthData;
        }
        return [];
    }, [selectedLabel, summaryType, selectedMonthData]);
    //console.log(pieChartData, "pieChartData");
    // --- Update Pie Chart on Line Chart Click ---
    const handleLineChartClick = (data) => {
        if (data && data.activeLabel) {
            setSelectedLabel(data.activeLabel);
            // If summaryType is 'day', update selectedMonthData to the breakdown for that day
            if (summaryType === "day" && Array.isArray(selectedMonthData) && selectedMonthData.length > 0 && selectedMonthData[0].day) {
                // No need to update selectedMonthData, just update selectedLabel
            }
        }
    };

    // --- Set default selectedLabel on data load or summaryType change ---
    

    // Generates a random hex color
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    // Memoizes color generation for pie chart
    const colors = useMemo(() => {
        if (!Array.isArray(chartData)) return {};

        const colorMap = {};
        chartData.forEach((item) => {
            colorMap[item.town] = getRandomColor();
        });
        return colorMap;
    }, [chartData]);

    // Fetches vendor profile to get initial location
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

    // Fetches sales data for the vendor
    const fetchSalesData = async () => {
        try {
            const res = await axios.get(`${baseURL}/merchant/${vendorId}/sales-summary`, {
                params: { type: summaryType }
            });
            const { report } = res.data;
            // Adapt the report to the chart format
            if (Array.isArray(report)) {
                setMonthlyRevenue(report.map(item => ({
                    month: item.label,
                    totalRevenue: item.revenue
                })));
            } else {
                setMonthlyRevenue([]);
            }
        } catch (error) {
            console.error("Error fetching sales data: ", error);
            setMonthlyRevenue([]);
        }
    };

    // Fetches delivered and canceled orders and sets heatmap data
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

    // Processes address and order data into usable formats
    const fetchGeolocationData = async () => {
        setTownData(getTownDistribution(addresses));
        setSelectedMonthData(getMonthDistribution(deliveredOrders) || []);
        setLoading(false);
    };

    // Heatmap component for the map
    const HeatmapLayer = ({ data }) => {
        const map = useMap();

        useEffect(() => {
            if (!map) return;

            const heatLayer = L.heatLayer(
                data.map(({ lat, lng }) => [lat, lng]),
                { radius: 20, blur: 15, maxZoom: 10 }
            ).addTo(map);

            return () => {
                map.removeLayer(heatLayer); // Cleanup heatmap
            };
        }, [map, data]);

        return null;
    };

    // Counts number of buyers in each town
    const getTownDistribution = (addresses) => {
        if (!addresses || addresses.length === 0) return [];

        const townCounts = addresses.reduce((acc, town) => {
            if (town && town !== "Unknown") {
                acc[town] = (acc[town] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(townCounts).map(([town, count]) => ({ town, count }));
    };

    // Aggregates total revenue per town per month
    const getMonthDistribution = (orders) => {
        if (!orders || orders.length === 0) return {};

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

    // --- Filtered daily data by month ---
    const filteredDailyRevenue = useMemo(() => {
        if (summaryType !== "day" || !selectedMonthForDay) return monthlyRevenue;
        // Expecting month in format 'Month YYYY' (e.g., 'May 2025')
        return monthlyRevenue.filter(item => {
            // Try to extract month and year from item.label or item.month
            const label = item.label || item.month;
            if (!label) return false;
            // Accept both 'YYYY-MM-DD' and 'Month YYYY' formats
            const date = new Date(label);
            const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });
            return monthYear === selectedMonthForDay;
        });
    }, [monthlyRevenue, summaryType, selectedMonthForDay]);

    // --- Get unique months for dropdown ---
    const availableMonths = useMemo(() => {
        if (!Array.isArray(monthlyRevenue)) return [];
        const monthsSet = new Set();
        monthlyRevenue.forEach(item => {
            const label = item.label || item.month;
            if (!label) return;
            const date = new Date(label);
            const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });
            monthsSet.add(monthYear);
        });
        return Array.from(monthsSet);
    }, [monthlyRevenue]);

    // --- Set default selectedMonthForDay when summaryType or data changes ---
    useEffect(() => {
        if (summaryType === "day" && availableMonths.length > 0) {
            setSelectedMonthForDay(availableMonths[0]);
        } else {
            setSelectedMonthForDay("");
        }
    }, [summaryType, availableMonths]);

    // Update selectedMonthData when selectedLabel changes (for month summary)
    useEffect(() => {
        if (summaryType !== "day" && selectedLabel && deliveredOrders.length > 0) {
            const monthData = getMonthDistribution(deliveredOrders);
            if (monthData[selectedLabel]) {
                setSelectedMonthData(
                    Object.entries(monthData[selectedLabel]).map(([town, totalRevenue]) => ({ town, totalRevenue }))
                );
            } else {
                setSelectedMonthData([]);
            }
        }
    }, [selectedLabel, summaryType, deliveredOrders]);

    // The return block is the rendered UI — including charts, buttons, and maps.
    // For space reasons, the UI block was omitted here but contains conditional rendering
    // for charts (line, pie), map views (heatmap), and order tables for delivered/canceled orders.
    return (
        <div className="min-h-screen">
            <div className="flex items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <div>
                    <select
                        id="summary-type"
                        value={summaryType}
                        onChange={e => setSummaryType(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                    </select>
                </div>
                {/* Month filter for daily summary */}
                {summaryType === "day" && (
                    <div className="ml-4">
                        <label htmlFor="month-filter" className="mr-2 text-sm text-gray-700">Month:</label>
                        <select
                            id="month-filter"
                            value={selectedMonthForDay}
                            onChange={e => setSelectedMonthForDay(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            {/* Monthly Sales Graph */}
            <div className="space-y-8">
                {/* Monthly Sales Chart Card */}
                <div className="flex space-x-8">
                    {/* Monthly Sales Line Chart */}
                    <Card className="w-1/2 shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-700">{summaryType === "day" ? "Daily Sales" : summaryType.charAt(0).toUpperCase() + summaryType.slice(1) + " Sales 2025"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full">
                                <ResponsiveContainer width="100%" height={300}>
                                    {filteredDailyRevenue.length > 0 ? (
                                        <LineChart data={filteredDailyRevenue} onClick={handleLineChartClick}>
                                            <XAxis
                                                dataKey="month"
                                                tickFormatter={month => {
                                                    if (summaryType === "day") {
                                                        // Remove year from YYYY-MM-DD
                                                        // Show as 'MMM DD' (e.g., May 22)
                                                        const date = new Date(month);
                                                        if (!isNaN(date)) {
                                                            return date.toLocaleString("default", { month: "short", day: "numeric" });
                                                        }
                                                        // fallback: just show the last 5 chars (DD)
                                                        return month.slice(-3);
                                                    }
                                                    if (summaryType === "week" || summaryType === "month") {
                                                        // Remove year from label (e.g., 'May 2025' -> 'May')
                                                        // For week: 'Week 21, 2025' -> 'Week 21'
                                                        if (typeof month === "string") {
                                                            // For week
                                                            if (summaryType === "week" && month.startsWith("Week ")) {
                                                                return month.split(",")[0];
                                                            }
                                                            // For month
                                                            if (summaryType === "month") {
                                                                // Try to parse as 'Month YYYY'
                                                                const parts = month.split(",");
                                                                return parts[0];
                                                            }
                                                        }
                                                    }
                                                    return month.substring(0, 10);
                                                }}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={label => {
                                                    if (summaryType === "day") {
                                                        const date = new Date(label);
                                                        if (!isNaN(date)) {
                                                            return date.toLocaleString("default", { month: "long", day: "numeric" });
                                                        }
                                                        return label;
                                                    }
                                                    if (summaryType === "week" || summaryType === "month") {
                                                        // Remove year from label for tooltip
                                                        if (typeof label === "string") {
                                                            if (summaryType === "week" && label.startsWith("Week ")) {
                                                                return label.split(",")[0];
                                                            }
                                                            if (summaryType === "month") {
                                                                const parts = label.split(",");
                                                                return parts[0];
                                                            }
                                                        }
                                                    }
                                                    return label;
                                                }}
                                            />
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
                    <>
                        <Card className="w-1/2 shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="flex justify-between text-lg text-gray-700">
                                    Buyer Distribution for All Towns
                                    {/*}
                                    <Button
                                        onClick={() => setShowAllTowns((prev) => !prev)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
                                    >
                                        {showAllTowns ? "View Selected Month" : "See All Towns"}
                                    </Button>
                                    */}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-72">
                                            <div className="w-40 h-40 rounded-full bg-gray-300 animate-pulse" />
                                        </div>
                                    ) : townData && townData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={townData}
                                                    dataKey="count"
                                                    nameKey="town"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius="90%"
                                                    onClick={handlePieClick}
                                                >
                                                    {townData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-alltowns-${index}`}
                                                            fill={colors[entry.town] || "#ccc"}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-center text-gray-500">No data available</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Modal Section */}
                        {selectedData && (
                            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                <DialogContent className="max-w-2xl">
                                    <DialogTitle className="text-lg font-semibold mb-2">
                                        {selectedData?.town} Customers
                                        <div className="space-y-2 mt-2">
                                            {showAllTowns ? (
                                                <p>Total: <strong>{selectedData?.[dataKey]}</strong></p>
                                            ) : (
                                                <p>Total Revenue: <strong>₱{selectedData?.[dataKey]}</strong></p>
                                            )}
                                        </div>
                                    </DialogTitle>

                                    <DialogDescription>
                                        <div className="overflow-x-auto max-h-96 mt-4">
                                            <table className="min-w-full border-collapse border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-100 text-gray-700">
                                                        <th className="border border-gray-300 px-4 py-2 text-left">Order #</th>
                                                        <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                                                        <th className="border border-gray-300 px-4 py-2 text-left">Mode of Payment</th>
                                                        <th className="border border-gray-300 px-4 py-2 text-left">Customer Email</th>
                                                        <th className="border border-gray-300 px-4 py-2 text-left">Customer Number</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const townOrders = deliveredOrders.filter(order => order.userId?.addressGeocoded === selectedData.town);
                                                        if (townOrders.length > 0) {
                                                            return townOrders.map((order) => (
                                                                <tr key={order._id} className="hover:bg-gray-50">
                                                                    <td className="border border-gray-300 px-4 py-2">{order.orderNum}</td>
                                                                    <td className="border border-gray-300 px-4 py-2">
                                                                        ₱{order.items.reduce((total, item) => total + (item.product_id?.price || 0) * item.quantity, 0)}
                                                                    </td>
                                                                    <td className="border border-gray-300 px-4 py-2">{order.paymentMode}</td>
                                                                    <td className="border border-gray-300 px-4 py-2">{order.userId?.email || "N/A"}</td>
                                                                    <td className="border border-gray-300 px-4 py-2">{order.userId?.number || "N/A"}</td>
                                                                </tr>
                                                            ));
                                                        } else {
                                                            return (
                                                                <tr>
                                                                    <td colSpan={5} className="border border-gray-300 px-4 py-6 text-center text-gray-500">
                                                                        No delivered orders found for this town.
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </DialogDescription>
                                </DialogContent>
                            </Dialog>
                        )}
                    </>



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
