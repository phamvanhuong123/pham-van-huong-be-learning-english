import { Router } from "express";
import { clientExamController } from "@/controllers/clientExamController";
import { authenticate } from "@/middlewares/authenticate";

const route = Router();

route.get("/", clientExamController.getPublishedExams);
route.get("/:id", clientExamController.getExamDetailsForClient);

route.post("/:id/start", authenticate, clientExamController.startExam);
route.post("/:id/autosave", authenticate, clientExamController.autoSaveExam);
route.post("/:id/submit", authenticate, clientExamController.submitExam);

export default route;
