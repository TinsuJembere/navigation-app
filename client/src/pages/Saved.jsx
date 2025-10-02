import React from "react";
import Header from "../components/Header";
import DownloadMapSection from "../components/DownloadedMapSection";
import SavedMapsSection from "../components/SavedMapsSection";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNavbar";
import { useSettings } from "../components/SettingContent";

const Saved = () => {
  const settings = useSettings();
  return (
    <div
      className={`flex flex-col min-h-screen ${
        settings?.theme === "dark" ? "bg-slate-900" : "bg-gray-100"
      }`}
    >
      <Header />
      <main className="flex-1 px-4 py-6 pb-20 md:pb-6 max-w-6xl w-full mx-auto">
        <DownloadMapSection />
        <SavedMapsSection />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Saved;
