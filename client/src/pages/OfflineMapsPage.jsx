import React from "react";
import Header from "../components/Header";
import DownloadMapSection from "../components/DownloadedMapSection";
import SavedMapsSection from "../components/SavedMapsSection";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNav";

const OfflineMapsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="flex-1 p-4 pb-20">
        {" "}
        {/* pb-20 adds space for the bottom nav bar */}
        <DownloadMapSection />
        <SavedMapsSection />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default OfflineMapsPage;
