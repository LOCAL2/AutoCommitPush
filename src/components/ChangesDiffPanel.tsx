import { useState, useCallback, useEffect, useRef } from "react";
import {
  ChevronDown, ChevronRight, FileText, Plus, Minus, Loader2, Trash2,
} from "lucide-react";
import type { RepoStatus, FileDiff } from "@/types";import * as cmd from "@/lib/tauri-commands";

interface Props {
  projectPath: string;
  status: RepoStatus;
  onDiffCache?: (cache: Record<string, FileDiff>) => void;
}

type FileType = "New" | "Updated" | "Deleted";

interface FileEntry {
  path: string;
  type: FileType;
}

function fileEntries(status: RepoStatus): FileEntry[] {
  const seen = new Set<string>();
  const entries: FileEntry[] = [];

  for (const f of status.untracked) {
    if (!seen.has(f)) { seen.add(f); entries.push({ path: f, type: "New" }); }
  }
  for (const f of status.modified) {
    if (!seen.has(f)) { seen.add(f); entries.push({ path: f, type: "Updated" }); }
  }
  for (const f of (status.deleted ?? [])) {
    if (!seen.has(f)) { seen.add(f); entries.push({ path: f, type: "Deleted" }); }
  }
  return entries;
}

function normPath(p: string) {
  return p.replace(/\\/g, "/");
}

// ── Badge ────────────────────────────────────────────────────────────────────
const BADGE: Record<FileType, { label: string; cls: string }> = {
  New:     { label: "NEW", cls: "bg-github-green/20 text-github-green" },
  Updated: { label: "UPD", cls: "bg-github-orange/20 text-github-orange" },
  Deleted: { label: "DEL", cls: "bg-github-red/20 text-github-red" },
};

// ── Diff view ────────────────────────────────────────────────────────────────
function DiffView({ diff, loading, deleted }: { diff: FileDiff | null; loading: boolean; deleted?: boolean }) {
  if (deleted) {
    return (
      <div className="px-3 py-2 text-xs text-github-red/80 italic flex items-center gap-1.5">
        <Trash2 className="h-3.5 w-3.5" /> File deleted
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading diff...
      </div>
    );
  }
  if (!diff || diff.lines.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground italic">
        No diff available (binary or empty file)
      </div>
    );
  }
  return (
    <div className="diff-view font-mono text-[11px] leading-5 overflow-x-auto">
      {diff.lines.map((line, i) => {
        const isAdd = line.origin === "+";
        const isDel = line.origin === "-";
        return (
          <div key={i} className={`diff-line flex ${isAdd ? "diff-add" : isDel ? "diff-del" : "diff-context"}`}>
            <span className="diff-lineno w-8 shrink-0 text-right pr-2 select-none opacity-50">
              {isDel ? line.old_lineno ?? "" : line.new_lineno ?? ""}
            </span>
            <span className="diff-marker w-4 shrink-0 select-none">{line.origin}</span>
            <span className="diff-content flex-1 whitespace-pre">{line.content}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChangesDiffPanel({ projectPath, status, onDiffCache }: Props) {
  const entries = fileEntries(status);

  // Stable signature to detect real list changes (not just diff count changes)
  const fileSignature = entries.map((e) => `${e.type}:${e.path}`).join("\n");
  const prevSignatureRef = useRef("");

  const [expanded, setExpanded] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffCache, setDiffCache] = useState<Record<string, FileDiff>>({});
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

  // ── Load diff for one file ─────────────────────────────────────────────────
  const loadDiff = useCallback(async (filePath: string) => {
    // Only show spinner if we don't have a cached value yet
    setLoadingFiles((prev) => {
      const next = new Set(prev);
      next.add(filePath);
      return next;
    });
    try {
      const diffs = await cmd.getFileDiff(projectPath, filePath);
      const normalized = normPath(filePath);
      const match = diffs.find((d) => normPath(d.path) === normalized) ?? diffs[0];
      if (match) {
        // Update in-place — React will re-render with new numbers, no blank flash
        setDiffCache((prev) => {
          const next = { ...prev, [filePath]: match };
          onDiffCache?.(next);
          return next;
        });
      }
    } catch {
      // ignore
    } finally {
      setLoadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });
    }
  }, [projectPath]);

  // ── Preload / refresh diffs whenever status changes ───────────────────────
  useEffect(() => {
    const listChanged = fileSignature !== prevSignatureRef.current;
    prevSignatureRef.current = fileSignature;

    if (listChanged) {
      // File list changed — only evict entries no longer present, keep the rest
      // so existing +/- counts don't flash away
      setDiffCache((prev) => {
        const currentPaths = new Set(entries.map((e) => e.path));
        const next: Record<string, FileDiff> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (currentPaths.has(k)) next[k] = v;
        }
        return next;
      });
      setSelectedFile((prev) =>
        prev && entries.some((e) => e.path === prev) ? prev : null
      );
    }

    // Re-fetch diffs in background — cache is updated in-place so no flash
    entries.forEach((entry) => {
      if (entry.type !== "Deleted") loadDiff(entry.path);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, loadDiff]);

  const toggleFile = (filePath: string) => {
    setSelectedFile((prev) => {
      if (prev === filePath) return null;
      return filePath;
    });
  };

  if (entries.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border bg-muted/20">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
      >
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5" />
          : <ChevronRight className="h-3.5 w-3.5" />}
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{entries.length} changed file{entries.length !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground ml-1">· live</span>
        {/* Summary +/- totals */}
        {Object.keys(diffCache).length > 0 && (() => {
          const totAdd = Object.values(diffCache).reduce((s, d) => s + d.additions, 0);
          const totDel = Object.values(diffCache).reduce((s, d) => s + d.deletions, 0);
          return (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
              <Plus className="h-2.5 w-2.5 text-github-green" />{totAdd}
              <Minus className="h-2.5 w-2.5 text-github-red" />{totDel}
            </span>
          );
        })()}
      </button>

      {/* File list */}
      {expanded && (
        <div className="border-t divide-y divide-border max-h-80 overflow-y-auto">
          {entries.map((entry) => {
            const isOpen = selectedFile === entry.path;
            const diff = diffCache[entry.path];
            const isLoading = loadingFiles.has(entry.path);
            const badge = BADGE[entry.type];

            return (
              <div key={entry.path}>
                <button
                  onClick={() => toggleFile(entry.path)}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted/30 transition-colors ${isOpen ? "bg-muted/40" : ""}`}
                >
                  {isOpen
                    ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}

                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>

                  <span className={`text-xs font-mono truncate flex-1 ${entry.type === "Deleted" ? "line-through text-muted-foreground" : ""}`}>
                    {entry.path}
                  </span>

                  {/* +/- count — spinner only on first load, then update in-place */}
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 min-w-[52px] justify-end">
                    {entry.type === "Deleted" ? (
                      <Trash2 className="h-2.5 w-2.5 text-github-red" />
                    ) : diff ? (
                      <>
                        <Plus className="h-2.5 w-2.5 text-github-green" />{diff.additions}
                        <Minus className="h-2.5 w-2.5 text-github-red" />{diff.deletions}
                      </>
                    ) : isLoading ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : null}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t bg-background/50">
                    <DiffView
                      diff={diff ?? null}
                      loading={isLoading && !diff}
                      deleted={entry.type === "Deleted"}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
