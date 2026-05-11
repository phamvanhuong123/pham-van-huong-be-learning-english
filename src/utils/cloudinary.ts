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
export const getPublicIdFromUrl = (url: string) => {
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    // const folderPart = parts[parts.length - 2];
    const fileNameWithExt = lastPart.split('.')[0];
    const regex = /\/v\d+\/([^.]+)\./;
    const match = url.match(regex);
    if (match && match[1]) return match[1];
    return fileNameWithExt;
  } catch (error) {
    return null;
  }
};
