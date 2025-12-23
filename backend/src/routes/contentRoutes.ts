import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  listTitles,
  listEpisodesForTitle,
  listPublicTitles,
  getTitleWithEpisodes,
  createTitle,
  updateTitle,
  publishTitle,
  presignAsset,
  presignAssetRead,
  deleteTitle,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  listSeasonsForTitle,
  upsertSeasonsForTitle,
  updateSeason,
  deleteSeason,
  purgeAllTitles,
} from "../controllers/contentController.js";

const router = Router();

// Public catalog
router.get("/titles", listPublicTitles);
router.get("/titles/:id", getTitleWithEpisodes);
router.get("/titles/:id/episodes", listEpisodesForTitle);

router.get("/admin/titles", requireAuth, requireAdmin, listTitles);
router.get("/admin/titles/:id/episodes", requireAuth, requireAdmin, listEpisodesForTitle);
router.get("/admin/titles/:id/seasons", requireAuth, requireAdmin, listSeasonsForTitle);
router.post("/admin/titles", requireAuth, requireAdmin, createTitle);
router.patch("/admin/titles/:id", requireAuth, requireAdmin, updateTitle);
router.post("/admin/titles/:id/publish", requireAuth, requireAdmin, publishTitle);
router.delete("/admin/titles/:id", requireAuth, requireAdmin, deleteTitle);
router.post("/admin/titles/purge", requireAuth, requireAdmin, purgeAllTitles);
router.post("/admin/titles/:id/episodes", requireAuth, requireAdmin, createEpisode);
router.patch("/admin/episodes/:episodeId", requireAuth, requireAdmin, updateEpisode);
router.delete("/admin/episodes/:episodeId", requireAuth, requireAdmin, deleteEpisode);
router.post("/admin/titles/:id/seasons", requireAuth, requireAdmin, upsertSeasonsForTitle);
router.patch("/admin/seasons/:seasonId", requireAuth, requireAdmin, updateSeason);
router.delete("/admin/seasons/:seasonId", requireAuth, requireAdmin, deleteSeason);
router.post("/admin/assets/presign", requireAuth, requireAdmin, presignAsset);
router.post("/admin/assets/get-url", requireAuth, requireAdmin, presignAssetRead);

export default router;
