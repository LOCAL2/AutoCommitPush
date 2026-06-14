import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, AlertTriangle, XCircle, Loader2,
  RefreshCw, ExternalLink, GitBranch, Shield,
  Wifi, HardDrive, FolderOpen, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as cmd from "@/lib/tauri-commands";
import type { CheckResult } from "@/lib/tauri-commands";

// ── Icon per check id ─────────────────────────────────────────────────────────
const CHECK_ICONS: Record<string, React.ReactNode> = {
  os:       <Monitor className="h-4 w-4" />,
  webview2: <Monitor className="h-4 w-4" />,
  git:      <GitBranch className="h-4 w-4" />,
  keyring:  <Shield className="h-4 w-4" />,
  internet: <Wifi className="h-4 w-4" />,
  disk:     <HardDrive className="h-4 w-4" />,
  writable: <FolderOpen className="h-4 w-4" />,
};

// ── Status styles ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ok: {
    icon: <CheckCircle2 className="h-4 w-4 text-github-green" />,
    bg: "bg-github-green/5 border-github-green/20",
    badge: "bg-github-green/15 text-github-green",
    label: "OK",
  },
  warn: {
    icon: <AlertTriangle className="h-4 w-4 text-github-orange" />,
    icon_sm: <AlertTriangle className="h-3 w-3" />,
    bg: "bg-github-orange/5 border-github-orange/20",
    badge: "bg-github-orange/15 text-github-orange",
    label: "Warning",
  },
  error: {
    icon: <XCircle className="h-4 w-4 text-github-red" />,
    bg: "bg-github-red/5 border-github-red/20",
    badge: "bg-github-red/15 text-github-red",
    label: "Error",
  },
  checking: {
    icon: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />,
    bg: "bg-muted/30 border-border",
    badge: "bg-muted text-muted-foreground",
    label: "Checking...",
  },
};

const CHECK_IDS = ["os", "webview2", "git", "keyring", "internet", "disk", "writable"];

const CHECK_LABELS: Record<string, string> = {
  os: "Operating System",
  webview2: "WebView2 Runtime",
  git: "Git (libgit2)",
  keyring: "Credential Storage",
  internet: "Internet / GitHub",
  disk: "Disk Space",
  writable: "App Data Directory",
};

interface Props {
  onDismiss?: () => void;
  embedded?: boolean; // show inside settings instead of full-screen
}

export default function SetupCheckPage({ onDismiss, embedded = false }: Props) {
  const [results, setResults] = useState<Record<string, CheckResult>>(() =>
    Object.fromEntries(
      CHECK_IDS.map((id) => [
        id,
        { id, label: CHECK_LABELS[id], status: "checking", detail: "Checking...", fix_url: null },
      ])
    )
  );
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // ── Run checks one-by-one for realtime feel ───────────────────────────────
  const runChecks = useCallback(async () => {
    setRunning(true);
    // Reset all to "checking"
    setResults(
      Object.fromEntries(
        CHECK_IDS.map((id) => [
          id,
          { id, label: CHECK_LABELS[id], status: "checking" as const, detail: "Checking...", fix_url: null },
        ])
      )
    );

    // Run each check individually so UI updates as each finishes
    for (const id of CHECK_IDS) {
      try {
        const result = await cmd.checkSingle(id);
        setResults((prev) => ({ ...prev, [id]: result }));
      } catch {
        setResults((prev) => ({
          ...prev,
          [id]: { id, label: CHECK_LABELS[id], status: "error", detail: "Check failed", fix_url: null },
        }));
      }
      // Small delay between checks for visual effect
      await new Promise((r) => setTimeout(r, 120));
    }

    setLastRun(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  // ── Summary ───────────────────────────────────────────────────────────────
  const allResults = Object.values(results);
  const errors = allResults.filter((r) => r.status === "error").length;
  const warns = allResults.filter((r) => r.status === "warn").length;
  const oks = allResults.filter((r) => r.status === "ok").length;
  const checking = allResults.filter((r) => r.status === "checking").length;
  const allOk = errors === 0 && warns === 0 && checking === 0;

  const content = (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
        checking > 0 ? "bg-muted/30 border-border"
        : allOk ? "bg-github-green/5 border-github-green/20"
        : errors > 0 ? "bg-github-red/5 border-github-red/20"
        : "bg-github-orange/5 border-github-orange/20"
      }`}>
        <div className="flex-1">
          {checking > 0 ? (
            <p className="text-sm font-medium flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              Running checks...
            </p>
          ) : allOk ? (
            <p className="text-sm font-medium text-github-green flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> All systems ready
            </p>
          ) : (
            <p className="text-sm font-medium flex items-center gap-2">
              {errors > 0
                ? <XCircle className="h-4 w-4 text-github-red" />
                : <AlertTriangle className="h-4 w-4 text-github-orange" />}
              {errors > 0 ? `${errors} error${errors > 1 ? "s" : ""} found` : `${warns} warning${warns > 1 ? "s" : ""}`}
            </p>
          )}
          {lastRun && !running && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last checked: {lastRun.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!running && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-github-green font-medium">{oks} ok</span>
              {warns > 0 && <span className="text-github-orange font-medium">{warns} warn</span>}
              {errors > 0 && <span className="text-github-red font-medium">{errors} error</span>}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={runChecks} disabled={running} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Running..." : "Re-check"}
          </Button>
        </div>
      </div>

      {/* Check items */}
      <div className="space-y-2">
        {CHECK_IDS.map((id) => {
          const result = results[id];
          const cfg = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.checking;
          const icon = CHECK_ICONS[id];

          return (
            <div
              key={id}
              className={`rounded-lg border px-4 py-3 flex items-center gap-3 transition-all duration-300 ${cfg.bg}`}
            >
              {/* Check icon */}
              <div className="text-muted-foreground/60 shrink-0">{icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{result.label}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{result.detail}</p>
              </div>

              {/* Status icon + fix link */}
              <div className="flex items-center gap-2 shrink-0">
                {result.fix_url && (
                  <a
                    href={result.fix_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      import("@tauri-apps/api/core").then(({ invoke }) =>
                        invoke("plugin:shell|open", { path: result.fix_url! })
                      );
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Fix
                  </a>
                )}
                {cfg.icon}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onDismiss}>
            {allOk ? "Continue →" : "Dismiss"}
          </Button>
        </div>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="p-6 space-y-4 animate-fade-in flex flex-col h-full overflow-y-auto">
      <div>
        <h1 className="text-xl font-semibold">System Requirements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Checking that everything is in order to run AutoCommitPush
        </p>
      </div>
      {content}
    </div>
  );
}
