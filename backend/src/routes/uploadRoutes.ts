import { Router } from "express";
import { requireAdmin, requireAuth, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import {
  initUpload,
  updateUploadProgress,
  completeUpload,
  listUploads,
  resumeUpload,
  retryTranscode,
  backfillTranscodes,
} from "../controllers/uploadController.js";

const router = Router();

// Uploads feed the video catalogue; same grant as managing titles.
const canAccess = requirePermission(Permission.MOVIES_MANAGE);

router.post("/admin/uploads/init", requireAuth, requireAdmin, canAccess, initUpload);
router.patch("/admin/uploads/:id/progress", requireAuth, requireAdmin, canAccess, updateUploadProgress);
router.post("/admin/uploads/:id/complete", requireAuth, requireAdmin, canAccess, completeUpload);
router.post("/admin/uploads/:id/resume", requireAuth, requireAdmin, canAccess, resumeUpload);
router.get("/admin/uploads", requireAuth, requireAdmin, canAccess, listUploads);
router.post("/admin/uploads/:id/retry", requireAuth, requireAdmin, canAccess, retryTranscode);
router.post("/admin/uploads/backfill-transcodes", requireAuth, requireAdmin, canAccess, backfillTranscodes);

export default router;
