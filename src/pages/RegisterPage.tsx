// @ts-nocheck
// Import necessary libraries and components
import { useState, useEffect } from "react"; // Hooks for state management and side effects
import { Button } from "@/components/ui/button"; // Custom Button component
import { Input } from "@/components/ui/input"; // Custom Input component
import { Label } from "@/components/ui/label"; // Custom Label component
import { useNavigate } from "react-router-dom"; // For navigation between routes
import { toast } from "@/hooks/use-toast"; // Custom toast notifications
import axios from "axios"; // HTTP client to make API requests
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"; // For displaying maps with Leaflet
import "leaflet/dist/leaflet.css"; // Leaflet CSS for map styling
import logo from "../assets/logo.png"; // Import logo for the page
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"; // High-res marker icon for Retina displays
import L from "leaflet"; // Leaflet library
import markerIcon from "leaflet/dist/images/marker-icon.png"; // Regular marker icon
import markerShadow from "leaflet/dist/images/marker-shadow.png"; // Marker shadow for the icon
const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;

// Custom icon settings for map markers
const customIcon = new L.Icon({
  iconUrl: markerIcon, // URL of the marker icon
  shadowUrl: markerShadow, // URL of the shadow for the marker
  iconSize: [25, 41], // Size of the icon
  iconAnchor: [12, 41], // Point where the icon is anchored
  popupAnchor: [1, -34], // Popup position relative to the icon
  shadowSize: [41, 41], // Size of the shadow
});

// Set default options for Leaflet's marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x, // High-res icon for retina displays
  iconUrl: markerIcon, // Standard icon
  shadowUrl: markerShadow, // Shadow for the icon
});

// Base URL for API requests
const baseURL = import.meta.env.VITE_API_URL || "";

// RegisterPage component for rendering the registration page
const RegisterPage = () => {
  const navigate = useNavigate(); // Hook to handle navigation between routes
  const [location, setLocation] = useState(null); // State for storing the user's location
  const [isLoading, setIsLoading] = useState(false); // State to manage loading state
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [activeButton, setActiveButton] = useState(""); // State for active button tracking
  const [emailError, setEmailError] = useState(""); // State for email validation error
  const [phoneError, setPhoneError] = useState(""); // State for phone validation error
  const [password, setPassword] = useState(""); // State for storing the password
  const [passwordError, setPasswordError] = useState(""); // State for password mismatch error

  // Handle password input change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value); // Update password state
  };

  // Handle password confirmation input change
  const handleVerifyPasswordChange = (e) => {
    if (password && e.target.value !== password) {
      setPasswordError("Passwords do not match"); // Show error if passwords don't match
    } else {
      setPasswordError(""); // Clear error if passwords match
    }
  };

  // Handle email input validation
  const handleEmailValidation = (e) => {
    const email = e.target.value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Email regex

    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address (e.g., merchant@pslbng.com)"); // Set error message
    } else {
      setEmailError(""); // Clear error if valid email
    }
  };

  const handleAddressInput = async (e) => {
    const address = e.target.value;
    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&format=json`
      );

      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setLocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
        console.log("Coordinates:", lat, lon);
      } else {
        console.warn("No results from LocationIQ.");
      }
    } catch (err) {
      console.error("Geocoding error (LocationIQ):", err);
    }
  };


  // Handle phone number input validation
  const handlePhoneValidation = (e) => {
    const phone = e.target.value;
    if (!/^09\d{9}$/.test(phone)) {
      setPhoneError("Please follow the format (09XX XXXX XXX)"); // Set error if phone is invalid
    } else {
      setPhoneError(""); // Clear error if valid
    }
  };

  // Handle the action of using the current location
  const handleCurrentLocation = () => {
    setActiveButton("current"); // Set active button to 'current'
    requestLocation(); // Request the current location
  };

  // Handle the action of pinning a location on the map
  const handlePinLocation = () => {
    setActiveButton("pin"); // Set active button to 'pin'
    setShowModal(true); // Show the modal for location pinning
  };

  // Request user's current location on page load
  useEffect(() => {
    requestLocation(); // Call the function to get the user's location
  }, []);

  // Request the user's current geolocation using the browser API
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude, // Store latitude
            longitude: position.coords.longitude, // Store longitude
          });
        },
        (error) => console.error("Error getting location:", error) // Handle location error
      );
    }
  };

  // Handle map events, such as clicking to pin a location
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng }); // Update location on click
      },
    });
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true); // Set loading state
    const formData = new FormData(e.currentTarget); // Collect form data

    try {
      const password = formData.get("registerPassword"); // Get the password
      const verifyPassword = formData.get("verifyPassword"); // Get the confirmed password

      // Check if passwords match
      if (password !== verifyPassword) {
        throw new Error("Passwords do not match"); // Show error if passwords don't match
      }

      const registerData = {
        name: formData.get("shopName"), // Shop name
        email: formData.get("registerEmail"), // Email address
        number: formData.get("phoneNumber"), // Phone number
        location: { latitude: location?.latitude || 0, longitude: location?.longitude || 0 }, // User's location
        password: formData.get("registerPassword"), // Password
      };

      // Send registration data to the backend
      await axios.post(`${baseURL}/merchant-register`, registerData);
      toast({ title: "Success", description: "Account created successfully!" }); // Show success message
      navigate("/"); // Navigate to home page
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.message || "An error occurred", variant: "destructive" }); // Show error message
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };


  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex flex-col justify-center w-full max-w-4xl p-8 bg-white shadow-lg rounded-xl">
        <div className="flex justify-center mt-6">
          <img src={logo} alt="Pasalubong Logo" className="max-w-xs" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input id="shopName" name="shopName" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="registerEmail">Email</Label>
              <Input
                id="registerEmail"
                name="registerEmail"
                type="email"
                required
                className="mt-2"
                onInput={handleEmailValidation}
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              required
              maxLength={11}
              placeholder="09XX XXX XXXX"
              className="mt-2"
              onInput={handlePhoneValidation}
            />
            {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="registerPassword">Password</Label>
              <Input
                id="registerPassword"
                name="registerPassword"
                type="password"
                required
                className="mt-2"
                onInput={handlePasswordChange}
              />
            </div>
            <div>
              <Label htmlFor="verifyPassword">Repeat Password</Label>
              <Input
                id="verifyPassword"
                name="verifyPassword"
                type="password"
                required
                className="mt-2"
                onInput={handleVerifyPasswordChange}
              />
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            </div>
          </div>

          <div>
            <div>
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                name="address"
                placeholder="e.g. 123 Rizal St, Pagbilao, Quezon"
                className="mt-2"
                onInput={handleAddressInput} // optional handler if you want to geocode later
              />
            </div>
            <Label>Location</Label>
            {!showModal && (
              <div className="h-[300px] rounded-lg overflow-hidden border">
                {location ? (
                  <MapContainer
                    key={`${location?.latitude}-${location?.longitude}`}
                    center={[location.latitude, location.longitude]}
                    zoom={16}
                    className="h-full w-full"
                  >
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
            <div className="grid grid-cols-2 gap-4 mt-2">
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
    </div>
  );
};

export default RegisterPage;
