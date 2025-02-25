import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import logo from "../assets/logo.png";

const baseURL = import.meta.env.VITE_API_URL || "";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/merchant");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const loginData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await axios.post(`${baseURL}/merchant-login`, loginData);
      if (response.data.status === "ok") {
        const { token, vendor } = response.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("isMerchantAuth", "true");
        localStorage.setItem("vendorId", vendor._id);
        navigate("/merchant");
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <img src={logo} alt="PSLBNG Logo" className="h-24" />
        <div className="w-full max-w-md p-8 m-8 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back to Pasalubong!</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="mt-2" />
            </div>
            <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required className="mt-2" />
            </div>
            <Button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl transition duration-300" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
            </Button>
            </form>
            <p className="mt-6 text-center text-gray-600">
            New to Pasalubong? 
            <Button variant="link" onClick={() => navigate("/register")} className="text-green-700 hover:text-green-600">Register Here</Button>
            </p>
        </div>
    </div>

  );
};

export default LoginPage;