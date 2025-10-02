import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useSettings } from "./SettingContent";
import offlineManager from "../utils/offlineManager";

// Component to fit map to bounds
function FitBounds({ bbox }) {
  const map = useMap();

  useEffect(() => {
    if (bbox && Array.isArray(bbox) && bbox.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      const bounds = [
        [minLat, minLon],
        [maxLat, maxLon],
      ];
      map.fitBounds(bounds, { padding: [10, 10] });
    }
  }, [map, bbox]);

  return null;
}

const MapPreview = ({ bbox, name, className = "", onClick }) => {
  const settings = useSettings();
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const mapRef = useRef(null);

  // Generate static map preview URL using OpenStreetMap static map services
  const generatePreviewUrl = (bbox, width = 300, height = 200) => {
    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) return null;

    const [minLon, minLat, maxLon, maxLat] = bbox;
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    // Calculate appropriate zoom level based on bbox size
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);

    let zoom = 10;
    if (maxDiff < 0.01) zoom = 15;
    else if (maxDiff < 0.05) zoom = 13;
    else if (maxDiff < 0.1) zoom = 12;
    else if (maxDiff < 0.5) zoom = 10;
    else if (maxDiff < 1) zoom = 9;
    else if (maxDiff < 2) zoom = 8;
    else zoom = 7;

    // Use a free static map service (like StaticMapLite or similar)
    // For demo purposes, we'll try multiple services with fallbacks
    const services = [
      // OpenStreetMap Static Map service (if available)
      `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLon}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik`,
      // Alternative: MapQuest (requires API key in production)
      `https://www.mapquestapi.com/staticmap/v5/map?key=consumer_key&center=${centerLat},${centerLon}&zoom=${zoom}&size=${width},${height}&type=map`,
      // Alternative: LocationIQ (free tier available)
      `https://maps.locationiq.com/v3/staticmap?key=demo&center=${centerLat},${centerLon}&zoom=${zoom}&size=${width}x${height}&format=png`,
    ];

    // Return the first service URL (in production, you'd want to try them with fallbacks)
    return services[0];
  };

  // Check offline status and cached data availability
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    // Listen for online/offline events
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    // Check if we have cached tiles for this area
    const checkOfflineData = async () => {
      if (bbox && Array.isArray(bbox) && bbox.length === 4) {
        try {
          // Check if tiles are cached by trying to access the cache
          const cache = await caches.open("map-tiles");
          const [minLon, minLat, maxLon, maxLat] = bbox;
          const centerLat = (minLat + maxLat) / 2;
          const centerLon = (minLon + maxLon) / 2;

          // Check for a few sample tiles at different zoom levels
          const sampleTiles = [
            {
              z: 10,
              x: Math.floor(((centerLon + 180) / 360) * Math.pow(2, 10)),
              y: Math.floor(
                ((1 -
                  Math.log(
                    Math.tan((centerLat * Math.PI) / 180) +
                      1 / Math.cos((centerLat * Math.PI) / 180)
                  ) /
                    Math.PI) /
                  2) *
                  Math.pow(2, 10)
              ),
            },
            {
              z: 12,
              x: Math.floor(((centerLon + 180) / 360) * Math.pow(2, 12)),
              y: Math.floor(
                ((1 -
                  Math.log(
                    Math.tan((centerLat * Math.PI) / 180) +
                      1 / Math.cos((centerLat * Math.PI) / 180)
                  ) /
                    Math.PI) /
                  2) *
                  Math.pow(2, 12)
              ),
            },
          ];

          // Check if at least one sample tile exists
          let hasData = false;
          for (const tile of sampleTiles) {
            const tileUrl = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
            const cachedTile = await cache.match(tileUrl);
            if (cachedTile) {
              hasData = true;
              break;
            }
          }

          setHasOfflineData(hasData);
        } catch (error) {
          setHasOfflineData(false);
        }
      }
      setLoading(false);
    };

    checkOfflineData();

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [bbox]);

  useEffect(() => {
    if (bbox && !isOffline) {
      // When online, we can try static map services or use interactive map
      setLoading(false);

      // Uncomment below to try static map services when online
      /*
      const previewUrl = generatePreviewUrl(bbox, 300, 200);
      if (previewUrl) {
        const img = new Image();
        img.onload = () => {
          setImageUrl(previewUrl);
          setLoading(false);
        };
        img.onerror = () => {
          setLoading(false);
        };
        img.src = previewUrl;
      } else {
        setLoading(false);
      }
      */
    }
  }, [bbox, isOffline]);

  // If we have a working image URL, show it
  if (imageUrl) {
    return (
      <div
        className={`relative overflow-hidden cursor-pointer ${className}`}
        onClick={onClick}
      >
        <img
          src={imageUrl}
          alt={name || "Map preview"}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
      </div>
    );
  }

  // Show offline indicator when offline and no cached data
  if (isOffline && !hasOfflineData) {
    return (
      <div
        className={`${
          settings?.theme === "dark" ? "bg-slate-700" : "bg-gray-100"
        } flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <div
          className={`text-center ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-400"
          }`}
        >
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z"
            />
          </svg>
          <span className="text-sm">Offline</span>
          <div className="text-xs mt-1 opacity-75">No cached data</div>
        </div>
      </div>
    );
  }

  // Fallback to interactive map preview
  if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
    return (
      <div
        className={`${
          settings?.theme === "dark" ? "bg-slate-700" : "bg-gray-100"
        } flex items-center justify-center ${className}`}
      >
        <div
          className={`text-center ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-400"
          }`}
        >
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="text-sm">Map Preview</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden cursor-pointer ${className}`}
      onClick={onClick}
    >
      <MapContainer
        ref={mapRef}
        center={[(bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2]}
        zoom={10}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        keyboard={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={settings?.theme === "dark" ? 0.7 : 1}
          className={settings?.theme === "dark" ? "dark-map-tiles" : ""}
        />
        <FitBounds bbox={bbox} />
      </MapContainer>

      {/* Overlay for hover effect */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 pointer-events-none" />

      {/* Status indicators */}
      <div className="absolute bottom-2 left-2 flex space-x-2">
        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
          Preview
        </div>
        {isOffline && hasOfflineData && (
          <div className="bg-green-600/80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>Offline</span>
          </div>
        )}
        {!isOffline && (
          <div className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            <span>Online</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPreview;
