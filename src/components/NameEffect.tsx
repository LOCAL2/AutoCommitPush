import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type NameEffectId =
  | "none"
  // Typing Effect (1)
  | "typing_hacker"
  // Popular & Glowing (10)
  | "rainbow_flow"
  | "neon_cyber"
  | "royal_gold"
  | "fire_blaze"
  | "cyber_glitch"
  | "matrix_hacker"
  | "cosmic_nebula"
  | "frost_ice"
  | "synthwave_80s"
  | "sakura_pink";

export interface NameEffectOption {
  id: NameEffectId;
  name: string;
  category: "Typing" | "Popular" | "Gaming" | "Luxury" | "Sci-Fi";
  description: string;
}

export const NAME_EFFECTS: NameEffectOption[] = [
  { id: "none", name: "Default Normal", category: "Popular", description: "ข้อความสีมาตรฐานตามธีม" },

  // Typing Effect (1)
  { id: "typing_hacker", name: "Terminal Hacker Typing", category: "Typing", description: "แฮกเกอร์เทอร์มินัลพิมพ์ข้อความทีละตัวพร้อมเคอร์เซอร์กะพริบ" },

  // Glowing & Animated Effects (10)
  { id: "rainbow_flow", name: "Rainbow Flow", category: "Popular", description: "เกรเดียนท์สายรุ้งเคลื่อนไหวพริ้วไหว" },
  { id: "neon_cyber", name: "Neon Cyber Glow", category: "Gaming", description: "นีออนสีฟ้า-ชมพูเรืองแสงสไตล์เกมเมอร์" },
  { id: "royal_gold", name: "Imperial Gold Shimmer", category: "Luxury", description: "ทองคำบริสุทธิ์สะท้อนแสงพรีเมียม" },
  { id: "fire_blaze", name: "Inferno Dragon Blaze", category: "Gaming", description: "เปลวไฟสีส้มแดงพริ้วโชติช่วง" },
  { id: "cyber_glitch", name: "Cyber Glitch Distortion", category: "Sci-Fi", description: "เอฟเฟกต์กลิชแฮกเกอร์ขยับดิสทอร์ชัน" },
  { id: "matrix_hacker", name: "Matrix Code Green", category: "Sci-Fi", description: "เขียวรหัสเมทริกซ์เรืองแสงเข้มข้น" },
  { id: "cosmic_nebula", name: "Cosmic Nebula Dust", category: "Sci-Fi", description: "เนบิวลาห้วงอวกาศสีม่วงประกายดาว" },
  { id: "frost_ice", name: "Frost Blizzard Ice", category: "Gaming", description: "คริสตัลน้ำแข็งสีฟ้าใสฉ่ำเย็น" },
  { id: "synthwave_80s", name: "Synthwave Sunset", category: "Popular", description: "เกรเดียนท์พระอาทิตย์ตกดิสโก้ 80s" },
  { id: "sakura_pink", name: "Sakura Blossom Pink", category: "Popular", description: "กลีบซากุระชมพูหวานสดใสนุ่มนวล" },
];

const TypewriterEffect: React.FC<{
  text: string;
  textClassName?: string;
  cursorClassName?: string;
  cursorChar?: string;
}> = ({
  text,
  textClassName = "",
  cursorClassName = "text-emerald-400 font-bold",
  cursorChar = "_",
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isDeleting && index <= text.length) {
      setDisplayText(text.slice(0, index));
      timer = setTimeout(() => setIndex((prev) => prev + 1), 140);
    } else if (!isDeleting && index > text.length) {
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && index >= 0) {
      setDisplayText(text.slice(0, index));
      timer = setTimeout(() => setIndex((prev) => prev - 1), 70);
    } else if (isDeleting && index < 0) {
      setIsDeleting(false);
      setIndex(0);
    }

    return () => clearTimeout(timer);
  }, [text, index, isDeleting]);

  return (
    <span className={cn("inline-flex items-center select-none", textClassName)}>
      <span>{displayText}</span>
      <span className={cn("animate-pulse inline-block ml-0.5", cursorClassName)}>
        {cursorChar}
      </span>
    </span>
  );
};

interface NameEffectProps {
  text: string;
  effectId?: NameEffectId;
  className?: string;
}

export const NameEffect: React.FC<NameEffectProps> = ({
  text,
  effectId = "none",
  className,
}) => {
  if (!effectId || effectId === "none") {
    return <span className={className}>{text}</span>;
  }

  // ── Single Signature Typing Effect ──
  if (effectId === "typing_hacker") {
    return (
      <TypewriterEffect
        text={text}
        textClassName={cn("font-mono text-emerald-400 font-bold [text-shadow:0_0_6px_rgba(52,211,153,0.8)]", className)}
        cursorClassName="text-emerald-400 font-mono font-bold"
        cursorChar="_"
      />
    );
  }

  // ── Animated & Gradient Glow Effects ──
  const effectClasses: Record<string, string> = {
    rainbow_flow:
      "bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-rainbow-flow font-semibold",
    neon_cyber:
      "text-cyan-300 font-medium [text-shadow:0_0_8px_rgba(34,211,238,0.9),0_0_18px_rgba(244,114,182,0.7)] animate-pulse",
    royal_gold:
      "bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-500 bg-clip-text text-transparent animate-rainbow-flow font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]",
    fire_blaze:
      "bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]",
    cyber_glitch:
      "text-pink-500 font-mono tracking-wider animate-glitch drop-shadow-[2px_0_0_rgba(6,182,212,0.9)]",
    matrix_hacker:
      "text-emerald-400 font-mono font-bold [text-shadow:0_0_8px_rgba(52,211,153,0.95),0_0_15px_rgba(16,185,129,0.7)]",
    cosmic_nebula:
      "bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent animate-rainbow-flow font-medium drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]",
    frost_ice:
      "bg-gradient-to-r from-sky-300 via-cyan-100 to-blue-300 bg-clip-text text-transparent font-medium drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]",
    synthwave_80s:
      "bg-gradient-to-r from-fuchsia-500 via-rose-400 to-amber-400 bg-clip-text text-transparent animate-rainbow-flow font-semibold",
    sakura_pink:
      "bg-gradient-to-r from-pink-400 via-rose-300 to-pink-200 bg-clip-text text-transparent font-medium drop-shadow-[0_0_6px_rgba(244,114,182,0.7)]",
  };

  return (
    <span className={cn(effectClasses[effectId] || "", className)}>
      {text}
    </span>
  );
};
