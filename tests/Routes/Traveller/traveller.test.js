import travellerRoutes from '@/routes/Traveller/traveller.js';

describe('Industry Standard: Traveller Routes Structure', () => {
    it('[Success] should export a non-empty array of routes', () => {
        expect(Array.isArray(travellerRoutes)).toBe(true);
        expect(travellerRoutes.length).toBeGreaterThan(0);
    });

    it('[Integrity] every route should have method, path, and handler', () => {
        travellerRoutes.forEach(route => {
            expect(route.method).toBeDefined();
            expect(route.path).toBeDefined();
            expect(typeof route.handler).toBe('function');
        });
    });

    it('[Integrity] all paths should start with /traveller', () => {
        travellerRoutes.forEach(route => {
            expect(route.path).toMatch(/^\/traveller/);
        });
    });

    it('[Security] all traveller routes should require auth middleware', () => {
        travellerRoutes.forEach(route => {
            expect(route.middleware).toBeDefined();
            expect(route.middleware).toContain('auth');
        });
    });

    it('[Security] all traveller routes should enforce traveller role', () => {
        travellerRoutes.forEach(route => {
            expect(route.roles).toBeDefined();
            expect(route.roles).toContain('traveller');
        });
    });
    it('[Validation] critical write routes should declare request schemas', () => {
        const schemaRoutes = [
            { method: 'PATCH', path: '/traveller/update' },
            { method: 'PUT', path: '/traveller/token' },
            { method: 'POST', path: '/traveller/booking/:id' },
            { method: 'PATCH', path: '/traveller/booking/:id/cancel' },
            { method: 'POST', path: '/traveller/booking/:id/dispute' },
            { method: 'POST', path: '/traveller/booking/payment/:id/verify' },
            { method: 'POST', path: '/traveller/:bookingId/review' },
            { method: 'POST', path: '/traveller/wishlist/:itemId' },
            { method: 'POST', path: '/traveller/payment/verify' },
            { method: 'PUT', path: '/traveller/profile/' }
        ];

        schemaRoutes.forEach(({ method, path }) => {
            const route = travellerRoutes.find(r => r.method === method && r.path === path);
            expect(route).toBeDefined();
            expect(route.schema).toBeDefined();
        });
    });
});
