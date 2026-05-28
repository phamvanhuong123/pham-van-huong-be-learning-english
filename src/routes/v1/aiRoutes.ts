import { Router } from "express";
import { aiExplanationController } from "@/controllers/aiExplanationController";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();

// Endpoint for AI Question Explanation
// Require authentication
router.post("/explain-question", authenticate, aiExplanationController.explainQuestion);

// Endpoint for AI Follow-up (Stateless)
router.post("/follow-up", authenticate, aiExplanationController.askFollowUp);

// Endpoint for generating takeaway
router.post("/takeaway", authenticate, aiExplanationController.generateTakeaway);

export default router;
