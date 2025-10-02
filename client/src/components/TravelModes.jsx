import React from "react";

const ModeButton = ({ active, label, iconPath, onClick }) => (
  <button
    className={`flex-1 flex flex-col items-center p-3 sm:p-4 rounded-lg shadow-md transition-colors border ${
      active
        ? "bg-blue-50 border-blue-200 text-blue-700"
        : "bg-white hover:bg-gray-100 border-slate-200 text-gray-700"
    }`}
    onClick={onClick}
    type="button"
  >
    <svg
      className={`h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 ${
        active ? "text-blue-600" : "text-gray-600"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={iconPath}
      />
    </svg>
    <span className="text-xs sm:text-sm font-semibold">{label}</span>
  </button>
);

const TravelModes = ({ value, onChange }) => {
  return (
    <div className="flex justify-between space-x-2 sm:space-x-4 mb-6">
      <ModeButton
        active={value === "drive"}
        label="Drive"
        iconPath="M3 12l2-2m0 0l2-2m-2 2h12a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2z"
        onClick={() => onChange?.("drive")}
      />
      <ModeButton
        active={value === "walk"}
        label="Walk"
        iconPath="M12 11l-3 3-3-3m3 3l-3-3 3-3m0 6a2 2 0 110-4 2 2 0 010 4z"
        onClick={() => onChange?.("walk")}
      />
      <ModeButton
        active={value === "transit"}
        label="Transit"
        iconPath="M14 10l-2 2-2-2m2 2v6m0-6a2 2 0 110-4 2 2 0 010 4z"
        onClick={() => onChange?.("transit")}
      />
    </div>
  );
};

export default TravelModes;
