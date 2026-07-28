import { Router } from "express";
import { requireAdmin, requireAuth, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import { adminEventsSummary, ingestEvents } from "../controllers/eventController.js";

const router = Router();

// Aggregate engagement analytics.
const canAccess = requirePermission(Permission.ANALYTICS_VIEW);

router.post("/events", requireAuth, ingestEvents);
router.get("/admin/events/summary", requireAuth, requireAdmin, canAccess, adminEventsSummary);

export default router;
