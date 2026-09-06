import { useState, useEffect } from "react";
import { Rocket, Sparkles, CheckCircle2 } from "lucide-react";
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
      <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-card/90 border border-primary/30 shadow-2xl space-y-4 animate-scale-up">
        {/* Rocket Launch Animation Container */}
        <div className="relative w-24 h-24 flex items-center justify-center overflow-visible">
          {/* Flame Glow */}
          <div className="absolute w-16 h-16 rounded-full bg-orange-500/30 blur-xl animate-pulse" />
          
          {/* Rocket Icon Launching */}
          <div className="animate-rocket-launch text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
            <Rocket className="w-16 h-16 stroke-[1.5]" />
          </div>

          {/* Sparkles around rocket */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-spin" />
          <Sparkles className="absolute -bottom-1 -left-2 w-5 h-5 text-emerald-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
