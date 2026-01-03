import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { sendCampaignEmails, sendTestEmails } from "../controllers/emailController.js";

const router = Router();

router.post("/admin/email/test", requireAuth, requireAdmin, sendTestEmails);
router.post("/admin/email/send", requireAuth, requireAdmin, sendCampaignEmails);

export default router;
