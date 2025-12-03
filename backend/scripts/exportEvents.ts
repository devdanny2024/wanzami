import { writeFile, mkdir } from "fs/promises";
import { prisma } from "../src/prisma.js";

const DAYS = parseInt(process.env.EXPORT_DAYS ?? "1", 10) || 1;

function formatDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function main() {
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const events = await prisma.engagementEvent.findMany({
    where: { occurredAt: { gte: since } },
    orderBy: { occurredAt: "asc" },
    take: 50000,
  });

  const headers = [
    "id",
    "profileId",
    "titleId",
    "episodeId",
    "sessionId",
    "eventType",
    "occurredAt",
    "country",
    "deviceId",
    "metadata",
  ];

  const rows = events.map((e) => {
    const meta = e.metadata ? JSON.stringify(e.metadata).replace(/"/g, '""') : "";
    return [
      e.id.toString(),
      e.profileId?.toString() ?? "",
      e.titleId?.toString() ?? "",
      e.episodeId?.toString() ?? "",
      e.sessionId?.toString() ?? "",
      e.eventType,
      e.occurredAt.toISOString(),
      e.country ?? "",
      e.deviceId ?? "",
      meta ? `"${meta}"` : "",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const dir = "exports";
  await mkdir(dir, { recursive: true });
  const fileName = `${dir}/engagement_events_${formatDate(new Date())}.csv`;
  await writeFile(fileName, csv, "utf-8");
  console.log(`Exported ${events.length} events to ${fileName}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
