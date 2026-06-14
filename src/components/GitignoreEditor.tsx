import { useState, useEffect, useRef } from "react";
import { X, Save, Loader2, RefreshCw, Plus, Trash2, AlertCircle, FileCode2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as cmd from "@/lib/tauri-commands";

interface Props {
  projectLabel: string;
  projectPath: string;
  onClose: () => void;
}

const QUICK_ADD: { label: string; value: string }[] = [
  { label: "node_modules",  value: "node_modules/" },
  { label: ".env files",    value: ".env\n.env.local\n.env.*.local" },
  { label: "dist / build",  value: "dist/\nbuild/\nout/" },
  { label: "OS files",      value: ".DS_Store\nThumbs.db\ndesktop.ini" },
  { label: "IDE",           value: ".vscode/\n.idea/\n*.swp" },
  { label: "Logs",          value: "*.log\nlogs/" },
  { label: "Python",        value: "__pycache__/\n*.py[cod]\n.venv/" },
  { label: "Rust",          value: "target/\nCargo.lock" },
  { label: "Coverage",      value: "coverage/\n.nyc_output/" },
  { label: "Temp files",    value: "*.tmp\n*.temp\n.cache/" },
];

export default function GitignoreEditor({ projectLabel, projectPath, onClose }: Props) {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: "ok" | "warn"; msg: string } | null>(null);
  const [newEntry, setNewEntry] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const isDirty = content !== savedContent;
  const lineCount = content.split("\n").length;
  const patternCount = content.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length;

  const showFlash = (type: "ok" | "warn", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 2000);
  };

  useEffect(() => {
    setLoading(true);
    cmd.readGitignore(projectPath)
      .then((c) => { setContent(c); setSavedContent(c); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [projectPath]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await cmd.writeGitignore(projectPath, content);
      setSavedContent(content);
      showFlash("ok", "Saved successfully");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = (value: string) => {
    const existingLines = content.split("\n").map((l) => l.trim().toLowerCase());
    const newLines = value.split("\n").map((l) => l.trim()).filter(Boolean);
    const toAdd = newLines.filter((l) => !existingLines.includes(l.toLowerCase()));
    const dupes = newLines.filter((l) => existingLines.includes(l.toLowerCase()));

    if (toAdd.length === 0) {
      showFlash("warn", `Already exists: ${dupes.join(", ")}`);
      return;
    }
    if (dupes.length > 0) {
      showFlash("warn", `Skipped (exists): ${dupes.join(", ")}`);
    }

    const trimmed = content.trimEnd();
    const newContent = trimmed ? `${trimmed}\n${toAdd.join("\n")}\n` : `${toAdd.join("\n")}\n`;
    setContent(newContent);
    setError(null);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleAddEntry = () => {
    const trimmed = newEntry.trim();
    if (!trimmed) return;
    handleQuickAdd(trimmed);
    setNewEntry("");
  };

  // Sync scrolling between textarea and line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="flex flex-col w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl border border-[#30363d] bg-[#0d1117]"
        style={{ height: 620 }}
      >
        {/* ── Title bar ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] shrink-0">
          {/* Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileCode2 className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
            <span className="text-[#c9d1d9] text-sm font-medium font-mono truncate">
              .gitignore
            </span>
            <span className="text-[#8b949e] text-xs font-mono">—</span>
            <span className="text-[#8b949e] text-xs truncate">{projectLabel}</span>
            {isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#e3b341] shrink-0" title="Unsaved changes" />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8b949e]" />}
            {flash && (
              <span className={`text-xs font-mono flex items-center gap-1 ${flash.type === "ok" ? "text-[#3fb950]" : "text-[#e3b341]"}`}>
                {flash.type === "ok" && <Check className="h-3 w-3" />}
                {flash.msg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {isDirty ? "Save" : "Saved"}
            </button>

            {/* Close button (top right) */}
            <div className="w-[1px] h-4 bg-[#30363d] mx-1" />
            <button
              onClick={onClose}
              className="text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] p-1.5 rounded-md transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center flex-1 bg-[#0d1117]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8b949e]" />
                  <span className="text-xs text-[#8b949e] font-mono">Loading .gitignore...</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden">
                {/* Line numbers */}
                <div
                  ref={lineNumbersRef}
                  className="select-none text-right pr-3 pl-3 pt-4 pb-4 text-[#636e7b] bg-[#0d1117] border-r border-[#21262d] shrink-0 overflow-hidden font-mono text-xs leading-6"
                  style={{ minWidth: "3.25rem" }}
                  aria-hidden="true"
                >
                  {content.split("\n").map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setError(null); }}
                  onScroll={handleScroll}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  className="flex-1 bg-[#0d1117] text-[#adbac7] font-mono text-xs leading-6 pt-4 pb-4 pl-4 pr-4 resize-none outline-none border-none caret-[#c9d1d9] overflow-auto"
                  style={{ tabSize: 2 }}
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#3d1c1c] border-t border-[#f85149]/30 shrink-0">
                <AlertCircle className="h-3.5 w-3.5 text-[#f85149] shrink-0" />
                <p className="text-xs text-[#f85149] font-mono">{error}</p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="w-48 shrink-0 border-l border-[#30363d] flex flex-col bg-[#161b22]">
            <div className="px-3 py-2.5 border-b border-[#30363d]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8b949e]">Quick Add</p>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {QUICK_ADD.map((q) => {
                const qLines = q.value.split("\n").map((l) => l.trim()).filter(Boolean);
                const existing = content.split("\n").map((l) => l.trim().toLowerCase());
                const allExist = qLines.every((l) => existing.includes(l.toLowerCase()));
                return (
                  <button
                    key={q.label}
                    onClick={() => handleQuickAdd(q.value)}
                    disabled={allExist}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors text-left ${
                      allExist
                        ? "text-[#3fb950]/50 cursor-default"
                        : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]"
                    }`}
                  >
                    <span className="flex-1 truncate">{q.label}</span>
                    {allExist && <Check className="h-3.5 w-3.5 text-[#3fb950] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom entry */}
            <div className="p-3 border-t border-[#30363d] space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8b949e]">Custom</p>
              <div className="flex gap-1">
                <Input
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddEntry(); }}
                  placeholder="pattern"
                  className="h-7 text-xs font-mono bg-[#0d1117] border-[#30363d] text-[#c9d1d9] placeholder:text-[#636e7b] focus:border-[#388bfd]"
                />
                <button
                  onClick={handleAddEntry}
                  disabled={!newEntry.trim()}
                  className="p-1.5 rounded border border-[#30363d] bg-[#0d1117] hover:bg-[#21262d] hover:border-[#388bfd] disabled:opacity-30 transition-colors shrink-0 text-[#8b949e] hover:text-[#c9d1d9]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Utilities */}
            <div className="p-2 border-t border-[#30363d] space-y-0.5">
              <button
                onClick={() => {
                  setLoading(true);
                  cmd.readGitignore(projectPath)
                    .then((c) => { setContent(c); setSavedContent(c); })
                    .catch((e) => setError(String(e)))
                    .finally(() => setLoading(false));
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
              >
                <RefreshCw className="h-3 w-3 shrink-0" /> Reload from disk
              </button>
              <button
                onClick={() => { setContent(""); setError(null); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10 transition-colors"
              >
                <Trash2 className="h-3 w-3 shrink-0" /> Clear all
              </button>
            </div>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#388bfd] shrink-0 font-mono text-[11px] text-white">
          <div className="flex items-center gap-3">
            <span>{lineCount} lines</span>
            <span className="opacity-60">·</span>
            <span>{patternCount} patterns</span>
            <span className="opacity-60">·</span>
            <span>{new Blob([content]).size} bytes</span>
          </div>
          <span className="opacity-80 truncate ml-4">.gitignore</span>
        </div>
      </div>
    </div>
  );
}
