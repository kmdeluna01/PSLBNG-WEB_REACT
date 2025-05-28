// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";  // Custom marker icon for map
import markerShadow from "leaflet/dist/images/marker-shadow.png"; // Custom marker shadow
import L from "leaflet";  // Leaflet library for map functionalities
import { toast } from '@/hooks/use-toast';  // Custom toast hook for notifications

// Base URL for the API, uses an environment variable or defaults to "api"
const baseURL = import.meta.env.VITE_API_URL || "api";

// Define a custom icon for the marker on the map
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Main component for editing merchant details
const MerchantDetails = () => {
  const [activeButton, setActiveButton] = useState("");  // State to track which button is active
  const navigate = useNavigate();  // Navigation hook for routing
  const [showModal, setShowModal] = useState(false);  // State to control the modal visibility
  const [name, setName] = useState("");  // State to store shop name
  const [permit, setPermit] = useState("");
  //console.log(permit);
  const [email, setEmail] = useState("");  // State to store email
  const [number, setNumber] = useState("");  // State to store phone number
  const [location, setLocation] = useState(null);  // State to store the location
  //console.log(location);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);  // Track if the user is using current location
  const [saving, setSaving] = useState(false);  // State to control saving status
  const [loading, setLoading] = useState(false);  // State to control loading status
  const [businessPermit, setBusinessPermit] = useState(null); // State for business permit file

  // Handle selecting current location
  const handleCurrentLocation = () => {
    setIsUsingCurrentLocation(true);
    setActiveButton("current");
    requestLocation();  // Call function to get location
  };

  // Handle selecting location by pin
  const handlePinLocation = () => {
    setIsUsingCurrentLocation(false);
    setActiveButton("pin");
    setShowModal(true);  // Show modal for pinning a location
  };

  useEffect(() => {
    getUserDetails();  // Fetch user details when the component mounts
  }, []);

  // Effect to request current location when the button is clicked
  useEffect(() => {
    if (isUsingCurrentLocation) {
      requestLocation();  // Request location if active
    }
  }, [isUsingCurrentLocation]);

  // Function to request the user's current location using the browser's geolocation API
  const requestLocation = () => {
    setLoading(true);
    setIsUsingCurrentLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);  // Log error if location fetch fails
        }
      );
    }
    setLoading(false);
  };

  // Map event to handle clicking on the map to set a new location
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });  // Set location based on click
      },
    });
    return null;  // Return null since we don't need anything to render here
  };

  // Fetch user details from the API
  const getUserDetails = async () => {
    const vendorId = localStorage.getItem("vendorId");  // Get vendor ID from local storage

    if (vendorId) {
      try {
        const res = await axios.get(`${baseURL}/profile/merchant/${vendorId}`);
        const profileDetails = res.data.data;

        // Set user details in state
        setName(profileDetails.name);
        setEmail(profileDetails.email);
        setNumber(profileDetails.number);
        setPermit(profileDetails.permit);
        // Only set location if valid
        if (profileDetails.location && profileDetails.location.latitude && profileDetails.location.longitude) {
          setLocation(profileDetails.location);
        } else {
          setLocation({ latitude: 51.505, longitude: -0.09 }); // Default location
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);  // Log error if request fails
      }
    }
  };

  // Handle saving the updated profile data
  const handleSave = async () => {
    setSaving(true);  // Set saving status to true
    const vendorId = localStorage.getItem("vendorId");
    console.log("location:", location);
    console.log("permit:", permit);

    // Check if all fields are filled out
    if (!name || !email || !number || !location) {
      return alert("Please fill in all fields and set a location.");
    }
    if (!permit) {
      alert("Please upload your Business Permit for verification.");
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("number", number);
    formData.append("latitude", location.latitude);
    formData.append("longitude", location.longitude);
    formData.append("permit", permit);

    try {
      // Send updated data to the API
      await axios.post(`${baseURL}/updateProfile/merchant/${vendorId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({
        title: "Success",
        description: "Profile edited successfully!",
      });
      navigate("/merchant");  // Navigate to the merchant profile page
      getUserDetails();  // Fetch updated details
    } catch (error) {
      console.error(error.response?.data);
      const errorMessage = error.response?.data?.message || "An unknown error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  // Handle deleting the user's account
  const handleDelete = async () => {
    if (window.confirm("Once you confirm, your PSLBNG account will be permanently deleted, but you can always create a new one!")) {
      try {
        const vendorId = localStorage.getItem("vendorId");
        if (vendorId) {
          // Send request to delete account
          await axios.delete(`${baseURL}/profile/merchant/${vendorId}`);
          localStorage.removeItem("vendorId");  // Remove vendor ID from local storage
          navigate("/login");  // Navigate to login page after account is deleted
        } else {
          console.error("User ID not found in localStorage");
        }
      } catch (error) {
        console.error("Error deleting account: ", error.response ? error.response.data : error.message);  // Log error if delete fails
      }
    }
  };

  return (
    <div className="min-h-screen">
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
        {/* Arrange name, email, and number fields in a single row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-gray-700">Shop Name</label>
            <input className="w-full px-4 py-2 border rounded-md" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shop Name" />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700">Email</label>
            <input className="w-full px-4 py-2 border rounded-md" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700">Phone Number</label>
            <input className="w-full px-4 py-2 border rounded-md" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Phone Number" type="tel" />
          </div>
        </div>

        <div>
          <label className="block text-gray-700">Business Permit (for verification)</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            className="w-full px-4 py-2 border rounded-md"
            onChange={e => setPermit(e.target.files[0])}
          />

          {/* Preview newly selected image (if it's not a string) */}
          {permit && typeof permit !== 'string' && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Preview:</p>
              {permit.type === 'application/pdf' ? (
                <p className="text-blue-600">PDF Selected: {permit.name}</p>
              ) : (
                <img
                  src={URL.createObjectURL(permit)}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded mx-auto"
                />
              )}
            </div>
          )}

          {/* Show saved permit (from database/profile) */}
          {!businessPermit && permit && typeof permit === 'string' && (
            <div className="mt-4 w-full">
              <p className="text-sm text-gray-600">Uploaded Permit:</p>
              {permit.match(/\.pdf$/i) ? (
                <a
                  href={permit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Uploaded Permit (PDF)
                </a>
              ) : (
                <img
                  src={permit}
                  alt="Business Permit"
                  className="w-full object-contain rounded-t-lg max-h-[600px]"
                />
              )}
            </div>
          )}
        </div>


        <div>
          <label className="block text-gray-700">Location</label>
          <div className="grid grid-cols-2 gap-4 mt-2 pb-4">
            <Button
              type="button"
              className={`w-full py-2 px-4 rounded-xl font-semibold text-white ${activeButton === "current" ? "bg-green-800 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"
                }`}
              onClick={handleCurrentLocation}
              disabled={activeButton === "current"}
            >
              Use Current Location
            </Button>

            <Button
              type="button"
              className={`w-full py-2 px-4 rounded-xl font-semibold text-white ${activeButton === "pin" ? "bg-green-800 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"
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
                {location && location.latitude !== undefined && location.longitude !== undefined && !loading ? (
                  <MapContainer
                    key={`${location.latitude}-${location.longitude}`}
                    center={[location.latitude, location.longitude]}
                    zoom={16}
                    className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker icon={customIcon} position={[location.latitude, location.longitude]} />
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
          onClick={handleSave}
          disabled={saving}
          className="w-auto mt-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          {saving ? "Saving..." : "Save"}
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