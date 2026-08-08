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
  campaignStatus,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  retryFailedBatches,
  sendRecentPurchaseEmails,
  sendPendingPurchaseReminders,
  sendUnverifiedAccountReminders,
  sendNewUserPromoEmails,
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

// PPV lifecycle emails: personalized per recipient (their own movie, their
// own days-remaining), so these send individually rather than through the
// generic recipients-array campaign above.
router.post("/admin/email/ppv/recent-purchasers", requireAuth, requireAdmin, canEmail, sendRecentPurchaseEmails);
router.post("/admin/email/ppv/pending-reminders", requireAuth, requireAdmin, canEmail, sendPendingPurchaseReminders);
router.post("/admin/email/account/unverified-reminders", requireAuth, requireAdmin, canEmail, sendUnverifiedAccountReminders);
router.post("/admin/email/new-users/promo", requireAuth, requireAdmin, canEmail, sendNewUserPromoEmails);

// Campaign control: watch a live send and stop it without an engineer.
router.get("/admin/email/campaign/status", requireAuth, requireAdmin, canEmail, campaignStatus);
router.post("/admin/email/campaign/pause", requireAuth, requireAdmin, canEmail, pauseCampaign);
router.post("/admin/email/campaign/resume", requireAuth, requireAdmin, canEmail, resumeCampaign);
router.post("/admin/email/campaign/cancel", requireAuth, requireAdmin, canEmail, cancelCampaign);
router.post("/admin/email/campaign/retry-failed", requireAuth, requireAdmin, canEmail, retryFailedBatches);

export default router;
