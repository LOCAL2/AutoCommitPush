import { useState } from "react";
import { AlertTriangle, X, Trash2, Github, AlertCircle, ShieldAlert, FolderMinus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  projectLabel: string;
  remoteUrl: string | null;        // null = no GitHub repo linked
  githubOwner: string | null;      // logged-in username
  onConfirm: (deleteGitHub: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function RemoveProjectDialog({
  projectLabel, remoteUrl, onConfirm, onCancel,
}: Props) {
  const [deleteGitHub, setDeleteGitHub] = useState(false);
  const [step, setStep] = useState<"confirm" | "confirm-github">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract "owner/repo" from remote URL
  const repoFullName = (() => {
    if (!remoteUrl) return null;
    const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
    return match?.[1] ?? null;
  })();

  const hasGitHubRepo = !!repoFullName;

  const handleConfirm = async () => {
    if (deleteGitHub && step === "confirm") {
      setStep("confirm-github");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(deleteGitHub);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs animate-dialog-overlay p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card shadow-2xl animate-dialog-content overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-destructive/15 text-destructive border border-destructive/20 shrink-0">
              {step === "confirm-github" ? <ShieldAlert className="h-5 w-5" /> : <FolderMinus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-tight text-foreground">
                {step === "confirm-github" ? "Delete GitHub Repository" : "Remove Project"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {step === "confirm-github" ? "Permanent cloud action" : "Unlink project from AutoCommitPush"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1 — Main Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                <p className="text-xs text-muted-foreground">Target Project</p>
                <p className="text-sm font-semibold text-foreground truncate">{projectLabel}</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Removing this project clears all local tracking history and app preferences.{" "}
                <span className="text-foreground font-medium">Your source files on disk will not be touched or deleted.</span>
              </p>

              {/* GitHub delete option */}
              {hasGitHubRepo && (
                <div
                  onClick={() => !loading && setDeleteGitHub(!deleteGitHub)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none group",
                    deleteGitHub
                      ? "border-destructive/60 bg-destructive/10 ring-1 ring-destructive/40 shadow-xs"
                      : "border-border/80 bg-background hover:bg-muted/40 hover:border-border"
                  )}
                >
                  {/* Custom Theme-Adaptive Checkbox */}
                  <div
                    className={cn(
                      "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200",
                      deleteGitHub
                        ? "bg-destructive border-destructive text-destructive-foreground shadow-xs scale-105"
                        : "border-muted-foreground/40 bg-muted/20 group-hover:border-muted-foreground/80"
                    )}
                  >
                    {deleteGitHub && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Github className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Also delete remote GitHub repository</span>
                    </div>
                    <p className="text-[11px] text-destructive font-mono truncate font-medium">
                      {repoFullName}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Permanently destroys remote code and branches on GitHub.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading} className="text-xs h-8">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleConfirm}
                  loading={loading}
                  className="text-xs h-8 px-4 font-medium shadow-sm"
                >
                  {deleteGitHub ? "Next: Confirm GitHub Delete →" : "Remove Project"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Final GitHub delete confirmation */}
          {step === "confirm-github" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider">Warning: Destruction Danger</p>
                  <p className="text-xs leading-relaxed text-destructive/90">
                    Deleting <span className="font-mono font-bold text-destructive underline">{repoFullName}</span> will permanently erase all remote code, commit history, pull requests, and releases on GitHub.
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Are you 100% sure you want to proceed with permanent deletion?
              </p>

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setStep("confirm")} disabled={loading} className="text-xs h-8">
                  ← Back
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleConfirm}
                  loading={loading}
                  className="text-xs h-8 px-4 font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Permanently Delete Repository
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
