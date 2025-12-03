import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { becauseYouWatched, continueWatching, forYou } from "../controllers/recommendationController.js";
const router = Router();
router.get("/recs/continue-watching", requireAuth, continueWatching);
router.get("/recs/because-you-watched", requireAuth, becauseYouWatched);
router.get("/recs/for-you", requireAuth, forYou);
export default router;
