import CategoryService from '../../src/core/Services/CategoryService.js';
import Category from '../../src/core/Models/Category.js';

describe('CategoryService Test Suite', () => {
    let mockCategoryId;

    beforeEach(async () => {
        const cat = await CategoryService.createCategory({
            name: 'Beach Holidays',
            description: 'Sunny places'
        });
        mockCategoryId = cat._id;
    });

    it('should create a new category', async () => {
        const cat = await CategoryService.createCategory({
            name: 'Desert Safaris',
            description: 'Hot places'
        });
        expect(cat.name).toBe('Desert Safaris');
        expect(cat.slug).toBe('desert-safaris');
    });

    it('should get all categories sorted by name', async () => {
        await CategoryService.createCategory({ name: 'Apple Picking' });
        const categories = await CategoryService.getAllCategories();
        expect(categories.length).toBeGreaterThanOrEqual(2);
        expect(categories.some(c => c.name === 'Apple Picking')).toBe(true);
    });

    it('should retrieve a category by ID', async () => {
        const cat = await CategoryService.getCategoryById(mockCategoryId);
        expect(cat.name).toBe('Beach Holidays');
    });

    it('should update a category and regenerate the slug', async () => {
        const updated = await CategoryService.updateCategory(mockCategoryId, { name: 'Mountain Treks' });
        expect(updated.name).toBe('Mountain Treks');
        expect(updated.slug).toBe('mountain-treks');
    });

    it('should delete a category', async () => {
        await CategoryService.deleteCategory(mockCategoryId);
        await expect(CategoryService.getCategoryById(mockCategoryId)).rejects.toThrow();
    });
});
