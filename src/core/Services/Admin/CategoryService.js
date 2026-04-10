import Category from '@/models/Category.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * CategoryService (Admin Role)
 * Focuses on category lifecycle management (CRUD).
 */
class CategoryService {

    async createCategory(data) {
        const category = new Category(data);
        return await category.save();
    }

    async updateCategory(id, data) {
        const category = await Category.findById(id);
        if (!category) throw new Error(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND);

        Object.assign(category, data);

        if (data.name && !data.slug) {
            category.slug = data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        }

        return await category.save();
    }

    async deleteCategory(id) {
        return await Category.findByIdAndDelete(id);
    }

    async listAllCategories() {
        return await Category.find({}).sort({ name: 1 });
    }
}

export default new CategoryService();
