import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

// ─── Giới hạn file size ───────────────────────────────────────────
const FILE_SIZE_LIMITS = {
  audio: 5 * 1024 * 1024,   // 5MB
  image: 2 * 1024 * 1024,   // 2MB
  video: 20 * 1024 * 1024,  // 20MB
};

// ─── MIME types hợp lệ ────────────────────────────────────────────
const ALLOWED_MIME: Record<string, string[]> = {
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"],
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

// ─── Lưu file vào RAM (không ghi disk) ───────────────────────────
const storage = multer.memoryStorage();

// ─── File filter dựa theo field name ─────────────────────────────
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const fieldName = file.fieldname as "audio" | "image" | "video";
  const allowed = ALLOWED_MIME[fieldName];

  if (!allowed) {
    return cb(new ApiError(`Field '${fieldName}' không được hỗ trợ`, StatusCodes.BAD_REQUEST));
  }

  if (!allowed.includes(file.mimetype)) {
    return cb(
      new ApiError(
        `File '${file.originalname}' không đúng định dạng. Chấp nhận: ${allowed.join(", ")}`,
        StatusCodes.UNPROCESSABLE_ENTITY
      )
    );
  }

  cb(null, true);
};

// ─── Middleware upload 1 file media (dùng cho /question/upload) ──
export const uploadSingleMedia = multer({
  storage,
  fileFilter,
  limits: {
    // Lấy giới hạn lớn nhất (video) để multer không reject sớm,
    // validate size thực tế theo fieldname trong fileFilter nâng cao
    fileSize: FILE_SIZE_LIMITS.video,
  },
}).fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

// ─── Validate size theo fieldname (chạy sau multer) ──────────────
export const validateFileSize = (req: Request): void => {
  if (!req.files || typeof req.files !== "object") return;

  const files = req.files as Record<string, Express.Multer.File[]>;

  for (const fieldName of Object.keys(files)) {
    const key = fieldName as "audio" | "image" | "video";
    const limit = FILE_SIZE_LIMITS[key];
    const file = files[key]?.[0];

    if (file && limit && file.size > limit) {
      const limitMB = limit / (1024 * 1024);
      throw new ApiError(
        `File ${key} vượt quá giới hạn ${limitMB}MB (file hiện tại: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        StatusCodes.UNPROCESSABLE_ENTITY
      );
    }
  }
};
