import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { withRetry } from '@/core/Helpers/resilience.js';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const uploadToCloudinary = async (file, folder = 'general') => {
    try {
        const config = await getAppConfig();
        const cloudinaryUrl = config.cloudinary?.url;
        if (!cloudinaryUrl) return Promise.reject({ status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: RESPONSE_MESSAGES.ERROR.SOMETHING_WENT_WRONG });
        cloudinary.config({ cloudinary_url: cloudinaryUrl });
        if (!ALLOWED_MIME_TYPES.includes(file.type)) return Promise.reject({ status: HTTP_STATUS.BAD_REQUEST, message: RESPONSE_MESSAGES.ERROR.INVALID_FILE_TYPE });
        if (file.size > MAX_FILE_SIZE_BYTES) return Promise.reject({ status: HTTP_STATUS.BAD_REQUEST, message: RESPONSE_MESSAGES.ERROR.FILE_TOO_LARGE });

        let buffer = Buffer.from(await file.arrayBuffer());
        let mimeType = file.type;

        if (mimeType.startsWith('image/')) {
            buffer = await sharp(buffer).resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
            mimeType = 'image/webp';
        }

        const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
        
        const uploadResponse = await withRetry(async () => {
            return await cloudinary.uploader.upload(base64Image, { 
                folder: `pahadigo/${folder}`, 
                upload_preset: 'pahadigo_uploads', 
                resource_type: 'auto' 
            });
        }, { maxRetries: 3, baseDelayMs: 1000 });

        return { url: uploadResponse.secure_url, publicId: uploadResponse.public_id };
    } catch (error) {
        return Promise.reject({ status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: RESPONSE_MESSAGES.ERROR.SOMETHING_WENT_WRONG });
    }
};

export default cloudinary;
