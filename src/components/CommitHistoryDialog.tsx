import { useState, useEffect } from "react";
import { X, RefreshCw, GitCommit, FileText, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as cmd from "@/lib/tauri-commands";
import type { CommitInfo, FileDiff } from "@/types";
import { truncatePath, formatDate } from "@/lib/utils";

interface CommitHistoryDialogProps {
  projectPath: string;
  projectLabel: string;
  onClose: () => void;
}

export default function CommitHistoryDialog({
  projectPath,
  projectLabel,
  onClose,
}: CommitHistoryDialogProps) {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  
  const [diffs, setDiffs] = useState<FileDiff[]>([]);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cmd.getCommitHistory(projectPath, 50);
      setCommits(data);
      if (data.length > 0 && !selectedHash) {
        selectCommit(data[0].hash);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const selectCommit = async (hash: string) => {
    setSelectedHash(hash);
    setLoadingDiff(true);
    try {
      const diffData = await cmd.getCommitDiff(projectPath, hash);
      setDiffs(diffData);
    } catch (e) {
      console.error("Failed to get commit diff", e);
      setDiffs([]);
    } finally {
      setLoadingDiff(false);
    }
  };

  const selectedCommit = commits.find((c) => c.hash === selectedHash);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      {/* Dialog */}
      <div className="fixed inset-4 md:inset-10 z-50 bg-card border shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <GitCommit className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Commit History</h2>
              <p className="text-xs text-muted-foreground">{projectLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={loadHistory} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex min-h-0">
          
          {/* Left: Commit List */}
          <div className="w-1/3 border-r flex flex-col bg-muted/10">
            <div className="flex-1 overflow-y-auto">
              {loading && commits.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading history...</div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-destructive">{error}</div>
              ) : commits.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No commits found.</div>
              ) : (
                <div className="divide-y">
                  {commits.map((commit) => {
                    const isSelected = commit.hash === selectedHash;
                    return (
                      <button
                        key={commit.hash}
                        onClick={() => selectCommit(commit.hash)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex flex-col gap-1.5 ${
                          isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-sm font-medium line-clamp-2 leading-snug ${isSelected ? 'text-primary' : ''}`}>
                            {commit.message || "(No message)"}
                          </span>
                          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                            {commit.hash.substring(0, 7)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{commit.author_name}</span>
                          </div>
                          <span className="shrink-0">{formatDate(commit.date)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Commit Details & Diff */}
          <div className="w-2/3 flex flex-col bg-background min-w-0">
            {selectedCommit ? (
              <>
                {/* Detail Header */}
                <div className="p-4 border-b bg-muted/10 shrink-0 space-y-3">
                  <h3 className="text-lg font-semibold leading-snug whitespace-pre-wrap">
                    {selectedCommit.message}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>{selectedCommit.author_name} &lt;{selectedCommit.author_email}&gt;</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{selectedCommit.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {selectedCommit.hash}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Diff Area */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingDiff ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading diff...
                    </div>
                  ) : diffs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-2">
                      <FileText className="w-8 h-8 opacity-20" />
                      <p>No file changes in this commit (or binary files).</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-8">
                      {diffs.map((diff, idx) => (
                        <div key={idx} className="border rounded-md overflow-hidden bg-card text-card-foreground">
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
                            <span className="text-sm font-mono font-medium truncate flex items-center gap-2">
                              {truncatePath(diff.path)}
                            </span>
                            <div className="flex gap-2 text-xs font-mono">
                              {diff.additions > 0 && <span className="text-github-green">+{diff.additions}</span>}
                              {diff.deletions > 0 && <span className="text-github-red">-{diff.deletions}</span>}
                            </div>
                          </div>
                          <div className="overflow-x-auto text-[13px] font-mono">
                            <table className="w-full border-collapse">
                              <tbody>
                                {diff.lines.map((l, i) => {
                                  const isAdd = l.origin === "+";
                                  const isDel = l.origin === "-";
                                  const isContext = l.origin === " ";
                                  if (!isAdd && !isDel && !isContext) return null;
                                  
                                  const bgClass = isAdd
                                    ? "bg-github-green/10"
                                    : isDel
                                    ? "bg-github-red/10"
                                    : "";
                                  const textClass = isAdd
                                    ? "text-github-green"
                                    : isDel
                                    ? "text-github-red"
                                    : "text-muted-foreground";

                                  return (
                                    <tr key={i} className={`${bgClass} group hover:bg-muted/50 transition-colors`}>
                                      <td className="w-10 px-2 py-0.5 text-right text-muted-foreground/50 select-none border-r border-border/50 bg-muted/10">
                                        {l.old_lineno || ""}
                                      </td>
                                      <td className="w-10 px-2 py-0.5 text-right text-muted-foreground/50 select-none border-r border-border/50 bg-muted/10">
                                        {l.new_lineno || ""}
                                      </td>
                                      <td className={`px-2 py-0.5 select-none w-6 text-center ${textClass}`}>
                                        {l.origin}
                                      </td>
                                      <td className="px-2 py-0.5 whitespace-pre">
                                        <span className={isContext ? "text-foreground/80" : textClass}>
                                          {l.content}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select a commit to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
