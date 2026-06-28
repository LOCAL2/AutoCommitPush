/**
 * Vercel REST API v9 client
 * Docs: https://vercel.com/docs/rest-api
 *
 * All calls go directly from the app — no backend proxy needed.
 * The user provides their own Vercel personal access token.
 */

const BASE = "https://api.vercel.com";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
  avatar: string | null;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  link?: {
    type: string;
    repo?: string;
    repoId?: number;
    org?: string;
    gitCredentialId?: string;
    productionBranch?: string;
  };
  latestDeployments?: VercelDeployment[];
  updatedAt?: number;
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED";
  readyState: string;
  createdAt: number;
  target: "production" | "preview" | null;
  meta?: Record<string, string>;
  inspectorUrl?: string;
}

export interface VercelEnvVar {
  key: string;
  value: string;
  type: "plain" | "secret" | "encrypted";
  target: ("production" | "preview" | "development")[];
}

export interface CreateProjectOptions {
  name: string;
  framework?: string | null;
  /** GitHub repo full name, e.g. "owner/repo" */
  gitRepo?: string;
  gitProvider?: "github";
  rootDirectory?: string | null;
  buildCommand?: string | null;
  outputDirectory?: string | null;
  installCommand?: string | null;
  envVars?: VercelEnvVar[];
  teamId?: string | null;
}

export interface DeployOptions {
  projectId: string;
  /** GitHub repo full name "owner/repo" — used to trigger via GitHub link */
  gitRepo?: string;
  branch?: string;
  teamId?: string | null;
}

export interface VercelUserInfo {
  uid: string;
  username: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function teamQuery(teamId?: string | null): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

async function vercelFetch<T>(
  token: string,
  path: string,
  opts?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...headers(token), ...(opts?.headers ?? {}) },
  });

  if (!res.ok) {
    let msg = `Vercel API error ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) msg = body.error.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Validate token and return user info */
export async function getVercelUser(token: string): Promise<VercelUserInfo> {
  const data = await vercelFetch<{ user: VercelUserInfo }>(token, "/v2/user");
  return data.user;
}

/** List all teams the user belongs to */
export async function getVercelTeams(token: string): Promise<VercelTeam[]> {
  const data = await vercelFetch<{ teams: VercelTeam[] }>(token, "/v2/teams");
  return data.teams ?? [];
}

// ─── Projects ─────────────────────────────────────────────────────────────────

/** List all projects (personal or team) */
export async function listVercelProjects(
  token: string,
  teamId?: string | null
): Promise<VercelProject[]> {
  const q = teamId ? `?teamId=${encodeURIComponent(teamId)}&limit=100` : "?limit=100";
  const data = await vercelFetch<{ projects: VercelProject[] }>(token, `/v9/projects${q}`);
  return data.projects ?? [];
}

/** Get a single project by ID or name */
export async function getVercelProject(
  token: string,
  projectIdOrName: string,
  teamId?: string | null
): Promise<VercelProject> {
  const q = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  return vercelFetch<VercelProject>(token, `/v9/projects/${encodeURIComponent(projectIdOrName)}${q}`);
}

/**
 * Create a new Vercel project linked to a GitHub repository.
 * GitHub must already be connected in Vercel settings.
 */
export async function createVercelProject(
  token: string,
  opts: CreateProjectOptions
): Promise<VercelProject> {
  const q = opts.teamId ? `?teamId=${encodeURIComponent(opts.teamId)}` : "";

  const body: Record<string, unknown> = {
    name: opts.name,
    framework: opts.framework ?? null,
  };

  if (opts.gitRepo) {
    const [org, repo] = opts.gitRepo.split("/");
    body.gitRepository = {
      type: opts.gitProvider ?? "github",
      repo: opts.gitRepo,
      org,
      repoName: repo,
    };
  }

  if (opts.rootDirectory != null) body.rootDirectory = opts.rootDirectory;
  if (opts.buildCommand != null) body.buildCommand = opts.buildCommand;
  if (opts.outputDirectory != null) body.outputDirectory = opts.outputDirectory;
  if (opts.installCommand != null) body.installCommand = opts.installCommand;

  return vercelFetch<VercelProject>(token, `/v10/projects${q}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Delete a Vercel project */
export async function deleteVercelProject(
  token: string,
  projectId: string,
  teamId?: string | null
): Promise<void> {
  const q = teamQuery(teamId);
  await vercelFetch<unknown>(token, `/v9/projects/${encodeURIComponent(projectId)}${q}`, {
    method: "DELETE",
  });
}

// ─── Deployments ─────────────────────────────────────────────────────────────

/** List recent deployments for a project */
export async function listDeployments(
  token: string,
  projectId: string,
  teamId?: string | null,
  limit = 10
): Promise<VercelDeployment[]> {
  const params = new URLSearchParams({ projectId, limit: String(limit) });
  if (teamId) params.set("teamId", teamId);
  const data = await vercelFetch<{ deployments: VercelDeployment[] }>(
    token,
    `/v6/deployments?${params.toString()}`
  );
  return data.deployments ?? [];
}

/** Get a single deployment by ID */
export async function getDeployment(
  token: string,
  deploymentId: string,
  teamId?: string | null
): Promise<VercelDeployment> {
  const q = teamQuery(teamId);
  return vercelFetch<VercelDeployment>(token, `/v13/deployments/${deploymentId}${q}`);
}

/**
 * Trigger a new deployment by creating a deployment from the latest commit
 * of the linked GitHub repo branch.
 *
 * Vercel requires a GitHub connection already set up for the project.
 */
export async function triggerDeployment(
  token: string,
  opts: DeployOptions
): Promise<VercelDeployment> {
  const q = opts.teamId ? `?teamId=${encodeURIComponent(opts.teamId)}` : "";

  const body: Record<string, unknown> = {
    name: opts.projectId,
    project: opts.projectId,
    target: "production",
    gitSource: opts.gitRepo
      ? {
          type: "github",
          ref: opts.branch ?? "main",
          repoId: undefined, // will be resolved by Vercel from the project link
        }
      : undefined,
  };

  return vercelFetch<VercelDeployment>(token, `/v13/deployments${q}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Cancel an in-progress deployment */
export async function cancelDeployment(
  token: string,
  deploymentId: string,
  teamId?: string | null
): Promise<void> {
  const q = teamQuery(teamId);
  await vercelFetch<unknown>(token, `/v12/deployments/${deploymentId}/cancel${q}`, {
    method: "PATCH",
  });
}

// ─── Environment variables ────────────────────────────────────────────────────

export async function listEnvVars(
  token: string,
  projectId: string,
  teamId?: string | null
): Promise<VercelEnvVar[]> {
  const q = teamQuery(teamId);
  const data = await vercelFetch<{ envs: VercelEnvVar[] }>(
    token,
    `/v9/projects/${encodeURIComponent(projectId)}/env${q}`
  );
  return data.envs ?? [];
}

export async function upsertEnvVars(
  token: string,
  projectId: string,
  envs: VercelEnvVar[],
  teamId?: string | null
): Promise<void> {
  const q = teamQuery(teamId);
  await vercelFetch<unknown>(
    token,
    `/v10/projects/${encodeURIComponent(projectId)}/env${q}`,
    {
      method: "POST",
      body: JSON.stringify(envs),
    }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Infer a reasonable Vercel framework slug from file patterns / package.json */
export function guessFramework(remoteUrl: string | null): string | null {
  // We can't read local files in the Vercel API context,
  // so we just return null and let the user pick.
  void remoteUrl;
  return null;
}

/** Map deployment state to a human-readable label + color class */
export function deploymentStateInfo(state: VercelDeployment["state"]): {
  label: string;
  colorClass: string;
} {
  switch (state) {
    case "READY":
      return { label: "Ready", colorClass: "text-github-green" };
    case "ERROR":
      return { label: "Error", colorClass: "text-github-red" };
    case "BUILDING":
      return { label: "Building", colorClass: "text-github-orange" };
    case "INITIALIZING":
    case "QUEUED":
      return { label: "Queued", colorClass: "text-github-blue" };
    case "CANCELED":
      return { label: "Canceled", colorClass: "text-muted-foreground" };
    default:
      return { label: state, colorClass: "text-muted-foreground" };
  }
}

/** Poll a deployment until it reaches a terminal state */
export async function pollDeployment(
  token: string,
  deploymentId: string,
  teamId: string | null | undefined,
  onUpdate: (d: VercelDeployment) => void,
  intervalMs = 4000,
  maxAttempts = 60
): Promise<VercelDeployment> {
  const terminal = new Set(["READY", "ERROR", "CANCELED"]);
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const d = await getDeployment(token, deploymentId, teamId);
        onUpdate(d);
        attempts++;
        if (terminal.has(d.state) || attempts >= maxAttempts) {
          resolve(d);
        } else {
          setTimeout(tick, intervalMs);
        }
      } catch (e) {
        reject(e);
      }
    };
    tick();
  });
}
