import { useEffect, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import {
  Moon, Sun, Monitor, LogOut, User, Container,
  Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
import { AvatarWithFrame, AVATAR_FRAMES } from "@/components/AvatarWithFrame";
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
  const { avatarFrame, setAvatarFrame } = useSettingsStore();
  const [frameCategory, setFrameCategory] = useState<"All" | "Sci-Fi" | "Fantasy" | "Luxury" | "Cosmic" | "Aesthetic">("All");
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();
  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion("1.0.6"));
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

      {/* ── Account & Avatar Customization ── */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Account & Profile Frame
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b">
              <div className="flex items-center gap-4">
                <AvatarWithFrame
                  src={user.avatar_url}
                  alt={user.login}
                  size="xl"
                  frameId={avatarFrame}
                />
                <div>
                  <p className="font-semibold text-base">{user.name ?? user.login}</p>
                  <p className="text-xs text-muted-foreground">@{user.login}</p>
                </div>
              </div>
              <Button variant="outline" size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={async () => { await logout(); showToast("info", "Logged out"); }}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>

            {/* Frame Picker */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Avatar Profile Frames</h4>
                <p className="text-xs text-muted-foreground">Select a custom border glow effect for your profile picture</p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {(["All", "Sci-Fi", "Fantasy", "Luxury", "Cosmic", "Aesthetic"] as const).map((cat) => {
                  const isActive = frameCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFrameCategory(cat)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 select-none",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {AVATAR_FRAMES.filter((f) => frameCategory === "All" || f.category === frameCategory).map((frame) => {
                  const isSelected = avatarFrame === frame.id;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => {
                        setAvatarFrame(frame.id);
                        showToast("success", `Frame changed to ${frame.name}`);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative overflow-hidden group",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate">{frame.name}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{frame.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
