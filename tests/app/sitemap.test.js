import { jest } from '@jest/globals';

const mockDbConnect = jest.fn().mockResolvedValue(true);
const mockPackageFind = jest.fn();
const mockCategoryFind = jest.fn();
const mockBlogFind = jest.fn();

jest.unstable_mockModule('@/core/Config/db.js', () => ({
    default: mockDbConnect
}));

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: {
        find: mockPackageFind
    }
}));

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        find: mockCategoryFind
    }
}));

jest.unstable_mockModule('@/core/Models/Blog.js', () => ({
    default: {
        find: mockBlogFind
    }
}));

const { default: sitemap } = await import('@/app/sitemap.js');

describe('Next.js App: sitemap.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should generate static routes and dynamic routes for packages, categories, and blogs', async () => {
        mockPackageFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                {
                    homestay: [
                        { _id: 'hs_1', isPublished: true, isActive: true, updatedAt: new Date() }
                    ],
                    trekking: [
                        { _id: 'trk_1', isPublished: false } // Unpublished item should be excluded
                    ]
                }
            ])
        });

        mockCategoryFind.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                    { slug: 'homestay', updatedAt: new Date() }
                ])
            })
        });

        mockBlogFind.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                    { slug: 'best-places-in-manali', updatedAt: new Date(), publishedAt: new Date() }
                ])
            })
        });

        const entries = await sitemap();
        expect(Array.isArray(entries)).toBe(true);

        const urls = entries.map((e) => e.url);

        // Verify static routes
        expect(urls).toContain('https://pahadigo.co.in');
        expect(urls).toContain('https://pahadigo.co.in/packages');
        expect(urls).toContain('https://pahadigo.co.in/about');

        // Verify dynamic routes
        expect(urls).toContain('https://pahadigo.co.in/packages/hs_1');
        expect(urls).not.toContain('https://pahadigo.co.in/packages/trk_1');
        expect(urls).toContain('https://pahadigo.co.in/categories/homestay');
        expect(urls).toContain('https://pahadigo.co.in/blog/best-places-in-manali');
    });

    it('should fallback gracefully to static routes when database query throws', async () => {
        mockPackageFind.mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB Connection Timeout'))
        });

        const entries = await sitemap();
        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBeGreaterThanOrEqual(11); // Static routes
    });
});

