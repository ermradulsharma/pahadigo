import { jest } from '@jest/globals';
import CategoryService from '@/services/General/CategoryService.js';
import Category from '@/models/Category.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

describe('General CategoryService', () => {
    beforeEach(() => {
        jest.spyOn(Category, 'find');
        jest.spyOn(Category, 'findById');
        jest.spyOn(Category, 'findOne');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllCategories', () => {
        test('should return all active categories sorted by name', async () => {
            const mockCategories = [{ name: 'B' }, { name: 'A' }];
            const leanMock = jest.fn().mockResolvedValue(mockCategories);
            const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
            Category.find.mockReturnValue({ sort: sortMock });

            const result = await CategoryService.getAllCategories();

            expect(Category.find).toHaveBeenCalledWith({ isActive: true });
            expect(sortMock).toHaveBeenCalledWith({ name: 1 });
            expect(result).toEqual(mockCategories);
        });
    });

    describe('getCategoryById', () => {
        test('should return category if found', async () => {
            const mockCategory = { _id: 'cat123', name: 'Test' };
            Category.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockCategory)
            });

            const result = await CategoryService.getCategoryById('cat123');

            expect(Category.findById).toHaveBeenCalledWith('cat123');
            expect(result).toEqual(mockCategory);
        });

        test('should throw error if category not found', async () => {
            Category.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            await expect(CategoryService.getCategoryById('cat123'))
                .rejects.toThrow(RESPONSE_MESSAGES.ERROR.CATEGORY_NOT_FOUND);
        });
    });

    describe('getCategoryBySlug', () => {
        test('should return category by slug', async () => {
            const mockCategory = { slug: 'test-slug', isActive: true };
            Category.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockCategory)
            });

            const result = await CategoryService.getCategoryBySlug('Test-Slug');

            expect(Category.findOne).toHaveBeenCalledWith({ slug: 'test-slug', isActive: true });
            expect(result).toEqual(mockCategory);
        });
    });
});
