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
