import { prisma } from "../prisma.js";

// Flips SCHEDULED blog posts to PUBLISHED once their scheduled time arrives.
// Runs on a cron (see worker/cron.ts). Safe to run repeatedly — it only
// touches rows whose scheduled time has already passed.
export async function publishScheduledPosts() {
  const now = new Date();

  const due = await prisma.blogPost.findMany({
    where: {
      status: "SCHEDULED",
      scheduledFor: { not: null, lte: now },
    },
    select: { id: true, scheduledFor: true },
  });

  if (!due.length) return { published: 0 };

  // publishedAt takes the scheduled time, not "now", so the post reads as
  // having gone out exactly when the author intended.
  await prisma.$transaction(
    due.map((post) =>
      prisma.blogPost.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishedAt: post.scheduledFor ?? now,
          scheduledFor: null,
        },
      })
    )
  );

  return { published: due.length };
}
