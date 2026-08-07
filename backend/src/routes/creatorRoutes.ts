import { Router } from "express";
import { requireAuth, requireAdmin, requirePermission } from "../middleware/auth.js";
import { requireCreatorAuth } from "../middleware/creatorAuth.js";
import { Permission } from "../auth/permissions.js";
import {
  submitApplication,
  listApplications,
  approveApplication,
  rejectApplication,
  getCreatorInviteByToken,
  setCreatorPassword,
  creatorLogin,
  refreshCreatorSession,
  getCreatorMe,
  listCreatorSubmissions,
  createCreatorSubmission,
  getSubmissionPartUrls,
  completeCreatorSubmission,
} from "../controllers/creatorController.js";

const router = Router();

const canManageCreators = requirePermission(Permission.CREATORS_MANAGE);

// Public: application intake and account setup (creator.wanzami.tv).
router.post("/creators/apply", submitApplication);
router.get("/creators/invite", getCreatorInviteByToken);
router.post("/creators/set-password", setCreatorPassword);
router.post("/creators/login", creatorLogin);
router.post("/creators/refresh", refreshCreatorSession);

// Creator dashboard: requires a creator session, not an admin/user one.
router.get("/creators/me", requireCreatorAuth, getCreatorMe);
router.get("/creators/submissions", requireCreatorAuth, listCreatorSubmissions);
router.post("/creators/submissions", requireCreatorAuth, createCreatorSubmission);
router.post("/creators/submissions/:id/parts", requireCreatorAuth, getSubmissionPartUrls);
router.post("/creators/submissions/:id/complete", requireCreatorAuth, completeCreatorSubmission);

// Admin: review queue.
router.get("/admin/creators/applications", requireAuth, requireAdmin, canManageCreators, listApplications);
router.post("/admin/creators/applications/:id/approve", requireAuth, requireAdmin, canManageCreators, approveApplication);
router.post("/admin/creators/applications/:id/reject", requireAuth, requireAdmin, canManageCreators, rejectApplication);

export default router;
