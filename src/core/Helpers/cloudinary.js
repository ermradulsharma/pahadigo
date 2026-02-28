import { v2 as cloudinary } from 'cloudinary';
import { HTTP_STATUS } from '@/constants/index.js';

// Allowed MIME types for the entire application
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const uploadToCloudinary = async (file, folder = 'general') => {
    try {
        if (!process.env.CLOUDINARY_URL) {
            throw new Error('CLOUDINARY_URL not found in environment variables');
        }

        // 1. File Type Validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            const error = new Error(`Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed. Received: ${file.type}`);
            error.status = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        // 2. File Size Validation
        if (file.size > MAX_FILE_SIZE_BYTES) {
            const error = new Error(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit. Received: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
            error.status = HTTP_STATUS.BAD_REQUEST;
            throw error;
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
