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
        const itemId = new mongoose.Types.ObjectId().toString();

        mockCategoryFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { _id: new mongoose.Types.ObjectId(), name: 'Homestay', slug: 'homestay', isActive: true }
            ])
        });

        const mockItem = {
            _id: itemId,
            title: 'Alpine Wood Chalet',
            category_name: 'Homestay',
            category_slug: 'homestay',
            pricing: { basePrice: 2500, sellingPrice: 2800 },
            location: { coordinates: [77.17, 32.23] }
        };

        mockWishlistAggregate.mockResolvedValueOnce([mockItem]);

        const result = await getWishlistPackages({ userId, format: 'flat', page: 1, limit: 10 });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].title).toBe('Alpine Wood Chalet');
        expect(result.items[0].wishlist).toBe(true);
        expect(result.pagination.total).toBe(1);
    });

    it('should group items by category when format is grouped', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const itemId = new mongoose.Types.ObjectId().toString();

        mockCategoryFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { _id: new mongoose.Types.ObjectId(), name: 'Homestay', slug: 'homestay', isActive: true }
            ])
        });

        const mockItem = {
            _id: itemId,
            title: 'Snowy Peak Villa',
            category_name: 'Homestay',
            category_slug: 'homestay',
            pricing: { basePrice: 4000, sellingPrice: 4500 }
        };

        mockWishlistAggregate.mockResolvedValueOnce([mockItem]);

        const result = await getWishlistPackages({ userId, format: 'grouped', page: 1, limit: 10 });

        expect(result.homestay).toBeDefined();
        expect(result.homestay.items).toHaveLength(1);
        expect(result.homestay.items[0].title).toBe('Snowy Peak Villa');
    });
});
