import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import L from "leaflet";
import { toast } from '@/hooks/use-toast';


const baseURL = import.meta.env.VITE_API_URL || "api";

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41], 
  iconAnchor: [12, 41], 
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MerchantDetails = () => {
  const [activeButton, setActiveButton] = useState("");

  const handleCurrentLocation = () => {
      setActiveButton("current");
      requestLocation();
  };

  const handlePinLocation = () => {
      setActiveButton("pin");
      setShowModal(true);
  };

  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [location, setLocation] = useState(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      },
    });
    return null;
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
                  <Button
                      type="button"
                      className={`w-full py-2 px-4 rounded-xl font-semibold text-white ${
                          activeButton === "current" ? "bg-green-800 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"
                      }`}
                      onClick={handleCurrentLocation}
                      disabled={activeButton === "current"}
                  >
                      Use Current Location
                  </Button>

                  <Button
                      type="button"
                      className={`w-full py-2 px-4 rounded-xl font-semibold text-white ${
                          activeButton === "pin" ? "bg-green-800 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"
                      }`}
                      onClick={handlePinLocation}
                      disabled={activeButton === "pin"}
                  >
                      Pin a Location
                  </Button>
              </div>
                <div className="h-[300px] rounded-lg overflow-hidden border">
                  {!showModal && (
                    <div className="h-[300px] rounded-lg overflow-hidden border">
                      {location ? (
                        <MapContainer 
                        key={`${location?.latitude}-${location?.longitude}`} 
                        center={[location.latitude, location.longitude]} 
                        zoom={16}
                        className="h-full w-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {location && (
                        <Marker icon={customIcon} position={[location.latitude, location.longitude]} />
                        )}
                        <MapEvents />
                        </MapContainer>
                        ) : (
                        <p className="flex items-center justify-center h-full">Loading map...</p>
                        )}
                      </div>
                    )}
                </div>
                
            </div>
        </div>
        <div className="flex flex-row justify-between">
        <button 
            onClick={handleUploadProduct}
            disabled={isUploading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
            <button className="w-auto mt-6 bg-red-600 hover:bg-green-700 text-white px-4 py-2 rounded-md" onClick={handleDelete}>Delete Account</button>
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <h2 className="text-xl font-bold mb-4">Pin Your Location</h2>
              <div className="h-[400px]">
                <MapContainer 
                key={`${location?.latitude}-${location?.longitude}`} 
                center={[location.latitude, location.longitude]} 
                zoom={16} className="h-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {location && <Marker icon={customIcon} position={[location.latitude, location.longitude]} />}
                  <MapEvents />
                </MapContainer>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button className="bg-gray-700 hover:bg-gray-600 text-white" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="bg-green-700 hover:bg-green-600 text-white" onClick={() => setShowModal(false)}>Confirm Location</Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default MerchantDetails;