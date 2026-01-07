import { Response } from "express";
import { prisma } from "../prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (d: Date) => {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const formatWeekdayLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const adminDashboardSummary = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const now = new Date();
  const startToday = startOfUtcDay(now);

  const rawDays = Number((req.query.days as string) ?? "7");
  const days =
    Number.isFinite(rawDays) && rawDays > 0 && rawDays <= 90 ? rawDays : 7;

  const rawEngagementHours = Number(
    (req.query.engagementHours as string) ?? "24"
  );
  const engagementHours =
    Number.isFinite(rawEngagementHours) &&
    rawEngagementHours > 0 &&
    rawEngagementHours <= 168
      ? rawEngagementHours
      : 24;

  const rawActiveMinutes = Number(
    (req.query.activeMinutes as string) ?? "1"
  );
  const activeMinutes =
    Number.isFinite(rawActiveMinutes) &&
    rawActiveMinutes > 0 &&
    rawActiveMinutes <= 60
      ? rawActiveMinutes
      : 1;

  const sinceDailyWindow = new Date(now.getTime() - (days - 1) * DAY_MS);
  const sinceEngagement = new Date(
    now.getTime() - engagementHours * 60 * 60 * 1000
  );
  const activeSince = new Date(now.getTime() - activeMinutes * 60 * 1000);

  const [totalUsers, titleCount, ppvPurchasesTodayAgg, ppvRevenueAgg, streamsEvents, revenueEvents, engagementEvents, activeEvents] =
    await Promise.all([
      prisma.user.count(),
      prisma.title.count(),
      prisma.ppvPurchase.count({
        where: {
          status: "SUCCESS",
          createdAt: { gte: startToday },
        },
      }),
      prisma.ppvPurchase.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amountNaira: true },
      }),
      prisma.engagementEvent.findMany({
        where: {
          eventType: "PLAY_START",
          occurredAt: { gte: sinceDailyWindow },
        },
        select: { occurredAt: true },
      }),
      prisma.ppvPurchase.findMany({
        where: {
          status: "SUCCESS",
          createdAt: { gte: sinceDailyWindow },
        },
        select: { createdAt: true, amountNaira: true },
      }),
      prisma.engagementEvent.findMany({
        where: {
          occurredAt: { gte: sinceEngagement },
        },
        select: { occurredAt: true },
      }),
      prisma.engagementEvent.findMany({
        where: {
          occurredAt: { gte: activeSince },
        },
        select: { profileId: true, sessionId: true, deviceId: true },
      }),
    ]);

  const totalPpvRevenueNaira = Number(
    ppvRevenueAgg._sum.amountNaira ?? 0
  );

  const activeIds = new Set<string>();
  for (const e of activeEvents) {
    if (e.profileId !== null) {
      activeIds.add(`p:${e.profileId.toString()}`);
    } else if (e.sessionId !== null) {
      activeIds.add(`s:${e.sessionId.toString()}`);
    } else if (e.deviceId) {
      activeIds.add(`d:${e.deviceId}`);
    }
  }
  const activeViewersNow = activeIds.size;

  const streamsByDay = new Map<string, number>();
  for (const e of streamsEvents) {
    const key = startOfUtcDay(e.occurredAt).toISOString().slice(0, 10);
    streamsByDay.set(key, (streamsByDay.get(key) ?? 0) + 1);
  }

  const revenueByDay = new Map<string, number>();
  for (const p of revenueEvents) {
    const key = startOfUtcDay(p.createdAt).toISOString().slice(0, 10);
    revenueByDay.set(
      key,
      (revenueByDay.get(key) ?? 0) + Number(p.amountNaira ?? 0)
    );
  }

  const dailyStreams: { date: string; streams: number }[] = [];
  const dailyRevenue: { date: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * DAY_MS);
    const dayKey = startOfUtcDay(day).toISOString().slice(0, 10);
    const label = formatWeekdayLabel(day);
    dailyStreams.push({
      date: label,
      streams: streamsByDay.get(dayKey) ?? 0,
    });
    dailyRevenue.push({
      date: label,
      revenue: revenueByDay.get(dayKey) ?? 0,
    });
  }

  const buckets = [
    { label: "00:00", start: 0, end: 4 },
    { label: "04:00", start: 4, end: 8 },
    { label: "08:00", start: 8, end: 12 },
    { label: "12:00", start: 12, end: 16 },
    { label: "16:00", start: 16, end: 20 },
    { label: "20:00", start: 20, end: 24 },
  ];
  const viewsByBucket = new Map<string, number>();
  for (const e of engagementEvents) {
    const hour = e.occurredAt.getUTCHours();
    const bucket = buckets.find((b) => hour >= b.start && hour < b.end);
    if (!bucket) continue;
    viewsByBucket.set(bucket.label, (viewsByBucket.get(bucket.label) ?? 0) + 1);
  }
  const contentEngagement = buckets.map((b) => ({
    hour: b.label,
    views: viewsByBucket.get(b.label) ?? 0,
  }));

  return res.json({
    stats: {
      totalUsers,
      activeViewersNow,
      ppvPurchasesToday: ppvPurchasesTodayAgg,
      totalPpvRevenueNaira,
      moviesAndSeriesCount: titleCount,
      blogPostsPublished: 0,
    },
    dailyStreams,
    dailyRevenue,
    contentEngagement,
  });
};
