import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { adminDashboardSummary } from "../controllers/dashboardController.js";

const router = Router();

router.get(
  "/admin/dashboard/summary",
  requireAuth,
  requireAdmin,
  adminDashboardSummary
);

export default router;

