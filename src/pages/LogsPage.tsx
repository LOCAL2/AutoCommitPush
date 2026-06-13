import { useState } from "react";
import { Download, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogStore } from "@/store/logStore";
import { useToast } from "@/components/ui/toast";
import type { LogLevel } from "@/types";

const levelColors: Record<LogLevel, string> = {
  success: "text-github-green bg-github-green/10",
  error: "text-github-red bg-github-red/10",
  warning: "text-github-orange bg-github-orange/10",
  info: "text-github-blue bg-github-blue/10",
};

export default function LogsPage() {
  const { logs, clearLogs, exportLogs } = useLogStore();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LogLevel | "all">("all");

  const filtered = logs.filter((l) => {
    const matchLevel = filter === "all" || l.level === filter;
    const matchSearch =
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      (l.projectLabel ?? "").toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const handleExport = () => {
    const content = exportLogs();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autocommitpush-logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Logs exported!");
  };

  return (
    <div className="p-6 space-y-4 animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Logs</h1>
          <p className="text-sm text-muted-foreground">{logs.length} entries</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => {
              clearLogs();
              showToast("info", "Logs cleared");
            }}
          >
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
            className="pl-9"
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

      {/* Log list */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${levelColors[log.level]}`}
                >
                  {log.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{log.message}</p>
                  {log.projectLabel && (
                    <p className="text-xs text-muted-foreground">{log.projectLabel}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
