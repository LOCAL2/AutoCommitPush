import { useState, useCallback } from "react";
import {
  X, UploadCloud, GitBranch, Globe,
  AlertCircle, Sparkles, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RepoStatus, FileDiff } from "@/types";
import { useSettingsStore } from "@/store/settingsStore";
import { generateCommitMessage, getCommitSuggestions } from "@/lib/commit-message";
import ChangesDiffPanel from "@/components/ChangesDiffPanel";

interface Props {
  projectLabel: string;
  projectPath: string;
  status: RepoStatus;
  onConfirm: (commitMessage: string) => void;
  onCancel: () => void;
}

export default function PushConfirmDialog({
  projectLabel: _projectLabel,
  projectPath,
  status,
  onConfirm,
  onCancel,
}: Props) {
  const { defaultCommitMessage } = useSettingsStore();
  const [diffCache, setDiffCache] = useState<Record<string, FileDiff>>({});

  // Auto-generate on open (no diff yet — refines once diffs load)
  const [commitMsg, setCommitMsg] = useState(() => {
    try { return generateCommitMessage(status); }
    catch { return `${defaultCommitMessage} - ${new Date().toLocaleString()}`; }
  });

  // When diffs finish loading, silently improve the message if user hasn't typed
  const handleDiffCache = useCallback((cache: Record<string, FileDiff>) => {
    setDiffCache(cache);
    setCommitMsg((prev) => {
      // Only auto-update if it still matches the original auto-generated value
      const original = generateCommitMessage(status);
      if (prev === original || prev === generateCommitMessage(status, cache)) {
        return generateCommitMessage(status, cache);
      }
      return prev; // user edited manually — don't overwrite
    });
  }, [status]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = getCommitSuggestions(status, diffCache);

  const branch = status.branch ?? "main";
  const remote = status.remote_url ?? "(no remote)";
  const totalChanges = status.pending_changes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border bg-card shadow-xl animate-fade-in p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-github-green" />
            <h2 className="font-semibold">Confirm Push</h2>
          </div>
          <button onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Branch + Remote */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Branch:</span>
              <span className="font-mono font-medium text-primary">{branch}</span>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground shrink-0">Remote:</span>
              <span className="font-mono text-xs break-all">{remote}</span>
            </div>
          </div>

          {/* No remote warning */}
          {!status.remote_url && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              No remote repository configured. Push will fail.
            </div>
          )}

          {/* Changed files with diff */}
          {totalChanges > 0 && (
            <ChangesDiffPanel
              projectPath={projectPath}
              status={status}
              onDiffCache={handleDiffCache}
            />
          )}

          {totalChanges === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0" />
              No local changes detected. Nothing to commit or push.
            </div>
          )}

          {/* ── Commit Message — hide if no changes ── */}
          {totalChanges > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Commit Message</label>
              <button
                onClick={() => setCommitMsg(generateCommitMessage(status, diffCache))}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Auto-generate
              </button>
            </div>

            <Input
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Describe your changes..."
              className="text-sm font-mono"
            />

            {/* Suggestions dropdown */}
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${showSuggestions ? "rotate-180" : ""}`} />
              Suggestions
            </button>

            {showSuggestions && (
              <div className="rounded-md border divide-y divide-border bg-card animate-fade-in">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setCommitMsg(s); setShowSuggestions(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-muted/50 transition-colors ${
                      s === commitMsg ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => onConfirm(commitMsg.trim() || defaultCommitMessage)}
              disabled={!status.remote_url || !commitMsg.trim() || totalChanges === 0}
              className="flex-1"
            >
              <UploadCloud className="h-4 w-4" />
              Push to {branch}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
