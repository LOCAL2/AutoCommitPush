import { useState, useEffect, useRef } from "react";
import { Rocket, CheckCircle2 } from "lucide-react";
import { fireConfettiCelebration } from "@/lib/confetti";

interface SuccessRocketOverlayProps {
  show: boolean;
  message?: string;
  onClose: () => void;
}

export default function SuccessRocketOverlay({
  show,
  message = "Push Successful!",
  onClose,
}: SuccessRocketOverlayProps) {
  const [active, setActive] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (show && !hasFiredRef.current) {
      hasFiredRef.current = true;
      setActive(true);
      setUiVisible(true);
      fireConfettiCelebration();

      // Fade out the UI background and card right as the rocket launches up
      const uiTimer = setTimeout(() => {
        setUiVisible(false);
      }, 1100);

      const timer = setTimeout(() => {
        setActive(false);
        onClose();
        hasFiredRef.current = false;
      }, 2500);

      return () => {
        clearTimeout(timer);
        clearTimeout(uiTimer);
      };
    }
  }, [show]);

  if (!active && !show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none select-none transition-all duration-300 ${
        uiVisible ? "bg-black/60 backdrop-blur-md" : "bg-transparent backdrop-blur-none"
      }`}
    >
      <div
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl bg-card/95 border border-primary/30 shadow-2xl space-y-4 min-w-[220px] transition-all duration-300 ${
          uiVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Placeholder to keep spacing for the absolute rocket */}
        <div className="w-20 h-20" />

        <div className="flex items-center gap-2 text-foreground font-semibold text-base">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{message}</span>
        </div>
      </div>

      {/* Rocket Container (Independent of UI Box to stay visible) */}
      <div className="absolute flex items-center justify-center -mt-[68px] z-10">
        <div className="relative w-20 h-20 flex items-center justify-center overflow-visible">
          {/* Flame Glow */}
          <div
            className={`absolute w-14 h-14 rounded-full bg-orange-500/30 blur-xl animate-pulse transition-opacity duration-300 ${
              uiVisible ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Rocket Icon Launching */}
          <div className="animate-rocket-launch text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
            <Rocket className="w-14 h-14 stroke-[1.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}
