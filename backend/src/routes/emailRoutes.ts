import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { sendCampaignEmails, sendTestEmails, listUserRecipients } from "../controllers/emailController.js";

const router = Router();

router.post("/admin/email/test", requireAuth, requireAdmin, sendTestEmails);
router.post("/admin/email/send", requireAuth, requireAdmin, sendCampaignEmails);
router.get("/admin/email/audience/users", requireAuth, requireAdmin, listUserRecipients);

export default router;
