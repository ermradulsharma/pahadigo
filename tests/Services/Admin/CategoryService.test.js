import { jest } from '@jest/globals';

const mockSave = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: class Category {
        constructor(data) {
            Object.assign(this, data);
            this.save = mockSave;
        }
        static find = mockFind;
        static findById = mockFindById;
        static findByIdAndDelete = mockFindByIdAndDelete;
    }
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    RESPONSE_MESSAGES: { CATEGORY: { NOT_FOUND: 'Category not found' } }
}));

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}));

const { default: CategoryService } = await import('@/core/Services/Admin/CategoryService.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');

describe('Admin CategoryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCategory', () => {
        it('should create a category and invalidate cache', async () => {
            mockSave.mockResolvedValue();
            const result = await CategoryService.createCategory({ name: 'Test' });
            expect(result.name).toBe('Test');
            expect(mockSave).toHaveBeenCalled();
            expect(CacheService.delete).toHaveBeenCalledWith('admin:categories:all');
        });
    });

    describe('updateCategory', () => {
        it('should update a category, generate slug if needed, and invalidate cache', async () => {
            const mockCategory = { name: 'Old', save: mockSave };
            mockFindById.mockResolvedValue(mockCategory);
            
            const result = await CategoryService.updateCategory('c1', { name: 'New Test 123!' });
            
            expect(result.name).toBe('New Test 123!');
            expect(result.slug).toBe('new-test-123'); // slug generated
            expect(mockSave).toHaveBeenCalled();
            expect(CacheService.delete).toHaveBeenCalledWith('admin:categories:all');
        });

        it('should throw if category not found', async () => {
            mockFindById.mockResolvedValue(null);
            await expect(CategoryService.updateCategory('c1', {})).rejects.toThrow('Category not found');
        });
    });

    describe('deleteCategory', () => {
        it('should delete a category and invalidate cache', async () => {
            mockFindByIdAndDelete.mockResolvedValue({ _id: 'c1' });
            await CategoryService.deleteCategory('c1');
            expect(mockFindByIdAndDelete).toHaveBeenCalledWith('c1');
            expect(CacheService.delete).toHaveBeenCalledWith('admin:categories:all');
        });
    });

    describe('listAllCategories', () => {
        it('should return from cache if available', async () => {
            CacheService.get.mockResolvedValue([{ name: 'Cached' }]);
            const result = await CategoryService.listAllCategories();
            expect(result).toHaveLength(1);
            expect(mockFind).not.toHaveBeenCalled();
        });

        it('should fetch from DB, set cache and return', async () => {
            CacheService.get.mockResolvedValue(null);
            mockFind.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ name: 'DB' }]) }) });
            
            const result = await CategoryService.listAllCategories();
            expect(result).toHaveLength(1);
            expect(CacheService.set).toHaveBeenCalledWith('admin:categories:all', result, 300);
        });
    });
});
