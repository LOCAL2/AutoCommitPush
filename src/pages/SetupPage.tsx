import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, AlertCircle, XCircle, RefreshCw,
  ExternalLink, GitBranch, Shield, Wifi,
  Monitor, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CheckResult, checkSingle } from "@/lib/tauri-commands";

// ── Icon per check id ─────────────────────────────────────────────────────────
const CHECK_ICONS: Record<string, React.ReactNode> = {
  os:       <Monitor className="h-4 w-4" />,
  webview2: <Monitor className="h-4 w-4" />,
  git:      <GitBranch className="h-4 w-4" />,
  keyring:  <Shield className="h-4 w-4" />,
  internet: <Wifi className="h-4 w-4" />,
};

// ── Status styles ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { icon: React.ReactNode; ring: string; bg: string; text: string }> = {
  ok: {
    icon: <CheckCircle2 className="h-4 w-4 text-github-green" />,
    ring: "border-github-green/20",
    bg:   "bg-github-green/5",
    text: "text-github-green",
  },
  warn: {
    icon: <AlertCircle className="h-4 w-4 text-github-orange" />,
    ring: "border-github-orange/20",
    bg:   "bg-github-orange/5",
    text: "text-github-orange",
  },
  error: {
    icon: <XCircle className="h-4 w-4 text-github-red" />,
    ring: "border-github-red/20",
    bg:   "bg-github-red/5",
    text: "text-github-red",
  },
  checking: {
    icon: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
    ring: "border-primary/20",
    bg:   "bg-primary/5",
    text: "text-primary",
  },
};

const CHECK_IDS = ["os", "webview2", "git", "keyring", "internet"];

function placeholder(id: string): CheckResult {
  return { id, label: id, status: "checking", detail: "Checking...", fix_url: null };
}

export default function SetupPage() {
  const [checks, setChecks] = useState<CheckResult[]>(
    CHECK_IDS.map(placeholder)
  );
  const [running, setRunning] = useState(false);

  // ── Run all checks in parallel, update each as it resolves ─────────────────
  const runChecks = useCallback(async () => {
    setRunning(true);
    // Reset to "checking" state
    setChecks(CHECK_IDS.map(placeholder));

    // Fire all checks in parallel — update state as each one finishes
    await Promise.all(
      CHECK_IDS.map(async (id) => {
        try {
          const result = await checkSingle(id);
          setChecks((prev) =>
            prev.map((c) => (c.id === id ? result : c))
          );
        } catch {
          setChecks((prev) =>
            prev.map((c) =>
              c.id === id
                ? { id, label: id, status: "error", detail: "Check failed", fix_url: null }
                : c
            )
          );
        }
      })
    );

    setRunning(false);
  }, []);

  // ── Re-check single item ───────────────────────────────────────────────────
  const recheck = async (id: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? placeholder(id) : c))
    );
    try {
      const result = await checkSingle(id);
      setChecks((prev) => prev.map((c) => (c.id === id ? result : c)));
    } catch {
      setChecks((prev) =>
        prev.map((c) =>
          c.id === id
            ? { id, label: id, status: "error", detail: "Check failed", fix_url: null }
            : c
        )
      );
    }
  };

  // ── Auto-run on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    runChecks();
  }, [runChecks]);

  // ── Summary ────────────────────────────────────────────────────────────────
  const errors  = checks.filter((c) => c.status === "error").length;
  const warns   = checks.filter((c) => c.status === "warn").length;
  const oks     = checks.filter((c) => c.status === "ok").length;
  const allDone = checks.every((c) => c.status !== "checking");

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">System Requirements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Checking that everything needed to run AutoCommitPush is in place
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={runChecks}
          disabled={running}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
          Re-check all
        </Button>
      </div>

      {/* Summary bar */}
      {allDone && (
        <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 text-sm animate-fade-in ${
          errors > 0
            ? "bg-github-red/5 border-github-red/20"
            : warns > 0
            ? "bg-github-orange/5 border-github-orange/20"
            : "bg-github-green/5 border-github-green/20"
        }`}>
          {errors > 0 ? (
            <XCircle className="h-5 w-5 text-github-red shrink-0" />
          ) : warns > 0 ? (
            <AlertCircle className="h-5 w-5 text-github-orange shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-github-green shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {errors > 0
                ? `${errors} issue${errors > 1 ? "s" : ""} found — action required`
                : warns > 0
                ? `${warns} warning${warns > 1 ? "s" : ""} — app will work but may have limitations`
                : "All checks passed"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {oks} passed · {warns} warnings · {errors} errors
            </p>
          </div>
        </div>
      )}

      {/* Check cards */}
      <div className="space-y-2">
        {checks.map((check) => {
          const s = STATUS_STYLE[check.status] ?? STATUS_STYLE.checking;
          const icon = CHECK_ICONS[check.id];

          return (
            <div
              key={check.id}
              className={`rounded-lg border px-4 py-3 flex items-start gap-3 transition-all ${s.ring} ${s.bg}`}
            >
              {/* Category icon */}
              <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{check.label}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${s.text} ${s.bg} border ${s.ring}`}>
                    {check.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {check.detail}
                </p>

                {/* Fix link */}
                {check.fix_url && (
                  <a
                    href={check.fix_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      import("@tauri-apps/api/core").then(({ invoke }) =>
                        invoke("plugin:shell|open", { path: check.fix_url! })
                      );
                    }}
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Download / Fix
                  </a>
                )}
              </div>

              {/* Status icon + recheck */}
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                {s.icon}
                {check.status !== "checking" && (
                  <button
                    onClick={() => recheck(check.id)}
                    title="Re-check"
                    className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
