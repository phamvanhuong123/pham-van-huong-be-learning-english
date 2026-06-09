import { ExamPart, QuestionDifficulty, OptionLabel } from "./exam.types";

export type PassageType = "SINGLE" | "DOUBLE" | "TRIPLE";
export type MediaType = "TEXT" | "AUDIO" | "IMAGE" | "VIDEO";

// ─── Option ───────────────────────────────────────────────────────
export interface OptionPayload {
  label: OptionLabel;
  text: string;
  isCorrect: boolean;
}

// ─── Passage (text hoặc media URL đã upload lên Cloudinary) ──────
export interface PassagePayload {
  content?: string;     // Nội dung text (Part 6, 7)
  transcript?: string;  // Lời thoại (Part 3, 4) hoặc Bản dịch (Part 6, 7)
  mediaUrl?: string;    // URL từ Cloudinary (Part 1, 2, 3, 4)
  mediaType: MediaType;
  order: number;
}

// ─── Câu hỏi đơn trong một nhóm ──────────────────────────────────
export interface QuestionPayload {
  questionText?: string; // null/undefined = ẩn câu hỏi (Part 1, 2)
  difficulty?: QuestionDifficulty;
  explanation?: string;
  order: number;
  options: OptionPayload[];
}

// ─── Upload 1 file media ─────────────────────────────────────────
export interface UploadMediaResponse {
  url: string;
  mediaType: MediaType;
  format: string;
  bytes: number;
  duration?: number;
}

// ─── Tạo câu hỏi đơn – Part 5 (standalone, không có PassageGroup) ─
export interface CreateStandaloneQuestionBody {
  examId: string;           // bắt buộc – xác định part qua exam
  grammarTopicId?: string;
  questionText: string;     // Part 5 bắt buộc hiển thị câu hỏi
  difficulty?: QuestionDifficulty;
  explanation?: string;
  order: number;
  options: OptionPayload[];
}


export interface CreateQuestionGroupBody {
  examId: string;           // bắt buộc – xác định part và validate rule
  passageType?: PassageType; // SINGLE | DOUBLE | TRIPLE (Part 7)
  passages: PassagePayload[];
  questions: QuestionPayload[];
}


export interface UpdateQuestionBody {
  questionText?: string | null;
  difficulty?: QuestionDifficulty;
  explanation?: string;
  order?: number;
  options?: OptionPayload[];
}


export interface UpdateQuestionPayload extends QuestionPayload {
  id?: string;
}

export interface UpdatePassageGroupBody {
  passageType?: PassageType;
  passages?: PassagePayload[];
  questions?: UpdateQuestionPayload[];
}
