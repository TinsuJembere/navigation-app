import React from "react";
import { useSettings } from "./SettingContent";

const UpcomingTurns = ({ instructions = [], currentStepIndex = -1 }) => {
  const settings = useSettings();
  if (!Array.isArray(instructions) || instructions.length === 0) return null;
  return (
    <section
      className={`${
        settings?.theme === "dark" ? "bg-slate-800" : "bg-white"
      } p-4 rounded-lg shadow-md mb-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-sm font-semibold ${
            settings?.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Upcoming Turns
        </h3>
        {currentStepIndex >= 0 && (
          <div
            className={`flex items-center space-x-1 text-xs ${
              settings?.theme === "dark" ? "text-green-400" : "text-green-600"
            }`}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Voice Active</span>
          </div>
        )}
      </div>
      <ul className="space-y-2">
        {instructions.slice(0, 6).map((text, idx) => {
          const isCurrentStep = idx === currentStepIndex;
          return (
            <li
              key={idx}
              className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                isCurrentStep
                  ? settings?.theme === "dark"
                    ? "bg-blue-900/50 border border-blue-600"
                    : "bg-blue-50 border border-blue-200"
                  : settings?.theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex-shrink-0 ${
                    isCurrentStep ? "animate-pulse" : ""
                  }`}
                >
                  {isCurrentStep ? (
                    <svg
                      className={`h-5 w-5 ${
                        settings?.theme === "dark"
                          ? "text-blue-400"
                          : "text-blue-600"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  ) : (
                    <svg
                      className={`h-5 w-5 ${
                        settings?.theme === "dark"
                          ? "text-slate-300"
                          : "text-gray-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isCurrentStep
                        ? settings?.theme === "dark"
                          ? "text-blue-200"
                          : "text-blue-800"
                        : settings?.theme === "dark"
                        ? "text-slate-200"
                        : "text-gray-800"
                    }`}
                  >
                    {text}
                  </p>
                  {isCurrentStep && (
                    <p
                      className={`text-xs mt-1 ${
                        settings?.theme === "dark"
                          ? "text-blue-300"
                          : "text-blue-600"
                      }`}
                    >
                      🔊 Currently announcing
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default UpcomingTurns;
