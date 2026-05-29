import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { ExamPart } from "@/types/exam.types";
import { PassagePayload } from "@/types/question.types";

/**
 * Validate cấu trúc media bắt buộc của từng Part TOEIC.
 *
 * | Part | Yêu cầu |
 * |------|---------|
 * | Part 1 | AUDIO hoặc VIDEO, không được có TEXT |
 * | Part 2 | AUDIO hoặc VIDEO, không được có TEXT |
 * | Part 3 & 4 | AUDIO hoặc VIDEO |
 * | Part 6 & 7 | TEXT hoặc IMAGE passage (đoạn văn hoặc hình ảnh) |
 * | Part 5 | Không dùng group – dùng standalone |
 * | FULL | Không thêm câu hỏi trực tiếp |
 */
export const validatePartMedia = (part: ExamPart, passages: PassagePayload[]): void => {
  const mediaTypes = passages.map((p) => p.mediaType);

  switch (part) {
    case "PART1":
      if (!mediaTypes.includes("AUDIO") && !mediaTypes.includes("VIDEO")) {
        throw new ApiError(
          "Part 1 bắt buộc phải có file âm thanh (AUDIO) hoặc video (VIDEO)",
          StatusCodes.BAD_REQUEST
        );
      }
      if (mediaTypes.includes("TEXT")) {
        throw new ApiError("Part 1 không được có passage dạng TEXT", StatusCodes.BAD_REQUEST);
      }
      break;

    case "PART2":
      if (!mediaTypes.includes("AUDIO") && !mediaTypes.includes("VIDEO")) {
        throw new ApiError(
          "Part 2 bắt buộc phải có file âm thanh (AUDIO)",
          StatusCodes.BAD_REQUEST
        );
      }
      if (mediaTypes.includes("TEXT")) {
        throw new ApiError("Part 2 không được có passage dạng TEXT", StatusCodes.BAD_REQUEST);
      }
      break;

    case "PART3":
    case "PART4":
      if (!mediaTypes.includes("AUDIO") && !mediaTypes.includes("VIDEO")) {
        throw new ApiError(
          `${part} bắt buộc phải có file âm thanh (AUDIO)`,
          StatusCodes.BAD_REQUEST
        );
      }
      break;

    case "PART6":
    case "PART7":
      if (!mediaTypes.includes("TEXT") && !mediaTypes.includes("IMAGE")) {
        throw new ApiError(
          `${part} bắt buộc phải có đoạn văn (Văn bản hoặc Hình ảnh)`,
          StatusCodes.BAD_REQUEST
        );
      }
      break;

    case "PART5":
      throw new ApiError(
        "Part 5 sử dụng câu hỏi đơn, vui lòng dùng API /question/standalone",
        StatusCodes.BAD_REQUEST
      );

    case "FULL":
      throw new ApiError(
        "Không thể thêm câu hỏi trực tiếp vào đề FULL",
        StatusCodes.BAD_REQUEST
      );
  }
};

/**
 * Validate questionText theo Part TOEIC:
 * Part 1 & 2 KHÔNG được hiển thị câu hỏi (questionText phải null/undefined).
 *
 * @param index - vị trí câu hỏi trong danh sách (để báo lỗi cụ thể)
 */
export const validateQuestionText = (
  part: ExamPart,
  questionText: string | null | undefined,
  index: number
): void => {
  if (part === "PART1" && questionText) {
    throw new ApiError(
      `Part 1 không được hiển thị nội dung câu hỏi (questionText phải để trống) – lỗi tại câu #${index + 1}`,
      StatusCodes.BAD_REQUEST
    );
  }
  // Cho phép nhập questionText ở Part 2 để lưu lại Transcript dùng cho màn hình Review (Xem lại).
};

export const PART_ORDER_BOUNDS: Record<string, { min: number; max: number }> = {
  PART1: { min: 1, max: 6 },
  PART2: { min: 7, max: 31 },
  PART3: { min: 32, max: 70 },
  PART4: { min: 71, max: 100 },
  PART5: { min: 101, max: 130 },
  PART6: { min: 131, max: 146 },
  PART7: { min: 147, max: 200 },
};

/**
 * Validate thứ tự câu hỏi theo chuẩn TOEIC
 */
export const validateQuestionOrder = (part: ExamPart, order: number, index: number): void => {
  if (part === 'FULL') return; // FULL test không kiểm tra ở mức câu hỏi đơn lẻ
  const bounds = PART_ORDER_BOUNDS[part];
  if (bounds) {
    if (order < bounds.min || order > bounds.max) {
      throw new ApiError(
        `${part} yêu cầu số thứ tự câu hỏi phải từ ${bounds.min} đến ${bounds.max}. (Lỗi tại câu #${index + 1} đang nhập số ${order})`,
        StatusCodes.BAD_REQUEST
      );
    }
  }
};
