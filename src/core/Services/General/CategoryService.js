import { getCategoriesBy, getCategoryById } from '@/core/Helpers/queryHelpers.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import AppError from '@/core/Errors/AppError.js';

/**
 * CategoryService (Common/General Role)
 * Focuses on public-facing category discovery.
 */
class CategoryService {

    async getAllCategories() {
        return await getCategoriesBy({ isActive: true }, '', null, { sequence: 1 });
    }

    async getCategoryById(id) {
        const category = await getCategoryById(id);
        if (!category) throw AppError.notFound(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND);
        return category;
    }
}

export default new CategoryService();
