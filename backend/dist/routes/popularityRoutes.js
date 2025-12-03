import { Router } from "express";
import { getPopularity } from "../controllers/popularityController.js";
const router = Router();
// Public endpoint for Top 10 / Trending snapshots
router.get("/popularity", getPopularity);
export default router;
