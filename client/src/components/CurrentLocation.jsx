import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useSettings } from "./SettingContent";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map centering when position changes
const MapController = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position && position[0] !== 40.7128) {
      // Only center if we have real location data
      map.setView(position, 15, { animate: true });
    }
  }, [map, position]);

  return null;
};

const CurrentLocationMap = () => {
  const [position, setPosition] = useState([40.7128, -74.006]); // Default to NYC
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const watchIdRef = useRef(null);
  const settings = useSettings();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setLoading(false);
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPosition);
        setAccuracy(pos.coords.accuracy);
        setLoading(false);
        setError("");
      },
      (err) => {
        let errorMessage = "Unable to get your location";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );

    // Watch position for updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPosition);
        setAccuracy(pos.coords.accuracy);
        setError("");
      },
      (err) => {
        console.warn("Watch position error:", err);
        // Don't show error for watch position failures, just log them
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative w-full h-56 rounded-lg shadow-md overflow-hidden mb-6 ${
        settings?.theme === "dark"
          ? "bg-slate-800 border-slate-600"
          : "bg-white border-slate-200"
      } border`}
    >
      {/* Loading State */}
      {loading && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 ${
            settings?.theme === "dark" ? "bg-slate-800/90" : "bg-white/90"
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p
              className={`text-sm ${
                settings?.theme === "dark" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Getting your location...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 ${
            settings?.theme === "dark" ? "bg-slate-800/90" : "bg-white/90"
          }`}
        >
          <div className="flex flex-col items-center space-y-3 p-4 text-center">
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div>
              <p
                className={`text-sm font-medium ${
                  settings?.theme === "dark"
                    ? "text-slate-200"
                    : "text-slate-800"
                }`}
              >
                Location Error
              </p>
              <p
                className={`text-xs ${
                  settings?.theme === "dark"
                    ? "text-slate-400"
                    : "text-slate-600"
                } mt-1`}
              >
                {error}
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                setError("");
                // Retry getting location
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const newPosition = [
                      pos.coords.latitude,
                      pos.coords.longitude,
                    ];
                    setPosition(newPosition);
                    setAccuracy(pos.coords.accuracy);
                    setLoading(false);
                    setError("");
                  },
                  (err) => {
                    let errorMessage = "Unable to get your location";
                    switch (err.code) {
                      case err.PERMISSION_DENIED:
                        errorMessage =
                          "Location access denied. Please enable location permissions.";
                        break;
                      case err.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                      case err.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                    }
                    setError(errorMessage);
                    setLoading(false);
                  },
                  { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <MapContainer
        center={position}
        zoom={position[0] !== 40.7128 ? 15 : 14} // Higher zoom for actual location
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={settings?.theme === "dark" ? 0.7 : 1}
          className={settings?.theme === "dark" ? "dark-map-tiles" : ""}
        />
        <MapController position={position} />
        <Marker position={position} icon={markerIcon} />
        <CircleMarker
          center={position}
          radius={8}
          pathOptions={{
            color: "#16a34a",
            fillColor: "#22c55e",
            fillOpacity: 0.8,
            weight: 2,
          }}
        />
        {/* Accuracy circle if available */}
        {accuracy && accuracy < 1000 && (
          <CircleMarker
            center={position}
            radius={Math.min(accuracy / 10, 50)} // Scale accuracy to reasonable radius
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              weight: 1,
              dashArray: "5, 5",
            }}
          />
        )}
      </MapContainer>

      {/* Location Info Overlay */}
      {!loading && !error && (
        <div
          className={`absolute bottom-2 left-2 ${
            settings?.theme === "dark" ? "bg-slate-800/90" : "bg-white/90"
          } rounded px-2 py-1 text-xs backdrop-blur-sm`}
        >
          <div
            className={`flex items-center space-x-1 ${
              settings?.theme === "dark" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Location</span>
            {accuracy && (
              <span
                className={`${
                  settings?.theme === "dark"
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                (±{Math.round(accuracy)}m)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentLocationMap;
