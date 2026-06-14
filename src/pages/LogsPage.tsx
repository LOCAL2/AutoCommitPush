import { useState, useRef, useEffect } from "react";
import { Download, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogStore } from "@/store/logStore";
import { useToast } from "@/components/ui/toast";
import FolderPicker from "@/components/FolderPicker";
import type { LogEntry, LogLevel } from "@/types";

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVEL_CFG: Record<LogLevel, {
  label: string;
  badgeCls: string;
  leftBorder: string;
  msgCls: string;
}> = {
  info:    { label: "INFO",  badgeCls: "text-github-blue   bg-github-blue/10",   leftBorder: "border-l-github-blue/40",   msgCls: "text-foreground/80"        },
  success: { label: "OK",    badgeCls: "text-github-green  bg-github-green/10",  leftBorder: "border-l-github-green/40",  msgCls: "text-foreground/80"        },
  warning: { label: "WARN",  badgeCls: "text-github-orange bg-github-orange/10", leftBorder: "border-l-github-orange/60", msgCls: "text-github-orange/90"     },
  error:   { label: "ERROR", badgeCls: "text-github-red    bg-github-red/10",    leftBorder: "border-l-github-red/60",    msgCls: "text-github-red/90"        },
};

function formatTs(iso: string) {
  const d = new Date(iso);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

// ─── Single row ───────────────────────────────────────────────────────────────
function LogRow({ log, index }: { log: LogEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CFG[log.level];

  return (
    <div className={`border-b border-border/50 border-l-2 ${cfg.leftBorder} ${open ? "bg-muted/30" : "hover:bg-muted/20"} transition-colors`}>
      {/* Main row — click to expand */}
      <div
        className="flex gap-0 cursor-pointer select-text"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Line # */}
        <span className="text-muted-foreground/25 font-mono text-[11px] w-9 text-right pr-3 pt-3 shrink-0 select-none self-start">
          {index + 1}
        </span>

        {/* Body */}
        <div className="flex-1 min-w-0 py-2.5 pr-2">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-muted-foreground/50 tabular-nums shrink-0">
              {formatTs(log.timestamp)}
            </span>
            <span className={`inline-block px-1.5 py-px rounded text-[10px] font-bold uppercase shrink-0 ${cfg.badgeCls}`}>
              {cfg.label}
            </span>
            {log.projectLabel && (
              <span className="text-[11px] text-muted-foreground/50 font-mono shrink-0">
                {log.projectLabel}
              </span>
            )}
          </div>
          {/* Message */}
          <p className={`mt-1 text-sm leading-snug break-words ${cfg.msgCls}`}>
            {log.message}
          </p>
        </div>

        {/* Expand chevron */}
        <span className="text-muted-foreground/30 shrink-0 pr-3 pt-3 self-start text-[10px] select-none">
          {open ? "▾" : "▸"}
        </span>
      </div>

      {/* Detail block */}
      {open && (
        <div className="ml-9 mr-4 mb-2.5 px-3 py-2.5 rounded-md bg-muted/40 border border-border/60 font-mono text-xs space-y-1">
          <div className="flex gap-2">
            <span className="text-muted-foreground/40 w-28 shrink-0">log_id</span>
            <span className="text-muted-foreground/60">=</span>
            <span className="text-muted-foreground/70">{log.id}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground/40 w-28 shrink-0">timestamp</span>
            <span className="text-muted-foreground/60">=</span>
            <span className="text-muted-foreground/70">{log.timestamp}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground/40 w-28 shrink-0">level</span>
            <span className="text-muted-foreground/60">=</span>
            <span className={cfg.badgeCls.split(" ")[0]}>{log.level}</span>
          </div>
          {log.projectId && (
            <div className="flex gap-2">
              <span className="text-muted-foreground/40 w-28 shrink-0">project_id</span>
              <span className="text-muted-foreground/60">=</span>
              <span className="text-primary/60">{log.projectId}</span>
            </div>
          )}
          {log.projectLabel && (
            <div className="flex gap-2">
              <span className="text-muted-foreground/40 w-28 shrink-0">project_label</span>
              <span className="text-muted-foreground/60">=</span>
              <span className="text-foreground/70">&quot;{log.projectLabel}&quot;</span>
            </div>
          )}
          <div className="flex gap-2 pt-0.5 border-t border-border/40 mt-1">
            <span className="text-muted-foreground/40 w-28 shrink-0">message</span>
            <span className="text-muted-foreground/60">=</span>
            <span className={`break-all ${cfg.msgCls}`}>&quot;{log.message}&quot;</span>
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
  const [autoScroll] = useState(false); // latest on top — no need to auto-scroll
  const topRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top on new log (latest first)
  useEffect(() => {
    if (autoScroll) topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoScroll]);

  const filtered = [...logs]
    .filter((l) => {
      const matchLevel = filter === "all" || l.level === filter;
      const matchSearch =
        l.message.toLowerCase().includes(search.toLowerCase()) ||
        (l.projectLabel ?? "").toLowerCase().includes(search.toLowerCase());
      return matchLevel && matchSearch;
    })
    // newest first
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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

  const countOf = (l: LogLevel) => logs.filter((e) => e.level === l).length;

  return (
    <>
      <div className="p-6 space-y-4 animate-fade-in flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Logs</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 space-x-2">
              <span>{logs.length} total</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-github-red">{countOf("error")} error</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-github-orange">{countOf("warning")} warn</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-github-green">{countOf("success")} ok</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-github-blue">{countOf("info")} info</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowFolderPicker(true)}>
              <Download className="h-4 w-4" /> Export .log
            </Button>
            <Button size="sm" variant="outline" className="text-destructive"
              onClick={() => { clearLogs(); showToast("info", "Logs cleared"); }}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>

        {/* Filters */}
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
              <button key={l} onClick={() => setFilter(l)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-hidden rounded-lg border bg-card flex flex-col">

          {/* Rows */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div ref={topRef} />
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                <Filter className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? `No results for "${search}"` : "No logs found"}
                </p>
              </div>
            ) : (
              filtered.map((log, i) => (
                <LogRow key={log.id} log={log} index={i} />
              ))
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1 border-t bg-muted/20 shrink-0 font-mono text-[11px] text-muted-foreground">
            <span>
              {filtered.length}/{logs.length} entries · newest first
              {filter !== "all" && ` · filter: ${filter}`}
              {search && ` · grep: "${search}"`}
            </span>
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
