import Category from '@/models/Category.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

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
      return await Category.find({}).sort({ name: 1 });
    } catch (error) {
      throw error;
    }
  }

  async getCategoryById(id) {
    try {
      const category = await Category.findById(id);
      if (!category) throw new Error(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND);
      return category;
    } catch (error) {
      throw error;
    }
  }

  async updateCategory(id, data) {
    try {
      const category = await Category.findById(id);
      if (!category) throw new Error(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND);

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
