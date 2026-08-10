import mongoose from 'mongoose';
import Blog from '@/core/Models/Blog.js';
import AppError from '@/core/Helpers/AppError.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import CacheService from '@/core/Services/CacheService.js';

class BlogService {
    /**
     * Generate a unique slug for a blog
     */
    async generateUniqueSlug(title, excludeId = null, session = null) {
        let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
            const query = { slug };
            if (excludeId) query._id = { $ne: excludeId };
            const existing = await Blog.findOne(query, null, { session }).lean();
            if (!existing) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }

    /**
     * Helper to clear relevant blog caches
     */
    async invalidateCaches(id = null) {
        // Simple invalidation strategy for list (could be optimized with tags/patterns in a real robust Redis setup)
        // Since we are using standard Upstash REST Client, wildcards are tricky without scan, so we invalidate known fixed keys
        await CacheService.delete('blogs_list_recent');
        if (id) {
            await CacheService.delete(`blog_${id}`);
        }
    }

    /**
     * Create a new blog
     */
    async createBlog(data, authorId) {
        const session = await mongoose.startSession();
        try {
            let createdBlog = null;
            await session.withTransaction(async () => {
                const slug = await this.generateUniqueSlug(data.title, null, session);
                const blogData = {
                    ...data,
                    slug,
                    author: authorId,
                };
                if (data.status === 'published') {
                    blogData.publishedAt = new Date();
                }
                const [blog] = await Blog.create([blogData], { session });
                createdBlog = blog;
            });
            await this.invalidateCaches();
            return createdBlog;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Get all blogs (with pagination & caching for standard requests)
     */
    async getBlogs(filters = {}, page = 1, limit = 20) {
        const isStandardQuery = Object.keys(filters).length === 0 && page === 1 && limit === 20;
        const cacheKey = 'blogs_list_recent';

        if (isStandardQuery) {
            const cached = await CacheService.get(cacheKey);
            if (cached) return cached;
        }

        const skip = (page - 1) * limit;
        const [docs, total] = await Promise.all([
            Blog.find(filters).populate('author', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Blog.countDocuments(filters)
        ]);
        
        const result = { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
        
        if (isStandardQuery) {
            await CacheService.set(cacheKey, result, 600); // Cache for 10 minutes
        }
        
        return result;
    }

    /**
     * Get blog by ID (Cache-Aside pattern)
     */
    async getBlogById(id) {
        const cacheKey = `blog_${id}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const blog = await Blog.findById(id).populate('author', 'name email').lean();
        if (!blog) throw new AppError('Blog not found', HTTP_STATUS.NOT_FOUND);

        await CacheService.set(cacheKey, blog, 3600); // Cache for 1 hour
        return blog;
    }

    /**
     * Update a blog
     */
    async updateBlog(id, data) {
        const session = await mongoose.startSession();
        try {
            let updatedBlog = null;
            await session.withTransaction(async () => {
                const blog = await Blog.findById(id).session(session);
                if (!blog) throw new AppError('Blog not found', HTTP_STATUS.NOT_FOUND);

                if (data.title && data.title !== blog.title) {
                    data.slug = await this.generateUniqueSlug(data.title, id, session);
                }

                if (data.status === 'published' && blog.status !== 'published') {
                    data.publishedAt = new Date();
                }

                Object.assign(blog, data);
                await blog.save({ session });
                updatedBlog = blog;
            });
            await this.invalidateCaches(id);
            return updatedBlog;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Delete a blog
     */
    async deleteBlog(id) {
        const session = await mongoose.startSession();
        try {
            let deletedBlog = null;
            await session.withTransaction(async () => {
                const blog = await Blog.findByIdAndDelete(id).session(session);
                if (!blog) throw new AppError('Blog not found', HTTP_STATUS.NOT_FOUND);
                deletedBlog = blog;
            });
            await this.invalidateCaches(id);
            return deletedBlog;
        } finally {
            await session.endSession();
        }
    }
}

export default new BlogService();
