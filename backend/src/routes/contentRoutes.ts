import { Router, raw } from "express";
import {
  requireAdmin,
  requireAuth,
  requirePermission,
  requireAnyPermission,
} from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import {
  listTitles,
  listEpisodesForTitle,
  listPublicTitles,
  searchPublicTitles,
  getTitleWithEpisodes,
  createTitle,
  updateTitle,
  publishTitle,
  presignAsset,
  presignAssetRead,
  uploadAsset,
  streamMediaAsset,
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
router.get("/search/titles", searchPublicTitles);
router.get("/titles/:id", getTitleWithEpisodes);
router.get("/titles/:id/episodes", listEpisodesForTitle);
router.get("/media/stream", streamMediaAsset);

const canReadCatalogue = requireAnyPermission([
  Permission.MOVIES_VIEW,
  Permission.MOVIES_MANAGE,
]);
const canManageCatalogue = requirePermission(Permission.MOVIES_MANAGE);
// Blog cover images and push broadcast images are uploaded through the same asset endpoints.
const canPresignAssets = requireAnyPermission([
  Permission.MOVIES_MANAGE,
  Permission.BLOG_MANAGE,
  Permission.PUSH_MANAGE,
]);

router.get("/admin/titles", requireAuth, requireAdmin, canReadCatalogue, listTitles);
router.get("/admin/titles/:id/episodes", requireAuth, requireAdmin, canReadCatalogue, listEpisodesForTitle);
router.get("/admin/titles/:id/seasons", requireAuth, requireAdmin, canReadCatalogue, listSeasonsForTitle);
router.post("/admin/titles", requireAuth, requireAdmin, canManageCatalogue, createTitle);
router.patch("/admin/titles/:id", requireAuth, requireAdmin, canManageCatalogue, updateTitle);
router.post("/admin/titles/:id/publish", requireAuth, requireAdmin, canManageCatalogue, publishTitle);
router.delete("/admin/titles/:id", requireAuth, requireAdmin, canManageCatalogue, deleteTitle);
router.post("/admin/titles/purge", requireAuth, requireAdmin, canManageCatalogue, purgeAllTitles);
router.post("/admin/titles/:id/episodes", requireAuth, requireAdmin, canManageCatalogue, createEpisode);
router.patch("/admin/episodes/:episodeId", requireAuth, requireAdmin, canManageCatalogue, updateEpisode);
router.delete("/admin/episodes/:episodeId", requireAuth, requireAdmin, canManageCatalogue, deleteEpisode);
router.post("/admin/titles/:id/seasons", requireAuth, requireAdmin, canManageCatalogue, upsertSeasonsForTitle);
router.patch("/admin/seasons/:seasonId", requireAuth, requireAdmin, canManageCatalogue, updateSeason);
router.delete("/admin/seasons/:seasonId", requireAuth, requireAdmin, canManageCatalogue, deleteSeason);
router.post("/admin/assets/presign", requireAuth, requireAdmin, canPresignAssets, presignAsset);
router.post("/admin/assets/get-url", requireAuth, requireAdmin, canPresignAssets, presignAssetRead);
// Raw body: the dashboard posts image bytes directly. Capped well below any
// realistic cover/notification image so this can't be used to push large media.
router.post(
  "/admin/assets/upload",
  requireAuth,
  requireAdmin,
  canPresignAssets,
  raw({ type: "*/*", limit: "8mb" }),
  uploadAsset
);

export default router;
