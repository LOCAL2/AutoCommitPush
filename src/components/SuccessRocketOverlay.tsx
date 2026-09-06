import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (show) {
      setActive(true);
      fireConfettiCelebration();
      const timer = setTimeout(() => {
        setActive(false);
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!active && !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in pointer-events-none select-none">
      <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-card/95 border border-primary/30 shadow-2xl space-y-4 animate-scale-up min-w-[220px]">
        {/* Rocket Launch Animation Container */}
        <div className="relative w-20 h-20 flex items-center justify-center overflow-visible">
          {/* Flame Glow */}
          <div className="absolute w-14 h-14 rounded-full bg-orange-500/30 blur-xl animate-pulse" />
          
          {/* Rocket Icon Launching */}
          <div className="animate-rocket-launch text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
            <Rocket className="w-14 h-14 stroke-[1.5]" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-foreground font-semibold text-base">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
