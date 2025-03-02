import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import logo from "../assets/logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useMapEvents } from "react-leaflet/hooks";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const baseURL = import.meta.env.VITE_API_URL || "";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

interface LocationMarker {
  latitude: number;
  longitude: number;
}


const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [location, setLocation] = useState<LocationMarker | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/merchant");
    }
  }, [navigate]);

  useEffect(() => {
    if (isUsingCurrentLocation) {
      requestLocation();
    }
  }, [isUsingCurrentLocation]);

  const validatePassword = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      },
    });
    return null;
  };


  const handleSubmit = async (e, formType) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (formType === "register") {
        const password = formData.get("registerPassword");
        const verifyPassword = formData.get("verifyPassword");
        const phoneNumber = formData.get("phoneNumber")?.toString();

        if (password !== verifyPassword) {
          throw new Error("Passwords do not match");
        }

        if (!validatePassword(password)) {
          throw new Error("Password must be at least 8 characters, include an uppercase letter and a number.");
        }

        if (!/^\d{10,15}$/.test(phoneNumber)) {
          throw new Error("Invalid phone number. Must be 10-15 digits.");
        }

        const registerData = {
          name: formData.get("shopName"),
          email: formData.get("registerEmail"),
          number: formData.get("phoneNumber"),
          location: {
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
          },
          password: formData.get("registerPassword"),
        };

        await axios.post(`${baseURL}/merchant-register`, registerData);
        toast({ title: "Success", description: "Account created successfully!" });
        setActiveTab("login");
      } else {
        const loginData = {
          email: formData.get("email"),
          password: formData.get("password"),
        };

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-6 flex overflow-hidden">
        <div className="w-1/2 hidden lg:flex items-center justify-center">
          <img src={logo} alt="PSLBNG Logo" className="h-24" />
        </div>
        <div className="w-full lg:w-1/2 p-6">
          <div className="flex justify-center mb-6">
            <Button
              variant={activeTab === "login" ? "default" : "outline"}
              onClick={() => setActiveTab("login")}
              className="w-1/2"
            >
              Login
            </Button>
            <Button
              variant={activeTab === "register" ? "default" : "outline"}
              onClick={() => setActiveTab("register")}
              className="w-1/2"
            >
              Register
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={(e) => handleSubmit(e, "login")}>                    
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required className="mb-4" />
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required className="mb-6" />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={(e) => handleSubmit(e, "register")}>
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input id="shopName" name="shopName" required className="mb-4" />
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    id="phoneNumber" 
                    name="phoneNumber" 
                    required 
                    className="mb-4" 
                    defaultValue="+63" 
                    maxLength={13} 
                    pattern="\+63\d{10}"
                    placeholder="+63XXXXXXXXXX"
                  />
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input id="registerEmail" name="registerEmail" type="email" required className="mb-4" />
                  <Label htmlFor="registerPassword">Password</Label>
                  <Input id="registerPassword" name="registerPassword" type="password" required className="mb-6" />
                  <Label htmlFor="registerPassword">Repeat Password</Label>
                  <Input id="verifyPassword" name="verifyPassword" type="password" required className="mb-6" />
                  <Label>Location</Label>
                  <div className="h-[300px] rounded-lg overflow-hidden border mb-4">
                    {location && location.latitude && location.longitude ? (
                      <MapContainer 
                        center={[location.latitude, location.longitude]} 
                        zoom={16} 
                        className="h-full w-full"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[location.latitude, location.longitude]} />
                        <MapEvents />
                      </MapContainer>
                    ) : (
                      <p>Loading map...</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Button
                      type="button"
                      variant="custom"
                      onClick={() => {
                        setIsUsingCurrentLocation(true);
                        requestLocation();
                      }}
                    >
                      Use Current Location
                    </Button>
                    <Button
                      type="button"
                      variant="custom"
                      onClick={() => setIsUsingCurrentLocation(false)}
                    >
                      Pin a New Location
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;