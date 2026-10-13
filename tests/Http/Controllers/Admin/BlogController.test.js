import { jest } from '@jest/globals';

const mockBlogService = {
    getBlogs: jest.fn(),
    getBlogById: jest.fn(),
    createBlog: jest.fn(),
    updateBlog: jest.fn(),
    deleteBlog: jest.fn()
};

jest.unstable_mockModule('@/core/Services/Admin/BlogService.js', () => ({
    default: mockBlogService
}));

const { default: BlogController } = await import('@/core/Http/Controllers/Admin/BlogController.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: Admin BlogController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            query: {},
            params: {},
            payload: {},
            user: { _id: 'admin_user_id' }
        };
    });

    it('[getBlogs] should retrieve paginated list of blogs', async () => {
        mockBlogService.getBlogs.mockResolvedValue({ blogs: [{ title: 'Best Treks' }], total: 1 });
        mockReq.query = { page: '1', limit: '10', status: 'published', search: 'Treks' };

        const res = await BlogController.getBlogs(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockBlogService.getBlogs).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'published', $text: { $search: 'Treks' } }),
            1,
            10
        );
    });

    it('[getBlog] should retrieve single blog by ID', async () => {
        mockBlogService.getBlogById.mockResolvedValue({ _id: 'blog_1', title: 'Kedarkantha' });
        mockReq.params = { id: 'blog_1' };

        const res = await BlogController.getBlog(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockBlogService.getBlogById).toHaveBeenCalledWith('blog_1');
    });

    it('[createBlog] should reject invalid payload with BAD_REQUEST', async () => {
        mockReq.payload = {}; // missing required title, slug, content
        const res = await BlogController.createBlog(mockReq);
        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('[createBlog] should create blog successfully when payload is valid', async () => {
        mockReq.payload = {
            title: 'Himalayan Guide',
            slug: 'himalayan-guide',
            content: 'Detailed description of the routes and mountain trails.',
            status: 'draft'
        };
        mockBlogService.createBlog.mockResolvedValue({ _id: 'blog_new', ...mockReq.payload });

        const res = await BlogController.createBlog(mockReq);
        expect(res.status).toBe(HTTP_STATUS.CREATED);
        expect(mockBlogService.createBlog).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Himalayan Guide' }),
            'admin_user_id'
        );
    });

    it('[updateBlog] should update blog when valid', async () => {
        mockReq.params = { id: 'blog_1' };
        mockReq.payload = {
            title: 'Updated Title',
            slug: 'updated-title',
            content: 'Updated content body for testing purposes.'
        };
        mockBlogService.updateBlog.mockResolvedValue({ _id: 'blog_1', title: 'Updated Title' });

        const res = await BlogController.updateBlog(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockBlogService.updateBlog).toHaveBeenCalledWith('blog_1', expect.anything());
    });

    it('[deleteBlog] should delete blog and return success', async () => {
        mockReq.params = { id: 'blog_1' };
        mockBlogService.deleteBlog.mockResolvedValue(true);

        const res = await BlogController.deleteBlog(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockBlogService.deleteBlog).toHaveBeenCalledWith('blog_1');
    });
});
