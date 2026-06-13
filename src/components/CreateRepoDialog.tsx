import { useState, useEffect } from "react";
import {
  X, Github, Lock, Unlock, BookOpen,
  AlertCircle, CheckCircle2, Loader2, Link, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useLogStore } from "@/store/logStore";
import { useToast } from "@/components/ui/toast";
import * as cmd from "@/lib/tauri-commands";
import { sanitizeRepoName, validateRepoName } from "@/lib/utils";

interface Props {
  projectLabel: string;
  projectPath: string;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type NameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function CreateRepoDialog({
  projectLabel, projectPath, projectId, onClose, onSuccess,
}: Props) {
  const { token, user } = useAuthStore();
  const { updateProject } = useProjectStore();
  const { addLog } = useLogStore();
  const { showToast } = useToast();

  const [name, setName] = useState(sanitizeRepoName(projectLabel));
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<NameStatus>("idle");

  // ── Debounced availability check ──────────────────────────────────────────
  useEffect(() => {
    if (!name || !token || !user) { setNameStatus("idle"); return; }
    const err = validateRepoName(name);
    if (err) { setNameStatus("invalid"); return; }

    setNameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const exists = await cmd.checkRepoExists(token, user.login, name);
        setNameStatus(exists ? "taken" : "available");
      } catch {
        setNameStatus("idle");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [name, token, user]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setRemoteAndFinish = async (cloneUrl: string, logMsg: string, toastMsg: string) => {
    await cmd.setRemote(projectPath, cloneUrl);
    updateProject(projectId, { remoteUrl: cloneUrl });
    addLog("success", logMsg, projectId, projectLabel);
    showToast("success", toastMsg);
    onSuccess();
  };

  // ── Action: Create new ────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!token || !user || nameStatus !== "available") return;
    setLoading(true); setError(null);
    try {
      const repo = await cmd.createGithubRepo(token, {
        name, description: description || undefined, private: isPrivate, auto_init: autoInit,
      });
      await setRemoteAndFinish(repo.clone_url, `Created: ${repo.full_name}`, `Repository "${name}" created!`);
    } catch (e) {
      setError(String(e));
      addLog("error", `Create failed: ${e}`, projectId, projectLabel);
    } finally { setLoading(false); }
  };

  // ── Action: Use existing repo (just link remote) ──────────────────────────
  const handleUseExisting = async () => {
    if (!token || !user) return;
    setLoading(true); setError(null);
    try {
      const cloneUrl = `https://github.com/${user.login}/${name}.git`;
      await setRemoteAndFinish(cloneUrl, `Linked: ${user.login}/${name}`, `Linked to existing repo "${name}"!`);
    } catch (e) {
      setError(String(e));
    } finally { setLoading(false); }
  };

  // ── Action: Delete existing then recreate ─────────────────────────────────
  const handleDeleteAndRecreate = async () => {
    if (!token || !user) return;
    setLoading(true); setError(null);
    try {
      await cmd.deleteGithubRepo(token, user.login, name);
      addLog("info", `Deleted: ${user.login}/${name}`, projectId, projectLabel);
      await new Promise((r) => setTimeout(r, 1500));
      const repo = await cmd.createGithubRepo(token, {
        name, description: description || undefined, private: isPrivate, auto_init: autoInit,
      });
      await setRemoteAndFinish(repo.clone_url, `Recreated: ${repo.full_name}`, `Repository "${name}" recreated!`);
    } catch (e) {
      setError(String(e));
      addLog("error", `Delete & recreate failed: ${e}`, projectId, projectLabel);
    } finally { setLoading(false); }
  };

  // ── Name status indicator ─────────────────────────────────────────────────
  const nameHint = () => {
    switch (nameStatus) {
      case "checking":
        return <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Checking...</span>;
      case "available":
        return <span className="flex items-center gap-1 text-github-green"><CheckCircle2 className="h-3 w-3" /> Available</span>;
      case "taken":
        return <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> Already exists on your account</span>;
      case "invalid":
        return <span className="flex items-center gap-1 text-github-orange"><AlertCircle className="h-3 w-3" /> {validateRepoName(name)}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border bg-card shadow-xl animate-fade-in p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <h2 className="font-semibold">Create GitHub Repository</h2>
          </div>
          <button onClick={onClose} disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Repository Name *</label>
            <Input
              value={name}
              onChange={(e) => { setName(sanitizeRepoName(e.target.value)); setError(null); }}
              placeholder="my-awesome-project"
              className={`font-mono ${
                nameStatus === "taken" || nameStatus === "invalid"
                  ? "border-destructive focus-visible:ring-destructive"
                  : nameStatus === "available"
                  ? "border-github-green focus-visible:ring-github-green"
                  : ""
              }`}
            />
            <div className="text-xs space-y-0.5">
              {user && (
                <p className="text-muted-foreground">
                  github.com/{user.login}/<span className="text-foreground font-mono">{name || "..."}</span>
                </p>
              )}
              {nameHint()}
            </div>
          </div>

          {/* "Already exists" action panel */}
          {nameStatus === "taken" && (
            <div className="rounded-lg border border-github-orange/30 bg-github-orange/5 p-3 space-y-3">
              <p className="text-xs font-medium text-github-orange flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Repository already exists. What would you like to do?
              </p>
              <div className="flex flex-col gap-2">
                {/* Option 1: use existing */}
                <button
                  onClick={handleUseExisting}
                  disabled={loading}
                  className="flex items-start gap-3 p-2.5 rounded-md border border-border bg-card hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  <Link className="h-4 w-4 text-github-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Use existing repo</p>
                    <p className="text-xs text-muted-foreground">
                      Link this local project to the existing GitHub repo. No data is deleted.
                    </p>
                  </div>
                </button>

                {/* Option 2: delete & recreate */}
                <button
                  onClick={handleDeleteAndRecreate}
                  disabled={loading}
                  className="flex items-start gap-3 p-2.5 rounded-md border border-destructive/30 bg-card hover:bg-destructive/5 transition-colors text-left disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Delete &amp; recreate</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete the existing GitHub repo and create a fresh one.
                      <span className="text-destructive"> This cannot be undone.</span>
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (optional)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..." />
          </div>

          {/* Visibility */}
          <div className="flex gap-2">
            <button onClick={() => setIsPrivate(false)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md border p-3 text-sm transition-colors ${
                !isPrivate ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
              }`}>
              <Unlock className="h-4 w-4" /> Public
            </button>
            <button onClick={() => setIsPrivate(true)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md border p-3 text-sm transition-colors ${
                isPrivate ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
              }`}>
              <Lock className="h-4 w-4" /> Private
            </button>
          </div>

          {/* Auto init */}
          <div className="flex items-center justify-between p-3 rounded-md bg-secondary">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Initialize with README
            </div>
            <button onClick={() => setAutoInit(!autoInit)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoInit ? "bg-primary" : "bg-muted-foreground/30"
              }`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                autoInit ? "translate-x-4" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive break-all">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          )}

          {/* Main actions — only shown when name is available */}
          {nameStatus !== "taken" && (
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                loading={loading}
                disabled={nameStatus !== "available"}
                className="flex-1"
              >
                <Github className="h-4 w-4" /> Create Repository
              </Button>
            </div>
          )}

          {/* Cancel when "taken" panel is shown */}
          {nameStatus === "taken" && (
            <Button variant="outline" onClick={onClose} disabled={loading} className="w-full">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
