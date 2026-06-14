import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import {
  Save, Eye, EyeOff, Bold, Italic, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Link, Image, Code, Code2, Quote,
  Minus, Table, FileText, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import * as cmd from "@/lib/tauri-commands";

// ── Configure marked ──────────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true } as Parameters<typeof marked.setOptions>[0]);

interface Props {
  projectPath: string;
  projectLabel: string;
  onClose: () => void;
}

// ── Toolbar item definition ───────────────────────────────────────────────────
interface ToolbarItem {
  icon: React.ReactNode;
  label: string;
  action: (sel: string) => { text: string; cursorOffset?: number };
  separator?: boolean;
}

const TOOLBAR: ToolbarItem[] = [
  {
    icon: <Heading1 className="h-3.5 w-3.5" />, label: "Heading 1",
    action: (s) => ({ text: `# ${s || "Heading 1"}`, cursorOffset: 2 }),
  },
  {
    icon: <Heading2 className="h-3.5 w-3.5" />, label: "Heading 2",
    action: (s) => ({ text: `## ${s || "Heading 2"}`, cursorOffset: 3 }),
  },
  {
    icon: <Heading3 className="h-3.5 w-3.5" />, label: "Heading 3",
    action: (s) => ({ text: `### ${s || "Heading 3"}`, cursorOffset: 4 }),
    separator: true,
  },
  {
    icon: <Bold className="h-3.5 w-3.5" />, label: "Bold",
    action: (s) => ({ text: `**${s || "bold text"}**`, cursorOffset: 2 }),
  },
  {
    icon: <Italic className="h-3.5 w-3.5" />, label: "Italic",
    action: (s) => ({ text: `*${s || "italic text"}*`, cursorOffset: 1 }),
  },
  {
    icon: <Strikethrough className="h-3.5 w-3.5" />, label: "Strikethrough",
    action: (s) => ({ text: `~~${s || "strikethrough"}~~`, cursorOffset: 2 }),
    separator: true,
  },
  {
    icon: <List className="h-3.5 w-3.5" />, label: "Unordered List",
    action: (s) => ({ text: `- ${s || "item"}`, cursorOffset: 2 }),
  },
  {
    icon: <ListOrdered className="h-3.5 w-3.5" />, label: "Ordered List",
    action: (s) => ({ text: `1. ${s || "item"}`, cursorOffset: 3 }),
  },
  {
    icon: <CheckSquare className="h-3.5 w-3.5" />, label: "Task List",
    action: (s) => ({ text: `- [ ] ${s || "task"}`, cursorOffset: 6 }),
    separator: true,
  },
  {
    icon: <Code className="h-3.5 w-3.5" />, label: "Inline Code",
    action: (s) => ({ text: `\`${s || "code"}\``, cursorOffset: 1 }),
  },
  {
    icon: <Code2 className="h-3.5 w-3.5" />, label: "Code Block",
    action: (s) => ({ text: `\`\`\`\n${s || "// code here"}\n\`\`\``, cursorOffset: 4 }),
    separator: true,
  },
  {
    icon: <Quote className="h-3.5 w-3.5" />, label: "Blockquote",
    action: (s) => ({ text: `> ${s || "quote"}`, cursorOffset: 2 }),
  },
  {
    icon: <Minus className="h-3.5 w-3.5" />, label: "Horizontal Rule",
    action: (_s) => ({ text: "\n---\n", cursorOffset: 5 }),
    separator: true,
  },
  {
    icon: <Link className="h-3.5 w-3.5" />, label: "Link",
    action: (s) => ({ text: `[${s || "link text"}](url)`, cursorOffset: s ? s.length + 3 : 11 }),
  },
  {
    icon: <Image className="h-3.5 w-3.5" />, label: "Image",
    action: (s) => ({ text: `![${s || "alt text"}](image-url)`, cursorOffset: s ? s.length + 4 : 13 }),
    separator: true,
  },
  {
    icon: <Table className="h-3.5 w-3.5" />, label: "Table",
    action: (_s) => ({
      text: `| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |`,
      cursorOffset: 0,
    }),
  },
  {
    icon: <FileText className="h-3.5 w-3.5" />, label: "Badge (shields.io)",
    action: (_s) => ({ text: `![badge](https://img.shields.io/badge/label-message-color)`, cursorOffset: 0 }),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReadmeEditor({ projectPath, projectLabel, onClose }: Props) {
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [preview, setPreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const isDirty = content !== original;

  // ── Load README ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    cmd.readReadme(projectPath)
      .then((text) => {
        setContent(text);
        setOriginal(text);
      })
      .catch(() => {
        setContent("");
        setOriginal("");
      })
      .finally(() => setLoading(false));
  }, [projectPath]);

  // ── Save (Ctrl+S) ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await cmd.writeReadme(projectPath, content);
      setOriginal(content);
      showToast("success", "README.md saved");
    } catch (e) {
      showToast("error", `Save failed: ${e}`);
    } finally {
      setSaving(false);
    }
  }, [content, isDirty, projectPath, showToast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // ── Toolbar insert ─────────────────────────────────────────────────────────
  const insertMarkdown = (item: ToolbarItem) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const { text, cursorOffset = 0 } = item.action(selected);

    const before = content.slice(0, start);
    const after = content.slice(end);

    // Prefix newline if not at beginning of line
    const needNewline = before.length > 0 && !before.endsWith("\n") &&
      (item.label.startsWith("Heading") || item.label === "Unordered List" ||
       item.label === "Ordered List" || item.label === "Task List" ||
       item.label === "Blockquote" || item.label === "Horizontal Rule" ||
       item.label === "Table" || item.label === "Code Block");

    const insertText = (needNewline ? "\n" : "") + text;
    const newContent = before + insertText + after;
    setContent(newContent);

    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      if (selected) {
        // Selection replaced — put cursor after inserted text
        const pos = start + insertText.length;
        ta.setSelectionRange(pos, pos);
      } else {
        // No selection — place cursor inside the syntax
        const pos = start + (needNewline ? 1 : 0) + cursorOffset;
        ta.setSelectionRange(pos, pos);
      }
    });
  };

  // ── Rendered HTML ──────────────────────────────────────────────────────────
  const renderedHtml = content
    ? (marked.parse(content) as string)
    : "<p class='text-muted-foreground italic text-sm'>Nothing to preview yet.</p>";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in">
      {/* ── Title bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{projectLabel}</span>
          <span className="text-muted-foreground text-xs">/ README.md</span>
          {isDirty && <span className="text-github-orange text-xs font-medium">● unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={() => setPreview((p) => !p)}
            className="gap-1.5"
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            size="sm" variant="success"
            loading={saving}
            disabled={!isDirty}
            onClick={handleSave}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b overflow-x-auto shrink-0 bg-secondary/30">
        {TOOLBAR.map((item, i) => (
          <div key={i} className="flex items-center">
            {item.separator && <div className="w-px h-5 bg-border mx-1" />}
            <button
              title={item.label}
              onClick={() => insertMarkdown(item)}
              className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {item.icon}
            </button>
          </div>
        ))}
      </div>

      {/* ── Panes ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className={`flex-1 flex overflow-hidden ${preview ? "divide-x" : ""}`}>
          {/* Editor pane */}
          <div className={`flex flex-col ${preview ? "w-1/2" : "w-full"}`}>
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/20 border-b">
              Editor
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="flex-1 resize-none p-4 font-mono text-sm bg-background text-foreground outline-none leading-relaxed"
              placeholder="# My Project&#10;&#10;Write your README here..."
            />
          </div>

          {/* Preview pane */}
          {preview && (
            <div className="w-1/2 flex flex-col overflow-hidden">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/20 border-b">
                Preview
              </div>
              <div
                className="flex-1 overflow-y-auto p-6 prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="flex items-center gap-4 px-4 py-1 border-t text-[11px] text-muted-foreground bg-secondary/20 shrink-0">
        <span>{content.split("\n").length} lines</span>
        <span>{content.length} chars</span>
        <span className="ml-auto">Ctrl+S to save</span>
      </div>
    </div>
  );
}
