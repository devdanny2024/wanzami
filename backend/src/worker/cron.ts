import "./emailWorker.js";
import cron from "node-cron";
import { computePopularitySnapshots } from "../jobs/popularity.js";
import { computeProfilePreferences } from "../jobs/preferences.js";
import { computeRecentViews } from "../jobs/recentViews.js";
import { processAvailabilityTransitions } from "../jobs/availability.js";
import { publishScheduledPosts } from "../jobs/blogScheduler.js";

const popularityCron = process.env.POPULARITY_CRON || "0 3 * * *"; // daily at 03:00
const preferencesCron = process.env.PREFERENCES_CRON || "30 3 * * *"; // daily at 03:30
const recentViewsCron = process.env.RECENT_VIEWS_CRON || "0 4 * * *"; // daily at 04:00
const availabilityCron = process.env.AVAILABILITY_CRON || "*/5 * * * *"; // every 5 minutes
const blogScheduleCron = process.env.BLOG_SCHEDULE_CRON || "* * * * *"; // every minute

cron.schedule(popularityCron, async () => {
  try {
    console.log(`[cron] running popularity snapshots at ${new Date().toISOString()}`);
    await computePopularitySnapshots();
    console.log("[cron] popularity snapshots done");
  } catch (err) {
    console.error("[cron] popularity snapshots failed", err);
  }
});

cron.schedule(preferencesCron, async () => {
  try {
    console.log(`[cron] running profile preferences at ${new Date().toISOString()}`);
    await computeProfilePreferences();
    console.log("[cron] profile preferences done");
  } catch (err) {
    console.error("[cron] profile preferences failed", err);
  }
});

cron.schedule(recentViewsCron, async () => {
  try {
    console.log(`[cron] running recent views at ${new Date().toISOString()}`);
    await computeRecentViews();
    console.log("[cron] recent views done");
  } catch (err) {
    console.error("[cron] recent views failed", err);
  }
});

cron.schedule(availabilityCron, async () => {
  try {
    const result = await processAvailabilityTransitions();
    if (result.wentLive > 0 || result.removed > 0) {
      console.log(
        `[cron] availability transitions: ${result.wentLive} went live, ${result.removed} removed`
      );
    }
  } catch (err) {
    console.error("[cron] availability transitions failed", err);
  }
});

cron.schedule(blogScheduleCron, async () => {
  try {
    const result = await publishScheduledPosts();
    if (result.published > 0) {
      console.log(`[cron] blog scheduler: published ${result.published} post(s)`);
    }
  } catch (err) {
    console.error("[cron] blog scheduler failed", err);
  }
});

console.log(`[cron] scheduler started with POPULARITY_CRON=${popularityCron}`);
console.log(`[cron] scheduler started with PREFERENCES_CRON=${preferencesCron}`);
console.log(`[cron] scheduler started with RECENT_VIEWS_CRON=${recentViewsCron}`);
