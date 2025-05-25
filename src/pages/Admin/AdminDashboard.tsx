import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const baseURL = import.meta.env.VITE_API_URL || "";

export default function AdminDashboard() {
    const [transactions, setTransactions] = useState([]);
    console.log("Transactions:", transactions);
    const [vendors, setVendors] = useState([]);
    //console.log("Merchants:", vendors);
    const [users, setUsers] = useState([]);
    //console.log("Users:", users);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("All");
    const ordersPerPage = 10;
    const totalPages = Math.ceil(transactions.length / ordersPerPage);
    const paginatedTransactions = transactions.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    useEffect(() => {
        fetchTransactions();
        fetchVendors();
        fetchUsers();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseURL}/admin/orders`);
            // If response is { orders: [...] }, use res.data.orders
            setTransactions(res.data.orders || res.data || []);
        } catch (error) {
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await axios.get(`${baseURL}/admin/merchants`);
            setVendors(res.data.merchants || []);
        } catch (error) {
            setVendors([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${baseURL}/admin/users`);
            setUsers(res.data.users || []);
        } catch (error) {
            setUsers([]);
        }
    };

    const handleVerifyVendor = async (vendorId, approve) => {
        setVerifying(true);
        try {
            await axios.put(`${baseURL}/admin/merchant/verify`, { vendorId, approve });
            fetchVendors();
        } catch (error) {
            // handle error
        } finally {
            setVerifying(false);
            setIsVendorDialogOpen(false);
        }
    };

    // Filter vendors based on selected status
    const filteredVendors = vendors.filter((vendor) => {
        if (selectedStatus === "Verified") return vendor.verified;
        if (selectedStatus === "Not Verified") return !vendor.verified;
        return true; // All
    });

    return (
        <div className="min-h-screen p-6">
            {/* Transactions Card (full width) */}
            <div className="mb-8">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading transactions...</p>
                        ) : transactions.length ? (
                            <>
                                <ul className="divide-y">
                                    {paginatedTransactions.map((tx) => (
                                        <li key={tx._id} className="py-2 justify-between items-center flex">
                                            <button
                                                className="text-blue-600 hover:underline font-semibold text-left"
                                                onClick={() => { setSelectedOrder(tx); setIsOrderDialogOpen(true); }}
                                            >
                                                Order {tx.orderNum}
                                            </button>
                                            <span className="text-sm text-gray-500">{tx.paymentMode}</span>
                                            <span className="text-sm text-gray-500">{tx.status}</span>
                                        </li>
                                    ))}
                                </ul>
                                {/* Pagination Controls */}
                                <div className="flex justify-center items-center gap-2 mt-4">
                                    <button
                                        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="mx-2">Page {currentPage} of {totalPages}</span>
                                    <button
                                        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                                {/* Order Details Modal */}
                                <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Order Details</DialogTitle>
                                        </DialogHeader>
                                        {selectedOrder && (
                                            <div className="space-y-2">
                                                <p><strong>Order Number:</strong> {selectedOrder.orderNum}</p>
                                                <p><strong>Status:</strong> {selectedOrder.status}</p>
                                                <p><strong>Payment Mode:</strong> {selectedOrder.paymentMode}</p>
                                                <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                                <p><strong>Customer:</strong> {selectedOrder.userId && selectedOrder.userId.nickname ? selectedOrder.userId.nickname : (selectedOrder.userId && selectedOrder.userId.email ? selectedOrder.userId.email : String(selectedOrder.userId))}</p>
                                                <p><strong>Merchant:</strong> {selectedOrder.userId && selectedOrder.userId.email ? selectedOrder.userId.email : String(selectedOrder.userId)}</p>
                                                <p><strong>Items:</strong></p>
                                                <ul className="ml-4 mt-2 text-sm text-gray-700">
                                                    {selectedOrder.items.map((item, idx) => (
                                                        <li key={idx} className="flex justify-between">
                                                            <span>{item.productName || item.product_id?.productName || 'Product'}</span>
                                                            <span>Qty: {item.quantity}</span>
                                                            <span>₱{item.price || item.product_id?.price || '-'}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </>
                        ) : (
                            <p>No transactions found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            {/* Merchants and Users Cards in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vendor Verification */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Merchant Accounts
                            <select
                                id="statusFilter"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                <option value="All">All</option>
                                <option value="Verified">Verified</option>
                                <option value="Not Verified">Not Verified</option>
                            </select>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredVendors.length ? (
                            <ul className="divide-y">
                                {filteredVendors.map((vendor) => (
                                    <li key={vendor._id} className="py-2 flex flex-col md:flex-row md:justify-between md:items-center">
                                        <span>{vendor.name}</span>
                                        <div className="flex gap-2 mt-2 md:mt-0">
                                            <Button size="sm" onClick={() => { setSelectedVendor(vendor); setIsVendorDialogOpen(true); }}>Review</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No merchant accounts found.</p>
                        )}
                    </CardContent>
                </Card>
                {/* Users Card */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>User Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {users.length ? (
                            <ul className="divide-y">
                                {users.map((user) => (
                                    <li key={user._id} className="py-2 flex flex-col md:flex-row md:justify-between md:items-center">
                                        <span>{user.nickname || user.email}</span>
                                        <span className="text-gray-500">{user.email}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No user accounts found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            {/* Vendor Review Dialog */}
            <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Vendor Account</DialogTitle>
                    </DialogHeader>
                    {selectedVendor && (
                        <div className="space-y-2 max-h-[75vh] overflow-y-auto p-4">
                            <p><strong>Business Name:</strong> {selectedVendor.name}</p>
                            <p><strong>Email:</strong> {selectedVendor.email}</p>
                            <p><strong>Contact:</strong> {selectedVendor.number}</p>
                            <p><strong>Business Permit:</strong>
                                {selectedVendor.permit && typeof selectedVendor.permit === 'string' && (
                                    <div className="w-full">
                                        {selectedVendor.permit.match(/\.(pdf)$/i) ? (
                                            <a
                                                href={selectedVendor.permit}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline"
                                            >
                                                View Uploaded Permit (PDF)
                                            </a>
                                        ) : (
                                            <img
                                                src={selectedVendor.permit}
                                                alt="Business Permit"
                                                className="w-full object-contain rounded-t-lg max-h-[600px]"
                                            />
                                        )}
                                    </div>
                                )}</p>
                            {/* Add more fields as needed */}
                            <div className="flex gap-4 mt-4">
                                {selectedVendor?.verified ? (
                                    <Button
                                        disabled={verifying}
                                        onClick={() => handleVerifyVendor(selectedVendor._id, false)}
                                        variant="destructive"
                                    >
                                        Revoke
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            disabled={verifying}
                                            onClick={() => handleVerifyVendor(selectedVendor._id, true)}
                                            variant="custom"
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            disabled={verifying}
                                            onClick={() => handleVerifyVendor(selectedVendor._id, false)}
                                            variant="destructive"
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
