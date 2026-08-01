import { Router } from "express";
import { requireAuth, requireAdmin, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import { sendBroadcastNotification, listBroadcastHistory } from "../controllers/pushController.js";

const router = Router();

const canPush = requirePermission(Permission.PUSH_MANAGE);

router.post("/admin/notifications/broadcast", requireAuth, requireAdmin, canPush, sendBroadcastNotification);
router.get("/admin/notifications/history", requireAuth, requireAdmin, canPush, listBroadcastHistory);

export default router;
