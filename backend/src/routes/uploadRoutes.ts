import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  initUpload,
  updateUploadProgress,
  completeUpload,
  listUploads,
  resumeUpload,
  retryTranscode,
} from "../controllers/uploadController.js";

const router = Router();

router.post("/admin/uploads/init", requireAuth, requireAdmin, initUpload);
router.patch("/admin/uploads/:id/progress", requireAuth, requireAdmin, updateUploadProgress);
router.post("/admin/uploads/:id/complete", requireAuth, requireAdmin, completeUpload);
router.post("/admin/uploads/:id/resume", requireAuth, requireAdmin, resumeUpload);
router.get("/admin/uploads", requireAuth, requireAdmin, listUploads);
router.post("/admin/uploads/:id/retry", requireAuth, requireAdmin, retryTranscode);

export default router;
