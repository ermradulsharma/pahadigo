import CategoryService from '@/services/Vendor/CategoryService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * CategoryController (Vendor Role) - Specialized management of
 * business-specific taxonomies and category verification documents.
 */
class CategoryController extends Controller {

  // GET /vendor/category/
  async getCategories(req) {
    try {
      const categories = await CategoryService.getAssignedCategories(req.user.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.CATEGORIES_FETCHED, categories);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  // POST /vendor/category/
  async assignCategory(req) {
    try {
      const body = req.payload;
      const updatedVendor = await CategoryService.assignCategoryToVendor(req.user.id, body);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.ADDED, updatedVendor.category);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // DELETE /vendor/category/:slug
  async removeCategory(req, { params }) {
    try {
      const slug = params.slug || req.payload.slug;
      const updatedVendor = await CategoryService.removeCategoryFromVendor(req.user.id, slug);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.REMOVED, updatedVendor.category);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // GET /vendor/category/eligible (Retrieve unassigned categories for the vendor)
  async getEligibleCategories(req) {
    try {
      const categories = await CategoryService.getEligibleCategories(req.user.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.ELIGIBLE_CATEGORIES_FETCHED, categories);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // GET /vendor/category/documents (Retrieve document requirements)
  async getCategoryDocuments(req, { params } = {}) {
    try {
      const slug = params.slug || (req.payload && (req.payload.slug || req.payload.category_slug));
      if (!slug) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

      const docs = await CategoryService.getDocuments(req.user.id, slug);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.CATEGORY_DOCS_FETCHED, docs);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // GET /vendor/category/requirements/:slug (Fetch documents without assignment check)
  async getCategoryRequirements(req, { params }) {
    try {
      const slug = params.slug;
      if (!slug) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

      const docs = await CategoryService.getRequirementsBySlug(slug);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.CATEGORY_DOCS_LIST_FETCHED, docs);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // POST /vendor/category/documents/upload
  async uploadDocuments(req, { params } = {}) {
    try {
      const slug = params.slug || (req.payload && (req.payload.slug || req.payload.category_slug));
      if (!slug) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
      const result = await CategoryService.uploadDocuments(req.user.id, slug, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.CATEGORY_DOCS_UPLOADED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // GET /vendor/category/documents/uploaded (Retrieve all submitted compliance files for the vendor)
  async getUploadedDocuments(req) {
    try {
      const docs = await CategoryService.getUploadedDocuments(req.user.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.CATEGORY_DOCS_ALL_FETCHED, docs);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }
}

const categoryController = new CategoryController();
export default categoryController;
