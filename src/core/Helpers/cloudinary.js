import { v2 as cloudinary } from 'cloudinary';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';

import { getAppConfig } from '@/core/Lib/appConfig.js';

// Allowed MIME types for the entire application
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const uploadToCloudinary = async (file, folder = 'general') => {
  try {
    const config = await getAppConfig();
    const cloudinaryUrl = config.cloudinary?.url;

    if (!cloudinaryUrl) {
      throw new Error('Cloudinary config not found in appConfig or env');
    }

    // Apply dynamic configuration to the SDK before each upload
    cloudinary.config({ cloudinary_url: cloudinaryUrl });

    // 1. File Type Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Promise.reject({
        status: HTTP_STATUS.BAD_REQUEST,
        message: `${RESPONSE_MESSAGES.ERROR.INVALID_FILE_TYPE} Received: ${file.type}`
      });
    }

    // 2. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Promise.reject({
        status: HTTP_STATUS.BAD_REQUEST,
        message: `${RESPONSE_MESSAGES.ERROR.FILE_TOO_LARGE} Maximum ${MAX_FILE_SIZE_MB}MB. Received: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: `pahadigo/${folder}`,
      upload_preset: 'pahadigo_uploads',
      // resource_type: 'auto' allows PDFs to upload properly alongside images
      resource_type: 'auto',
    });

    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error) {
    throw error;
  }
};

export default cloudinary;
