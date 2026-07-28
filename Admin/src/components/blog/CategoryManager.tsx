import { useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { CsButton, CsSlug } from "../cs/kit";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type BlogCategory,
} from "@/lib/blogClient";

const field: React.CSSProperties = {
  border: "2px solid var(--cs-ink)",
  background: "var(--cs-paper)",
  color: "var(--cs-ink)",
  fontFamily: "var(--font-smono), monospace",
  fontSize: 12,
  padding: "9px 12px",
  width: "100%",
};

const SWATCHES = ["#fd7e14", "#d1490f", "#161310", "#2f6f4e", "#2b5f8a", "#7a3a8a"];

export function CategoryManager({
  categories,
  onClose,
  onChanged,
}: {
  categories: BlogCategory[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(22,19,16,0.75)" }} onClick={onClose}>
      <div className="p-5">
        <div
          className="mx-auto max-w-sm"
          style={{ background: "var(--cs-paper)", border: "3px solid var(--cs-ink)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between p-3"
            style={{ borderBottom: "2px solid var(--cs-ink)", background: "var(--cs-panel)" }}
          >
            <CsSlug>Blog categories</CsSlug>
            <button type="button" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {error ? (
              <p className="cs-mono mb-3" style={{ fontSize: 10, color: "var(--cs-rust)" }}>
                {error}
              </p>
            ) : null}

            <div className="space-y-2 mb-4">
              {categories.length === 0 ? (
                <p className="cs-mono" style={{ fontSize: 11, color: "var(--cs-muted)" }}>
                  No categories yet. Add the first one below.
                </p>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 p-2"
                    style={{ border: "1.5px solid var(--cs-line)" }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 12,
                        height: 12,
                        flex: "none",
                        background: c.color ?? "var(--cs-muted)",
                        border: "1.5px solid var(--cs-ink)",
                      }}
                    />
                    <input
                      defaultValue={c.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== c.name) void run(() => updateCategory(c.id, { name: v }));
                      }}
                      className="flex-1 min-w-0"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--cs-ink)",
                        fontFamily: "var(--font-smono), monospace",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                    <span className="cs-mono" style={{ fontSize: 9, color: "var(--cs-muted)" }}>
                      {c.postCount ?? 0}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const n = c.postCount ?? 0;
                        const warning = n
                          ? `Delete "${c.name}"? ${n} post${n === 1 ? "" : "s"} will become uncategorised.`
                          : `Delete "${c.name}"?`;
                        if (window.confirm(warning)) void run(() => deleteCategory(c.id));
                      }}
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--cs-rust)" }} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: "2px dashed var(--cs-line)", paddingTop: 14 }}>
              <CsSlug>Add a category</CsSlug>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) {
                    void run(async () => {
                      await createCategory({ name: name.trim(), color });
                      setName("");
                    });
                  }
                }}
                placeholder="Category name"
                style={{ ...field, marginTop: 8 }}
              />
              <div className="flex items-center gap-2 mt-2">
                {SWATCHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setColor(s)}
                    aria-label={`Colour ${s}`}
                    style={{
                      width: 22,
                      height: 22,
                      background: s,
                      border: color === s ? "2.5px solid var(--cs-ink)" : "1.5px solid var(--cs-line)",
                    }}
                  />
                ))}
              </div>
              <CsButton
                variant="ink"
                className="w-full mt-3"
                disabled={busy || !name.trim()}
                onClick={() =>
                  void run(async () => {
                    await createCategory({ name: name.trim(), color });
                    setName("");
                  })
                }
              >
                <span className="flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} Add category
                </span>
              </CsButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
