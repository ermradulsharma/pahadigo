import mongoose from 'mongoose';
import Category from '../../../src/core/Models/Category.js';

describe('CategoryModel Test Suite', () => {

    it('should generate a slug automatically from the name on save', async () => {
        const categoryData = {
            name: 'Adventure & Trekking',
            description: 'Fun outside'
        };

        const category = new Category(categoryData);
        // The pre-save hook fires on save, so we must save the doc to test it
        const savedCategory = await category.save();

        expect(savedCategory._id).toBeDefined();
        // pre-save converts "Adventure & Trekking" to "adventure-trekking"
        expect(savedCategory.slug).toBe('adventure-trekking');
        expect(savedCategory.isActive).toBe(true);
    });

    it('should not override a manually provided slug', async () => {
        const category = new Category({
            name: 'Hotel Accommodations',
            slug: 'custom-hotel-slug'
        });
        const savedCategory = await category.save();

        expect(savedCategory.slug).toBe('custom-hotel-slug');
    });

    it('should fail with duplicate unique names or slugs', async () => {
        const cat1 = new Category({ name: 'Unique Name' });
        await cat1.save();

        const cat2 = new Category({ name: 'Unique Name' });
        let error;
        try {
            await cat2.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error.code).toBe(11000);
    });
});
