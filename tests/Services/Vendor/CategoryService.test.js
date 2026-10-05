import { jest } from '@jest/globals';

const createQueryMock = (val) => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(val),
    then: (resolve) => Promise.resolve(val).then(resolve)
});

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        findOne: jest.fn((cond) => createQueryMock(null)),
        findOneAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        findOne: jest.fn(() => createQueryMock(null)),
        find: jest.fn(() => createQueryMock([]))
    }
}));

jest.unstable_mockModule('@/core/Models/CategoryDocument.js', () => ({
    default: {
        find: jest.fn(() => createQueryMock([]))
    }
}));

jest.unstable_mockModule('@/core/Models/VendorDocument.js', () => ({
    default: {
        findOneAndUpdate: jest.fn(),
        find: jest.fn(() => createQueryMock([]))
    }
}));

jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn()
}));

const { default: CategoryService } = await import('@/core/Services/Vendor/CategoryService.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { default: Category } = await import('@/core/Models/Category.js');

describe('Vendor CategoryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAssignedCategories', () => {
        it('should return assigned categories', async () => {
            const mockVendorId = '507f1f77bcf86cd799439011';
            Vendor.findOne.mockImplementation(() => createQueryMock({ _id: mockVendorId, category: [{ slug: 'hotel', name: 'Hotel' }] }));
            Category.find.mockImplementation(() => createQueryMock([{ slug: 'hotel', name: 'Hotel' }]));
            const result = await CategoryService.getAssignedCategories('507f1f77bcf86cd799439012');
            expect(result).toBeDefined();
        });

        it('should return empty array if vendor has no categories', async () => {
            Vendor.findOne.mockImplementation(() => createQueryMock(null));
            const result = await CategoryService.getAssignedCategories('507f1f77bcf86cd799439012');
            expect(result).toEqual([]);
        });
    });

    describe('assignCategoryToVendor', () => {
        it('should successfully assign a category', async () => {
            const mockVendorId = '507f1f77bcf86cd799439011';
            Category.findOne.mockImplementation(() => createQueryMock({ _id: '507f1f77bcf86cd799439013', slug: 'hotel', name: 'Hotel' }));
            const mockVendor = { _id: mockVendorId, category: [], save: jest.fn().mockResolvedValue({ _id: mockVendorId }) };
            Vendor.findOne.mockImplementation(() => createQueryMock(mockVendor));

            const result = await CategoryService.assignCategoryToVendor('507f1f77bcf86cd799439012', { slug: 'hotel' });
            expect(result).toBeDefined();
        });
    });
});
