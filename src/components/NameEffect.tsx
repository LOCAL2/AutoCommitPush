import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type NameEffectId =
  | "none"
  // Typing Effect (1)
  | "typing_hacker"
  // Popular & Glowing (100+)
  | "rainbow_flow" | "neon_cyber" | "royal_gold" | "fire_blaze" | "cyber_glitch"
  | "matrix_hacker" | "cosmic_nebula" | "frost_ice" | "synthwave_80s" | "sakura_pink"
  | "emerald_shine" | "amethyst_aura" | "toxic_slime" | "electric_zap" | "plasma_violet"
  | "sunset_orange" | "ocean_deep" | "ruby_flame" | "golden_laurel_text" | "silver_chrome"
  | "valentines_glow" | "cny_dragon_gold" | "cny_red_bless" | "halloween_spooky" | "christmas_jingle"
  // Extended Gaming & Esports (20)
  | "overcharge_rgb" | "shadow_demon" | "valkyrie_gold" | "arcane_magic" | "abyssal_void"
  | "hyper_beam" | "phoenix_rebirth" | "frostbite_blue" | "venom_strike" | "titanium_shield"
  | "solar_god" | "starlight_glimmer" | "vampire_blood" | "cyber_punk_neon" | "supernova_glow"
  | "quantum_pulse" | "celestial_empress" | "golden_pharaoh" | "stealth_ninja" | "inferno_core"
  // Extended Luxury & Royalty (20)
  | "diamond_sparkle" | "rose_gold_luxe" | "platinum_shine" | "sapphire_glow" | "emerald_king"
  | "black_diamond" | "champagne_bubble" | "imperial_jade" | "regal_purple" | "golden_crown"
  | "pearl_shimmer_text" | "ruby_sovereign" | "opal_fire" | "obsidian_gold" | "crystal_halo"
  | "velvet_night" | "monarch_gold" | "gilded_glory" | "luxe_platinum" | "royal_amethyst"
  // Extended Sci-Fi & Cyberpunk (20)
  | "holo_scan" | "tron_orange" | "laser_violet" | "grid_matrix" | "warp_speed"
  | "reactor_pulse" | "plasma_cyan" | "cyber_lime_glow" | "synth_purple" | "orbital_beam"
  | "quantum_flux" | "tachyon_wave" | "singularity_black" | "neon_pulse" | "binary_green"
  | "starburst_rgb" | "hologram_blue" | "dark_matter" | "space_odyssey" | "interstellar_glow"
  // Extended Anime & Aesthetic (20)
  | "kawaii_pastel" | "candy_pop" | "cherry_blossom" | "matcha_latte" | "lavender_dream"
  | "peach_velvet" | "bubblegum_pink" | "midnight_tokyo" | "retro_disco" | "vaporwave_sunset"
  | "prism_rainbow" | "aurora_northern" | "stardust_magic" | "angelic_white" | "fairy_wings"
  | "neon_pastel" | "dreamy_cloud" | "golden_hour" | "sweet_berry" | "holographic_shine";

export interface NameEffectOption {
  id: NameEffectId;
  name: string;
  category: "Typing" | "Popular" | "Gaming" | "Luxury" | "Sci-Fi" | "Seasonal";
  description: string;
}

export const NAME_EFFECTS: NameEffectOption[] = [
  { id: "none", name: "Default Normal", category: "Popular", description: "ข้อความสีมาตรฐานตามธีม" },

  // Typing Effect (1)
  { id: "typing_hacker", name: "Terminal Hacker Typing", category: "Typing", description: "แฮกเกอร์เทอร์มินัลพิมพ์ข้อความทีละตัวพร้อมเคอร์เซอร์กะพริบ" },

  // Glowing & Animated Effects (25)
  { id: "valentines_glow", name: "Valentine Heart Glow", category: "Seasonal", description: "หัวใจวาเลนไทน์สีชมพูอมแดงเรืองประกายหวานฉ่ำ" },
  { id: "cny_dragon_gold", name: "CNY Imperial Dragon Gold", category: "Seasonal", description: "มังกรทองตรุษจีนเรืองแสงทองคำมหาเฮง" },
  { id: "cny_red_bless", name: "CNY Ruby Fortune Red", category: "Seasonal", description: "สีแดงมงคลตรุษจีนประทัดโชคลาภมหาลาภ" },
  { id: "halloween_spooky", name: "Halloween Pumpkin Glow", category: "Seasonal", description: "ฟักทองฮาโลวีนส้มอมม่วงเรืองแสงปีศาจ" },
  { id: "christmas_jingle", name: "Christmas Festive Glow", category: "Seasonal", description: "คริสต์มาสตีมเขียวแดงหิมะเรืองประกาย" },
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
  { id: "emerald_shine", name: "Emerald Crystal Shine", category: "Luxury", description: "มรกตเขียวมลทินเรืองแสงประกาย" },
  { id: "amethyst_aura", name: "Amethyst Mystical Purple", category: "Sci-Fi", description: "แอเมทิสต์สีม่วงลึกลับเปล่งรัศมี" },
  { id: "toxic_slime", name: "Toxic Venom Slime", category: "Gaming", description: "เขียวนีออนพิษสลีมสไตล์ไซไฟ" },
  { id: "electric_zap", name: "Electric Zap Thunder", category: "Gaming", description: "สายฟ้าสีฟ้าอมเขียวช็อตเรืองแสง" },
  { id: "plasma_violet", name: "Plasma Core Violet", category: "Sci-Fi", description: "พลาสม่าม่วงเรืองพลังงานอนาคต" },
  { id: "sunset_orange", name: "Sunset Horizon Orange", category: "Popular", description: "ขอบฟ้าอาทิตย์อัสดงสีส้มทอง" },
  { id: "ocean_deep", name: "Deep Ocean Aqua", category: "Popular", description: "น้ำทะเลลึกอควาสีฟ้าครามกระจ่าง" },
  { id: "ruby_flame", name: "Empress Ruby Flame", category: "Luxury", description: "ทับทิมแดงก่ำสะท้อนแสงพรีเมียม" },
  { id: "golden_laurel_text", name: "Golden Victor Laurel", category: "Luxury", description: "ทองคำแห่งชัยชนะรัศมีสีทอง" },
  { id: "silver_chrome", name: "Silver Metallic Chrome", category: "Sci-Fi", description: "เงินโครเมียมสะท้อนแสงโลหะ" },

  // Extended Gaming & Esports (20)
  { id: "overcharge_rgb", name: "Overcharge RGB Spectrum", category: "Gaming", description: "สเปกตรัม RGB โอเวอร์คล็อกเกมมิ่งระดับเทพ" },
  { id: "shadow_demon", name: "Shadow Demon Realm", category: "Gaming", description: "รัศมีราชาปีศาจเงามืดสีแดงอมม่วง" },
  { id: "valkyrie_gold", name: "Valkyrie Divine Gold", category: "Gaming", description: "รัศมีนักรบวัลคิรีทองคำสว่างไสว" },
  { id: "arcane_magic", name: "Arcane Spell Energy", category: "Gaming", description: "มนตราจอมเวทเวทมนตร์สีม่วงคราม" },
  { id: "abyssal_void", name: "Abyssal Void Purple", category: "Gaming", description: "หลุมดำขุมอเวจีอนันตกาลสีม่วงเข้ม" },
  { id: "hyper_beam", name: "Hyper Laser Beam", category: "Gaming", description: "ลำแสงไฮเปอร์เลเซอร์แดงเข้มเรืองพลังงาน" },
  { id: "phoenix_rebirth", name: "Phoenix Rebirth Flame", category: "Gaming", description: "เพลิงนกฟีนิกซ์อมตะจุติใหม่ส้มทอง" },
  { id: "frostbite_blue", name: "Frostbite Ice Core", category: "Gaming", description: "แกนน้ำแข็งหิมะขั้วโลกสีฟ้าฉ่ำเย็น" },
  { id: "venom_strike", name: "Venom Strike Green", category: "Gaming", description: "อสรพิษพิษร้ายเรืองแสงเขียวนีออน" },
  { id: "titanium_shield", name: "Titanium Metal Shield", category: "Gaming", description: "เกราะโลหะไทเทเนียมเงางามแกร่ง" },
  { id: "solar_god", name: "Solar God Ray", category: "Gaming", description: "รัศมีเทพเจ้าสุริยะสีทองสว่างจ้า" },
  { id: "starlight_glimmer", name: "Starlight Glimmer Aura", category: "Gaming", description: "ประกายละอองดวงดาวระยิบระยับ" },
  { id: "vampire_blood", name: "Vampire Blood Crimson", category: "Gaming", description: "เลือดแวมไพร์สีแดงชาดลึกลับ" },
  { id: "cyber_punk_neon", name: "Cyberpunk City Neon", category: "Gaming", description: "แสงสีเมืองมหานครไซเบอร์พังค์" },
  { id: "supernova_glow", name: "Supernova Flare Glow", category: "Gaming", description: "ดาวระเบิดซูเปอร์โนวาสีฟ้าสว่างไสว" },
  { id: "quantum_pulse", name: "Quantum Energy Pulse", category: "Gaming", description: "พัลส์พลังงานควอนตัมสีฟ้าพาสเทล" },
  { id: "celestial_empress", name: "Celestial Empress Light", category: "Gaming", description: "รัศมีจักรพรรดินีแห่งสรวงสวรรค์" },
  { id: "golden_pharaoh", name: "Golden Pharaoh Relic", category: "Gaming", description: "สมบัติฟาโรห์ทองคำอียิปต์โบราณ" },
  { id: "stealth_ninja", name: "Stealth Ninja Shadow", category: "Gaming", description: "เงามืดนินจาลักลอบสีดำเงิน" },
  { id: "inferno_core", name: "Inferno Volcano Core", category: "Gaming", description: "แกนภูเขาไฟลาวาเดือดปูดส้มแดง" },

  // Extended Luxury & Royalty (20)
  { id: "diamond_sparkle", name: "Diamond Sparkle Pure", category: "Luxury", description: "ประกายเพชรแท้เจิดจรัสสว่างไสว" },
  { id: "rose_gold_luxe", name: "Rose Gold Crown Luxe", category: "Luxury", description: "โรสโกลด์สีชมพูทองคำสุดหรูหรา" },
  { id: "platinum_shine", name: "Platinum Diamond Shine", category: "Luxury", description: "พลาตินัมทองคำขาวเงาวับพรีเมียม" },
  { id: "sapphire_glow", name: "Imperial Sapphire Glow", category: "Luxury", description: "ไพลินน้ำเงินเจิดจรัสลักชูรี" },
  { id: "emerald_king", name: "Emerald King Sovereign", category: "Luxury", description: "ราชาแห่งมรกตเขียวขจีบริสุทธิ์" },
  { id: "black_diamond", name: "Black Diamond Obsidian", category: "Luxury", description: "เพชรดำลึกลับขอบทองคำสุดคลาสสิก" },
  { id: "champagne_bubble", name: "Champagne Bubble Gold", category: "Luxury", description: "แชมเปญโกลด์ประกายฟองระยิบระยับ" },
  { id: "imperial_jade", name: "Imperial Jade Palace", category: "Luxury", description: "หยกจักรพรรดิแห่งวังหลวงเขียวใส" },
  { id: "regal_purple", name: "Regal Velvet Purple", category: "Luxury", description: "ม่วงกำมะหยี่ราชวงศ์สุดพรีเมียม" },
  { id: "golden_crown", name: "Golden Sovereign Crown", category: "Luxury", description: "มงกุฎทองคำจักรพรรดิยิ่งใหญ่" },
  { id: "pearl_shimmer_text", name: "Iridescent Night Pearl", category: "Luxury", description: "ไข่มุกราตรีเรืองประกายเงาวับ" },
  { id: "ruby_sovereign", name: "Ruby Empress Sovereign", category: "Luxury", description: "ทับทิมจักรพรรดินีแดงสดเจิดจรัส" },
  { id: "opal_fire", name: "Fire Opal Iridescent", category: "Luxury", description: "โอปอลไฟสะท้อนรุ้งหลากสีมลทิน" },
  { id: "obsidian_gold", name: "Obsidian Black Gold", category: "Luxury", description: "หินออบซิเดียนดำรัศมีทองคำ" },
  { id: "crystal_halo", name: "Crystal Prism Halo", category: "Luxury", description: "คริสตัลปริซึมกระจ่างใสสว่างไสว" },
  { id: "velvet_night", name: "Velvet Midnight Luxe", category: "Luxury", description: "ราตรีราชาเที่ยงคืนม่วงเข้มทอง" },
  { id: "monarch_gold", name: "Monarch Royal Gold", category: "Luxury", description: "ราชาทองคำผู้เกรียงไกรยิ่งใหญ่" },
  { id: "gilded_glory", name: "Gilded Glory Antique", category: "Luxury", description: "ทองคำโบราณเปล่งรัศมีทรงคุณค่า" },
  { id: "luxe_platinum", name: "Luxe Platinum Crystal", category: "Luxury", description: "คริสตัลพลาตินัมประกายใสพรีเมียม" },
  { id: "royal_amethyst", name: "Royal Amethyst Gem", category: "Luxury", description: "แอเมทิสต์พลอยม่วงราชวงศ์" },

  // Extended Sci-Fi & Cyberpunk (20)
  { id: "holo_scan", name: "Hologram Radar Scan", category: "Sci-Fi", description: "สแกนเนอร์โฮโลแกรมเรดาร์ฟ้าเรืองแสง" },
  { id: "tron_orange", name: "TRON Cyber Orange", category: "Sci-Fi", description: "ส้มไซเบอร์สเปซ TRON อนาคต" },
  { id: "laser_violet", name: "Laser Violet Beam", category: "Sci-Fi", description: "เลเซอร์ม่วงเข้มเรืองแสงพลังสูง" },
  { id: "grid_matrix", name: "Digital Matrix Code", category: "Sci-Fi", description: "รหัสเมทริกซ์ดิจิทัลเขียวแฮกเกอร์" },
  { id: "warp_speed", name: "Warp Speed Laser", category: "Sci-Fi", description: "วาร์ปสปีดเลเซอร์เดินทางข้ามจักรวาล" },
  { id: "reactor_pulse", name: "Plasma Reactor Pulse", category: "Sci-Fi", description: "พลาสม่าแกนเตาปฏิกรณ์เรืองพัลส์" },
  { id: "plasma_cyan", name: "Plasma Cyan Beam", category: "Sci-Fi", description: "ลำแสงพลาสม่าสีฟ้าไซอันสดใส" },
  { id: "cyber_lime_glow", name: "Cyberpunk Lime Neon", category: "Sci-Fi", description: "มะนาวนีออนสตรีทสไตล์ไซเบอร์" },
  { id: "synth_purple", name: "Synthwave Purple Glow", category: "Sci-Fi", description: "นีออนม่วงสไตล์เรโทรไซไฟ 80s" },
  { id: "orbital_beam", name: "Orbital Satellite Beam", category: "Sci-Fi", description: "ลำแสงดาวเทียมโคจรรอบโลก" },
  { id: "quantum_flux", name: "Quantum Flux Core", category: "Sci-Fi", description: "แกนพลังงานฟลักซ์ควอนตัมเรืองแสง" },
  { id: "tachyon_wave", name: "Tachyon Particle Wave", category: "Sci-Fi", description: "อนุภาคแทคคีออนเดินทางข้ามเวลา" },
  { id: "singularity_black", name: "Black Hole Singularity", category: "Sci-Fi", description: "หลุมดำซิงกูลาริตีดูดกลืนมิติ" },
  { id: "neon_pulse", name: "Neon Matrix Pulse", category: "Sci-Fi", description: "พัลส์นีออนไซเบอร์เนติกอนาคต" },
  { id: "binary_green", name: "Binary Code Stream", category: "Sci-Fi", description: "กระแสรหัสไบนารี 0101 เขียวเรืองแสง" },
  { id: "starburst_rgb", name: "Starburst RGB Laser", category: "Sci-Fi", description: "เลเซอร์รัศมี RGB ดาวกระจาย" },
  { id: "hologram_blue", name: "Hologram Projection Blue", category: "Sci-Fi", description: "ภาพฉายโฮโลแกรมสามมิติฟ้าใส" },
  { id: "dark_matter", name: "Dark Matter Void", category: "Sci-Fi", description: "สสารมืดห้วงอวกาศลึกลับอนันต์" },
  { id: "space_odyssey", name: "Space Odyssey Nebula", category: "Sci-Fi", description: "การเดินทางห้วงอวกาศเนบิวลา" },
  { id: "interstellar_glow", name: "Interstellar Galaxy Glow", category: "Sci-Fi", description: "เปลวรัศมีกาแล็กซีข้ามดาวดวง" },

  // Extended Anime & Aesthetic (20)
  { id: "kawaii_pastel", name: "Kawaii Pastel Sweet", category: "Popular", description: "พาสเทลน่ารักคาวาอี้สีหวานละมุน" },
  { id: "candy_pop", name: "Candy Pop Rainbow", category: "Popular", description: "ลูกกวาดหลากสีหวานสดใสป็อป" },
  { id: "cherry_blossom", name: "Cherry Blossom Bloom", category: "Popular", description: "กลีบซากุระผลิบานสดใสอมชมพู" },
  { id: "matcha_latte", name: "Matcha Green Latte", category: "Popular", description: "ชาเขียวมัทฉะลาเต้เขียวนุ่มละมุน" },
  { id: "lavender_dream", name: "Lavender Misty Dream", category: "Popular", description: "ลาเวนเดอร์ม่วงอ่อนฝันหวาน" },
  { id: "peach_velvet", name: "Peach Velvet Glow", category: "Popular", description: "ลูกพีชชมพูอมส้มกำมะหยี่นวล" },
  { id: "bubblegum_pink", name: "Bubblegum Pink Pop", category: "Popular", description: "หมากฝรั่งสีชมพูหวานสดชื่น" },
  { id: "midnight_tokyo", name: "Midnight Tokyo Neon", category: "Popular", description: "มหานครโตเกียวยามเที่ยงคืนนีออน" },
  { id: "retro_disco", name: "Retro Disco 70s", category: "Popular", description: "ดิสโก้เรโทร 70s เปล่งแสงระยับ" },
  { id: "vaporwave_sunset", name: "Vaporwave Sunset City", category: "Popular", description: "อาทิตย์อัสดงสไตล์เวเพอร์เวฟ" },
  { id: "prism_rainbow", name: "Prism Spectrum Rainbow", category: "Popular", description: "เกรเดียนท์รุ้งสะท้อนแสงปริซึม" },
  { id: "aurora_northern", name: "Aurora Northern Lights", category: "Popular", description: "แสงเหนือออโรราพลิ้วไหวสวยงาม" },
  { id: "stardust_magic", name: "Stardust Magic Glitter", category: "Popular", description: "ฝุ่นดาวเวทมนตร์กากเพชรเรืองแสง" },
  { id: "angelic_white", name: "Angelic Pure White", category: "Popular", description: "เทวดาสีขาวบริสุทธิ์นวลตา" },
  { id: "fairy_wings", name: "Fairy Wings Aura", category: "Popular", description: "ปีกนางฟ้าพิกซี่ประกายพาสเทล" },
  { id: "neon_pastel", name: "Neon Pastel Sunset", category: "Popular", description: "นีออนพาสเทลพระอาทิตย์ตกนุ่ม" },
  { id: "dreamy_cloud", name: "Dreamy Sky Cloud", category: "Popular", description: "ก้อนเมฆท้องฟ้าฝันหวานละมุน" },
  { id: "golden_hour", name: "Golden Hour Glow", category: "Popular", description: "แสงอาทิตย์ยามเย็นโกลเด้นอาวร์" },
  { id: "sweet_berry", name: "Sweet Berry Mix", category: "Popular", description: "เบอร์รีสดมิกซ์ชมพูอมม่วง" },
  { id: "holographic_shine", name: "Holographic Metallic Shine", category: "Popular", description: "โฮโลแกรมโลหะสะท้อนแสงวิบวับ" },
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
    emerald_shine:
      "bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    amethyst_aura:
      "bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    toxic_slime:
      "bg-gradient-to-r from-lime-400 via-emerald-400 to-yellow-300 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(163,230,53,0.9)]",
    electric_zap:
      "text-cyan-300 font-mono font-bold [text-shadow:0_0_8px_rgba(34,211,238,0.95),0_0_15px_rgba(56,189,248,0.8)] animate-pulse",
    plasma_violet:
      "bg-gradient-to-r from-violet-500 via-purple-300 to-indigo-400 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]",
    sunset_orange:
      "bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]",
    ocean_deep:
      "bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-600 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_7px_rgba(56,189,248,0.8)]",
    ruby_flame:
      "bg-gradient-to-r from-rose-600 via-red-500 to-pink-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]",
    golden_laurel_text:
      "bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]",
    silver_chrome:
      "bg-gradient-to-r from-slate-300 via-zinc-100 to-slate-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_6px_rgba(226,232,240,0.8)]",
    valentines_glow:
      "bg-gradient-to-r from-rose-500 via-pink-400 to-red-400 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]",
    cny_dragon_gold:
      "bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(250,204,21,0.95)]",
    cny_red_bless:
      "bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(225,29,72,0.9)]",
    halloween_spooky:
      "bg-gradient-to-r from-orange-500 via-purple-400 to-amber-500 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.9)]",
    christmas_jingle:
      "bg-gradient-to-r from-emerald-400 via-red-400 to-yellow-300 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]",

    // Extended Gaming & Esports (20)
    overcharge_rgb: "bg-gradient-to-r from-red-500 via-green-400 via-blue-500 to-yellow-400 bg-clip-text text-transparent animate-rainbow-flow font-bold drop-shadow-[0_0_10px_rgba(59,130,246,0.9)]",
    shadow_demon: "bg-gradient-to-r from-red-900 via-purple-900 to-rose-700 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(225,29,72,0.9)]",
    valkyrie_gold: "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_9px_rgba(251,191,36,0.9)]",
    arcane_magic: "bg-gradient-to-r from-purple-500 via-indigo-400 to-blue-500 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]",
    abyssal_void: "bg-gradient-to-r from-violet-950 via-purple-800 to-indigo-900 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(139,92,246,0.9)]",
    hyper_beam: "bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.95)]",
    phoenix_rebirth: "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(245,158,11,0.9)]",
    frostbite_blue: "bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(56,189,248,0.9)]",
    venom_strike: "bg-gradient-to-r from-lime-400 via-emerald-400 to-green-600 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_9px_rgba(163,230,53,0.9)]",
    titanium_shield: "bg-gradient-to-r from-slate-400 via-zinc-200 to-slate-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_7px_rgba(203,213,225,0.8)]",
    solar_god: "bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_10px_rgba(250,204,21,0.95)]",
    starlight_glimmer: "bg-gradient-to-r from-amber-100 via-sky-200 to-purple-200 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_8px_rgba(253,230,138,0.8)]",
    vampire_blood: "bg-gradient-to-r from-red-800 via-rose-700 to-red-950 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(190,18,60,0.9)]",
    cyber_punk_neon: "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(236,72,153,0.9)]",
    supernova_glow: "bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_10px_rgba(56,189,248,0.95)]",
    quantum_pulse: "bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-400 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    celestial_empress: "bg-gradient-to-r from-amber-200 via-purple-300 to-pink-300 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(244,114,182,0.9)]",
    golden_pharaoh: "bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-600 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(234,179,8,0.9)]",
    stealth_ninja: "bg-gradient-to-r from-zinc-600 via-slate-400 to-zinc-800 bg-clip-text text-transparent font-bold drop-shadow-[0_0_6px_rgba(161,161,170,0.8)]",
    inferno_core: "bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.95)]",

    // Extended Luxury & Royalty (20)
    diamond_sparkle: "bg-gradient-to-r from-slate-100 via-cyan-100 to-white bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_9px_rgba(255,255,255,0.95)]",
    rose_gold_luxe: "bg-gradient-to-r from-rose-300 via-pink-200 to-rose-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(244,114,182,0.85)]",
    platinum_shine: "bg-gradient-to-r from-zinc-200 via-slate-100 to-zinc-300 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(228,228,231,0.9)]",
    sapphire_glow: "bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-400 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(59,130,246,0.9)]",
    emerald_king: "bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(16,185,129,0.9)]",
    black_diamond: "bg-gradient-to-r from-slate-900 via-zinc-700 to-amber-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_7px_rgba(251,191,36,0.8)]",
    champagne_bubble: "bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(252,211,77,0.85)]",
    imperial_jade: "bg-gradient-to-r from-emerald-600 via-teal-400 to-green-300 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(52,211,153,0.9)]",
    regal_purple: "bg-gradient-to-r from-purple-700 via-violet-500 to-fuchsia-600 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(168,85,247,0.9)]",
    golden_crown: "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(234,179,8,0.95)]",
    pearl_shimmer_text: "bg-gradient-to-r from-rose-100 via-slate-100 to-sky-100 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_7px_rgba(244,244,245,0.8)]",
    ruby_sovereign: "bg-gradient-to-r from-rose-600 via-red-500 to-pink-600 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(225,29,72,0.9)]",
    opal_fire: "bg-gradient-to-r from-pink-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent font-semibold animate-rainbow-flow drop-shadow-[0_0_8px_rgba(244,114,182,0.85)]",
    obsidian_gold: "bg-gradient-to-r from-zinc-900 via-slate-800 to-amber-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]",
    crystal_halo: "bg-gradient-to-r from-sky-200 via-cyan-100 to-indigo-200 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(186,230,253,0.9)]",
    velvet_night: "bg-gradient-to-r from-purple-900 via-indigo-900 to-amber-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(147,51,234,0.85)]",
    monarch_gold: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.95)]",
    gilded_glory: "bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-600 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(234,179,8,0.9)]",
    luxe_platinum: "bg-gradient-to-r from-slate-200 via-white to-zinc-300 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(244,244,245,0.9)]",
    royal_amethyst: "bg-gradient-to-r from-purple-600 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(192,132,252,0.9)]",

    // Extended Sci-Fi & Cyberpunk (20)
    holo_scan: "bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent font-mono animate-pulse drop-shadow-[0_0_9px_rgba(34,211,238,0.9)]",
    tron_orange: "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent font-mono font-bold drop-shadow-[0_0_9px_rgba(249,115,22,0.9)]",
    laser_violet: "bg-gradient-to-r from-fuchsia-500 via-purple-400 to-indigo-500 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_10px_rgba(217,70,239,0.95)]",
    grid_matrix: "bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent font-mono font-bold drop-shadow-[0_0_9px_rgba(52,211,153,0.9)]",
    warp_speed: "bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(37,99,235,0.9)]",
    reactor_pulse: "bg-gradient-to-r from-purple-600 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_9px_rgba(192,132,252,0.9)]",
    plasma_cyan: "bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(45,212,191,0.9)]",
    cyber_lime_glow: "bg-gradient-to-r from-lime-400 via-emerald-300 to-green-500 bg-clip-text text-transparent font-mono font-bold drop-shadow-[0_0_9px_rgba(163,230,53,0.9)]",
    synth_purple: "bg-gradient-to-r from-fuchsia-600 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(217,70,239,0.9)]",
    orbital_beam: "bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_9px_rgba(56,189,248,0.9)]",
    quantum_flux: "bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_9px_rgba(45,212,191,0.9)]",
    tachyon_wave: "bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(129,140,248,0.9)]",
    singularity_black: "bg-gradient-to-r from-purple-950 via-zinc-900 to-indigo-950 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(147,51,234,0.85)]",
    neon_pulse: "bg-gradient-to-r from-pink-500 via-cyan-400 to-yellow-300 bg-clip-text text-transparent font-mono font-bold animate-pulse drop-shadow-[0_0_10px_rgba(236,72,153,0.95)]",
    binary_green: "bg-gradient-to-r from-emerald-500 via-green-400 to-lime-300 bg-clip-text text-transparent font-mono font-bold drop-shadow-[0_0_9px_rgba(16,185,129,0.9)]",
    starburst_rgb: "bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-blue-500 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_10px_rgba(239,68,68,0.95)]",
    hologram_blue: "bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent font-mono drop-shadow-[0_0_8px_rgba(186,230,253,0.9)]",
    dark_matter: "bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]",
    space_odyssey: "bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(168,85,247,0.9)]",
    interstellar_glow: "bg-gradient-to-r from-indigo-300 via-purple-300 to-rose-300 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(165,180,252,0.85)]",

    // Extended Anime & Aesthetic (20)
    kawaii_pastel: "bg-gradient-to-r from-pink-300 via-purple-200 to-sky-200 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_7px_rgba(244,114,182,0.8)]",
    candy_pop: "bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-300 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_8px_rgba(244,114,182,0.85)]",
    cherry_blossom: "bg-gradient-to-r from-rose-300 via-pink-300 to-rose-200 bg-clip-text text-transparent font-medium drop-shadow-[0_0_7px_rgba(251,113,133,0.8)]",
    matcha_latte: "bg-gradient-to-r from-emerald-300 via-teal-200 to-green-300 bg-clip-text text-transparent font-medium drop-shadow-[0_0_7px_rgba(110,231,183,0.8)]",
    lavender_dream: "bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent font-medium drop-shadow-[0_0_7px_rgba(216,180,254,0.8)]",
    peach_velvet: "bg-gradient-to-r from-orange-300 via-rose-200 to-amber-200 bg-clip-text text-transparent font-medium drop-shadow-[0_0_7px_rgba(253,186,116,0.8)]",
    bubblegum_pink: "bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(244,114,182,0.85)]",
    midnight_tokyo: "bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_8px_rgba(129,140,248,0.85)]",
    retro_disco: "bg-gradient-to-r from-amber-400 via-rose-400 to-purple-500 bg-clip-text text-transparent font-bold animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]",
    vaporwave_sunset: "bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-semibold animate-rainbow-flow drop-shadow-[0_0_8px_rgba(217,70,239,0.85)]",
    prism_rainbow: "bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 via-cyan-300 to-purple-400 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_9px_rgba(255,255,255,0.9)]",
    aurora_northern: "bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_8px_rgba(110,231,183,0.85)]",
    stardust_magic: "bg-gradient-to-r from-amber-200 via-purple-200 to-pink-200 bg-clip-text text-transparent font-semibold animate-pulse drop-shadow-[0_0_8px_rgba(253,230,138,0.85)]",
    angelic_white: "bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]",
    fairy_wings: "bg-gradient-to-r from-pink-200 via-purple-200 to-sky-200 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_7px_rgba(244,114,182,0.8)]",
    neon_pastel: "bg-gradient-to-r from-pink-300 via-yellow-200 to-cyan-300 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_7px_rgba(244,114,182,0.8)]",
    dreamy_cloud: "bg-gradient-to-r from-sky-200 via-indigo-200 to-pink-200 bg-clip-text text-transparent font-medium drop-shadow-[0_0_7px_rgba(186,230,253,0.8)]",
    golden_hour: "bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]",
    sweet_berry: "bg-gradient-to-r from-rose-500 via-pink-400 to-purple-400 bg-clip-text text-transparent font-semibold drop-shadow-[0_0_8px_rgba(244,63,94,0.85)]",
    holographic_shine: "bg-gradient-to-r from-teal-200 via-purple-200 to-pink-200 bg-clip-text text-transparent font-bold animate-rainbow-flow drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]",
  };

  return (
    <span className={cn(effectClasses[effectId] || "", className)}>
      {text}
    </span>
  );
};
