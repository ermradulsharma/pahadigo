import categoryDocumentService from '@/services/CategoryDocumentService.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class CategoryDocumentController {
    async getAll(req) {
        try {
            // Next.js request url parsing
            const url = new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`);
            const category_slug = url.searchParams.get('category_slug');
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 10;

            const filter = {};
            if (category_slug) filter.category_slug = category_slug;

            const documents = await categoryDocumentService.getAll(filter, page, limit);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, documents);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async getById(req, { params }) {
        try {
            const { id } = await params;
            const document = await categoryDocumentService.getById(id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, document);
        } catch (error) {
            return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND, {});
        }
    }

    async create(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const document = await categoryDocumentService.create(body);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, document);
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, { error: error.message });
        }
    }

    async update(req, { params }) {
        try {
            const { id } = await params;
            const body = req.validData || req.jsonBody || await req.json();
            const document = await categoryDocumentService.update(id, body);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, document);
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, { error: error.message });
        }
    }

    async delete(req, { params }) {
        try {
            const { id } = await params;
            await categoryDocumentService.delete(id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, { error: error.message });
        }
    }
}

const categoryDocumentController = new CategoryDocumentController();
export default categoryDocumentController;
