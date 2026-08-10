import categoryDocumentService from '@/core/Services/Admin/CategoryDocumentService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const categoryDocCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category_slug: z.string().min(2),
  isRequired: z.boolean().optional(),
  fileTypes: z.array(z.string()).optional()
});

const categoryDocUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  category_slug: z.string().min(2).optional(),
  isRequired: z.boolean().optional(),
  fileTypes: z.array(z.string()).optional()
});

/**
 * CategoryDocumentController (Admin Role) - Handles document hierarchy and taxonomy for vendor verification.
 */
class CategoryDocumentController extends Controller {

  // GET /admin/category-documents
  async getAll(req) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost';
      const url = new URL(req.url, baseUrl);
      const category_slug = url.searchParams.get('category_slug');
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 10;

      const filter = {};
      if (category_slug) filter.category_slug = category_slug;

      const documents = await categoryDocumentService.getAll(filter, page, limit);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, documents);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/category-documents/:id
  async getById(req, { params }) {
    try {
      const document = await categoryDocumentService.getById(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, document);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND);
    }
  }

  // POST /admin/category-documents
  async create(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(categoryDocCreateSchema, rawBody);
      
      if (!success) {
          throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      }

      const document = await categoryDocumentService.create(data);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, document);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  // PUT /admin/category-documents/:id
  async update(req, { params }) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(categoryDocUpdateSchema, rawBody);
      
      if (!success) {
          throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      }

      const document = await categoryDocumentService.update(params.id, data);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, document);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }

  async delete(req, { params }) {
    try {
      await categoryDocumentService.delete(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
    }
  }
}

const categoryDocumentController = new CategoryDocumentController();
export default categoryDocumentController;
