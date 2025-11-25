import { Router } from "express";
import {
  adminLogin,
  login,
  logout,
  me,
  refresh,
  signup,
  verifyEmail,
  resendVerification,
  updateDeviceLabel,
  inviteAdmin,
  listInvites,
  revokeInvite,
  acceptInvite,
  listAdminUsers,
  updateUserRole,
  deleteUser,
  listAllUsers,
} from "../controllers/authController.js";
import {
  requireAdmin,
  requireAuth,
  requirePermission,
} from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";

const router = Router();

// Public auth
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/refresh", refresh);
router.post("/auth/logout", logout);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-verification", resendVerification);
router.post("/auth/device-label", requireAuth, updateDeviceLabel);
router.get("/auth/me", requireAuth, me);

// Admin auth (same service but locked down)
router.post("/admin/login", adminLogin);
router.get(
  "/admin/me",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.DASHBOARD_VIEW),
  me
);
router.post("/admin/logout", requireAuth, requireAdmin, logout);

// Admin invitations and team management
router.post(
  "/admin/invitations",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.ADMIN_INVITES_MANAGE),
  inviteAdmin
);
router.get(
  "/admin/invitations",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.ADMIN_INVITES_MANAGE),
  listInvites
);
router.delete(
  "/admin/invitations/:id",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.ADMIN_INVITES_MANAGE),
  revokeInvite
);
router.post("/admin/invitations/accept", acceptInvite);

router.get(
  "/admin/users",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.ADMIN_USERS_MANAGE),
  listAdminUsers
);
router.get(
  "/admin/users/all",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.ADMIN_USERS_MANAGE),
  listAllUsers
);
router.patch(
  "/admin/users/:id/role",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.ADMIN_USERS_MANAGE),
  updateUserRole
);
router.delete(
  "/admin/users/:id",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.ADMIN_USERS_MANAGE),
  deleteUser
);

export default router;
