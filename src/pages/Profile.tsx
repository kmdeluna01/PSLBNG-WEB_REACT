import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from '@/hooks/use-toast';

const baseURL = import.meta.env.VITE_API_URL || "api";

const MerchantDetails = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [location, setLocation] = useState(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);

  useEffect(() => {
    getUserDetails();
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
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const getUserDetails = async () => {
    const vendorId = localStorage.getItem("vendorId");

    if (vendorId) {
      try {
        const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
        const profileDetails = res.data.data;

        setName(profileDetails.name);
        setEmail(profileDetails.email);
        setNumber(profileDetails.number);
        setLocation(profileDetails.location || { latitude: 51.505, longitude: -0.09 });
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  };

  const handleSave = async () => {
    const vendorId = localStorage.getItem("vendorId");

    if (!name || !email || !number || !location) {
      return alert("Please fill in all fields and set a location.");
    }

    const updatedData = {
      name,
      email,
      number,
      location,
    };

    try {
        await axios.post(`${baseURL}/updateProfile/merchant/${vendorId}`, updatedData);
        toast({
            title: "Success",
            description: "Profile edited successfully!",
          });
        navigate(-1);
        getUserDetails();
      } catch (error) {
        console.error(error);
        toast({
            title: "Error",
            description: "Editing Profile Unsuccessful!",
            variant: "destructive"
        });
      }
  };

  const handleDelete = async () => {
    if (window.confirm("Once you confirm, your PSLBNG account will be permanently deleted, but you can always create a new one!")) {
      try {
        const vendorId = localStorage.getItem("vendorId");
        if (vendorId) {
          await axios.delete(`${baseURL}/profile/merchant/${vendorId}`);
          localStorage.removeItem("vendorId");
          navigate("/login");
        } else {
          console.error("User ID not found in localStorage");
        }
      } catch (error) {
        console.error("Error deleting account: ", error.response ? error.response.data : error.message);
      }
    }
  };

  const LocationSelector = () => {
    useMapEvents({
      click(e) {
        setLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      },
    });
    return location ? <Marker position={[location.latitude, location.longitude]} /> : null;
  };

  return (
    <div className="mx-auto">
        <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
        </div>

        <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 flex items-center justify-center bg-green-500 text-white text-2xl font-bold rounded-full">
            {name?.[0]}
            </div>
            <div>
            <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
            <p className="text-gray-500">{number}</p>
            </div>
        </div>

        <div className="space-y-4">
            <div>
            <label className="block text-gray-700">Shop Name</label>
            <input className="w-full px-4 py-2 border rounded-md" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shop Name" />
            </div>

            <div>
            <label className="block text-gray-700">Email</label>
            <input className="w-full px-4 py-2 border rounded-md" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            </div>

            <div>
            <label className="block text-gray-700">Phone Number</label>
            <input className="w-full px-4 py-2 border rounded-md" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Phone Number" type="tel" />
            </div>

            <div>
                <label className="block text-gray-700">Location</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-md" onClick={() => {
                    setIsUsingCurrentLocation(true);
                    requestLocation();
                    }}>Use Current Location</button>
                    <button className="bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md" onClick={() => setIsUsingCurrentLocation(false)}>Pin a New Location</button>
                </div>
                <div className="h-[300px] rounded-lg overflow-hidden border">
                    {location ? (
                    <MapContainer center={[location.latitude, location.longitude]} zoom={16} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationSelector />
                    </MapContainer>
                    ) : (
                    <div className="h-full flex items-center justify-center bg-accent/10">
                        <p>Fetching Location...</p>
                    </div>
                    )}
                </div>
                
            </div>
        </div>
        <div className="flex flex-row justify-between">
            <button className="w-auto mt-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md" onClick={handleSave}>Save</button>
            <button className="w-auto mt-6 bg-red-600 hover:bg-green-700 text-white px-4 py-2 rounded-md" onClick={handleDelete}>Delete Account</button>
        </div>
    </div>
  );
};

export default MerchantDetails;