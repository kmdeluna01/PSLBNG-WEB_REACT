import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const baseURL = import.meta.env.VITE_API_URL || '';

const PendingOrder = () => {
    const [selectedTab, setSelectedTab] = useState('incoming');
    const [orders, setOrders] = useState([]);
    const [vendorPendings, setVendorPendings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const vendorID = localStorage.getItem("vendorId");
        if (!vendorID) return;

        try {
            const response = await axios.get(`${baseURL}/merchant/${vendorID}/orders/pending`);
            //console.log(response)
            const fetchedOrders = response.data;
            setOrders(fetchedOrders);
            const productIds = fetchedOrders.flatMap(order => {
                if (order.items && Array.isArray(order.items)) {
                    return order.items.map(item => item.product_id);
                }
                return [];  // Return an empty array if `order.items` is not defined or not an array
            });
            setVendorPendings(productIds);
        } catch (error) {
            console.error("Error fetching pending orders:", error);
        }
    };

    const handlePrepare = async (orderId) => {
        if (!window.confirm("Start preparing this order?")) return;
        try {
            await axios.put(`${baseURL}/merchant/orders/${orderId}/prepare`);
            fetchOrders();
        } catch (error) {
            console.error("Error preparing order:", error);
        }
    };

    const handleShip = async (orderId) => {
        if (!window.confirm("Is the order ready to be shipped?")) return;
        try {
            await axios.put(`${baseURL}/merchant/orders/${orderId}/ship`);
            fetchOrders();
        } catch (error) {
            console.error("Error shipping:", error);
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
