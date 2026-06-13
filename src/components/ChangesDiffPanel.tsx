import { useState, useCallback, useEffect } from "react";
import {
  ChevronDown, ChevronRight, FileText, Plus, Minus, Loader2,
} from "lucide-react";
import type { RepoStatus, FileDiff } from "@/types";
import * as cmd from "@/lib/tauri-commands";

interface Props {
  projectPath: string;
  status: RepoStatus;
}

function fileEntries(status: RepoStatus) {
  const seen = new Set<string>();
  const entries: { path: string; type: "New" | "Modified" }[] = [];

  for (const f of status.untracked) {
    if (!seen.has(f)) {
      seen.add(f);
      entries.push({ path: f, type: "New" });
    }
  }
  for (const f of status.modified) {
    if (!seen.has(f)) {
      seen.add(f);
      entries.push({ path: f, type: "Modified" });
    }
  }
  return entries;
}

function normPath(p: string) {
  return p.replace(/\\/g, "/");
}

function DiffView({ diff, loading }: { diff: FileDiff | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading diff...
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
          <div
            key={i}
            className={`diff-line flex ${
              isAdd ? "diff-add" : isDel ? "diff-del" : "diff-context"
            }`}
          >
            <span className="diff-lineno w-8 shrink-0 text-right pr-2 select-none opacity-50">
              {isDel ? line.old_lineno ?? "" : line.new_lineno ?? ""}
            </span>
            <span className="diff-marker w-4 shrink-0 select-none">
              {line.origin}
            </span>
            <span className="diff-content flex-1 whitespace-pre">{line.content}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ChangesDiffPanel({ projectPath, status }: Props) {
  const entries = fileEntries(status);
  const fileSignature = entries.map((e) => e.path).join("\n");
  const [expanded, setExpanded] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffCache, setDiffCache] = useState<Record<string, FileDiff>>({});
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  useEffect(() => {
    setDiffCache({});
    setSelectedFile(null);
  }, [fileSignature]);

  const loadDiff = useCallback(async (filePath: string) => {
    setLoadingFile(filePath);
    try {
      const diffs = await cmd.getFileDiff(projectPath, filePath);
      const normalized = normPath(filePath);
      const match =
        diffs.find((d) => normPath(d.path) === normalized) ?? diffs[0];
      if (match) {
        setDiffCache((prev) => ({ ...prev, [filePath]: match }));
      }
    } catch {
      // ignore
    } finally {
      setLoadingFile(null);
    }
  }, [projectPath]);

  const toggleFile = (filePath: string) => {
    if (selectedFile === filePath) {
      setSelectedFile(null);
    } else {
      setSelectedFile(filePath);
      if (!diffCache[filePath]) loadDiff(filePath);
    }
  };

  if (entries.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border bg-muted/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{entries.length} changed file{entries.length !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground ml-1">· live</span>
      </button>

      {expanded && (
        <div className="border-t divide-y divide-border max-h-80 overflow-y-auto">
          {entries.map((entry) => {
            const isOpen = selectedFile === entry.path;
            const diff = diffCache[entry.path];
            const isLoading = loadingFile === entry.path;

            return (
              <div key={entry.path}>
                <button
                  onClick={() => toggleFile(entry.path)}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted/30 transition-colors ${
                    isOpen ? "bg-muted/40" : ""
                  }`}
                >
                  {isOpen
                    ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      entry.type === "New"
                        ? "bg-github-green/20 text-github-green"
                        : "bg-github-orange/20 text-github-orange"
                    }`}
                  >
                    {entry.type === "New" ? "NEW" : "MOD"}
                  </span>
                  <span className="text-xs font-mono truncate flex-1">{entry.path}</span>
                  {diff && (
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                      <Plus className="h-2.5 w-2.5 text-github-green" />{diff.additions}
                      <Minus className="h-2.5 w-2.5 text-github-red" />{diff.deletions}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="border-t bg-background/50">
                    <DiffView diff={diff ?? null} loading={isLoading && !diff} />
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
