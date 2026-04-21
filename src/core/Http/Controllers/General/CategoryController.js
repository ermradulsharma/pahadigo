import CategoryService from '@/services/General/CategoryService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * CategoryController (General/Public Role) - Handles public listing of activity categories.
 */
class CategoryController extends Controller {

  // GET /categories
  async getAll(req) {
    try {
      const categories = await CategoryService.getAllCategories();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.FETCHED, categories);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /categories/:id
  async getById(req, { params }) {
    try {
      if (!params.id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
      const category = await CategoryService.getCategoryById(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.FETCHED, { category });
    } catch (error) {
      return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.CATEGORY.NOT_FOUND);
    }
  }
}

const categoryController = new CategoryController();
export default categoryController;
