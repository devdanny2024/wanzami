/* Discover: Language / Genre / Collections.
   Source of truth for the category system proposed in "Wanzami Category Artwork
   / Cinematic Edition 02" (14 Oct 2026).

   - Three separate doors (language, genre, collection) so each choice has a
     clear meaning.
   - Matching rule: across groups AND, within a group OR.
     (Yoruba OR Hausa) AND Thriller.
   - Nothing here needs a backend change. It reads the existing `genres[]` and
     `language` fields, and also picks up `languages[]` / `collections[]` as soon
     as the API returns them (a title may have several spoken languages and may
     sit on several editorial shelves).
   - Empty doors are hidden from promoted surfaces (counts drive this). */

export type DiscoverKind = "language" | "genre" | "collection";

export interface Facet {
  slug: string;
  label: string;
  /** One-line description used under the tile (from the approved copy). */
  blurb: string;
  /** Lower-case strings that map a raw backend value onto this facet. */
  aliases: string[];
}

/* ------------------------------------------------------------------ */
/* Taxonomy                                                            */
/* ------------------------------------------------------------------ */

export const LANGUAGES: Facet[] = [
  { slug: "english", label: "English", blurb: "English-language Nigerian films.", aliases: ["en", "eng", "english"] },
  { slug: "yoruba", label: "Yoruba", blurb: "Yoruba-language films across every genre.", aliases: ["yo", "yor", "yoruba"] },
  { slug: "igbo", label: "Igbo", blurb: "Igbo-language films and cultural stories.", aliases: ["ig", "ibo", "igbo"] },
  { slug: "hausa", label: "Hausa", blurb: "Hausa-language films across every genre.", aliases: ["ha", "hau", "hausa"] },
  { slug: "pidgin", label: "Pidgin", blurb: "Nigerian Pidgin-language films.", aliases: ["pcm", "pidgin", "nigerian pidgin", "naija"] },
  { slug: "indigenous", label: "Indigenous", blurb: "Other Nigerian languages; show each language by name.", aliases: ["indigenous"] },
];

/** "Indigenous" opens a sub-list. Each language is shown by name. */
export const INDIGENOUS_LANGUAGES: Facet[] = [
  { slug: "efik", label: "Efik", blurb: "Efik-language films.", aliases: ["efi", "efik"] },
  { slug: "ibibio", label: "Ibibio", blurb: "Ibibio-language films.", aliases: ["ibb", "ibibio"] },
  { slug: "tiv", label: "Tiv", blurb: "Tiv-language films.", aliases: ["tiv"] },
  { slug: "edo", label: "Edo", blurb: "Edo-language films.", aliases: ["bin", "edo"] },
  { slug: "idoma", label: "Idoma", blurb: "Idoma-language films.", aliases: ["idu", "idoma"] },
];

export const GENRES: Facet[] = [
  { slug: "drama", label: "Drama", blurb: "Stories carried by people and what they risk.", aliases: ["drama"] },
  { slug: "comedy", label: "Comedy", blurb: "Laughter, timing and family chaos.", aliases: ["comedy", "comedies"] },
  { slug: "romance", label: "Romance & Relationships", blurb: "Love, marriage, heartbreak and everything between.", aliases: ["romance", "romantic", "relationships", "romance & relationships", "romance and relationships"] },
  { slug: "thriller", label: "Thriller & Suspense", blurb: "Tension that keeps you in your seat.", aliases: ["thriller", "suspense", "mystery", "thriller & suspense", "thriller and suspense"] },
  { slug: "crime", label: "Crime & Investigation", blurb: "Cases, detectives and the people they chase.", aliases: ["crime", "investigation", "detective", "crime & investigation", "crime and investigation"] },
  { slug: "action", label: "Action & Adventure", blurb: "Big stakes, big movement.", aliases: ["action", "adventure", "action & adventure", "action and adventure"] },
  { slug: "horror", label: "Horror & Supernatural", blurb: "The dark, the unseen and what follows you home.", aliases: ["horror", "supernatural", "horror & supernatural", "horror and supernatural"] },
  { slug: "epic", label: "Epic & Historical", blurb: "Kingdoms, eras and the weight of history.", aliases: ["epic", "historical", "history", "period", "epic & historical", "epic and historical"] },
  { slug: "family", label: "Family Movies", blurb: "Films for the whole room.", aliases: ["family", "family movies"] },
  { slug: "political", label: "Political & Corporate Drama", blurb: "Power, boardrooms and betrayal.", aliases: ["political", "politics", "corporate", "political & corporate drama", "political and corporate drama"] },
  { slug: "faith", label: "Faith-Based", blurb: "Stories of belief, doubt and grace.", aliases: ["faith", "faith-based", "faith based", "religious", "gospel", "christian"] },
  { slug: "documentary", label: "Documentaries & True Stories", blurb: "Real people, real events.", aliases: ["documentary", "documentaries", "true stories", "true story", "biography", "documentaries & true stories"] },
  { slug: "youth", label: "Youth & Campus", blurb: "Growing up, loud and unfiltered.", aliases: ["youth", "campus", "teen", "coming-of-age", "youth & campus", "youth and campus"] },
  { slug: "animation", label: "Animation & Children", blurb: "Animated worlds for younger viewers.", aliases: ["animation", "animated", "children", "kids", "animation & children", "animation and children"] },
  { slug: "shorts", label: "Short Films", blurb: "Short films and independent stories.", aliases: ["short", "shorts", "short film", "short films"] },
];

/** Phase one prominent genres (proposal p.11). The rest live behind "View all". */
export const PROMINENT_GENRES = ["drama", "comedy", "romance", "thriller", "action", "family"];

export const COLLECTIONS: Facet[] = [
  { slug: "select", label: "Wanzami Select", blurb: "An editorial selection across languages and genres.", aliases: ["select", "wanzami select"] },
  { slug: "shorts", label: "Wanzami Shorts", blurb: "Short films and independent stories for a shorter watch.", aliases: ["wanzami shorts", "shorts-collection"] },
  { slug: "new-voices", label: "New Voices", blurb: "Emerging filmmakers, actors and new perspectives.", aliases: ["new voices", "new-voices"] },
  { slug: "classics-room", label: "The Classics Room", blurb: "Earlier Nigerian films and memorable performances.", aliases: ["classics", "the classics room", "classics-room"] },
  { slug: "folklore", label: "Folklore Reimagined", blurb: "Stories inspired by folklore, legends and mythology.", aliases: ["folklore", "folklore reimagined"] },
  { slug: "home-away", label: "Home Away From Home", blurb: "Stories that connect diaspora audiences with home.", aliases: ["home away from home", "home-away", "diaspora"] },
  { slug: "behind-the-frame", label: "Behind the Frame", blurb: "Interviews, craft stories and behind-the-scenes films.", aliases: ["behind the frame", "behind-the-frame"] },
  { slug: "women-in-focus", label: "Women in Focus", blurb: "Women-led stories, characters and filmmakers.", aliases: ["women in focus", "women-in-focus"] },
  { slug: "family-room", label: "The Family Room", blurb: "An editorial selection with checked age suitability.", aliases: ["the family room", "family room", "family-room"] },
  { slug: "love-actually", label: "Love, Actually", blurb: "Love, marriage, heartbreak and relationships.", aliases: ["love, actually", "love actually", "love-actually"] },
  { slug: "money-and-power", label: "Money and Power", blurb: "Wealth, ambition, business, politics and betrayal.", aliases: ["money and power", "money-and-power"] },
  { slug: "the-dark-side", label: "The Dark Side", blurb: "Psychological thrillers, crime and unexpected turns.", aliases: ["the dark side", "dark side", "the-dark-side"] },
];

const FACETS: Record<DiscoverKind, Facet[]> = {
  language: LANGUAGES,
  genre: GENRES,
  collection: COLLECTIONS,
};

export function facetsFor(kind: DiscoverKind): Facet[] {
  return FACETS[kind];
}

export function findFacet(kind: DiscoverKind, slug: string): Facet | undefined {
  return FACETS[kind].find((f) => f.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Normalising a title                                                 */
/* ------------------------------------------------------------------ */

/** The subset of a title that discovery reads. `contentClient.Title` satisfies it. */
export interface DiscoverableTitle {
  genres?: string[] | null;
  language?: string | null;
  languages?: string[] | null;
  collections?: string[] | null;
}

const norm = (value: string) => value.trim().toLowerCase().replace(/_/g, "-");

/** "en-NG" -> "en". Leaves words alone ("Nigerian Pidgin"). */
const stripRegion = (value: string) => value.replace(/^([a-z]{2,3})-[a-z]{2}$/i, "$1");

function matchSlug(facets: Facet[], raw: string): string | null {
  const v = norm(raw);
  if (!v) return null;
  for (const f of facets) {
    if (f.slug === v || f.aliases.includes(v)) return f.slug;
  }
  return null;
}

export interface ResolvedLanguages {
  /** Top-level language slugs (english, yoruba, ... indigenous). */
  languages: string[];
  /** Named indigenous languages (efik, tiv ...). */
  indigenous: string[];
}

/** A title may have several spoken languages. Unknown codes are ignored on purpose, never guessed. */
export function resolveLanguages(title: DiscoverableTitle): ResolvedLanguages {
  const raws = [
    ...(title.languages ?? []),
    ...(!title.languages?.length && title.language ? [title.language] : []),
  ];
  const languages = new Set<string>();
  const indigenous = new Set<string>();
  for (const raw of raws) {
    const v = stripRegion(norm(raw ?? ""));
    const top = matchSlug(LANGUAGES, v);
    if (top) {
      languages.add(top);
      continue;
    }
    const sub = matchSlug(INDIGENOUS_LANGUAGES, v);
    if (sub) {
      languages.add("indigenous");
      indigenous.add(sub);
    }
  }
  return { languages: [...languages], indigenous: [...indigenous] };
}

export function resolveGenres(title: DiscoverableTitle): string[] {
  const out = new Set<string>();
  for (const raw of title.genres ?? []) {
    const slug = matchSlug(GENRES, raw ?? "");
    if (slug) out.add(slug);
  }
  return [...out];
}

export function resolveCollections(title: DiscoverableTitle): string[] {
  const out = new Set<string>();
  for (const raw of title.collections ?? []) {
    const slug = matchSlug(COLLECTIONS, raw ?? "");
    if (slug) out.add(slug);
  }
  return [...out];
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export interface DiscoverFilters {
  language: string[];
  genre: string[];
  collection: string[];
  /** Named indigenous languages. Only meaningful while "indigenous" is selected. */
  sub: string[];
}

export const EMPTY_FILTERS: DiscoverFilters = { language: [], genre: [], collection: [], sub: [] };

export function hasActiveFilters(f: DiscoverFilters): boolean {
  return f.language.length + f.genre.length + f.collection.length + f.sub.length > 0;
}

export function activeFilterCount(f: DiscoverFilters): number {
  return f.language.length + f.genre.length + f.collection.length;
}

/** Matching rule. Across groups AND, within a group OR. */
export function matchesFilters(title: DiscoverableTitle, f: DiscoverFilters): boolean {
  if (f.language.length) {
    const { languages, indigenous } = resolveLanguages(title);
    const languageOk = f.language.some((l) => {
      if (!languages.includes(l)) return false;
      // Naming specific indigenous languages narrows Indigenous only.
      if (l === "indigenous" && f.sub.length) return f.sub.some((s) => indigenous.includes(s));
      return true;
    });
    if (!languageOk) return false;
  }
  if (f.genre.length) {
    const genres = resolveGenres(title);
    if (!f.genre.some((g) => genres.includes(g))) return false;
  }
  if (f.collection.length) {
    const collections = resolveCollections(title);
    if (!f.collection.some((c) => collections.includes(c))) return false;
  }
  return true;
}

export function filterTitles<T extends DiscoverableTitle>(titles: T[], f: DiscoverFilters): T[] {
  return hasActiveFilters(f) ? titles.filter((t) => matchesFilters(t, f)) : titles;
}

/** Number of titles behind each tile, given the *other* groups' selections.
    Drives "hide empty shelves" and the count badges. */
export function facetCounts<T extends DiscoverableTitle>(
  titles: T[],
  kind: DiscoverKind,
  f: DiscoverFilters,
): Record<string, number> {
  const others: DiscoverFilters = { ...f, [kind]: [] as string[], sub: kind === "language" ? [] : f.sub };
  const pool = filterTitles(titles, others);
  const counts: Record<string, number> = {};
  for (const facet of FACETS[kind]) counts[facet.slug] = 0;
  for (const t of pool) {
    const slugs =
      kind === "language" ? resolveLanguages(t).languages : kind === "genre" ? resolveGenres(t) : resolveCollections(t);
    for (const s of slugs) counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}

/** Named indigenous languages present in the catalogue (for the sub-list). */
export function indigenousCounts<T extends DiscoverableTitle>(titles: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of titles) {
    for (const s of resolveLanguages(t).indigenous) counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}

/* ------------------------------------------------------------------ */
/* URL state                                                           */
/* ------------------------------------------------------------------ */

const listParam = (value: string | null, kind: DiscoverKind | "sub"): string[] => {
  if (!value) return [];
  const valid =
    kind === "sub" ? INDIGENOUS_LANGUAGES.map((f) => f.slug) : FACETS[kind].map((f) => f.slug);
  return [...new Set(value.split(",").map((s) => s.trim().toLowerCase()).filter((s) => valid.includes(s)))];
};

export function parseFilters(params: Pick<URLSearchParams, "get">): DiscoverFilters {
  return {
    language: listParam(params.get("language"), "language"),
    genre: listParam(params.get("genre"), "genre"),
    collection: listParam(params.get("collection"), "collection"),
    sub: listParam(params.get("sub"), "sub"),
  };
}

export type DiscoverTab = DiscoverKind;

export function parseTab(value: string | null): DiscoverTab {
  return value === "genre" || value === "collection" ? value : "language";
}

export function toQuery(f: DiscoverFilters, tab: DiscoverTab): string {
  const p = new URLSearchParams();
  if (tab !== "language") p.set("tab", tab);
  if (f.language.length) p.set("language", f.language.join(","));
  if (f.genre.length) p.set("genre", f.genre.join(","));
  if (f.collection.length) p.set("collection", f.collection.join(","));
  if (f.sub.length && f.language.includes("indigenous")) p.set("sub", f.sub.join(","));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Toggle one value inside a group. Returns a new filters object. */
export function toggleFilter(f: DiscoverFilters, kind: DiscoverKind | "sub", slug: string): DiscoverFilters {
  const list = f[kind];
  const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
  const out = { ...f, [kind]: next };
  if (kind === "language" && !next.includes("indigenous")) out.sub = [];
  return out;
}

export function clearGroup(f: DiscoverFilters, kind: DiscoverKind): DiscoverFilters {
  return { ...f, [kind]: [], sub: kind === "language" ? [] : f.sub };
}

export function labelFor(kind: DiscoverKind | "sub", slug: string): string {
  const list = kind === "sub" ? INDIGENOUS_LANGUAGES : FACETS[kind];
  return list.find((f) => f.slug === slug)?.label ?? slug;
}

/** Category photography. Each door has a default cinematic photograph (the studies from the
    approved proposal, cropped 16:9 in /public/category-art/photos). Editors can replace any
    door's image from Admin > Discover; that override is stored in the database and wins. */
const P = (key: string) => `/category-art/photos/${key}.webp`;
export const DEFAULT_ART: Record<string, string> = {
  "language/english": P("8407a47f"),
  "language/yoruba": P("8a5098d9"),
  "language/igbo": P("e8f5fa05"),
  "language/hausa": P("eb122b60"),
  "language/pidgin": P("578b06a1"),
  "language/indigenous": P("84d5f908"),
  "genre/drama": P("e8f5fa05"),
  "genre/comedy": P("3988fd29"),
  "genre/romance": P("c539245c"),
  "genre/thriller": P("d63fd84a"),
  "genre/crime": P("8407a47f"),
  "genre/action": P("578b06a1"),
  "genre/horror": P("3982fd76"),
  "genre/epic": P("84d5f908"),
  "genre/family": P("3988fd29"),
  "genre/political": P("eb122b60"),
  "genre/faith": P("8a5098d9"),
  "genre/documentary": P("8407a47f"),
  "genre/youth": P("3988fd29"),
  "genre/animation": P("3988fd29"),
  "genre/shorts": P("e8f5fa05"),
  "collection/select": P("e8f5fa05"),
  "collection/shorts": P("8407a47f"),
  "collection/new-voices": P("578b06a1"),
  "collection/classics-room": P("84d5f908"),
  "collection/folklore": P("3982fd76"),
  "collection/home-away": P("8a5098d9"),
  "collection/behind-the-frame": P("8407a47f"),
  "collection/women-in-focus": P("8a5098d9"),
  "collection/family-room": P("3988fd29"),
  "collection/love-actually": P("c539245c"),
  "collection/money-and-power": P("eb122b60"),
  "collection/the-dark-side": P("d63fd84a"),
};

/** Image for a door: the Admin override if one exists, else the default photograph. */
export const categoryArt = (
  kind: DiscoverKind,
  slug: string,
  overrides?: Record<string, string> | null,
): string | undefined => overrides?.[`${kind}/${slug}`] ?? DEFAULT_ART[`${kind}/${slug}`];

/** Copy, straight from the approved proposal. */
export const EMPTY_STATE = {
  title: "No matches on this slate",
  body: "Try another genre, or clear one filter to explore more stories.",
};
