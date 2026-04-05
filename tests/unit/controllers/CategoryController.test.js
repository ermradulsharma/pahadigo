import CategoryController from '../../../src/core/Http/Controllers/CategoryController.js';
import Category from '../../../src/core/Models/Category.js';

describe('Category API Controller Test Suite', () => {

    it('should reject creation if not an admin', async () => {
        const req = {
            user: { role: 'traveller' },
            jsonBody: { name: 'Mountain' }
        };

        const res = await CategoryController.create(req);
        expect(res.status).toBe(403);
    });

    it('should create category if admin', async () => {
        const req = {
            user: { role: 'admin' },
            jsonBody: { name: 'Ocean Views' }
        };

        const res = await CategoryController.create(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.data.category.slug).toBe('ocean-views');
    });

    it('should fetch all categories', async () => {
        await Category.create({ name: 'Forests' });

        const req = {};
        const res = await CategoryController.getAll(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data.categories.length).toBeGreaterThanOrEqual(1);
    });

    it('should get a category by id using params', async () => {
        const cat = await Category.create({ name: 'Rivers' });

        const req = {};
        const params = { id: cat._id.toString() };

        const res = await CategoryController.getById(req, { params });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data.category.name).toBe('Rivers');
    });
});
