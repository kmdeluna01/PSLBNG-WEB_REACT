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

    const fetchProductDetails = async (productIds) => {
        try {
            const responses = await Promise.all(
                productIds.map(productId => axios.get(`${baseURL}/product-details/${productId}`))
            );
            return responses.map(response => response.data.data);
        } catch (error) {
            console.error("Error fetching product details: ", error);
            return [];
        }
    };

    const fetchOrders = async () => {
        const vendorID = localStorage.getItem("vendorId");
        if (!vendorID) return;

        try {
            const response = await axios.get(`${baseURL}/merchant/${vendorID}/orders/pending`);
            const fetchedOrders = response.data;
            console.log(fetchedOrders);
            setOrders(fetchedOrders);
            const productIds = fetchedOrders.flatMap(order => order.items.map(item => item.product_id));
            if (productIds.length === 0) return;
            const products = await fetchProductDetails(productIds);
            setVendorPendings(products);
        } catch (error) {
            console.error("Error fetching pending orders:", error);
        }
    };

    const handlePrepare = async (orderId) => {
        console.log(orderId)
        if (!window.confirm("Start preparing this order?")) return;
        try {
            await axios.put(`${baseURL}/merchant/orders/${orderId}/prepare`);
            fetchOrders();
        } catch (error) {
            console.error("Error preparing order:", error);
        }
    };

    const handleShip = async (orderId) => {
        
        if (!window.confirm("Is the order Shipped Out?")) return;
        try {
            await axios.put(`${baseURL}/merchant/orders/${orderId}/ship`);
            fetchOrders();
        } catch (error) {
            console.error("Error shipping:", error);
        }
    };

    return (
        <div className="min-h-screen p-4">
    <div className="flex items-center space-x-4 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Orders</h1>
    </div>
    <div className="flex justify-around bg-white p-2 rounded-md shadow-md mb-4">
        {['incoming', 'pending', 'shipped out', 'delivered', 'canceled'].map(tab => (
            <button 
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-2 px-4 text-sm font-semibold ${selectedTab === tab ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
            >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
        ))}
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
                        const product = vendorPendings.find(p => p._id === item.product_id);
                        return (
                            <div key={item.product_id} className="flex items-center mt-3">
                                <img 
                                    src={product?.image ? `${baseURL}/${product.image}` : "https://via.placeholder.com/150"} 
                                    className="w-20 h-20 rounded-md object-cover" 
                                    alt="product"
                                />
                                <div className="ml-4">
                                    <h3 className="font-medium text-gray-900">{product?.productName || 'Loading...'}</h3>
                                    <p className="text-sm text-gray-700">₱{product?.price || 'Loading...'}</p>
                                    <p className="text-sm text-gray-700">Quantity Ordered: <span className="font-bold">{item.quantity}</span></p>
                                    <p className="text-sm text-gray-700">Mode of Payment: {order.paymentMode}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))
        ) : selectedTab === 'pending' && orders.length > 0 ? (
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
                            const product = vendorPendings.find(p => p._id === item.product_id);
                            return (
                                <div key={item.product_id} className="flex items-center mt-3">
                                    <img 
                                        src={product?.image ? `${baseURL}/${product.image}` : "https://via.placeholder.com/150"} 
                                        className="w-20 h-20 rounded-md object-cover" 
                                        alt="product"
                                    />
                                    <div className="ml-4">
                                        <h3 className="font-medium text-gray-900">{product?.productName || 'Loading...'}</h3>
                                        <p className="text-sm text-gray-700">₱{product?.price || 'Loading...'}</p>
                                        <p className="text-sm text-gray-700">Quantity Ordered: <span className="font-bold">{item.quantity}</span></p>
                                        <p className="text-sm text-gray-700">Mode of Payment: {order.paymentMode}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))
        ) : selectedTab === 'shipped out' && orders.length > 0 ? (
            orders
                .filter(order => order.status === 'shipped') 
                .map(order => (
                    <div key={order._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-gray-800">Order #{order.orderNum}</h2>
                            <button 
                                className="text-green-600 font-bold"
                            >
                                Awaiting to be Received
                            </button>
                        </div>
                        {order.items.map(item => {
                            const product = vendorPendings.find(p => p._id === item.product_id);
                            return (
                                <div key={item.product_id} className="flex items-center mt-3">
                                    <img 
                                        src={product?.image ? `${baseURL}/${product.image}` : "https://via.placeholder.com/150"} 
                                        className="w-20 h-20 rounded-md object-cover" 
                                        alt="product"
                                    />
                                    <div className="ml-4">
                                        <h3 className="font-medium text-gray-900">{product?.productName || 'Loading...'}</h3>
                                        <p className="text-sm text-gray-700">₱{product?.price || 'Loading...'}</p>
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
                            <button 
                                className="text-green-600 font-bold"
                            >
                                Delivered
                            </button>
                        </div>
                        {order.items.map(item => {
                            const product = vendorPendings.find(p => p._id === item.product_id);
                            return (
                                <div key={item.product_id} className="flex items-center mt-3">
                                    <img 
                                        src={product?.image ? `${baseURL}/${product.image}` : "https://via.placeholder.com/150"} 
                                        className="w-20 h-20 rounded-md object-cover" 
                                        alt="product"
                                    />
                                    <div className="ml-4">
                                        <h3 className="font-medium text-gray-900">{product?.productName || 'Loading...'}</h3>
                                        <p className="text-sm text-gray-700">₱{product?.price || 'Loading...'}</p>
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
                                className="text-green-600 font-bold"
                            >
                                Canceled
                            </button>
                        </div>
                        {order.items.map(item => {
                            const product = vendorPendings.find(p => p._id === item.product_id);
                            return (
                                <div key={item.product_id} className="flex items-center mt-3">
                                    <img 
                                        src={product?.image ? `${baseURL}/${product.image}` : "https://via.placeholder.com/150"} 
                                        className="w-20 h-20 rounded-md object-cover" 
                                        alt="product"
                                    />
                                    <div className="ml-4">
                                        <h3 className="font-medium text-gray-900">{product?.productName || 'Loading...'}</h3>
                                        <p className="text-sm text-gray-700">₱{product?.price || 'Loading...'}</p>
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
