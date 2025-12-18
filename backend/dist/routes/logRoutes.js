import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { listLogs } from "../controllers/logController.js";
const router = Router();
router.get("/admin/logs", requireAuth, requireAdmin, listLogs);
export default router;
