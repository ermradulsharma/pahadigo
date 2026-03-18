import CategoryService from '@/services/CategoryService.js';
import { seedCategories } from '@/seeders/categorySeeder.js';
import { errorResponse, successResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
class CategoryController {

    async create(req) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'Unauthorized error', {});
            }
            const body = req.jsonBody || await req.json();
            const { name } = body;

            if (!name) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.NAME_REQUIRED, {});

            const category = await CategoryService.createCategory(body);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.CATEGORY.CREATED, { category });
        } catch (error) {
            if (error.code === 11000) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS, {});
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async getAll(req) {
        try {
            const categories = await CategoryService.getAllCategories();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.FETCHED, { categories });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // Standardized Route Handlers (using params from 2nd arg)
    async getById(req, { params }) {
        try {
            const id = params?.id;
            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            const category = await CategoryService.getCategoryById(id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.FETCHED, { category });
        } catch (error) {
            return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.CATEGORY_NOT_FOUND, {});
        }
    }

    async update(req, { params }) {
        try {
            const id = params?.id;
            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            const body = req.jsonBody || await req.json();
            const category = await CategoryService.updateCategory(id, body);

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.UPDATED, { category });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async delete(req, { params }) {
        try {
            const id = params?.id;
            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await CategoryService.deleteCategory(id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.DELETED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async seed(req) {
        try {
            const result = await seedCategories();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED, { result });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const categoryController = new CategoryController();
export default categoryController;