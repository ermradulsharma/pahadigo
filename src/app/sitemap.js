import dbConnect from '@/core/Config/db.js';
import Package from '@/core/Models/Package.js';
import Category from '@/core/Models/Category.js';

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

        const [packages, categories] = await Promise.all([
            Package.find({ isPublished: true, isApproved: true }).select('_id updatedAt').lean(),
            Category.find({ isActive: true }).select('slug updatedAt').lean()
        ]);

        const packageRoutes = (packages || []).map((pkg) => ({
            url: `${baseUrl}/packages/${pkg._id}`,
            lastModified: pkg.updatedAt ? new Date(pkg.updatedAt).toISOString() : new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        const categoryRoutes = (categories || []).map((cat) => ({
            url: `${baseUrl}/categories/${cat.slug}`,
            lastModified: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        dynamicRoutes = [...packageRoutes, ...categoryRoutes];
    } catch (err) {
        // Fallback to static routes if DB connection is unavailable during build
    }

    return [...staticRoutes, ...dynamicRoutes];
}
