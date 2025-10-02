import React from "react";
import Header from "../components/Header";
import NavigationMap from "../components/NavigationMap";
import InfoCards from "../components/InfoCards";
import UpcomingTurns from "../components/UpcomingTurns";
import MobileNav from "../components/MobileNav";

const NavigationPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="flex-1 p-4 pb-20">
        {" "}
        {/* pb-20 adds space for the bottom nav bar */}
        <NavigationMap />
        <InfoCards />
        <UpcomingTurns />
      </main>
      <MobileNav />
    </div>
  );
};

export default NavigationPage;
