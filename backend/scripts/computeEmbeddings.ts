import "dotenv/config";
import { prisma } from "../src/prisma.js";

const MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE ?? "20");

async function embed(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: MODEL,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${body}`);
  }
  const json: any = await res.json();
  return (json.data as any[]).map((d) => d.embedding as number[]);
}

async function main() {
  const titles = await prisma.title.findMany({
    where: {
      archived: false,
      OR: [
        { synopsis: { not: null } },
        { name: { not: null } },
      ],
      titleEmbedding: null,
    },
    take: 200, // avoid huge batches in one run
  });

  if (!titles.length) {
    console.log("No titles pending embeddings");
    return;
  }

  console.log(`Computing embeddings for ${titles.length} titles with ${MODEL}`);
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((t) => `${t.name ?? ""}\n\n${t.synopsis ?? ""}`.trim());
    const vectors = await embed(inputs);
    for (let j = 0; j < batch.length; j++) {
      await prisma.titleEmbedding.upsert({
        where: { titleId: batch[j].id },
        update: { embedding: vectors[j], model: MODEL },
        create: { titleId: batch[j].id, embedding: vectors[j], model: MODEL },
      });
    }
    console.log(`Embedded ${Math.min(i + BATCH_SIZE, titles.length)}/${titles.length}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
