import { Router } from "express";
import { initiatePurchase, getAccess, myTitles, flutterwaveWebhook, adminListPurchases } from "../controllers/ppvController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/ppv/initiate", requireAuth, initiatePurchase);
router.get("/ppv/access/:titleId", requireAuth, getAccess);
router.get("/ppv/my-titles", requireAuth, myTitles);
router.get("/admin/ppv/purchases", requireAuth, requireAdmin, adminListPurchases);
router.post("/ppv/flutterwave/webhook", flutterwaveWebhook);

export default router;
