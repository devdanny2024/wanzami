import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  listTitles,
  listEpisodesForTitle,
  createTitle,
  updateTitle,
  presignAsset,
} from "../controllers/contentController.js";

const router = Router();

router.get("/admin/titles", requireAuth, requireAdmin, listTitles);
router.get("/admin/titles/:id/episodes", requireAuth, requireAdmin, listEpisodesForTitle);
router.post("/admin/titles", requireAuth, requireAdmin, createTitle);
router.patch("/admin/titles/:id", requireAuth, requireAdmin, updateTitle);
router.post("/admin/assets/presign", requireAuth, requireAdmin, presignAsset);

export default router;
