import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockImplementation(() => Promise.resolve({
        cloudinary: { url: 'cloudinary://test:test@test' }
    }))
}));

jest.unstable_mockModule('sharp', () => ({
    default: jest.fn().mockReturnValue({
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image'))
    })
}));

const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');
const { v2: cloudinary } = await import('cloudinary');
import { HTTP_STATUS } from '@/core/Constants/index.js';

describe('Cloudinary Helper', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, CLOUDINARY_URL: 'cloudinary://test:test@test' };
        
        jest.spyOn(cloudinary.uploader, 'upload').mockImplementation(() => {});
        jest.spyOn(cloudinary, 'config').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    test('should upload file successfully', async () => {
        const mockFile = {
            type: 'image/jpeg',
            size: 1024,
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
        };

        cloudinary.uploader.upload.mockResolvedValue({
            secure_url: 'http://res.cloudinary.com/test.jpg',
            public_id: 'test_id'
        });

        const result = await uploadToCloudinary(mockFile, 'test-folder');
        expect(result.url).toBe('http://res.cloudinary.com/test.jpg');
    });

    test('should reject invalid file types', async () => {
        const mockFile = {
            type: 'text/plain',
            size: 1024
        };

        await expect(uploadToCloudinary(mockFile)).rejects.toMatchObject({
            status: HTTP_STATUS.BAD_REQUEST
        });
    });
});
