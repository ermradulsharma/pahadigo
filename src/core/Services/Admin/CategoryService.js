import Category from '@/core/Models/Category.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import CacheService from '@/core/Services/CacheService.js';
import AppError from '@/core/Helpers/AppError.js';

/**
 * CategoryService (Admin Role)
 * Focuses on category lifecycle management (CRUD).
 */
class CategoryService {

  async createCategory(data) {
    const category = new Category(data);
    await category.save();
    await CacheService.delete('admin:categories:all');
    return category;
  }

  async updateCategory(id, data) {
    const category = await Category.findById(id);
    if (!category) throw new AppError(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND, 404);

    Object.assign(category, data);

    if (data.name && !data.slug) {
      category.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    await category.save();
    await CacheService.delete('admin:categories:all');
    return category;
  }

  async deleteCategory(id) {
    const deleted = await Category.findByIdAndDelete(id);
    await CacheService.delete('admin:categories:all');
    return deleted;
  }

  async listAllCategories() {
    const cacheKey = 'admin:categories:all';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const categories = await Category.find({}).sort({ name: 1 }).lean();
    await CacheService.set(cacheKey, categories, 300);
    return categories;
  }
}

export default new CategoryService();
