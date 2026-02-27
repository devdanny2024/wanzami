import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
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
router.post("/admin/live/events/:id/sources/register-third-party", requireAuth, requireAdmin, registerLiveEventThirdPartySourceAdmin);
router.patch("/admin/live/events/:id/sources/:sourceId", requireAuth, requireAdmin, updateLiveEventSourceAdmin);
router.post("/admin/live/events/:id/sources/:sourceId/heartbeat", requireAuth, requireAdmin, heartbeatLiveEventSourceAdmin);
router.delete("/admin/live/events/:id/sources/:sourceId", requireAuth, requireAdmin, deleteLiveEventSourceAdmin);
router.post("/admin/live/events/:id/sources/switch", requireAuth, requireAdmin, switchLiveEventSourceAdmin);

router.get("/live/events", listLiveEventsPublic);
router.get("/live/events/unlisted/:slug", getLiveEventUnlistedPublic);
router.get("/live/events/:id", getLiveEventPublic);
router.get("/live/events/:id/chat", listLiveChatMessages);
router.post("/live/events/:id/chat", requireAuth, createLiveChatMessage);
router.get("/live/events/:id/reactions", listLiveReactions);
router.post("/live/events/:id/reactions", requireAuth, sendLiveReaction);
router.get("/live/events/:id/engagement", getLiveEngagementSnapshot);
router.post("/live/events/:id/viewer-heartbeat", requireAuth, heartbeatLiveViewer);

router.get("/admin/live/events/:id/chat", requireAuth, requireAdmin, listLiveChatMessagesAdmin);
router.patch("/admin/live/events/:id/chat/:messageId", requireAuth, requireAdmin, moderateLiveChatMessage);
router.delete("/admin/live/events/:id/chat/:messageId", requireAuth, requireAdmin, deleteLiveChatMessage);
router.post("/admin/live/events/:id/chat/mute", requireAuth, requireAdmin, muteLiveChatUser);

export default router;

