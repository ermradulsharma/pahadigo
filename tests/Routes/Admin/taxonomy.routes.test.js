import router from '@/core/Routes/Admin/taxonomy.routes.js';

describe('Router: taxonomy.routes.js', () => {
    it('should export a valid express router', () => {
        expect(router).toBeDefined();
        // The routes export an array of route definitions
        expect(Array.isArray(router)).toBe(true);
        if (router.length > 0) {
            expect(router[0].method).toBeDefined();
            expect(router[0].path).toBeDefined();
        }
    });
});

