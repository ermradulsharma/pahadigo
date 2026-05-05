import { jest } from '@jest/globals';
import CategoryService from '@/core/Services/General/CategoryService.js';
import Category from '@/core/Models/Category.js';

describe('General CategoryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Category, 'find');
        jest.spyOn(Category, 'findById');
        jest.spyOn(Category, 'findOne');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('getAllCategories should return active categories', async () => {
        const mockCategories = [{ name: 'Trekking' }, { name: 'Rafting' }];
        Category.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockCategories)
        });

        const result = await CategoryService.getAllCategories();
        expect(result).toEqual(mockCategories);
        expect(Category.find).toHaveBeenCalledWith({ isActive: true });
    });

    test('getCategoryById should throw error if not found', async () => {
        Category.findById.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
        });

        await expect(CategoryService.getCategoryById('c1')).rejects.toThrow();
    });

    test('getCategoryBySlug should return category', async () => {
        const mockCategory = { slug: 'trekking' };
        Category.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCategory)
        });

        const result = await CategoryService.getCategoryBySlug('TREKKING');
        expect(result.slug).toBe('trekking');
        expect(Category.findOne).toHaveBeenCalledWith({ slug: 'trekking' });
    });
});
