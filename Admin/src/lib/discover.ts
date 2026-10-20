/* Discover taxonomy for the Admin. Mirrors the website (src/lib/discover.ts) and
   the backend (src/utils/discoverTaxonomy.ts): values are stored as slugs on
   Title.languages / Title.collections. */

export type Option = { slug: string; label: string; blurb?: string };

export const LANGUAGE_OPTIONS: Option[] = [
  { slug: "english", label: "English" },
  { slug: "yoruba", label: "Yoruba" },
  { slug: "igbo", label: "Igbo" },
  { slug: "hausa", label: "Hausa" },
  { slug: "pidgin", label: "Pidgin" },
  { slug: "indigenous", label: "Indigenous" },
];

/** Named indigenous languages. Picking one also counts the title under Indigenous. */
export const INDIGENOUS_OPTIONS: Option[] = [
  { slug: "efik", label: "Efik" },
  { slug: "ibibio", label: "Ibibio" },
  { slug: "tiv", label: "Tiv" },
  { slug: "edo", label: "Edo" },
  { slug: "idoma", label: "Idoma" },
];

export const COLLECTION_OPTIONS: Option[] = [
  { slug: "select", label: "Wanzami Select", blurb: "An editorial selection across languages and genres." },
  { slug: "shorts", label: "Wanzami Shorts", blurb: "Short films and independent stories for a shorter watch." },
  { slug: "new-voices", label: "New Voices", blurb: "Emerging filmmakers, actors and new perspectives." },
  { slug: "classics-room", label: "The Classics Room", blurb: "Earlier Nigerian films and memorable performances." },
  { slug: "folklore", label: "Folklore Reimagined", blurb: "Stories inspired by folklore, legends and mythology." },
  { slug: "home-away", label: "Home Away From Home", blurb: "Stories that connect diaspora audiences with home." },
  { slug: "behind-the-frame", label: "Behind the Frame", blurb: "Interviews, craft stories and behind-the-scenes films." },
  { slug: "women-in-focus", label: "Women in Focus", blurb: "Women-led stories, characters and filmmakers." },
  { slug: "family-room", label: "The Family Room", blurb: "An editorial selection with checked age suitability." },
  { slug: "love-actually", label: "Love, Actually", blurb: "Love, marriage, heartbreak and relationships." },
  { slug: "money-and-power", label: "Money and Power", blurb: "Wealth, ambition, business, politics and betrayal." },
  { slug: "the-dark-side", label: "The Dark Side", blurb: "Psychological thrillers, crime and unexpected turns." },
];

/** The 15 Discover genres. `aliases` map the free-text genres editors already use. */
export const GENRE_OPTIONS: (Option & { aliases: string[] })[] = [
  { slug: "drama", label: "Drama", aliases: ["drama"] },
  { slug: "comedy", label: "Comedy", aliases: ["comedy", "comedies"] },
  { slug: "romance", label: "Romance & Relationships", aliases: ["romance", "romantic", "relationships"] },
  { slug: "thriller", label: "Thriller & Suspense", aliases: ["thriller", "suspense", "mystery"] },
  { slug: "crime", label: "Crime & Investigation", aliases: ["crime", "investigation", "detective"] },
  { slug: "action", label: "Action & Adventure", aliases: ["action", "adventure"] },
  { slug: "horror", label: "Horror & Supernatural", aliases: ["horror", "supernatural"] },
  { slug: "epic", label: "Epic & Historical", aliases: ["epic", "historical", "history", "period"] },
  { slug: "family", label: "Family Movies", aliases: ["family", "family movies"] },
  { slug: "political", label: "Political & Corporate Drama", aliases: ["political", "politics", "corporate"] },
  { slug: "faith", label: "Faith-Based", aliases: ["faith", "faith-based", "faith based", "religious", "gospel", "christian"] },
  { slug: "documentary", label: "Documentaries & True Stories", aliases: ["documentary", "documentaries", "true stories", "biography"] },
  { slug: "youth", label: "Youth & Campus", aliases: ["youth", "campus", "teen", "coming-of-age"] },
  { slug: "animation", label: "Animation & Children", aliases: ["animation", "animated", "children", "kids"] },
  { slug: "shorts", label: "Short Films", aliases: ["short", "shorts", "short film", "short films"] },
];

const LEGACY_LANGUAGE: Record<string, string> = {
  en: "english", eng: "english", english: "english",
  yo: "yoruba", yor: "yoruba", yoruba: "yoruba",
  ig: "igbo", ibo: "igbo", igbo: "igbo",
  ha: "hausa", hau: "hausa", hausa: "hausa",
  pcm: "pidgin", pidgin: "pidgin",
};

type TitleLike = { genres?: string[] | null; language?: string | null; languages?: string[] | null; collections?: string[] | null };

/** Languages for a title: the new array, else the legacy single code (en -> english). */
export function languagesOf(t: TitleLike): string[] {
  if (t.languages?.length) return t.languages;
  const legacy = LEGACY_LANGUAGE[(t.language ?? "").trim().toLowerCase().replace(/-.*$/, "")];
  return legacy ? [legacy] : [];
}

export function collectionsOf(t: TitleLike): string[] {
  return t.collections ?? [];
}

/** Discover genres a title's free-text genres resolve to. */
export function genreSlugsOf(t: TitleLike): string[] {
  const out = new Set<string>();
  for (const raw of t.genres ?? []) {
    const v = String(raw ?? "").trim().toLowerCase();
    const hit = GENRE_OPTIONS.find((g) => g.slug === v || g.aliases.includes(v) || g.label.toLowerCase() === v);
    if (hit) out.add(hit.slug);
  }
  return [...out];
}

export const labelOf = (options: Option[], slug: string) => options.find((o) => o.slug === slug)?.label ?? slug;

export type Coverage = Record<string, number>;

/** How many titles sit behind each door. Zero means the shelf stays hidden on the website. */
export function coverage<T extends TitleLike>(titles: T[]) {
  const language: Coverage = {};
  const genre: Coverage = {};
  const collection: Coverage = {};
  for (const t of titles) {
    const langs = languagesOf(t);
    for (const l of langs) language[l] = (language[l] ?? 0) + 1;
    // Named indigenous languages roll up under Indigenous.
    if (langs.some((l) => INDIGENOUS_OPTIONS.some((o) => o.slug === l)) && !langs.includes("indigenous")) {
      language.indigenous = (language.indigenous ?? 0) + 1;
    }
    for (const g of genreSlugsOf(t)) genre[g] = (genre[g] ?? 0) + 1;
    for (const c of collectionsOf(t)) collection[c] = (collection[c] ?? 0) + 1;
  }
  return { language, genre, collection };
}

/* Default photograph per door. These ship with the website (/public/category-art/photos);
   an image set in Admin > Discover overrides them. Keep in sync with the website's DEFAULT_ART. */
export const SITE_BASE = "https://www.wanzami.tv";
const P = (key: string) => `/category-art/photos/${key}.webp`;
export const DEFAULT_ART: Record<string, string> = {
  "language/english": P("8407a47f"), "language/yoruba": P("8a5098d9"), "language/igbo": P("e8f5fa05"),
  "language/hausa": P("eb122b60"), "language/pidgin": P("578b06a1"), "language/indigenous": P("84d5f908"),
  "genre/drama": P("e8f5fa05"), "genre/comedy": P("3988fd29"), "genre/romance": P("c539245c"),
  "genre/thriller": P("d63fd84a"), "genre/crime": P("8407a47f"), "genre/action": P("578b06a1"),
  "genre/horror": P("3982fd76"), "genre/epic": P("84d5f908"), "genre/family": P("3988fd29"),
  "genre/political": P("eb122b60"), "genre/faith": P("8a5098d9"), "genre/documentary": P("8407a47f"),
  "genre/youth": P("3988fd29"), "genre/animation": P("3988fd29"), "genre/shorts": P("e8f5fa05"),
  "collection/select": P("e8f5fa05"), "collection/shorts": P("8407a47f"), "collection/new-voices": P("578b06a1"),
  "collection/classics-room": P("84d5f908"), "collection/folklore": P("3982fd76"), "collection/home-away": P("8a5098d9"),
  "collection/behind-the-frame": P("8407a47f"), "collection/women-in-focus": P("8a5098d9"), "collection/family-room": P("3988fd29"),
  "collection/love-actually": P("c539245c"), "collection/money-and-power": P("eb122b60"), "collection/the-dark-side": P("d63fd84a"),
};

export const absoluteArt = (url: string) => (url.startsWith("/") ? `${SITE_BASE}${url}` : url);
