import { invoke } from "@tauri-apps/api/core";
import type {
  RepoStatus,
  FileChange,
  FileDiff,
  GitHubUser,
  GitHubRepo,
  CreateRepoParams,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const saveToken = (token: string) =>
  invoke<void>("save_token", { token });

export const getToken = () => invoke<string>("get_token");

export const deleteToken = () => invoke<void>("delete_token");

export const hasToken = () => invoke<boolean>("has_token");

// ─── GitHub API ──────────────────────────────────────────────────────────────
export const getUserInfo = (token: string) =>
  invoke<GitHubUser>("get_user_info", { token });

export const createGithubRepo = (token: string, params: CreateRepoParams) =>
  invoke<GitHubRepo>("create_github_repo", { token, params });

export const getUserRepos = (token: string) =>
  invoke<GitHubRepo[]>("get_user_repos", { token });

export const checkRepoExists = (token: string, owner: string, repo: string) =>
  invoke<boolean>("check_repo_exists", { token, owner, repo });

export const deleteGithubRepo = (token: string, owner: string, repo: string) =>
  invoke<string>("delete_github_repo", { token, owner, repo });

// ─── Git Ops ─────────────────────────────────────────────────────────────────
export const initRepository = (path: string) =>
  invoke<string>("init_repository", { path });

export const getRepoStatus = (path: string) =>
  invoke<RepoStatus>("get_repo_status", { path });

export const getFileChanges = (path: string) =>
  invoke<FileChange[]>("get_file_changes", { path });

export const getFileDiff = (path: string, filePath?: string) =>
  invoke<FileDiff[]>("get_file_diff", { path, filePath: filePath ?? null });

export const watchProject = (projectId: string, path: string) =>
  invoke<void>("watch_project", { projectId, path });

export const unwatchProject = (projectId: string) =>
  invoke<void>("unwatch_project", { projectId });

export const stageAllFiles = (path: string) =>
  invoke<string>("stage_all_files", { path });

export const createCommit = (
  path: string,
  message: string,
  authorName: string,
  authorEmail: string
) => invoke<string>("create_commit", { path, message, authorName, authorEmail });

export const pushToRemote = (path: string, token: string, branch: string) =>
  invoke<string>("push_to_remote", { path, token, branch });

export const pullFromRemote = (path: string, token: string, branch: string) =>
  invoke<string>("pull_from_remote", { path, token, branch });

export const getBranches = (path: string) =>
  invoke<string[]>("get_branches", { path });

export const setRemote = (path: string, url: string) =>
  invoke<string>("set_remote", { path, url });

// ─── Filesystem ──────────────────────────────────────────────────────────────
export const readGitignore = (path: string) =>
  invoke<string>("read_gitignore", { path });

export const writeGitignore = (path: string, content: string) =>
  invoke<string>("write_gitignore", { path, content });

export const openInExplorer = (path: string) =>
  invoke<void>("open_in_explorer", { path });

export const pathExists = (path: string) =>
  invoke<boolean>("path_exists", { path });

export const getGitignoreTemplate = (template: string) =>
  invoke<string>("get_gitignore_template", { template });

export const cloneRepository = (url: string, path: string, token: string) =>
  invoke<string>("clone_repository", { url, path, token });

// ─── README ──────────────────────────────────────────────────────────────────
export const readReadme = (path: string) =>
  invoke<string>("read_readme", { path });

export const writeReadme = (path: string, content: string) =>
  invoke<string>("write_readme", { path, content });

// ─── File System Explorer ─────────────────────────────────────────────────────
export const listDirectories = (path: string) =>
  invoke<{ name: string; path: string; is_git: boolean }[]>("list_directories", { path });

export const getDrives = () =>
  invoke<{ name: string; path: string }[]>("get_drives");

export const getHomeDir = () =>
  invoke<string | null>("get_home_dir");

export const getUserDirs = () =>
  invoke<{
    desktop: string | null;
    downloads: string | null;
    documents: string | null;
    pictures: string | null;
    music: string | null;
    videos: string | null;
  }>("get_user_dirs");

// ─── Terminal ─────────────────────────────────────────────────────────────────
export const runTerminalCommand = (cwd: string, input: string) =>
  invoke<{ stdout: string; stderr: string; exit_code: number }>(
    "run_terminal_command",
    { cwd, input }
  );
