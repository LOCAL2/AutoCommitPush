import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen, Plus, Trash2, Search,
  GitBranch, UploadCloud, AlertCircle, Check, X, RefreshCw,
  Github, Lock, Unlock, Container, CheckCircle2, FileText, TerminalSquare, GitPullRequest, FileCode, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import { useLogStore } from "@/store/logStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToast } from "@/components/ui/toast";
import * as cmd from "@/lib/tauri-commands";
import type { RepoStatus, GitHubRepo } from "@/types";
import { truncatePath, formatDate } from "@/lib/utils";
import CreateRepoDialog from "@/components/CreateRepoDialog";
import DockerPushDialog from "@/components/DockerPushDialog";
import PushConfirmDialog from "@/components/PushConfirmDialog";
import RemoveProjectDialog from "@/components/RemoveProjectDialog";
import ChangesDiffPanel from "@/components/ChangesDiffPanel";
import ReadmeEditor from "@/components/ReadmeEditor";
import FolderPicker from "@/components/FolderPicker";
import TerminalDialog from "@/components/TerminalDialog";
import BranchManagerDialog from "@/components/BranchManagerDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import GitignoreEditor from "@/components/GitignoreEditor";
import { useRepoWatcher } from "@/hooks/useRepoWatcher";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProjectCardState {
  status: RepoStatus | null;
  loading: boolean;
  pushing: boolean;
  pulling: boolean;
  pushProgress: number;
  editingLabel: boolean;
  tempLabel: string;
  showCreateRepo: boolean;
  showDockerPush: boolean;
  showPushConfirm: boolean;
  showPullConfirm: boolean;
  showReadme: boolean;
  showTerminal: boolean;
  showBranch: boolean;
  showGitignore: boolean;
  showMore: boolean;
}

function defaultCardState(): ProjectCardState {
  return {
    status: null, loading: false, pushing: false, pulling: false,
    pushProgress: 0, editingLabel: false, tempLabel: "",
    showCreateRepo: false, showDockerPush: false, showPushConfirm: false,
    showPullConfirm: false, showReadme: false, showTerminal: false,
    showBranch: false, showGitignore: false, showMore: false,
  };
}

type Tab = "local" | "github";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [tab, setTab] = useState<Tab>("local");
  const { user } = useAuthStore();
  const { token } = useAuthStore();
  const [repoCount, setRepoCount] = useState<number | null>(null);

  // Load actual repo count from API (includes private repos)
  useEffect(() => {
    if (!token) return;
    cmd.getUserRepos(token)
      .then((repos) => setRepoCount(repos.length))
      .catch(() => setRepoCount(user?.public_repos ?? null));
  }, [token, user]);

  return (
    <div className="flex flex-col h-full animate-fade-in">      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 pt-5 pb-0 border-b">
        <TabButton active={tab === "local"} onClick={() => setTab("local")}>
          <FolderOpen className="h-4 w-4" /> Local Projects
        </TabButton>
        <TabButton active={tab === "github"} onClick={() => setTab("github")}>
          <Github className="h-4 w-4" />
          My GitHub Repos
          {repoCount !== null && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">
              {repoCount}
            </span>
          )}
        </TabButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "local" ? <LocalTab /> : <GitHubTab />}
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Local Projects Tab ───────────────────────────────────────────────────────
function LocalTab() {
  const { projects, addProject, removeProject, updateProject } = useProjectStore();
  const { token, user } = useAuthStore();
  const { addLog } = useLogStore();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [cardStates, setCardStates] = useState<Record<string, ProjectCardState>>({});
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    id: string;
    label: string;
    remoteUrl: string | null;
  } | null>(null);

  const filtered = projects.filter(
    (p) =>
      p.label.toLowerCase().includes(search.toLowerCase()) ||
      p.path.toLowerCase().includes(search.toLowerCase())
  );

  const setCardState = useCallback((id: string, partial: Partial<ProjectCardState>) => {
    setCardStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? defaultCardState()), ...partial },
    }));
  }, []);

  const loadStatus = useCallback(async (id: string, path: string, silent = false) => {
    if (!silent) setCardState(id, { loading: true });
    try {
      const status = await cmd.getRepoStatus(path);
      setCardState(id, { status, loading: false });
    } catch {
      if (!silent) setCardState(id, { loading: false });
    }
  }, [setCardState]);

  const handleRepoChange = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) loadStatus(projectId, project.path, true);
  }, [projects, loadStatus]);

  useRepoWatcher(projects, handleRepoChange);

  useEffect(() => {
    projects.forEach((p) => {
      if (!cardStates[p.id]) loadStatus(p.id, p.path);
    });
  }, [projects, cardStates, loadStatus]);

  const handleAddProject = async (selectedPath: string) => {
    setShowAddPicker(false);
    const project = addProject(selectedPath);
    await loadStatus(project.id, project.path);
    addLog("info", `Added project: ${project.label}`, project.id, project.label);
    showToast("success", `Added: ${project.label}`);
  };

  const handleRemove = (id: string, label: string) => {
    const cs = cardStates[id];
    setConfirmRemove({ id, label, remoteUrl: cs?.status?.remote_url ?? null });
  };

  const doRemove = async (id: string, label: string, deleteGitHub: boolean) => {
    // Delete GitHub repo first if requested
    if (deleteGitHub && token && user) {
      const cs = cardStates[id];
      const remoteUrl = cs?.status?.remote_url ?? "";
      const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
      if (match) {
        const [, owner, repo] = match;
        await cmd.deleteGithubRepo(token, owner, repo);
        addLog("success", `Deleted GitHub repo: ${owner}/${repo}`, id, label);
      }
    }
    removeProject(id);
    useLogStore.getState().clearProjectLogs(id);
    setConfirmRemove(null);
    showToast("info", deleteGitHub ? `Removed "${label}" and deleted GitHub repo` : `Removed: ${label}`);
  };

  const handleInit = async (id: string, path: string, label: string) => {
    try {
      await cmd.initRepository(path);
      addLog("success", "Initialized git repository", id, label);
      showToast("success", "Repository initialized!");
      await loadStatus(id, path);
    } catch (e) {
      showToast("error", `Init failed: ${e}`);
    }
  };

  // Step 1: show confirm dialog
  const handlePush = (id: string, _path: string, _label: string) => {
    if (!token) { showToast("error", "Not logged in"); return; }
    const cs = cardStates[id];
    if (!cs?.status?.is_git_repo) { showToast("warning", "Not a git repo"); return; }
    const { authorName, authorEmail } = useSettingsStore.getState();
    if (!authorName.trim() || !authorEmail.trim()) {
      showToast("error", "Git Author name and email are required. Please fill them in Settings first.");
      return;
    }
    setCardState(id, { showPushConfirm: true });
  };

  const handlePull = (id: string, _path: string, _label: string) => {
    if (!token) { showToast("error", "Not logged in"); return; }
    const cs = cardStates[id];
    if (!cs?.status?.is_git_repo) { showToast("warning", "Not a git repo"); return; }
    if (!cs?.status?.remote_url) { showToast("warning", "No remote configured"); return; }
    setCardState(id, { showPullConfirm: true });
  };

  const doPull = async (id: string, path: string, label: string) => {
    setCardState(id, { showPullConfirm: false, pulling: true });
    addLog("info", "Pulling from remote...", id, label);
    const branch = cardStates[id]?.status?.branch ?? "main";
    try {
      const result = await cmd.pullFromRemote(path, token!, branch);
      addLog("success", `Pull: ${result}`, id, label);
      showToast("success", result);
      await loadStatus(id, path);
    } catch (e) {
      addLog("error", `Pull failed: ${e}`, id, label);
      showToast("error", `Pull failed: ${e}`);
    } finally {
      setCardState(id, { pulling: false });
    }
  };

  // Step 2: called after user confirms in dialog
  const doPush = async (id: string, path: string, label: string, commitMsg: string) => {
    setCardState(id, { showPushConfirm: false, pushing: true, pushProgress: 10 });
    addLog("info", "Starting push...", id, label);

    const { authorName, authorEmail } = useSettingsStore.getState();
    const branch = cardStates[id]?.status?.branch ?? "main";

    try {
      setCardState(id, { pushProgress: 30 });
      await cmd.stageAllFiles(path);
      setCardState(id, { pushProgress: 50 });
      await cmd.createCommit(path, commitMsg, authorName, authorEmail);
      setCardState(id, { pushProgress: 70 });
      await cmd.pushToRemote(path, token!, branch);
      setCardState(id, { pushProgress: 100 });
      updateProject(id, {
        lastPushedAt: new Date().toISOString(),
        lastPushStatus: "success",
        lastCommitMessage: commitMsg,
      });
      addLog("success", `Push successful → ${branch}`, id, label);
      showToast("success", "Pushed successfully!");
      await loadStatus(id, path);
    } catch (e) {
      updateProject(id, { lastPushStatus: "error" });
      addLog("error", `Push failed: ${e}`, id, label);
      showToast("error", `Push failed: ${e}`);
    } finally {
      setTimeout(() => setCardState(id, { pushing: false, pushProgress: 0 }), 1000);
    }
  };

  return (
    <>
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{projects.length} project(s)</p>
        <Button onClick={() => setShowAddPicker(true)} size="sm">
          <Plus className="h-4 w-4" /> Add Project
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">No local projects yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Project" to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((project) => {
          const cs = cardStates[project.id] ?? defaultCardState();
          const { status } = cs;

          return (
            <Card key={project.id} className="hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {cs.editingLabel ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={cs.tempLabel}
                          onChange={(e) => setCardState(project.id, { tempLabel: e.target.value })}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              useProjectStore.getState().renameProject(project.id, cs.tempLabel);
                              setCardState(project.id, { editingLabel: false });
                            }
                            if (e.key === "Escape") setCardState(project.id, { editingLabel: false });
                          }}
                        />
                        <button onClick={() => {
                          useProjectStore.getState().renameProject(project.id, cs.tempLabel);
                          setCardState(project.id, { editingLabel: false });
                        }}>
                          <Check className="h-4 w-4 text-github-green" />
                        </button>
                        <button onClick={() => setCardState(project.id, { editingLabel: false })}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold truncate">{project.label}</h3>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {truncatePath(project.path)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cs.loading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : status ? (
                      <>
                        {status.is_git_repo
                          ? <Badge variant="success">Git</Badge>
                          : <Badge variant="warning">No Git</Badge>}
                        {status.pending_changes > 0 && (
                          <Badge variant="warning">{status.pending_changes} changes</Badge>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Repo info */}
                {status?.is_git_repo && (
                  <div className="mt-3 space-y-2">
                    {/* Latest commit — git log style */}
                    <div className="flex items-center gap-2 text-xs">
                      <GitBranch className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                        {status.last_commit ? (
                          <>
                            {status.last_commit_hash && (
                              <span className="font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                {status.last_commit_hash}
                              </span>
                            )}
                            <span className="font-mono text-foreground/80 truncate">
                              {status.last_commit}
                            </span>
                            <span className="text-muted-foreground/40 shrink-0">·</span>
                            <span className="font-mono text-muted-foreground/60 shrink-0">{status.branch ?? "main"}</span>
                            {status.last_commit_time && (
                              <>
                                <span className="text-muted-foreground/40 shrink-0">·</span>
                                <span className="text-muted-foreground/60 shrink-0">{status.last_commit_time}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground/50 italic">No commits yet</p>
                        )}
                      </div>
                    </div>

                    {/* Last push — same style, skip if message same as latest commit */}
                    {project.lastPushedAt && project.lastCommitMessage && (
                      <div className="flex items-center gap-2 text-xs">
                        {project.lastPushStatus === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-github-green shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-github-red shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          {/* Only show message if different from latest git commit */}
                          {project.lastCommitMessage !== status?.last_commit && (
                            <p className="text-foreground/80 line-clamp-2 leading-relaxed font-mono">
                              {project.lastCommitMessage}
                            </p>
                          )}
                          <p className="text-muted-foreground/60">
                            <span className={project.lastPushStatus === "success" ? "text-github-green" : "text-github-red"}>
                              {project.lastPushStatus === "success" ? "pushed" : "failed"}
                            </span>
                            <span> · </span>
                            <span>{formatDate(project.lastPushedAt)}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Not git repo */}
                {status && !status.is_git_repo && (
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-md bg-github-orange/10 border border-github-orange/20">
                    <AlertCircle className="h-4 w-4 text-github-orange shrink-0" />
                    <p className="text-xs text-github-orange flex-1">Not a Git repository</p>
                    <Button size="sm" variant="outline" className="h-6 text-xs"
                      onClick={() => handleInit(project.id, project.path, project.label)}>
                      Initialize
                    </Button>
                  </div>
                )}

                {/* Changed files + diff (live) */}
                {status?.is_git_repo && status.pending_changes > 0 && (
                  <ChangesDiffPanel projectPath={project.path} status={status} />
                )}

                {/* No remote */}
                {status?.is_git_repo && !status.remote_url && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-github-blue/10 border border-github-blue/20">
                    <AlertCircle className="h-4 w-4 text-github-blue shrink-0" />
                    <p className="text-xs text-github-blue flex-1">No remote configured</p>
                    <Button size="sm" variant="outline" className="h-6 text-xs"
                      onClick={() => setCardState(project.id, { showCreateRepo: true })}>
                      Create Repo
                    </Button>
                  </div>
                )}

                {/* Push progress */}
                {cs.pushing && cs.pushProgress > 0 && (
                  <div className="mt-3 space-y-1">
                    <Progress value={cs.pushProgress} />
                    <p className="text-xs text-muted-foreground">Pushing... {cs.pushProgress}%</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="success" className="flex-1"
                    loading={cs.pushing}
                    disabled={!status?.is_git_repo || cs.pulling}
                    onClick={() => handlePush(project.id, project.path, project.label)}>
                    <UploadCloud className="h-4 w-4" /> Push
                  </Button>
                  <Button size="sm" variant="outline"
                    title="Manage branches"
                    disabled={!status?.is_git_repo}
                    onClick={() => setCardState(project.id, { showBranch: true })}
                    className="text-muted-foreground hover:text-foreground font-mono text-xs gap-1">
                    <GitBranch className="h-4 w-4" />
                    {status?.branch ?? "main"}
                  </Button>
                  <Button size="sm" variant="outline"
                    title="Pull from remote"
                    loading={cs.pulling}
                    disabled={!status?.is_git_repo || !status?.remote_url || cs.pushing}
                    onClick={() => handlePull(project.id, project.path, project.label)}
                    className="text-github-blue hover:text-github-blue border-github-blue/30 hover:border-github-blue">
                    <GitPullRequest className="h-4 w-4" />
                  </Button>

                  {/* ── More dropdown ── */}
                  <div className="relative">
                    <Button size="sm" variant="outline"
                      title="More actions"
                      onClick={() => setCardState(project.id, { showMore: !cs.showMore })}
                      className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {cs.showMore && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setCardState(project.id, { showMore: false })}
                        />
                        <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-md border bg-popover shadow-md py-1 animate-fade-in">
                          <button
                            onClick={() => { setCardState(project.id, { showMore: false, showReadme: true }); }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors text-foreground">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Edit README.md
                          </button>
                          <button
                            onClick={() => { setCardState(project.id, { showMore: false, showGitignore: true }); }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors text-foreground">
                            <FileCode className="h-3.5 w-3.5 text-muted-foreground" /> Edit .gitignore
                          </button>
                          <button
                            onClick={() => { setCardState(project.id, { showMore: false, showTerminal: true }); }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors text-foreground">
                            <TerminalSquare className="h-3.5 w-3.5 text-muted-foreground" /> Open Terminal
                          </button>
                          <button
                            onClick={() => { setCardState(project.id, { showMore: false }); cmd.openInExplorer(project.path); }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors text-foreground">
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Open in Explorer
                          </button>
                          <div className="border-t my-1" />
                          <button
                            onClick={() => { setCardState(project.id, { showMore: false, showDockerPush: true }); }}
                            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors text-blue-400">
                            <Container className="h-3.5 w-3.5" /> Push to Docker Hub
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <Button size="sm" variant="outline" onClick={() => loadStatus(project.id, project.path)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
                    onClick={() => handleRemove(project.id, project.label)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>

              {cs.showPushConfirm && cs.status && (
                <PushConfirmDialog
                  projectLabel={project.label}
                  projectPath={project.path}
                  status={cs.status}
                  onConfirm={(msg) => doPush(project.id, project.path, project.label, msg)}
                  onCancel={() => setCardState(project.id, { showPushConfirm: false })}
                />
              )}

              {cs.showCreateRepo && (
                <CreateRepoDialog
                  projectLabel={project.label}
                  projectPath={project.path}
                  projectId={project.id}
                  onClose={() => setCardState(project.id, { showCreateRepo: false })}
                  onSuccess={async () => {
                    setCardState(project.id, { showCreateRepo: false });
                    await loadStatus(project.id, project.path);
                  }}
                />
              )}

              {cs.showDockerPush && (
                <DockerPushDialog
                  projectLabel={project.label}
                  projectPath={project.path}
                  projectId={project.id}
                  onClose={() => setCardState(project.id, { showDockerPush: false })}
                />
              )}

              {cs.showReadme && (
                <ReadmeEditor
                  projectPath={project.path}
                  projectLabel={project.label}
                  onClose={() => setCardState(project.id, { showReadme: false })}
                />
              )}

              {cs.showGitignore && (
                <GitignoreEditor
                  projectLabel={project.label}
                  projectPath={project.path}
                  onClose={() => setCardState(project.id, { showGitignore: false })}
                />
              )}

              {cs.showTerminal && (
                <TerminalDialog
                  projectLabel={project.label}
                  projectPath={project.path}
                  onClose={() => setCardState(project.id, { showTerminal: false })}
                />
              )}

              {cs.showBranch && cs.status && (
                <BranchManagerDialog
                  projectLabel={project.label}
                  projectPath={project.path}
                  currentBranch={cs.status.branch ?? "main"}
                  onBranchSwitch={() => loadStatus(project.id, project.path)}
                  onClose={() => setCardState(project.id, { showBranch: false })}
                />
              )}

              {cs.showPullConfirm && (
                <ConfirmDialog
                  title="Pull from Remote"
                  message={`Pull latest changes from remote into "${project.label}" (${cs.status?.branch ?? "main"})?`}
                  confirmLabel="Pull"
                  onConfirm={() => doPull(project.id, project.path, project.label)}
                  onCancel={() => setCardState(project.id, { showPullConfirm: false })}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>

    {/* ── Confirm Remove Dialog ── */}
    {confirmRemove && (
      <RemoveProjectDialog
        projectLabel={confirmRemove.label}
        remoteUrl={confirmRemove.remoteUrl}
        githubOwner={user?.login ?? null}
        onConfirm={(deleteGitHub) => doRemove(confirmRemove.id, confirmRemove.label, deleteGitHub)}
        onCancel={() => setConfirmRemove(null)}
      />
    )}

    {/* ── Add Project Folder Picker ── */}
    {showAddPicker && (
      <FolderPicker
        title="Select Project Folder"
        confirmLabel="Add Project"
        onSelect={handleAddProject}
        onCancel={() => setShowAddPicker(false)}
      />
    )}
  </>
  );
}

// ─── GitHub Repos Tab ─────────────────────────────────────────────────────────
type SortKey = "updated" | "name" | "stars";



function GitHubTab() {
  const { token, user } = useAuthStore();
  const { addProject } = useProjectStore();
  const { showToast } = useToast();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [sort, setSort] = useState<SortKey>("updated");
  void setSort;
  const [cloning, setCloning] = useState<string | null>(null);
  const [cloneTarget, setCloneTarget] = useState<{ repo: GitHubRepo } | null>(null);
  // Cache: full_name → { sha, message, author, date } | null
  const [commitCache, setCommitCache] = useState<Record<string, { sha: string; message: string; author: string; date: string } | null>>({});

  const loadRepos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await cmd.getUserRepos(token);
      setRepos(data);
      // Lazy-load commits for all repos in background (batched)
      setCommitCache({});
      for (const repo of data) {
        cmd.getLatestCommit(token, repo.full_name)
          .then((c) => setCommitCache((prev) => ({ ...prev, [repo.full_name]: c ?? null })))
          .catch(() => {});
      }
    } catch (e) {
      showToast("error", `Failed to load repos: ${e}`);
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => { loadRepos(); }, [loadRepos]);

  const filtered = repos
    .filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "public" && !r.private) ||
        (filter === "private" && r.private);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0; // GitHub API already returns by updated
    });

  const handleClone = (repo: GitHubRepo) => {
    if (!token) return;
    setCloneTarget({ repo });
  };

  const doClone = async (repo: GitHubRepo, dir: string) => {
    setCloneTarget(null);
    const targetPath = `${dir}\\${repo.name}`;
    setCloning(repo.full_name);
    try {
      await cmd.cloneRepository(repo.clone_url, targetPath, token!);
      addProject(targetPath, repo.name);
      showToast("success", `Cloned ${repo.name} successfully!`);
    } catch (e) {
      showToast("error", `Clone failed: ${e}`);
    } finally {
      setCloning(null);
    }
  };

  const openOnGitHub = (url: string) => {
    import("@tauri-apps/api/core").then(({ invoke }) =>
      invoke("plugin:shell|open", { path: url }).catch(() => window.open(url, "_blank"))
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {user?.login}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadRepos} loading={loading}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "public", "private"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!loading && repos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Github className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">No repositories found</p>
        </div>
      )}

      {/* Repo list */}
      {!loading && (
        <div className="space-y-2">
          {filtered.map((repo) => (
            <Card key={repo.full_name} className="hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name + visibility */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openOnGitHub(repo.html_url)}
                        className="font-semibold text-primary hover:underline text-sm truncate"
                      >
                        {repo.name}
                      </button>
                      <Badge variant={repo.private ? "secondary" : "outline"} className="text-[10px]">
                        {repo.private
                          ? <><Lock className="h-2.5 w-2.5 mr-1" />Private</>
                          : <><Unlock className="h-2.5 w-2.5 mr-1" />Public</>}
                      </Badge>
                    </div>

                    {/* Description */}
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {repo.description}
                      </p>
                    )}

                    {/* Latest commit */}
                    {commitCache[repo.full_name] ? (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <GitBranch className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                          {commitCache[repo.full_name]!.sha}
                        </span>
                        <span className="text-[11px] text-muted-foreground/80 truncate font-mono flex-1 min-w-0">
                          {commitCache[repo.full_name]!.message}
                        </span>
                      </div>
                    ) : commitCache[repo.full_name] === null ? null : (
                      <p className="text-[11px] text-muted-foreground/40 mt-1 font-mono">loading commit...</p>
                    )}

                    {/* Clone URL */}
                    <p className="text-[11px] font-mono text-muted-foreground/40 mt-0.5 truncate">
                      {repo.clone_url}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openOnGitHub(repo.html_url)}
                      className="h-7 text-xs gap-1"
                    >
                      <Github className="h-3.5 w-3.5" /> Open
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      loading={cloning === repo.full_name}
                      onClick={() => handleClone(repo)}
                      className="h-7 text-xs gap-1"
                    >
                      <FolderOpen className="h-3.5 w-3.5" /> Clone
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && !loading && repos.length > 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No repositories match your search
            </div>
          )}
        </div>
      )}

      {/* Custom folder picker for clone */}
      {cloneTarget && (
        <FolderPicker
          title={`Clone "${cloneTarget.repo.name}" to...`}
          confirmLabel="Clone here"
          onSelect={(dir) => doClone(cloneTarget.repo, dir)}
          onCancel={() => setCloneTarget(null)}
        />
      )}
    </div>
  );
}
