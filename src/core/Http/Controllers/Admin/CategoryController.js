import CategoryService from '@/core/Services/Admin/CategoryService.js';
import { seedCategories } from '@/core/Seeders/categorySeeder.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * CategoryController (Admin Role) - Handles administrative management of activity categories.
 */
class CategoryController extends Controller {

  // POST /admin/categories
  async create(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      if (!body.name) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.NAME_REQUIRED);
      const category = await CategoryService.createCategory(body);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.CATEGORY.CREATED, { category });
    } catch (error) {
      if (error.code === 11000) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/categories/:id
  async update(req, { params }) {
    try {
      if (!params.id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
      const body = req.validData || req.jsonBody || await req.json();
      const category = await CategoryService.updateCategory(params.id, body);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.UPDATED, { category });
    } catch (error) {
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
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/categories/seed
  async seed(req) {
    try {
      const result = await seedCategories();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED, { result });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const categoryController = new CategoryController();
export default categoryController;
