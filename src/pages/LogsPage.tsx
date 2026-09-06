import { useState, useRef, useEffect } from "react";
import { Download, Trash2, Search, Filter, AlertCircle, CheckCircle2, Info, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogStore } from "@/store/logStore";
import { useToast } from "@/components/ui/toast";
import FolderPicker from "@/components/FolderPicker";
import type { LogLevel } from "@/types";

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVEL_CFG: Record<LogLevel, {
  label: string;
  icon: React.ElementType;
  iconCls: string;
  bgCls: string;
  msgCls: string;
}> = {
  info:    { label: "INFO",  icon: Info,           iconCls: "text-github-blue",   bgCls: "hover:bg-github-blue/5 border-l-github-blue/40",   msgCls: "text-foreground/80" },
  success: { label: "OK",    icon: CheckCircle2,   iconCls: "text-github-green",  bgCls: "hover:bg-github-green/5 border-l-github-green/40",  msgCls: "text-foreground/80" },
  warning: { label: "WARN",  icon: AlertTriangle,  iconCls: "text-github-orange", bgCls: "bg-github-orange/5 hover:bg-github-orange/10 border-l-github-orange/60", msgCls: "text-github-orange/90" },
  error:   { label: "ERROR", icon: AlertCircle,    iconCls: "text-github-red",    bgCls: "bg-github-red/5 hover:bg-github-red/10 border-l-github-red/60",    msgCls: "text-github-red/90" },
};

function formatTs(iso: string) {
  const d = new Date(iso);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export default function LogsPage() {
  const { logs, clearLogs, exportLogs } = useLogStore();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Auto-select first if none selected
  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.find(l => l.id === selectedId))) {
      setSelectedId(filtered[0].id);
    } else if (filtered.length === 0) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

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

  const selectedLog = filtered.find(l => l.id === selectedId);

  const handleCopy = () => {
    if (!selectedLog) return;
    const text = JSON.stringify(selectedLog, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm" variant="outline" className="text-destructive"
              onClick={() => { clearLogs(); showToast("info", "Logs cleared"); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-mono text-sm"
            />
          </div>
          <div className="flex bg-muted/50 p-1 rounded-md">
            {(["all", "error", "warning", "info", "success"] as const).map((l) => (
              <button key={l} onClick={() => setFilter(l)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === l
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}>
                {l !== "all" && (() => {
                  const Icon = LEVEL_CFG[l as LogLevel].icon;
                  const color = LEVEL_CFG[l as LogLevel].iconCls;
                  return <Icon className={`h-3.5 w-3.5 ${color}`} />;
                })()}
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Master-Detail View */}
        <div className="flex-1 overflow-hidden rounded-xl border bg-card flex flex-col md:flex-row shadow-sm">
          
          {/* Left Pane (Master List) */}
          <div className="w-full md:w-[45%] flex flex-col border-r">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0 font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              <span>Timestamp & Message</span>
              <span>{filtered.length} results</span>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                  <Filter className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search ? `No results for "${search}"` : "No logs found"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filtered.map((log) => {
                    const cfg = LEVEL_CFG[log.level];
                    const Icon = cfg.icon;
                    const isSelected = selectedId === log.id;
                    
                    return (
                      <button
                        key={log.id}
                        onClick={() => setSelectedId(log.id)}
                        className={`w-full text-left p-3 flex gap-3 transition-colors border-l-2 ${
                          isSelected ? "bg-muted/50 border-l-primary" : cfg.bgCls
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <Icon className={`h-4 w-4 ${cfg.iconCls}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground/70">
                              {formatTs(log.timestamp).split(' ')[1]}
                            </span>
                            {log.projectLabel && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[100px]">
                                {log.projectLabel}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs line-clamp-2 leading-relaxed ${cfg.msgCls}`}>
                            {log.message}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane (Details) */}
          <div className="w-full md:w-[55%] flex flex-col bg-background/50">
            {selectedLog ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10 shrink-0">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Log Details
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-github-green" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-mono uppercase">Level</p>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                           const cfg = LEVEL_CFG[selectedLog.level];
                           const Icon = cfg.icon;
                           return (
                             <>
                               <Icon className={`h-4 w-4 ${cfg.iconCls}`} />
                               <span className="text-sm font-medium">{cfg.label}</span>
                             </>
                           );
                        })()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-mono uppercase">Timestamp</p>
                      <p className="text-sm font-mono">{formatTs(selectedLog.timestamp)}</p>
                    </div>
                    
                    {selectedLog.projectLabel && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-mono uppercase">Project</p>
                        <p className="text-sm font-medium">{selectedLog.projectLabel}</p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-mono uppercase">Log ID</p>
                      <p className="text-xs font-mono text-muted-foreground truncate" title={selectedLog.id}>{selectedLog.id}</p>
                    </div>
                  </div>

                  {/* Message Block */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground font-mono uppercase pl-1">Message</p>
                    <div className="bg-card border rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm">
                      <span className={LEVEL_CFG[selectedLog.level].msgCls}>
                        {selectedLog.message}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Info className="h-10 w-10 opacity-20" />
                <p className="text-sm">Select a log entry to view details</p>
              </div>
            )}
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
