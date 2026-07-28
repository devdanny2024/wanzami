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
  flutterwaveAppSessionReturn,
  verifyFlutterwavePurchase,
  initiatePaystackPurchase,
  verifyPaystackPurchase,
  paystackWebhook,
  adminListPurchases,
} from "../controllers/ppvController.js";
import { requireAuth, requireAdmin, requireAnyPermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";

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
// Purchase records are revenue data.
router.get(
  "/admin/ppv/purchases",
  requireAuth,
  requireAdmin,
  requireAnyPermission([Permission.PAYMENTS_VIEW, Permission.PAYMENTS_MANAGE]),
  adminListPurchases
);
router.post("/ppv/flutterwave/webhook", flutterwaveWebhook);
router.get("/app-session/ppv/flutterwave/return", flutterwaveAppSessionReturn);
router.post("/ppv/flutterwave/verify", requireAuth, verifyFlutterwavePurchase);
router.post("/app-session/ppv/flutterwave/verify", verifyFlutterwavePurchase);
router.post("/ppv/paystack/initiate", requireAuth, initiatePaystackPurchase);
router.post("/ppv/paystack/verify", requireAuth, verifyPaystackPurchase);
router.post("/ppv/paystack/webhook", paystackWebhook);

export default router;
