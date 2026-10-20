/* Allowed values for Title.languages / Title.collections (Discover feature).
   Mirrors the website's src/lib/discover.ts and the Admin's lib/discover.ts. */

export const LANGUAGE_SLUGS = [
  "english",
  "yoruba",
  "igbo",
  "hausa",
  "pidgin",
  "indigenous",
  // named indigenous languages (shown under "Indigenous")
  "efik",
  "ibibio",
  "tiv",
  "edo",
  "idoma",
] as const;

export const COLLECTION_SLUGS = [
  "select",
  "shorts",
  "new-voices",
  "classics-room",
  "folklore",
  "home-away",
  "behind-the-frame",
  "women-in-focus",
  "family-room",
  "love-actually",
  "money-and-power",
  "the-dark-side",
] as const;

const NAMED_INDIGENOUS = new Set(["efik", "ibibio", "tiv", "edo", "idoma"]);

export type TaxonomyResult = { values: string[]; invalid: string[] };

const clean = (input: unknown): string[] =>
  Array.isArray(input)
    ? [...new Set(input.map((v) => String(v ?? "").trim().toLowerCase()).filter(Boolean))]
    : [];

const check = (input: unknown, allowed: readonly string[]): TaxonomyResult => {
  const all = clean(input);
  return { values: all.filter((v) => allowed.includes(v)), invalid: all.filter((v) => !allowed.includes(v)) };
};

/** Named indigenous languages imply "indigenous" so the title shows under that door. */
export const parseLanguages = (input: unknown): TaxonomyResult => {
  const r = check(input, LANGUAGE_SLUGS);
  if (r.values.some((v) => NAMED_INDIGENOUS.has(v)) && !r.values.includes("indigenous")) {
    r.values.push("indigenous");
  }
  return r;
};

export const parseCollections = (input: unknown): TaxonomyResult => check(input, COLLECTION_SLUGS);

/* Doors that have a tile (and so an image): the six top-level languages, the 15 genres, the 12 collections. */
export const ART_KINDS = ["language", "genre", "collection"] as const;
export type ArtKind = (typeof ART_KINDS)[number];

export const TILE_LANGUAGE_SLUGS = ["english", "yoruba", "igbo", "hausa", "pidgin", "indigenous"] as const;

export const GENRE_SLUGS = [
  "drama", "comedy", "romance", "thriller", "crime", "action", "horror", "epic",
  "family", "political", "faith", "documentary", "youth", "animation", "shorts",
] as const;

const ART_SLUGS: Record<ArtKind, readonly string[]> = {
  language: TILE_LANGUAGE_SLUGS,
  genre: GENRE_SLUGS,
  collection: COLLECTION_SLUGS,
};

export const isArtDoor = (kind: unknown, slug: unknown): kind is ArtKind =>
  typeof kind === "string" &&
  (ART_KINDS as readonly string[]).includes(kind) &&
  typeof slug === "string" &&
  ART_SLUGS[kind as ArtKind].includes(slug);
