# Discover: Language / Genre / Collections

Implements "Wanzami Category Artwork / Cinematic Edition 02" (14 Oct 2026), phase 01
(core discovery) on the website.

## What ships in this change
- `/discover` page: tabs for Language, Genre and Collections; art tiles; combined filters
  with removable chips, "Clear genre" / "Clear all", sort, and the approved empty state
  ("No matches on this slate"). State lives in the URL, e.g.
  `/discover?language=yoruba,hausa&genre=thriller`, so every result page is shareable.
- A "Discover" item in the navbar and a "Find your next story" strip on Home / Movies.
- `src/lib/discover.ts`: the taxonomy (6 languages, 15 genres, 12 collections) and the
  matching rule: **across groups AND, within a group OR**, e.g. `(Yoruba OR Hausa) AND Thriller`.
- `npm run test:discover` runs 15 unit tests for that logic (Node's built-in runner).

## No backend change needed yet
The page reads what the API already returns:
- `genres[]`: free-text values are mapped onto the 15 genres through aliases
  (`Documentary` becomes "Documentaries & True Stories", `Horror` becomes "Horror & Supernatural", ...).
- `language`: a single code or name (`en`, `Yoruba`, `en-NG`) is mapped onto the 6 languages.
  Unknown codes are ignored, never guessed. Named indigenous languages (Efik, Ibibio, Tiv,
  Edo, Idoma) roll up under "Indigenous" and keep their name in the sub-list.
- If the API starts returning `languages: string[]` (several spoken languages per title)
  and `collections: string[]`, the page uses them automatically.

Empty doors are hidden (the proposal's "hide empty shelves"). Add `?all=1` to see every
door, for design review while the catalogue is still thinly tagged.

## Still to do (not in this change)
1. **Data (done)**: `languages` / `collections` exist on `Title`, are returned by the API and editable in Admin.
   Today every title is tagged English only, so Yoruba/Igbo/Hausa/Pidgin stay hidden until tagged.
2. **Artwork (done)**: every door has a default cinematic photograph (the proposal's studies, originals
   downloaded from Unsplash and cropped 16:9; see `public/category-art/CREDITS.md`). Editors can replace any
   door's image in **Admin > Discover** (Image / Reset); the website picks the change up within about a minute.
   Overrides live in the `CategoryArt` table; the public `GET /discover/art` returns them.
   Still to do: swap the concept photos for approved Wanzami film stills as they become available.
3. **Mobile app**: the proposal's pages 8 and 9 (Flutter) are a follow-up; the matching rule
   and taxonomy here are the reference.
4. **Short films** is also a format filter in the proposal; it is a plain genre tag for now,
   pending the team's decision on a runtime rule.
5. Team approval items from page 12 (names, definitions, launch scope) are still open.
