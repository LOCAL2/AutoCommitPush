import type { RepoStatus, FileDiff } from "@/types";

// ─── File category detection ──────────────────────────────────────────────────

type FileStatus = "New" | "Modified" | "Deleted";

interface FileInfo {
  path: string;
  status: FileStatus;
  additions?: number;
  deletions?: number;
}

function categorize(files: FileInfo[]) {
  const cats = {
    config: [] as FileInfo[],
    docs: [] as FileInfo[],
    tests: [] as FileInfo[],
    styles: [] as FileInfo[],
    types: [] as FileInfo[],
    components: [] as FileInfo[],
    store: [] as FileInfo[],
    api: [] as FileInfo[],
    assets: [] as FileInfo[],
    build: [] as FileInfo[],
    rust: [] as FileInfo[],
    source: [] as FileInfo[],
  };

  for (const f of files) {
    const p = f.path.toLowerCase().replace(/\\/g, "/");
    const name = p.split("/").pop() ?? p;
    const ext = name.split(".").pop() ?? "";

    if (
      name === "package.json" || name === "package-lock.json" ||
      name === "cargo.toml" || name === "cargo.lock" ||
      name.endsWith(".config.ts") || name.endsWith(".config.js") ||
      name.includes("tsconfig") || name.includes("tailwind") ||
      name.includes("vite.config") || name.includes(".eslintrc") ||
      name.includes(".prettierrc") || name.endsWith(".toml") ||
      name.endsWith(".lock") || name.includes(".env")
    ) { cats.config.push(f); continue; }

    if (
      ext === "md" || ext === "txt" || ext === "rst" ||
      name.includes("readme") || name.includes("changelog") ||
      name.includes("license")
    ) { cats.docs.push(f); continue; }

    if (
      p.includes("/test") || p.includes("/tests") || p.includes("/spec") ||
      p.includes("__tests__") || name.endsWith(".test.ts") ||
      name.endsWith(".test.tsx") || name.endsWith(".spec.ts")
    ) { cats.tests.push(f); continue; }

    if (ext === "css" || ext === "scss" || ext === "sass" || ext === "less") {
      cats.styles.push(f); continue;
    }

    if (ext === "rs") {
      cats.rust.push(f); continue;
    }

    if (p.includes("/store/") || name.includes("store.ts") || name.includes("store.tsx")) {
      cats.store.push(f); continue;
    }

    if (
      p.includes("/types") || p.includes("/interfaces") ||
      name.endsWith(".d.ts") || name === "types.ts"
    ) { cats.types.push(f); continue; }

    if (
      p.includes("/components/") || p.includes("/pages/") ||
      p.includes("/views/") || p.includes("/ui/") ||
      ext === "tsx" || ext === "jsx" || ext === "vue" || ext === "svelte"
    ) { cats.components.push(f); continue; }

    if (
      p.includes("/api/") || p.includes("/routes/") || p.includes("/handlers/") ||
      p.includes("/services/") || p.includes("/commands/")
    ) { cats.api.push(f); continue; }

    if (
      ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "svg" ||
      ext === "ico" || ext === "gif" || ext === "webp" ||
      p.includes("/assets/") || p.includes("/public/") || p.includes("/icons/")
    ) { cats.assets.push(f); continue; }

    if (
      p.includes("/dist/") || p.includes("/build/") || p.includes("/target/") ||
      name.includes("dockerfile") || name.includes("docker-compose") ||
      p.includes(".github/") || p.includes("/gen/")
    ) { cats.build.push(f); continue; }

    cats.source.push(f);
  }

  return cats;
}

// ─── Infer conventional commit type ──────────────────────────────────────────

function inferType(
  files: FileInfo[],
  cats: ReturnType<typeof categorize>
): { type: string; scope: string } {
  const hasNew = files.some((f) => f.status === "New");
  const hasMod = files.some((f) => f.status === "Modified");
  const hasDel = files.some((f) => f.status === "Deleted");

  // Dominant category by count
  const counts = (Object.entries(cats) as [string, FileInfo[]][])
    .map(([k, v]) => ({ k, n: v.length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const topCat = counts[0]?.k ?? "source";

  const scopeMap: Record<string, string> = {
    config: "config",
    docs: "docs",
    tests: "tests",
    styles: "styles",
    types: "types",
    components: "ui",
    store: "store",
    api: "api",
    assets: "assets",
    build: "build",
    rust: "backend",
    source: "core",
  };
  const scope = scopeMap[topCat] ?? "app";

  let type = "chore";
  if (cats.tests.length > 0 && cats.tests.length === files.length) type = "test";
  else if (cats.docs.length > 0 && cats.docs.length === files.length) type = "docs";
  else if (cats.styles.length > 0 && cats.styles.length === files.length) type = "style";
  else if (cats.config.length > 0 && cats.config.length === files.length) type = "chore";
  else if (cats.build.length > 0 && cats.build.length === files.length) type = "build";
  else if (hasNew && !hasMod && !hasDel) type = "feat";
  else if (hasDel && !hasNew && !hasMod) type = "refactor";
  else if (hasMod && !hasNew) type = "fix";
  else if (hasNew) type = "feat";

  return { type, scope };
}

// ─── Build a human-readable summary from actual diffs ─────────────────────────

function fileName(p: string) {
  return p.replace(/\\/g, "/").split("/").pop() ?? p;
}

function buildSummary(
  files: FileInfo[],
  cats: ReturnType<typeof categorize>
): string {
  const newFiles = files.filter((f) => f.status === "New");
  const modFiles = files.filter((f) => f.status === "Modified");
  const delFiles = files.filter((f) => f.status === "Deleted");

  // Single file — be specific
  if (files.length === 1) {
    const f = files[0];
    const name = fileName(f.path).replace(/\.[^.]+$/, "");
    if (f.status === "New") return `add ${name}`;
    if (f.status === "Deleted") return `remove ${name}`;
    return `update ${name}`;
  }

  // Few files — list names
  if (files.length <= 3) {
    const names = files.map((f) => fileName(f.path).replace(/\.[^.]+$/, ""));
    const parts: string[] = [];
    if (newFiles.length) parts.push(`add ${newFiles.map((f) => fileName(f.path).replace(/\.[^.]+$/, "")).join(", ")}`);
    if (modFiles.length) parts.push(`update ${modFiles.map((f) => fileName(f.path).replace(/\.[^.]+$/, "")).join(", ")}`);
    if (delFiles.length) parts.push(`remove ${delFiles.map((f) => fileName(f.path).replace(/\.[^.]+$/, "")).join(", ")}`);
    return parts.join("; ") || `update ${names.join(", ")}`;
  }

  // Category-specific descriptions
  const dominant = (Object.entries(cats) as [string, FileInfo[]][])
    .sort((a, b) => b[1].length - a[1].length)[0];

  const catMessages: Record<string, (items: FileInfo[]) => string> = {
    components: (items) => `update ${items.length} UI component${items.length > 1 ? "s" : ""} (${items.slice(0, 2).map((f) => fileName(f.path).replace(/\.[^.]+$/, "")).join(", ")})`,
    store: (items) => `update ${items.map((f) => fileName(f.path).replace(/\.[^.]+$/, "")).join(", ")} store${items.length > 1 ? "s" : ""}`,
    rust: (items) => `update backend: ${items.slice(0, 2).map((f) => fileName(f.path)).join(", ")}`,
    api: (items) => `update ${items.length} API handler${items.length > 1 ? "s" : ""}`,
    styles: () => "update styles and layout",
    config: () => "update project configuration",
    docs: () => "update documentation",
    tests: () => "update test cases",
    build: () => "update build configuration",
    types: () => "update type definitions",
  };

  if (dominant && catMessages[dominant[0]] && dominant[1].length >= files.length * 0.5) {
    return catMessages[dominant[0]](dominant[1]);
  }

  // Mixed changes
  const parts: string[] = [];
  if (newFiles.length) parts.push(`add ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}`);
  if (modFiles.length) parts.push(`update ${modFiles.length} file${modFiles.length > 1 ? "s" : ""}`);
  if (delFiles.length) parts.push(`remove ${delFiles.length} file${delFiles.length > 1 ? "s" : ""}`);
  return parts.join(", ") || "update project files";
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateCommitMessage(
  status: RepoStatus,
  diffCache?: Record<string, FileDiff>
): string {
  const files: FileInfo[] = [
    ...status.untracked.map((f) => ({
      path: f,
      status: "New" as const,
      additions: diffCache?.[f]?.additions,
      deletions: diffCache?.[f]?.deletions,
    })),
    ...status.modified.map((f) => ({
      path: f,
      status: "Modified" as const,
      additions: diffCache?.[f]?.additions,
      deletions: diffCache?.[f]?.deletions,
    })),
    ...(status.deleted ?? []).map((f) => ({
      path: f,
      status: "Deleted" as const,
    })),
    // staged files not already counted
    ...status.staged
      .filter(
        (f) =>
          !status.untracked.includes(f) &&
          !status.modified.includes(f) &&
          !(status.deleted ?? []).includes(f)
      )
      .map((f) => ({
        path: f,
        status: "Modified" as const,
        additions: diffCache?.[f]?.additions,
        deletions: diffCache?.[f]?.deletions,
      })),
  ];

  if (files.length === 0) return "chore: minor updates";

  const cats = categorize(files);
  const { type, scope } = inferType(files, cats);
  const summary = buildSummary(files, cats);

  return `${type}(${scope}): ${summary}`;
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export function getCommitSuggestions(
  status: RepoStatus,
  diffCache?: Record<string, FileDiff>
): string[] {
  const auto = generateCommitMessage(status, diffCache);

  const newCount = status.untracked.length;
  const modCount = status.modified.length;
  const delCount = (status.deleted ?? []).length;

  const suggestions = new Set<string>();
  suggestions.add(auto);

  if (newCount > 0 && modCount === 0)
    suggestions.add(`feat: add ${newCount} new file${newCount > 1 ? "s" : ""}`);
  if (modCount > 0 && newCount === 0)
    suggestions.add(`fix: update ${modCount} file${modCount > 1 ? "s" : ""}`);
  if (delCount > 0)
    suggestions.add(`refactor: remove ${delCount} unused file${delCount > 1 ? "s" : ""}`);

  suggestions.add("chore: update dependencies and configuration");
  suggestions.add("refactor: clean up and improve code structure");

  return [...suggestions].slice(0, 6);
}
