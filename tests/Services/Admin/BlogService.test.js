import { jest } from '@jest/globals';

import mongoose from 'mongoose';

const mockWithTransaction = jest.fn(async (cb) => { await cb(); });
const mockSession = { withTransaction: mockWithTransaction, endSession: jest.fn() };
mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.unstable_mockModule('@/core/Models/Blog.js', () => ({
    default: {
        findOne: mockFindOne,
        create: mockCreate,
        find: mockFind,
        countDocuments: mockCountDocuments,
        findById: mockFindById,
        findByIdAndDelete: mockFindByIdAndDelete
    }
}));

jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {
        constructor(msg, code) { super(msg); this.code = code; }
    }
}));

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
    }
}));

const { default: BlogService } = await import('@/core/Services/Admin/BlogService.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');

describe('BlogService', () => {
    const chainableMock = (data) => {
        const mock = {};
        mock.populate = jest.fn().mockReturnValue(mock);
        mock.sort = jest.fn().mockReturnValue(mock);
        mock.skip = jest.fn().mockReturnValue(mock);
        mock.limit = jest.fn().mockReturnValue(mock);
        mock.lean = jest.fn().mockResolvedValue(data);
        mock.session = jest.fn().mockResolvedValue(data);
        return mock;
    };

    describe('generateUniqueSlug', () => {
        it('should generate a base slug if no existing blog', async () => {
            mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            const result = await BlogService.generateUniqueSlug('Hello World!');
            expect(result).toBe('hello-world');
        });

        it('should increment slug counter if exists', async () => {
            mockFindOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue({ _id: '1' }) })
                       .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
            
            const result = await BlogService.generateUniqueSlug('Hello World!');
            expect(result).toBe('hello-world-1');
        });
    });

    describe('createBlog', () => {
        it('should create blog and invalidate cache', async () => {
            mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            mockCreate.mockResolvedValue([{ _id: 'b1', title: 'New Blog' }]);

            const result = await BlogService.createBlog({ title: 'New Blog' }, 'user1');
            expect(result._id).toBe('b1');
            expect(CacheService.delete).toHaveBeenCalledWith('blogs_list_recent');
        });
    });

    describe('getBlogs', () => {
        it('should return cached blogs if present', async () => {
            CacheService.get.mockResolvedValueOnce({ docs: [{ _id: '1' }], total: 1 });
            const result = await BlogService.getBlogs();
            expect(result.docs).toHaveLength(1);
            expect(mockFind).not.toHaveBeenCalled();
        });

        it('should fetch from DB, set cache and return if no cache', async () => {
            CacheService.get.mockResolvedValueOnce(null);
            mockFind.mockReturnValue(chainableMock([{ _id: '1' }]));
            mockCountDocuments.mockResolvedValue(1);

            const result = await BlogService.getBlogs();
            expect(result.docs).toHaveLength(1);
            expect(CacheService.set).toHaveBeenCalled();
        });
    });

    describe('getBlogById', () => {
        it('should return cached blog', async () => {
            CacheService.get.mockResolvedValueOnce({ _id: 'b1' });
            const result = await BlogService.getBlogById('b1');
            expect(result._id).toBe('b1');
            expect(mockFindById).not.toHaveBeenCalled();
        });

        it('should fetch from db and cache if not in cache', async () => {
            CacheService.get.mockResolvedValueOnce(null);
            mockFindById.mockReturnValue(chainableMock({ _id: 'b1' }));

            const result = await BlogService.getBlogById('b1');
            expect(result._id).toBe('b1');
            expect(CacheService.set).toHaveBeenCalled();
        });

        it('should throw if blog not found', async () => {
            CacheService.get.mockResolvedValueOnce(null);
            mockFindById.mockReturnValue(chainableMock(null));

            await expect(BlogService.getBlogById('b1')).rejects.toThrow('Blog not found');
        });
    });

    describe('updateBlog', () => {
        it('should update blog, handle new slug if title changes and clear cache', async () => {
            const blogMock = {
                _id: 'b1',
                title: 'Old Title',
                slug: 'old-title',
                save: jest.fn().mockResolvedValue(true)
            };
            mockFindById.mockReturnValue(chainableMock(blogMock));
            mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

            const result = await BlogService.updateBlog('b1', { title: 'New Title' }, 'user1');
            expect(blogMock.slug).toBe('new-title');
            expect(CacheService.delete).toHaveBeenCalledWith('blogs_list_recent');
            expect(CacheService.delete).toHaveBeenCalledWith('blog_b1');
        });

        it('should throw if blog not found', async () => {
            mockFindById.mockReturnValue(chainableMock(null));
            await expect(BlogService.updateBlog('b1', {})).rejects.toThrow('Blog not found');
        });
    });

    describe('deleteBlog', () => {
        it('should delete blog and clear caches', async () => {
            mockFindByIdAndDelete.mockReturnValue(chainableMock({ _id: 'b1' }));
            const result = await BlogService.deleteBlog('b1');
            expect(result._id).toBe('b1');
            expect(CacheService.delete).toHaveBeenCalledWith('blogs_list_recent');
            expect(CacheService.delete).toHaveBeenCalledWith('blog_b1');
        });

        it('should throw if blog not found', async () => {
            mockFindByIdAndDelete.mockReturnValue(chainableMock(null));
            await expect(BlogService.deleteBlog('b1')).rejects.toThrow('Blog not found');
        });
    });
});
