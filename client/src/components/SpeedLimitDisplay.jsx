import React, { useEffect, useState } from "react";
import speedLimitService from "../services/speedLimitService";
import { useSettings } from "./SettingContent";

const SpeedLimitDisplay = ({ currentLocation, currentSpeed }) => {
  const [speedLimit, setSpeedLimit] = useState(null);
  const [loading, setLoading] = useState(false);
  const settings = useSettings();

  useEffect(() => {
    if (!currentLocation) return;

    const fetchSpeedLimit = async () => {
      setLoading(true);
      try {
        const data = await speedLimitService.getSpeedLimit(
          currentLocation.lat,
          currentLocation.lon
        );
        setSpeedLimit(data);
      } catch (error) {
        console.error("Failed to fetch speed limit:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeedLimit();
  }, [currentLocation]);

  if (!speedLimit?.speedLimit) return null;

  const userUnit = settings?.speedUnit || "kmh";
  const displaySpeed = speedLimitService.convertSpeed(
    speedLimit.speedLimit,
    speedLimit.unit,
    userUnit
  );

  const isSpeeding = currentSpeed && currentSpeed > displaySpeed;

  return (
    <div className="fixed top-20 right-4 z-[1000]">
      <div
        className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-lg transition-all ${
          isSpeeding
            ? "border-red-600 bg-red-50 dark:bg-red-900/30 animate-pulse"
            : "border-red-600 bg-white dark:bg-slate-800"
        }`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        ) : (
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                isSpeeding ? "text-red-700" : "text-red-600"
              }`}
            >
              {displaySpeed}
            </div>
            <div
              className={`text-xs ${
                isSpeeding ? "text-red-600" : "text-gray-500"
              }`}
            >
              {userUnit === "mph" ? "MPH" : "KM/H"}
            </div>
          </div>
        )}
      </div>

      {currentSpeed && (
        <div
          className={`mt-4 text-center text-sm font-semibold ${
            isSpeeding
              ? "text-red-600 dark:text-red-400"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {Math.round(currentSpeed)} {userUnit === "mph" ? "MPH" : "KM/H"}
        </div>
      )}

      {speedLimit.roadName && (
        <div className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400">
          {speedLimit.roadName}
        </div>
      )}
    </div>
  );
};

export default SpeedLimitDisplay;
