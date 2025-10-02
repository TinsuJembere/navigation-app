import React from "react";

const InfoCards = () => {
  return (
    <>
      {/* Live Traffic Alerts */}
      <section className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h3 className="text-sm font-semibold mb-2">Live Traffic Alerts</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center space-x-2">
            <svg
              className="h-4 w-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 001.789-2.895l-6.928-11.996a2 2 0 00-3.578 0L3.337 19.105A2 2 0 005.125 21z"
              />
            </svg>
            <span>
              Accident reported ahead on Elm Avenue, expect minor delays.
            </span>
          </li>
          <li className="flex items-center space-x-2">
            <svg
              className="h-4 w-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 001.789-2.895l-6.928-11.996a2 2 0 00-3.578 0L3.337 19.105A2 2 0 005.125 21z"
              />
            </svg>
            <span>
              Road closure on Oak Street, route adjusted automatically.
            </span>
          </li>
        </ul>
      </section>

      {/* Alternative Routes */}
      <section className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h3 className="text-sm font-semibold mb-2">Alternative Routes</h3>
        <ul className="space-y-2">
          <li className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
            <div>
              <p className="font-semibold">18 min (6.5 km)</p>
              <p className="text-xs text-gray-500">
                Via Highway 101, slightly longer but less traffic.
              </p>
            </div>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
          <li className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
            <div>
              <p className="font-semibold">16 min (5.8 km)</p>
              <p className="text-xs text-gray-500">
                Scenic route through Central Park, moderate traffic.
              </p>
            </div>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
        </ul>
      </section>
    </>
  );
};

export default InfoCards;
