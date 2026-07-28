import { Router } from "express";
import { requireAdmin, requireAuth, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import { supportTicketRateLimit } from "../middleware/rateLimit.js";
import {
  createSupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
  listSupportTicketMessages,
  addSupportTicketReply,
} from "../controllers/supportController.js";

const router = Router();

// Support tickets carry customer PII.
const canAccess = requirePermission(Permission.MODERATION_MANAGE);

// Public endpoint for customers to create tickets.
router.post("/support/tickets", supportTicketRateLimit, createSupportTicket);

// Admin endpoints to view and update tickets.
router.get("/admin/support/tickets", requireAuth, requireAdmin, canAccess, listSupportTickets);
router.patch("/admin/support/tickets/:id", requireAuth, requireAdmin, canAccess, updateSupportTicketStatus);
router.get("/admin/support/tickets/:id/messages", requireAuth, requireAdmin, canAccess, listSupportTicketMessages);
router.post("/admin/support/tickets/:id/messages", requireAuth, requireAdmin, canAccess, addSupportTicketReply);

export default router;
