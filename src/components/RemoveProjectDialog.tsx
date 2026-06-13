import { useState } from "react";
import { AlertTriangle, X, Trash2, Github, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    // If user wants to delete GitHub repo → show second confirmation
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border bg-card shadow-xl animate-fade-in p-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/15 shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="font-semibold">
              {step === "confirm-github" ? "Delete GitHub Repository?" : "Remove Project"}
            </h2>
          </div>
          <button onClick={onCancel} disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1 — main confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground pl-12 leading-relaxed">
              Remove <span className="font-medium text-foreground">"{projectLabel}"</span> from AutoCommitPush?
              This clears all saved settings and history.{" "}
              <span className="text-muted-foreground/70">Files on disk are not affected.</span>
            </p>

            {/* GitHub delete option */}
            {hasGitHubRepo && (
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={deleteGitHub}
                  onChange={(e) => setDeleteGitHub(e.target.checked)}
                  className="mt-0.5 accent-destructive h-4 w-4 shrink-0"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Github className="h-3.5 w-3.5 text-muted-foreground" />
                    Also delete GitHub repository
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {repoFullName}
                  </p>
                </div>
              </label>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleConfirm}
                loading={loading}
              >
                {deleteGitHub ? "Next →" : "Remove"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — final GitHub delete confirmation */}
        {step === "confirm-github" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">This cannot be undone</p>
                <p className="text-xs text-muted-foreground">
                  Deleting <span className="font-mono font-medium">{repoFullName}</span> will permanently
                  remove all code, commits, issues, pull requests, and settings from GitHub.
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you absolutely sure you want to delete this repository?
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setStep("confirm")} disabled={loading}>
                Back
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleConfirm}
                loading={loading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Repository
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
