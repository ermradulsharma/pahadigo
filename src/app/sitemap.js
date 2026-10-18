import dbConnect from '@/core/Config/db.js';
import Package from '@/core/Models/Package.js';
import Category from '@/core/Models/Category.js';
import Blog from '@/core/Models/Blog.js';
import { SCHEMA_KEYS } from '@/core/Constants/categories.js';

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pahadigo.co.in';

    // Core Static Routes
    const staticRoutes = [
        '',
        '/about',
        '/destinations',
        '/packages',
        '/faq',
        '/blog',
        '/contact',
        '/careers',
        '/partner',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: route === '' || route === '/packages' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : route === '/packages' || route === '/destinations' ? 0.9 : 0.7,
    }));

    let dynamicRoutes = [];

    try {
        await dbConnect();

        const [packageCatalogs, categories, blogs] = await Promise.all([
            Package.find({}).lean(),
            Category.find({ isActive: true }).select('slug updatedAt').lean(),
            Blog.find({ status: 'published' }).select('slug updatedAt publishedAt').lean()
        ]);

        const packageRoutes = [];
        const schemaKeyList = Object.values(SCHEMA_KEYS);

        (packageCatalogs || []).forEach((catalog) => {
            schemaKeyList.forEach((schemaKey) => {
                const items = catalog[schemaKey];
                if (Array.isArray(items)) {
                    items.forEach((item) => {
                        if (item && item._id && item.isPublished !== false && item.isActive !== false) {
                            packageRoutes.push({
                                url: `${baseUrl}/packages/${item._id}`,
                                lastModified: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
                                changeFrequency: 'weekly',
                                priority: 0.8,
                            });
                        }
                    });
                }
            });
        });

        const categoryRoutes = (categories || []).map((cat) => ({
            url: `${baseUrl}/categories/${cat.slug}`,
            lastModified: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        const blogRoutes = (blogs || []).map((b) => ({
            url: `${baseUrl}/blog/${b.slug}`,
            lastModified: b.updatedAt ? new Date(b.updatedAt).toISOString() : (b.publishedAt ? new Date(b.publishedAt).toISOString() : new Date().toISOString()),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        dynamicRoutes = [...packageRoutes, ...categoryRoutes, ...blogRoutes];
    } catch (err) {
        // Fallback to static routes if DB connection is unavailable during build
    }

    return [...staticRoutes, ...dynamicRoutes];
}
