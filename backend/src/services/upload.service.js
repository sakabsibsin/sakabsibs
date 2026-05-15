import { cloudinary } from '../config/cloudinary.js';

export const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'sakabsibs-jewelry',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
