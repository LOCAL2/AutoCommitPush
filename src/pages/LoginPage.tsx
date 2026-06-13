import { useState } from "react";
import { GitBranch, Github, Key, Eye, EyeOff, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";

// ─── All GitHub OAuth scopes ──────────────────────────────────────────────────
const SCOPE_GROUPS = [
  {
    group: "Repository",
    scopes: [
      { id: "repo", label: "repo", desc: "Full control of private repositories" },
      { id: "repo:status", label: "repo:status", desc: "Access commit status" },
      { id: "repo_deployment", label: "repo_deployment", desc: "Access deployment status" },
      { id: "public_repo", label: "public_repo", desc: "Access public repositories" },
      { id: "repo:invite", label: "repo:invite", desc: "Access repository invitations" },
      { id: "security_events", label: "security_events", desc: "Read and write security events" },
      { id: "delete_repo", label: "delete_repo", desc: "Delete repositories" },
    ],
  },
  {
    group: "Workflow & Packages",
    scopes: [
      { id: "workflow", label: "workflow", desc: "Update GitHub Action workflows" },
      { id: "write:packages", label: "write:packages", desc: "Upload packages to GitHub Package Registry" },
      { id: "read:packages", label: "read:packages", desc: "Download packages from GitHub Package Registry" },
      { id: "delete:packages", label: "delete:packages", desc: "Delete packages from GitHub Package Registry" },
    ],
  },
  {
    group: "Organization",
    scopes: [
      { id: "admin:org", label: "admin:org", desc: "Full control of orgs and teams" },
      { id: "write:org", label: "write:org", desc: "Read and write org and team membership" },
      { id: "read:org", label: "read:org", desc: "Read org and team membership" },
      { id: "manage_runners:org", label: "manage_runners:org", desc: "Manage org runners and runner groups" },
    ],
  },
  {
    group: "User",
    scopes: [
      { id: "user", label: "user", desc: "Update ALL user data" },
      { id: "read:user", label: "read:user", desc: "Read ALL user profile data" },
      { id: "user:email", label: "user:email", desc: "Access user email addresses (read-only)" },
      { id: "user:follow", label: "user:follow", desc: "Follow and unfollow users" },
    ],
  },
  {
    group: "Keys & Hooks",
    scopes: [
      { id: "admin:public_key", label: "admin:public_key", desc: "Full control of user public keys" },
      { id: "write:public_key", label: "write:public_key", desc: "Write user public keys" },
      { id: "read:public_key", label: "read:public_key", desc: "Read user public keys" },
      { id: "admin:repo_hook", label: "admin:repo_hook", desc: "Full control of repository hooks" },
      { id: "write:repo_hook", label: "write:repo_hook", desc: "Write repository hooks" },
      { id: "read:repo_hook", label: "read:repo_hook", desc: "Read repository hooks" },
      { id: "admin:org_hook", label: "admin:org_hook", desc: "Full control of organization hooks" },
      { id: "admin:gpg_key", label: "admin:gpg_key", desc: "Full control of public user GPG keys" },
      { id: "write:gpg_key", label: "write:gpg_key", desc: "Write public user GPG keys" },
      { id: "read:gpg_key", label: "read:gpg_key", desc: "Read public user GPG keys" },
      { id: "admin:ssh_signing_key", label: "admin:ssh_signing_key", desc: "Full control of public user SSH signing keys" },
      { id: "write:ssh_signing_key", label: "write:ssh_signing_key", desc: "Write public user SSH signing keys" },
      { id: "read:ssh_signing_key", label: "read:ssh_signing_key", desc: "Read public user SSH signing keys" },
    ],
  },
  {
    group: "Misc",
    scopes: [
      { id: "gist", label: "gist", desc: "Create gists" },
      { id: "notifications", label: "notifications", desc: "Access notifications" },
      { id: "write:discussion", label: "write:discussion", desc: "Read and write team discussions" },
      { id: "read:discussion", label: "read:discussion", desc: "Read team discussions" },
      { id: "project", label: "project", desc: "Full control of projects" },
      { id: "read:project", label: "read:project", desc: "Read access of projects" },
    ],
  },
  {
    group: "Enterprise & Audit",
    scopes: [
      { id: "admin:enterprise", label: "admin:enterprise", desc: "Full control of enterprises" },
      { id: "manage_runners:enterprise", label: "manage_runners:enterprise", desc: "Manage enterprise runners" },
      { id: "manage_billing:enterprise", label: "manage_billing:enterprise", desc: "Read and write enterprise billing data" },
      { id: "read:enterprise", label: "read:enterprise", desc: "Read enterprise profile data" },
      { id: "scim:enterprise", label: "scim:enterprise", desc: "Provisioning of users and groups via SCIM" },
      { id: "audit_log", label: "audit_log", desc: "Full control of audit log" },
      { id: "read:audit_log", label: "read:audit_log", desc: "Read access of audit log" },
    ],
  },
  {
    group: "Codespaces & Copilot",
    scopes: [
      { id: "codespace", label: "codespace", desc: "Full control of codespaces" },
      { id: "codespace:secrets", label: "codespace:secrets", desc: "Manage codespace secrets" },
      { id: "copilot", label: "copilot", desc: "Full control of GitHub Copilot settings" },
      { id: "manage_billing:copilot", label: "manage_billing:copilot", desc: "View and edit Copilot Business seat assignments" },
    ],
  },
  {
    group: "Network",
    scopes: [
      { id: "write:network_configurations", label: "write:network_configurations", desc: "Write org hosted compute network configurations" },
      { id: "read:network_configurations", label: "read:network_configurations", desc: "Read org hosted compute network configurations" },
    ],
  },
];

// All scope IDs flat list
const ALL_SCOPES = SCOPE_GROUPS.flatMap((g) => g.scopes.map((s) => s.id));

// Recommended minimum for this app
const RECOMMENDED_SCOPES = ["repo", "read:user", "user:email", "delete_repo", "workflow"];

function buildTokenUrl(scopes: string[]): string {
  const base = "https://github.com/settings/tokens/new";
  const params = new URLSearchParams({
    scopes: scopes.join(","),
    description: "AutoCommitPush",
  });
  return `${base}?${params.toString()}`;
}

async function openUrl(url: string) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("plugin:shell|open", { path: url });
  } catch {
    window.open(url, "_blank");
  }
}

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showScopes, setShowScopes] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    new Set(ALL_SCOPES)
  );
  const { login, isLoading, error } = useAuthStore();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      showToast("warning", "Please enter your GitHub token");
      return;
    }
    try {
      await login(token.trim());
      showToast("success", "Logged in successfully!");
    } catch {
      showToast("error", "Invalid token. Please check and try again.");
    }
  };

  const toggleScope = (id: string) => {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedScopes(new Set(ALL_SCOPES));
  const selectRecommended = () => setSelectedScopes(new Set(RECOMMENDED_SCOPES));
  const clearAll = () => setSelectedScopes(new Set());

  const handleOpenTokenPage = () => {
    openUrl(buildTokenUrl([...selectedScopes]));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GitBranch className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">AutoCommitPush</h1>
          <p className="text-sm text-muted-foreground mt-1">Git automation made simple</p>
        </div>

        {/* Login card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Github className="h-5 w-5" />
            <h2 className="font-semibold">Sign in with GitHub</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                Personal Access Token
              </label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10 font-mono text-xs"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <Button type="submit" className="w-full" loading={isLoading}>
              <Github className="h-4 w-4" />
              Sign In
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Generate token button */}
            <button
              onClick={handleOpenTokenPage}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Generate a new token on GitHub ({selectedScopes.size} scopes selected)
            </button>

            {/* Scope selector toggle */}
            <button
              onClick={() => setShowScopes(!showScopes)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {showScopes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showScopes ? "Hide" : "Customize"} token scopes
            </button>
          </div>

          {/* Scope picker */}
          {showScopes && (
            <div className="mt-3 border rounded-lg overflow-hidden animate-fade-in">
              {/* Quick actions */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
                <span className="text-xs text-muted-foreground flex-1">
                  {selectedScopes.size} / {ALL_SCOPES.length} selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  All
                </button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  onClick={selectRecommended}
                  className="text-xs text-github-green hover:underline"
                >
                  Recommended
                </button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Clear
                </button>
              </div>

              {/* Scope groups */}
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {SCOPE_GROUPS.map((group) => (
                  <div key={group.group}>
                    <div className="px-3 py-1.5 bg-muted/30">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {group.group}
                      </p>
                    </div>
                    <div className="divide-y divide-border/50">
                      {group.scopes.map((scope) => (
                        <label
                          key={scope.id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedScopes.has(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                            className="accent-primary h-3.5 w-3.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-mono text-primary">{scope.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{scope.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security note */}
        <div className="mt-4 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <p className="text-foreground font-medium mb-1">Security</p>
          <p>Your token is stored in the system keychain — never as plain text.</p>
        </div>
      </div>
    </div>
  );
}
