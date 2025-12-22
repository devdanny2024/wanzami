import { Router } from "express";
import { initiatePurchase, paystackWebhook, getAccess, myTitles } from "../controllers/ppvController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/ppv/initiate", requireAuth, initiatePurchase);
router.get("/ppv/access/:titleId", requireAuth, getAccess);
router.get("/ppv/my-titles", requireAuth, myTitles);
router.post("/ppv/paystack/webhook", paystackWebhook);

export default router;
