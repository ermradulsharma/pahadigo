import Category from '../models/Category.js';

class CategoryService {

    async createCategory(data) {
        try {
            const category = new Category(data);
            return await category.save();
        } catch (error) {
            throw error;
        }
    }

    async getAllCategories() {
        try {
            return await Category.find({ isActive: true }).sort({ name: 1 });
        } catch (error) {
            throw error;
        }
    }

    async getCategoryById(id) {
        try {
            const category = await Category.findById(id);
            if (!category) throw new Error('Category not found');
            return category;
        } catch (error) {
            throw error;
        }
    }

    async updateCategory(id, data) {
        try {
            const category = await Category.findById(id);
            if (!category) throw new Error('Category not found');

            // Copy properties
            Object.assign(category, data);

            // Re-generate slug if name changed and slug wasn't explicitly provided in update
            if (data.name && !data.slug) {
                category.slug = data.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '');
            }

            return await category.save();
        } catch (error) {
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            return await Category.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
}

const categoryService = new CategoryService();
export default categoryService;
