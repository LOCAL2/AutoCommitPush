import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSettingsStore } from "@/store/settingsStore";

export default function Layout() {
  const { bgImageUrl, bgOpacity } = useSettingsStore();
  const [resolvedBgUrl, setResolvedBgUrl] = useState<string>("");

  useEffect(() => {
    if (!bgImageUrl) {
      setResolvedBgUrl("");
      return;
    }

    if (bgImageUrl.startsWith("http://") || bgImageUrl.startsWith("https://") || bgImageUrl.startsWith("data:")) {
      setResolvedBgUrl(bgImageUrl);
    } else {
      // Local file path — convert using Tauri's convertFileSrc
      import("@tauri-apps/api/core")
        .then(({ convertFileSrc }) => {
          const rawPath = bgImageUrl.replace(/^file:\/\/\/?/, "").replace(/\//g, "\\");
          setResolvedBgUrl(convertFileSrc(rawPath));
        })
        .catch(() => {
          setResolvedBgUrl(bgImageUrl);
        });
    }
  }, [bgImageUrl]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Custom Background Image Overlay */}
      {resolvedBgUrl && (
        <div
          className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat transition-opacity duration-300 z-0"
          style={{
            backgroundImage: `url("${resolvedBgUrl}")`,
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
