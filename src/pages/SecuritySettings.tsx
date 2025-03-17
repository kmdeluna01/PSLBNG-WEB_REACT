import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

const baseURL = import.meta.env.VITE_API_URL || "";

const SecuritySettings = () => {
    const navigate = useNavigate();
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const clearInputs = () => {
        setPassword('');
        setNewPassword('');
    };

    const verifyPassword = async () => {
        setIsLoading(true);
        const vendorId = localStorage.getItem('vendorId');

        try {
            const response = await axios.post(`${baseURL}/merchant-profile/${vendorId}/verify-password`, {
                password,
            });

            if (response.status === 200) {
                toast({ title: "Success", description: "Password verified!" });
                setShowVerifyModal(false);
                setShowChangePasswordModal(true);
                setPassword('');
            }
        } catch (error) {
            setPassword('');
            if (error.response && error.response.status === 400) {
                toast({ title: "Error", description: "Incorrect password. Please try again.", variant: "destructive" });
            } else {
                toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setIsLoading(true);
        const vendorId = localStorage.getItem('vendorId');

        try {
            const response = await axios.post(`${baseURL}/merchant-profile/${vendorId}/change-password`, {
                newPassword,
            });

            if (response.status === 200) {
                toast({ title: "Success", description: "Password changed successfully!" });
                setShowChangePasswordModal(false);
                navigate("/merchant/security-settings");
                clearInputs();
            }
        } catch (error) {
            setNewPassword('');
            if (error.response && error.response.status === 400) {
                toast({ title: "Error", description: "Failed to change password. Please try again.", variant: "destructive" });
            } else {
                toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
            </div>
            <div className="m-3">
                <button 
                    className="flex justify-between items-center w-full bg-white p-4 rounded-lg shadow hover:bg-green-50"
                    onClick={() => setShowVerifyModal(true)}
                >
                    <span className="text-lg font-semibold text-green-700">Change Password</span>
                </button>
            </div>

            {/* Verify Password Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Verify Your Password</h2>
                        <input 
                            type="password" 
                            placeholder="Enter your current password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full p-2 border rounded-lg mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                onClick={() => {
                                    setShowVerifyModal(false);
                                    clearInputs();
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600"
                                onClick={verifyPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? "Verifying..." : "Verify"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Change Your Password</h2>
                        <input 
                            type="password" 
                            placeholder="Enter new password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            className="w-full p-2 border rounded-lg mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                onClick={() => {
                                    setShowChangePasswordModal(false);
                                    clearInputs();
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600"
                                onClick={handleChangePassword}
                                disabled={isLoading}
                            >
                                {isLoading ? "Changing..." : "Change Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings;
