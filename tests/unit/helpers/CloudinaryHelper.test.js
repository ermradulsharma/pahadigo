import { uploadToCloudinary } from '../../../src/core/Helpers/cloudinary.js';
import { jest } from '@jest/globals';

describe('CloudinaryHelper Test Suite', () => {
    beforeEach(() => {
        process.env.CLOUDINARY_URL = 'cloudinary://123:abc@test';
        jest.clearAllMocks();
    });

    it('should block invalid file type', async () => {
        const file = { type: 'text/plain', size: 100 };
        
        await expect(uploadToCloudinary(file)).rejects.toMatchObject({
            message: expect.stringContaining('Invalid file type')
        });
    });

    it('should block oversized files', async () => {
        const file = { type: 'image/jpeg', size: 10 * 1024 * 1024 }; // 10MB
        
        await expect(uploadToCloudinary(file)).rejects.toMatchObject({
            message: expect.stringContaining('File size exceeds')
        });
    });
});
