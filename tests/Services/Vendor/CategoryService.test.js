import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        findOne: jest.fn(),
        find: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/CategoryDocument.js', () => ({
    default: {
        find: jest.fn(() => ({ select: jest.fn() }))
    }
}));

jest.unstable_mockModule('@/core/Models/VendorDocument.js', () => ({
    default: {
        findOneAndUpdate: jest.fn(),
        find: jest.fn(() => ({ select: jest.fn() }))
    }
}));

jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn()
}));

const { default: CategoryService } = await import('@/core/Services/Vendor/CategoryService.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { default: Category } = await import('@/core/Models/Category.js');
const { default: CategoryDocument } = await import('@/core/Models/CategoryDocument.js');
const { default: VendorDocument } = await import('@/core/Models/VendorDocument.js');
const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');

describe('Vendor CategoryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAssignedCategories', () => {
        it('should return assigned categories', async () => {
            Vendor.findOne.mockResolvedValue({ category: [{ slug: 'hotel' }] });
            const result = await CategoryService.getAssignedCategories('u1');
            expect(result).toEqual([{ slug: 'hotel' }]);
        });

        it('should return empty array if vendor has no categories', async () => {
            Vendor.findOne.mockResolvedValue(null);
            const result = await CategoryService.getAssignedCategories('u1');
            expect(result).toEqual([]);
        });
    });

    describe('assignCategoryToVendor', () => {
        it('should successfully assign a category', async () => {
            Category.findOne.mockResolvedValue({ slug: 'hotel', name: 'Hotel' });
            const mockVendor = { category: [], save: jest.fn() };
            Vendor.findOne.mockResolvedValue(mockVendor);

            await CategoryService.assignCategoryToVendor('u1', { slug: 'hotel' });
            expect(mockVendor.category).toHaveLength(1);
            expect(mockVendor.save).toHaveBeenCalled();
        });

        it('should throw if category does not exist', async () => {
            Category.findOne.mockResolvedValue(null);
            await expect(CategoryService.assignCategoryToVendor('u1', 'hotel')).rejects.toThrow('Selected category is invalid.');
        });

        it('should throw if vendor not found', async () => {
            Category.findOne.mockResolvedValue({ slug: 'hotel' });
            Vendor.findOne.mockResolvedValue(null);
            await expect(CategoryService.assignCategoryToVendor('u1', 'hotel')).rejects.toThrow('Vendor record not found.');
        });

        it('should throw if already assigned', async () => {
            Category.findOne.mockResolvedValue({ slug: 'hotel' });
            Vendor.findOne.mockResolvedValue({ category: [{ slug: 'hotel' }] });
            await expect(CategoryService.assignCategoryToVendor('u1', 'hotel')).rejects.toThrow('This category is already linked to your business.');
        });
    });

    describe('removeCategoryFromVendor', () => {
        it('should pull category from array', async () => {
            await CategoryService.removeCategoryFromVendor('u1', 'hotel');
            expect(Vendor.findOneAndUpdate).toHaveBeenCalledWith(
                { user: 'u1', deletedAt: null },
                { $pull: { category: { slug: 'hotel' } } },
                expect.any(Object)
            );
        });
    });

    describe('getEligibleCategories', () => {
        it('should filter out assigned categories', async () => {
            const allCats = [{ slug: 'hotel' }, { slug: 'camping' }];
            Category.find.mockReturnValue({ select: jest.fn().mockResolvedValue(allCats) });
            Vendor.findOne.mockResolvedValue({ category: [{ slug: 'hotel' }] });

            const result = await CategoryService.getEligibleCategories('u1');
            expect(result).toHaveLength(1);
            expect(result[0].slug).toBe('camping');
        });
    });

    describe('getDocuments & getRequirementsBySlug', () => {
        it('should fetch documents if category is assigned', async () => {
            Vendor.findOne.mockResolvedValue({ category: [{ slug: 'hotel' }] });
            const mockDocs = [{ slug: 'fssai' }];
            CategoryDocument.find.mockReturnValue({ select: jest.fn().mockResolvedValue(mockDocs) });

            const result = await CategoryService.getDocuments('u1', 'hotel');
            expect(result).toEqual(mockDocs);
        });

        it('should throw if category not assigned', async () => {
            Vendor.findOne.mockResolvedValue({ category: [] });
            await expect(CategoryService.getDocuments('u1', 'hotel')).rejects.toThrow('This category is not linked to your business profile.');
        });
    });

    describe('uploadDocuments', () => {
        it('should throw if category not assigned', async () => {
            Vendor.findOne.mockResolvedValue({ category: [] });
            await expect(CategoryService.uploadDocuments('u1', 'hotel', {})).rejects.toThrow('This category is not linked to your business profile.');
        });

        it('should throw if mismatch between files and slugs', async () => {
            Vendor.findOne.mockResolvedValue({ category: [{ slug: 'hotel' }] });
            const req = { payload: { document_slug: ['doc1'], image: [] } };
            await expect(CategoryService.uploadDocuments('u1', 'hotel', req)).rejects.toThrow('The provided documents do not match requirements.');
        });

        it('should upload files to cloudinary and save to DB', async () => {
            Vendor.findOne.mockResolvedValue({ _id: 'v1', category: [{ slug: 'hotel' }] });
            const req = { payload: { document_slug: ['doc1'], image: ['file1'] } };
            
            uploadToCloudinary.mockResolvedValue({ url: 'http://img.com/file1.jpg' });
            VendorDocument.findOneAndUpdate.mockResolvedValue({ url: 'http://img.com/file1.jpg' });

            const result = await CategoryService.uploadDocuments('u1', 'hotel', req);
            expect(result).toHaveLength(1);
            expect(uploadToCloudinary).toHaveBeenCalled();
            expect(VendorDocument.findOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe('getUploadedDocuments', () => {
        it('should return vendor documents', async () => {
            Vendor.findOne.mockResolvedValue({ _id: 'v1' });
            const mockDocs = [{ url: 'http://img.com/file1.jpg' }];
            VendorDocument.find.mockReturnValue({ select: jest.fn().mockResolvedValue(mockDocs) });

            const result = await CategoryService.getUploadedDocuments('u1');
            expect(result).toEqual(mockDocs);
        });

        it('should throw if vendor not found', async () => {
            Vendor.findOne.mockResolvedValue(null);
            await expect(CategoryService.getUploadedDocuments('u1')).rejects.toThrow('Vendor record not found.');
        });
    });
});
