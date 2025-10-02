import React from "react";
import Header from "../components/Header";
import FilterTabs from "../components/FilterTabs";
import PlaceCards from "../components/PlaceCards";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNav";

const DiscoverPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="flex-1 p-4 pb-20">
        {" "}
        {/* pb-20 adds space for the bottom nav bar */}
        <h1 className="text-2xl font-semibold mb-6">Discover Nearby Places</h1>
        <FilterTabs />
        <PlaceCards />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default DiscoverPage;
