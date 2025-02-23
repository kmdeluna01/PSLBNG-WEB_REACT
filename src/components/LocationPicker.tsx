import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      },
    });

    return position ? (
      <Marker position={position} />
    ) : null;
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        onLocationSelect(latitude, longitude);
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        className="mb-4 p-2 bg-blue-500 text-white rounded"
      >
        Use Current Location
      </button>
      <MapContainer
        whenReady={() => {
          const map = L.map('map').setView([0, 0], 2);
        }}
        style={{ width: "100%", height: "400px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;