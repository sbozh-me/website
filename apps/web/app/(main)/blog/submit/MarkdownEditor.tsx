"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  MessageSquareQuote,
  Quote,
  Sparkles,
} from "lucide-react";

import { Button } from "@sbozh/react-ui/components/ui/button";

import { lineAt, link, prefixLines, voice, wrap, type Edit, type Selection } from "./markdown-edit";

interface Tool {
  readonly label: string;
  readonly icon: ReactNode;
  /** Mod+key shortcut */
  readonly key?: string;
  readonly edit: (text: string, selection: Selection) => Edit;
}

const ICON = "size-4";

const TOOLS: readonly (Tool | "|")[] = [
  { edit: (t, s) => wrap(t, s, "**", "**", "bold"), icon: <Bold className={ICON} />, key: "b", label: "Bold" },
  { edit: (t, s) => wrap(t, s, "_", "_", "italic"), icon: <Italic className={ICON} />, key: "i", label: "Italic" },
  { edit: (t, s) => wrap(t, s, "`", "`", "code"), icon: <Code className={ICON} />, label: "Inline code" },
  { edit: link, icon: <Link2 className={ICON} />, key: "k", label: "Link" },
  "|",
  { edit: (t, s) => prefixLines(t, s, "## "), icon: <Heading2 className={ICON} />, label: "Heading" },
  { edit: (t, s) => prefixLines(t, s, "> "), icon: <Quote className={ICON} />, label: "Quote" },
  { edit: (t, s) => prefixLines(t, s, "- "), icon: <List className={ICON} />, label: "List" },
  "|",
  { edit: (t, s) => wrap(t, s, "==", "|meaning==", "word"), icon: <Sparkles className={ICON} />, key: "g", label: "Glitch: ==word|meaning==" },
  { edit: (t, s) => voice(t, s), icon: <MessageSquareQuote className={ICON} />, label: "Voice block" },
];

/** "⌘" on Apple devices. Ctrl+ on the server and first paint, so hydration matches. */
function useModKey() {
  const [mod, setMod] = useState("Ctrl+");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setMod("⌘");
  }, []);
  return mod;
}

/**
 * Same font, padding and wrapping in the textarea and the mirror behind it, so each
 * number sits next to its line even when a long line wraps.
 */
const TEXT = "font-mono text-sm leading-6 whitespace-pre-wrap break-words [font-variant-ligatures:none] [tab-size:4]";
const PAD = "py-3 pl-14 pr-4";

interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly placeholder?: string;
  readonly maxLength?: number;
}

/**
 * A markdown editor on a plain textarea: line numbers, a toolbar and shortcuts.
 * Edits go through the browser's insertText, so Ctrl+Z undoes a toolbar click
 * like any typing. The textarea grows with the text instead of scrolling.
 */
export function MarkdownEditor({ value, onChange, label, placeholder, maxLength }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<Selection | null>(null);
  const [caret, setCaret] = useState({ column: 1, line: 1 });
  const MOD = useModKey();

  const lines = value.split("\n");

  const trackCaret = () => {
    const element = ref.current;
    if (!element) return;
    const offset = element.selectionStart;
    const line = lineAt(element.value, offset);
    const column = offset - element.value.lastIndexOf("\n", offset - 1);
    setCaret((previous) => (previous.line === line && previous.column === column ? previous : { column, line }));
  };

  // After a fallback edit (no insertText), put the selection back once React has the new text
  useLayoutEffect(() => {
    const selection = pending.current;
    if (!selection || !ref.current) return;
    pending.current = null;
    ref.current.setSelectionRange(selection.start, selection.end);
    trackCaret();
  }, [value]);

  const apply = (tool: Tool) => {
    const element = ref.current;
    if (!element) return;
    const edit = tool.edit(element.value, { end: element.selectionEnd, start: element.selectionStart });
    element.focus();
    element.setSelectionRange(edit.from, edit.to);
    // Keeps the edit on the browser's undo stack; jsdom and old browsers lack it
    const inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, edit.insert);
    if (inserted) {
      element.setSelectionRange(edit.select.start, edit.select.end);
      trackCaret();
    } else {
      pending.current = edit.select;
      onChange(element.value.slice(0, edit.from) + edit.insert + element.value.slice(edit.to));
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
    const tool = TOOLS.find((item): item is Tool => item !== "|" && item.key === event.key.toLowerCase());
    if (!tool) return;
    event.preventDefault();
    apply(tool);
  };

  return (
    <div className="overflow-hidden rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
      <div
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1"
        role="toolbar"
      >
        {TOOLS.map((tool, index) =>
          tool === "|" ? (
            <span key={`sep-${index}`} aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          ) : (
            <Button
              key={tool.label}
              aria-label={tool.label}
              // Keep the selection in the textarea while clicking
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => apply(tool)}
              size="icon-sm"
              title={tool.key ? `${tool.label} (${MOD}${tool.key.toUpperCase()})` : tool.label}
              type="button"
              variant="ghost"
            >
              {tool.icon}
            </Button>
          ),
        )}
      </div>

      <div className="relative">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-11 border-r border-border bg-muted/20" />
        {/* The mirror: sets the height and carries the line numbers */}
        <div aria-hidden="true" className={`${TEXT} ${PAD} pointer-events-none min-h-80 select-none`}>
          {lines.map((line, index) => (
            <div key={index} className="relative" data-testid="editor-line">
              <span
                className={`absolute -left-14 w-11 pr-2 text-right text-xs leading-6 tabular-nums ${
                  index + 1 === caret.line ? "text-foreground" : "text-muted-foreground/50"
                }`}
              >
                {index + 1}
              </span>
              <span className="invisible">{line || "​"}</span>
            </div>
          ))}
        </div>
        <textarea
          ref={ref}
          aria-label={label}
          className={`${TEXT} ${PAD} absolute inset-0 h-full w-full resize-none overflow-hidden bg-transparent text-foreground outline-none placeholder:text-muted-foreground`}
          maxLength={maxLength}
          onChange={(event) => {
            onChange(event.target.value);
            trackCaret();
          }}
          onKeyDown={onKeyDown}
          onSelect={trackCaret}
          placeholder={placeholder}
          required
          spellCheck
          value={value}
        />
      </div>

      <p className="flex justify-between border-t border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground tabular-nums">
        <span>
          Ln {caret.line}, Col {caret.column} · {lines.length} {lines.length === 1 ? "line" : "lines"}
        </span>
        <span className="hidden sm:inline">Markdown + SDS · {MOD}B {MOD}I {MOD}K {MOD}G</span>
      </p>
    </div>
  );
}
