import { CsSlug } from "./cs/kit";
import {
  COLLECTION_OPTIONS,
  INDIGENOUS_OPTIONS,
  LANGUAGE_OPTIONS,
  genreSlugsOf,
  GENRE_OPTIONS,
  labelOf,
  type Option,
} from "@/lib/discover";

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "5px 12px",
  border: "1.5px solid var(--cs-ink)",
  background: active ? "var(--cs-ink)" : "var(--cs-paper)",
  color: active ? "#fff" : "var(--cs-ink)",
});

function Chips({
  options,
  value,
  onToggle,
}: {
  options: Option[];
  value: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.slug);
        return (
          <button
            type="button"
            key={o.slug}
            title={o.blurb}
            aria-pressed={active}
            onClick={() => onToggle(o.slug)}
            className="cs-mono text-xs font-bold uppercase"
            style={chipStyle(active)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Discover tagging: spoken languages and editorial collections (a title can have several of each). */
export function DiscoverFields({
  languages,
  collections,
  genres,
  onLanguages,
  onCollections,
}: {
  languages: string[];
  collections: string[];
  genres?: string[];
  onLanguages: (next: string[]) => void;
  onCollections: (next: string[]) => void;
}) {
  const toggle = (list: string[], slug: string) => (list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug]);

  const toggleLanguage = (slug: string) => {
    let next = toggle(languages, slug);
    // Naming an indigenous language also files the title under "Indigenous".
    if (INDIGENOUS_OPTIONS.some((o) => o.slug === slug) && next.includes(slug) && !next.includes("indigenous")) {
      next = [...next, "indigenous"];
    }
    // Dropping "Indigenous" drops the named languages with it.
    if (slug === "indigenous" && !next.includes("indigenous")) {
      next = next.filter((l) => !INDIGENOUS_OPTIONS.some((o) => o.slug === l));
    }
    onLanguages(next);
  };

  const discoverGenres = genreSlugsOf({ genres });

  return (
    <div className="space-y-4">
      <div>
        <CsSlug className="mb-1">Spoken languages (Discover)</CsSlug>
        <Chips options={LANGUAGE_OPTIONS} value={languages} onToggle={toggleLanguage} />
        {languages.includes("indigenous") ? (
          <div className="mt-3">
            <CsSlug className="mb-1" size={9}>Indigenous: name each language</CsSlug>
            <Chips options={INDIGENOUS_OPTIONS} value={languages} onToggle={toggleLanguage} />
          </div>
        ) : null}
        <p className="cs-mono mt-2" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
          A title can have more than one spoken language. Leave empty if unsure; nothing is guessed.
        </p>
      </div>

      <div>
        <CsSlug className="mb-1">Collections (editorial shelves)</CsSlug>
        <Chips options={COLLECTION_OPTIONS} value={collections} onToggle={(s) => onCollections(toggle(collections, s))} />
        <p className="cs-mono mt-2" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
          A film can sit on several shelves. Empty shelves stay hidden on the website.
        </p>
      </div>

      {genres ? (
        <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
          Genres file this title under:{" "}
          {discoverGenres.length ? discoverGenres.map((g) => labelOf(GENRE_OPTIONS, g)).join(", ") : "no Discover genre yet"}
        </p>
      ) : null}
    </div>
  );
}
