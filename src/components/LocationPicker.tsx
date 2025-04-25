// Import necessary libraries and components
import React, { useState } from "react";
// React Leaflet components for map rendering
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
// Leaflet styles for proper map display
import "leaflet/dist/leaflet.css";
// Leaflet core library (used internally)
import L from "leaflet";

// Define the props for the LocationPicker component
// `onLocationSelect` is a function passed in from the parent that receives selected coordinates
interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

// Main functional component that allows user to pick a location on the map
const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect }) => {
  // State to store the currently selected position (latitude, longitude)
  const [position, setPosition] = useState<[number, number] | null>(null);

  // Internal component to handle map click events and show a marker
  const LocationMarker = () => {
    // Hook to access map events, like click
    useMapEvents({
      // On map click, get the lat/lng and update the state
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]); // Set marker on clicked position
        onLocationSelect(lat, lng); // Inform parent about the selected location
      },
    });

    // If a position is set, render a Marker on the map at that location
    return position ? <Marker position={position} /> : null;
  };

  // Function to use the user's current GPS location
  const handleUseCurrentLocation = () => {
    // Check if browser supports geolocation
    if (navigator.geolocation) {
      // Get current position from the browser
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]); // Set the marker to the current location
        onLocationSelect(latitude, longitude); // Send the coordinates to the parent
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Return the full UI
  return (
    <div>
      {/* Button to get user's current location */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        className="mb-4 p-2 bg-blue-500 text-white rounded"
      >
        Use Current Location
      </button>

      {/* Leaflet Map */}
      <MapContainer
        whenReady={() => {
          // NOTE: This code tries to initialize a new map manually, which is unnecessary
          // because MapContainer already handles it. This block can actually be removed.
          const map = L.map('map').setView([0, 0], 2);
        }}
        style={{ width: "100%", height: "400px" }}
      >
        {/* OpenStreetMap tile layer to show the map tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Component to handle map clicks and display a marker */}
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
