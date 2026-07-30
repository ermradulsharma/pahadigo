import router from '@/core/Routes/Vendor/operations.routes.js';

describe('Router: operations.routes.js', () => {
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

