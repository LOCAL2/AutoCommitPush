import { useState, useRef, useEffect, useCallback } from "react";
import { X, Terminal } from "lucide-react";
import * as cmd from "@/lib/tauri-commands";

interface Props {
  projectLabel: string;
  projectPath: string;
  onClose: () => void;
}

interface HistoryEntry {
  type: "input" | "output" | "error" | "info";
  text: string;
  cwd?: string;
}

export default function TerminalDialog({ projectLabel, projectPath, onClose }: Props) {
  const [cwd, setCwd] = useState(projectPath);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      type: "info",
      text: `AutoCommitPush Terminal  [${projectLabel}]\n(c) AutoCommitPush. All rights reserved.\n`,
    },
  ]);
  const [running, setRunning] = useState(false);

  // Command history (↑↓)
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);

  // Tab autocomplete state
  const [tabMatches, setTabMatches] = useState<string[]>([]);
  const [tabIdx, setTabIdx] = useState(-1);
  const [tabPrefix, setTabPrefix] = useState(""); // the part before the last token

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const pushHistory = (entries: HistoryEntry[]) => {
    setHistory((h) => [...h, ...entries]);
  };

  // ─── Resolve a path relative to cwd ──────────────────────────────────────
  const resolvePath = (base: string, arg: string): string => {
    if (/^[A-Za-z]:\\/.test(arg)) return arg; // absolute
    if (arg === "\\") return base.slice(0, 3);  // e.g. C:\ 
    const parts = base.replace(/\\/g, "/").split("/").filter(Boolean);
    for (const seg of arg.replace(/\\/g, "/").split("/").filter(Boolean)) {
      if (seg === "..") parts.pop();
      else if (seg !== ".") parts.push(seg);
    }
    return parts.length <= 1 ? parts.join("\\") + "\\" : parts.join("\\");
  };

  // ─── Check if a path is inside projectPath (or equal) ────────────────────
  const isInsideProject = (path: string): boolean => {
    const norm = (p: string) => p.replace(/\\/g, "\\").toLowerCase().replace(/\\+$/, "");
    return norm(path).startsWith(norm(projectPath));
  };

  // ─── Tab completion ───────────────────────────────────────────────────────
  const handleTab = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();

      // If we already have matches loaded, cycle through them
      if (tabMatches.length > 0) {
        const next = (tabIdx + 1) % tabMatches.length;
        setTabIdx(next);
        setInput(tabPrefix + tabMatches[next]);
        return;
      }

      // ── Build completion for current input ──
      const raw = input;

      // Only complete if input starts with cd (or is a bare path)
      const cdMatch = raw.match(/^(cd\s+)(.*)$/i);
      const prefix = cdMatch ? cdMatch[1] : "";
      const partial = cdMatch ? cdMatch[2] : raw;

      // Split partial into directory + last fragment
      const lastSep = Math.max(partial.lastIndexOf("\\"), partial.lastIndexOf("/"));
      const dirPart = lastSep >= 0 ? partial.slice(0, lastSep + 1) : "";
      const fragment = lastSep >= 0 ? partial.slice(lastSep + 1) : partial;

      // Resolve the directory to list
      const listDir = dirPart
        ? resolvePath(cwd, dirPart)
        : cwd;

      try {
        const entries = await cmd.listDirectories(listDir);
        const matches = entries
          .map((e) => e.name)
          .filter((n) => n.toLowerCase().startsWith(fragment.toLowerCase()));

        if (matches.length === 0) return;

        const fullPrefix = prefix + dirPart;
        setTabPrefix(fullPrefix);
        setTabMatches(matches);
        setTabIdx(0);
        setInput(fullPrefix + matches[0]);
      } catch {
        // ignore — directory might not exist yet
      }
    },
    [input, tabMatches, tabIdx, tabPrefix, cwd]
  );

  // Reset tab state when user types normally
  const handleInputChange = (val: string) => {
    setInput(val);
    setTabMatches([]);
    setTabIdx(-1);
    setTabPrefix("");
  };

  // ─── Run a command ────────────────────────────────────────────────────────
  const runCommand = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();

      // Reset tab state
      setTabMatches([]);
      setTabIdx(-1);
      setTabPrefix("");

      if (!trimmed) return;

      setCmdHistory((h) => [trimmed, ...h]);
      setCmdHistoryIdx(-1);

      pushHistory([{ type: "input", text: trimmed, cwd }]);

      // exit
      if (trimmed.toLowerCase() === "exit") {
        onClose();
        return;
      }

      // cd — built-in with sandbox guard
      if (/^cd(\s|$)/i.test(trimmed)) {
        const arg = trimmed.slice(2).trim();

        if (!arg) {
          pushHistory([{ type: "output", text: cwd }]);
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }

        const newPath = resolvePath(cwd, arg);

        // ── BLOCK navigation outside project root ──
        if (!isInsideProject(newPath)) {
          pushHistory([{
            type: "error",
            text: "Access denied: cannot navigate outside the project directory.",
          }]);
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }

        const exists = await cmd.pathExists(newPath).catch(() => false);
        if (exists) {
          setCwd(newPath);
        } else {
          pushHistory([{ type: "error", text: "The system cannot find the path specified." }]);
        }
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }

      // All other commands
      setRunning(true);
      try {
        const result = await cmd.runTerminalCommand(cwd, trimmed);
        const entries: HistoryEntry[] = [];
        if (result.stdout) entries.push({ type: "output", text: result.stdout });
        if (result.stderr) entries.push({ type: "error", text: result.stderr });
        if (entries.length === 0 && result.exit_code !== 0) {
          entries.push({ type: "error", text: `Command exited with code ${result.exit_code}` });
        }
        pushHistory(entries);
      } catch (e) {
        pushHistory([{ type: "error", text: String(e) }]);
      } finally {
        setRunning(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cwd, onClose, projectPath]
  );

  // ─── Key handler ──────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      handleTab(e);
      return;
    }
    if (e.key === "Enter") {
      const val = input;
      setInput("");
      runCommand(val);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(cmdHistoryIdx + 1, cmdHistory.length - 1);
      setCmdHistoryIdx(newIdx);
      setInput(cmdHistory[newIdx] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = cmdHistoryIdx - 1;
      if (newIdx < 0) { setCmdHistoryIdx(-1); setInput(""); }
      else { setCmdHistoryIdx(newIdx); setInput(cmdHistory[newIdx] ?? ""); }
    }
  };

  const prompt = `${cwd}>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="flex flex-col rounded-lg overflow-hidden shadow-2xl border border-border"
        style={{ width: 740, height: 480 }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-secondary border-b shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium font-mono">{projectLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              data-close-btn="true"
              className="p-1 rounded hover:bg-destructive/80 hover:text-white transition-colors text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Output area */}
        <div
          className="flex-1 overflow-y-auto bg-[#0C0C0C] px-3 py-2 font-mono text-sm text-[#CCCCCC] cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((entry, i) => (
            <div key={i} className="leading-5">
              {entry.type === "input" ? (
                <div>
                  <span className="text-[#CCCCCC]">{entry.cwd}&gt;</span>
                  <span className="text-white"> {entry.text}</span>
                </div>
              ) : entry.type === "error" ? (
                <pre className="whitespace-pre-wrap text-[#FF6B6B] break-all">{entry.text}</pre>
              ) : entry.type === "info" ? (
                <pre className="whitespace-pre-wrap text-[#888888] break-all">{entry.text}</pre>
              ) : (
                <pre className="whitespace-pre-wrap text-[#CCCCCC] break-all">{entry.text}</pre>
              )}
            </div>
          ))}

          {/* Tab suggestion hint */}
          {tabMatches.length > 1 && (
            <div className="text-[#555555] text-xs pb-0.5 select-none">
              [{tabIdx + 1}/{tabMatches.length}] Tab to cycle · {tabMatches.slice(0, 6).join("  ")}{tabMatches.length > 6 ? "  …" : ""}
            </div>
          )}

          {/* Live input line */}
          <div className="flex items-center mt-0.5">
            <span className="text-[#CCCCCC] shrink-0">{prompt}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={(e) => {
                const related = e.relatedTarget as HTMLElement | null;
                if (related?.dataset?.closeBtn) return;
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              disabled={running}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              tabIndex={0}
              className={`flex-1 bg-transparent text-white outline-none border-none caret-white ml-1 font-mono text-sm ${
                running ? "opacity-50" : ""
              }`}
            />
          </div>

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
