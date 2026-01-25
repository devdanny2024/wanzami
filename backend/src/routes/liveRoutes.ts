import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  createLiveEvent,
  endLiveEvent,
  listLiveEventsAdmin,
  listLiveEventsPublic,
  startLiveEvent,
} from "../controllers/liveController.js";

const router = Router();

router.post("/admin/live/events", requireAuth, requireAdmin, createLiveEvent);
router.get("/admin/live/events", requireAuth, requireAdmin, listLiveEventsAdmin);
router.post("/admin/live/events/:id/start", requireAuth, requireAdmin, startLiveEvent);
router.post("/admin/live/events/:id/end", requireAuth, requireAdmin, endLiveEvent);

router.get("/live/events", requireAuth, listLiveEventsPublic);

export default router;
