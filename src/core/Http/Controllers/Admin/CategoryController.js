import CategoryService from '@/core/Services/Admin/CategoryService.js';
import { seedCategories } from '@/core/Seeders/CategorySeeder.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional()
});

const categoryUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional()
});

/**
 * CategoryController (Admin Role) - Handles administrative management of activity categories.
 */
class CategoryController extends Controller {
  // GET /admin/categories
  async getAll(req) {
    try {
      const categories = await CategoryService.listAllCategories();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.FETCHED, categories);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/category-documents/categories-list
  async getCategoryList(req) {
    try {
      const categories = await CategoryService.listAllCategories();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.FETCHED, categories);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/categories
  async create(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(categorySchema, rawBody);
      
      if (!success) {
          throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      }

      const category = await CategoryService.createCategory(data);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.CATEGORY.CREATED, { category });
    } catch (error) {
      if (error.code === 11000) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS);
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/categories/:id
  async update(req, { params }) {
    try {
      if (!params.id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
      
      const rawBody = await req.json();
      const { success, data, error } = validate(categoryUpdateSchema, rawBody);
      
      if (!success) {
          throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      }

      const category = await CategoryService.updateCategory(params.id, data);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.UPDATED, { category });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/categories/:id
  async delete(req, { params }) {
    try {
      if (!params.id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
      await CategoryService.deleteCategory(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.DELETED);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/categories/seed
  async seed(req) {
    try {
      const result = await seedCategories();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED, { result });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const categoryController = new CategoryController();
export default categoryController;
