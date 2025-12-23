import { Router } from "express";
import { initiatePurchase, paystackWebhook, getAccess, myTitles, flutterwaveWebhook, adminListPurchases } from "../controllers/ppvController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/ppv/initiate", requireAuth, initiatePurchase);
router.get("/ppv/access/:titleId", requireAuth, getAccess);
router.get("/ppv/my-titles", requireAuth, myTitles);
router.get("/admin/ppv/purchases", requireAuth, requireAdmin, adminListPurchases);
router.post("/ppv/paystack/webhook", paystackWebhook);
// Optional GET handler so user-facing redirects don't 404; webhook remains POST-only.
router.get("/ppv/paystack/webhook", (_req, res) =>
  res.json({ message: "Paystack webhook endpoint is POST-only. Payment received, please wait for confirmation." })
);
router.post("/ppv/flutterwave/webhook", flutterwaveWebhook);

export default router;
