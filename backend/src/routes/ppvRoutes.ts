import { Router } from "express";
import {
  initiatePurchase,
  initiateOrchestratedPurchase,
  authorizeOrchestratedCharge,
  verifyOrchestratedCharge,
  initiateGeneralPurchase,
  authorizeGeneralCharge,
  verifyGeneralCharge,
  getAccess,
  myTitles,
  flutterwaveWebhook,
  verifyFlutterwavePurchase,
  adminListPurchases,
} from "../controllers/ppvController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/ppv/initiate", requireAuth, initiatePurchase);
router.post("/ppv/orchestrate/initiate", requireAuth, initiateOrchestratedPurchase);
router.post("/ppv/orchestrate/authorize", requireAuth, authorizeOrchestratedCharge);
router.get("/ppv/orchestrate/verify", requireAuth, verifyOrchestratedCharge);
router.post("/ppv/v4/initiate", requireAuth, initiateGeneralPurchase);
router.post("/ppv/v4/authorize", requireAuth, authorizeGeneralCharge);
router.get("/ppv/v4/verify", requireAuth, verifyGeneralCharge);
router.get("/ppv/access/:titleId", requireAuth, getAccess);
router.get("/ppv/my-titles", requireAuth, myTitles);
router.get("/admin/ppv/purchases", requireAuth, requireAdmin, adminListPurchases);
router.post("/ppv/flutterwave/webhook", flutterwaveWebhook);
router.post("/ppv/flutterwave/verify", requireAuth, verifyFlutterwavePurchase);

export default router;
