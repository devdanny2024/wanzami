import { Router } from "express";
import { Permission } from "../auth/permissions.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import {
  createLiveEvent,
  createLiveEventSourceAdmin,
  deleteLiveEventAdmin,
  deleteLiveEventSourceAdmin,
  endLiveEvent,
  heartbeatLiveEventSourceAdmin,
  getLiveEventAdmin,
  getLiveEventPublic,
  getLiveEventUnlistedPublic,
  listLiveEventSourcesAdmin,
  listLiveEventsAdmin,
  listLiveEventsPublic,
  registerLiveEventThirdPartySourceAdmin,
  startLiveEvent,
  switchLiveEventSourceAdmin,
  updateLiveEventAdmin,
  updateLiveEventPublishAdmin,
  updateLiveEventReplayAdmin,
  updateLiveEventSourceAdmin,
  updateLiveEventViewerCountAdmin,
} from "../controllers/liveController.js";
import {
  createLiveChatMessage,
  deleteLiveChatMessage,
  getLiveEngagementSnapshot,
  heartbeatLiveViewer,
  listLiveChatMessages,
  listLiveChatMessagesAdmin,
  listLiveReactions,
  moderateLiveChatMessage,
  muteLiveChatUser,
  sendLiveReaction,
} from "../controllers/liveEngagementController.js";

const router = Router();

router.post("/admin/live/events", requireAuth, requirePermission(Permission.LIVE_MANAGE), createLiveEvent);
router.get("/admin/live/events", requireAuth, requirePermission(Permission.LIVE_MANAGE), listLiveEventsAdmin);
router.get("/admin/live/events/:id", requireAuth, requirePermission(Permission.LIVE_MANAGE), getLiveEventAdmin);
router.delete("/admin/live/events/:id", requireAuth, requirePermission(Permission.LIVE_MANAGE), deleteLiveEventAdmin);
router.patch("/admin/live/events/:id", requireAuth, requirePermission(Permission.LIVE_MANAGE), updateLiveEventAdmin);
router.post("/admin/live/events/:id/start", requireAuth, requirePermission(Permission.LIVE_MANAGE), startLiveEvent);
router.post("/admin/live/events/:id/end", requireAuth, requirePermission(Permission.LIVE_MANAGE), endLiveEvent);
router.patch("/admin/live/events/:id/viewers", requireAuth, requirePermission(Permission.LIVE_MANAGE), updateLiveEventViewerCountAdmin);
router.patch("/admin/live/events/:id/replay", requireAuth, requirePermission(Permission.LIVE_MANAGE), updateLiveEventReplayAdmin);
router.patch("/admin/live/events/:id/publish", requireAuth, requirePermission(Permission.LIVE_MANAGE), updateLiveEventPublishAdmin);
router.get("/admin/live/events/:id/sources", requireAuth, requirePermission(Permission.LIVE_MANAGE), listLiveEventSourcesAdmin);
router.post("/admin/live/events/:id/sources", requireAuth, requirePermission(Permission.LIVE_MANAGE), createLiveEventSourceAdmin);
router.post("/admin/live/events/:id/sources/register-third-party", requireAuth, requirePermission(Permission.LIVE_MANAGE), registerLiveEventThirdPartySourceAdmin);
router.patch("/admin/live/events/:id/sources/:sourceId", requireAuth, requirePermission(Permission.LIVE_MANAGE), updateLiveEventSourceAdmin);
router.post("/admin/live/events/:id/sources/:sourceId/heartbeat", requireAuth, requirePermission(Permission.LIVE_MANAGE), heartbeatLiveEventSourceAdmin);
router.delete("/admin/live/events/:id/sources/:sourceId", requireAuth, requirePermission(Permission.LIVE_MANAGE), deleteLiveEventSourceAdmin);
router.post("/admin/live/events/:id/sources/switch", requireAuth, requirePermission(Permission.LIVE_MANAGE), switchLiveEventSourceAdmin);

router.get("/live/events", listLiveEventsPublic);
router.get("/live/events/unlisted/:slug", getLiveEventUnlistedPublic);
router.get("/live/events/:id", getLiveEventPublic);
router.get("/live/events/:id/chat", listLiveChatMessages);
router.post("/live/events/:id/chat", requireAuth, createLiveChatMessage);
router.get("/live/events/:id/reactions", listLiveReactions);
router.post("/live/events/:id/reactions", requireAuth, sendLiveReaction);
router.get("/live/events/:id/engagement", getLiveEngagementSnapshot);
router.post("/live/events/:id/viewer-heartbeat", requireAuth, heartbeatLiveViewer);

router.get("/admin/live/events/:id/chat", requireAuth, requirePermission(Permission.LIVE_MODERATE), listLiveChatMessagesAdmin);
router.patch("/admin/live/events/:id/chat/:messageId", requireAuth, requirePermission(Permission.LIVE_MODERATE), moderateLiveChatMessage);
router.delete("/admin/live/events/:id/chat/:messageId", requireAuth, requirePermission(Permission.LIVE_MODERATE), deleteLiveChatMessage);
router.post("/admin/live/events/:id/chat/mute", requireAuth, requirePermission(Permission.LIVE_MODERATE), muteLiveChatUser);

export default router;

