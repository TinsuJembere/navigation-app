import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SettingsContent from "../components/SettingContent";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNavbar";
import { useSettings } from "../components/SettingContent";

const SettingsPage = () => {
  const settings = useSettings();
  return (
    <div
      className={`flex flex-col min-h-screen font-sans ${
        settings?.theme === "dark" ? "bg-slate-900" : "bg-white"
      }`}
    >
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main
          className={`flex-1 p-4 md:p-8 pb-20 md:pb-8 ${
            settings?.theme === "dark" ? "bg-slate-900" : "bg-gray-100"
          }`}
        >
          <SettingsContent />
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default SettingsPage;
