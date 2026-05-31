import { BuildExplanationPromptParams, BuildFollowUpPromptParams } from "@/types/ai.types";

const sanitizeText = (text?: string, maxLength: number = 3000): string => {
  if (!text) return "";
  // Basic sanitization: trim and limit length to prevent prompt injection / payload too large
  return text.trim().substring(0, maxLength);
};

export const buildToeicExplanationPrompt = ({
  part,
  passageContent,
  questionText,
  options,
  correctLabel
}: BuildExplanationPromptParams): string => {
  const safePassage = sanitizeText(passageContent, 4000);
  const safeQuestion = sanitizeText(questionText, 1000);

  const optionsText = options.map(opt => `${opt.label}. ${sanitizeText(opt.text, 500)}`).join(" | ");

  const partText = part ? `**Phần thi**: ${part}\n` : "";
  const passageContextText = safePassage ? `**Đoạn văn/Ngữ cảnh**: \n${safePassage}\n\n` : "";
  const questionContextText = `**Câu hỏi**: ${safeQuestion || "(Câu hỏi nghe/nhìn)"}\n`;
  const optionsContextText = `**Các lựa chọn**: ${optionsText}\n`;
  const correctLabelText = correctLabel ? `**Đáp án đúng**: ${correctLabel}\n\n` : "\n";

  return `Bạn là gia sư TOEIC. Yêu cầu: TRẢ LỜI CỰC KỲ NGẮN GỌN, ĐÚNG TRỌNG TÂM, KHÔNG DÀI DÒNG.

${partText}${passageContextText}${questionContextText}${optionsContextText}${correctLabelText}Trình bày theo format markdown sau một cách ngắn gọn nhất:
- ✅ **Tại sao chọn ${correctLabel || "đáp án này"}**: (Giải thích lý do đúng trong 1-2 câu).
- ❌ **Các đáp án khác**: (Chỉ ra lỗi sai ngắn gọn, không giải thích dông dài).
- 💡 **Từ vựng/Ngữ pháp cốt lõi**: (Chỉ liệt kê nếu thực sự cần thiết để hiểu câu này).

Tuyệt đối không chào hỏi, mở bài hay kết bài. Không khuyên bảo hay đưa thêm các tips dài dòng.`;
};


export const buildFollowUpPrompt = ({
  questionContext,
  originalExplanation,
  chatHistory,
  userQuestion
}: BuildFollowUpPromptParams): string => {
  const safeContext = sanitizeText(questionContext, 5000);
  const safeExplanation = sanitizeText(originalExplanation, 3000);
  const safeUserQuestion = sanitizeText(userQuestion, 1000);

  const contextText = safeContext ? `**Bối cảnh câu hỏi TOEIC**:\n${safeContext}\n\n` : "";

  const historyText = chatHistory && chatHistory.length > 0
    ? `**Lịch sử trò chuyện trước đó**:\n${chatHistory.map(h => `- Học viên: ${sanitizeText(h.user, 500)}\n- Gia sư AI: ${sanitizeText(h.ai, 1000)}`).join('\n\n')}\n\n`
    : "";

  return `Bạn là gia sư TOEIC. Học viên đang có thắc mắc về một câu hỏi TOEIC.

${contextText}**Lời giải thích gốc của bạn**:
${safeExplanation}

${historyText}**Câu hỏi mới nhất của học viên**:
"${safeUserQuestion}"

YÊU CẦU QUAN TRỌNG TỐI CAO:
1. NẾU câu hỏi của học viên KHÔNG LIÊN QUAN gì đến ngữ pháp, từ vựng tiếng Anh hoặc bối cảnh câu hỏi TOEIC hiện tại (ví dụ: hỏi thời tiết, nhờ viết code, spam chữ), HÃY TỪ CHỐI TRẢ LỜI LỊCH SỰ và nhắc họ tập trung vào bài học.
2. Nếu câu hỏi hợp lệ, hãy trả lời cực kỳ NGẮN GỌN, đi thẳng vào trọng tâm thắc mắc của học viên. Không chào hỏi, không mở bài dài dòng.`;
};

export const buildTakeawayPrompt = (questionText: string | undefined, explanation: string): string => {
  return `Bạn là gia sư TOEIC. Dựa vào câu hỏi và lời giải thích dưới đây, hãy rút ra MỘT điểm ngữ pháp cốt lõi hoặc 1-2 từ vựng đắt giá nhất để học viên ghi nhớ.

${questionText ? `**Câu hỏi**: ${sanitizeText(questionText, 1000)}\n` : ""}
**Lời giải thích**:
${sanitizeText(explanation, 3000)}

YÊU CẦU: 
- Bắt đầu bằng chữ "💡 **Kiến thức cần học**:"
- Dài không quá 2-3 câu.
- Đi thẳng vào vấn đề, tuyệt đối không chào hỏi hay mở bài.`;
};
