// RegisterPage.js
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import logo from "../assets/logo.png";

const baseURL = import.meta.env.VITE_API_URL || "";

// Fix marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (isUsingCurrentLocation) {
      requestLocation();
    }
  }, [isUsingCurrentLocation]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.error("Error getting location:", error)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
        const password = formData.get("registerPassword");
        const verifyPassword = formData.get("verifyPassword");
        
        if (password !== verifyPassword) {
            throw new Error("Passwords do not match");
          }

        const registerData = {
        name: formData.get("shopName"),
        email: formData.get("registerEmail"),
        number: formData.get("phoneNumber"),
        location: { latitude: location?.latitude || 0, longitude: location?.longitude || 0 },
        password: formData.get("registerPassword"),
      };

      await axios.post(`${baseURL}/merchant-register`, registerData);
      toast({ title: "Success", description: "Account created successfully!" });
      navigate("/");
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex flex-col justify-center w-full max-w-4xl p-8 bg-white shadow-lg rounded-xl">
        <div className="flex justify-center mt-6">
          <img src={logo} alt="Pasalubong Logo" className="max-w-xs" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="shopName">Shop Name</Label>
            <Input id="shopName" name="shopName" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" required maxLength={11} pattern="09\d{9}" placeholder="09XX XXX XXXX" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="registerEmail">Email</Label>
            <Input id="registerEmail" name="registerEmail" type="email" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="registerPassword">Password</Label>
            <Input id="registerPassword" name="registerPassword" type="password" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="verifyPassword">Repeat Password</Label>
            <Input id="verifyPassword" name="verifyPassword" type="password" required className="mt-2" />
          </div>
          <div>
            <Label>Location</Label>
            <div className="h-[300px] rounded-lg overflow-hidden border">
              {location ? (
                <MapContainer center={[location.latitude, location.longitude]} zoom={16} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[location.latitude, location.longitude]} />
                  <MapEvents />
                </MapContainer>
              ) : (
                <p className="flex items-center justify-center h-full">Loading map...</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Button type="button" className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl" onClick={() => requestLocation()}>Use Current Location</Button>
              <Button type="button" className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl" onClick={() => setShowModal(true)}>Pin a Location</Button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-center">
          Already have an account? <Button variant="link" className="text-green-700 hover:text-green-600" onClick={() => navigate("/")}>Login</Button>
        </p>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <h2 className="text-xl font-bold mb-4">Pin Your Location</h2>
              <div className="h-[400px]">
                <MapContainer center={[location?.latitude || 14.5995, location?.longitude || 120.9842]} zoom={14} className="h-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[location?.latitude, location?.longitude]} />
                  <MapEvents />
                </MapContainer>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={() => setShowModal(false)}>Confirm Location</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
