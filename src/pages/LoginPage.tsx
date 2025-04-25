// Import React hooks and other required tools
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import custom UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

// Axios for HTTP requests
import axios from "axios";

// Logo image
import logo from "../assets/logo.png";

// Use environment variable or fallback to empty string
const baseURL = import.meta.env.VITE_API_URL || "";

const LoginPage = () => {
  const navigate = useNavigate(); // Used to navigate between pages
  const [isLoading, setIsLoading] = useState(false); // Controls loading state for the login button

  // Redirect user to dashboard if already logged in (token exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/merchant"); // Automatically navigate to /merchant if token is found
  }, [navigate]);

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form behavior (page refresh)
    setIsLoading(true); // Show loading state

    // Collect form input values using FormData
    const formData = new FormData(e.currentTarget);
    const loginData = {
      email: formData.get("email"), // Extract email value
      password: formData.get("password"), // Extract password value
    };

    try {
      // Send login data to backend
      const response = await axios.post(`${baseURL}/merchant-login`, loginData);

      // If login is successful
      if (response.data.status === "ok") {
        const { token, vendor } = response.data.data;

        // Store login info in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("isMerchantAuth", "true");
        localStorage.setItem("vendorId", vendor._id);

        // Redirect to the merchant dashboard
        navigate("/merchant");
      } else {
        // If login fails
        throw new Error("Login failed");
      }
    } catch (error) {
      // Display error toast
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      // Turn off loading state
      setIsLoading(false);
    }
  };

  // Render the login form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* Logo at the top */}
      <img src={logo} alt="PSLBNG Logo" className="h-24" />

      {/* Card container for login form */}
      <div className="w-full max-w-md p-8 m-8 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back to Pasalubong!</h2>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required className="mt-2" />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl transition duration-300"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {/* Link to register page */}
        <p className="mt-6 text-center text-gray-600">
          New to Pasalubong?{" "}
          <Button
            variant="link"
            onClick={() => navigate("/register")}
            className="text-green-700 hover:text-green-600"
          >
            Register Here
          </Button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
