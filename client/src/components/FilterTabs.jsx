import React from "react";

const FilterTabs = () => {
  const categories = [
    "All",
    "Restaurant",
    "Cafe",
    "Hotel",
    "ATM",
    "Gas Station",
    "Landmark",
    "Shopping",
  ];

  return (
    <div className="flex space-x-2 overflow-x-auto pb-4 hide-scrollbar">
      {categories.map((category) => (
        <button
          key={category}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            category === "All"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
