import { Router } from "express";
import { clientExamController } from "@/controllers/clientExamController";

const route = Router();

route.get("/", clientExamController.getPublishedExams);
route.get("/:id", clientExamController.getExamDetailsForClient);

route.post("/:id/start", clientExamController.startExam);
route.post("/:id/autosave", clientExamController.autoSaveExam);
route.post("/:id/submit", clientExamController.submitExam);

export default route;
