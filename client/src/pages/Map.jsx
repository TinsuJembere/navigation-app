import React from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import MapContainer from "../components/MapContainer";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNavbar";
import { useSettings } from "../components/SettingContent";

function ModeTabs() {
  const [params, setParams] = useSearchParams();
  const settings = useSettings();
  const mode = params.get("mode") || "drive";
  const setMode = (m) => {
    params.set("mode", m);
    setParams(params);
  };
  const Tab = ({ label, value }) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`px-4 py-2 rounded-full border text-sm font-semibold ${
        mode === value
          ? "bg-blue-600 text-white border-blue-600"
          : settings?.theme === "dark"
          ? "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div
      className={`sticky top-[56px] z-20 w-full ${
        settings?.theme === "dark"
          ? "bg-slate-900/80 border-slate-600"
          : "bg-white/80 border-slate-200"
      } backdrop-blur border-b`}
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <Tab label="Drive" value="drive" />
        <Tab label="Walk" value="walk" />
        <Tab label="Transit" value="transit" />
      </div>
    </div>
  );
}

function Map() {
  const settings = useSettings();
  return (
    <div
      className={`flex flex-col min-h-screen font-sans ${
        settings?.theme === "dark" ? "bg-slate-900" : "bg-white"
      }`}
    >
      <Header />
      <ModeTabs />
      <div className="flex-1 relative min-h-[60vh] md:min-h-[70vh] z-0 pb-16 md:pb-0">
        <MapContainer />
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}

export default Map;
