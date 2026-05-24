import { Router } from "express";
import { questionController } from "@/controllers/questionController";
import { questionValidator } from "@/validators/questionValidator";
import { uploadSingleMedia } from "@/middlewares/uploadMiddleware";

const route = Router();

// ─── Upload media ─────────────────────────────────────────────────
// POST /question/upload – upload 1 file, nhận về URL để dùng khi tạo câu hỏi
route.post("/upload", uploadSingleMedia, questionController.uploadMedia);

// ─── Câu hỏi đơn – Part 5 ────────────────────────────────────────
// POST /question/standalone
route.post(
  "/standalone",
  questionValidator.createStandaloneQuestion,
  questionController.createStandaloneQuestion
);

// ─── Nhóm câu hỏi – Part 1, 2, 3, 4, 6, 7 ───────────────────────
// POST /question/group
route.post(
  "/group",
  questionValidator.createQuestionGroup,
  questionController.createQuestionGroup
);

// GET /question/group/:groupId
route.get("/group/:groupId", questionController.getGroupDetail);

// PATCH /question/group/:groupId
route.patch(
  "/group/:groupId",
  questionValidator.updatePassageGroup,
  questionController.updatePassageGroup
);

// DELETE /question/group/:groupId
route.delete("/group/:groupId", questionController.deleteQuestionGroup);

// ─── Lấy danh sách câu hỏi toàn hệ thống ──────────────────────────
// GET /question
route.get("/", questionController.getQuestions);

// ─── Câu hỏi theo đề thi ─────────────────────────────────────────
// GET /question/exam/:examId
route.get("/exam/:examId", questionController.getQuestionsByExam);

// ─── Câu hỏi đơn lẻ – phải đặt SAU các route cụ thể ─────────────
// (tránh Express match 'group' hay 'exam' như một :id param)

// GET /question/:id
route.get("/:id", questionController.getQuestionDetail);

// PATCH /question/:id
route.patch("/:id", questionValidator.updateQuestion, questionController.updateQuestion);

// DELETE /question/:id
route.delete("/:id", questionController.deleteQuestion);

export default route;