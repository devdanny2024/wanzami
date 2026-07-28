import { Router } from "express";
import { requireAdmin, requireAuth, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import { adminDashboardSummary } from "../controllers/dashboardController.js";

const router = Router();

router.get(
  "/admin/dashboard/summary",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.DASHBOARD_VIEW),
  adminDashboardSummary
);

export default router;

