import { jest } from '@jest/globals';

const createQueryMock = (val) => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(val)
});

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        findOne: jest.fn((cond) => createQueryMock(null)),
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
        find: jest.fn(() => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }))
    }
}));

jest.unstable_mockModule('@/core/Models/VendorDocument.js', () => ({
    default: {
        findOneAndUpdate: jest.fn(),
        find: jest.fn(() => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }))
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
            Vendor.findOne.mockImplementation(() => createQueryMock({ category: [{ slug: 'hotel' }] }));
            const result = await CategoryService.getAssignedCategories('u1');
            expect(result).toEqual([{ slug: 'hotel' }]);
        });

        it('should return empty array if vendor has no categories', async () => {
            Vendor.findOne.mockImplementation(() => createQueryMock(null));
            const result = await CategoryService.getAssignedCategories('u1');
            expect(result).toEqual([]);
        });
    });

    describe('assignCategoryToVendor', () => {
        it('should successfully assign a category', async () => {
            Category.findOne.mockResolvedValue({ slug: 'hotel', name: 'Hotel' });
            const mockVendor = { category: [], save: jest.fn() };
            Vendor.findOne.mockResolvedValue(mockVendor);

            const result = await CategoryService.assignCategoryToVendor('u1', { categorySlug: 'hotel' });
            expect(result).toBeDefined();
        });
    });
});
