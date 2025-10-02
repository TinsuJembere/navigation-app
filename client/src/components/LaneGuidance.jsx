import React from "react";
import { useSettings } from "./SettingContent";

const LaneGuidance = ({ lanes, distance }) => {
  const settings = useSettings();

  if (!lanes || lanes.length === 0) return null;

  const parseLanes = (laneString) => {
    if (!laneString) return [];
    return laneString.split("|").map((lane) => {
      const directions = lane.split(";");
      return {
        directions: directions,
        active: false,
      };
    });
  };

  const laneData = typeof lanes === "string" ? parseLanes(lanes) : lanes;

  const getLaneIcon = (direction) => {
    switch (direction) {
      case "left":
        return "←";
      case "right":
        return "→";
      case "through":
      case "straight":
        return "↑";
      case "slight_left":
        return "↖";
      case "slight_right":
        return "↗";
      case "sharp_left":
        return "↰";
      case "sharp_right":
        return "↱";
      default:
        return "↑";
    }
  };

  return (
    <div
      className={`${
        settings?.theme === "dark" ? "bg-slate-800" : "bg-white"
      } p-4 rounded-lg shadow-lg mb-4`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-lg font-semibold ${
            settings?.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Lane Guidance
        </h3>
        <span
          className={`text-sm ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-600"
          }`}
        >
          In {distance}m
        </span>
      </div>

      <div className="flex justify-center items-end space-x-2">
        {laneData.map((lane, index) => (
          <div
            key={index}
            className={`flex flex-col items-center justify-end p-3 rounded-lg border-2 transition-all ${
              lane.active
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : settings?.theme === "dark"
                ? "border-slate-600 bg-slate-700"
                : "border-gray-300 bg-gray-50"
            }`}
            style={{ minWidth: "60px", height: "80px" }}
          >
            <div className="flex flex-col items-center space-y-1">
              {lane.directions.map((dir, dirIndex) => (
                <span
                  key={dirIndex}
                  className={`text-2xl ${
                    lane.active
                      ? "text-green-600 dark:text-green-400"
                      : settings?.theme === "dark"
                      ? "text-slate-400"
                      : "text-gray-600"
                  }`}
                >
                  {getLaneIcon(dir)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p
        className={`text-xs text-center mt-3 ${
          settings?.theme === "dark" ? "text-slate-400" : "text-gray-500"
        }`}
      >
        Use highlighted lane
        {laneData.filter((l) => l.active).length > 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default LaneGuidance;
