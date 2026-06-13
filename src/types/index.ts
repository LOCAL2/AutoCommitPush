// ─── Auth ────────────────────────────────────────────────────────────────────
export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  public_repos: number;
  followers: number;
}

// ─── Project ─────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  label: string;
  path: string;
  createdAt: string;
  lastPushedAt: string | null;
  lastPushStatus: "success" | "error" | null;
  lastCommitMessage: string | null;
  autoCommitEnabled: boolean;
  autoCommitInterval: number; // minutes: 5|15|30|60
  defaultBranch: string;
  remoteUrl: string | null;
}

// ─── Repo Status ─────────────────────────────────────────────────────────────
export interface RepoStatus {
  is_git_repo: boolean;
  has_gitignore: boolean;
  branch: string | null;
  last_commit: string | null;
  last_commit_time: string | null;
  remote_url: string | null;
  pending_changes: number;
  untracked: string[];
  modified: string[];
  staged: string[];
}

export interface FileChange {
  path: string;
  status: "Added" | "Modified" | "Deleted" | "Untracked" | "Unknown";
  is_staged: boolean;
}

export interface DiffLine {
  origin: string;
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
}

export interface FileDiff {
  path: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

// ─── GitHub Repo ─────────────────────────────────────────────────────────────
export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  private: boolean;
  description: string | null;
}

export interface CreateRepoParams {
  name: string;
  description?: string;
  private: boolean;
  auto_init: boolean;
}

// ─── Logs ────────────────────────────────────────────────────────────────────
export type LogLevel = "info" | "success" | "warning" | "error";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  projectId?: string;
  projectLabel?: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light" | "system";

export interface AppSettings {
  defaultCommitMessage: string;
  defaultPrivate: boolean;
  theme: Theme;
  launchOnStartup: boolean;
  authorName: string;
  authorEmail: string;
  dockerUsername?: string;
  dockerPassword?: string;
  dockerDefaultTag?: string;
}

// ─── Push Result ─────────────────────────────────────────────────────────────
export interface PushResult {
  projectId: string;
  success: boolean;
  message: string;
  timestamp: string;
}
