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

    return [...staticRoutes];
}
