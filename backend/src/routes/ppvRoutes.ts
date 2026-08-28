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
  createIapIntent,
  verifyIapPurchase,
  paystackWebhook,
  adminListPurchases,
} from "../controllers/ppvController.js";
import { listFxRates, upsertFxRate, deleteFxRate } from "../controllers/fxController.js";
import { requireAuth, requireAdmin, requireAnyPermission, requirePermission } from "../middleware/auth.js";
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
// FX rate overrides for non-NGN PPV pricing.
router.get(
  "/admin/ppv/fx-rates",
  requireAuth,
  requireAdmin,
  requireAnyPermission([Permission.PAYMENTS_VIEW, Permission.PAYMENTS_MANAGE]),
  listFxRates
);
router.put(
  "/admin/ppv/fx-rates",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.PAYMENTS_MANAGE),
  upsertFxRate
);
router.delete(
  "/admin/ppv/fx-rates/:currency",
  requireAuth,
  requireAdmin,
  requirePermission(Permission.PAYMENTS_MANAGE),
  deleteFxRate
);
router.post("/ppv/flutterwave/webhook", flutterwaveWebhook);
router.get("/app-session/ppv/flutterwave/return", flutterwaveAppSessionReturn);
router.post("/ppv/flutterwave/verify", requireAuth, verifyFlutterwavePurchase);
router.post("/app-session/ppv/flutterwave/verify", verifyFlutterwavePurchase);
router.post("/ppv/paystack/initiate", requireAuth, initiatePaystackPurchase);
router.post("/ppv/paystack/verify", requireAuth, verifyPaystackPurchase);
router.post("/ppv/iap/intent", requireAuth, createIapIntent);
router.post("/ppv/iap/verify", requireAuth, verifyIapPurchase);
router.post("/ppv/paystack/webhook", paystackWebhook);

export default router;
