import CategoryService from '@/services/Vendor/CategoryService.js';
import { HTTP_STATUS } from '@/constants/index.js';
import Controller from '../Controller.js';

/**
 * CategoryController (Vendor Role) - Specialized management of
 * business-specific taxonomies and category verification documents.
 */
class CategoryController extends Controller {

  // GET /vendor/category/
  async getCategories(req) {
    try {
      const categories = await CategoryService.getAssignedCategories(req.user.id);
      return this.success(HTTP_STATUS.OK, "Vendor categories fetched", categories);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  // POST /vendor/category/
  async assignCategory(req) {
    try {
      const body = req.payload;
      const updatedVendor = await CategoryService.assignCategoryToVendor(req.user.id, body);
      return this.success(HTTP_STATUS.OK, "Category added successfully", updatedVendor.category);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // DELETE /vendor/category/:slug
  async removeCategory(req, { params }) {
    try {
      const slug = params.slug || req.payload.slug;
      const updatedVendor = await CategoryService.removeCategoryFromVendor(req.user.id, slug);
      return this.success(HTTP_STATUS.OK, "Category removed successfully", updatedVendor.category);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // GET /vendor/category/eligible (Retrieve unassigned categories for the vendor)
  async eligible(req) {
    try {
      const categories = await CategoryService.getEligibleCategories(req.user.id);
      return this.success(HTTP_STATUS.OK, "Eligible categories fetched", categories);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // GET /vendor/category/documents (Retrieve document requirements)
  async showDocuments(req, { params } = {}) {
    try {
      const slug = params.slug || (req.payload && (req.payload.slug || req.payload.category_slug));
      if (!slug) throw new Error("Category slug is required");

      const docs = await CategoryService.getDocuments(req.user.id, slug);
      return this.success(HTTP_STATUS.OK, "Category document requirements fetched", docs);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // POST /vendor/category/documents/upload
  async uploadDocuments(req, { params } = {}) {
    try {
      const slug = params.slug || (req.payload && (req.payload.slug || req.payload.category_slug));
      if (!slug) throw new Error("Category slug is required");
      const result = await CategoryService.uploadDocuments(req.user.id, slug, req);
      return this.success(HTTP_STATUS.OK, "Category documents uploaded successfully", result);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // GET /vendor/category/documents/uploaded (Retrieve all submitted compliance files for the vendor)
  async uploaded(req) {
    try {
      const docs = await CategoryService.getUploadedDocuments(req.user.id);
      return this.success(HTTP_STATUS.OK, "Vendor's profile-wide uploaded documents fetched", docs);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }
}

const categoryController = new CategoryController();
export default categoryController;
