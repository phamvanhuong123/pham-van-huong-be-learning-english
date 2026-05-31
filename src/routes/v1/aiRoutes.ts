import { Router } from "express";
import { aiExplanationController } from "@/controllers/aiExplanationController";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();


router.post("/explain-question", authenticate, aiExplanationController.explainQuestion);
router.post("/follow-up", authenticate, aiExplanationController.askFollowUp);
router.post("/takeaway", authenticate, aiExplanationController.generateTakeaway);

export default router;
