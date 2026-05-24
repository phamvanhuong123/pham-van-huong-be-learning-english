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
 * | Part 6 & 7 | TEXT passage (đoạn văn) |
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
      if (!mediaTypes.includes("TEXT")) {
        throw new ApiError(
          `${part} bắt buộc phải có đoạn văn (TEXT passage)`,
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
  if ((part === "PART1" || part === "PART2") && questionText) {
    throw new ApiError(
      `${part} không được hiển thị nội dung câu hỏi (questionText phải để trống) – lỗi tại câu #${index + 1}`,
      StatusCodes.BAD_REQUEST
    );
  }
};
