import { Router } from "express";
import { requireAdmin, requireAuth, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import { listLogs } from "../controllers/logController.js";

const router = Router();

// Server logs are operational data.
const canAccess = requirePermission(Permission.OPS_MANAGE);

router.get("/admin/logs", requireAuth, requireAdmin, canAccess, listLogs);

export default router;
