import BlogService from '@/core/Services/Admin/BlogService.js';
import Controller from '@/core/Controllers/Controller.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { validate, schemas } from '@/core/Helpers/validation.js';

class BlogController extends Controller {
    async getBlogs(req) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const filters = {};
            if (req.query.status) filters.status = req.query.status;
            if (req.query.search) filters.$text = { $search: req.query.search };

            const result = await BlogService.getBlogs(filters, page, limit);
            return this.success(HTTP_STATUS.OK, 'Blogs retrieved successfully', result);
        } catch (error) {
            return this.error(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async getBlog(req) {
        try {
            const { id } = req.params;
            const blog = await BlogService.getBlogById(id);
            return this.success(HTTP_STATUS.OK, 'Blog retrieved successfully', blog);
        } catch (error) {
            return this.error(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async createBlog(req) {
        try {
            const rawData = req.payload || req.body || await req.json();
            const { success, data, error } = validate(schemas.blog, rawData);
            if (!success) {
                return this.error(HTTP_STATUS.BAD_REQUEST, error);
            }
            
            const authorId = req.user ? req.user._id : null; 
            const blog = await BlogService.createBlog(data, authorId);
            return this.success(HTTP_STATUS.CREATED, 'Blog created successfully', blog);
        } catch (error) {
            return this.error(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async updateBlog(req) {
        try {
            const { id } = req.params;
            const rawData = req.payload || req.body || await req.json();
            const { success, data, error } = validate(schemas.blog, rawData);
            if (!success) {
                return this.error(HTTP_STATUS.BAD_REQUEST, error);
            }

            const blog = await BlogService.updateBlog(id, data);
            return this.success(HTTP_STATUS.OK, 'Blog updated successfully', blog);
        } catch (error) {
            return this.error(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async deleteBlog(req) {
        try {
            const { id } = req.params;
            await BlogService.deleteBlog(id);
            return this.success(HTTP_STATUS.OK, 'Blog deleted successfully', null);
        } catch (error) {
            return this.error(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const blogController = new BlogController();
export default blogController;
