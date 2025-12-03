import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ingestEvents } from "../controllers/eventController.js";
const router = Router();
router.post("/events", requireAuth, ingestEvents);
export default router;
