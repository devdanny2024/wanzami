import { Router, raw } from "express";
import { requireAuth, requireAdmin, requirePermission } from "../middleware/auth.js";
import { requireCreatorAuth } from "../middleware/creatorAuth.js";
import { Permission } from "../auth/permissions.js";
import {
  creatorSignup,
  creatorLogin,
  refreshCreatorSession,
  getCreatorMe,
  updateCreatorCredentials,
  updateCreatorProfile,
  updateCreatorPayoutDetails,
  uploadCreatorAvatar,
  completeCreatorOnboarding,
  listCreatorSubmissions,
  getCreatorSubmission,
  createDraftSubmission,
  updateDraftSubmission,
  deleteDraftSubmission,
  startMasterUpload,
  getMasterPartUrls,
  completeMasterUpload,
  startTrailerUpload,
  getTrailerPartUrls,
  completeTrailerUpload,
  uploadSubmissionPoster,
  uploadSubmissionDocument,
  deleteSubmissionDocument,
  submitSubmissionForReview,
  getSubmissionAnalytics,
  listCreatorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getCreatorEarnings,
  getPublicCreatorProfile,
  getPublicCreatorForTitle,
  listSubmissionsForReview,
  approveSubmission,
  rejectSubmission,
  markSubmissionInReview,
  listCreatorPayoutsAdmin,
  createCreatorPayoutAdmin,
} from "../controllers/creatorController.js";

const router = Router();

const canManageCreators = requirePermission(Permission.CREATORS_MANAGE);
// Small-file uploads (avatar, poster, documents): raw body, 20MB cap —
// comfortably fits a poster image or a scanned PDF, nowhere near enough for
// a film master or trailer (those use the multipart flow below).
const rawUpload = raw({ type: "*/*", limit: "20mb" });

// Public: signup and login (creator.wanzami.tv). Account exists immediately,
// no admin review before this point — review happens per movie, below.
router.post("/creators/signup", creatorSignup);
router.post("/creators/login", creatorLogin);
router.post("/creators/refresh", refreshCreatorSession);

// Public: creator profile pages and the "about the creator" tie-in on a
// title's page.
router.get("/creators/:id/public", getPublicCreatorProfile);
router.get("/creators/by-title/:titleId/public", getPublicCreatorForTitle);

// Creator dashboard: requires a creator session, not an admin/user one.
router.get("/creators/me", requireCreatorAuth, getCreatorMe);
router.patch("/creators/me/credentials", requireCreatorAuth, updateCreatorCredentials);
router.patch("/creators/me/profile", requireCreatorAuth, updateCreatorProfile);
router.patch("/creators/me/payout-details", requireCreatorAuth, updateCreatorPayoutDetails);
router.post("/creators/me/avatar", requireCreatorAuth, rawUpload, uploadCreatorAvatar);
router.post("/creators/me/onboarding-complete", requireCreatorAuth, completeCreatorOnboarding);
router.get("/creators/me/earnings", requireCreatorAuth, getCreatorEarnings);

router.get("/creators/notifications", requireCreatorAuth, listCreatorNotifications);
router.post("/creators/notifications/:id/read", requireCreatorAuth, markNotificationRead);
router.post("/creators/notifications/read-all", requireCreatorAuth, markAllNotificationsRead);

router.get("/creators/submissions", requireCreatorAuth, listCreatorSubmissions);
router.post("/creators/submissions", requireCreatorAuth, createDraftSubmission);
router.get("/creators/submissions/:id", requireCreatorAuth, getCreatorSubmission);
router.patch("/creators/submissions/:id", requireCreatorAuth, updateDraftSubmission);
router.delete("/creators/submissions/:id", requireCreatorAuth, deleteDraftSubmission);
router.post("/creators/submissions/:id/submit", requireCreatorAuth, submitSubmissionForReview);
router.get("/creators/submissions/:id/analytics", requireCreatorAuth, getSubmissionAnalytics);

router.post("/creators/submissions/:id/master/start", requireCreatorAuth, startMasterUpload);
router.post("/creators/submissions/:id/master/parts", requireCreatorAuth, getMasterPartUrls);
router.post("/creators/submissions/:id/master/complete", requireCreatorAuth, completeMasterUpload);
router.post("/creators/submissions/:id/trailer/start", requireCreatorAuth, startTrailerUpload);
router.post("/creators/submissions/:id/trailer/parts", requireCreatorAuth, getTrailerPartUrls);
router.post("/creators/submissions/:id/trailer/complete", requireCreatorAuth, completeTrailerUpload);
router.post("/creators/submissions/:id/poster", requireCreatorAuth, rawUpload, uploadSubmissionPoster);
router.post("/creators/submissions/:id/documents", requireCreatorAuth, rawUpload, uploadSubmissionDocument);
router.delete("/creators/submissions/:id/documents/:docId", requireCreatorAuth, deleteSubmissionDocument);

// Admin: submission review queue — the only approval gate.
router.get("/admin/creators/submissions", requireAuth, requireAdmin, canManageCreators, listSubmissionsForReview);
router.post("/admin/creators/submissions/:id/approve", requireAuth, requireAdmin, canManageCreators, approveSubmission);
router.post("/admin/creators/submissions/:id/reject", requireAuth, requireAdmin, canManageCreators, rejectSubmission);
router.post("/admin/creators/submissions/:id/in-review", requireAuth, requireAdmin, canManageCreators, markSubmissionInReview);

// Admin: manual payout logging (statement view, no real transfer wired yet).
router.get("/admin/creators/:creatorId/payouts", requireAuth, requireAdmin, canManageCreators, listCreatorPayoutsAdmin);
router.post("/admin/creators/:creatorId/payouts", requireAuth, requireAdmin, canManageCreators, createCreatorPayoutAdmin);

export default router;
