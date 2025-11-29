import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  listTitles,
  listEpisodesForTitle,
  createTitle,
  updateTitle,
  presignAsset,
  deleteTitle,
  createEpisode,
  updateEpisode,
} from "../controllers/contentController.js";

const router = Router();

router.get("/admin/titles", requireAuth, requireAdmin, listTitles);
router.get("/admin/titles/:id/episodes", requireAuth, requireAdmin, listEpisodesForTitle);
router.post("/admin/titles", requireAuth, requireAdmin, createTitle);
router.patch("/admin/titles/:id", requireAuth, requireAdmin, updateTitle);
router.delete("/admin/titles/:id", requireAuth, requireAdmin, deleteTitle);
router.post("/admin/titles/:id/episodes", requireAuth, requireAdmin, createEpisode);
router.patch("/admin/episodes/:episodeId", requireAuth, requireAdmin, updateEpisode);
router.post("/admin/assets/presign", requireAuth, requireAdmin, presignAsset);

export default router;
