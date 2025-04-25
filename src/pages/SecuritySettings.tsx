import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

// Base URL for API requests, sourced from environment variables
const baseURL = import.meta.env.VITE_API_URL || "";

// SecuritySettings component definition
const SecuritySettings = () => {
    // navigate function for routing within the app
    const navigate = useNavigate();
    
    // useState hooks to manage component state
    const [showVerifyModal, setShowVerifyModal] = useState(false); // Controls the visibility of the verify password modal
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false); // Controls visibility of change password modal
    const [password, setPassword] = useState(''); // State for storing the current password input
    const [newPassword, setNewPassword] = useState(''); // State for storing the new password input
    const [isLoading, setIsLoading] = useState(false); // State for managing the loading state of the process

    // Function to clear password input fields
    const clearInputs = () => {
        setPassword(''); // Clear current password
        setNewPassword(''); // Clear new password
    };

    // Function to verify the current password entered by the user
    const verifyPassword = async () => {
        setIsLoading(true); // Set loading state to true to indicate a request is in progress
        const vendorId = localStorage.getItem('vendorId'); // Get vendorId from local storage

        try {
            // Send POST request to verify the password
            const response = await axios.post(`${baseURL}/merchant-profile/${vendorId}/verify-password`, {
                password,
            });

            if (response.status === 200) {
                toast({ title: "Success", description: "Password verified!" }); // Show success toast if password is correct
                setShowVerifyModal(false); // Close the verify password modal
                setShowChangePasswordModal(true); // Open the change password modal
                setPassword(''); // Clear the current password input field
            }
        } catch (error) {
            setPassword(''); // Clear password field on error
            if (error.response && error.response.status === 400) {
                // Show an error toast if password is incorrect
                toast({ title: "Error", description: "Incorrect password. Please try again.", variant: "destructive" });
            } else {
                // Show a generic error toast for any other error
                toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
            }
        } finally {
            setIsLoading(false); // Set loading state to false when done
        }
    };

    // Function to handle the change of password
    const handleChangePassword = async () => {
        setIsLoading(true); // Set loading state to true
        const vendorId = localStorage.getItem('vendorId'); // Get vendorId from local storage

        try {
            // Send POST request to change the password
            const response = await axios.post(`${baseURL}/merchant-profile/${vendorId}/change-password`, {
                newPassword,
            });

            if (response.status === 200) {
                toast({ title: "Success", description: "Password changed successfully!" }); // Show success toast on success
                setShowChangePasswordModal(false); // Close the change password modal
                navigate("/merchant/security-settings"); // Redirect to the security settings page
                clearInputs(); // Clear input fields
            }
        } catch (error) {
            setNewPassword(''); // Clear the new password field on error
            if (error.response && error.response.status === 400) {
                // Show an error toast if the password change failed
                toast({ title: "Error", description: "Failed to change password. Please try again.", variant: "destructive" });
            } else {
                // Show a generic error toast for any other error
                toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
            }
        } finally {
            setIsLoading(false); // Set loading state to false when done
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
