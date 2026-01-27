import CategoryService from '../../src/services/CategoryService.js';
import Category from '../../src/models/Category.js';

describe('CategoryService', () => {
    it('should be defined', () => {
        expect(CategoryService).toBeDefined();
    });

    describe('createCategory', () => {
        it('should create a new category', async () => {
            const data = {
                name: 'Test Category',
                description: 'Test Description'
            };
            const category = await CategoryService.createCategory(data);
            expect(category).toBeDefined();
            expect(category.name).toBe(data.name);
            expect(category.slug).toBe('test-category');
        });
    });

    describe('getAllCategories', () => {
        it('should return all categories', async () => {
            await Category.create({ name: 'Cat 1' });
            await Category.create({ name: 'Cat 2' });

            const categories = await CategoryService.getAllCategories();
            expect(categories.length).toBe(2);
        });
    });
});
