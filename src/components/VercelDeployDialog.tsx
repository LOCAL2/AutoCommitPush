import { useState, useEffect, useCallback } from "react";
import {
  X, Triangle, AlertCircle, CheckCircle2, Loader2, ExternalLink,
  RefreshCw, Plus, ChevronDown, Globe, GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVercelStore } from "@/store/vercelStore";
import { useLogStore } from "@/store/logStore";
import { useToast } from "@/components/ui/toast";
import {
  getVercelUser, getVercelTeams, listVercelProjects, createVercelProject,
  triggerDeployment, listDeployments, pollDeployment,
  type VercelProject, type VercelDeployment, type VercelTeam,
} from "@/lib/vercel";
import { sanitizeRepoName } from "@/lib/utils";

interface Props {
  projectLabel: string;
  projectPath: string;
  projectId: string;
  /** GitHub remote URL of this project, e.g. https://github.com/owner/repo.git */
  remoteUrl: string | null;
  /** Current git branch */
  branch?: string;
  onClose: () => void;
}

// Extract "owner/repo" from a GitHub remote URL
function parseGitHubRepo(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
  return m ? m[1] : null;
}

type Step = "token" | "connect" | "project" | "deploy" | "done";

export default function VercelDeployDialog({
  projectLabel, projectPath: _projectPath, projectId, remoteUrl, branch = "main", onClose,
}: Props) {
  const vercel = useVercelStore();
  const { addLog } = useLogStore();
  const { showToast } = useToast();

  const gitRepo = parseGitHubRepo(remoteUrl);
  const binding = vercel.bindings[projectId] ?? null;

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(() => {
    if (!vercel.token) return "token";
    if (binding?.vercelProjectId) return "deploy";
    return "connect";
  });

  // ── Token / auth ─────────────────────────────────────────────────────────
  const [tokenInput, setTokenInput] = useState(vercel.token);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [vercelUser, setVercelUser] = useState<{ username: string; name: string | null } | null>(null);
  const [teams, setTeams] = useState<VercelTeam[]>([]);

  // ── Project selection ────────────────────────────────────────────────────
  const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedVercelProject, setSelectedVercelProject] = useState<VercelProject | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [newProjectName, setNewProjectName] = useState(sanitizeRepoName(projectLabel).toLowerCase());
  const [framework, setFramework] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Deployment ───────────────────────────────────────────────────────────
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [currentDeploy, setCurrentDeploy] = useState<VercelDeployment | null>(null);
  const [recentDeploys, setRecentDeploys] = useState<VercelDeployment[]>([]);
  const [deploysLoading, setDeploysLoading] = useState(false);

  // ── Load projects list ───────────────────────────────────────────────────
  const loadProjects = useCallback(async (token: string, teamId: string | null) => {
    setProjectsLoading(true);
    try {
      const list = await listVercelProjects(token, teamId);
      setVercelProjects(list);
    } catch { /* ignore */ }
    finally { setProjectsLoading(false); }
  }, []);

  // ── Load recent deployments ──────────────────────────────────────────────
  const loadDeployments = useCallback(async () => {
    const pid = binding?.vercelProjectId;
    if (!pid || !vercel.token) return;
    setDeploysLoading(true);
    try {
      const list = await listDeployments(vercel.token, pid, vercel.teamId, 5);
      setRecentDeploys(list);
    } catch { /* ignore */ }
    finally { setDeploysLoading(false); }
  }, [binding, vercel.token, vercel.teamId]);

  useEffect(() => {
    if (step === "project" && vercel.token) {
      loadProjects(vercel.token, vercel.teamId ?? null);
    }
    if (step === "deploy") {
      loadDeployments();
    }
  }, [step, vercel.token, vercel.teamId, loadProjects, loadDeployments]);

  // ── Validate token ───────────────────────────────────────────────────────
  const handleConnectToken = async () => {
    if (!tokenInput.trim()) { setTokenError("Please enter your Vercel token"); return; }
    setTokenLoading(true); setTokenError(null);
    try {
      const user = await getVercelUser(tokenInput.trim());
      const teamList = await getVercelTeams(tokenInput.trim());
      setVercelUser(user);
      setTeams(teamList);
      vercel.setToken(tokenInput.trim());
      setStep("connect");
    } catch (e) {
      setTokenError(`Invalid token: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setTokenLoading(false); }
  };

  // ── Select team / personal ───────────────────────────────────────────────
  const handleSelectTeam = (team: VercelTeam | null) => {
    vercel.setTeam(team?.id ?? null, team?.slug ?? null, team?.name ?? null);
    setStep("project");
  };

  // ── Create new Vercel project ────────────────────────────────────────────
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) { setCreateError("Project name is required"); return; }
    setCreating(true); setCreateError(null);
    try {
      const proj = await createVercelProject(vercel.token, {
        name: newProjectName.trim(),
        framework: framework || null,
        gitRepo: gitRepo ?? undefined,
        gitProvider: "github",
        teamId: vercel.teamId,
      });
      vercel.setBinding(projectId, {
        vercelProjectId: proj.id,
        vercelProjectName: proj.name,
        lastDeployUrl: null, lastDeployId: null,
        lastDeployState: null, lastDeployedAt: null,
      });
      addLog("success", `Linked to Vercel project: ${proj.name}`, projectId, projectLabel);
      showToast("success", `Created Vercel project "${proj.name}"`);
      setStep("deploy");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : String(e));
    } finally { setCreating(false); }
  };

  // ── Link existing project ────────────────────────────────────────────────
  const handleLinkProject = (proj: VercelProject) => {
    vercel.setBinding(projectId, {
      vercelProjectId: proj.id,
      vercelProjectName: proj.name,
      lastDeployUrl: null, lastDeployId: null,
      lastDeployState: null, lastDeployedAt: null,
    });
    addLog("info", `Linked "${projectLabel}" to Vercel project "${proj.name}"`, projectId, projectLabel);
    showToast("success", `Linked to Vercel project "${proj.name}"`);
    setStep("deploy");
  };

  // ── Trigger deployment ───────────────────────────────────────────────────
  const handleDeploy = async () => {
    const b = vercel.bindings[projectId];
    if (!b) return;
    if (!gitRepo) {
      setDeployError("This project has no GitHub remote URL. Push to GitHub first, then deploy.");
      return;
    }
    setDeploying(true); setDeployError(null); setCurrentDeploy(null);
    addLog("info", `Starting Vercel deployment for "${projectLabel}"...`, projectId, projectLabel);
    try {
      const deployment = await triggerDeployment(vercel.token, {
        projectId: b.vercelProjectId,
        gitRepo,
        branch,
        teamId: vercel.teamId,
      });
      setCurrentDeploy(deployment);
      vercel.updateBinding(projectId, {
        lastDeployId: deployment.uid,
        lastDeployState: deployment.state,
        lastDeployedAt: new Date().toISOString(),
        lastDeployUrl: deployment.url ? `https://${deployment.url}` : null,
      });
      // Poll for completion
      await pollDeployment(
        vercel.token, deployment.uid, vercel.teamId,
        (updated) => {
          setCurrentDeploy(updated);
          vercel.updateBinding(projectId, {
            lastDeployState: updated.state,
            lastDeployUrl: updated.url ? `https://${updated.url}` : null,
          });
        }
      );
      const final = await listDeployments(vercel.token, b.vercelProjectId, vercel.teamId, 5);
      setRecentDeploys(final);
      const finalState = final[0]?.state ?? "READY";
      if (finalState === "READY") {
        addLog("success", `Vercel deploy succeeded: https://${final[0]?.url}`, projectId, projectLabel);
        showToast("success", "Deployed to Vercel successfully!");
        setStep("done");
      } else {
        addLog("error", `Vercel deploy ended with state: ${finalState}`, projectId, projectLabel);
        setDeployError(`Deployment ended with state: ${finalState}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setDeployError(msg);
      addLog("error", `Vercel deploy failed: ${msg}`, projectId, projectLabel);
    } finally { setDeploying(false); }
  };

  // ── Disconnect project binding ───────────────────────────────────────────
  const handleDisconnect = () => {
    vercel.removeBinding(projectId);
    setStep("project");
    setCurrentDeploy(null);
    loadProjects(vercel.token, vercel.teamId ?? null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl animate-fade-in flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-black">
              <Triangle className="h-4 w-4 text-white fill-white" />
            </div>
            <div>
              <h2 className="font-semibold leading-none">Deploy to Vercel</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{projectLabel}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={deploying}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step indicator ── */}
        <StepBar step={step} />

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {step === "token" && (
            <StepToken
              tokenInput={tokenInput} setTokenInput={setTokenInput}
              loading={tokenLoading} error={tokenError}
              onConnect={handleConnectToken}
            />
          )}
          {step === "connect" && (
            <StepConnect
              user={vercelUser} teams={teams}
              teamId={vercel.teamId} teamName={vercel.teamName}
              onSelect={handleSelectTeam}
            />
          )}
          {step === "project" && (
            <StepProject
              projects={vercelProjects} loading={projectsLoading}
              selected={selectedVercelProject} setSelected={setSelectedVercelProject}
              createMode={createMode} setCreateMode={setCreateMode}
              newName={newProjectName} setNewName={setNewProjectName}
              framework={framework} setFramework={setFramework}
              creating={creating} createError={createError}
              gitRepo={gitRepo}
              onLink={handleLinkProject}
              onCreate={handleCreateProject}
              onBack={() => setStep("connect")}
              onRefresh={() => loadProjects(vercel.token, vercel.teamId ?? null)}
            />
          )}
          {(step === "deploy" || step === "done") && (
            <StepDeploy
              binding={vercel.bindings[projectId]}
              gitRepo={gitRepo} branch={branch}
              deploying={deploying} deployError={deployError}
              currentDeploy={currentDeploy}
              recentDeploys={recentDeploys} deploysLoading={deploysLoading}
              done={step === "done"}
              onDeploy={handleDeploy}
              onDisconnect={handleDisconnect}
              onRefreshDeploys={loadDeployments}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────
const STEPS: { key: Step; label: string }[] = [
  { key: "token",   label: "Token" },
  { key: "connect", label: "Account" },
  { key: "project", label: "Project" },
  { key: "deploy",  label: "Deploy" },
];

function StepBar({ step }: { step: Step }) {
  const idx = STEPS.findIndex((s) => s.key === step || (step === "done" && s.key === "deploy"));
  return (
    <div className="flex items-center gap-0 px-6 py-2 border-b bg-muted/30 shrink-0">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-1 ${
            i === idx ? "text-primary" : i < idx ? "text-muted-foreground" : "text-muted-foreground/40"
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              i < idx ? "bg-primary/20 text-primary" :
              i === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground/40"
            }`}>{i < idx ? "✓" : i + 1}</span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-px mx-1 ${i < idx ? "bg-primary/40" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 : Token ───────────────────────────────────────────────────────────
function StepToken({ tokenInput, setTokenInput, loading, error, onConnect }: {
  tokenInput: string; setTokenInput: (v: string) => void;
  loading: boolean; error: string | null; onConnect: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">Connect your Vercel account</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a Personal Access Token in your Vercel dashboard.
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Vercel Token</label>
        <Input
          type="password" placeholder="••••••••••••••••••••"
          value={tokenInput} onChange={(e) => setTokenInput(e.target.value)}
          className="font-mono"
          onKeyDown={(e) => e.key === "Enter" && onConnect()}
        />
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </div>
        )}
      </div>
      <a
        href="https://vercel.com/account/tokens"
        target="_blank" rel="noreferrer"
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" /> Get a token at vercel.com/account/tokens
      </a>
      <Button onClick={onConnect} loading={loading} className="w-full">
        <Triangle className="h-4 w-4 fill-current" /> Connect Vercel Account
      </Button>
    </div>
  );
}

// ─── Step 2 : Connect (team/personal) ────────────────────────────────────────
function StepConnect({ user, teams, teamId, teamName, onSelect }: {
  user: { username: string; name: string | null } | null;
  teams: VercelTeam[];
  teamId: string | null; teamName: string | null;
  onSelect: (team: VercelTeam | null) => void;
}) {
  return (
    <div className="space-y-4">
      {user && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{user.name ?? user.username}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <CheckCircle2 className="h-4 w-4 text-github-green ml-auto" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium mb-2">Deploy under:</p>
        <div className="space-y-2">
          {/* Personal */}
          <button
            onClick={() => onSelect(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-colors hover:bg-muted/50 ${
              teamId === null ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {user?.username[0].toUpperCase() ?? "P"}
            </div>
            <span className="flex-1">Personal Account ({user?.username ?? "me"})</span>
            {teamId === null && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
          </button>

          {/* Teams */}
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-colors hover:bg-muted/50 ${
                teamId === t.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                {t.avatar
                  ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  : t.name[0].toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground">@{t.slug}</p>
              </div>
              {teamId === t.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Currently selected: <span className="text-foreground font-medium">{teamName ?? "Personal Account"}</span>
      </p>
    </div>
  );
}

// ─── Step 3 : Project ─────────────────────────────────────────────────────────
const FRAMEWORKS = [
  { value: "", label: "Auto-detect" },
  { value: "nextjs", label: "Next.js" },
  { value: "vite", label: "Vite" },
  { value: "create-react-app", label: "Create React App" },
  { value: "nuxtjs", label: "Nuxt.js" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "SvelteKit" },
  { value: "astro", label: "Astro" },
  { value: "remix", label: "Remix" },
  { value: "gatsby", label: "Gatsby" },
  { value: "angular", label: "Angular" },
  { value: "static", label: "Static HTML" },
  { value: "other", label: "Other" },
];

function StepProject({ projects, loading, selected, setSelected, createMode, setCreateMode,
  newName, setNewName, framework, setFramework, creating, createError, gitRepo,
  onLink, onCreate, onBack, onRefresh }: {
  projects: VercelProject[]; loading: boolean;
  selected: VercelProject | null; setSelected: (p: VercelProject | null) => void;
  createMode: boolean; setCreateMode: (v: boolean) => void;
  newName: string; setNewName: (v: string) => void;
  framework: string; setFramework: (v: string) => void;
  creating: boolean; createError: string | null;
  gitRepo: string | null;
  onLink: (p: VercelProject) => void;
  onCreate: () => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [showFramework, setShowFramework] = useState(false);
  const frameworkLabel = FRAMEWORKS.find((f) => f.value === framework)?.label ?? "Auto-detect";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Select a Vercel Project</p>
        <div className="flex gap-2">
          <button onClick={onRefresh} disabled={loading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!createMode ? (
        <>
          {/* ── Existing projects list ── */}
          <div className="rounded-lg border overflow-hidden max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                <Globe className="h-8 w-8 opacity-30" />
                <p>No Vercel projects found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(selected?.id === p.id ? null : p)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-muted/50 ${
                      selected?.id === p.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center shrink-0">
                      <Triangle className="h-3.5 w-3.5 text-white fill-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.link?.repo && (
                        <p className="text-xs text-muted-foreground truncate">
                          <GitBranch className="h-3 w-3 inline mr-0.5" />
                          {p.link.repo}
                        </p>
                      )}
                    </div>
                    {selected?.id === p.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
            <Button variant="outline" onClick={() => setCreateMode(true)} className="flex-1">
              <Plus className="h-4 w-4" /> New Project
            </Button>
            <Button onClick={() => selected && onLink(selected)} disabled={!selected} className="flex-1">
              Link Project
            </Button>
          </div>
        </>
      ) : (
        /* ── Create new project ── */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project Name</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="my-project" className="font-mono" />
          </div>

          {/* Framework selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Framework</label>
            <div className="relative">
              <button
                onClick={() => setShowFramework(!showFramework)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm hover:bg-muted/50 transition-colors"
              >
                {frameworkLabel}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {showFramework && (
                <div className="absolute top-full mt-1 w-full z-10 rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {FRAMEWORKS.map((f) => (
                    <button key={f.value}
                      onClick={() => { setFramework(f.value); setShowFramework(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${framework === f.value ? "text-primary font-medium" : ""}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {gitRepo ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-github-green/10 border border-github-green/20 text-xs text-github-green">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Will link to GitHub: <span className="font-mono ml-1">{gitRepo}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-github-orange/10 border border-github-orange/20 text-xs text-github-orange">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              No GitHub remote detected — you can link it later in Vercel dashboard
            </div>
          )}

          {createError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{createError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateMode(false)} disabled={creating} className="flex-1">
              Back
            </Button>
            <Button onClick={onCreate} loading={creating} className="flex-1">
              <Plus className="h-4 w-4" /> Create & Link
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4 : Deploy ──────────────────────────────────────────────────────────
import type { VercelBinding } from "@/store/vercelStore";

function StepDeploy({
  binding, gitRepo, branch,
  deploying, deployError, currentDeploy,
  recentDeploys, deploysLoading, done,
  onDeploy, onDisconnect, onRefreshDeploys, onClose,
}: {
  binding: VercelBinding | undefined;
  gitRepo: string | null;
  branch: string;
  deploying: boolean;
  deployError: string | null;
  currentDeploy: VercelDeployment | null;
  recentDeploys: VercelDeployment[];
  deploysLoading: boolean;
  done: boolean;
  onDeploy: () => void;
  onDisconnect: () => void;
  onRefreshDeploys: () => void;
  onClose: () => void;
}) {
  const stateInfo = (state: VercelDeployment["state"]) => {
    switch (state) {
      case "READY":       return { label: "Ready",    colorClass: "text-github-green" };
      case "ERROR":       return { label: "Error",    colorClass: "text-github-red" };
      case "BUILDING":    return { label: "Building", colorClass: "text-github-orange" };
      case "INITIALIZING":
      case "QUEUED":      return { label: "Queued",   colorClass: "text-github-blue" };
      case "CANCELED":    return { label: "Canceled", colorClass: "text-muted-foreground" };
      default:            return { label: state,      colorClass: "text-muted-foreground" };
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Project info ── */}
      {binding && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center shrink-0">
            <Triangle className="h-3.5 w-3.5 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{binding.vercelProjectName}</p>
            {binding.lastDeployUrl && (
              <a
                href={binding.lastDeployUrl}
                target="_blank" rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                {binding.lastDeployUrl}
              </a>
            )}
          </div>
          <button
            onClick={onDisconnect}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            title="Unlink project"
          >
            Unlink
          </button>
        </div>
      )}

      {/* ── Git info ── */}
      {gitRepo ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border text-xs">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-mono">{gitRepo}</span>
          <span className="text-muted-foreground">@</span>
          <span className="font-mono text-primary">{branch}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-github-orange/10 border border-github-orange/20 text-xs text-github-orange">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          No GitHub remote — push to GitHub first before deploying
        </div>
      )}

      {/* ── Current deploy status ── */}
      {currentDeploy && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Current Deployment</span>
            <span className={`text-xs font-semibold ${stateInfo(currentDeploy.state).colorClass}`}>
              {stateInfo(currentDeploy.state).label}
            </span>
          </div>
          {currentDeploy.url && (
            <a
              href={`https://${currentDeploy.url}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> https://{currentDeploy.url}
            </a>
          )}
          {(currentDeploy.state === "BUILDING" || currentDeploy.state === "INITIALIZING" || currentDeploy.state === "QUEUED") && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deployment in progress…
            </div>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {deployError && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{deployError}</p>
        </div>
      )}

      {/* ── Success ── */}
      {done && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-github-green/10 border border-github-green/20 text-sm text-github-green">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Deployment successful!
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-2">
        {done ? (
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        ) : (
          <Button
            onClick={onDeploy}
            loading={deploying}
            disabled={!gitRepo || deploying}
            className="flex-1"
          >
            <Triangle className="h-4 w-4 fill-current" />
            {deploying ? "Deploying…" : "Deploy to Production"}
          </Button>
        )}
      </div>

      {/* ── Recent deployments ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Deployments</p>
          <button
            onClick={onRefreshDeploys}
            disabled={deploysLoading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${deploysLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {deploysLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </div>
        ) : recentDeploys.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No deployments yet</p>
        ) : (
          <div className="rounded-lg border divide-y divide-border overflow-hidden">
            {recentDeploys.map((d) => (
              <div key={d.uid} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                <span className={`font-semibold w-16 shrink-0 ${stateInfo(d.state).colorClass}`}>
                  {stateInfo(d.state).label}
                </span>
                <span className="font-mono truncate flex-1 text-muted-foreground">{d.uid.slice(0, 12)}…</span>
                {d.url && (
                  <a href={`https://${d.url}`} target="_blank" rel="noreferrer"
                    className="text-primary hover:underline shrink-0">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
