import { Router } from "express";
import { questionController } from "@/controllers/questionController";
import { questionValidator } from "@/validators/questionValidator";
import { uploadSingleMedia } from "@/middlewares/uploadMiddleware";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";

const route = Router();

route.post("/upload", authenticate, authorize('question.manage'), uploadSingleMedia, questionController.uploadMedia);

route.post(
  "/standalone",
  authenticate,
  authorize('question.manage'),
  questionValidator.createStandaloneQuestion,
  questionController.createStandaloneQuestion
);

// ─── Nhóm câu hỏi – Part 1, 2, 3, 4, 6, 7 ───────────────────────
// POST /question/group
route.post(
  "/group",
  authenticate,
  authorize('question.manage'),
  questionValidator.createQuestionGroup,
  questionController.createQuestionGroup
);

// GET /question/group/:groupId
route.get("/group/:groupId", questionController.getGroupDetail);

// PATCH /question/group/:groupId
route.patch(
  "/group/:groupId",
  authenticate,
  authorize('question.manage'),
  questionValidator.updatePassageGroup,
  questionController.updatePassageGroup
);

// DELETE /question/group/:groupId
route.delete("/group/:groupId", authenticate, authorize('question.manage'), questionController.deleteQuestionGroup);

// ─── Lấy danh sách câu hỏi toàn hệ thống ──────────────────────────
// GET /question
route.get("/", questionController.getQuestions);

// ─── Câu hỏi theo đề thi ─────────────────────────────────────────
// GET /question/exam/:examId
route.get("/exam/:examId", questionController.getQuestionsByExam);

// ─── Câu hỏi đơn lẻ – phải đặt SAU các route cụ thể ─────────────
// (tránh Express match 'group' hay 'exam' như một :id param)
// GET /question/:id/note
route.get("/:id/note", authenticate, questionController.getNote);

// POST /question/:id/note
route.post("/:id/note", authenticate, questionController.upsertNote);

// DELETE /question/:id/note
route.delete("/:id/note", authenticate, questionController.deleteNote);

// GET /question/:id
route.get("/:id", questionController.getQuestionDetail);

// PATCH /question/:id
route.patch("/:id", authenticate, authorize('question.manage'), questionValidator.updateQuestion, questionController.updateQuestion);

// DELETE /question/:id
route.delete("/:id", authenticate, authorize('question.manage'), questionController.deleteQuestion);

export default route;
