import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/authClient";
import { CsBox, CsButton, CsEmpty, CsPageHeader, CsSlug, CsStat } from "./cs/kit";
import { DiscoverFields } from "./DiscoverFields";
import {
  COLLECTION_OPTIONS,
  GENRE_OPTIONS,
  LANGUAGE_OPTIONS,
  collectionsOf,
  coverage,
  genreSlugsOf,
  labelOf,
  languagesOf,
  type Option,
} from "@/lib/discover";

type AdminTitle = {
  id: string | number;
  name: string;
  type: "MOVIE" | "SERIES";
  archived?: boolean;
  pendingReview?: boolean;
  genres?: string[];
  language?: string | null;
  languages?: string[];
  collections?: string[];
};

function DoorList({ heading, options, counts, note }: { heading: string; options: Option[]; counts: Record<string, number>; note: string }) {
  const live = options.filter((o) => (counts[o.slug] ?? 0) > 0).length;
  return (
    <CsBox className="p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="cs-display" style={{ fontSize: 22, color: "var(--cs-ink)" }}>{heading}</h3>
        <CsSlug>{live} of {options.length} live</CsSlug>
      </div>
      <p className="cs-mono mt-1 mb-3" style={{ fontSize: 10, color: "var(--cs-muted)" }}>{note}</p>
      <ul>
        {options.map((o) => {
          const n = counts[o.slug] ?? 0;
          return (
            <li key={o.slug} className="flex items-center justify-between py-1.5" style={{ borderTop: "1px solid var(--cs-line, #d9cfba)" }}>
              <span className="text-sm" style={{ color: "var(--cs-ink)" }}>{o.label}</span>
              <span className="flex items-center gap-3">
                <span className="cs-mono text-xs font-bold" style={{ color: "var(--cs-ink)" }}>{n} {n === 1 ? "film" : "films"}</span>
                <span
                  className="cs-mono text-[10px] font-bold uppercase"
                  style={{
                    padding: "2px 8px",
                    border: "1.5px solid " + (n > 0 ? "var(--cs-ink)" : "var(--cs-muted)"),
                    background: n > 0 ? "var(--cs-ink)" : "transparent",
                    color: n > 0 ? "#fff" : "var(--cs-muted)",
                  }}
                >
                  {n > 0 ? "Live" : "Hidden"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </CsBox>
  );
}

function TitleRow({ title, token, onSaved }: { title: AdminTitle; token: string | null; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [languages, setLanguages] = useState<string[]>(title.languages?.length ? title.languages : languagesOf(title));
  const [collections, setCollections] = useState<string[]>(collectionsOf(title));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/admin/titles/${title.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ languages, collections }),
      });
      if (!res.ok) {
        toast.error((res.data as any)?.message || `Could not save (${res.status})`);
        return;
      }
      toast.success(`Saved ${title.name}`);
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Could not save (network error)");
    } finally {
      setSaving(false);
    }
  };

  const langs = languagesOf(title);
  const cols = collectionsOf(title);
  const gens = genreSlugsOf(title);
  const chip = (text: string, key: string) => (
    <span key={key} className="cs-mono cs-border-thin font-bold uppercase" style={{ fontSize: 10, padding: "1px 7px" }}>{text}</span>
  );

  return (
    <li className="py-3" style={{ borderTop: "1px solid var(--cs-line, #d9cfba)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium" style={{ color: "var(--cs-ink)" }}>
            {title.name} <span className="cs-mono text-[10px] font-bold uppercase" style={{ color: "var(--cs-muted)" }}>{title.type}</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {langs.length ? langs.map((l) => chip(labelOf(LANGUAGE_OPTIONS, l), `l-${l}`)) : chip("No language", "nl")}
            {gens.map((g) => chip(labelOf(GENRE_OPTIONS, g), `g-${g}`))}
            {cols.map((c) => chip(labelOf(COLLECTION_OPTIONS, c), `c-${c}`))}
          </div>
        </div>
        <CsButton variant="outline" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Tag"}</CsButton>
      </div>
      {open ? (
        <div className="mt-4 cs-border p-4" style={{ background: "var(--cs-panel)" }}>
          <DiscoverFields
            languages={languages}
            collections={collections}
            genres={title.genres}
            onLanguages={setLanguages}
            onCollections={setCollections}
          />
          <div className="mt-4 flex gap-3">
            <CsButton variant="rust" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save tags"}</CsButton>
            <CsButton variant="outline" onClick={() => setOpen(false)}>Cancel</CsButton>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function DiscoverCoverage() {
  const [titles, setTitles] = useState<AdminTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "needs">("needs");
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/admin/titles", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        toast.error((res.data as any)?.message || `Failed to load titles (${res.status})`);
        setTitles([]);
        return;
      }
      setTitles(((res.data as any)?.titles ?? []) as AdminTitle[]);
    } catch {
      toast.error("Failed to load titles (network error)");
      setTitles([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const live = useMemo(() => titles.filter((t) => !t.archived && !t.pendingReview), [titles]);
  const cov = useMemo(() => coverage(live), [live]);
  const needsTagging = useMemo(
    () => live.filter((t) => !languagesOf(t).length || !genreSlugsOf(t).length),
    [live],
  );
  const shown = filter === "needs" ? needsTagging : live;
  const liveDoors = (o: Option[], c: Record<string, number>) => o.filter((x) => (c[x.slug] ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <CsPageHeader
        title="Discover"
        slug="Language / Genre / Collections"
        chip={`${live.length} live titles`}
      />

      <p className="text-sm max-w-3xl" style={{ color: "var(--cs-muted)" }}>
        These are the doors viewers see on the website's Discover page. A door only appears once at least one live title
        is tagged for it, so tag titles below to open new shelves. Languages and collections are saved per title; genres
        come from the title's genre field and are matched to the 15 Discover genres automatically.
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CsStat label="Live titles" value={String(live.length)} />
        <CsStat label="Language doors live" value={`${liveDoors(LANGUAGE_OPTIONS, cov.language)} / ${LANGUAGE_OPTIONS.length}`} />
        <CsStat label="Genre doors live" value={`${liveDoors(GENRE_OPTIONS, cov.genre)} / ${GENRE_OPTIONS.length}`} />
        <CsStat label="Collections live" value={`${liveDoors(COLLECTION_OPTIONS, cov.collection)} / ${COLLECTION_OPTIONS.length}`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <DoorList heading="Language" options={LANGUAGE_OPTIONS} counts={cov.language} note="Set per title (several allowed)." />
        <DoorList heading="Genre" options={GENRE_OPTIONS} counts={cov.genre} note="From each title's genres." />
        <DoorList heading="Collections" options={COLLECTION_OPTIONS} counts={cov.collection} note="Editorial shelves, set per title." />
      </div>

      <CsBox className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="cs-display" style={{ fontSize: 22, color: "var(--cs-ink)" }}>Tag titles</h3>
          <div className="flex gap-2">
            <CsButton variant={filter === "needs" ? "ink" : "outline"} onClick={() => setFilter("needs")}>
              Needs tagging ({needsTagging.length})
            </CsButton>
            <CsButton variant={filter === "all" ? "ink" : "outline"} onClick={() => setFilter("all")}>
              All titles ({live.length})
            </CsButton>
          </div>
        </div>
        {loading ? (
          <CsSlug>Loading the slate...</CsSlug>
        ) : shown.length ? (
          <ul>
            {shown.map((t) => (
              <TitleRow key={String(t.id)} title={t} token={token} onSaved={load} />
            ))}
          </ul>
        ) : (
          <CsEmpty slug="All tagged" body="Every live title has a language and a Discover genre." />
        )}
      </CsBox>
    </div>
  );
}
