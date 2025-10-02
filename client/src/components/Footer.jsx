import React from "react";
import { useSettings } from "./SettingContent";

const Footer = ({ className = "" }) => {
  const settings = useSettings();
  return (
    <footer className={className}>
      {/* Desktop footer */}
      <div
        className={`hidden md:flex justify-between items-center p-4 ${
          settings?.theme === "dark"
            ? "bg-slate-800 border-slate-600"
            : "bg-white border-gray-200"
        } shadow-inner border-t`}
      >
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
        <span
          className={`text-sm ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-600"
          }`}
        >
          © 2025 SmartGuide. All rights reserved.
        </span>
      </div>

      {/* Mobile footer - positioned above mobile nav */}
      <div
        className={`md:hidden ${
          settings?.theme === "dark"
            ? "bg-slate-800 border-slate-600"
            : "bg-white border-gray-200"
        } border-t px-4 py-3 mb-16`}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="smart guide logo" className="w-3 h-5" />
            <span
              className={`text-sm font-semibold ${
                settings?.theme === "dark" ? "text-slate-200" : "text-slate-800"
              }`}
            >
              SmartGuide
            </span>
          </div>
          <span
            className={`text-xs ${
              settings?.theme === "dark" ? "text-slate-400" : "text-gray-500"
            }`}
          >
            © 2025 SmartGuide. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
