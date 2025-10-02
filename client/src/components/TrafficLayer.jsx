import React, { useEffect, useState } from "react";
import { Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import trafficService from "../services/trafficService";

const TrafficLayer = ({ routeCoordinates, bounds }) => {
  const [trafficFlow, setTrafficFlow] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) return;

    const fetchTrafficData = async () => {
      setLoading(true);
      try {
        const flowData = await trafficService.getTrafficFlow(routeCoordinates);
        setTrafficFlow(flowData);

        if (bounds) {
          const bbox = [
            bounds._southWest.lng,
            bounds._southWest.lat,
            bounds._northEast.lng,
            bounds._northEast.lat,
          ];
          const incidentData = await trafficService.getTrafficIncidents(bbox);
          setIncidents(incidentData);
        }
      } catch (error) {
        console.error("Failed to fetch traffic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficData();

    const interval = setInterval(fetchTrafficData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [routeCoordinates, bounds]);

  const getTrafficColor = (segment) => {
    if (!segment.currentSpeed || !segment.freeFlowSpeed) {
      return "#3b82f6";
    }

    const ratio = segment.currentSpeed / segment.freeFlowSpeed;

    if (ratio > 0.8) return "#22c55e";
    if (ratio > 0.5) return "#eab308";
    if (ratio > 0.3) return "#f97316";
    return "#ef4444";
  };

  const incidentIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMjEuNzMgMTgtOC0xNGEyIDIgMCAwIDAtMy40OCAwbC04IDE0QTIgMiAwIDAgMCA0IDIxaDE2YTIgMiAwIDAgMCAxLjczLTN6Ii8+PGxpbmUgeDE9IjEyIiB5MT0iOSIgeDI9IjEyIiB5Mj0iMTMiLz48bGluZSB4MT0iMTIiIHkxPSIxNyIgeDI9IjEyLjAxIiB5Mj0iMTciLz48L3N2Zz4=",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

  return (
    <>
      {trafficFlow?.segments?.map((segment, index) => (
        <Polyline
          key={`traffic-${index}`}
          positions={segment.coordinates.map((c) => [c[1], c[0]])}
          color={getTrafficColor(segment)}
          weight={6}
          opacity={0.7}
        />
      ))}

      {incidents.map((incident, index) => {
        const coords = incident.geometry?.coordinates || incident.location;
        if (!coords) return null;

        const lat = coords[1] || coords.lat;
        const lon = coords[0] || coords.lon;

        return (
          <Marker
            key={`incident-${index}`}
            position={[lat, lon]}
            icon={incidentIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-red-600">
                  {incident.properties?.iconCategory || "Traffic Incident"}
                </h3>
                <p className="text-sm mt-1">
                  {incident.properties?.events?.[0]?.description ||
                    "Traffic disruption"}
                </p>
                {incident.properties?.delay && (
                  <p className="text-xs text-gray-600 mt-1">
                    Delay: {Math.round(incident.properties.delay / 60)} min
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {trafficFlow && (
        <div className="leaflet-bottom leaflet-right">
          <div className="leaflet-control bg-white dark:bg-slate-800 p-3 rounded shadow-lg">
            <h4 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Traffic Flow
            </h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Free Flow
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-yellow-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Moderate
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-orange-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Slow
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-red-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Congested
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrafficLayer;
