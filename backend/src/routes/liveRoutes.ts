import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  createLiveEvent,
  createLiveEventSourceAdmin,
  deleteLiveEventAdmin,
  deleteLiveEventSourceAdmin,
  endLiveEvent,
  getLiveEventAdmin,
  getLiveEventPublic,
  getLiveEventUnlistedPublic,
  listLiveEventSourcesAdmin,
  listLiveEventsAdmin,
  listLiveEventsPublic,
  startLiveEvent,
  switchLiveEventSourceAdmin,
  updateLiveEventAdmin,
  updateLiveEventPublishAdmin,
  updateLiveEventReplayAdmin,
  updateLiveEventSourceAdmin,
  updateLiveEventViewerCountAdmin,
} from "../controllers/liveController.js";

const router = Router();

router.post("/admin/live/events", requireAuth, requireAdmin, createLiveEvent);
router.get("/admin/live/events", requireAuth, requireAdmin, listLiveEventsAdmin);
router.get("/admin/live/events/:id", requireAuth, requireAdmin, getLiveEventAdmin);
router.delete("/admin/live/events/:id", requireAuth, requireAdmin, deleteLiveEventAdmin);
router.patch("/admin/live/events/:id", requireAuth, requireAdmin, updateLiveEventAdmin);
router.post("/admin/live/events/:id/start", requireAuth, requireAdmin, startLiveEvent);
router.post("/admin/live/events/:id/end", requireAuth, requireAdmin, endLiveEvent);
router.patch("/admin/live/events/:id/viewers", requireAuth, requireAdmin, updateLiveEventViewerCountAdmin);
router.patch("/admin/live/events/:id/replay", requireAuth, requireAdmin, updateLiveEventReplayAdmin);
router.patch("/admin/live/events/:id/publish", requireAuth, requireAdmin, updateLiveEventPublishAdmin);
router.get("/admin/live/events/:id/sources", requireAuth, requireAdmin, listLiveEventSourcesAdmin);
router.post("/admin/live/events/:id/sources", requireAuth, requireAdmin, createLiveEventSourceAdmin);
router.patch("/admin/live/events/:id/sources/:sourceId", requireAuth, requireAdmin, updateLiveEventSourceAdmin);
router.delete("/admin/live/events/:id/sources/:sourceId", requireAuth, requireAdmin, deleteLiveEventSourceAdmin);
router.post("/admin/live/events/:id/sources/switch", requireAuth, requireAdmin, switchLiveEventSourceAdmin);

router.get("/live/events", requireAuth, listLiveEventsPublic);
router.get("/live/events/unlisted/:slug", requireAuth, getLiveEventUnlistedPublic);
router.get("/live/events/:id", requireAuth, getLiveEventPublic);

export default router;

