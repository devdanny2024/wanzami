import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { supportTicketRateLimit } from "../middleware/rateLimit.js";
import {
  createSupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
  listSupportTicketMessages,
  addSupportTicketReply,
} from "../controllers/supportController.js";

const router = Router();

// Public endpoint for customers to create tickets.
router.post("/support/tickets", supportTicketRateLimit, createSupportTicket);

// Admin endpoints to view and update tickets.
router.get("/admin/support/tickets", requireAuth, requireAdmin, listSupportTickets);
router.patch("/admin/support/tickets/:id", requireAuth, requireAdmin, updateSupportTicketStatus);
router.get("/admin/support/tickets/:id/messages", requireAuth, requireAdmin, listSupportTicketMessages);
router.post("/admin/support/tickets/:id/messages", requireAuth, requireAdmin, addSupportTicketReply);

export default router;
