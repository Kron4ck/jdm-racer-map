"use client";

import { useState } from "react";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import BottomNav, { type Tab } from "@/components/BottomNav";
import RacersTab from "@/components/tabs/RacersTab";
import LeaderboardTab from "@/components/tabs/LeaderboardTab";
import ProfileTab from "@/components/tabs/ProfileTab";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("map");

  return (
    <div className="h-screen flex flex-col overflow-hidden hud-texture">
      <Header />
      <div className="racing-stripe shrink-0" />

      {/* Content area — map always mounted, other tabs overlay it */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <MapSection />

        {activeTab !== "map" && (
          <div className="absolute inset-0 z-[2000] bg-[#060608] flex flex-col overflow-hidden">
            {activeTab === "racers"       && <RacersTab />}
            {activeTab === "leaderboard"  && <LeaderboardTab />}
            {activeTab === "profile"      && <ProfileTab />}
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
