import router from '@/core/Routes/Traveller/wishlist.routes.js';

describe('Router: wishlist.routes.js', () => {
    it('should export a valid route definitions array', () => {
        expect(router).toBeDefined();
        expect(Array.isArray(router)).toBe(true);
        if (router.length > 0) {
            expect(router[0].method).toBeDefined();
            expect(router[0].path).toBeDefined();
        }
    });
});
