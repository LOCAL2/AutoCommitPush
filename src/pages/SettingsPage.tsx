import { useEffect, useRef } from "react";
import {
  Moon, Sun, Monitor, LogOut, User, Container,
  Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
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
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();

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

      {/* ── Account ── */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={user.avatar_url} alt={user.login}
                  className="w-10 h-10 rounded-full ring-2 ring-border" />
                <div>
                  <p className="font-medium text-sm">{user.name ?? user.login}</p>
                  <p className="text-xs text-muted-foreground">@{user.login}</p>
                </div>
              </div>
              <Button variant="outline" size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={async () => { await logout(); showToast("info", "Logged out"); }}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        value ? "bg-primary" : "bg-secondary"
      }`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        value ? "translate-x-4" : "translate-x-1"
      }`} />
    </button>
  );
}
