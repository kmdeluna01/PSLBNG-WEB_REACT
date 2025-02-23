import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { vendorAuth } from "@/services/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useMapEvents } from "react-leaflet/hooks";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import logo from "../assets/logo.png";
import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL || '';

// Fix for default marker icon
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
  const [location, setLocation] = useState<LocationMarker | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [activeTab, setActiveTab] = useState("login");

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

  useEffect(() => {
    setMapKey((prevKey) => prevKey + 1);
  }, [location]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const isRegister = (e.currentTarget.getAttribute('data-form-type') === 'register');

    try {
      if (isRegister) {
        const registerData = {
          name: formData.get('shopName') as string,
          email: formData.get('registerEmail') as string,
          number: formData.get('phoneNumber') as string,
          location: {
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
          },
          password: formData.get('registerPassword') as string,
        };

        try {
          await axios.post(`${baseURL}/merchant-register`, registerData, {
            headers: { "Content-Type": "application/json" },
          });
          alert("Merchant registered successfully");
          navigate("/auth");
        } catch (error) {
          console.error("Registration Error:", error);
          alert("Something went wrong during registration.");
        } finally {
          setIsLoading(false);
        }

        await vendorAuth.register(registerData);
        toast({
          title: "Success",
          description: "Account created successfully! Please login.",
        });
      } else {
        try {
          const email = formData.get('email') as string
          const password = formData.get('password') as string
          const response = await axios.post(`${baseURL}/merchant-login`, { email, password });
        
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
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (!isUsingCurrentLocation) {
          setLocation({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          });
        }
      },
    });
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vendor-100">
      <div className="w-full max-w-4xl p-6 animate-fadeIn flex">
        {activeTab === "login" && (
          <div className="w-1/3 flex items-center justify-center p-4">
            <img src={logo} alt="PSLBNG Logo" className="h-auto" />
          </div>
        )}
        <div className={`flex flex-col h-full p-6 ${activeTab === "login" ? "w-2/3" : "w-full"}`}>
          <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSubmit} data-form-type="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" variant="custom" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleSubmit} data-form-type="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input id="shopName" name="shopName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" name="phoneNumber" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input id="registerEmail" name="registerEmail" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Password</Label>
                  <Input id="registerPassword" name="registerPassword" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="h-[300px] rounded-lg overflow-hidden border">
                    {location ? (
                      <MapContainer
                        key={mapKey}
                        className="h-full w-full"
                        center={[location.latitude, location.longitude]}
                        zoom={16}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[location.latitude, location.longitude] as L.LatLngExpression} />
                        <MapEvents />
                      </MapContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-accent/10">
                        <p>Loading your location...</p>
                      </div>
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
                </div>
                <Button type="submit" className="w-full" variant="custom" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;