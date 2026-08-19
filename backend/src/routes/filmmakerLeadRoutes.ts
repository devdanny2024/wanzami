import { Router } from "express";
import { requireAuth, requireAdmin, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import {
  importFilmmakerLeads,
  listFilmmakerLeads,
} from "../controllers/filmmakerLeadController.js";

const router = Router();

// Machine-to-machine: the scraper posts here with a shared token, not a session.
router.post("/admin/filmmaker-leads/import", importFilmmakerLeads);

// Human: reuses CREATORS_MANAGE because this list exists to recruit creators.
router.get(
  "/admin/filmmaker-leads",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.CREATORS_MANAGE),
  listFilmmakerLeads
);

export default router;
