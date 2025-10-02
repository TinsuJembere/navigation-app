import React from "react";

const NavigationMap = () => {
  return (
    <section className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex items-center space-x-4 mb-4">
        <button className="text-gray-500">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-semibold">Turn left onto Main Street</h2>
          <p className="text-sm text-gray-500">In 200 meters</p>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
        <img
          src="/path/to/your/map.png"
          alt="Navigation Map"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Time and Distance */}
      <div className="flex justify-around items-center mt-4">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">15 min</p>
          <p className="text-xs text-gray-500">Estimated Time</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">5.2 km</p>
          <p className="text-xs text-gray-500">Distance Remaining</p>
        </div>
      </div>
    </section>
  );
};

export default NavigationMap;
