-- Discover (Language / Genre / Collections): a title can have several spoken
-- languages and sit on several editorial shelves. Additive and backwards
-- compatible: two nullable-default array columns, nothing is dropped or rewritten.
ALTER TABLE "Title" ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "collections" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill only what is already known: titles whose single `language` is English.
-- Nothing is guessed for other languages; editors tag those in the Admin.
UPDATE "Title"
SET "languages" = ARRAY['english']::TEXT[]
WHERE lower(coalesce("language", '')) IN ('en', 'eng', 'english', 'en-ng')
  AND cardinality(coalesce("languages", ARRAY[]::TEXT[])) = 0;
