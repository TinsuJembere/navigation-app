import React from "react";
import { NavLink } from "react-router-dom";
import { useSettings } from "./SettingContent";

const Sidebar = () => {
  const settings = useSettings();
  return (
    <aside
      className={`hidden md:flex flex-col w-64 ${
        settings?.theme === "dark"
          ? "bg-slate-800 border-slate-600"
          : "bg-dark border-gray-200"
      } border-r`}
    >
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="smart guide logo" className="w-4 h-6" />
          <span
            className={`font-semibold ${
              settings?.theme === "dark" ? "text-slate-200" : "text-slate-800"
            } hidden sm:inline`}
          >
            SmartGuide
          </span>
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive
                    ? settings?.theme === "dark"
                      ? "bg-slate-700 text-blue-400 font-semibold"
                      : "bg-gray-100 text-blue-600 font-semibold"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="ml-3">Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive
                    ? settings?.theme === "dark"
                      ? "bg-slate-700 text-blue-400 font-semibold"
                      : "bg-gray-100 text-blue-600 font-semibold"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="ml-3">Map</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive
                    ? settings?.theme === "dark"
                      ? "bg-slate-700 text-blue-400 font-semibold"
                      : "bg-gray-100 text-blue-600 font-semibold"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="ml-3">Saved</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive
                    ? settings?.theme === "dark"
                      ? "bg-slate-700 text-blue-400 font-semibold"
                      : "bg-gray-100 text-blue-600 font-semibold"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="ml-3">Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
