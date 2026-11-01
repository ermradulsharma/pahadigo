import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockWishlistAggregate = jest.fn();
const mockCategoryFind = jest.fn();

jest.unstable_mockModule('@/core/Models/Wishlist.js', () => ({
    default: {
        aggregate: mockWishlistAggregate
    }
}));

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        find: mockCategoryFind
    }
}));

jest.unstable_mockModule('@/core/Helpers/objectId.js', () => ({
    default: (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null),
    toObjectId: (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null)
}));

jest.unstable_mockModule('@/core/Helpers/objectId.js', () => ({
    default: (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null),
    toObjectId: (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null)
}));

const { default: getWishlistPackages } = await import('@/core/Helpers/Package/wishlistPackage.js');

describe('Helpers: Package/wishlistPackage.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return empty paginated result when user has no wishlist items in flat mode', async () => {
        const userId = new mongoose.Types.ObjectId().toString();

        mockCategoryFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { _id: new mongoose.Types.ObjectId(), name: 'Homestay', slug: 'homestay', isActive: true }
            ])
        });

        mockWishlistAggregate.mockResolvedValueOnce([]);

        const result = await getWishlistPackages({ userId, format: 'flat', page: 1, limit: 10 });

        expect(result.items).toEqual([]);
        expect(result.pagination.total).toBe(0);
    });

    it('should format wishlist items and paginate correctly in flat mode', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const packageId = new mongoose.Types.ObjectId();
        const categoryId = new mongoose.Types.ObjectId();

        mockCategoryFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { _id: categoryId, name: 'Homestay', slug: 'homestay', isActive: true }
            ])
        });

        const mockItem = {
            _id: packageId,
            packageId: {
                _id: packageId,
                name: 'Beautiful Homestay',
                category: categoryId,
                basePrice: 2000,
                location: { address: 'Manali', coordinates: [77.1887, 32.2396] }
            },
            notes: 'Want to visit in June'
        };

        mockWishlistAggregate.mockResolvedValueOnce([mockItem]);

        const result = await getWishlistPackages({
            userId,
            format: 'flat',
            page: 1,
            limit: 10,
            search: 'Manali',
            category: 'homestay',
            userCoordinates: [77.1887, 32.2396]
        });

        expect(mockWishlistAggregate).toHaveBeenCalled();
        expect(result.items.length).toBe(1);
        expect(result.pagination.total).toBe(1);
    });

    it('should group items by category when format is grouped', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const categoryId = new mongoose.Types.ObjectId();

        mockCategoryFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { _id: categoryId, name: 'Homestay', slug: 'homestay', isActive: true }
            ])
        });

        mockWishlistAggregate.mockResolvedValueOnce([]);

        const result = await getWishlistPackages({ userId, format: 'grouped' });

        expect(result).toHaveProperty('categories');
        expect(Array.isArray(result.categories)).toBe(true);
    });
});
