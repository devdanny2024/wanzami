import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  registerDeviceToken,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/notifications", requireAuth, getNotifications);
router.get("/notifications/unread-count", requireAuth, getUnreadCount);
router.post("/notifications/:id/read", requireAuth, markNotificationRead);
router.post("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.post("/notifications/device-token", requireAuth, registerDeviceToken);

export default router;
