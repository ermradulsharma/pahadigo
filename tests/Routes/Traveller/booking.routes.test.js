import router from '@/core/Routes/Traveller/booking.routes.js';

describe('Router: booking.routes.js', () => {
    it('should export a valid route definitions array', () => {
        expect(router).toBeDefined();
        expect(Array.isArray(router)).toBe(true);
        if (router.length > 0) {
            expect(router[0].method).toBeDefined();
            expect(router[0].path).toBeDefined();
        }
    });
});
