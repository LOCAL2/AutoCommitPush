import { useEffect, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import {
  Moon, Sun, Monitor, LogOut, User, Container,
  Eye, EyeOff, CheckCircle2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
import { AvatarWithFrame, AVATAR_FRAMES } from "@/components/AvatarWithFrame";
import { NameEffect, NAME_EFFECTS } from "@/components/NameEffect";
import { testAiConnection } from "@/lib/ai-commit";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types";

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "dark",   label: "Dark",   icon: <Moon className="h-4 w-4" /> },
  { value: "light",  label: "Light",  icon: <Sun className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
];

// ─── Auto-save indicator ──────────────────────────────────────────────────────
function AutoSaveBadge({ saved }: { saved: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-xs transition-opacity duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
      <CheckCircle2 className="h-3.5 w-3.5 text-github-green" />
      <span className="text-github-green">Saved</span>
    </span>
  );
}

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { avatarFrame, setAvatarFrame, nameEffect, setNameEffect } = useSettingsStore();
  const [activeCustomTab, setActiveCustomTab] = useState<"frames" | "name_effects">("frames");
  const [frameCategory, setFrameCategory] = useState<"All" | "Sci-Fi" | "Fantasy" | "Luxury" | "Cosmic" | "Aesthetic">("All");
  const [effectCategory, setEffectCategory] = useState<"All" | "Typing" | "Popular" | "Gaming" | "Luxury" | "Sci-Fi">("All");
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();
  const [appVersion, setAppVersion] = useState<string>("");
  const [showAiKey, setShowAiKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion("1.0.8"));
  }, []);

  // Auto-save flash indicator
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => {
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
  };

  // Docker Hub credentials
  const [dockerUser, setDockerUser] = useState(settings.dockerUsername ?? "");
  const [dockerPass, setDockerPass] = useState(settings.dockerPassword ?? "");
  const [showDockerPass, setShowDockerPass] = useState(false);

  // Sync docker fields back to store with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      settings.setDockerCredentials(dockerUser, dockerPass);
      if (dockerUser || dockerPass) flashSaved();
    }, 600);
    return () => clearTimeout(t);
  }, [dockerUser, dockerPass]);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Changes save automatically</p>
        </div>
        <AutoSaveBadge saved={savedFlash} />
      </div>

      {/* ── Account & Profile Customization ── */}
      {user && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Profile & Appearance Customization
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Live Profile Header Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-card via-muted/40 to-card">
              <div className="flex items-center gap-4">
                <AvatarWithFrame
                  src={user.avatar_url}
                  alt={user.login}
                  size="xl"
                  frameId={avatarFrame}
                />
                <div>
                  <p className="font-bold text-base">
                    <NameEffect text={user.name ?? user.login} effectId={nameEffect} />
                  </p>
                  <p className="text-xs text-muted-foreground">@{user.login}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={async () => { await logout(); showToast("info", "Logged out"); }}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>

            {/* Customization Sub-Tab Switcher & Category Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b">
                <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveCustomTab("frames")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-all select-none",
                      activeCustomTab === "frames"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Profile Frames ({AVATAR_FRAMES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCustomTab("name_effects")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-all select-none",
                      activeCustomTab === "name_effects"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Name Effects ({NAME_EFFECTS.length})
                  </button>
                </div>

                {/* Category Filters depending on active tab */}
                {activeCustomTab === "frames" ? (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {(["All", "Sci-Fi", "Fantasy", "Luxury", "Cosmic", "Aesthetic"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFrameCategory(cat)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 select-none",
                          frameCategory === cat
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {(["All", "Typing", "Popular", "Gaming", "Luxury", "Sci-Fi"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEffectCategory(cat)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 select-none",
                          effectCategory === cat
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tab 1: Avatar Frames Grid */}
              {activeCustomTab === "frames" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {AVATAR_FRAMES.filter((f) => frameCategory === "All" || f.category === frameCategory).map((frame) => {
                    const isSelected = avatarFrame === frame.id;
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => {
                          setAvatarFrame(frame.id);
                          showToast("success", `Frame: ${frame.name}`);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group",
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                            : "border-border hover:bg-muted/50 hover:border-muted-foreground/30"
                        )}
                      >
                        <AvatarWithFrame
                          src={user.avatar_url}
                          alt={frame.name}
                          size="md"
                          frameId={frame.id}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{frame.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{frame.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Name Effects Grid */}
              {activeCustomTab === "name_effects" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {NAME_EFFECTS.filter((e) => effectCategory === "All" || e.category === effectCategory).map((effect) => {
                    const isSelected = nameEffect === effect.id;
                    return (
                      <button
                        key={effect.id}
                        type="button"
                        onClick={() => {
                          setNameEffect(effect.id);
                          showToast("success", `Name Effect: ${effect.name}`);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group",
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                            : "border-border hover:bg-muted/50 hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold mb-0.5 truncate">
                            <NameEffect text={user.name ?? user.login} effectId={effect.id} />
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{effect.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── AI Commit Generator ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" /> AI Commit Generator Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">AI Provider</label>
            <div className="flex gap-2">
              {(["gemini", "openai"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    settings.setAiProvider(p);
                    flashSaved();
                  }}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all capitalize select-none",
                    settings.aiProvider === p
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  {p === "gemini" ? "Google Gemini" : "OpenAI"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {settings.aiProvider === "gemini" ? "Gemini API Key" : "OpenAI API Key"}
              </label>
              <span className="text-[11px] text-muted-foreground">Optional (Custom Key)</span>
            </div>
            <div className="relative">
              <Input
                type={showAiKey ? "text" : "password"}
                value={
                  settings.aiProvider === "gemini"
                    ? settings.geminiApiKey ?? ""
                    : settings.openaiApiKey ?? ""
                }
                onChange={(e) => {
                  if (settings.aiProvider === "gemini") {
                    settings.setGeminiApiKey(e.target.value);
                  } else {
                    settings.setOpenAiApiKey(e.target.value);
                  }
                  flashSaved();
                }}
                placeholder={
                  settings.aiProvider === "gemini"
                    ? "Enter Gemini API Key (e.g. AIzaSy...)"
                    : "Enter OpenAI API Key (e.g. sk-...)"
                }
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowAiKey(!showAiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {(settings.aiProvider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey)
                ? `Custom ${settings.aiProvider === "gemini" ? "Gemini" : "OpenAI"} API Key saved.`
                : "Leave blank to use free built-in fallback."}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Test your AI API connection before pushing
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={testingAi}
              onClick={async () => {
                setTestingAi(true);
                const currentKey =
                  settings.aiProvider === "gemini"
                    ? settings.geminiApiKey
                    : settings.openaiApiKey;
                try {
                  const sampleMsg = await testAiConnection(
                    currentKey,
                    settings.aiProvider
                  );
                  showToast("success", `Connection Success! Test response: "${sampleMsg}"`);
                } catch (err: any) {
                  showToast("error", `Connection Failed: ${err.message || String(err)}`);
                } finally {
                  setTestingAi(false);
                }
              }}
            >
              {testingAi ? "Testing..." : "⚡ Test Connection"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── App Updates ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" /> Application Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Installed Version Row */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">Installed Version</p>
              <p className="text-xs text-muted-foreground">Currently running version of AutoCommitPush</p>
            </div>
            <span className="text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md">
              {appVersion ? `v${appVersion}` : "..."}
            </span>
          </div>

          <div className="border-t border-border/50" />

          {/* Check for Updates Row */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">Check for Updates</p>
              <p className="text-xs text-muted-foreground">Fetch latest releases from GitHub server</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const { check } = await import("@tauri-apps/plugin-updater");
                  const update = await check();
                  if (update) {
                    showToast("info", `Update v${update.version} available. Downloading...`);
                    await update.downloadAndInstall();
                    showToast("success", "Update installed. Please restart the app.");
                  } else {
                    showToast("success", "You are on the latest version.");
                  }
                } catch (err: any) {
                  showToast("error", `Update failed: ${err.message || String(err)}`);
                }
              }}
            >
              Check Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Git Author ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Git Author</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={settings.authorName}
              onChange={(e) => { settings.setAuthorName(e.target.value); flashSaved(); }}
              placeholder="Your Name"
              className={!settings.authorName ? "border-github-orange/50 focus:border-github-orange" : ""}
            />
            {!settings.authorName && (
              <p className="text-xs text-github-orange">Required — used as git commit author name</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={settings.authorEmail}
              onChange={(e) => { settings.setAuthorEmail(e.target.value); flashSaved(); }}
              placeholder="you@example.com"
              className={!settings.authorEmail ? "border-github-orange/50 focus:border-github-orange" : ""}
            />
            {!settings.authorEmail && (
              <p className="text-xs text-github-orange">Required — used as git commit author email</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Commit ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Commit</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Default Commit Message</label>
            <Input
              value={settings.defaultCommitMessage}
              onChange={(e) => { settings.setDefaultCommitMessage(e.target.value); flashSaved(); }}
              placeholder="Update project"
            />
            <p className="text-xs text-muted-foreground">A timestamp is appended automatically</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Repository ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Repository Defaults</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Private by default</p>
              <p className="text-xs text-muted-foreground">New repos will be private</p>
            </div>
            <Toggle
              value={settings.defaultPrivate}
              onChange={(v) => { settings.setDefaultPrivate(v); flashSaved(); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Docker Hub ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Container className="h-4 w-4" /> Docker Hub
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-github-orange/15 text-github-orange border border-github-orange/30">
              BETA
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Enter your Docker Hub credentials to enable pushing images directly from the app.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Docker Hub Username</label>
            <Input
              value={dockerUser}
              onChange={(e) => setDockerUser(e.target.value)}
              placeholder="dockerhubuser"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Docker Hub Password / Token</label>
            <div className="relative">
              <Input
                type={showDockerPass ? "text" : "password"}
                value={dockerPass}
                onChange={(e) => setDockerPass(e.target.value)}
                placeholder="••••••••••••"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowDockerPass(!showDockerPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showDockerPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use a Docker Hub Access Token instead of your password for better security.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Default Image Tag</label>
            <Input
              value={settings.dockerDefaultTag ?? "latest"}
              onChange={(e) => { settings.setDockerDefaultTag(e.target.value); flashSaved(); }}
              placeholder="latest"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button key={t.value} onClick={() => { settings.setTheme(t.value); flashSaved(); }}
                className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm transition-colors ${
                  settings.theme === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
        value ? "bg-primary" : "bg-input"
      }`}>
      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
        value ? "translate-x-4" : "translate-x-0"
      }`} />
    </button>
  );
}
