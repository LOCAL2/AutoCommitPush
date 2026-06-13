import type { RepoStatus } from "@/types";

// ─── File category detection ──────────────────────────────────────────────────

interface FileInfo {
  path: string;
  status: "New" | "Modified" | "Deleted";
}

function categorize(files: FileInfo[]) {
  const cats = {
    config: [] as string[],
    docs: [] as string[],
    tests: [] as string[],
    styles: [] as string[],
    types: [] as string[],
    components: [] as string[],
    api: [] as string[],
    assets: [] as string[],
    build: [] as string[],
    source: [] as string[],
  };

  for (const f of files) {
    const p = f.path.toLowerCase().replace(/\\/g, "/");
    const name = p.split("/").pop() ?? p;
    const ext = name.split(".").pop() ?? "";

    if (
      name.includes("package.json") || name.includes("cargo.toml") ||
      name.includes(".env") || name.endsWith(".config.ts") ||
      name.endsWith(".config.js") || name.includes("tsconfig") ||
      name.includes("tailwind") || name.includes("vite.config") ||
      name.includes(".eslintrc") || name.includes(".prettierrc")
    ) { cats.config.push(name); continue; }

    if (
      ext === "md" || ext === "txt" || ext === "rst" ||
      name.includes("readme") || name.includes("changelog") ||
      name.includes("license")
    ) { cats.docs.push(name); continue; }

    if (
      p.includes("/test") || p.includes("/tests") || p.includes("/spec") ||
      p.includes("__tests__") || name.endsWith(".test.ts") ||
      name.endsWith(".test.tsx") || name.endsWith(".spec.ts")
    ) { cats.tests.push(name); continue; }

    if (ext === "css" || ext === "scss" || ext === "sass" || ext === "less") {
      cats.styles.push(name); continue;
    }

    if (
      p.includes("/types") || p.includes("/interfaces") ||
      name.endsWith(".d.ts") || name === "types.ts" || name === "index.ts"
    ) { cats.types.push(name); continue; }

    if (
      p.includes("/components") || p.includes("/pages") ||
      p.includes("/views") || p.includes("/ui") ||
      ext === "tsx" || ext === "jsx" || ext === "vue" || ext === "svelte"
    ) { cats.components.push(name); continue; }

    if (
      p.includes("/api") || p.includes("/routes") || p.includes("/handlers") ||
      p.includes("/services") || p.includes("/controllers")
    ) { cats.api.push(name); continue; }

    if (
      ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "svg" ||
      ext === "ico" || ext === "gif" || ext === "webp" ||
      p.includes("/assets") || p.includes("/public") || p.includes("/static")
    ) { cats.assets.push(name); continue; }

    if (
      p.includes("/dist") || p.includes("/build") || p.includes("/target") ||
      name.includes("dockerfile") || name.includes("docker-compose") ||
      name.includes(".github") || name.includes("ci") || name.includes("cd")
    ) { cats.build.push(name); continue; }

    cats.source.push(name);
  }

  return cats;
}

// ─── Commit type heuristics ───────────────────────────────────────────────────

function inferType(
  files: FileInfo[],
  cats: ReturnType<typeof categorize>
): { type: string; scope: string } {
  const hasNew = files.some((f) => f.status === "New");
  const hasMod = files.some((f) => f.status === "Modified");
  const hasDel = files.some((f) => f.status === "Deleted");

  // Determine scope from dominant category
  const counts = Object.entries(cats)
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
    api: "api",
    assets: "assets",
    build: "build",
    source: "core",
  };
  const scope = scopeMap[topCat] ?? "app";

  // Determine conventional commit type
  let type = "chore";
  if (cats.tests.length > 0 && cats.tests.length === files.length) type = "test";
  else if (cats.docs.length > 0 && cats.docs.length === files.length) type = "docs";
  else if (cats.styles.length > 0 && cats.styles.length === files.length) type = "style";
  else if (cats.config.length > 0 && cats.config.length === files.length) type = "chore";
  else if (cats.build.length > 0 && cats.build.length === files.length) type = "build";
  else if (hasNew && !hasMod && !hasDel) type = "feat";
  else if (hasDel && !hasNew) type = "refactor";
  else if (hasMod) type = "fix";
  else if (hasNew) type = "feat";

  return { type, scope };
}

// ─── Summary builder ──────────────────────────────────────────────────────────

function buildSummary(
  files: FileInfo[],
  cats: ReturnType<typeof categorize>
): string {
  const newCount = files.filter((f) => f.status === "New").length;
  const modCount = files.filter((f) => f.status === "Modified").length;
  const delCount = files.filter((f) => f.status === "Deleted").length;

  const parts: string[] = [];
  if (newCount > 0) parts.push(`add ${newCount} file${newCount > 1 ? "s" : ""}`);
  if (modCount > 0) parts.push(`update ${modCount} file${modCount > 1 ? "s" : ""}`);
  if (delCount > 0) parts.push(`remove ${delCount} file${delCount > 1 ? "s" : ""}`);

  // Mention specific notable files (max 2)
  const notable = files
    .slice(0, 2)
    .map((f) => {
      const name = f.path.replace(/\\/g, "/").split("/").pop() ?? f.path;
      return name.replace(/\.[^.]+$/, ""); // strip extension
    })
    .join(", ");

  if (notable && files.length <= 3) {
    return parts.join(", ") + ` (${notable})`;
  }

  // Category-specific summaries
  if (cats.components.length > 0 && cats.components.length >= files.length * 0.6) {
    return `update ${cats.components.length} component${cats.components.length > 1 ? "s" : ""}`;
  }
  if (cats.api.length > 0) {
    return `update API handlers (${cats.api.slice(0, 2).join(", ")})`;
  }
  if (cats.styles.length > 0) {
    return "update styles and layout";
  }
  if (cats.config.length > 0) {
    return "update project configuration";
  }
  if (cats.docs.length > 0) {
    return "update documentation";
  }
  if (cats.tests.length > 0) {
    return "update test cases";
  }

  return parts.join(", ") || "update project files";
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateCommitMessage(status: RepoStatus): string {
  const files: FileInfo[] = [
    ...status.untracked.map((f) => ({ path: f, status: "New" as const })),
    ...status.modified.map((f) => ({ path: f, status: "Modified" as const })),
    ...status.staged
      .filter((f) => !status.untracked.includes(f) && !status.modified.includes(f))
      .map((f) => ({ path: f, status: "Modified" as const })),
  ];

  if (files.length === 0) return "chore: minor updates";

  const cats = categorize(files);
  const { type, scope } = inferType(files, cats);
  const summary = buildSummary(files, cats);

  // Conventional commits format: type(scope): summary
  return `${type}(${scope}): ${summary}`;
}

// ─── Quick template suggestions ───────────────────────────────────────────────

export function getCommitSuggestions(status: RepoStatus): string[] {
  const auto = generateCommitMessage(status);
  const ts = new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const suggestions = [
    auto,
    `fix: resolve issues and update files`,
    `feat: implement new functionality`,
    `refactor: clean up and improve code structure`,
    `chore: update dependencies and configuration`,
    `Update project - ${ts}`,
  ];

  // Deduplicate
  return [...new Set(suggestions)];
}
