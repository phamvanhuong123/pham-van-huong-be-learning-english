import { Router } from "express";
import { aiExplanationController } from "@/controllers/aiExplanationController";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();

// Endpoint for AI Question Explanation
// Require authentication
router.post("/explain-question", authenticate, aiExplanationController.explainQuestion);

export default router;
