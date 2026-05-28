interface BuildExplanationPromptParams {
  part?: string;
  passageContent?: string;
  questionText?: string;
  options: { label: string; text: string }[];
  correctLabel?: string;
}

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
