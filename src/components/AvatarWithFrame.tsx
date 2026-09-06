import React from "react";
import { cn } from "@/lib/utils";

export type AvatarFrameId =
  | "none"
  // Sci-Fi & Cyberpunk (13)
  | "cyber_orbit" | "hologram_scanner" | "laser_crosshair" | "matrix_code" | "quantum_ring"
  | "hud_targeting" | "cyber_glitch" | "tron_disc" | "hyper_drive" | "reactor_core"
  | "neon_grid" | "plasma_shield" | "warp_portal"
  // Magic & Fantasy (13)
  | "dragon_fire" | "sakura_aura" | "arcane_rune" | "frost_crystal" | "thunder_strike"
  | "phoenix_flame" | "holy_halo" | "dark_abyss" | "nature_vines" | "poison_mist"
  | "blood_moon" | "celestial_star" | "fairy_dust"
  // Royalty & Luxury (13)
  | "royal_gold" | "diamond_crystal" | "ruby_empress" | "emerald_sovereign" | "rose_gold"
  | "platinum_crown" | "sapphire_star" | "pearl_shimmer" | "amethyst_gem" | "black_obsidian"
  | "golden_laurel" | "jade_emperor" | "champagne_sparkle"
  // Cosmic & Astronomy (13)
  | "cosmic_nebula" | "supernova_burst" | "aurora_borealis" | "black_hole" | "solar_flare"
  | "starlight_ring" | "meteor_shower" | "milky_way" | "quasar_ray" | "eclipse_corona"
  | "comet_tail" | "pulsar_star" | "galaxy_core"
  // Aesthetic & Modern (13)
  | "synthwave_sun" | "vaporwave_pink" | "prism_chroma" | "neon_gradient" | "holographic_foil"
  | "minimal_white" | "sunset_glow" | "pastel_candy" | "cyber_lime" | "monochrome_luxe"
  | "gradient_wave" | "electric_cyan" | "retro_arcade"
  // Seasonal & Festival (8)
  | "valentines_cupid" | "chinese_cny_dragon" | "halloween_pumpkin" | "christmas_snow"
  | "cyber_valentine" | "cny_red_lantern" | "sakura_romantic" | "golden_firecracker";

export interface AvatarFrameOption {
  id: AvatarFrameId;
  name: string;
  category: "Sci-Fi" | "Fantasy" | "Luxury" | "Cosmic" | "Aesthetic" | "Seasonal";
  description: string;
}

export const AVATAR_FRAMES: AvatarFrameOption[] = [
  { id: "none", name: "Default", category: "Aesthetic", description: "วงแหวนเรียบหรูมินิมอลมาตรฐาน" },

  // Sci-Fi & Cyberpunk (13)
  { id: "cyber_orbit", name: "Cyber Satellite Orbit", category: "Sci-Fi", description: "ดาวเทียมไซเบอร์ 2 ชั้นหมุนสวนทิศทาง" },
  { id: "hologram_scanner", name: "Holographic Radar Scanner", category: "Sci-Fi", description: "ลำแสงเรดาร์สแกนเนอร์โฮโลแกรมหมุนวน" },
  { id: "laser_crosshair", name: "Targeting Crosshair HUD", category: "Sci-Fi", description: "เป้าเล็งเลเซอร์อนาคตพร้อมจุดล็อคเป้า" },
  { id: "matrix_code", name: "Matrix Digital Code", category: "Sci-Fi", description: "รหัสเมทริกซ์ดิจิทัลสีเขียวแฮกเกอร์" },
  { id: "quantum_ring", name: "Quantum Containment Ring", category: "Sci-Fi", description: "วงแหวนกักเก็บพลังงานควอนตัมสีฟ้าพัลส์" },
  { id: "hud_targeting", name: "Tactical HUD Scope", category: "Sci-Fi", description: "สโคประบบยุทธวิธีทหารอนาคต" },
  { id: "cyber_glitch", name: "Digital Glitch Shift", category: "Sci-Fi", description: "เอฟเฟกต์กะพริบกลิชสไลด์ภาพดิจิทัล" },
  { id: "tron_disc", name: "TRON Energy Disc", category: "Sci-Fi", description: "จานพลังงานไซเบอร์สเปซ TRON สีส้มสด" },
  { id: "hyper_drive", name: "Hyper Drive Laser RGB", category: "Sci-Fi", description: "เลเซอร์ RGB ความเร็วสูงหมุนรอบอวตาร" },
  { id: "reactor_core", name: "Plasma Core Reactor", category: "Sci-Fi", description: "แกนเตาปฏิกรณ์พลาสม่าม่วงเรืองแสง" },
  { id: "neon_grid", name: "Neon Matrix Grid", category: "Sci-Fi", description: "ตาข่ายพิกเซลนีออนไซเบอร์สเปซหมุนวน" },
  { id: "plasma_shield", name: "Plasma Force Shield", category: "Sci-Fi", description: "เกราะพลาสม่ากักเก็บพลังงานเรืองแสง" },
  { id: "warp_portal", name: "Warp Space Portal", category: "Sci-Fi", description: "ประตูมิติข้ามอวกาศวาร์ปพอร์ทัล" },

  // Magic & Fantasy (13)
  { id: "dragon_fire", name: "Inferno Dragon Flame", category: "Fantasy", description: "เปลวเพลิงมังกรส้มแดงพริ้วลุกโชน" },
  { id: "sakura_aura", name: "Sakura Blossom Aura", category: "Fantasy", description: "ออร่าละอองกลีบซากุระชมพูนุ่มนวล" },
  { id: "arcane_rune", name: "Arcane Magic Circle", category: "Fantasy", description: "วงเวทจอมเวทเวทมนตร์เส้นปะหมุนวน" },
  { id: "frost_crystal", name: "Frost Blizzard Ice", category: "Fantasy", description: "เกล็ดหิมะละอองน้ำแข็งคริสตัลฟ้าใส" },
  { id: "thunder_strike", name: "Thunder God Lightning", category: "Fantasy", description: "ประกายสายฟ้าเทพเจ้าทอร์เรืองแสง" },
  { id: "phoenix_flame", name: "Phoenix Wings Fire", category: "Fantasy", description: "ปีกนกฟีนิกซ์สีทองส้มอมเหลืองเรืองประกาย" },
  { id: "holy_halo", name: "Holy Angel Wings Halo", category: "Fantasy", description: "วงแหวนเทวดาบริสุทธิ์สีขาวทองสว่างไสว" },
  { id: "dark_abyss", name: "Shadow Abyss Realm", category: "Fantasy", description: "ออร่าเงามืดปีศาจสีแดงดำลึกลับ" },
  { id: "nature_vines", name: "Enchanted Nature Forest", category: "Fantasy", description: "ออร่าป่าเวทมนตร์ใบไม้เขียวขจีสดชื่น" },
  { id: "poison_mist", name: "Toxic Venom Viper", category: "Fantasy", description: "หมอกพิษเรืองแสงนีออนเขียวอันตราย" },
  { id: "blood_moon", name: "Blood Moon Eclipse", category: "Fantasy", description: "พระจันทร์เลือดออร่าแดงเข้มลึกลับ" },
  { id: "celestial_star", name: "Celestial Star Light", category: "Fantasy", description: "ประกายดาวศุกร์สรวงสวรรค์สว่างไสว" },
  { id: "fairy_dust", name: "Fairy Pixie Dust", category: "Fantasy", description: "ละอองมนตราพิกซี่แฟรี่เรืองแสง" },

  // Royalty & Luxury (13)
  { id: "royal_gold", name: "Royal Imperial Gold", category: "Luxury", description: "รัศมีทองคำบริสุทธิ์เส้นปะหมุนลักชูรี" },
  { id: "diamond_crystal", name: "Diamond Crystal Halo", category: "Luxury", description: "ประกายเพชรใสคริสตัลเงางามหรูหรา" },
  { id: "ruby_empress", name: "Empress Ruby Gem", category: "Luxury", description: "อัญมณีทับทิมสีแดงก่ำสุดพรีเมียม" },
  { id: "emerald_sovereign", name: "Emerald Sovereign Ring", category: "Luxury", description: "มรกตแท้เปล่งประกายเขียวบริสุทธิ์" },
  { id: "rose_gold", name: "Rose Gold Luxe", category: "Luxury", description: "โรสโกลด์สีชมพูทองคำเงางามละมุน" },
  { id: "platinum_crown", name: "Platinum White Gold", category: "Luxury", description: "ทองคำขาวพลาตินัมประกายเงินยวง" },
  { id: "sapphire_star", name: "Imperial Sapphire Star", category: "Luxury", description: "ไพลินสีน้ำเงินไพศาลรัศมีดวงดาว" },
  { id: "pearl_shimmer", name: "Iridescent Night Pearl", category: "Luxury", description: "ไข่มุกราตรีเรืองแสงชิมเมอร์เงาวับ" },
  { id: "amethyst_gem", name: "Amethyst Purple Gem", category: "Luxury", description: "พลอยแอเมทิสต์สีม่วงเมฆหมอกราชวงศ์" },
  { id: "black_obsidian", name: "Black Obsidian Gold Rim", category: "Luxury", description: "หินออบซิเดียนดำขอบทองคำสุดพรีเมียม" },
  { id: "golden_laurel", name: "Golden Laurel Wreath", category: "Luxury", description: "ช่อใบลอเรลทองคำแห่งชัยชนะ" },
  { id: "jade_emperor", name: "Imperial Jade Crown", category: "Luxury", description: "หยกจักรพรรดิเขียวใสเลอค่า" },
  { id: "champagne_sparkle", name: "Champagne Gold Sparkle", category: "Luxury", description: "แชมเปญโกลด์ประกายฟองระยิบระยับ" },

  // Cosmic & Astronomy (13)
  { id: "cosmic_nebula", name: "Cosmic Nebula Dust", category: "Cosmic", description: "ออโรราฝุ่นเนบิวลาห้วงจักรวาลลึก" },
  { id: "supernova_burst", name: "Supernova Explosion", category: "Cosmic", description: "ซูเปอร์โนวาดาวระเบิดสีฟ้าสว่างไสว" },
  { id: "aurora_borealis", name: "Northern Aurora Lights", category: "Cosmic", description: "แสงเหนือออโรราสีเขียวพลิ้วไหวสวยงาม" },
  { id: "black_hole", name: "Black Hole Singularity", category: "Cosmic", description: "หลุมดำดูดกลืนอวกาศสีม่วงดำ" },
  { id: "solar_flare", name: "Solar Eclipse Corona", category: "Cosmic", description: "รัศมีสุริยุปราคาโซลาร์แฟลร์หมุนวน" },
  { id: "starlight_ring", name: "Starlight Galaxy Rim", category: "Cosmic", description: "ประกายดวงดาวทางช้างเผือกอวกาศ" },
  { id: "meteor_shower", name: "Meteor Shower Fire", category: "Cosmic", description: "ฝนดาวตกสีส้มแดงพุ่งทะยานอวกาศ" },
  { id: "milky_way", name: "Milky Way Spiral", category: "Cosmic", description: "เกลียวทางช้างเผือกจักรวาลลึก" },
  { id: "quasar_ray", name: "Quasar Energy Beam", category: "Cosmic", description: "ลำแสงพลังงานควอซาร์สุดอลังการ" },
  { id: "eclipse_corona", name: "Golden Eclipse Halo", category: "Cosmic", description: "คอโรนาสุริยุปราคาทองคำมืดมิด" },
  { id: "comet_tail", name: "Ice Comet Tail", category: "Cosmic", description: "หางดาวหางน้ำแข็งสีฟ้าสว่าง" },
  { id: "pulsar_star", name: "Pulsar Neutron Star", category: "Cosmic", description: "ดาวนิวตรอนพัลซาร์ปล่อยคลื่นวิทยุ" },
  { id: "galaxy_core", name: "Galaxy Deep Core", category: "Cosmic", description: "แกนกลางดาราจักรหมุนวนอวกาศ" },

  // Aesthetic & Modern (13)
  { id: "synthwave_sun", name: "Synthwave 80s Sun", category: "Aesthetic", description: "ดวงอาทิตย์นีออนเรโทร 80s ดิสโก้" },
  { id: "vaporwave_pink", name: "Vaporwave Pastel Dream", category: "Aesthetic", description: "เฉดสีพาสเทลชมพูฟ้าเวเพอร์เวฟ" },
  { id: "prism_chroma", name: "Prism Spectrum Rainbow", category: "Aesthetic", description: "เกรเดียนท์ปริซึมสะท้อนแสงรุ้งหลากสี" },
  { id: "neon_gradient", name: "Neon Cosmic Sunset", category: "Aesthetic", description: "เกรเดียนท์พระอาทิตย์ตกม่วงส้ม" },
  { id: "holographic_foil", name: "Holographic Metallic", category: "Aesthetic", description: "ฟอยล์โฮโลแกรมโลหะสะท้อนแสง" },
  { id: "minimal_white", name: "Minimal Pure White", category: "Aesthetic", description: "วงแหวนสีขาวบริสุทธิ์คลีนสไตล์มินิมอล" },
  { id: "sunset_glow", name: "Golden Sunset Hour", category: "Aesthetic", description: "ออร่าแสงอาทิตย์ยามเย็นอบอุ่น" },
  { id: "pastel_candy", name: "Pastel Sweet Candy", category: "Aesthetic", description: "ลูกกวาดพาสเทลสีหวานน่ารัก" },
  { id: "cyber_lime", name: "Cyberpunk Lime Neon", category: "Aesthetic", description: "มะนาวนีออนสดใสสตรีทสไตล์" },
  { id: "monochrome_luxe", name: "Monochrome Minimal", category: "Aesthetic", description: "ขาวดำมินิมอลโมโนโครมสุดเท่" },
  { id: "gradient_wave", name: "Fluid Gradient Wave", category: "Aesthetic", description: "คลื่นเกรเดียนท์สีสดใสไหลละมุน" },
  { id: "electric_cyan", name: "Electric Cyan Pulse", category: "Aesthetic", description: "ฟ้าไซอันกระแสไฟฟ้าเรืองแสง" },
  { id: "retro_arcade", name: "Retro Pixel Arcade", category: "Aesthetic", description: "พิกเซลเกมตู้อาร์เคดยุค 90s" },

  // Seasonal & Festival (8)
  { id: "valentines_cupid", name: "Valentine Heart Cupid", category: "Seasonal", description: "ออร่าหัวใจกามเทพคิวปิดวาเลนไทน์ชมพูเรืองแสง" },
  { id: "chinese_cny_dragon", name: "CNY Imperial Red Dragon", category: "Seasonal", description: "มังกรทองตรุษจีนมงคลแดงทองมหาเฮง" },
  { id: "cny_red_lantern", name: "CNY Red Lantern Gold", category: "Seasonal", description: "โคมไฟแดงตรุษจีนรัศมีทองคำโชคลาภ" },
  { id: "golden_firecracker", name: "CNY Golden Firecracker", category: "Seasonal", description: "ประทัดมงคลทองคำต้อนรับปีใหม่จีน" },
  { id: "cyber_valentine", name: "Cyberpunk Pink Neon Heart", category: "Seasonal", description: "หัวใจนีออนชมพูไซเบอร์พังค์อนาคต" },
  { id: "sakura_romantic", name: "Romantic Sakura Love", category: "Seasonal", description: "กลีบซากุระแห่งความรักหวานละมุน" },
  { id: "halloween_pumpkin", name: "Halloween Spooky Pumpkin", category: "Seasonal", description: "ฟักทองฮาโลวีนส้มดำลึกลับประดับออร่า" },
  { id: "christmas_snow", name: "Merry Christmas Blizzard", category: "Seasonal", description: "คริสต์มาสหิมะโปรยปรายละอองทองมงคล" },
];

interface AvatarWithFrameProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  frameId?: AvatarFrameId;
  className?: string;
  fallbackText?: string;
}

export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  src,
  alt = "User Avatar",
  size = "md",
  frameId = "none",
  className,
  fallbackText = "U",
}) => {
  const containerSizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  }[size];

  return (
    <div className={cn("relative inline-flex items-center justify-center shrink-0 group select-none", containerSizes, className)}>
      {/* ── Sci-Fi & Cyberpunk (10) ── */}
      {frameId === "cyber_orbit" && (
        <>
          <div className="absolute -inset-[4px] rounded-full border-2 border-dashed border-cyan-400 animate-[spin_5s_linear_infinite]" />
          <div className="absolute -inset-[2px] rounded-full border border-pink-400/80 animate-[spin_8s_linear_infinite_reverse]" />
        </>
      )}

      {frameId === "hologram_scanner" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,#06b6d4_360deg)] animate-[spin_1.2s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-cyan-300/80" />
        </>
      )}

      {frameId === "laser_crosshair" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full border-2 border-red-500/80 animate-pulse" />
          <div className="absolute -top-1 w-1.5 h-1.5 bg-red-500 rounded-full z-20" />
          <div className="absolute -bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full z-20" />
          <div className="absolute -left-1 w-1.5 h-1.5 bg-red-500 rounded-full z-20" />
          <div className="absolute -right-1 w-1.5 h-1.5 bg-red-500 rounded-full z-20" />
        </>
      )}

      {frameId === "matrix_code" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 opacity-85 blur-[4px]" />
          <div className="absolute -inset-[2px] rounded-full border border-dashed border-green-300/90 animate-[spin_6s_linear_infinite]" />
        </>
      )}

      {frameId === "quantum_ring" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-600 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[2px] rounded-full border-2 border-cyan-300/80 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
        </>
      )}

      {frameId === "hud_targeting" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full border border-cyan-400/90 animate-[spin_10s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-dashed border-yellow-400/90 animate-[spin_6s_linear_infinite_reverse]" />
        </>
      )}

      {frameId === "cyber_glitch" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-red-500 via-cyan-400 to-green-400 opacity-80 animate-[bounce_1.5s_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-white/80" />
        </>
      )}

      {frameId === "tron_disc" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 opacity-85 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-300/90 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
        </>
      )}

      {frameId === "hyper_drive" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] opacity-75 blur-[4.5px] animate-[spin_3s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] animate-[spin_1.5s_linear_infinite]" />
        </>
      )}

      {frameId === "reactor_core" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-400 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-fuchsia-300/80 shadow-[0_0_8px_rgba(217,70,239,0.7)]" />
        </>
      )}

      {/* ── Magic & Fantasy (10) ── */}
      {frameId === "dragon_fire" && (
        <>
          <div className="absolute -inset-[4.5px] rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-300 shadow-[0_0_10px_rgba(249,115,22,0.9)]" />
        </>
      )}

      {frameId === "sakura_aura" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-200 opacity-80 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-pink-300/90 shadow-[0_0_6px_rgba(244,114,182,0.6)]" />
        </>
      )}

      {frameId === "arcane_rune" && (
        <>
          <div className="absolute -inset-[4px] rounded-full border-2 border-dashed border-purple-400 animate-[spin_15s_linear_infinite]" />
          <div className="absolute -inset-[2px] rounded-full bg-purple-900/40 blur-[3px]" />
        </>
      )}

      {frameId === "frost_crystal" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-400 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-cyan-200/90 shadow-[0_0_8px_rgba(186,230,253,0.8)]" />
        </>
      )}

      {frameId === "thunder_strike" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-sky-400 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-amber-300/90 shadow-[0_0_9px_rgba(250,204,21,0.8)]" />
        </>
      )}

      {frameId === "phoenix_flame" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-t from-amber-500 via-orange-500 to-yellow-300 opacity-90 blur-[5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-300/90 shadow-[0_0_9px_rgba(245,158,11,0.8)]" />
        </>
      )}

      {frameId === "holy_halo" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-amber-100 via-white to-yellow-200 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-yellow-100 shadow-[0_0_9px_rgba(254,240,138,0.9)]" />
        </>
      )}

      {frameId === "dark_abyss" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-red-950 via-rose-900 to-black opacity-95 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-rose-600/70 shadow-[inset_0_0_8px_rgba(225,29,72,0.7)]" />
        </>
      )}

      {frameId === "nature_vines" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-emerald-600 via-green-400 to-teal-500 opacity-85 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-emerald-300/80 shadow-[0_0_7px_rgba(16,185,129,0.7)]" />
        </>
      )}

      {frameId === "poison_mist" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-tr from-lime-400 via-emerald-500 to-green-300 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-lime-300/80 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
        </>
      )}

      {/* ── Royalty & Luxury (10) ── */}
      {frameId === "royal_gold" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 opacity-90 blur-[4.5px]" />
          <div className="absolute -inset-[2px] rounded-full border-2 border-dashed border-amber-300/90 animate-[spin_12s_linear_infinite]" />
        </>
      )}

      {frameId === "diamond_crystal" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-blue-100 via-white to-sky-200 opacity-85 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-white/95 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        </>
      )}

      {frameId === "ruby_empress" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-rose-600 via-red-500 to-pink-600 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-rose-300/80 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
        </>
      )}

      {frameId === "emerald_sovereign" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 opacity-80 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-emerald-300/80 shadow-[0_0_7px_rgba(16,185,129,0.7)]" />
        </>
      )}

      {frameId === "rose_gold" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 opacity-85 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-rose-200/90 shadow-[0_0_7px_rgba(251,113,133,0.7)]" />
        </>
      )}

      {frameId === "platinum_crown" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-400 opacity-85 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-slate-100 shadow-[0_0_8px_rgba(241,245,249,0.8)]" />
        </>
      )}

      {frameId === "sapphire_star" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 opacity-85 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-sky-300/80 shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
        </>
      )}

      {frameId === "pearl_shimmer" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-teal-100 via-purple-100 to-pink-100 opacity-80 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-teal-100/90 shadow-[0_0_8px_rgba(204,251,241,0.8)]" />
        </>
      )}

      {frameId === "amethyst_gem" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-violet-700 opacity-85 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-purple-300/80 shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
        </>
      )}

      {frameId === "black_obsidian" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-slate-900 via-amber-500 to-black opacity-90 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-400/90 shadow-[0_0_7px_rgba(245,158,11,0.7)]" />
        </>
      )}

      {/* ── Cosmic & Astronomy (10) ── */}
      {frameId === "cosmic_nebula" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-indigo-300/70 animate-[spin_10s_linear_infinite]" />
        </>
      )}

      {frameId === "supernova_burst" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-500 opacity-90 blur-[5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-sky-200/90 shadow-[0_0_9px_rgba(56,189,248,0.85)]" />
        </>
      )}

      {frameId === "aurora_borealis" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500 opacity-80 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-teal-300/80 shadow-[0_0_7px_rgba(45,212,191,0.7)]" />
        </>
      )}

      {frameId === "black_hole" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-purple-950 via-violet-900 to-black opacity-95 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-purple-500/70 shadow-[inset_0_0_9px_rgba(168,85,247,0.7)]" />
        </>
      )}

      {frameId === "solar_flare" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 animate-[spin_10s_linear_infinite] [clip-path:polygon(50%_0%,55%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,45%_35%)]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-200" />
        </>
      )}

      {frameId === "starlight_ring" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-400 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-indigo-200/80 shadow-[0_0_8px_rgba(165,180,252,0.8)]" />
        </>
      )}

      {frameId === "meteor_shower" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-orange-600 via-red-500 to-amber-400 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-orange-300/80 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
        </>
      )}

      {frameId === "milky_way" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 opacity-80 blur-[4.5px] animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-purple-300/70" />
        </>
      )}

      {frameId === "quasar_ray" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-yellow-300 opacity-90 blur-[5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-cyan-300/90 shadow-[0_0_9px_rgba(103,232,249,0.85)]" />
        </>
      )}

      {frameId === "eclipse_corona" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-amber-600 via-stone-900 to-amber-500 opacity-90 blur-[4.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </>
      )}

      {/* ── Aesthetic & Modern (10) ── */}
      {frameId === "synthwave_sun" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-b from-fuchsia-500 via-purple-600 to-amber-400 opacity-85 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.7)]" />
        </>
      )}

      {frameId === "vaporwave_pink" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 opacity-75 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-pink-300/80 shadow-[0_0_6px_rgba(244,114,182,0.6)]" />
        </>
      )}

      {frameId === "prism_chroma" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 opacity-75 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-rose-500 p-[1.5px]" />
        </>
      )}

      {frameId === "neon_gradient" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-orange-400 opacity-80 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-purple-300/70" />
        </>
      )}

      {frameId === "holographic_foil" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-teal-300 via-purple-300 to-pink-300 opacity-85 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-white/90 shadow-[0_0_7px_rgba(255,255,255,0.8)]" />
        </>
      )}

      {frameId === "minimal_white" && (
        <>
          <div className="absolute -inset-[2.5px] rounded-full border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        </>
      )}

      {frameId === "sunset_glow" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 opacity-80 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-300/80 shadow-[0_0_7px_rgba(245,158,11,0.6)]" />
        </>
      )}

      {frameId === "pastel_candy" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-sky-200 via-pink-200 to-yellow-100 opacity-80 blur-[3.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-pink-200/80" />
        </>
      )}

      {frameId === "cyber_lime" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 opacity-85 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-lime-300/90 shadow-[0_0_7px_rgba(163,230,53,0.7)]" />
        </>
      )}

      {frameId === "monochrome_luxe" && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-slate-400 via-zinc-100 to-slate-500 opacity-75 blur-[3.5px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-white/80" />
        </>
      )}

      {/* ── New Sci-Fi (3) ── */}
      {frameId === "neon_grid" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full border-2 border-dotted border-emerald-400 animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-cyan-400/80 blur-[1px]" />
        </>
      )}
      {frameId === "plasma_shield" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
        </>
      )}
      {frameId === "warp_portal" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-[conic-gradient(from_0deg,#3b82f6,#8b5cf6,#ec4899,#3b82f6)] opacity-85 blur-[4px] animate-[spin_2s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-purple-300/80" />
        </>
      )}

      {/* ── New Fantasy (3) ── */}
      {frameId === "blood_moon" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-red-700 via-rose-600 to-red-950 opacity-90 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-red-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
        </>
      )}
      {frameId === "celestial_star" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-amber-200 via-sky-200 to-yellow-100 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-200 shadow-[0_0_9px_rgba(253,230,138,0.9)]" />
        </>
      )}
      {frameId === "fairy_dust" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-200 opacity-80 blur-[3.5px] animate-[pulse_2s_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-dashed border-pink-200/90 animate-[spin_10s_linear_infinite]" />
        </>
      )}

      {/* ── New Luxury (3) ── */}
      {frameId === "golden_laurel" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-dashed border-yellow-200 animate-[spin_12s_linear_infinite]" />
        </>
      )}
      {frameId === "jade_emperor" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-emerald-600 via-green-400 to-teal-500 opacity-85 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </>
      )}
      {frameId === "champagne_sparkle" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 opacity-90 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-200/90 shadow-[0_0_7px_rgba(252,211,77,0.8)]" />
        </>
      )}

      {/* ── New Cosmic (3) ── */}
      {frameId === "comet_tail" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 opacity-85 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-sky-300/80 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
        </>
      )}
      {frameId === "pulsar_star" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border border-fuchsia-300 shadow-[0_0_9px_rgba(232,121,249,0.8)]" />
        </>
      )}
      {frameId === "galaxy_core" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#9333ea,#e11d48,#4f46e5)] opacity-85 blur-[4.5px] animate-[spin_4s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-indigo-300/80" />
        </>
      )}

      {/* ── New Aesthetic (3) ── */}
      {frameId === "gradient_wave" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-violet-500 via-rose-400 to-amber-300 opacity-85 blur-[4px] animate-rainbow-flow" />
          <div className="absolute -inset-[1.5px] rounded-full border border-white/70" />
        </>
      )}
      {frameId === "electric_cyan" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 opacity-90 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-cyan-300 shadow-[0_0_9px_rgba(34,211,238,0.9)]" />
        </>
      )}
      {frameId === "retro_arcade" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full border-2 border-dashed border-amber-400 animate-[spin_6s_linear_infinite]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-pink-500" />
        </>
      )}

      {/* ── Seasonal & Festival (8) ── */}
      {frameId === "valentines_cupid" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-red-400 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
        </>
      )}
      {frameId === "chinese_cny_dragon" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-yellow-300 opacity-95 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.95)]" />
        </>
      )}
      {frameId === "cny_red_lantern" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-t from-red-700 via-amber-500 to-yellow-200 opacity-90 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-amber-300 shadow-[0_0_8px_rgba(239,68,68,0.85)]" />
        </>
      )}
      {frameId === "golden_firecracker" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-red-600 via-yellow-400 to-amber-500 opacity-90 blur-[4px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-dashed border-amber-300 animate-[spin_8s_linear_infinite]" />
        </>
      )}
      {frameId === "cyber_valentine" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.9)]" />
        </>
      )}
      {frameId === "sakura_romantic" && (
        <>
          <div className="absolute -inset-[3.5px] rounded-full bg-gradient-to-r from-pink-300 via-rose-200 to-pink-400 opacity-85 blur-[4px]" />
          <div className="absolute -inset-[1.5px] rounded-full border border-pink-200 shadow-[0_0_7px_rgba(244,114,182,0.8)]" />
        </>
      )}
      {frameId === "halloween_pumpkin" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-purple-800 opacity-90 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-orange-400 shadow-[0_0_9px_rgba(249,115,22,0.9)]" />
        </>
      )}
      {frameId === "christmas_snow" && (
        <>
          <div className="absolute -inset-[4px] rounded-full bg-gradient-to-r from-emerald-500 via-white to-red-500 opacity-85 blur-[4.5px] animate-pulse" />
          <div className="absolute -inset-[1.5px] rounded-full border-2 border-white/90 shadow-[0_0_9px_rgba(255,255,255,0.9)]" />
        </>
      )}

      {/* ── Main Inner Circular Avatar Image ── */}
      <div
        className={cn(
          "relative z-10 w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-background transition-all duration-300",
          frameId === "none" && "ring-1 ring-border"
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground">
            {fallbackText}
          </div>
        )}
      </div>
    </div>
  );
};
