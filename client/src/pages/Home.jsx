import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import TravelModes from "../components/TravelModes";
import CurrentLocationMap from "../components/CurrentLocation";
import NearbySuggestions from "../components/NearbySuggestion";
import InfoCards from "../components/InfoCards";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNavbar";
import { useSettings } from "../components/SettingContent";

const Home = () => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("drive");
  const navigate = useNavigate();
  const settings = useSettings();

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const params = new URLSearchParams({ q, mode });
    navigate(`/map?${params.toString()}`);
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${
        settings?.theme === "dark" ? "bg-slate-900" : "bg-white"
      } font-sans`}
    >
      <Header />
      <main className="flex-1 pb-24 pt-6 px-6 max-w-6xl w-full mx-auto">
        <div className="mb-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
          />
        </div>
        <div
          className={`mb-2 font-semibold ${
            settings?.theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Your Current Location
        </div>
        <div
          className={`rounded-xl overflow-hidden border ${
            settings?.theme === "dark" ? "border-slate-600" : "border-slate-200"
          } mb-8`}
        >
          <CurrentLocationMap />
        </div>
        <div
          className={`mb-3 font-semibold ${
            settings?.theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Nearby Suggestions
        </div>
        <NearbySuggestions />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Home;
