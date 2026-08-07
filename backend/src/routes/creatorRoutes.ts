import { Router } from "express";
import { requireAuth, requireAdmin, requirePermission } from "../middleware/auth.js";
import { requireCreatorAuth } from "../middleware/creatorAuth.js";
import { Permission } from "../auth/permissions.js";
import {
  creatorSignup,
  creatorLogin,
  refreshCreatorSession,
  getCreatorMe,
  updateCreatorCredentials,
  completeCreatorOnboarding,
  listCreatorSubmissions,
  getSubmissionAnalytics,
  createCreatorSubmission,
  getSubmissionPartUrls,
  completeCreatorSubmission,
  listSubmissionsForReview,
  approveSubmission,
  rejectSubmission,
} from "../controllers/creatorController.js";

const router = Router();

const canManageCreators = requirePermission(Permission.CREATORS_MANAGE);

// Public: signup and login (creator.wanzami.tv). Account exists immediately,
// no admin review before this point — review happens per movie, below.
router.post("/creators/signup", creatorSignup);
router.post("/creators/login", creatorLogin);
router.post("/creators/refresh", refreshCreatorSession);

// Creator dashboard: requires a creator session, not an admin/user one.
router.get("/creators/me", requireCreatorAuth, getCreatorMe);
router.patch("/creators/me/credentials", requireCreatorAuth, updateCreatorCredentials);
router.post("/creators/me/onboarding-complete", requireCreatorAuth, completeCreatorOnboarding);
router.get("/creators/submissions", requireCreatorAuth, listCreatorSubmissions);
router.get("/creators/submissions/:id/analytics", requireCreatorAuth, getSubmissionAnalytics);
router.post("/creators/submissions", requireCreatorAuth, createCreatorSubmission);
router.post("/creators/submissions/:id/parts", requireCreatorAuth, getSubmissionPartUrls);
router.post("/creators/submissions/:id/complete", requireCreatorAuth, completeCreatorSubmission);

// Admin: submission review queue — the only approval gate.
router.get("/admin/creators/submissions", requireAuth, requireAdmin, canManageCreators, listSubmissionsForReview);
router.post("/admin/creators/submissions/:id/approve", requireAuth, requireAdmin, canManageCreators, approveSubmission);
router.post("/admin/creators/submissions/:id/reject", requireAuth, requireAdmin, canManageCreators, rejectSubmission);

export default router;
