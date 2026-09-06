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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Github className="h-4.5 w-4.5" />
            </div>
            <h2 className="font-semibold text-base text-foreground">Create GitHub Repository</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50 disabled:opacity-40"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Repository Name <span className="text-destructive">*</span></label>
            <Input
              value={name}
              onChange={(e) => { setName(sanitizeRepoName(e.target.value)); setError(null); }}
              placeholder="my-awesome-project"
              className={`font-mono text-sm ${
                nameStatus === "taken" || nameStatus === "invalid"
                  ? "border-destructive focus-visible:ring-destructive"
                  : nameStatus === "available"
                  ? "border-github-green focus-visible:ring-github-green"
                  : ""
              }`}
            />
            <div className="text-xs space-y-1 pt-1">
              {user && (
                <p className="text-muted-foreground">
                  github.com/{user.login}/<span className="text-foreground font-mono font-medium">{name || "..."}</span>
                </p>
              )}
              {nameHint()}
            </div>
          </div>

          {/* "Already exists" action panel */}
          {nameStatus === "taken" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 my-2">
              <p className="text-sm font-medium text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Repository already exists on your account
              </p>
              <div className="flex flex-col gap-2.5">
                {/* Option 1: use existing */}
                <button
                  onClick={handleUseExisting}
                  disabled={loading}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors text-left disabled:opacity-50"
                >
                  <Link className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Link Existing Repository</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Connect this local folder to the existing GitHub repo without deleting data.
                    </p>
                  </div>
                </button>

                {/* Option 2: delete & recreate */}
                <button
                  onClick={handleDeleteAndRecreate}
                  disabled={loading}
                  className="flex items-start gap-3 p-3 rounded-xl border border-destructive/30 bg-card hover:bg-destructive/10 transition-colors text-left disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Recreate Repository</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently delete the existing remote GitHub repo and create a fresh one.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Description <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short project description..."
              className="text-sm"
            />
          </div>

          {/* Visibility Selector Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Repository Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  !isPrivate
                    ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                    : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Unlock className="h-4 w-4" /> Public
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  isPrivate
                    ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                    : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Lock className="h-4 w-4" /> Private
              </button>
            </div>
          </div>

          {/* Auto Init Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
            <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <BookOpen className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
              Initialize with README
            </div>
            <button
              type="button"
              onClick={() => setAutoInit(!autoInit)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoInit ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  autoInit ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="break-all">{error}</p>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Processing repository creation...
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="flex gap-2.5 px-5 py-3.5 border-t bg-muted/20">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="flex-1 rounded-xl">
            Cancel
          </Button>

          {nameStatus !== "taken" && (
            <Button
              size="sm"
              onClick={handleCreate}
              loading={loading}
              disabled={nameStatus !== "available"}
              className="flex-1 rounded-xl text-white font-semibold shadow-sm"
            >
              <Github className="h-4 w-4" /> Create Repository
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
