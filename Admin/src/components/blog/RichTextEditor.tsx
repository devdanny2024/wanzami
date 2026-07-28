import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Code2,
  Minus,
  Undo2,
  Redo2,
  Strikethrough,
  Eraser,
} from "lucide-react";

/*
  Self-contained WYSIWYG built on contentEditable. No editor dependency, which
  keeps the admin bundle small and avoids pinning the CMS to a third-party
  editor's release cycle. execCommand is formally deprecated but is still the
  only cross-browser rich-text primitive and works everywhere we ship.
*/

type Props = {
  value: string;
  onChange: (html: string) => void;
  onRequestImage?: () => Promise<string | null>;
  placeholder?: string;
};

const ToolbarButton = ({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    // Mousedown (not click) so the editor never loses its selection.
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className="flex h-8 w-8 items-center justify-center transition-colors"
    style={{
      border: "1.5px solid var(--cs-ink)",
      background: active ? "var(--cs-ink)" : "var(--cs-paper)",
      color: active ? "var(--cs-paper)" : "var(--cs-ink)",
    }}
  >
    {children}
  </button>
);

const Divider = () => (
  <span aria-hidden className="mx-1 self-stretch" style={{ width: 1, background: "var(--cs-line)" }} />
);

export function RichTextEditor({ value, onChange, onRequestImage, placeholder }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [, forceRender] = useState(0);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Only push external value in when it genuinely differs, otherwise every
  // keystroke would reset the caret to the start of the document.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
      setIsEmpty(!el.textContent?.trim());
    }
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setIsEmpty(!el.textContent?.trim() && !el.querySelector("img,hr"));
    onChange(el.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      emit();
      forceRender((n) => n + 1);
    },
    [emit]
  );

  const isActive = (command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const blockIs = (tag: string) => {
    try {
      return document.queryCommandValue("formatBlock").toLowerCase() === tag;
    } catch {
      return false;
    }
  };

  const toggleBlock = (tag: string) => exec("formatBlock", blockIs(tag) ? "p" : tag);

  const addLink = () => {
    const selection = window.getSelection()?.toString();
    const url = window.prompt(
      selection ? `Link "${selection}" to:` : "Paste the URL, then the link text will be the URL:",
      "https://"
    );
    if (!url || url === "https://") return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/") && !url.startsWith("#")) {
      window.alert("Links must start with http://, https://, / or #");
      return;
    }
    exec("createLink", url);
  };

  const insertImage = async () => {
    if (!onRequestImage) return;
    const url = await onRequestImage();
    if (url) exec("insertImage", url);
  };

  // Pasting from Word/Docs/other sites drags in a mountain of inline styles and
  // classes. Keep the words, drop the costume.
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (!html) {
      document.execCommand("insertText", false, text);
      emit();
      return;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,style,meta,link,iframe,object,embed").forEach((n) => n.remove());
    doc.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        const keep =
          (node.tagName === "A" && attr.name === "href") ||
          (node.tagName === "IMG" && (attr.name === "src" || attr.name === "alt"));
        if (!keep) node.removeAttribute(attr.name);
      });
    });
    document.execCommand("insertHTML", false, doc.body.innerHTML);
    emit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      exec("bold");
    } else if (key === "i") {
      e.preventDefault();
      exec("italic");
    } else if (key === "k") {
      e.preventDefault();
      addLink();
    }
  };

  const text = (ref.current?.textContent ?? "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.round(words / 225));

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-1 p-2"
        style={{ border: "2px solid var(--cs-ink)", borderBottom: "none", background: "var(--cs-panel)" }}
      >
        <ToolbarButton title="Heading" active={blockIs("h2")} onClick={() => toggleBlock("h2")}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Subheading" active={blockIs("h3")} onClick={() => toggleBlock("h3")}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Bold (Ctrl+B)" active={isActive("bold")} onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" active={isActive("italic")} onClick={() => exec("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={isActive("strikeThrough")} onClick={() => exec("strikeThrough")}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Bullet list" active={isActive("insertUnorderedList")} onClick={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={isActive("insertOrderedList")} onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Pull quote" active={blockIs("blockquote")} onClick={() => toggleBlock("blockquote")}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={blockIs("pre")} onClick={() => toggleBlock("pre")}>
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Insert link (Ctrl+K)" onClick={addLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        {onRequestImage ? (
          <ToolbarButton title="Insert image" onClick={() => void insertImage()}>
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
        ) : null}
        <ToolbarButton title="Divider" onClick={() => exec("insertHorizontalRule")}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Clear formatting" onClick={() => exec("removeFormat")}>
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Undo" onClick={() => exec("undo")}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => exec("redo")}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <span className="cs-mono ml-auto" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
          {words} {words === 1 ? "word" : "words"} &middot; {readTime} min read
        </span>
      </div>

      <div className="relative">
        {isEmpty && placeholder ? (
          <p
            className="pointer-events-none absolute left-5 top-5 text-base"
            style={{ color: "var(--cs-muted)", opacity: 0.7 }}
          >
            {placeholder}
          </p>
        ) : null}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Post body"
          onInput={emit}
          onBlur={emit}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onMouseUp={() => forceRender((n) => n + 1)}
          onKeyUp={() => forceRender((n) => n + 1)}
          className="cs-editor p-5 outline-none"
          style={{
            border: "2px solid var(--cs-ink)",
            background: "var(--cs-paper)",
            color: "var(--cs-ink)",
            fontSize: 16,
            lineHeight: 1.7,
            minHeight: 420,
          }}
        />
      </div>
    </div>
  );
}
