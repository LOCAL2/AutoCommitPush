import { useState } from "react";
import { X, Check, Palette, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarWithFrame, AVATAR_FRAMES } from "@/components/AvatarWithFrame";
import { NameEffect, NAME_EFFECTS } from "@/components/NameEffect";
import { useSettingsStore } from "@/store/settingsStore";
import { cn } from "@/lib/utils";

interface CustomizationModalProps {
  user: {
    avatar_url: string;
    login: string;
    name?: string | null;
  };
  onClose: () => void;
}

export default function CustomizationModal({ user, onClose }: CustomizationModalProps) {
  const { avatarFrame, setAvatarFrame, nameEffect, setNameEffect } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<"frames" | "name_effects">("frames");
  const [frameCategory, setFrameCategory] = useState<string>("All");
  const [effectCategory, setEffectCategory] = useState<string>("All");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Studio Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight text-foreground tracking-tight">
                Profile Customization Studio
              </h2>
              <p className="text-xs text-muted-foreground">
                Personalize your avatar frame and animated name identity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Live Preview Studio Banner */}
          <div className="relative overflow-hidden p-6 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-muted/30 to-card shadow-inner flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-5 min-w-0 relative z-10">
              <div className="shrink-0 p-1 rounded-full bg-background/50 border border-border/50 shadow-sm">
                <AvatarWithFrame
                  src={user.avatar_url}
                  alt={user.login}
                  size="xl"
                  frameId={avatarFrame}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkle className="w-2.5 h-2.5" />
                  Live Preview
                </span>
                <h3 className="font-bold text-lg text-foreground truncate">
                  <NameEffect text={user.name ?? user.login} effectId={nameEffect} />
                </h3>
                <p className="text-xs text-muted-foreground font-mono">@{user.login}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0">
              <div className="text-right px-3 py-1.5 rounded-xl bg-background/80 border text-[11px] font-medium text-muted-foreground shadow-xs">
                <span>Frame: <strong className="text-foreground">{AVATAR_FRAMES.find(f => f.id === avatarFrame)?.name}</strong></span>
              </div>
            </div>
          </div>

          {/* Navigation & Controls Section */}
          <div className="space-y-4">
            
            {/* Primary Mode Tabs & Categories */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-muted/80 rounded-2xl shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("frames")}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-xl transition-all select-none flex items-center gap-2",
                    activeTab === "frames"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Avatar Frames</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px]",
                    activeTab === "frames" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {AVATAR_FRAMES.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("name_effects")}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-xl transition-all select-none flex items-center gap-2",
                    activeTab === "name_effects"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Name Effects</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px]",
                    activeTab === "name_effects" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {NAME_EFFECTS.length}
                  </span>
                </button>
              </div>

              {/* Category Pills */}
              {activeTab === "frames" ? (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                  {(["All", "Seasonal", "Sci-Fi", "Fantasy", "Luxury", "Cosmic", "Aesthetic"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFrameCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all shrink-0 select-none",
                        frameCategory === cat
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                  {(["All", "Seasonal", "Typing", "Popular", "Gaming", "Luxury", "Sci-Fi"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEffectCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all shrink-0 select-none",
                        effectCategory === cat
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid 1: Frames */}
            {activeTab === "frames" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {AVATAR_FRAMES.filter((f) => frameCategory === "All" || f.category === frameCategory).map((frame) => {
                  const isSelected = avatarFrame === frame.id;
                  return (
                    <div
                      key={frame.id}
                      onClick={() => setAvatarFrame(frame.id)}
                      className={cn(
                        "group relative flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm"
                          : "border-border/80 bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="shrink-0">
                        <AvatarWithFrame
                          src={user.avatar_url}
                          alt={frame.name}
                          size="md"
                          frameId={frame.id}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {frame.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {frame.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid 2: Name Effects */}
            {activeTab === "name_effects" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {NAME_EFFECTS.filter((e) => effectCategory === "All" || e.category === effectCategory).map((effect) => {
                  const isSelected = nameEffect === effect.id;
                  return (
                    <div
                      key={effect.id}
                      onClick={() => setNameEffect(effect.id)}
                      className={cn(
                        "group relative flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm"
                          : "border-border/80 bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2 space-y-1">
                        <div className="text-xs font-bold text-foreground truncate">
                          <NameEffect text={user.name ?? user.login} effectId={effect.id} />
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {effect.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t bg-muted/30 shrink-0">
          <Button size="sm" onClick={onClose} className="text-xs h-9 px-6 font-semibold shadow-sm">
            Save & Close
          </Button>
        </div>
      </div>
    </div>
  );
}

