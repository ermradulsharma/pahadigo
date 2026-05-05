import { jest } from '@jest/globals';

// Use unstable_mockModule for ESM Helpers
jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn()
}));

const { default: DocumentService } = await import('@/core/Services/Vendor/DocumentService.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');

describe('Vendor DocumentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Vendor, 'findOne');
        jest.spyOn(Vendor, 'findOneAndUpdate');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('uploadVerificationFiles', () => {
        test('should upload multiple documents successfully', async () => {
            const userId = 'user123';
            const files = {
                panCard: { size: 100 },
                gstRegistration: { size: 200 }
            };
            const mockVendor = { _id: 'v1', documents: {} };

            Vendor.findOne.mockResolvedValue(mockVendor);
            uploadToCloudinary.mockResolvedValue({ url: 'http://cloud.com/file', publicId: 'p1' });
            Vendor.findOneAndUpdate.mockResolvedValue({ documents: { panCard: { url: 'http://cloud.com/file' } } });

            const result = await DocumentService.uploadVerificationFiles(userId, files);

            expect(uploadToCloudinary).toHaveBeenCalledTimes(2);
            expect(Vendor.findOneAndUpdate).toHaveBeenCalled();
        });

        test('should handle aadharCard array', async () => {
            const userId = 'user123';
            const files = {
                aadharCard: [{ size: 100 }, { size: 100 }]
            };
            const mockVendor = { _id: 'v1', documents: {} };

            Vendor.findOne.mockResolvedValue(mockVendor);
            uploadToCloudinary.mockResolvedValue({ url: 'http://cloud.com/file', publicId: 'p1' });
            Vendor.findOneAndUpdate.mockResolvedValue({ documents: { aadharCard: [] } });

            await DocumentService.uploadVerificationFiles(userId, files);

            expect(uploadToCloudinary).toHaveBeenCalledTimes(2);
        });

        test('should throw error if vendor not found', async () => {
            Vendor.findOne.mockResolvedValue(null);
            await expect(DocumentService.uploadVerificationFiles('u1', {})).rejects.toThrow();
        });
    });

    describe('deleteDocument', () => {
        test('should remove document from profile', async () => {
            Vendor.findOneAndUpdate.mockResolvedValue({ documents: {} });

            await DocumentService.deleteDocument('u1', 'doc123');

            expect(Vendor.findOneAndUpdate).toHaveBeenCalledWith(
                { user: 'u1' },
                expect.objectContaining({ $pull: { "documents.aadharCard": { _id: 'doc123' } } }),
                expect.anything()
            );
        });
    });
});
