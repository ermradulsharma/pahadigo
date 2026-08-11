import { jest } from '@jest/globals';

const mockWithTransaction = jest.fn(async (cb) => { await cb(); });
const mockSession = { withTransaction: mockWithTransaction, endSession: jest.fn() };

jest.unstable_mockModule('mongoose', () => ({
    default: {
        startSession: jest.fn().mockResolvedValue(mockSession)
    }
}));

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

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    HTTP_STATUS: { NOT_FOUND: 404 }
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
    beforeEach(() => {
        jest.clearAllMocks();
    });

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
        it('should create a new blog and clear cache', async () => {
            mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }); // for generateUniqueSlug
            mockCreate.mockResolvedValue([{ _id: 'b1', title: 'Test', slug: 'test' }]);
            
            const result = await BlogService.createBlog({ title: 'Test', status: 'published' }, 'u1');
            expect(result._id).toBe('b1');
            expect(mockCreate).toHaveBeenCalled();
            expect(CacheService.delete).toHaveBeenCalledWith('blogs_list_recent');
        });
    });

    describe('getBlogs', () => {
        it('should return from cache for standard query', async () => {
            CacheService.get.mockResolvedValue({ cached: true });
            const result = await BlogService.getBlogs();
            expect(result.cached).toBe(true);
        });

        it('should fetch and cache for standard query if not in cache', async () => {
            CacheService.get.mockResolvedValue(null);
            mockFind.mockReturnValue(chainableMock([{ _id: 'b1' }]));
            mockCountDocuments.mockResolvedValue(1);

            const result = await BlogService.getBlogs();
            expect(result.docs.length).toBe(1);
            expect(CacheService.set).toHaveBeenCalledWith('blogs_list_recent', result, 600);
        });

        it('should fetch without cache for custom filters', async () => {
            mockFind.mockReturnValue(chainableMock([{ _id: 'b1' }]));
            mockCountDocuments.mockResolvedValue(1);

            const result = await BlogService.getBlogs({ status: 'published' });
            expect(result.docs.length).toBe(1);
            expect(CacheService.get).not.toHaveBeenCalled();
            expect(CacheService.set).not.toHaveBeenCalled();
        });
    });

    describe('getBlogById', () => {
        it('should return from cache', async () => {
            CacheService.get.mockResolvedValue({ _id: 'b1' });
            const result = await BlogService.getBlogById('b1');
            expect(result._id).toBe('b1');
        });

        it('should fetch and cache if not in cache', async () => {
            CacheService.get.mockResolvedValue(null);
            mockFindById.mockReturnValue(chainableMock({ _id: 'b1' }));
            
            const result = await BlogService.getBlogById('b1');
            expect(result._id).toBe('b1');
            expect(CacheService.set).toHaveBeenCalledWith('blog_b1', { _id: 'b1' }, 3600);
        });

        it('should throw if not found', async () => {
            CacheService.get.mockResolvedValue(null);
            mockFindById.mockReturnValue(chainableMock(null));
            await expect(BlogService.getBlogById('b1')).rejects.toThrow('Blog not found');
        });
    });

    describe('updateBlog', () => {
        it('should update blog, generate new slug if title changed, and clear caches', async () => {
            const mockSave = jest.fn();
            const mockBlog = { _id: 'b1', title: 'Old Title', status: 'draft', save: mockSave };
            mockFindById.mockReturnValue(chainableMock(mockBlog));
            mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }); // for slug

            await BlogService.updateBlog('b1', { title: 'New Title', status: 'published' });
            
            expect(mockSave).toHaveBeenCalled();
            expect(mockBlog.slug).toBe('new-title');
            expect(mockBlog.publishedAt).toBeDefined();
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
