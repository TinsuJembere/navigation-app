import React from "react";
import { useSettings } from "./SettingContent";

const SearchBar = ({ value, onChange, onSubmit }) => {
  const settings = useSettings();

  return (
    <form
      className={`flex items-center ${
        settings?.theme === "dark"
          ? "bg-slate-800 border-slate-600"
          : "bg-white border-slate-200"
      } rounded-full border px-4 py-3 shadow-sm`}
      onSubmit={onSubmit}
    >
      <svg
        className={`h-5 w-5 ${
          settings?.theme === "dark" ? "text-slate-400" : "text-gray-400"
        } mr-2 flex-shrink-0`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Where to?"
        className={`flex-1 ${
          settings?.theme === "dark"
            ? "text-slate-200 placeholder-slate-400 bg-transparent"
            : "text-gray-700 placeholder-gray-400 bg-transparent"
        } focus:outline-none min-w-0`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Search destination"
      />
      <button
        type="submit"
        className="ml-2 sm:ml-3 bg-blue-600 text-white px-3 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors flex-shrink-0"
      >
        <span className="hidden sm:inline">Search</span>
        <svg
          className="h-4 w-4 sm:hidden"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </form>
  );
};

export default SearchBar;
