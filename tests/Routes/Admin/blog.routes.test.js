import router from '@/core/Routes/Admin/blog.routes.js';

describe('Router: blog.routes.js', () => {
    it('should export a valid array of route definitions', () => {
        expect(router).toBeDefined();
        expect(Array.isArray(router)).toBe(true);
        expect(router.length).toBeGreaterThan(0);
    });

    it('should define GET, POST, PUT, DELETE endpoints for blogs', () => {
        const methods = router.map(r => r.method);
        expect(methods).toContain('GET');
        expect(methods).toContain('POST');
        expect(methods).toContain('PUT');
        expect(methods).toContain('DELETE');
    });

    it('should have valid path and handler for each route', () => {
        router.forEach(route => {
            expect(route.path).toBeDefined();
            expect(typeof route.handler).toBe('function');
        });
    });
});
