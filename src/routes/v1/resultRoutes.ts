import { Router } from "express";
import { resultController } from "@/controllers/resultController";
import { authenticate } from "@/middlewares/authenticate";

const route = Router();

route.use(authenticate);

// ─── QUAN TRỌNG: specific routes TRƯỚC wildcard routes ───────
route.get("/history", resultController.getHistory);
route.get("/:id", resultController.getResultDetail);
route.get("/:id/review", resultController.getReview);

export default route;
