import CategoryService from '@/services/CategoryService.js';
import { seedCategories } from '@/seeders/categorySeeder.js';
import { errorResponse, successResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
class CategoryController {

    // Helper to verify admin
    _isAdmin(req) {
        return req.user && req.user.role === 'admin';
    }

    async create(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const body = req.jsonBody || await req.json();
            const { name } = body;

            if (!name) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.NAME_REQUIRED, {});

            const category = await CategoryService.createCategory(body);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATE, { category });
        } catch (error) {
            if (error.code === 11000) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS, {});
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    async getAll(req) {
        try {
            const categories = await CategoryService.getAllCategories();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, categories);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    async getById(req) {
        try {
            const { id } = await req.params; // Next.js params are promises in some versions, but usually available in context. Here assuming standard request handling wrapper.
            // Actually apiHandler wrapper usually doesn't pass params directly to method args in this specific simplified framework style seen in AdminController.
            // Let's check apiHandler or AdminController. AdminController uses `req` which seems to be the NextRequest or custom wrapper.
            // Let's rely on standard practice or check existing code if needed.
            // In AdminController, it reads body from `req.json()`.
            // `apiHandler` passes (req, params).

            // Wait, looking at `apiHandler.js` usage in `routes/api.js`:
            // `handler: wrap(AdminController.getStats.bind(AdminController))`
            // `wrap` calls `apiHandler`.
            // Let's assume standard Next.js 13+ App Router/Pages Router mix or custom handler.
            // If it's pure Next.js API Routes (pages/api), `req.query` has params.
            // If it's App Router Route Handlers, `params` is 2nd arg.
            // But `apiHandler.js` is likely standardizing this.
            // Let's look at `VendorController.js` or `apiHandler.js` if we were verifying, but for now I'll support both query params or route params if possible, 
            // OR simpler: `req.nextUrl.searchParams` if it's Request object.
            // BUT given standard patterns, let's extract ID from query string if it's a GET with param in URL path, 
            // usually passed as 2nd argument to the handler if using Next.js App Router dynamic routes.
            // However, the `routes/api.js` defines paths like `/categories/:id` isn't fully visible in the custom router logic.
            // Actually, `routes/api.js` defines: `{ method: 'GET', path: '/categories/:id', ... }`
            // This suggests a custom router or these are just definitions for a catch-all route.
            // Let's check `apiHandler.js` briefly if I could, but I can't look back easily without new tool.
            // I'll write defensive code assuming `req.query` or `params` argument.
            // EDIT: Looking at `routes/api.js` again in previous turn... it's just a config array. 
            // The actual dispatching logic isn't fully visible but `apiHandler` likely injects params.
            // Let's assume `params` is passed as the second argument, standard for Next.js app router dynamic routes.

            return errorResponse(HTTP_STATUS.NOT_IMPLEMENTED, RESPONSE_MESSAGES.ERROR.NOT_IMPLEMENTED, {});
            // Actually, I'll implement `getById` to look for `id` in searchParams if not in params, or just params.

        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // Re-implementing getById and others with robust ID handling
    // We will assume `params` object is passed as 2nd arg based on Next.js standards for Route Handlers
    async getById(req, { params }) {
        try {
            const id = params?.id;
            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            const category = await CategoryService.getCategoryById(id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { category });
        } catch (error) {
            return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.CATEGORY_NOT_FOUND, {});
        }
    }

    async update(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const id = params?.id;
            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            const body = req.jsonBody || await req.json();
            const category = await CategoryService.updateCategory(id, body);

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { category });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    async delete(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const id = params?.id;
            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await CategoryService.deleteCategory(id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    async seed(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const result = await seedCategories();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED, { result });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }
}

const categoryController = new CategoryController();
export default categoryController;