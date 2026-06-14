import { useState, useEffect, useRef } from "react";
import { X, GitBranch, Check, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as cmd from "@/lib/tauri-commands";

interface Props {
  projectLabel: string;
  projectPath: string;
  currentBranch: string;
  onBranchSwitch: (branch: string) => void;
  onClose: () => void;
}

export default function BranchManagerDialog({
  projectLabel: _projectLabel,
  projectPath,
  currentBranch,
  onBranchSwitch,
  onClose,
}: Props) {
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [switchingBranch, setSwitchingBranch] = useState<string | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null);
  const [renamingBranch, setRenamingBranch] = useState<string | null>(null); // branch being renamed
  const [renameValue, setRenameValue] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const newBranchRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const loadBranches = () => {
    setLoadingBranches(true);
    cmd
      .getBranches(projectPath)
      .then((list) => setBranches(list))
      .catch((e) => setError(String(e)))
      .finally(() => setLoadingBranches(false));
  };

  useEffect(() => {
    loadBranches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath]);

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingBranch) {
      setTimeout(() => renameInputRef.current?.select(), 0);
    }
  }, [renamingBranch]);

  const busy = switchingBranch !== null || creating || deletingBranch !== null;

  const handleSwitch = async (branch: string) => {
    if (branch === currentBranch || busy || renamingBranch) return;
    setError(null);
    setSwitchingBranch(branch);
    try {
      await cmd.switchBranch(projectPath, branch);
      onBranchSwitch(branch);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSwitchingBranch(null);
    }
  };

  const handleDelete = async (branch: string) => {
    if (busy || renamingBranch) return;
    setError(null);
    setDeletingBranch(branch);
    try {
      await cmd.deleteBranch(projectPath, branch);
      loadBranches();
    } catch (e) {
      setError(String(e));
    } finally {
      setDeletingBranch(null);
    }
  };

  const startRename = (branch: string) => {
    if (busy) return;
    setRenamingBranch(branch);
    setRenameValue(branch);
    setError(null);
  };

  const cancelRename = () => {
    setRenamingBranch(null);
    setRenameValue("");
  };

  const confirmRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || !renamingBranch || trimmed === renamingBranch) {
      cancelRename();
      return;
    }
    setError(null);
    const oldName = renamingBranch;
    setRenamingBranch(null);
    try {
      await cmd.renameBranch(projectPath, oldName, trimmed);
      // If renamed the current branch, notify parent to refresh
      if (oldName === currentBranch) onBranchSwitch(trimmed);
      loadBranches();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleCreate = async () => {
    const trimmed = newBranchName.trim();
    if (!trimmed || busy || renamingBranch) return;
    setError(null);
    setCreating(true);
    try {
      await cmd.createBranch(projectPath, trimmed);
      await cmd.switchBranch(projectPath, trimmed);
      onBranchSwitch(trimmed);
      onClose();
    } catch (e) {
      setError(String(e));
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border bg-card shadow-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Branches</h2>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Branch list */}
        <div className="max-h-64 overflow-y-auto py-1">
          {loadingBranches ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : branches.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No branches found</p>
          ) : (
            branches.map((branch) => {
              const isCurrent = branch === currentBranch;
              const isSwitching = switchingBranch === branch;
              const isDeleting = deletingBranch === branch;
              const isRenaming = renamingBranch === branch;

              return (
                <div
                  key={branch}
                  className={`group flex items-center gap-1 px-3 py-1.5 transition-colors ${
                    isCurrent ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  {isRenaming ? (
                    /* ── Inline rename input ── */
                    <div className="flex-1 flex items-center gap-1.5">
                      <Input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename();
                          if (e.key === "Escape") cancelRename();
                        }}
                        className="h-7 text-xs font-mono py-0"
                        autoFocus
                      />
                      <button
                        onClick={confirmRename}
                        className="p-1 rounded hover:bg-primary/10 text-primary transition-colors shrink-0"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Branch name — click to switch */}
                      <button
                        onClick={() => handleSwitch(branch)}
                        disabled={busy || isCurrent || !!renamingBranch}
                        className={`flex-1 flex items-center gap-2 text-sm text-left disabled:cursor-default font-mono truncate min-w-0 ${
                          isCurrent ? "text-primary" : "text-foreground"
                        }`}
                      >
                        <span className="truncate">{branch}</span>
                        {isSwitching && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                        {isCurrent && !isSwitching && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>

                      {/* Action buttons — appear on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Rename */}
                        <button
                          onClick={() => startRename(branch)}
                          disabled={busy || !!renamingBranch}
                          title="Rename branch"
                          className="p-1 rounded hover:bg-muted hover:text-foreground text-muted-foreground transition-colors disabled:pointer-events-none"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete — not on current branch */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(branch)}
                            disabled={busy || !!renamingBranch}
                            title="Delete branch"
                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors disabled:pointer-events-none"
                          >
                            {isDeleting
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* New branch */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">New Branch</p>
          <div className="flex gap-2">
            <Input
              ref={newBranchRef}
              value={newBranchName}
              onChange={(e) => { setNewBranchName(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="branch-name"
              className="h-8 text-sm font-mono"
              disabled={busy || !!renamingBranch}
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newBranchName.trim() || busy || !!renamingBranch}
              loading={creating}
              className="h-8 shrink-0"
            >
              {!creating && <Plus className="h-3.5 w-3.5" />}
              Create
            </Button>
          </div>

          {error && (
            <p className="text-xs text-destructive leading-snug">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
