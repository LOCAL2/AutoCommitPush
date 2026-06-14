import { useState, useRef, useEffect } from "react";
import { Download, Trash2, Search, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogStore } from "@/store/logStore";
import { useToast } from "@/components/ui/toast";
import FolderPicker from "@/components/FolderPicker";
import type { LogEntry, LogLevel } from "@/types";

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVEL_CFG: Record<LogLevel, { label: string; classes: string }> = {
  info:    { label: "INFO",  classes: "text-github-blue   bg-github-blue/10"   },
  success: { label: "OK",    classes: "text-github-green  bg-github-green/10"  },
  warning: { label: "WARN",  classes: "text-github-orange bg-github-orange/10" },
  error:   { label: "ERROR", classes: "text-github-red    bg-github-red/10"    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`
  );
}

// ─── Single row ───────────────────────────────────────────────────────────────
function LogRow({ log, index }: { log: LogEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CFG[log.level];
  const hasDetail = !!log.projectLabel || !!log.projectId;

  return (
    <div className={`border-b transition-colors ${open ? "bg-muted/30" : "hover:bg-muted/20"}`}>
      {/* Main line */}
      <div
        className="flex items-start gap-3 px-4 py-2 cursor-pointer select-text"
        onClick={() => hasDetail && setOpen((v) => !v)}
      >
        {/* Line # */}
        <span className="text-muted-foreground/40 font-mono text-[11px] w-7 text-right shrink-0 pt-0.5 select-none">
          {index + 1}
        </span>

        {/* Timestamp */}
        <span className="font-mono text-xs text-muted-foreground shrink-0 pt-0.5 tabular-nums">
          {formatTs(log.timestamp)}
        </span>

        {/* Level badge */}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 w-12 text-center ${cfg.classes}`}>
          {cfg.label}
        </span>

        {/* Project label */}
        {log.projectLabel && (
          <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">
            [{log.projectLabel}]
          </span>
        )}

        {/* Message */}
        <span className="text-sm flex-1 break-all">{log.message}</span>

        {/* Expand icon */}
        {hasDetail && (
          <span className="text-muted-foreground/40 shrink-0 pt-0.5 hover:text-muted-foreground transition-colors">
            {open
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>

      {/* Detail block */}
      {open && hasDetail && (
        <div className="mx-4 mb-2 ml-[3.75rem] px-3 py-2 rounded-md bg-muted/40 border font-mono text-xs space-y-0.5">
          {log.projectId && (
            <div className="flex gap-2">
              <span className="text-muted-foreground/60 w-24 shrink-0">project_id</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-primary/80">{log.projectId}</span>
            </div>
          )}
          {log.projectLabel && (
            <div className="flex gap-2">
              <span className="text-muted-foreground/60 w-24 shrink-0">label</span>
              <span className="text-muted-foreground">=</span>
              <span>&quot;{log.projectLabel}&quot;</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-muted-foreground/60 w-24 shrink-0">timestamp</span>
            <span className="text-muted-foreground">=</span>
            <span className="text-muted-foreground">{log.timestamp}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground/60 w-24 shrink-0">level</span>
            <span className="text-muted-foreground">=</span>
            <span className={cfg.classes.split(" ")[0]}>{log.level}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LogsPage() {
  const { logs, clearLogs, exportLogs } = useLogStore();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  const filtered = logs.filter((l) => {
    const matchLevel = filter === "all" || l.level === filter;
    const matchSearch =
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      (l.projectLabel ?? "").toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const handleExport = async (dir: string) => {
    setShowFolderPicker(false);
    const filename = `acp-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.log`;
    const fullPath = `${dir}\\${filename}`;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("plugin:fs|write_text_file", { path: fullPath, contents: exportLogs() });
      showToast("success", `Exported → ${filename}`);
    } catch {
      const blob = new Blob([exportLogs()], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      showToast("success", "Logs exported");
    }
  };

  // Count per level
  const countOf = (l: LogLevel) => logs.filter((e) => e.level === l).length;

  return (
    <>
      <div className="p-6 space-y-4 animate-fade-in flex flex-col h-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Logs</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {logs.length} entries &middot;{" "}
              <span className="text-github-red">{countOf("error")} err</span>
              {" · "}
              <span className="text-github-orange">{countOf("warning")} warn</span>
              {" · "}
              <span className="text-github-green">{countOf("success")} ok</span>
              {" · "}
              <span className="text-github-blue">{countOf("info")} info</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowFolderPicker(true)}>
              <Download className="h-4 w-4" /> Export .log
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={() => { clearLogs(); showToast("info", "Logs cleared"); }}
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-mono text-sm"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "success", "error", "warning", "info"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setFilter(l)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Log table ── */}
        <div className="flex-1 overflow-hidden rounded-lg border bg-card flex flex-col">

          {/* Column header */}
          <div className="flex items-center gap-3 px-4 py-1.5 border-b bg-muted/30 shrink-0 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest select-none">
            <span className="w-7 text-right">#</span>
            <span className="w-[176px] shrink-0">timestamp</span>
            <span className="w-12 shrink-0 text-center">level</span>
            <span>message</span>
          </div>

          {/* Rows */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                <Filter className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? `No results for "${search}"` : "No logs found"}
                </p>
              </div>
            ) : (
              <>
                {filtered.map((log, i) => (
                  <LogRow key={log.id} log={log} index={i} />
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1 border-t bg-muted/20 shrink-0 font-mono text-[11px] text-muted-foreground">
            <span>
              {filtered.length}/{logs.length} entries
              {filter !== "all" && ` · filter: ${filter}`}
              {search && ` · grep: "${search}"`}
            </span>
            <div className="flex items-center gap-3">
              {!autoScroll && (
                <button
                  onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-github-orange hover:text-github-orange/80 transition-colors"
                >
                  ↓ scroll to latest
                </button>
              )}
              {!autoScroll && (
                <span className="text-muted-foreground/40">○ paused</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showFolderPicker && (
        <FolderPicker
          title="Export log file to..."
          confirmLabel="Save here"
          onSelect={handleExport}
          onCancel={() => setShowFolderPicker(false)}
        />
      )}
    </>
  );
}
