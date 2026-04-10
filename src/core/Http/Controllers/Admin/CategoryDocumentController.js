import categoryDocumentService from '../../../Services/Admin/CategoryDocumentService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * CategoryDocumentController (Admin Role) - Handles document hierarchy and taxonomy for vendor verification.
 */
class CategoryDocumentController extends Controller {
    
    // GET /admin/category-documents
    async getAll(req) {
        try {
            const url = new URL(req.url);
            const category_slug = url.searchParams.get('category_slug');
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 10;

            const filter = {};
            if (category_slug) filter.category_slug = category_slug;

            const documents = await categoryDocumentService.getAll(filter, page, limit);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, documents);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/category-documents/:id
    async getById(req, { params }) {
        try {
            const document = await categoryDocumentService.getById(params.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, document);
        } catch (error) {
            return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);
        }
    }

    // POST /admin/category-documents
    async create(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const document = await categoryDocumentService.create(body);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, document);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    // PUT /admin/category-documents/:id
    async update(req, { params }) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const document = await categoryDocumentService.update(params.id, body);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, document);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    async delete(req, { params }) {
        try {
            await categoryDocumentService.delete(params.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }
}

const categoryDocumentController = new CategoryDocumentController();
export default categoryDocumentController;
