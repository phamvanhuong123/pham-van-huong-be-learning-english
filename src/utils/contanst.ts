export const EXAM_SELECT_FIELDS = {
  id: true,
  title: true,
  description: true,
  part: true,
  difficulty: true,
  duration: true,
  type: true,
  isPublished: true,
  parentExamId: true
};

// ─── Fields trả về cho Option ─────────────────────────────────────
export const OPTION_SELECT_FIELDS = {
  id: true,
  label: true,
  text: true,
  isCorrect: true,
};

// ─── Fields trả về cho câu hỏi đơn ───────────────────────────────
export const QUESTION_SELECT_FIELDS = {
  id: true,
  examId: true,
  passageGroupId: true,
  grammarTopicId: true,
  order: true,
  questionText: true,
  difficulty: true,
  explanation: true,
  createdAt: true,
  updatedAt: true,
  options: { select: OPTION_SELECT_FIELDS, orderBy: { label: "asc" as const } },
};

// ─── Fields trả về cho Passage ───────────────────────────────────
export const PASSAGE_SELECT_FIELDS = {
  id: true,
  content: true,
  transcript: true,
  mediaUrl: true,
  mediaType: true,
  order: true,
};

// ─── Fields trả về cho PassageGroup ─────────────────────────────
export const PASSAGE_GROUP_SELECT_FIELDS = {
  id: true,
  examId: true,
  type: true,
  passages: {
    select: PASSAGE_SELECT_FIELDS,
    orderBy: { order: "asc" as const },
  },
  questions: {
    where: { isDeleted: false },
    select: QUESTION_SELECT_FIELDS,
    orderBy: { order: "asc" as const },
  },
};

