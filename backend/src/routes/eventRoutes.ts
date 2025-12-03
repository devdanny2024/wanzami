import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { adminEventsSummary, ingestEvents } from "../controllers/eventController.js";

const router = Router();

router.post("/events", requireAuth, ingestEvents);
router.get("/admin/events/summary", requireAuth, requireAdmin, adminEventsSummary);

export default router;
