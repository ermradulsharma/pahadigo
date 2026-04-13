import Category from '@/models/Category.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * CategoryService (Common/General Role)
 * Focuses on public-facing category discovery.
 */
class CategoryService {

    async getAllCategories() {
        return await Category.find({ isActive: true }).sort({ id: 1 }).lean();
    }

    async getCategoryById(id) {
        const category = await Category.findById(id).lean();
        if (!category) throw new Error(RESPONSE_MESSAGES.ERROR.CATEGORY_NOT_FOUND);
        return category;
    }

    async getCategoryBySlug(slug) {
        return await Category.findOne({ slug: slug.toLowerCase() }).lean();
    }
}

export default new CategoryService();
