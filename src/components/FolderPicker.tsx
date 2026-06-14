import { useState, useEffect, useCallback } from "react";
import {
  X, ChevronRight, ChevronLeft, Folder, FolderOpen,
  HardDrive, Home, Check, Loader2, GitBranch,
  Monitor, Download, FileText, Image, Music, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as cmd from "@/lib/tauri-commands";

interface Props {
  title?: string;
  confirmLabel?: string;
  onSelect: (path: string) => void;
  onCancel: () => void;
}

interface DirEntry {
  name: string;
  path: string;
  is_git: boolean;
}

interface DriveEntry {
  name: string;
  path: string;
}

interface QuickEntry {
  label: string;
  icon: React.ReactNode;
  path: string | null;
}

export default function FolderPicker({
  title = "Select Folder",
  confirmLabel = "Select",
  onSelect,
  onCancel,
}: Props) {
  const [drives, setDrives] = useState<DriveEntry[]>([]);
  const [quickDirs, setQuickDirs] = useState<QuickEntry[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = currentPath
    ? currentPath.replace(/\\/g, "/").split("/").filter(Boolean)
    : [];

  const navigateTo = useCallback(async (path: string, pushHistory = true) => {
    setLoading(true);
    setError(null);
    try {
      const dirs = await cmd.listDirectories(path);
      if (pushHistory && currentPath) {
        setHistory((h) => [...h, currentPath]);
      }
      setCurrentPath(path);
      setEntries(dirs);
      setSelected(path);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    const init = async () => {
      const [drivesData, home, userDirs] = await Promise.all([
        cmd.getDrives().catch(() => [] as DriveEntry[]),
        cmd.getHomeDir().catch(() => null),
        cmd.getUserDirs().catch(() => null),
      ]);
      setDrives(drivesData);

      // Build fallback paths from home dir (e.g. C:\Users\Username)
      const fallback = (sub: string) =>
        home ? `${home}\\${sub}` : null;

      const quick: QuickEntry[] = [
        { label: "Home",      icon: <Home      className="h-3.5 w-3.5 shrink-0" />, path: home },
        { label: "Desktop",   icon: <Monitor   className="h-3.5 w-3.5 shrink-0" />, path: userDirs?.desktop   ?? fallback("Desktop") },
        { label: "Downloads", icon: <Download  className="h-3.5 w-3.5 shrink-0" />, path: userDirs?.downloads ?? fallback("Downloads") },
        { label: "Documents", icon: <FileText  className="h-3.5 w-3.5 shrink-0" />, path: userDirs?.documents ?? fallback("Documents") },
        { label: "Pictures",  icon: <Image     className="h-3.5 w-3.5 shrink-0" />, path: userDirs?.pictures  ?? fallback("Pictures") },
        { label: "Music",     icon: <Music     className="h-3.5 w-3.5 shrink-0" />, path: userDirs?.music     ?? fallback("Music") },
        { label: "Videos",    icon: <Video     className="h-3.5 w-3.5 shrink-0" />, path: userDirs?.videos    ?? fallback("Videos") },
      ].filter((q) => q.path !== null);
      setQuickDirs(quick);

      const start = home ?? drivesData[0]?.path ?? "C:\\";
      navigateTo(start, false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    navigateTo(prev, false);
  };

  const goUp = () => {
    if (!currentPath) return;
    const parts = currentPath.replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.length <= 1) return;
    parts.pop();
    const parent = parts.join("\\") + (parts.length === 1 ? "\\" : "");
    navigateTo(parent);
  };

  const navBreadcrumb = (index: number) => {
    const parts = currentPath.replace(/\\/g, "/").split("/").filter(Boolean);
    const target = parts.slice(0, index + 1).join("\\") + (index === 0 ? "\\" : "");
    navigateTo(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-xl border bg-card shadow-2xl animate-fade-in flex flex-col overflow-hidden"
        style={{ height: "520px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b bg-secondary/20 shrink-0">
          <button onClick={goBack} disabled={history.length === 0} title="Back"
            className="p-1.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goUp} disabled={breadcrumbs.length <= 1} title="Up"
            className="p-1.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
            <ChevronRight className="h-4 w-4 rotate-[-90deg]" />
          </button>
          <div className="flex items-center gap-0.5 ml-1 overflow-x-auto flex-1 text-xs min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-0.5 shrink-0">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                <button
                  onClick={() => navBreadcrumb(i)}
                  className="px-1.5 py-0.5 rounded hover:bg-secondary font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-36 shrink-0 border-r bg-secondary/10 overflow-y-auto py-2">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Quick Access
            </p>
            {quickDirs.map((q) => (
              <button
                key={q.label}
                onClick={() => q.path && navigateTo(q.path)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-secondary transition-colors ${
                  currentPath === q.path ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                {q.icon}
                <span className="truncate">{q.label}</span>
              </button>
            ))}

            <p className="px-3 py-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Drives
            </p>
            {drives.map((d) => (
              <button
                key={d.path}
                onClick={() => navigateTo(d.path)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-secondary transition-colors ${
                  currentPath.startsWith(d.path) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <HardDrive className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono">{d.name}</span>
              </button>
            ))}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full px-6 text-center">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
            {!loading && !error && entries.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground italic">Empty folder</p>
              </div>
            )}
            {!loading && !error && entries.map((entry) => {
              const isSelected = selected === entry.path;
              return (
                <button
                  key={entry.path}
                  onClick={() => setSelected(entry.path)}
                  onDoubleClick={() => navigateTo(entry.path)}
                  className={`flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left transition-colors ${
                    isSelected ? "bg-primary/15 text-primary" : "hover:bg-secondary/60 text-foreground"
                  }`}
                >
                  {isSelected
                    ? <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    : <Folder className="h-4 w-4 shrink-0 text-muted-foreground/70" />}
                  <span className="flex-1 truncate">{entry.name}</span>
                  {entry.is_git && (
                    <GitBranch className="h-3 w-3 shrink-0 text-github-green opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t bg-secondary/10 shrink-0">
          <p className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0">
            {selected || currentPath || "—"}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button
              size="sm"
              variant="success"
              disabled={!selected && !currentPath}
              onClick={() => onSelect(selected || currentPath)}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
