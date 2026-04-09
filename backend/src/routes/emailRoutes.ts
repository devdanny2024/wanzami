import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { sendCampaignEmails, sendTestEmails, listUserRecipients, getEmailTemplate } from "../controllers/emailController.js";

const router = Router();

router.get("/admin/email/templates/:key", requireAuth, requireAdmin, getEmailTemplate);
router.post("/admin/email/test", requireAuth, requireAdmin, sendTestEmails);
router.post("/admin/email/send", requireAuth, requireAdmin, sendCampaignEmails);
router.get("/admin/email/audience/users", requireAuth, requireAdmin, listUserRecipients);

export default router;
