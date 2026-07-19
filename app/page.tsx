import Header from "@/components/Header";
import MapSection from "@/components/MapSection";

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden hud-texture">
      <Header />
      <div className="racing-stripe shrink-0" />
      <MapSection />
    </div>
  );
}
