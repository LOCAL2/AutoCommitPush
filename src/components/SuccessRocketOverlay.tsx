import { useState, useEffect } from "react";
import { CheckCircle2, ArrowUpRight } from "lucide-react";

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
      const timer = setTimeout(() => {
        setActive(false);
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!active && !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-none select-none">
      <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-card border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 animate-scale-up">
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground tracking-wide flex items-center gap-1.5">
            {message} <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </span>
          <span className="text-[11px] text-muted-foreground">Changes synchronized to remote GitHub repository</span>
        </div>
      </div>
    </div>
  );
}
