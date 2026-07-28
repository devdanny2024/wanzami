import { Router } from "express";
import { requireAdmin, requireAuth, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import {
  sendCampaignEmails,
  sendTestEmails,
  listUserRecipients,
  getEmailTemplate,
  importUserRecipients,
  listSentRecipientHistory,
} from "../controllers/emailController.js";

const router = Router();

// Campaign tooling reaches every subscriber we have, so it stays behind an
// explicit grant rather than the blanket admin gate.
const canEmail = requirePermission(Permission.EMAIL_MANAGE);

router.get("/admin/email/templates/:key", requireAuth, requireAdmin, canEmail, getEmailTemplate);
router.post("/admin/email/test", requireAuth, requireAdmin, canEmail, sendTestEmails);
router.post("/admin/email/send", requireAuth, requireAdmin, canEmail, sendCampaignEmails);
router.get("/admin/email/audience/users", requireAuth, requireAdmin, canEmail, listUserRecipients);
router.post("/admin/email/audience/import", requireAuth, requireAdmin, canEmail, importUserRecipients);
router.get("/admin/email/history/recipients", requireAuth, requireAdmin, canEmail, listSentRecipientHistory);

export default router;
