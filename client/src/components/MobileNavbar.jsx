import React from "react";
import { NavLink } from "react-router-dom";
import { useSettings } from "./SettingContent";

const MobileNav = () => {
  const settings = useSettings();

  return (
    <nav
      className={`fixed bottom-0 left-0 w-full ${
        settings?.theme === "dark"
          ? "bg-slate-900/95 border-slate-600"
          : "bg-white/95 border-gray-200"
      } border-t backdrop-blur shadow-lg flex justify-around items-center p-2 md:hidden z-20`}
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            isActive
              ? "text-blue-600"
              : settings?.theme === "dark"
              ? "text-slate-400 hover:text-slate-200"
              : "text-gray-600 hover:text-gray-800"
          }`
        }
      >
        <svg className="h-6 w-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span className="text-xs font-medium">Home</span>
      </NavLink>

      <NavLink
        to="/map"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            isActive
              ? "text-blue-600"
              : settings?.theme === "dark"
              ? "text-slate-400 hover:text-slate-200"
              : "text-gray-600 hover:text-gray-800"
          }`
        }
      >
        <svg
          className="h-6 w-6 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <span className="text-xs font-medium">Map</span>
      </NavLink>

      <NavLink
        to="/saved"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            isActive
              ? "text-blue-600"
              : settings?.theme === "dark"
              ? "text-slate-400 hover:text-slate-200"
              : "text-gray-600 hover:text-gray-800"
          }`
        }
      >
        <svg
          className="h-6 w-6 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <span className="text-xs font-medium">Saved</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            isActive
              ? "text-blue-600"
              : settings?.theme === "dark"
              ? "text-slate-400 hover:text-slate-200"
              : "text-gray-600 hover:text-gray-800"
          }`
        }
        aria-label="Settings"
      >
        <svg
          className="h-6 w-6 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-xs font-medium">Settings</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
