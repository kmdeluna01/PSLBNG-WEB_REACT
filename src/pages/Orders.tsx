// Import necessary hooks and functions
import React, { useState, useEffect, useCallback } from 'react'; // React hooks for managing state and side effects
import { useNavigate } from 'react-router-dom'; // Hook to navigate between pages
import axios from 'axios'; // For making HTTP requests
const baseURL = import.meta.env.VITE_API_URL || ''; // Get the base URL for the API from environment variables

const PendingOrder = () => {
    // Declare state variables to manage selected tab, orders, and pending items
    const [selectedTab, setSelectedTab] = useState('incoming'); // Default tab is 'incoming'
    const [orders, setOrders] = useState([]); // Store the list of orders
    const [vendorPendings, setVendorPendings] = useState([]); // Store pending vendor product IDs
    const navigate = useNavigate(); // To navigate between pages (e.g., after order status updates)

    // useEffect hook runs once on initial component render
    useEffect(() => {
        fetchOrders(); // Call the fetchOrders function to get the list of orders
    }, []); // Empty dependency array ensures this runs only once

    // Function to fetch orders from the server
    const fetchOrders = async () => {
        const vendorID = localStorage.getItem("vendorId"); // Get vendor ID from local storage
        if (!vendorID) return; // If there's no vendor ID, stop fetching orders

        try {
            // Make a GET request to the server to fetch pending orders for the vendor
            const response = await axios.get(`${baseURL}/merchant/${vendorID}/orders/pending`);
            const fetchedOrders = response.data; // Get orders data from the response
            setOrders(fetchedOrders); // Set the fetched orders in state

            // Extract product IDs from the orders to track pending items
            const productIds = fetchedOrders.flatMap(order => {
                if (order.items && Array.isArray(order.items)) {
                    return order.items.map(item => item.product_id); // Extract product IDs from items
                }
                return []; // Return empty array if no items or invalid data
            });
            setVendorPendings(productIds); // Store the extracted product IDs in state
        } catch (error) {
            console.error("Error fetching pending orders:", error); // Log error if the request fails
        }
    };

    // Function to handle the 'Prepare' action for an order
    const handlePrepare = async (orderId) => {
        if (!window.confirm("Start preparing this order?")) return; // Ask for confirmation before preparing the order
        try {
            // Make a PUT request to update the order status to 'prepare'
            await axios.put(`${baseURL}/merchant/orders/${orderId}/prepare`);
            fetchOrders(); // Refresh the list of orders after preparation
        } catch (error) {
            console.error("Error preparing order:", error); // Log error if the request fails
        }
    };

    // Function to handle the 'Ship' action for an order
    const handleShip = async (orderId) => {
        if (!window.confirm("Is the order ready to be shipped?")) return; // Ask for confirmation before shipping the order
        try {
            // Make a PUT request to update the order status to 'ship'
            await axios.put(`${baseURL}/merchant/orders/${orderId}/ship`);
            fetchOrders(); // Refresh the list of orders after shipping
        } catch (error) {
            console.error("Error shipping:", error); // Log error if the request fails
        }
    };

    return (
        <div className="min-h-screen">
            <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
            </div>
            <div className="flex justify-around bg-white p-2 rounded-md shadow-md mb-4">
                {['incoming', 'pending', 'shipped', 'delivered', 'canceled'].map(tab => {
                    const notificationCount = orders.filter(order => order.status === tab).length; // Adjust based on your data

                    return (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`relative py-2 px-4 text-sm font-semibold ${selectedTab === tab ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}

                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                    {notificationCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div>
                {selectedTab === 'incoming' && orders.length > 0 ? (
                    orders
                        .filter(order => order.status === 'incoming')
                        .map(order => (
                            <div key={order._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="font-semibold text-gray-800">Order #{order.orderNum}</h2>
                                    <button
                                        onClick={() => handlePrepare(order._id)}
                                        className="text-green-600 font-bold"
                                    >
                                        PREPARE
                                    </button>
                                </div>
                                {order.items.map(item => {
                                    return (
                                        <div key={item.product_id} className="flex items-center mt-3">
                                            <img
                                                src={item.product_id?.image || 'https://dummyimage.com/150x150/cccccc/ffffff&text=Loading'}
                                                className={`w-20 h-20 rounded-md object-cover`}
                                                alt="product"
                                            />
                                            <div className="ml-4">
                                                <h3 className="font-medium text-gray-900">{item.product_id?.productName || 'Loading...'}</h3>
                                                <p className="text-sm text-gray-700">₱{item.product_id?.price || 'Loading...'}</p>
                                                <p className="text-sm text-gray-700">Quantity Ordered: <span className="font-bold">{item.quantity}</span></p>
                                                <p className="text-sm text-gray-700">Mode of Payment: {order.paymentMode}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                ) :
                    selectedTab === 'pending' && orders.length > 0 ? (
                        orders
                            .filter(order => order.status === 'pending')
                            .map(order => (
                                <div key={order._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="font-semibold text-gray-800">Order #{order.orderNum}</h2>
                                        <button
                                            onClick={() => handleShip(order._id)}
                                            className="text-green-600 font-bold"
                                        >
                                            SHIP OUT
                                        </button>
                                    </div>
                                    {order.items.map(item => {
                                        return (
                                            <div key={item.product_id} className="flex items-center mt-3">
                                                <img
                                                    src={item.product_id?.image || 'https://dummyimage.com/150x150/cccccc/ffffff&text=Loading'}
                                                    className={`w-20 h-20 rounded-md object-cover`}
                                                    alt="product"
                                                />
                                                <div className="ml-4">
                                                    <h3 className="font-medium text-gray-900">{item.product_id?.productName || 'Loading...'}</h3>
                                                    <p className="text-sm text-gray-700">₱{item.product_id?.price || 'Loading...'}</p>
                                                    <p className="text-sm text-gray-700">Quantity Ordered: <span className="font-bold">{item.quantity}</span></p>
                                                    <p className="text-sm text-gray-700">Mode of Payment: {order.paymentMode}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                    ) : selectedTab === 'shipped' && orders.length > 0 ? (
                        orders
                            .filter(order => order.status === 'shipped')
                            .map(order => (
                                <div key={order._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="font-semibold text-gray-800">Order #{order.orderNum}</h2>
                                        <button
                                            className="text-green-500 font-bold"
                                        >
                                            Awaiting to be Received
                                        </button>
                                    </div>
                                    {order.items.map(item => {
                                        return (
                                            <div key={item.product_id} className="flex items-center mt-3">
                                                <img
                                                    src={item.product_id?.image || 'https://dummyimage.com/150x150/cccccc/ffffff&text=Loading'}
                                                    className={`w-20 h-20 rounded-md object-cover`}
                                                    alt="product"
                                                />
                                                <div className="ml-4">
                                                    <h3 className="font-medium text-gray-900">{item.product_id?.productName || 'Loading...'}</h3>
                                                    <p className="text-sm text-gray-700">₱{item.product_id?.price || 'Loading...'}</p>
                                                    <p className="text-sm text-gray-700">Quantity Ordered: <span className="font-bold">{item.quantity}</span></p>
                                                    <p className="text-sm text-gray-700">Mode of Payment: {order.paymentMode}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                    ) : selectedTab === 'delivered' && orders.length > 0 ? (
                        orders
                            .filter(order => order.status === 'delivered')
                            .map(order => (
                                <div key={order._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="font-semibold text-gray-800">Order #{order.orderNum}</h2>
                                    </div>
                                    {order.items.map(item => {
                                        return (
                                            <div key={item._id} className="flex items-center mt-3">
                                                <img
                                                    src={item.product_id?.image || 'https://dummyimage.com/150x150/cccccc/ffffff&text=Loading'}
                                                    className={`w-20 h-20 rounded-md object-cover`}
                                                    alt="product"
                                                />
                                                <div className="ml-4">
                                                    <h3 className="font-medium text-gray-900">{item.product_id?.productName || 'Loading...'}</h3>
                                                    <p className="text-sm text-gray-700">₱{item.product_id?.price || 'Loading...'}</p>
                                                    <p className="text-sm text-gray-700">Quantity Ordered: <span className="font-bold">{item.quantity}</span></p>
                                                    <p className="text-sm text-gray-700">Mode of Payment: {order.paymentMode}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))

                    ) : selectedTab === 'canceled' && orders.length > 0 ? (
                        orders
                            .filter(order => order.status === 'cancelled')
                            .map(order => (
                                <div key={order._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="font-semibold text-gray-800">Order #{order.orderNum}</h2>
                                        <button
                                            className="text-red-600 font-bold"
                                        >
                                            Canceled
                                        </button>
                                    </div>
                                    {order.items.map(item => {
                                        return (
                                            <div key={item.product_id} className="flex items-center mt-3">
                                                <img
                                                    src={item.product_id?.image || 'https://dummyimage.com/150x150/cccccc/ffffff&text=Loading'}
                                                    className={`w-20 h-20 rounded-md object-cover`}
                                                    alt="product"
                                                />
                                                <div className="ml-4">
                                                    <h3 className="font-medium text-gray-900">{item.product_id?.productName || 'Loading...'}</h3>
                                                    <p className="text-sm text-gray-700">₱{item.product_id?.price || 'Loading...'}</p>
                                                    <p className="text-sm text-gray-700">Quantity Ordered: <span className="font-bold">{item.quantity}</span></p>
                                                    <p className="text-sm text-gray-700">Mode of Payment: {order.paymentMode}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                    ) : (
                        <p className="text-center text-gray-600">
                            {selectedTab === 'incoming' && orders.length === 0
                                ? 'No Incoming Orders'
                                : selectedTab === 'pending' && orders.length === 0
                                    ? 'No Pending Orders'
                                    : selectedTab === 'shipped' && orders.length === 0
                                        ? 'No Shipped Orders'
                                        : selectedTab === 'history' && orders.length === 0
                                            ? 'No Delivered Orders'
                                            : ''}
                        </p>
                    )}
            </div>
        </div>

    );
};

export default PendingOrder;
