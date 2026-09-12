export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pahadigo.co.in';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/checkout/payment-status', '/private/'],
            },
            {
                userAgent: 'GPTBot',
                allow: ['/', '/packages', '/destinations', '/faq', '/blog', '/llms.txt', '/llms-full.txt', '/api/v1/raw-markdown'],
                disallow: ['/admin/'],
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
            },
            {
                userAgent: 'PerplexityBot',
                allow: '/',
            },
            {
                userAgent: 'Google-Extended',
                allow: '/',
            },
            {
                userAgent: 'ClaudeBot',
                allow: '/',
            },
            {
                userAgent: 'Bytespider',
                allow: '/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
