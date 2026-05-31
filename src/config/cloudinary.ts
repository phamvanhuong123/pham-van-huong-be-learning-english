import { v2 as cloudinary } from "cloudinary";
import { env } from "./environment";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn("Cloudinary configuration missing. File uploads will not work.");
}

// Folder lưu trữ theo loại media
export type CloudinaryFolder = "toeic/audio" | "toeic/images" | "toeic/video";

// resource_type của Cloudinary (audio dùng "video" theo Cloudinary API)
export type CloudinaryResourceType = "image" | "video" | "raw";

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: CloudinaryResourceType;
  duration?: number; // chỉ có với audio/video
  bytes: number;
}

/**
 * Upload buffer lên Cloudinary
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: CloudinaryFolder,
  resourceType: CloudinaryResourceType = "image"
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Upload thất bại"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          resourceType,
          duration: result.duration,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Xóa file trên Cloudinary theo publicId
 * publicId có thể trích xuất từ URL hoặc lưu trực tiếp
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: CloudinaryResourceType = "image"
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Trích xuất publicId từ Cloudinary URL
 * VD: https://res.cloudinary.com/cloud/image/upload/v123/toeic/images/abc.jpg
 *  => publicId: "toeic/images/abc"
 */
export const extractPublicId = (url: string): string => {
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return "";
  const afterUpload = url.slice(uploadIndex + 8); // bỏ "/upload/"
  const withoutVersion = afterUpload.replace(/^v\d+\//, ""); // bỏ "v123456/"
  return withoutVersion.replace(/\.[^.]+$/, ""); // bỏ extension
};

/**
 * Xác định resourceType từ MediaType của schema
 */
export const getResourceType = (
  mediaType: "AUDIO" | "IMAGE" | "VIDEO"
): CloudinaryResourceType => {
  if (mediaType === "IMAGE") return "image";
  return "video"; // AUDIO và VIDEO đều dùng "video" trong Cloudinary
};

/**
 * Xóa media trên Cloudinary theo URL.
 * Tự động trích xuất publicId và xác định resourceType.
 * Không throw lỗi nếu xóa thất bại – chỉ ghi log (tránh block logic chính).
 */
export const deleteMediaByUrl = async (
  mediaUrl: string,
  mediaType: "AUDIO" | "IMAGE" | "VIDEO"
): Promise<void> => {
  if (!mediaUrl) return;
  try {
    const publicId = extractPublicId(mediaUrl);
    if (publicId) {
      const resourceType = getResourceType(mediaType);
      await deleteFromCloudinary(publicId, resourceType);
    }
  } catch {
    console.error(`[Cloudinary] Không thể xóa media: ${mediaUrl}`);
  }
};

export default cloudinary;

