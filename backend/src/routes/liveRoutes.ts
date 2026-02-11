import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  createLiveEvent,
  endLiveEvent,
  getLiveEventAdmin,
  getLiveEventPublic,
  listLiveEventsAdmin,
  listLiveEventsPublic,
  startLiveEvent,
  updateLiveEventReplayAdmin,
  updateLiveEventViewerCountAdmin,
} from "../controllers/liveController.js";

const router = Router();

router.post("/admin/live/events", requireAuth, requireAdmin, createLiveEvent);
router.get("/admin/live/events", requireAuth, requireAdmin, listLiveEventsAdmin);
router.get("/admin/live/events/:id", requireAuth, requireAdmin, getLiveEventAdmin);
router.post("/admin/live/events/:id/start", requireAuth, requireAdmin, startLiveEvent);
router.post("/admin/live/events/:id/end", requireAuth, requireAdmin, endLiveEvent);
router.patch("/admin/live/events/:id/viewers", requireAuth, requireAdmin, updateLiveEventViewerCountAdmin);
router.patch("/admin/live/events/:id/replay", requireAuth, requireAdmin, updateLiveEventReplayAdmin);

router.get("/live/events", requireAuth, listLiveEventsPublic);
router.get("/live/events/:id", requireAuth, getLiveEventPublic);

export default router;
