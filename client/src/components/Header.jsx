import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSettings } from "./SettingContent";

const Header = () => {
  const settings = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={`w-full sticky top-0 z-30 ${
        settings?.theme === "dark"
          ? "bg-slate-900/90 border-slate-600"
          : "bg-white/90 border-gray-200"
      } backdrop-blur supports-[backdrop-filter]:${
        settings?.theme === "dark" ? "bg-slate-900/70" : "bg-white/70"
      } border-b`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="smart guide logo" className="w-4 h-6" />
          <span
            className={`font-semibold ${
              settings?.theme === "dark" ? "text-slate-200" : "text-slate-800"
            } hidden sm:inline`}
          >
            SmartGuide
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "text-blue-600 font-semibold"
                : settings?.theme === "dark"
                ? "text-slate-300 hover:text-slate-100"
                : "text-slate-700 hover:text-slate-900"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) =>
              isActive
                ? "text-blue-600 font-semibold"
                : settings?.theme === "dark"
                ? "text-slate-300 hover:text-slate-100"
                : "text-slate-700 hover:text-slate-900"
            }
          >
            Map
          </NavLink>
          <NavLink
            to="/saved"
            className={({ isActive }) =>
              isActive
                ? "text-blue-600 font-semibold"
                : settings?.theme === "dark"
                ? "text-slate-300 hover:text-slate-100"
                : "text-slate-700 hover:text-slate-900"
            }
          >
            Saved
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive
                ? "text-blue-600 font-semibold"
                : settings?.theme === "dark"
                ? "text-slate-300 hover:text-slate-100"
                : "text-slate-700 hover:text-slate-900"
            }
          >
            Settings
          </NavLink>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden p-2 rounded-lg ${
            settings?.theme === "dark"
              ? "text-slate-300 hover:bg-slate-800"
              : "text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-t ${
            settings?.theme === "dark"
              ? "border-slate-600 bg-slate-900/95"
              : "border-gray-200 bg-white/95"
          } backdrop-blur`}
        >
          <nav className="px-4 py-2 space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Map
            </NavLink>
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Saved
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : settings?.theme === "dark"
                    ? "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
