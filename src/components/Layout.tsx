import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSettingsStore } from "@/store/settingsStore";

export default function Layout() {
  const { bgImageUrl, bgOpacity } = useSettingsStore();

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Custom Background Image Overlay */}
      {bgImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat transition-opacity duration-300 z-0"
          style={{
            backgroundImage: `url("${bgImageUrl}")`,
            opacity: bgOpacity ?? 0.25,
          }}
        />
      )}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-transition">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
