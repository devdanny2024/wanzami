import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  createLiveEvent,
  createLiveEventSourceAdmin,
  deleteLiveEventAdmin,
  deleteLiveEventSourceAdmin,
  endLiveEvent,
  getLiveEventAdmin,
  getLiveEventPublic,
  getLiveEventUnlistedPublic,
  listLiveEventSourcesAdmin,
  listLiveEventsAdmin,
  listLiveEventsPublic,
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
router.patch("/admin/live/events/:id/sources/:sourceId", requireAuth, requireAdmin, updateLiveEventSourceAdmin);
router.delete("/admin/live/events/:id/sources/:sourceId", requireAuth, requireAdmin, deleteLiveEventSourceAdmin);
router.post("/admin/live/events/:id/sources/switch", requireAuth, requireAdmin, switchLiveEventSourceAdmin);

router.get("/live/events", requireAuth, listLiveEventsPublic);
router.get("/live/events/unlisted/:slug", requireAuth, getLiveEventUnlistedPublic);
router.get("/live/events/:id", requireAuth, getLiveEventPublic);
router.get("/live/events/:id/chat", requireAuth, listLiveChatMessages);
router.post("/live/events/:id/chat", requireAuth, createLiveChatMessage);
router.get("/live/events/:id/reactions", requireAuth, listLiveReactions);
router.post("/live/events/:id/reactions", requireAuth, sendLiveReaction);
router.get("/live/events/:id/engagement", requireAuth, getLiveEngagementSnapshot);

router.get("/admin/live/events/:id/chat", requireAuth, requireAdmin, listLiveChatMessagesAdmin);
router.patch("/admin/live/events/:id/chat/:messageId", requireAuth, requireAdmin, moderateLiveChatMessage);
router.delete("/admin/live/events/:id/chat/:messageId", requireAuth, requireAdmin, deleteLiveChatMessage);
router.post("/admin/live/events/:id/chat/mute", requireAuth, requireAdmin, muteLiveChatUser);

export default router;

