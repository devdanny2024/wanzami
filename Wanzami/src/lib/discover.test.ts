/* Run with: npm run test:discover
   (Node's built-in test runner; no extra dependencies.) */
import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_FILTERS,
  GENRES,
  LANGUAGES,
  COLLECTIONS,
  PROMINENT_GENRES,
  clearGroup,
  facetCounts,
  filterTitles,
  indigenousCounts,
  matchesFilters,
  parseFilters,
  parseTab,
  resolveCollections,
  resolveGenres,
  resolveLanguages,
  toQuery,
  toggleFilter,
  type DiscoverFilters,
  type DiscoverableTitle,
} from "./discover.ts";

const f = (over: Partial<DiscoverFilters>): DiscoverFilters => ({ ...EMPTY_FILTERS, ...over });

const ruin: DiscoverableTitle = { genres: ["Drama"], language: "en" };
const sango: DiscoverableTitle = { genres: ["Thriller", "Crime"], languages: ["yo"] };
const kunle: DiscoverableTitle = { genres: ["Romance"], languages: ["ha", "en"] };
const efikFilm: DiscoverableTitle = { genres: ["Drama"], languages: ["efi"] };
const titles = [ruin, sango, kunle, efikFilm];

test("the proposal's taxonomy sizes: 6 languages, 15 genres, 12 collections", () => {
  assert.equal(LANGUAGES.length, 6);
  assert.equal(GENRES.length, 15);
  assert.equal(COLLECTIONS.length, 12);
  assert.ok(PROMINENT_GENRES.every((s) => GENRES.some((g) => g.slug === s)));
});

test("existing production data maps cleanly (Drama/Documentary/Horror/Action, language 'en')", () => {
  assert.deepEqual(resolveGenres({ genres: ["Drama", "Documentary", "Horror", "Action"] }).sort(), [
    "action",
    "documentary",
    "drama",
    "horror",
  ]);
  assert.deepEqual(resolveLanguages({ language: "en" }).languages, ["english"]);
});

test("a title can have several spoken languages", () => {
  assert.deepEqual(resolveLanguages(kunle).languages.sort(), ["english", "hausa"]);
});

test("region suffixes and long names resolve; unknown codes are ignored, never guessed", () => {
  assert.deepEqual(resolveLanguages({ language: "en-NG" }).languages, ["english"]);
  assert.deepEqual(resolveLanguages({ languages: ["Nigerian Pidgin"] }).languages, ["pidgin"]);
  assert.deepEqual(resolveLanguages({ language: "fr" }).languages, []);
  assert.deepEqual(resolveLanguages({}).languages, []);
});

test("named indigenous languages roll up to Indigenous and keep their name", () => {
  const r = resolveLanguages(efikFilm);
  assert.deepEqual(r.languages, ["indigenous"]);
  assert.deepEqual(r.indigenous, ["efik"]);
});

test("genre aliases: combined labels and synonyms", () => {
  assert.deepEqual(resolveGenres({ genres: ["Thriller & Suspense"] }), ["thriller"]);
  assert.deepEqual(resolveGenres({ genres: ["Documentaries & True Stories"] }), ["documentary"]);
  assert.deepEqual(resolveGenres({ genres: ["something unrelated"] }), []);
});

test("collections are read from the title when the API provides them", () => {
  assert.deepEqual(resolveCollections({ collections: ["Wanzami Select", "new voices"] }).sort(), ["new-voices", "select"]);
  assert.deepEqual(resolveCollections({}), []);
});

test("rule: across groups AND (Yoruba + Thriller)", () => {
  const res = filterTitles(titles, f({ language: ["yoruba"], genre: ["thriller"] }));
  assert.deepEqual(res, [sango]);
});

test("rule: within a group OR  (Yoruba OR Hausa) AND Thriller", () => {
  assert.deepEqual(filterTitles(titles, f({ language: ["yoruba", "hausa"] })), [sango, kunle]);
  assert.deepEqual(filterTitles(titles, f({ language: ["yoruba", "hausa"], genre: ["thriller"] })), [sango]);
});

test("Hausa + Romance matches only titles tagged with both", () => {
  assert.deepEqual(filterTitles(titles, f({ language: ["hausa"], genre: ["romance"] })), [kunle]);
  assert.deepEqual(filterTitles(titles, f({ language: ["hausa"], genre: ["thriller"] })), []);
});

test("no filters returns everything; an impossible combination returns nothing (no padding)", () => {
  assert.equal(filterTitles(titles, EMPTY_FILTERS).length, 4);
  assert.equal(filterTitles(titles, f({ language: ["igbo"], genre: ["comedy"] })).length, 0);
});

test("indigenous sub-list narrows Indigenous by named language", () => {
  assert.ok(matchesFilters(efikFilm, f({ language: ["indigenous"], sub: ["efik"] })));
  assert.ok(!matchesFilters(efikFilm, f({ language: ["indigenous"], sub: ["tiv"] })));
  assert.deepEqual(indigenousCounts(titles), { efik: 1 });
});

test("counts reflect the other groups so empty doors can be hidden", () => {
  const langCounts = facetCounts(titles, "language", EMPTY_FILTERS);
  assert.equal(langCounts.english, 2);
  assert.equal(langCounts.yoruba, 1);
  assert.equal(langCounts.igbo, 0);
  const thrillerOnly = facetCounts(titles, "language", f({ genre: ["thriller"] }));
  assert.equal(thrillerOnly.yoruba, 1);
  assert.equal(thrillerOnly.english, 0);
  // a group's own selection does not hide its siblings
  const genreCounts = facetCounts(titles, "genre", f({ genre: ["drama"] }));
  assert.equal(genreCounts.thriller, 1);
});

test("URL round trip keeps filters and tab; junk values are dropped", () => {
  const filters = f({ language: ["yoruba", "hausa"], genre: ["thriller"] });
  const q = toQuery(filters, "genre");
  const params = new URLSearchParams(q.slice(1));
  assert.deepEqual(parseFilters(params), filters);
  assert.equal(parseTab(params.get("tab")), "genre");
  assert.deepEqual(parseFilters(new URLSearchParams("language=klingon,yoruba&genre=")), f({ language: ["yoruba"] }));
  assert.equal(toQuery(EMPTY_FILTERS, "language"), "");
});

test("toggle adds and removes; clearing a group leaves the others (Clear genre vs Clear all)", () => {
  let cur = toggleFilter(EMPTY_FILTERS, "language", "yoruba");
  cur = toggleFilter(cur, "genre", "thriller");
  assert.deepEqual(cur, f({ language: ["yoruba"], genre: ["thriller"] }));
  assert.deepEqual(clearGroup(cur, "genre"), f({ language: ["yoruba"] }));
  assert.deepEqual(toggleFilter(cur, "language", "yoruba"), f({ genre: ["thriller"] }));
  // dropping Indigenous also drops the named sub-languages
  const ind = toggleFilter(toggleFilter(EMPTY_FILTERS, "language", "indigenous"), "sub", "efik");
  assert.deepEqual(toggleFilter(ind, "language", "indigenous").sub, []);
});
