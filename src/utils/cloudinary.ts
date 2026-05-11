import cloudinary from '../config/cloudinary';

export const uploadImage = async (file: Express.Multer.File, folder: string) => {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload failed'));
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteImage = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

/**
 * Extracts public_id from a Cloudinary URL.
 * Example: https://res.cloudinary.com/demo/image/upload/v1571218039/folder/sample.jpg
 * Returns: folder/sample
 */
export const getPublicIdFromUrl = (url: string) => {
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const folderPart = parts[parts.length - 2];
    
    // Check if there's a version number (v12345678)
    const fileNameWithExt = lastPart.split('.')[0];
    
    // If there's a folder, we might need more logic. 
    // Usually, it's safer to store the public_id in the DB, 
    // but the schema doesn't have it.
    // Let's assume a standard path for now.
    // A better way is to regex it.
    
    const regex = /\/v\d+\/([^.]+)\./;
    const match = url.match(regex);
    if (match && match[1]) return match[1];
    
    // Fallback logic
    return fileNameWithExt;
  } catch (error) {
    return null;
  }
};
