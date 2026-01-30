import { v2 as cloudinary } from 'cloudinary';

// Cloudinary will automatically use the CLOUDINARY_URL from process.env if available,
// but we'll explicitly configure it just in case or if we need specific options.

export const uploadToCloudinary = async (file, folder = 'general') => {
    try {
        if (!process.env.CLOUDINARY_URL) {
            throw new Error('CLOUDINARY_URL not found in environment variables');
        }

        // Extract buffer from File object
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

        const uploadResponse = await cloudinary.uploader.upload(base64Image, {
            folder: `pahadigo/${folder}`,
            upload_preset: 'pahadigo_uploads',
        });

        return {
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
        };
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
};

export default cloudinary;
