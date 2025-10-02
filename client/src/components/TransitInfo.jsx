import React, { useEffect, useState } from "react";
import transitService from "../services/transitService";
import { useSettings } from "./SettingContent";

const TransitInfo = ({ location }) => {
  const [stops, setStops] = useState([]);
  const [arrivals, setArrivals] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const settings = useSettings();

  useEffect(() => {
    if (!location) return;

    const fetchStops = async () => {
      setLoading(true);
      try {
        const nearbyStops = await transitService.getNearbyStops(
          location.lat,
          location.lon,
          500
        );
        setStops(nearbyStops.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch transit stops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, [location]);

  const handleStopClick = async (stop) => {
    setSelectedStop(stop);
    try {
      const stopArrivals = await transitService.getStopArrivals(stop.id);
      setArrivals((prev) => ({ ...prev, [stop.id]: stopArrivals }));
    } catch (error) {
      console.error("Failed to fetch arrivals:", error);
    }
  };

  const getStopIcon = (type) => {
    switch (type) {
      case "station":
        return "🚉";
      case "tram_stop":
        return "🚊";
      case "bus_stop":
        return "🚌";
      default:
        return "🚏";
    }
  };

  const formatArrivalTime = (time) => {
    const now = new Date();
    const arrival = new Date(time);
    const diffMinutes = Math.round((arrival - now) / 60000);

    if (diffMinutes < 1) return "Now";
    if (diffMinutes < 60) return `${diffMinutes} min`;
    return arrival.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        className={`${
          settings?.theme === "dark" ? "bg-slate-800" : "bg-white"
        } p-4 rounded-lg shadow-md`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (stops.length === 0) return null;

  return (
    <div
      className={`${
        settings?.theme === "dark" ? "bg-slate-800" : "bg-white"
      } p-4 rounded-lg shadow-md mb-4`}
    >
      <h3
        className={`text-lg font-semibold mb-3 ${
          settings?.theme === "dark" ? "text-slate-200" : "text-slate-900"
        }`}
      >
        Nearby Transit
      </h3>

      <div className="space-y-2">
        {stops.map((stop) => (
          <div
            key={stop.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedStop?.id === stop.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : settings?.theme === "dark"
                ? "border-slate-600 hover:border-slate-500"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleStopClick(stop)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <span className="text-2xl">{getStopIcon(stop.type)}</span>
                <div>
                  <h4
                    className={`font-semibold ${
                      settings?.theme === "dark"
                        ? "text-slate-200"
                        : "text-slate-900"
                    }`}
                  >
                    {stop.name}
                  </h4>
                  {stop.routes && stop.routes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {stop.routes.map((route, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        >
                          {route}
                        </span>
                      ))}
                    </div>
                  )}
                  {stop.operator && (
                    <p
                      className={`text-xs mt-1 ${
                        settings?.theme === "dark"
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                    >
                      {stop.operator}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {selectedStop?.id === stop.id && arrivals[stop.id] && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                <h5
                  className={`text-sm font-semibold mb-2 ${
                    settings?.theme === "dark"
                      ? "text-slate-300"
                      : "text-gray-700"
                  }`}
                >
                  Next Arrivals
                </h5>
                {arrivals[stop.id].length === 0 ? (
                  <p
                    className={`text-xs ${
                      settings?.theme === "dark"
                        ? "text-slate-400"
                        : "text-gray-500"
                    }`}
                  >
                    No real-time data available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {arrivals[stop.id].slice(0, 3).map((arrival, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center"
                      >
                        <span
                          className={`text-sm ${
                            settings?.theme === "dark"
                              ? "text-slate-300"
                              : "text-gray-700"
                          }`}
                        >
                          {arrival.route} → {arrival.destination}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            arrival.isRealtime
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {formatArrivalTime(arrival.arrivalTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransitInfo;
