import robots from '@/app/robots.js';

describe('Next.js App: robots.js', () => {
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

    afterEach(() => {
        if (originalEnv) {
            process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
        } else {
            delete process.env.NEXT_PUBLIC_SITE_URL;
        }
    });

    it('should generate valid robots configuration with rules and sitemap', () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://pahadigo.co.in';

        const config = robots();
        expect(config).toBeDefined();
        expect(config.sitemap).toBe('https://pahadigo.co.in/sitemap.xml');
        expect(Array.isArray(config.rules)).toBe(true);

        // Check default userAgent rule
        const defaultRule = config.rules.find((r) => r.userAgent === '*');
        expect(defaultRule).toBeDefined();
        expect(defaultRule.allow).toBe('/');
        expect(defaultRule.disallow).toContain('/admin/');
        expect(defaultRule.disallow).toContain('/api/');

        // Check LLM bot permissions (GPTBot, ClaudeBot, etc.)
        const gptBot = config.rules.find((r) => r.userAgent === 'GPTBot');
        expect(gptBot).toBeDefined();
        expect(gptBot.allow).toContain('/llms.txt');
        expect(gptBot.allow).toContain('/llms-full.txt');
        expect(gptBot.disallow).toContain('/admin/');

        const claudeBot = config.rules.find((r) => r.userAgent === 'ClaudeBot');
        expect(claudeBot).toBeDefined();
        expect(claudeBot.allow).toBe('/');
    });

    it('should fallback to default site URL when environment variable is not defined', () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;

        const config = robots();
        expect(config.sitemap).toBe('https://pahadigo.co.in/sitemap.xml');
    });
});

